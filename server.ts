/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * KisanMandi – Full-Stack Express Server (Offline-First Student Major Project Architecture)
 * - Default storage: Built-in SQLite (./data/kisanmandi.db)
 * - Default ML Engine: Local Python ML bridge (ml/ml_engine.py + ml_artifacts_cache.json)
 * - Optional integrations: Gemini API & data.gov.in AGMARKNET API (zero mandatory keys)
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'node:crypto';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  getDb,
  DbUser,
  hashPassword,
  verifyPassword,
  sanitizeUserForClient,
} from './server/database.ts';
import {
  securityHeaders,
  allowlistedMethods,
  rateLimiter,
  requireAuth,
  optionalAuth,
  generateToken,
  verifyToken,
  isRefreshTokenActive,
  revokeRefreshToken,
  revokeAllUserTokens,
  TokenPayload,
} from './server/securityMiddleware.ts';
import { auditLogger } from './server/auditLog.ts';
import { secretManager } from './server/secretManager.ts';
import {
  COMMODITIES,
  MARKETS,
  generateRealMLPrediction,
  generateForecastSequence,
  generatePriceHistory,
  generateFarmerRecommendation,
  generateTraderRecommendation,
  generateSystemAlerts,
  getModelPerformanceMetrics,
} from './server/mlEngine.ts';
import { getMLCache } from './server/mlRunner.ts';
import { pipelineEngine } from './server/dataPipeline.ts';
import { monitoringEngine } from './server/modelMonitoring.ts';
import { featureStore } from './server/featureStore.ts';
import { sendVerificationEmail } from './server/mailService.ts';
import { agmarknetV2Client } from './server/agmarknetV2Client.ts';

type AuthedRequest = Request & { user?: TokenPayload };

const v2ApiCache = new Map<string, { timestamp: number; data: any }>();
function getCachedV2<T>(key: string, ttlMs: number): T | null {
  const entry = v2ApiCache.get(key);
  if (entry && Date.now() - entry.timestamp < ttlMs) {
    return entry.data as T;
  }
  return null;
}
function setCachedV2(key: string, data: any) {
  v2ApiCache.set(key, { timestamp: Date.now(), data });
}

function getOptionalGeminiClient(): GoogleGenAI | null {
  const key = secretManager.getSecret('GEMINI_API_KEY');
  if (!key) return null;
  try {
    return new GoogleGenAI({ apiKey: key });
  } catch {
    return null;
  }
}

export function createApp() {
  // Initialize SQLite schema & sample seed data on startup
  getDb();

  const app = express();
  app.use(securityHeaders);
  app.use(allowlistedMethods);
  app.use(express.json({ limit: '512kb' }));
  app.use(rateLimiter(false));

  /**
   * SYSTEM CAPABILITIES & HEALTH
   */
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      success: true,
      status: 'healthy',
      database: 'sqlite',
      offlineReady: true,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/system/capabilities', (_req: Request, res: Response) => {
    const cache = getMLCache();
    const db = getDb();
    const adminCount = (
      db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'").get() as { cnt: number }
    ).cnt;
    const priceCount = (
      db.prepare('SELECT COUNT(*) as cnt FROM historical_prices').get() as { cnt: number }
    ).cnt;

    res.json({
      success: true,
      offlineReady: true,
      zeroMandatoryCost: true,
      database: 'sqlite',
      historicalPriceRows: priceCount,
      mlRuntime: cache?.ml_runtime || 'python3-local',
      featureSetVersion: cache?.feature_set_version || 'v2.2.0',
      geminiConfigured: secretManager.hasSecret('GEMINI_API_KEY'),
      agmarknetConfigured: secretManager.hasSecret('DATA_GOV_IN_API_KEY'),
      agmarknetV2Configured: true,
      agmarknetV2Enabled: pipelineEngine.isAgmarknetV2Enabled(),
      firebaseEnabled: process.env.VITE_ENABLE_FIREBASE === 'true',
      hasAdmin: adminCount > 0,
    });
  });

  /**
   * AUTHENTICATION ENDPOINTS (SQLite + scryptSync + HS256 JWT + Refresh Rotation)
   */
  app.get('/api/auth/admin-status', (_req: Request, res: Response) => {
    const db = getDb();
    const row = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'").get() as { cnt: number };
    return res.json({ success: true, hasAdmin: row.cnt > 0 });
  });

  app.post('/api/auth/setup-admin', rateLimiter(true), (req: Request, res: Response) => {
    const db = getDb();
    const existingAdmin = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'").get() as { cnt: number };
    if (existingAdmin.cnt > 0) {
      return res.status(403).json({
        success: false,
        error: 'An administrator account already exists. Sign in with your admin password.',
      });
    }

    const { name = 'System Administrator', email, password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Valid administrator email is required.' });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ success: false, error: 'Admin password must be at least 8 characters.' });
    }

    const emailTaken = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (emailTaken) {
      return res.status(409).json({ success: false, error: 'Email already registered as another user.' });
    }

    const nowIso = new Date().toISOString();
    const id = `usr_admin_${crypto.randomBytes(6).toString('hex')}`;
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, state, district, preferred_market, preferred_commodities, language, email_verified, email_verified_at, created_at, last_login)
      VALUES (?, ?, ?, ?, 'admin', 'Andhra Pradesh', 'Guntur', 'Guntur', '["Tomato","Onion","Potato","Rice"]', 'en', 1, ?, ?, ?)
    `).run(id, String(name).trim() || 'System Administrator', cleanEmail, hashPassword(String(password)), nowIso, nowIso, nowIso);

    const created = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as DbUser;
    const accessToken = generateToken({ id: created.id, email: created.email, role: created.role }, 'access');
    const refreshToken = generateToken({ id: created.id, email: created.email, role: created.role }, 'refresh');

    auditLogger.log({
      userId: created.id,
      userEmail: created.email,
      role: 'admin',
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'ADMIN_ACTION',
      details: 'Initial local administrator account provisioned via first-run setup.',
    });

    return res.status(201).json({
      success: true,
      message: 'Initial administrator account created.',
      token: accessToken,
      refresh_token: refreshToken,
      expires_in: 1800,
      user: sanitizeUserForClient(created),
    });
  });

  app.post('/api/auth/register', rateLimiter(true), async (req: Request, res: Response) => {
    const db = getDb();
    const {
      displayName,
      name,
      email,
      password,
      role = 'farmer',
      preferredState = 'Andhra Pradesh',
      preferredDistrict = 'Guntur',
      preferredMarket = 'Guntur',
      preferredCommodities = ['Tomato', 'Onion'],
      phone,
      language = 'en',
    } = req.body || {};

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(displayName || name || '').trim();
    const rawPass = String(password || '');

    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ success: false, error: 'Full name (min 2 chars) is required.' });
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Valid email address is required.' });
    }
    if (rawPass.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    // Security: Prevent privilege escalation — self-registration strictly limited to non-admin roles
    const allowedSelfRoles = ['farmer', 'trader', 'analyst'];
    if (!allowedSelfRoles.includes(role)) {
      auditLogger.log({
        userEmail: cleanEmail,
        ipAddress: req.ip || 'unknown',
        method: req.method,
        path: req.path,
        action: 'DENIED',
        details: `Rejected privileged self-registration role [${role}]`,
      });
      return res.status(403).json({
        success: false,
        error: 'Self-registration is restricted to farmer, trader, or analyst roles.',
      });
    }

    const exists = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (exists) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    const nowIso = new Date().toISOString();
    const id = `usr_${crypto.randomBytes(6).toString('hex')}`;
    const commJson = JSON.stringify(
      Array.isArray(preferredCommodities) && preferredCommodities.length > 0
        ? preferredCommodities
        : ['Tomato']
    );

    db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, role, state, district, preferred_market,
        preferred_commodities, language, phone, email_verified, email_verified_at, created_at, last_login
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)
    `).run(
      id,
      cleanName,
      cleanEmail,
      hashPassword(rawPass),
      role,
      String(preferredState || 'Andhra Pradesh'),
      String(preferredDistrict || 'Guntur'),
      String(preferredMarket || preferredDistrict || 'Guntur'),
      commJson,
      ['en', 'te', 'hi'].includes(language) ? language : 'en',
      phone ? String(phone).trim() : null,
      nowIso,
      nowIso
    );

    // Generate secure cryptographic verification token and store SHA-256 hash
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const tokenExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes expiry

    const mailResult = await sendVerificationEmail(cleanEmail, verificationToken, cleanName);

    const isProd = process.env.NODE_ENV === 'production';
    if (mailResult.success || !isProd) {
      db.prepare(`
        INSERT INTO email_verification_tokens (token_hash, user_id, expires_at, used, created_at)
        VALUES (?, ?, ?, 0, ?)
      `).run(tokenHash, id, tokenExpiry, nowIso);
    }

    const created = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as DbUser;

    auditLogger.log({
      userId: created.id,
      userEmail: created.email,
      role: created.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'USER_AUTH',
      details: `New account registered in SQLite with role [${created.role}] (Email verification pending)`,
    });

    return res.status(201).json({
      success: true,
      requiresVerification: true,
      message: mailResult.success
        ? 'Account registered successfully. Please check your email to verify your account.'
        : isProd
        ? 'Account registered successfully, but email delivery is unconfigured in production.'
        : 'Account registered successfully, but SMTP is not configured. Email delivery is unavailable.',
      email: cleanEmail,
      dev_token: isProd ? undefined : mailResult.devToken,
      user: sanitizeUserForClient(created),
    });
  });

  app.post('/api/auth/verify-email', rateLimiter(true), async (req: Request, res: Response) => {
    const db = getDb();
    const { token } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'Verification token is required.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
    const tokenRow = db.prepare(`
      SELECT * FROM email_verification_tokens
      WHERE token_hash = ? AND used = 0 AND expires_at > ?
    `).get(tokenHash, Date.now()) as { user_id: string; expires_at: number; used: number } | undefined;

    if (!tokenRow) {
      return res.status(400).json({
        success: false,
        error: 'Invalid, expired, or already used email verification token.',
      });
    }

    // Mark token as used (one-time use protection)
    db.prepare('UPDATE email_verification_tokens SET used = 1 WHERE token_hash = ?').run(tokenHash);

    const nowIso = new Date().toISOString();
    db.prepare('UPDATE users SET email_verified = 1, email_verified_at = ? WHERE id = ?').run(nowIso, tokenRow.user_id);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(tokenRow.user_id) as DbUser | undefined;

    auditLogger.log({
      userId: tokenRow.user_id,
      userEmail: user?.email,
      role: user?.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'USER_AUTH',
      details: 'Email address verified successfully via secure token.',
    });

    const accessToken = user ? generateToken({ id: user.id, email: user.email, role: user.role }, 'access') : undefined;
    const refreshToken = user ? generateToken({ id: user.id, email: user.email, role: user.role }, 'refresh') : undefined;

    return res.json({
      success: true,
      message: 'Email verified successfully!',
      token: accessToken,
      refresh_token: refreshToken,
      expires_in: 1800,
      user: user ? sanitizeUserForClient(user) : undefined,
    });
  });

  app.post('/api/auth/resend-verification', rateLimiter(true), async (req: Request, res: Response) => {
    const db = getDb();
    const { email } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail) as DbUser | undefined;
    if (!user || user.email_verified === 1) {
      return res.json({
        success: true,
        message: 'If an unverified account exists with this email, a verification link has been sent.',
      });
    }

    // Invalidate existing unused tokens for this user
    db.prepare('UPDATE email_verification_tokens SET used = 1 WHERE user_id = ?').run(user.id);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const nowIso = new Date().toISOString();

    const mailResult = await sendVerificationEmail(user.email, verificationToken, user.name);

    const isProd = process.env.NODE_ENV === 'production';
    if (mailResult.success || !isProd) {
      db.prepare(`
        INSERT INTO email_verification_tokens (token_hash, user_id, expires_at, used, created_at)
        VALUES (?, ?, ?, 0, ?)
      `).run(tokenHash, user.id, Date.now() + 30 * 60 * 1000, nowIso);
    }

    auditLogger.log({
      userId: user.id,
      userEmail: user.email,
      role: user.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'USER_AUTH',
      details: 'Requested resend of email verification token',
    });

    return res.json({
      success: true,
      message: mailResult.success
        ? 'Verification email resent successfully.'
        : isProd
        ? 'Email delivery service is currently unconfigured in production.'
        : 'SMTP not configured. Email delivery unavailable.',
      dev_token: isProd ? undefined : mailResult.devToken,
    });
  });

  app.post('/api/auth/login', rateLimiter(true), (req: Request, res: Response) => {
    const db = getDb();
    const { identifier, email, password } = req.body || {};
    const cleanEmail = String(email || identifier || '').trim().toLowerCase();
    const rawPass = String(password || '');

    if (!cleanEmail || !rawPass) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const userRow = db
      .prepare('SELECT * FROM users WHERE LOWER(email) = ?')
      .get(cleanEmail) as DbUser | undefined;

    if (!userRow || !verifyPassword(rawPass, userRow.password_hash)) {
      auditLogger.log({
        userEmail: cleanEmail,
        ipAddress: req.ip || 'unknown',
        method: req.method,
        path: req.path,
        action: 'AUTH_FAILURE',
        details: 'Failed password verification attempt',
      });
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    if (userRow.status !== 'Active') {
      auditLogger.log({
        userId: userRow.id,
        userEmail: userRow.email,
        role: userRow.role,
        ipAddress: req.ip || 'unknown',
        method: req.method,
        path: req.path,
        action: 'DENIED',
        details: 'Login rejected because account is deactivated',
      });
      return res.status(403).json({ success: false, error: 'This account has been deactivated by an administrator.' });
    }

    if (userRow.email_verified === 0) {
      auditLogger.log({
        userId: userRow.id,
        userEmail: userRow.email,
        role: userRow.role,
        ipAddress: req.ip || 'unknown',
        method: req.method,
        path: req.path,
        action: 'DENIED',
        details: 'Login rejected because email address is not verified',
      });
      return res.status(403).json({
        success: false,
        requiresVerification: true,
        error: 'Please verify your email address before signing in. Check your email for the verification link.',
      });
    }

    const nowIso = new Date().toISOString();
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(nowIso, userRow.id);
    userRow.last_login = nowIso;

    const accessToken = generateToken({ id: userRow.id, email: userRow.email, role: userRow.role }, 'access');
    const refreshToken = generateToken({ id: userRow.id, email: userRow.email, role: userRow.role }, 'refresh');

    auditLogger.log({
      userId: userRow.id,
      userEmail: userRow.email,
      role: userRow.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'USER_AUTH',
      details: `Authenticated via SQLite credentials as [${userRow.role}]`,
    });

    return res.json({
      success: true,
      message: 'Authentication successful',
      token: accessToken,
      refresh_token: refreshToken,
      expires_in: 1800,
      user: sanitizeUserForClient(userRow),
    });
  });

  /**
   * Student Demo Role Switcher — strictly non-admin roles only (farmer | trader | analyst)
   */
  app.post('/api/auth/demo-login', rateLimiter(true), (req: Request, res: Response) => {
    const { role = 'farmer' } = req.body || {};
    if (!['farmer', 'trader', 'analyst'].includes(role)) {
      auditLogger.log({
        ipAddress: req.ip || 'unknown',
        method: req.method,
        path: req.path,
        action: 'DENIED',
        details: `Demo login denied for non-demo role [${role}]`,
      });
      return res.status(403).json({
        success: false,
        error: 'One-click demo mode is limited to Farmer, Trader, and Analyst walkthroughs. Admins must authenticate with password.',
      });
    }

    const db = getDb();
    const demoUser = db
      .prepare("SELECT * FROM users WHERE role = ? AND status = 'Active' ORDER BY created_at ASC LIMIT 1")
      .get(role) as DbUser | undefined;

    if (!demoUser) {
      return res.status(404).json({ success: false, error: 'Demo profile not initialized.' });
    }

    const accessToken = generateToken({ id: demoUser.id, email: demoUser.email, role: demoUser.role }, 'access');
    const refreshToken = generateToken({ id: demoUser.id, email: demoUser.email, role: demoUser.role }, 'refresh');

    return res.json({
      success: true,
      demoMode: true,
      token: accessToken,
      refresh_token: refreshToken,
      expires_in: 1800,
      user: sanitizeUserForClient(demoUser),
    });
  });

  app.post('/api/auth/refresh', rateLimiter(true), (req: Request, res: Response) => {
    const { refresh_token } = req.body || {};
    if (!refresh_token) {
      return res.status(400).json({ success: false, error: 'Missing refresh token' });
    }

    const payload = verifyToken(refresh_token);
    if (!payload || payload.type !== 'refresh' || !isRefreshTokenActive(refresh_token)) {
      auditLogger.log({
        ipAddress: req.ip || 'unknown',
        method: req.method,
        path: req.path,
        action: 'AUTH_FAILURE',
        details: 'Invalid, expired, or revoked refresh token',
      });
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }

    const db = getDb();
    const dbUser = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId) as DbUser | undefined;
    if (!dbUser || dbUser.status !== 'Active') {
      return res.status(401).json({ success: false, error: 'Account unavailable' });
    }

    if (dbUser.email_verified === 0) {
      return res.status(403).json({ success: false, error: 'Please verify your email address before accessing your account.' });
    }

    revokeRefreshToken(refresh_token);
    const newAccessToken = generateToken({ id: dbUser.id, email: dbUser.email, role: dbUser.role }, 'access');
    const newRefreshToken = generateToken({ id: dbUser.id, email: dbUser.email, role: dbUser.role }, 'refresh');

    return res.json({
      success: true,
      token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_in: 1800,
      user: sanitizeUserForClient(dbUser),
    });
  });

  app.post('/api/auth/logout', (req: AuthedRequest, res: Response) => {
    const { refresh_token } = req.body || {};
    if (refresh_token) revokeRefreshToken(refresh_token);
    return res.json({ success: true, message: 'Logged out cleanly' });
  });

  app.get('/api/auth/me', requireAuth(), (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.userId) as DbUser | undefined;
    if (!userRow) return res.status(404).json({ success: false, error: 'User not found' });
    return res.json({ success: true, user: sanitizeUserForClient(userRow) });
  });

  /**
   * PROFILE MANAGEMENT ENDPOINTS (SQLite Persisted)
   */
  app.put('/api/profile', requireAuth(), (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const userId = req.user!.userId;
    const {
      displayName,
      preferredState,
      preferredDistrict,
      preferredMarket,
      preferredCommodities,
      language,
      alertsEnabled,
      alertChannels,
      phone,
    } = req.body || {};

    const current = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as DbUser | undefined;
    if (!current) return res.status(404).json({ success: false, error: 'User not found' });

    const nextLang = ['en', 'te', 'hi'].includes(language) ? language : current.language;
    const nextCommodities = Array.isArray(preferredCommodities)
      ? JSON.stringify(preferredCommodities)
      : current.preferred_commodities;
    const nextChannels = Array.isArray(alertChannels)
      ? JSON.stringify(alertChannels)
      : current.alert_channels;

    db.prepare(`
      UPDATE users
      SET name = ?, state = ?, district = ?, preferred_market = ?,
          preferred_commodities = ?, language = ?, alerts_enabled = ?,
          alert_channels = ?, phone = ?
      WHERE id = ?
    `).run(
      String(displayName || current.name).trim(),
      String(preferredState || current.state),
      String(preferredDistrict || current.district),
      String(preferredMarket || preferredDistrict || current.preferred_market),
      nextCommodities,
      nextLang,
      typeof alertsEnabled === 'boolean' ? (alertsEnabled ? 1 : 0) : current.alerts_enabled,
      nextChannels,
      phone !== undefined ? (phone ? String(phone).trim() : null) : current.phone,
      userId
    );

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as unknown as DbUser;
    auditLogger.log({
      userId,
      userEmail: updated.email,
      role: updated.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'USER_UPDATE',
      details: 'Updated profile preferences in SQLite',
    });

    return res.json({ success: true, user: sanitizeUserForClient(updated) });
  });

  app.post('/api/auth/change-password', requireAuth(), (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body || {};

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
    }

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as DbUser | undefined;
    if (!userRow) return res.status(404).json({ success: false, error: 'User not found' });

    if (!currentPassword || !verifyPassword(String(currentPassword), userRow.password_hash)) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect.' });
    }

    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(String(newPassword)), userId);
    revokeAllUserTokens(userId);

    auditLogger.log({
      userId,
      userEmail: userRow.email,
      role: userRow.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'USER_UPDATE',
      details: 'Password updated and prior refresh tokens revoked',
    });

    return res.json({ success: true, message: 'Password updated cleanly.' });
  });

  app.delete('/api/profile', requireAuth(), (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const userId = req.user!.userId;
    const current = db.prepare('SELECT email, role FROM users WHERE id = ?').get(userId) as { email: string; role: string } | undefined;
    if (!current) return res.status(404).json({ success: false, error: 'User not found' });

    revokeAllUserTokens(userId);
    db.prepare('DELETE FROM watchlists WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM saved_scenarios WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    auditLogger.log({
      userId,
      userEmail: current.email,
      role: current.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'USER_UPDATE',
      details: 'User deleted their account and personal saved records',
    });

    return res.json({ success: true, message: 'Account deleted permanently.' });
  });

  /**
   * WATCHLISTS & CULTIVATION SCENARIOS (SQLite Persisted)
   */
  app.get('/api/watchlists', requireAuth(), (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const uid = req.user!.userId;
    const rows = db
      .prepare('SELECT id, user_id as userId, state, market, commodity, target_price as targetPrice, alert_condition as alertCondition, created_at as addedAt FROM watchlists WHERE user_id = ? ORDER BY created_at DESC')
      .all(uid);
    return res.json({ success: true, items: rows });
  });

  app.post('/api/watchlists', requireAuth(), (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const uid = req.user!.userId;
    const { state, market, commodity = 'Tomato', targetPrice, alertCondition = 'above' } = req.body || {};
    if (!state || !market || typeof Number(targetPrice) !== 'number' || Number(targetPrice) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid state, market, and positive target price required.' });
    }
    const cond = alertCondition === 'below' ? 'below' : 'above';
    const id = `wl_${uid}_${state}_${market}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT OR REPLACE INTO watchlists (id, user_id, state, market, commodity, target_price, alert_condition, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, uid, String(state), String(market), String(commodity), Number(targetPrice), cond, nowIso);

    return res.status(201).json({
      success: true,
      item: { id, userId: uid, state, market, commodity, targetPrice: Number(targetPrice), alertCondition: cond, addedAt: nowIso },
    });
  });

  app.delete('/api/watchlists/:id', requireAuth(), (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const resDel = db
      .prepare('DELETE FROM watchlists WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user!.userId);
    return res.json({ success: resDel.changes > 0 });
  });

  app.get('/api/scenarios', requireAuth(), (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const rows = db
      .prepare('SELECT * FROM saved_scenarios WHERE user_id = ? ORDER BY created_at DESC')
      .all(req.user!.userId) as Array<Record<string, any>>;

    const items = rows.map((r) => ({
      id: r.id,
      cropGroup: r.crop_group,
      cropName: r.crop_name,
      state: r.state,
      market: r.market,
      inputs: JSON.parse(r.inputs_json || '{}'),
      predictedPriceQuintal: r.predicted_price_quintal,
      predictedPriceTonne: r.predicted_price_tonne,
      createdAt: r.created_at,
    }));
    return res.json({ success: true, items });
  });

  app.post('/api/scenarios', requireAuth(), (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const uid = req.user!.userId;
    const { cropGroup, cropName, state, market, inputs, predictedPriceQuintal, predictedPriceTonne } = req.body || {};
    if (!cropName || !state || !market) {
      return res.status(400).json({ success: false, error: 'cropName, state, and market are required.' });
    }
    const id = `scen_${crypto.randomBytes(6).toString('hex')}`;
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO saved_scenarios (id, user_id, crop_group, crop_name, state, market, inputs_json, predicted_price_quintal, predicted_price_tonne, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      uid,
      String(cropGroup || 'Vegetables'),
      String(cropName),
      String(state),
      String(market),
      JSON.stringify(inputs || {}),
      Number(predictedPriceQuintal || 0),
      Number(predictedPriceTonne || 0),
      nowIso
    );

    return res.status(201).json({
      success: true,
      item: {
        id,
        cropGroup: String(cropGroup || 'Vegetables'),
        cropName: String(cropName),
        state: String(state),
        market: String(market),
        inputs: inputs || {},
        predictedPriceQuintal: Number(predictedPriceQuintal || 0),
        predictedPriceTonne: Number(predictedPriceTonne || 0),
        createdAt: nowIso,
      },
    });
  });

  app.delete('/api/scenarios/:id', requireAuth(), (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const resDel = db
      .prepare('DELETE FROM saved_scenarios WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user!.userId);
    return res.json({ success: resDel.changes > 0 });
  });

  /**
   * CORE MARKET & ML PREDICTION ENDPOINTS (100% Functional Offline)
   */
  app.get('/api/commodities', (_req: Request, res: Response) => {
    const list = Object.values(COMMODITIES);
    return res.json({ success: true, count: list.length, commodities: list });
  });

  app.get('/api/markets', (_req: Request, res: Response) => {
    const list = Object.values(MARKETS);
    return res.json({ success: true, count: list.length, markets: list });
  });

  app.get('/api/features/active', (_req: Request, res: Response) => {
    return res.json({ success: true, ...featureStore.getActiveFeatureDefinition() });
  });

  app.get('/api/prices/history', (req: Request, res: Response) => {
    const commodity = (req.query.commodity as string) || 'Tomato';
    const market = (req.query.market as string) || 'Guntur';
    const days = parseInt((req.query.days as string) || '30', 10);
    const history = generatePriceHistory(commodity, market, days);
    const hasUploadedOrLive = history.some((h) =>
      ['live', 'csv_upload', 'agmarknet_live'].includes(String(h.data_source || '').toLowerCase())
    );

    return res.json({
      success: true,
      commodity,
      market,
      days,
      data_origin: hasUploadedOrLive ? 'sqlite_uploaded_or_live_dataset' : (history[0]?.data_source || 'sample'),
      is_demonstration_data: !hasUploadedOrLive,
      history,
    });
  });

  app.get('/api/prices/export', (req: Request, res: Response) => {
    const commodity = (req.query.commodity as string) || 'Tomato';
    const market = (req.query.market as string) || 'Guntur';
    const days = parseInt((req.query.days as string) || '90', 10);
    const history = generatePriceHistory(commodity, market, days);

    const csvCell = (val: unknown) => {
      let s = val === null || val === undefined ? '' : String(val);
      if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const safeFilename = `${commodity}_${market}_history.csv`.replace(/[^a-zA-Z0-9._-]/g, '_');
    const lines = [
      '# KisanMandi Agricultural Market Export (Educational Sample / SQLite Cache)',
      'date,commodity,market,modal_price_kg,min_price_kg,max_price_kg,arrival_tonnes,rainfall_mm,temp_c,data_source',
      ...history.map((h) =>
        [
          csvCell(h.date),
          csvCell(commodity),
          csvCell(market),
          csvCell(h.modal_price),
          csvCell(h.min_price),
          csvCell(h.max_price),
          csvCell(h.arrival_tonnes),
          csvCell(h.rainfall_mm ?? ''),
          csvCell(h.temp_c ?? ''),
          csvCell(h.data_source),
        ].join(',')
      ),
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    return res.send(lines.join('\n'));
  });

  app.get('/api/predict/next-day', (req: Request, res: Response) => {
    const commodity = (req.query.commodity as string) || 'Tomato';
    const market = (req.query.market as string) || 'Guntur';
    const modelName = req.query.model as string | undefined;
    return res.json(generateRealMLPrediction(commodity, market, modelName));
  });

  app.get('/api/predict/7-day', (req: Request, res: Response) => {
    const commodity = (req.query.commodity as string) || 'Tomato';
    const market = (req.query.market as string) || 'Guntur';
    const modelName = req.query.model as string | undefined;
    const basePrediction = generateRealMLPrediction(commodity, market, modelName);
    const dailyForecasts = generateForecastSequence(basePrediction, 7);

    return res.json({
      ...basePrediction,
      forecast_horizon_days: 7,
      daily_forecasts: dailyForecasts,
    });
  });

  app.get('/api/predict/30-day', (req: Request, res: Response) => {
    const commodity = (req.query.commodity as string) || 'Tomato';
    const market = (req.query.market as string) || 'Guntur';
    const modelName = req.query.model as string | undefined;
    const basePrediction = generateRealMLPrediction(commodity, market, modelName);
    const dailyForecasts = generateForecastSequence(basePrediction, 30);
    const sumPrice = dailyForecasts.reduce((acc, cur) => acc + cur.predicted_price, 0);
    const predicted30DayAvg = Math.round((sumPrice / Math.max(1, dailyForecasts.length)) * 100) / 100;

    return res.json({
      ...basePrediction,
      forecast_horizon_days: 30,
      predicted_30day_avg: predicted30DayAvg,
      daily_forecasts: dailyForecasts,
    });
  });

  app.get('/api/recommendation/farmer', (req: Request, res: Response) => {
    const commodity = (req.query.commodity as string) || 'Tomato';
    const market = (req.query.market as string) || 'Guntur';
    const district = (req.query.district as string) || 'Guntur';
    return res.json(generateFarmerRecommendation(commodity, market, district));
  });

  app.get('/api/recommendation/trader', (req: Request, res: Response) => {
    const commodity = (req.query.commodity as string) || 'Tomato';
    const market = (req.query.market as string) || 'Guntur';
    const targetMarket = req.query.target_market as string | undefined;
    return res.json(generateTraderRecommendation(commodity, market, targetMarket));
  });

  app.get('/api/model-performance', (req: Request, res: Response) => {
    const commodity = (req.query.commodity as string) || 'Tomato';
    const market = (req.query.market as string) || 'Guntur';
    return res.json(getModelPerformanceMetrics(commodity, market));
  });

  app.get('/api/alerts', optionalAuth, (req: AuthedRequest, res: Response) => {
    const role = req.query.role as string;
    const commodity = req.query.commodity as string;
    const market = req.query.market as string;
    const alerts = generateSystemAlerts(role, commodity, market);

    let readIds = new Set<string>();
    if (req.user) {
      const db = getDb();
      const rows = db
        .prepare('SELECT alert_id FROM notification_reads WHERE user_id = ?')
        .all(req.user.userId) as Array<{ alert_id: string }>;
      readIds = new Set(rows.map((r) => r.alert_id));
    }

    return res.json({
      success: true,
      generated_at: new Date().toISOString(),
      count: alerts.length,
      alerts: alerts.map((a) => ({ ...a, read: readIds.has(a.id) })),
    });
  });

  app.post('/api/alerts/read', requireAuth(), (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const { alertId } = req.body || {};
    if (!alertId) return res.status(400).json({ success: false, error: 'alertId is required' });
    db.prepare('INSERT OR IGNORE INTO notification_reads (user_id, alert_id, read_at) VALUES (?, ?, ?)').run(
      req.user!.userId,
      String(alertId),
      new Date().toISOString()
    );
    return res.json({ success: true });
  });

  /**
   * COMMODITY SPOT & PAN-INDIA BENCHMARKS
   * Uses SQLite local sample records by default; optional Gemini AI if explicitly configured.
   */
  const spotPriceCache = new Map<string, { expiresAt: number; responseData: any }>();

  app.post('/api/commodities/live', async (req: Request, res: Response) => {
    const { state = 'Andhra Pradesh', market = 'Guntur', group = 'All' } = req.body || {};
    const cacheKey = `state:${String(state).toLowerCase()}::market:${String(market).toLowerCase()}::group:${String(group).toLowerCase()}`;
    const now = Date.now();
    const cached = spotPriceCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return res.json({
        ...cached.responseData,
        cached_response: true,
        cache_expires_in_sec: Math.round((cached.expiresAt - now) / 1000),
      });
    }

    const ai = getOptionalGeminiClient();

    if (ai) {
      try {
        const prompt = `Return a valid JSON array of commodity estimates for ${market}, ${state} (Group: ${group}) with fields: commodity, group, modalPriceQuintal, minPriceQuintal, maxPriceQuintal, arrivalQuantityTonne, momChangePercent, trend ("up"|"down"|"flat"), mandiStatus.`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
        const aiRows = JSON.parse((response.text ?? '[]').trim());
        if (Array.isArray(aiRows) && aiRows.length > 0) {
          const aiPayload = {
            success: true,
            source: 'AI Estimate (Optional Gemini API — Not Official AGMARKNET Feed)',
            data_origin: 'ai_estimate',
            is_ai_estimate: true,
            timestamp: new Date().toISOString(),
            state,
            market,
            data: aiRows,
          };
          spotPriceCache.set(cacheKey, { expiresAt: now + 15 * 60 * 1000, responseData: aiPayload });
          return res.json(aiPayload);
        }
      } catch (err) {
        console.warn('Optional Gemini API unavailable, serving SQLite offline sample data:', err);
      }
    }

    // Offline SQLite spot synthesis from local historical_prices + COMMODITIES catalog
    const db = getDb();
    const items = Object.values(COMMODITIES)
      .filter((c) => group === 'All' || c.category === group)
      .map((c) => {
        const recent = db
          .prepare(`
            SELECT modal_price, min_price, max_price, arrival_tonnes
            FROM historical_prices
            WHERE LOWER(commodity) = LOWER(?)
            ORDER BY arrival_date DESC LIMIT 2
          `)
          .all(c.name) as Array<{ modal_price: number; min_price: number; max_price: number; arrival_tonnes: number | null }>;

        const latestModal = recent[0]?.modal_price ?? c.base_price_kg;
        const prevModal = recent[1]?.modal_price ?? latestModal;
        const mktMult = MARKETS[market]?.price_multiplier ?? 1.0;
        const qModal = Math.round(latestModal * mktMult * 100);
        const qMin = Math.round((recent[0]?.min_price ?? latestModal * 0.9) * mktMult * 100);
        const qMax = Math.round((recent[0]?.max_price ?? latestModal * 1.1) * mktMult * 100);
        const pct = Math.round(((latestModal - prevModal) / Math.max(1, prevModal)) * 1000) / 10;

        return {
          commodity: `${c.name} (${c.varieties[0]})`,
          group: c.category,
          modalPriceQuintal: qModal,
          minPriceQuintal: qMin,
          maxPriceQuintal: qMax,
          arrivalQuantityTonne: Math.round(recent[0]?.arrival_tonnes ?? 240),
          momChangePercent: pct,
          trend: pct > 0.3 ? 'up' : pct < -0.3 ? 'down' : 'flat',
          mandiStatus: 'Offline SQLite Sample Series',
        };
      });

    const responsePayload = {
      success: true,
      source: 'Offline SQLite Sample Dataset (No External Paid API Required)',
      data_origin: 'sample_dataset_demonstration',
      is_ai_estimate: false,
      timestamp: new Date().toISOString(),
      state,
      market,
      data: items,
    };
    spotPriceCache.set(cacheKey, { expiresAt: now + 15 * 60 * 1000, responseData: responsePayload });
    return res.json(responsePayload);
  });

  app.post('/api/commodities/pan-india', async (_req: Request, res: Response) => {
    const cache = getMLCache();
    const pairs = cache ? Object.values(cache.pairs).slice(0, 8) : [];

    const benchmarks =
      pairs.length > 0
        ? pairs.map((p) => ({
            commodity: p.commodity,
            state: p.state || 'Andhra Pradesh',
            market: p.market,
            modalPriceQuintal: Math.round(p.current_modal_price * 100),
            trend: p.expected_change_percent > 0.4 ? 'up' : p.expected_change_percent < -0.4 ? 'down' : 'flat',
            changePercent: p.expected_change_percent,
          }))
        : Object.values(COMMODITIES)
            .slice(0, 8)
            .map((c) => ({
              commodity: c.name,
              state: 'Andhra Pradesh',
              market: 'Guntur',
              modalPriceQuintal: Math.round(c.base_price_kg * 100),
              trend: 'flat',
              changePercent: 0,
            }));

    return res.json({
      success: true,
      source: 'Offline Sample Dataset Benchmark Index',
      data_origin: 'sample_dataset_demonstration',
      data: benchmarks,
    });
  });

  /**
   * ANALYST & ADMIN PROTECTED ML PIPELINE & MONITORING ENDPOINTS
   */
  app.get('/api/pipeline/status', requireAuth(['analyst', 'admin']), (_req: Request, res: Response) => {
    return res.json({ success: true, ...pipelineEngine.getStatus() });
  });

  app.get('/api/pipeline/missing-report', requireAuth(['analyst', 'admin']), (_req: Request, res: Response) => {
    return res.json({ success: true, ...pipelineEngine.getMissingValueReport() });
  });

  app.get('/api/pipeline/outliers', requireAuth(['analyst', 'admin']), (_req: Request, res: Response) => {
    return res.json({ success: true, ...pipelineEngine.getOutliersReport() });
  });

  app.get('/api/pipeline/validate-retrain', requireAuth(['analyst', 'admin']), (_req: Request, res: Response) => {
    return res.json({ success: true, ...pipelineEngine.validateDataQualityForRetraining() });
  });

  app.get('/api/pipeline/models', requireAuth(['analyst', 'admin']), (_req: Request, res: Response) => {
    return res.json({ success: true, models: pipelineEngine.getModelRegistry() });
  });

  app.get('/api/monitoring/metrics', requireAuth(['analyst', 'admin']), (_req: Request, res: Response) => {
    return res.json(monitoringEngine.getDashboardMetrics());
  });

  /**
   * ADMIN-ONLY DATA PIPELINE, USER MANAGEMENT & AUDIT CONTROLS
   */
  app.post('/api/pipeline/api-key', requireAuth(['admin']), (req: AuthedRequest, res: Response) => {
    const { apiKey } = req.body || {};
    const status = pipelineEngine.setApiKey(String(apiKey || ''));
    auditLogger.log({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      role: req.user?.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'ADMIN_ACTION',
      details: apiKey ? 'Configured optional data.gov.in AGMARKNET API key' : 'Cleared optional AGMARKNET key (Offline mode)',
    });
    return res.json({ success: true, message: 'Optional AGMARKNET key setting updated.', ...status });
  });

  app.post('/api/pipeline/trigger-fetch', requireAuth(['admin']), async (req: AuthedRequest, res: Response) => {
    const { source = 'AGMARKNET / data.gov.in' } = req.body || {};
    const result = await pipelineEngine.triggerIngestion(String(source));
    auditLogger.log({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      role: req.user?.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'DATA_INGESTION',
      details: `Pipeline fetch (${result.source_mode}): ${result.message}`,
    });
    return res.json(result);
  });

  app.post('/api/pipeline/trigger-fetch-v2', requireAuth(['admin']), async (req: AuthedRequest, res: Response) => {
    const { commodityId = 1, date, limit = 50 } = req.body || {};
    const result = await pipelineEngine.triggerAgmarknetV2Ingestion({
      commodityId: Number(commodityId) || 1,
      date: date ? String(date) : undefined,
      limit: Number(limit) || 50,
    });
    auditLogger.log({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      role: req.user?.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'DATA_INGESTION',
      details: `AGMARKNET 2.0 Ingestion (${result.source_mode}): ${result.message}`,
    });
    return res.json(result);
  });

  app.post('/api/pipeline/v2-toggle', requireAuth(['admin']), (req: AuthedRequest, res: Response) => {
    const { enabled } = req.body || {};
    const isEnabled = pipelineEngine.setAgmarknetV2Enabled(Boolean(enabled));
    auditLogger.log({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      role: req.user?.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'ADMIN_ACTION',
      details: `AGMARKNET 2.0 provider ${isEnabled ? 'enabled' : 'disabled'}`,
    });
    return res.json({ success: true, enabled: isEnabled });
  });

  /**
   * AGMARKNET 2.0 PUBLIC & EXPLORER QUERY ENDPOINTS (CACHED)
   */
  app.get('/api/agmarknet-v2/filters', optionalAuth, async (_req: Request, res: Response) => {
    const cacheKey = 'v2_filters_master';
    const cached = getCachedV2(cacheKey, 60 * 60 * 1000); // 1 hour TTL
    if (cached) return res.json({ success: true, cached: true, data: cached });

    try {
      const data = await agmarknetV2Client.getDailyPriceArrivalFilters();
      setCachedV2(cacheKey, data);
      return res.json({ success: true, cached: false, data });
    } catch (err: any) {
      return res.status(502).json({
        success: false,
        error: 'Failed to retrieve AGMARKNET 2.0 filter metadata from government API.',
        message: err?.message,
      });
    }
  });

  app.get('/api/agmarknet-v2/lastweek', optionalAuth, async (req: Request, res: Response) => {
    const { marketId, stateId, commodityId } = req.query;
    if (!marketId || !stateId || !commodityId) {
      return res.status(400).json({
        success: false,
        error: 'Query parameters marketId, stateId, and commodityId are required.',
      });
    }

    const cacheKey = `v2_lastweek_${marketId}_${stateId}_${commodityId}`;
    const cached = getCachedV2(cacheKey, 15 * 60 * 1000); // 15 min TTL
    if (cached) return res.json({ success: true, cached: true, data: cached });

    try {
      const data = await agmarknetV2Client.getLastWeekMarketPrice({
        marketId: String(marketId),
        stateId: String(stateId),
        commodityId: String(commodityId),
      });
      setCachedV2(cacheKey, data);
      return res.json({ success: true, cached: false, data });
    } catch (err: any) {
      return res.status(502).json({
        success: false,
        error: 'Failed to fetch last-week price series from AGMARKNET 2.0.',
        message: err?.message,
      });
    }
  });

  app.get('/api/agmarknet-v2/wholesale-monthly', optionalAuth, async (req: Request, res: Response) => {
    const { commodity, year, month, reportMode = 'Statewise', state = 0, district = 0 } = req.query;
    if (!commodity || !year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Query parameters commodity, year, and month are required.',
      });
    }

    const cacheKey = `v2_monthly_${commodity}_${year}_${month}_${reportMode}_${state}_${district}`;
    const cached = getCachedV2(cacheKey, 30 * 60 * 1000); // 30 min TTL
    if (cached) return res.json({ success: true, cached: true, data: cached });

    try {
      const data = await agmarknetV2Client.getWholesalePricesMonthly({
        commodity: String(commodity),
        year: String(year),
        month: String(month),
        reportMode: String(reportMode) as any,
        state: String(state),
        district: String(district),
      });
      setCachedV2(cacheKey, data);
      return res.json({ success: true, cached: false, data });
    } catch (err: any) {
      return res.status(502).json({
        success: false,
        error: 'Failed to fetch monthly wholesale price trend from AGMARKNET 2.0.',
        message: err?.message,
      });
    }
  });

  app.get('/api/agmarknet-v2/wholesale-arrivals', optionalAuth, async (req: Request, res: Response) => {
    const { commodity, year, month, state, district = 0 } = req.query;
    if (!commodity || !year || !month || !state) {
      return res.status(400).json({
        success: false,
        error: 'Query parameters commodity, year, month, and state are required.',
      });
    }

    const cacheKey = `v2_arrivals_${commodity}_${year}_${month}_${state}_${district}`;
    const cached = getCachedV2(cacheKey, 30 * 60 * 1000); // 30 min TTL
    if (cached) return res.json({ success: true, cached: true, data: cached });

    try {
      const data = await agmarknetV2Client.getWholesaleArrivalsMonthly({
        commodity: String(commodity),
        year: String(year),
        month: String(month),
        state: String(state),
        district: String(district),
      });
      setCachedV2(cacheKey, data);
      return res.json({ success: true, cached: false, data });
    } catch (err: any) {
      return res.status(502).json({
        success: false,
        error: 'Failed to fetch monthly arrivals from AGMARKNET 2.0.',
        message: err?.message,
      });
    }
  });

  app.get('/api/pipeline/datasets', requireAuth(['admin']), (_req: Request, res: Response) => {
    return res.json({ success: true, datasets: pipelineEngine.getDatasetsQueue() });
  });

  app.post('/api/pipeline/upload-csv', requireAuth(['admin']), (req: AuthedRequest, res: Response) => {
    const { filename = 'upload.csv', csvContent } = req.body || {};
    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({ success: false, error: 'csvContent text payload is required.' });
    }
    const result = pipelineEngine.ingestCsvUpload(String(filename), csvContent, req.user?.email || 'admin');
    if (!result.success) return res.status(400).json(result);

    auditLogger.log({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      role: req.user?.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'DATA_INGESTION',
      details: `Uploaded CSV "${filename}" (${result.dataset?.rows ?? 0} rows staged in SQLite)`,
    });
    return res.status(201).json(result);
  });

  app.patch('/api/pipeline/datasets/:id', requireAuth(['admin']), (req: AuthedRequest, res: Response) => {
    const { status } = req.body || {};
    if (status !== 'Approved' && status !== 'Rejected') {
      return res.status(400).json({ success: false, error: 'Status must be Approved or Rejected.' });
    }
    const result = pipelineEngine.updateDatasetStatus(req.params.id, status);
    auditLogger.log({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      role: req.user?.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'ADMIN_ACTION',
      details: `Dataset ${req.params.id} marked ${status}`,
    });
    return res.json(result);
  });

  app.post('/api/pipeline/retrain', requireAuth(['admin']), (req: AuthedRequest, res: Response) => {
    const { commodity = 'Tomato', market = 'Guntur', algorithm = 'Random Forest' } = req.body || {};
    const result = pipelineEngine.triggerModelRetraining(String(commodity), String(market), String(algorithm));
    auditLogger.log({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      role: req.user?.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'MODEL_ACTION',
      details: `Model retraining (${algorithm}) for ${commodity} @ ${market}: ${result.message}`,
    });
    return res.json(result);
  });

  app.post('/api/pipeline/rollback', requireAuth(['admin']), (req: AuthedRequest, res: Response) => {
    const { version = '', commodity = 'Tomato', market = 'Guntur' } = req.body || {};
    const result = pipelineEngine.rollbackModel(String(version), String(commodity), String(market));
    auditLogger.log({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      role: req.user?.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'MODEL_ACTION',
      details: result.message,
    });
    return res.json(result);
  });

  app.post('/api/monitoring/resolve-alert', requireAuth(['admin']), (req: AuthedRequest, res: Response) => {
    const { alertId } = req.body || {};
    const result = monitoringEngine.acknowledgeAlert(String(alertId || ''));
    auditLogger.log({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      role: req.user?.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'ADMIN_ACTION',
      details: `Resolved drift alert ${alertId}`,
    });
    return res.json(result);
  });

  app.post('/api/monitoring/investigate', requireAuth(['admin']), (req: AuthedRequest, res: Response) => {
    const { commodity = 'Onion', market = 'Lasalgaon' } = req.body || {};
    return res.json(monitoringEngine.runDriftInvestigation(String(commodity), String(market)));
  });

  app.get('/api/admin/users', requireAuth(['admin']), (_req: Request, res: Response) => {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as unknown as DbUser[];
    return res.json({ success: true, users: rows.map(sanitizeUserForClient) });
  });

  app.patch('/api/admin/users/:id/role', requireAuth(['admin']), (req: AuthedRequest, res: Response) => {
    const { role } = req.body || {};
    if (!['farmer', 'trader', 'analyst', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role.' });
    }
    const db = getDb();
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
    auditLogger.log({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      role: req.user?.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'ADMIN_ACTION',
      details: `Updated user ${req.params.id} role to [${role}]`,
    });
    return res.json({ success: true });
  });

  app.patch('/api/admin/users/:id/status', requireAuth(['admin']), (req: AuthedRequest, res: Response) => {
    const { status } = req.body || {};
    if (status !== 'Active' && status !== 'Deactivated') {
      return res.status(400).json({ success: false, error: 'Status must be Active or Deactivated.' });
    }
    if (req.params.id === req.user?.userId && status === 'Deactivated') {
      return res.status(400).json({ success: false, error: 'Cannot deactivate your own active admin account.' });
    }
    const db = getDb();
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
    if (status === 'Deactivated') revokeAllUserTokens(req.params.id);
    auditLogger.log({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      role: req.user?.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'ADMIN_ACTION',
      details: `Set user ${req.params.id} status to ${status}`,
    });
    return res.json({ success: true });
  });

  app.post('/api/admin/users/:id/reset-password', requireAuth(['admin']), (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const target = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.params.id) as { id: string; email: string } | undefined;
    if (!target) return res.status(404).json({ success: false, error: 'User not found' });

    const tempPassword = `Km-${crypto.randomBytes(4).toString('hex')}`;
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(tempPassword), target.id);
    revokeAllUserTokens(target.id);

    auditLogger.log({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      role: req.user?.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'ADMIN_ACTION',
      details: `Issued password reset and revoked refresh tokens for ${target.email}`,
    });
    return res.json({ success: true, temporaryPassword: tempPassword, email: target.email });
  });

  app.delete('/api/admin/users/:id', requireAuth(['admin']), (req: AuthedRequest, res: Response) => {
    if (req.params.id === req.user?.userId) {
      return res.status(400).json({ success: false, error: 'Cannot delete currently signed-in admin account.' });
    }
    const db = getDb();
    revokeAllUserTokens(req.params.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    auditLogger.log({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      role: req.user?.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'ADMIN_ACTION',
      details: `Deleted user ${req.params.id}`,
    });
    return res.json({ success: true });
  });

  app.get('/api/admin/audit-logs', requireAuth(['admin']), (req: AuthedRequest, res: Response) => {
    const limit = parseInt((req.query.limit as string) || '100', 10);
    const type = (req.query.type as string) || 'all';
    const logs = auditLogger.getLogs(limit, type);
    return res.json({ success: true, count: logs.length, logs });
  });

  app.post('/api/admin/alerts', requireAuth(['admin']), (req: AuthedRequest, res: Response) => {
    const db = getDb();
    const {
      roleTarget = 'All',
      alertType = 'System Advisory',
      commodity = 'Tomato',
      market = 'Guntur',
      state = 'Andhra Pradesh',
      riskLevel = 'MEDIUM',
      recommendedAction = 'Monitor market arrivals before dispatch.',
      message,
    } = req.body || {};

    if (!message || String(message).trim().length < 5) {
      return res.status(400).json({ success: false, error: 'Alert message (min 5 chars) is required.' });
    }

    const id = `alt_bc_${crypto.randomBytes(5).toString('hex')}`;
    const nowIso = new Date().toISOString();
    db.prepare(`
      INSERT INTO notifications (
        id, role_target, alert_type, commodity, market, state, alert_date,
        current_price, predicted_price, expected_change, risk_level, recommended_action, message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 'Advisory', ?, ?, ?, ?)
    `).run(
      id,
      String(roleTarget),
      String(alertType),
      String(commodity),
      String(market),
      String(state),
      nowIso.split('T')[0],
      String(riskLevel),
      String(recommendedAction),
      String(message).trim(),
      nowIso
    );

    auditLogger.log({
      userId: req.user?.userId,
      userEmail: req.user?.email,
      role: req.user?.role,
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'ADMIN_ACTION',
      details: `Broadcast alert ${id} to [${roleTarget}]`,
    });

    return res.status(201).json({ success: true, id });
  });

  app.patch('/api/admin/alerts/:id/disable', requireAuth(['admin']), (req: AuthedRequest, res: Response) => {
    const db = getDb();
    db.prepare('UPDATE notifications SET is_disabled = 1 WHERE id = ?').run(req.params.id);
    return res.json({ success: true });
  });

  return app;
}

async function startServer() {
  const app = createApp();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KisanMandi offline-first server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.KISANMANDI_NO_AUTOSTART !== '1' && process.env.NODE_ENV !== 'test') {
  startServer();
}
