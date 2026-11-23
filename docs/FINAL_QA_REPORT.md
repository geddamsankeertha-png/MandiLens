# KisanMandi – Final Independent Quality Assurance & Verification Report

**Project**: KisanMandi – Mandi Price Predictor (Offline-First Student Major Project Edition)  
**Verification Scope**: Full codebase inspection, automated API/security/ML verification, offline execution testing, and bug remediation  
**Environment**: Node.js v22 (`node:sqlite`), Python 3.11 (`python-stdlib` ML fallback), Express + React 19 + Vite

---

## 1. Every Page Tested (All 14 Application Pages)

Verification across all 14 application pages was performed by inspecting `src/App.tsx`, `src/components/Navbar.tsx`, `src/components/PageAccessMatrix.tsx`, and every page component, verifying TypeScript types (`tsc --noEmit`), building the full production SPA bundle (`npm run build`), and exercising backing `/api/*` endpoints with live role tokens. *(Note: No headless Chromium/Playwright browser runner is installed in this sandbox; visual layout behavior is verified via JSX/Tailwind inspection, state/effect tracing, and strict compilation rather than live DOM click automation.)*

| # | Page Name | Route ID (`activeTab`) | Component(s) | Allowed Roles | Verified Behavior & Fixes |
|---|---|---|---|---|---|
| 1 | Home / Landing | `landing` | `LandingPage.tsx`, `PageAccessMatrix.tsx` | Public (All 5 roles) | Bilingual EN/TE hero, capabilities banner (`App.tsx` capabilities state fixed), clickable 14-page RBAC matrix. |
| 2 | About Project | `about` | `AboutPage.tsx` | Public (All 5 roles) | Honest SQLite + Python ML architecture overview, clear demonstration dataset attribution. |
| 3 | Commodity Price Explorer | `explorer` | `PriceExplorerPage.tsx` | Public (`limited` for Guest) | Historical prices from SQLite (`8,800` seeded rows), CSV export (`/api/prices/export` formula-safe), Telugu/English crop switching. |
| 4 | Register | `register` | `RegisterPage.tsx` | Public | Self-registration for `farmer`, `trader`, `analyst` only (no mandatory phone field/verification); server blocks `admin` (`403`). |
| 5 | Login | `login` | `LoginPage.tsx` | Public | Email/password SQLite verification + first-run `/api/auth/setup-admin` claim flow + memory-only Bearer & refresh tokens. |
| 6 | Farmer Dashboard | `farmer` | `FarmerDashboard.tsx` | Farmer, Admin | Mandi comparison cards, 1-day/7-day forecasts, net realization profit arithmetic, weather covariates, SQLite watchlist saving. Fixed cross-role callback target (`explorer`). |
| 7 | Trader Dashboard | `markets` | `TraderDashboard.tsx` | Trader, Admin | Inter-mandi arbitrage spread, procurement cost/wastage/break-even calculator, BUY/SELL/HOLD signals, saved scenarios persisted in SQLite. |
| 8 | Market Analyst Dashboard | `analytics` | `AnalystDashboard.tsx` | Analyst, Admin | Historical explorer, seasonality/volatility views, 30-day horizon forecast, CSV/summary exports; synced `activeTab` with `initialSection` prop. |
| 9 | Model Performance | `models` | `AnalystDashboard.tsx` (`initialSection="models"`) | Analyst, Admin | Displays Python ML metrics (MAE, RMSE, MAPE, R², Directional Accuracy, 95% CI coverage) & held-out backtesting series; fixed `PageAccessMatrix` `pageId` mapping to `'models'`. |
| 10 | Alerts & Notifications | `alerts` | `AlertsPage.tsx` | Authenticated Users | Role-filtered price spike/drop & outlier anomalies + admin broadcasts; fixed frontend mapping to preserve persisted SQLite `read` state. |
| 11 | Profile / Settings | `profile` | `ProfilePage.tsx` | Authenticated Users | Profile editing, password change (revokes prior refresh tokens), account deletion; removed hardcoded sample phone default. |
| 12 | Data Management | `data_management` | `AdminDashboard.tsx` (`initialTab="data"`) | Admin Only | Pipeline status, optional `DATA_GOV_IN_API_KEY`, quote-aware CSV upload with strict validation, missing/outlier audit reports, retrain & rollback triggers. Fixed `PageAccessMatrix` `pageId`. |
| 13 | User Management | `user_management` | `AdminDashboard.tsx` (`initialTab="users"`) | Admin Only | Inspect all SQLite users, update roles, activate/deactivate accounts, issue one-time password resets. Fixed `PageAccessMatrix` `pageId`. |
| 14 | System Logs | `system_logs` | `AdminDashboard.tsx` (`initialTab="logs"`) | Admin Only | Filterable audit trail (`USER_AUTH`, `AUTH_FAILURE`, `DENIED`, `ADMIN_ACTION`, `DATA_INGESTION`, `MODEL_ACTION`) verified free of secrets. Fixed `PageAccessMatrix` `pageId`. |

---

## 2. Every Workflow Tested (All 5 User Roles)

All 5 role journeys were executed end-to-end against an isolated SQLite database and live Express server in `tests/platform.test.ts` (9/9 integration & security test suites passed):

1. **Guest Workflow**:
   - Opens app (`GET /api/system/capabilities` -> `200`, confirms `offlineReady: true`, `8800` historical rows).
   - Explores historical series (`GET /api/prices/history?commodity=Tomato&market=Guntur&days=30`) and downloads CSV (`GET /api/prices/export` -> `200`, `text/csv`).
   - Views next-day, 7-day, and 30-day offline forecasts and model performance metrics (`200`).
   - Blocked (`401 Unauthorized`) from `/api/watchlists`, `/api/scenarios`, `/api/auth/me`, `/api/pipeline/status`, and `/api/admin/users`.
2. **Farmer Workflow**:
   - Registers via `/api/auth/register` (`201`, role `'farmer'`, no phone required) and logs in via `/api/auth/login` (`200`).
   - Fetches commodity recommendation & nearby mandi comparison (`/api/recommendation/farmer` -> net realization sorted best-first with transport adjustment).
   - Saves a market threshold to SQLite watchlists (`POST /api/watchlists` -> `201`), views alerts (`/api/alerts?role=farmer`), marks an alert read (`POST /api/alerts/read` -> `200`), and confirms `read: true` persists on re-fetch.
3. **Trader Workflow**:
   - Registers (`201`) and logs in as `'trader'`.
   - Fetches inter-mandi arbitrage & procurement advice (`/api/recommendation/trader` -> `BUY`/`SELL`/`HOLD` signal, gross spread, transport cost, net margin %, break-even selling price).
   - Unit-verifies profit/wastage/break-even calculator math (`₹20` purchase, `₹35` sell, `100` qty, `2%` wastage -> `98` effective units, `₹730` net profit).
   - Persists scenario to SQLite (`POST /api/scenarios` -> `201`), lists saved scenarios (`GET /api/scenarios` -> `200`), and deletes scenario (`DELETE /api/scenarios/:id` -> `200`).
4. **Market Analyst Workflow**:
   - Registers (`201`) and logs in as `'analyst'`.
   - Inspects historical series, 30-day forecasts, backtesting results across all 3 models (`/api/model-performance`), continuous monitoring & PSI drift (`/api/monitoring/metrics`), and pipeline data-quality audits (`/api/pipeline/missing-report`, `/api/pipeline/outliers`).
   - Confirmed blocked from admin-only endpoints (`/api/admin/users` -> `403 Forbidden`).
5. **Administrator Workflow**:
   - Completes first-run admin setup (`/api/auth/setup-admin` -> `201`), verified locked (`403`) on subsequent setup attempts.
   - Manages user status (`/api/admin/users/:id/status` -> Deactivate/Activate) and inspects user list.
   - Uploads valid quoted CSV (`/api/pipeline/upload-csv` -> `201`), runs quality gate (`/api/pipeline/validate-retrain` -> `passed: true`), retrains Python ML model (`/api/pipeline/retrain` -> new version stored in `model_registry`), and executes one-step rollback (`/api/pipeline/rollback` -> restores prior model version).
   - Inspects `/api/admin/audit-logs` and confirms all actions are logged without passwords, JWTs, or secrets.

---

## 3. Security Test Results

| Security Check | Test Case & Expected Outcome | Result |
|---|---|---|
| Invalid passwords | Login with wrong password returns HTTP `401` and logs `AUTH_FAILURE` | **PASS** |
| Expired JWT tokens | Signed HS256 token with `exp` in past rejected by `verifyToken()` and `GET /api/auth/me` (`401`) | **PASS** |
| Invalid JWT signatures | Tampered HS256 signature rejected (`null` / HTTP `401`) | **PASS** |
| `alg: none` rejection | Forged `{ alg: "none", typ: "JWT" }` token rejected in unit check and HTTP middleware (`401`) | **PASS** |
| Refresh-token reuse & fail-closed DB check | Rotating refresh token succeeds once (`200`); reusing old token fails (`401`); logout revokes token (`401`); `isRefreshTokenActive` fails closed | **PASS** |
| Unauthenticated watchlist access (Fixed) | Guest `GET /api/watchlists` previously fell back to demo user (`200`); tightened to `requireAuth()` -> `401` | **PASS** |
| Unauthorized admin API calls | Guest -> `401`; Farmer & Analyst -> `403 Forbidden` | **PASS** |
| Self-registration privilege escalation | `POST /api/auth/register` with `role: "admin"` rejected with `403 Forbidden` | **PASS** |
| SQL injection attempts | Parameterized queries store `"Guntur'); DROP TABLE historical_prices; --"` literally; `historical_prices` stays at `8,800` rows | **PASS** |
| Malformed & invalid CSV uploads (Fixed) | Missing required headers -> `400`; invalid dates, `modal <= 0`, or `min > max` across all rows -> `400` rollback | **PASS** |
| CSV export formula & comma escaping (Fixed) | Formula prefixes escaped (`'=`) and embedded commas RFC-quoted in `/api/prices/export` | **PASS** |
| Invalid price records | `validatePriceRecord()` rejects `modal_price > max_price` (`isValid: false`) | **PASS** |
| Missing authentication | All private routes (`/api/auth/me`, `/api/watchlists`, `/api/scenarios`, `/api/pipeline/*`, `/api/admin/*`) return `401` | **PASS** |
| Rate limiting | Strict auth limiter returns HTTP `429 Too Many Requests` after >25 attempts | **PASS** |
| Audit log hygiene | Verified zero occurrences of plaintext passwords or JWTs in `/api/admin/audit-logs` | **PASS** |
| Dependency audit (`bun audit`) | Found 2 transitive advisories (`@grpc/grpc-js@1.9.16`, 1 high, 1 low) from optional `firebase` dependency (disabled by default via `VITE_ENABLE_FIREBASE`) | **LOGGED** |

---

## 4. ML Verification Results (`ml/ml_engine.py` & `ml/test_ml.py`)

Verified via `python3 -m unittest ml/test_ml.py` (**7/7 tests passed**) and inspection of `ml/ml_engine.py` + `data/sample_agmarknet_prices.csv`:

- **Dataset Integrity**: `data/sample_agmarknet_prices.csv` contains **8,800** market rows across 10+ commodities and 10 mandis, all seeded into SQLite on initialization.
- **Chronological Splitting (No Leakage)**: Data is sorted by date and split strictly sequentially (70% train / 15% validation / 15% unseen holdout test). Tests assert `train_end_date < val_start_date` and `val_end_date < test_start_date`.
- **Honest Held-Out Metrics**: MAE, RMSE (`RMSE >= MAE` verified), MAPE, R², Directional Accuracy, and 95% CI coverage are evaluated strictly on held-out test observations across Multiple Linear Regression (Ridge OLS), Random Forest Regressor, and Seasonal Moving Average.
- **Zero-Price MAPE Bug Fix**: `compute_regression_metrics` previously divided by `max(1e-6, a)`, causing `0.0` actual prices to distort MAPE by `1e8`. Updated to filter `[abs(e) / abs(a) * 100.0 for a, e in zip(y_true, errors) if abs(a) > 1e-6]`, returning `0.0` if all actuals are zero.
- **Horizons & Confidence Intervals**: Recursive multi-step 1-day, 7-day, and 30-day forecasts share the exact 12-feature `build_feature_vector` pipeline (`v2.2.0`). 95% confidence bounds expand with forecast horizon uncertainty (`1.96 * val_resid_std * sqrt(day)`), verified wider at day 30 than day 7 and day 1.
- **Missing Values & Outliers**: Chronological forward-fill + series-median fallback imputes missing arrivals/rainfall/temp covariates; per-series IQR (`1.5x`) and Z-score (`|z| > 2.8`) anomalies are logged cleanly and winsorized during training.
- **Model Persistence & Rollback**: `runPairRetraining` writes/cleans temp CSVs inside `try/finally`, logs new versions into SQLite `model_registry`, and `/api/pipeline/rollback` restores prior active versions.
- **Demonstration Attribution**: Sample predictions and histories are explicitly tagged `data_origin: "sample_dataset_demonstration"` and `is_demonstration_data: true`, switching dynamically to `"sqlite_uploaded_or_live_dataset"` (`is_demonstration_data: false`) when trained or queried on uploaded/live rows.

---

## 5. Offline Test Results (`GEMINI_API_KEY="" DATA_GOV_IN_API_KEY=""`)

- **Command**: `GEMINI_API_KEY="" DATA_GOV_IN_API_KEY="" npm run test:all` -> **Exit Code 0** (`9/9` TypeScript tests + `7/7` Python ML tests).
- **Live Server Probe**: Booted `createApp()` with empty `GEMINI_API_KEY` and `DATA_GOV_IN_API_KEY` on isolated temporary SQLite DB; verified HTTP `200 OK` across all 12 core API routes (`/api/health`, `/api/system/capabilities`, `/api/commodities`, `/api/markets`, `/api/prices/history`, `/api/predict/next-day`, `/api/predict/7-day`, `/api/predict/30-day`, `/api/recommendation/farmer`, `/api/recommendation/trader`, `/api/model-performance`, `/api/alerts?role=farmer`).
- **Build & Type Check**: Both `npm run lint` (`tsc --noEmit`) and `npm run build` (`vite build`) pass cleanly without errors after all edits.

---

## 6. Bugs Discovered & Fixed During QA

1. **Unauthenticated Watchlist Read Fallback (`server.ts`)**: `GET /api/watchlists` used `optionalAuth` and fell back to `'usr_demo_farmer'`, exposing demo user watchlists to unauthenticated guests. Fixed to enforce `requireAuth()` and `req.user!.userId`.
2. **Zero-Price MAPE Division Blowup (`ml/ml_engine.py`)**: Dividing by `max(1e-6, a)` inflated MAPE when `modal_price == 0`. Fixed to exclude `abs(a) <= 1e-6` with safe `0.0` fallback.
3. **Malformed Dates & Hardcoded Demo Flag (`ml/ml_engine.py`, `server/mlEngine.ts`, `server.ts`)**: Invalid CSV dates could throw `ValueError` in forecast date parsing, and `data_origin` / `is_demonstration_data` stayed hardcoded `true` even after CSV uploads. Added strict date validation and dynamic provenance propagation across Python ML, recommendations, and `/api/prices/history`.
4. **CSV Upload Parsing & Validation Gaps (`server/dataPipeline.ts`)**: Naive `split(',')` broke on quoted values, accepted invalid dates and `min > max` or negative bounds, and returned `200/201` with `0` valid rows on all-invalid CSVs. Replaced with a quote-aware CSV parser, ISO calendar validation, price/arrival bounds checks, and `400` rollback when `validRows === 0`.
5. **Retrain Temp CSV Leak, Case Sensitivity & Test Cache Pollution (`server/mlRunner.ts`)**: Temp `.retrain_*.csv` files leaked on error, SQL filter was case-sensitive (`commodity = ?`), CSV cells lacked quoting, and isolated test runs could overwrite `data/ml_artifacts_cache.json`. Wrapped cleanup in `try/finally`, switched to `LOWER(...)`, escaped cells, and guarded cache writes during isolated test DB runs.
6. **CSV Export Formula & Comma Handling (`server.ts`)**: `/api/prices/export` joined fields without escaping commas or spreadsheet formula prefixes (`=`, `+`, `-`, `@`). Added proper CSV cell quoting and prefix neutralization.
7. **Fail-Open Refresh Token DB Catch (`server/securityMiddleware.ts`)**: `isRefreshTokenActive()` returned `true` on DB exception instead of failing closed (`false`). Fixed to fail closed.
8. **Frontend Capabilities State Mismatch (`src/App.tsx`)**: `App.tsx` read `res?.capabilities` even though `/api/system/capabilities` returns flat JSON (`offlineReady`, `database`, etc.), keeping footer capabilities unset. Fixed to `res.capabilities || res`, and routed `onNavigateToCalculator` cleanly to `'explorer'` instead of `'markets'`.
9. **Stale Tab on `AnalystDashboard` Navigation (`src/components/AnalystDashboard.tsx`)**: Switching directly between `Market Analyst Dashboard` (`initialSection="home"`) and `Model Performance` (`initialSection="models"`) kept `AnalystDashboard` mounted with stale `activeTab`. Added `useEffect` sync.
10. **RBAC Matrix Wrong Route IDs (`src/components/PageAccessMatrix.tsx`)**: Matrix buttons pointed `Model Performance` to `'analytics'` and admin sub-pages to `'admin'` instead of `'models'`, `'data_management'`, `'user_management'`, and `'system_logs'`. Fixed all 4 route IDs.
11. **Alerts Read State Lost on Load (`src/components/AlertsPage.tsx`)**: Mapped API alerts with `read: false` instead of `Boolean(a.read)` from SQLite `notification_reads`. Fixed to preserve persisted read state.
12. **Profile Phone Default & Stale Subtitle (`src/components/ProfilePage.tsx`, `src/components/WatchlistManager.tsx`)**: Removed hardcoded default phone `+91 98480 22334` from `ProfilePage.tsx` and updated stale Firestore copy in `WatchlistManager.tsx`.

---

## 7. Files Modified

- `ml/ml_engine.py`
- `ml/test_ml.py`
- `server/securityMiddleware.ts`
- `server/mlRunner.ts`
- `server/dataPipeline.ts`
- `server/mlEngine.ts`
- `server.ts`
- `tests/platform.test.ts`
- `src/App.tsx`
- `src/components/AnalystDashboard.tsx`
- `src/components/PageAccessMatrix.tsx`
- `src/components/AlertsPage.tsx`
- `src/components/ProfilePage.tsx`
- `src/components/WatchlistManager.tsx`
- `docs/FINAL_QA_REPORT.md`
- `walkthrough.md`

---

## 8. Remaining Limitations

1. **Optional Dependencies Advisory**: `package.json` keeps `firebase` as an optional opt-in integration (`VITE_ENABLE_FIREBASE=false` by default). Its transitive `@grpc/grpc-js@1.9.16` dependency triggers 2 advisories in `bun audit`; removing `firebase` completely or upgrading it upstream eliminates those advisories if Firebase opt-in is not needed.
2. **ML Runtime**: Global Python in this environment uses the verified pure-Python stdlib fallback (`python-stdlib`) rather than C-accelerated `scikit-learn`/`pandas` unless those optional packages are installed via `pip`. Metrics and forecasts are deterministic and honest in both modes.
3. **Sample Dataset Scope**: By default, SQLite seeds 8,800 educational sample price rows (`is_demonstration_data: true`) rather than live mandi feeds unless `DATA_GOV_IN_API_KEY` is configured or custom CSV datasets are uploaded by an Admin.
4. **Legacy Standalone Components**: Unused helper components from earlier iterations (`CultivationCalculator.tsx`, `WatchlistManager.tsx`, `MandiMarketView.tsx`, `LiveCommoditiesHub.tsx`, `MobileSimulatorView.tsx`, `AuthModal.tsx`) remain in `src/components/` but are not mounted by the 14 primary routes in `src/App.tsx`.
5. **No Headless Browser Execution**: Interactive DOM click/layout screenshots were not executed because no headless Chromium binary is installed; all logic, routes, types, builds, and backend contracts are fully verified.

---

## 9. Exact Commands to Run the Application

```bash
# 1. Install Node dependencies
npm install

# 2. (Optional) Pre-initialize local SQLite database & precompute Python ML cache
npm run db:init
npm run ml:run

# 3. Run in offline development mode (zero paid API keys needed)
GEMINI_API_KEY="" DATA_GOV_IN_API_KEY="" npm run dev

# 4. Run full automated QA test suite (Node/SQLite + Python ML)
npm run test:all

# 5. Typecheck, build production SPA bundle, and start production server
npm run lint
npm run build
NODE_ENV=production npm start
```
