import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { secretManager } from './secretManager.ts';
import { auditLogger } from './auditLog.ts';

const configuredJwtSecret = secretManager.getSecret('JWT_SECRET');
if (process.env.NODE_ENV === 'production' && (!configuredJwtSecret || configuredJwtSecret.length < 32)) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters in production.');
}
// Development-only ephemeral secret: tokens are intentionally invalidated on restart.
const JWT_SECRET = configuredJwtSecret || crypto.randomBytes(32).toString('hex');

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  exp: number;
}

// In-memory store for active refresh tokens and token rotation tracking
const activeRefreshTokens = new Map<string, { userId: string; expiresAt: number }>();

// Rate limit store: IP/User -> { count, resetTime }
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Generate HMAC SHA-256 JWT
 */
export function generateToken(user: { id: string; email: string; role: string }, type: 'access' | 'refresh' = 'access'): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  // Access tokens: 30 minutes (1800s); Refresh tokens: 7 days
  const expiresIn = type === 'access' ? 30 * 60 : 7 * 24 * 60 * 60;
  const exp = Math.floor(Date.now() / 1000) + expiresIn;

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    type,
    exp,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${header}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64url');

  const token = `${header}.${encodedPayload}.${signature}`;

  if (type === 'refresh') {
    const now = Date.now();
    for (const [existingToken, entry] of activeRefreshTokens) {
      if (entry.expiresAt <= now) activeRefreshTokens.delete(existingToken);
    }
    activeRefreshTokens.set(token, { userId: user.id, expiresAt: exp * 1000 });
  }

  return token;
}

/** Consume a refresh token once so rotation cannot be replayed on this process. */
export function consumeRefreshToken(token: string, payload: TokenPayload): boolean {
  const active = activeRefreshTokens.get(token);
  if (!active || active.expiresAt <= Date.now() || active.userId !== payload.userId) return false;
  activeRefreshTokens.delete(token);
  return true;
}

/**
 * Verify JWT with strict checks (reject alg: none, verify signature and expiration)
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());

    // Reject alg: none or unsupported algorithms
    if (!header || header.alg !== 'HS256') {
      return null;
    }

    const signatureInput = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(signatureInput)
      .digest('base64url');

    const actual = Buffer.from(signatureB64);
    const expected = Buffer.from(expectedSignature);
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
      return null;
    }

    const payload: TokenPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (!payload || typeof payload.userId !== 'string' || typeof payload.email !== 'string' ||
        typeof payload.role !== 'string' || !['access', 'refresh'].includes(payload.type) ||
        !Number.isInteger(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Allowlisted HTTP methods middleware
 */
export function allowlistedMethods(req: Request, res: Response, next: NextFunction) {
  const allowed = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'];
  if (!allowed.includes(req.method)) {
    auditLogger.log({
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'DENIED',
      details: `HTTP method ${req.method} is not allowlisted`,
    });
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
  next();
}

/**
 * Rate Limiting Middleware
 */
export function rateLimiter(isStrictAuthEndpoint: boolean = false) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown_ip';
    const key = `${ip}_${isStrictAuthEndpoint ? 'strict' : 'general'}`;
    const now = Date.now();

    // Limits: General = 120 reqs per 15 min; Stricter auth/login = 10 reqs per 15 min
    const windowMs = 15 * 60 * 1000;
    const maxRequests = isStrictAuthEndpoint ? 10 : 120;

    let record = rateLimitStore.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimitStore.set(key, record);
    } else {
      record.count++;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      auditLogger.log({
        ipAddress: ip,
        method: req.method,
        path: req.path,
        action: 'DENIED',
        details: `Rate limit exceeded (${isStrictAuthEndpoint ? 'strict auth' : 'general'})`,
      });
      return res.status(429).json({ success: false, error: 'Too Many Requests. Please try again later.' });
    }

    next();
  };
}

/**
 * Authentication and Function/Object Level Authorization Middleware
 */
export function requireAuth(allowedRoles?: string[]) {
  return (req: Request & { user?: TokenPayload }, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      auditLogger.log({
        ipAddress: ip,
        method: req.method,
        path: req.path,
        action: 'AUTH_FAILURE',
        details: 'Missing or malformed Authorization header',
      });
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload || payload.type !== 'access') {
      auditLogger.log({
        ipAddress: ip,
        method: req.method,
        path: req.path,
        action: 'AUTH_FAILURE',
        details: 'Invalid or expired access token signature',
      });
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
    }

    req.user = payload;

    // Function-level authorization (RBAC)
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(payload.role)) {
        auditLogger.log({
          userId: payload.userId,
          userEmail: payload.email,
          role: payload.role,
          ipAddress: ip,
          method: req.method,
          path: req.path,
          action: 'DENIED',
          details: `Role '${payload.role}' denied access to restricted route requiring [${allowedRoles.join(', ')}]`,
        });
        return res.status(403).json({
          success: false,
          error: `Forbidden: Role '${payload.role}' lacks permission for this operation. Required: [${allowedRoles.join(', ')}]`,
        });
      }
    }

    next();
  };
}
