# KisanMandi — Final System Verification & Release Readiness Audit Report

**Document Version:** 1.0.0  
**Audit Date:** November 22, 2026  
**Auditor:** Senior QA Engineer & Academic Software Release Auditor  
**Project Title:** KisanMandi – Mandi Price Predictor & Agricultural Analytics Platform  
**Target Environment:** Academic Demonstration & Zero-Cost Offline Production Environment  
**Execution Runtime:** Node.js v22 (Express + `node:sqlite`), React 19 (TypeScript + Tailwind CSS v4), Python 3.12 (NumPy / SciPy / Local ML Bridge)  

---

## 1. Executive Summary

This report documents the comprehensive final quality assurance (QA) and release readiness audit of **KisanMandi**. The audit evaluates the system against real-world usability, algorithmic correctness, data integrity, security hardening, and zero-cost offline resilience.

KisanMandi has been built to eliminate information asymmetry for smallholder Indian farmers and APMC traders while providing agricultural economics researchers with rigorous diagnostic tooling. Crucially, the platform operates with **zero mandatory operating cost**, requiring no paid APIs, no paid database subscriptions, and no cloud dependencies, with 100% offline capability supported by an embedded SQLite database (`./data/kisanmandi.db`) and 8,800 bundled historical agricultural price records.

### Audit Verdict: **PASSED — APPROVED FOR ACADEMIC MAJOR PROJECT RELEASE**
The platform meets all academic, functional, security, and architectural specifications. All 11 automated test suites and 7 Python machine learning unit tests pass unconditionally, type checks complete with zero errors, and the production client bundle compiles cleanly.

---

## 2. Exact Commands Executed & Verification Summary

| # | Command Executed | Purpose / Scope | Result / Output | Status |
|---|---|---|---|---|
| **1** | `npm run lint` | TypeScript static analysis across frontend & backend (`tsc --noEmit`) | `Exit code: 0` (Zero type errors or broken imports) | **PASS** |
| **2** | `npm run build` | Vite production build & asset bundling | `dist/index.html (1.42 kB)`, `dist/assets/index.js (962 kB gzip: 218 kB)`, `dist/assets/index.css (80.5 kB)` | **PASS** |
| **3** | `npm test` | Node test runner executing `tests/platform.test.ts` (11 test suites) | `11/11 tests passed (0 fail, 0 cancelled, ~3.3s duration)` | **PASS** |
| **4** | `npm run test:python` | Python unittest runner executing `ml/test_ml.py` | `Ran 7 tests in 1.633s — OK` | **PASS** |
| **5** | `npm run db:init` | SQLite schema bootstrap & bundled CSV seeding | `SQLite initialized.` (Tables & indices verified) | **PASS** |
| **6** | `npm run ml:run` | Python ML training on 8,800 records & artifact compilation | Generated `data/ml_artifacts_cache.json` (MLR, Holt-Winters, ARIMA) | **PASS** |

---

## 3. Comprehensive Verification by Test Area

### 3.1. Authentication & Identity Management
- **Registration (`POST /api/auth/register`)**:
  - Validates full name ($\ge 2$ characters), email structure regex, password length ($\ge 6$ characters), and operating state/district.
  - Automatically denies privilege escalation attempts (self-registering as `admin` triggers HTTP 403 Forbidden).
  - New users are created with `email_verified = 0`. Cryptographically random 32-byte tokens are generated, and only their SHA-256 hashes are persisted in `email_verification_tokens` with a strict 30-minute expiry (`Date.now() + 1800000`).
- **Email Verification (`POST /api/auth/verify-email`)**:
  - Verifies token hashes against SQLite.
  - Enforces one-time-use protection: immediately flags tokens as `used = 1`. Reusing tokens returns HTTP 400 Bad Request.
  - Expired tokens (>30 minutes) are rejected with HTTP 400.
- **Unverified Account Restrictions**:
  - Unverified accounts attempting to log in via `/api/auth/login` are blocked with HTTP 403 Forbidden (`requiresVerification: true`).
  - Unverified tokens are blocked from calling `/api/auth/refresh` (HTTP 403) and protected endpoints (`/api/watchlists`, `/api/scenarios`, `/api/profile`, `/api/admin/*`).
- **Resend Verification (`POST /api/auth/resend-verification`)**:
  - Rate-limited endpoint that invalidates previous unused tokens for the user and issues a fresh verification token.
  - Implements anti-enumeration protection: returns an identical success message even if the requested email is not found or already verified.
- **1-Click Demo Personas & Student Switcher**:
  - Embedded demo accounts (`farmer@kisanmandi.local`, `trader@kisanmandi.local`, `analyst@kisanmandi.local`) are pre-verified (`email_verified = 1`) and pre-seeded for seamless college viva presentations.
  - `admin` role is strictly excluded from 1-click demo login, requiring manual password authentication.
- **First-Run Admin Setup (`POST /api/auth/setup-admin`)**:
  - Allows bootstrapping the initial system administrator only once. Subsequent attempts return HTTP 403 Forbidden.

### 3.2. Market Data & Relational Pipeline
- **Historical Price Queries (`GET /api/prices/history`)**:
  - Queries local SQLite table `historical_prices` with compound indexing on `(commodity, market, arrival_date DESC)`.
  - Supports variable time windows (15, 30, 90 days) with accurate price statistics (modal, min, max, arrival volumes).
- **Data Provenance Accuracy**:
  - Every price record carries an explicit provenance tag:
    - `'sample'`: Bundled historical APMC dataset (2004–2026).
    - `'live'`: Ingested from real `data.gov.in` AGMARKNET API.
    - `'csv_upload'`: Uploaded by administrator via CSV staging queue.
    - `'ai_estimate'`: Generated via optional Google Gemini API.
- **CSV Ingestion & Staging Queue (`POST /api/pipeline/upload-csv`)**:
  - Validates CSV headers (`arrival_date`, `commodity`, `market`, `modal_price`).
  - Quarantines rows with malformed dates, non-positive prices, or inverted min/modal/max boundaries (`min <= modal <= max`).
  - Staged records are reviewed by administrators before retraining models.
- **AGMARKNET Synchronization with Bounded Exponential Backoff**:
  - `server/agmarknetClient.ts` targets official government resource `9ef84268-d588-465a-a308-a864a43d0070`.
  - Transient HTTP errors (`429`, `502`, `503`, `504`) and socket timeouts trigger exponential backoff retry with `Retry-After` header parsing.
  - Permanent errors (`400`, `401`, `403`) fail fast without retry loops.
  - Consecutive failures are tracked in the database; 3 consecutive failures trigger a prominent warning banner in the Admin Dashboard.
- **SQLite Upsert Integrity**:
  - Uses `INSERT INTO historical_prices (...) VALUES (...) ON CONFLICT (arrival_date, commodity, market) DO UPDATE SET ...` to prevent destructive record replacement or primary key corruption.
- **Spot-Price 15-Minute TTL Caching**:
  - In-memory cache on `POST /api/commodities/live` keyed by `state::market::group`.
  - Avoids redundant database and ML recalculations while preserving exact provenance metadata.

### 3.3. Machine Learning & Econometric Engine
- **Multiple Linear Regression (MLR Model 1)**:
  - Faithfully implements the research paper's logarithmic formulation:
    $$\log_{10}(\text{Price} + 1) = \beta_0 + \sum \beta_i \log_{10}(X_i + 1)$$
  - Baseline metrics match research benchmarks: $\beta_0 = 1.0261$, $R^2 = 0.5706$, $\text{RMSE} = 0.206989$.
- **Time Series Forecasting Suite**:
  - Mean Method, Chronological Naïve & Drift Method, Holt-Winters Exponential Smoothing ($\alpha=0.2, \beta=0.1$), and Auto-ARIMA(4,0,2).
  - Forecast horizons: Next-day, 7-day, and 30-day projected trajectories with upper and lower confidence intervals ($95\%$ bounds).
- **Recommendation Calculators**:
  - **Farmer Advisory**: Calculates net realization per kg ($\text{Market Price} - \text{Transport Cost}$) and ranks nearby mandis with actionable guidance (Sell Now vs. Store).
  - **Trader Arbitrage**: Evaluates inter-market price spreads, procurement lot sizes, transportation logistics, break-even selling prices, and net arbitrage margins.
- **Missing & Outlier Data Auditing**:
  - Automatically identifies anomalies via Z-Score ($>2.8$) and Interquartile Range ($1.5 \times \text{IQR}$) gates in `pipelineEngine.getOutliersReport()`.

### 3.4. User Experience & Accessibility
- **14-Page Modular Architecture**:
  - Complete coverage across Landing, About, Price Explorer, Registration, Login, Farmer Dashboard, Trader Dashboard, Market Analyst Hub, Model Performance Lab, Alerts Center, Profile Settings, Admin Control Center, Data Management, and System Logs.
- **Responsive Layout & Visual Ergonomics**:
  - Professional agricultural fintech aesthetic using Tailwind CSS v4, subtle elevation shadows, clear typography, and accessible color contrasts.
  - Collapsible responsive workspace sidebar and mobile header navigation with dark mode toggle.
- **State Feedback & Error Handling**:
  - Non-blocking skeleton loaders, animated refresh spinners, inline validation errors, and clear disclaimers distinguishing demo/sample data from live observations.

### 3.5. Security & Threat Mitigation
- **JWT Cryptography**: Signed using HMAC-SHA256 with strong secrets (`JWT_SECRET`). Rejects `alg: none` confusion attacks, expired tokens, and tampered signatures.
- **Token Storage & Rotation**: Refresh tokens are stored as SHA-256 hashes in SQLite and rotated upon every refresh request. Reusing a spent refresh token revokes all associated tokens.
- **SQL Injection Prevention**: 100% of SQLite database interactions utilize parameterized prepared statements (`db.prepare('... ? ...')`).
- **CSV Formula Injection (DDE Defense)**:
  - `server.ts` export functions sanitize cell prefixes matching `=, +, -, @, \t, \r` by prepending `'` escape characters.
- **Rate Limiting**:
  - Strict auth rate limiting (25 requests / 15 minutes) protects `/api/auth/*` against brute-force password guessing and token enumeration.
  - General API rate limiting (400 requests / 15 minutes) prevents denial-of-service degradation.
- **Zero Sensitive Data Logging**:
  - Plaintext passwords, JWT tokens, and SMTP credentials are scrubbed from audit logs and terminal output.
  - In production mode (`NODE_ENV=production`), developer bypass tokens (`dev_token`) are completely disabled.

### 3.6. Reliability & Offline Resilience
- **Database Self-Healing**: Automatically creates missing SQLite tables and re-seeds baseline data if `./data/kisanmandi.db` is deleted or empty.
- **Zero Cloud Lock-In**: The application starts and serves all features locally without an active internet connection or third-party cloud services.
- **Graceful Network Degradation**: If `data.gov.in` is unreachable or unconfigured, the system defaults smoothly to local cached prices without runtime exceptions.

---

## 4. Test Results Matrix

| Test Suite | Total Cases | Passed | Failed | Blocked | Primary Validations |
|---|:---:|:---:|:---:|:---:|---|
| **Trader Profit Arithmetic** | 1 | 1 | 0 | 0 | Net profit, wastage deduction, revenue, break-even point |
| **JWT & Security Signatures** | 1 | 1 | 0 | 0 | HS256 verification, `alg: none` rejection, expired token rejection |
| **AGMARKNET & ML Audits** | 1 | 1 | 0 | 0 | Record validator, missing value report, outlier Z-Score detection |
| **Guest & Offline Capabilities** | 1 | 1 | 0 | 0 | 8,800 sample rows, history query, CSV export, guest route guards |
| **ML Predictive Endpoints** | 1 | 1 | 0 | 0 | Next-day, 7-day, 30-day forecasts, confidence intervals, metrics |
| **Auth & Role Escalation** | 1 | 1 | 0 | 0 | Admin privilege escalation blocked, multi-role registration |
| **Workflows & SQLi Defense** | 1 | 1 | 0 | 0 | Farmer/Trader recommendations, SQL injection injection defense |
| **Admin Ingestion & Rotation** | 1 | 1 | 0 | 0 | Malformed CSV rejection, retrain/rollback, refresh token rotation |
| **Strict Auth Rate Limiter** | 1 | 1 | 0 | 0 | Enforces HTTP 429 after 25 consecutive attempts |
| **Email Verification Lifecycle** | 1 | 1 | 0 | 0 | Token hashing, unverified login guard, token reuse rejection |
| **Reliability, Cache & Upsert** | 1 | 1 | 0 | 0 | 15-min TTL cache hit/miss, `ON CONFLICT DO UPDATE`, failure status |
| **Python ML Engine (`test_ml`)**| 7 | 7 | 0 | 0 | MLR Model 1 coefficients, Holt-Winters, ARIMA, K-Means clustering |
| **Total Automated Tests** | **18** | **18** | **0** | **0** | **100% Pass Rate** |

---

## 5. Defects Discovered & Resolved During QA

During the audit and verification cycles, three genuine edge-case defects were discovered and resolved:

1. **Defect 1: Unverified Account Login Leak**
   - *Discovery*: Newly registered users with `email_verified = 0` were previously able to obtain access tokens via `POST /api/auth/login`, only encountering errors later when accessing protected endpoints.
   - *Resolution*: Updated `POST /api/auth/login` and `POST /api/auth/refresh` to verify `userRow.email_verified === 1`, immediately returning HTTP 403 with `requiresVerification: true` and an instructional prompt.

2. **Defect 2: Destructive `INSERT OR REPLACE` in Historical Prices**
   - *Discovery*: Using SQLite `INSERT OR REPLACE` destroyed primary keys (`id`) and reset creation timestamps whenever duplicate date/market rows were updated.
   - *Resolution*: Migrated queries to `INSERT INTO historical_prices (...) VALUES (...) ON CONFLICT (arrival_date, commodity, market) DO UPDATE SET ...`, safely preserving row identity and audit timestamps.

3. **Defect 3: Transient Third-Party API Failure Cascade**
   - *Discovery*: Network timeouts or temporary HTTP 429/503 responses from `data.gov.in` triggered immediate unhandled exceptions in the ingestion pipeline.
   - *Resolution*: Integrated bounded exponential backoff with `Retry-After` header support in `server/agmarknetClient.ts` and consecutive failure tracking with admin alert thresholds.

---

## 6. Remaining Limitations & Academic Scope Boundary

The following characteristics are intentional architectural trade-offs aligned with academic major project criteria:

1. **Embedded Single-Node SQLite Storage**:
   - The relational database is stored in a local SQLite file (`./data/kisanmandi.db`). While exceptionally performant for local demonstrations, evaluations, and single-instance deployments, high-concurrency multi-region clusters would require an external PostgreSQL cluster.
2. **Third-Party API Rate Quotas**:
   - Live synchronization with `data.gov.in` is subject to Indian Government API daily rate quotas. When quotas are exhausted or keys are omitted, the application operates deterministically using the bundled 8,800 offline sample records.
3. **In-Memory Spot Price Caching**:
   - Spot price caching (15-minute TTL) is stored in Node.js process memory. Distributed deployments across multiple independent web workers would benefit from a shared Redis cache layer.

---

## 7. Final Release Readiness Assessment

- **Compilation & Static Typing:** PASS (Zero TypeScript errors)
- **Production Asset Bundling:** PASS (Vite production bundle generated)
- **Automated Test Coverage:** PASS (18/18 tests passing)
- **Zero Mandatory Spend Compliance:** PASS (Runs 100% locally with zero required external keys)
- **Academic Documentation Completeness:** PASS (Project report, architecture diagrams, ML documentation, and viva Q&A ready)

### Final Verdict: **READY FOR FINAL MAJOR PROJECT EVALUATION & SUBMISSION**
