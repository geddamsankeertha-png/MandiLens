# KisanMandi — Email Verification Security Audit & Implementation Report

**Author:** Senior Security Auditor & Full-Stack Architect  
**Project:** KisanMandi – Mandi Price Predictor & Agricultural Analytics Platform  
**Target Component:** Gmail SMTP Real Email Verification & Authentication Security Hardening  
**Date:** November 22, 2026  

---

## 1. Executive Summary

This security audit and verification report documents the hardening of the real email verification subsystem in **KisanMandi**. The implementation replaces the previous offline confirmation check with cryptographically secure backend verification, strict token lifecycle management, zero credential exposure, robust rate limiting, and environment-aware development/production isolation.

All requirements have been independently verified through automated test suites (`tests/platform.test.ts` and `ml/test_ml.py`), static analysis (`npm run lint`), and production build verification (`npm run build`).

---

## 2. Security Architecture & Implementation Details

### A. Token Generation & Storage
- **Cryptographic Randomness**: Verification tokens are generated using Node.js cryptographically secure pseudo-random number generator (`crypto.randomBytes(32).toString('hex')`).
- **One-Way Hashing**: Plaintext tokens are **never** stored in the SQLite database. Only their SHA-256 hashes (`crypto.createHash('sha256').update(token).digest('hex')`) are persisted in the `email_verification_tokens` table.
- **Expiration & One-Time Use**: Tokens expire strictly after **30 minutes** (`Date.now() + 30 * 60 * 1000`) and enforce **one-time-use protection** via the `used` flag (automatically marked `used = 1` upon successful verification). Reusing an already used or expired token is rejected with an HTTP 400 error.

### B. Environment-Aware Behavior (Development vs. Production)
- **Development / Local Testing (`NODE_ENV !== 'production'`)**:
  - If SMTP is unconfigured (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` missing), the backend logs a secure dev notice and returns a `dev_token` in the registration/resend API response so developers and student evaluators can test the verification flow without requiring a live Gmail App Password.
- **Production (`NODE_ENV === 'production'`)**:
  - Developer verification tokens (`dev_token`) are **completely disabled and omitted** from all API responses.
  - Verification tokens and links are **never** logged to stdout/stderr in production.
  - If SMTP delivery fails or is unconfigured in production, no bypass token is activated or stored, preventing unauthorized account activation.

### C. Authorization Guards & Profile Integrity
- **Protected Endpoint Enforcement**: The `requireAuth` middleware verifies active session status and checks `email_verified === 1`. Unverified users attempting to access protected resources (such as watchlists, saved scenarios, or administrative pipelines) receive an HTTP 403 response.
- **Profile Update Protection**: Ordinary profile-update APIs (`PUT /api/profile`) are explicitly restricted to non-sensitive preferences (display name, operating state, preferred commodities, alert channels) and cannot alter `email_verified` status.
- **Demo Personas**: Pre-seeded educational demo accounts (`farmer@kisanmandi.local`, `trader@kisanmandi.local`, `analyst@kisanmandi.local`) are pre-verified (`email_verified = 1`) to ensure zero friction during academic viva demonstrations.

### D. Rate Limiting & Account Enumeration Defense
- **Strict Rate Limiting**: Registration (`/api/auth/register`), email verification (`/api/auth/verify-email`), and resend requests (`/api/auth/resend-verification`) are guarded by strict rate limiters (`rateLimiter(true)` enforcing threshold limits and HTTP 429 responses against brute-force attacks).
- **Anti-Enumeration Resend Response**: The resend endpoint returns a generic success message regardless of whether the email exists in the database or is already verified, preventing attacker user-enumeration probes.

---

## 3. Comprehensive Test Results

The platform test suite was executed against an isolated temporary SQLite database instance (`tests/platform.test.ts`), co-executing the Express backend and all security middleware.

| Test Case | Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1. Successful Registration** | Register new user with valid credentials | 201 Created, `requiresVerification: true` | 201 Created | **PASS** |
| **2. Invalid Token Verification** | Submit malformed/nonexistent verification token | 400 Bad Request | 400 Bad Request | **PASS** |
| **3. Valid Token Verification** | Submit valid verification token | 200 OK, `emailVerified: true` | 200 OK | **PASS** |
| **4. Token Reuse Protection** | Submit an already used verification token a second time | 400 Bad Request | 400 Bad Request | **PASS** |
| **5. Resend Verification** | Request resend verification email for unverified user | 200 OK | 200 OK | **PASS** |
| **6. Unverified Access Guard** | Attempt accessing protected endpoint with unverified token | 403 Forbidden | 403 Forbidden | **PASS** |
| **7. Profile Update Isolation** | Update profile preferences | 200 OK, `email_verified` unchanged | 200 OK | **PASS** |
| **8. JWT Signature Security** | Rejects forged `alg:none` and tampered tokens | 401 Unauthorized | 401 Unauthorized | **PASS** |
| **9. Strict Rate Limiting** | Exceed authentication/verification request threshold | 429 Too Many Requests | 429 Too Many Requests | **PASS** |
| **10. Python ML Unit Tests** | Run all unit tests for MLR, K-Means & Time Series | 7 Tests Passed | 7 Tests Passed | **PASS** |

---

## 4. Remaining Limitations & Production Deployment Guidelines

1. **SMTP Provider Dependency**: For live email delivery in production, administrators must configure valid SMTP credentials (`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=...`, `SMTP_PASS=...` with a Gmail App Password).
2. **Local Storage Limits**: SQLite storage (`./data/kisanmandi.db`) is optimized for single-node college major projects and local containers. For scaled multi-region production clusters, externalized PostgreSQL via Cloud SQL or Supabase can be provisioned.
