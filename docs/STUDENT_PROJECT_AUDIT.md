# KisanMandi – Student Project Audit Report

**Project:** KisanMandi – Mandi Price Predictor & Agricultural Market Intelligence Platform  
**Audit Date:** Pre-Transformation Baseline Review  
**Objective:** Audit the repository prior to transforming it into a zero-cost, offline-capable, academically rigorous, and security-hardened college major project.

---

## 1. Executive Summary

The repository provides a rich React 19 + TypeScript + Express web application supporting 5 user roles (`guest`, `farmer`, `trader`, `analyst`, `admin`), a 14-page Role-Based Access Control (RBAC) architecture, bilingual Telugu/English Farmer guidance, all 28 Indian states, 12 monitored essential commodities, cultivation calculators, trader arbitrage tools, and analyst views.

However, the baseline codebase has several **critical architectural, machine learning, security, and dependency issues** that prevent it from running cleanly as an honest, zero-cost, offline-first student project:

1. **Mandatory External Cloud Coupling (Firebase & Cloud Keys):** `src/lib/firebase.ts` unconditionally initializes Firebase App/Auth/Firestore using `firebase-applet-config.json`, while `src/App.tsx`, `src/components/WatchlistManager.tsx`, `src/components/CultivationCalculator.tsx`, and `src/services/marketSyncService.ts` depend on Firebase Auth listeners for cloud persistence. There is no local SQLite database.
2. **Fabricated / Hardcoded ML & Evaluation Metrics:** `server/mlEngine.ts` uses hardcoded multipliers and exact `if (commodity === 'Tomato' && market === 'Guntur')` overrides alongside static `getModelPerformanceMetrics()` (`XGBoost R² = 0.942`). Similarly, `server/dataPipeline.ts` returns static `14,250` row counts and hardcoded `v1.5 (r2: 0.95)` retraining output, and `server/modelMonitoring.ts` returns 3 static rows instead of computed metrics from an actual dataset.
3. **Critical Authentication & Authorization Flaws:**
   - `POST /api/auth/login` in `server.ts` accepts any password without verification and honors arbitrary client-supplied `role` values (including `admin`), issuing valid signed JWTs for privilege escalation.
   - `server/securityMiddleware.ts` falls back to a hardcoded string `'kisan_mandi_secure_default_secret_key_2026'` instead of a runtime cryptographically random secret when `JWT_SECRET` is unset.
   - `/api/pipeline/*` and `/api/monitoring/*` routes lack `requireAuth(['admin'])` middleware.
   - `src/components/LoginPage.tsx` writes JWTs and user objects to `localStorage` and falls back to fabricated client-side sessions on failure.
   - Personal admin email (`geddamsankeertha9@gmail.com`) and 1-click admin persona switching are hardcoded into `src/App.tsx` and `src/components/AdminDashboard.tsx`.
4. **Hardcoded API Key & Misleading Live Labels:** `server/dataPipeline.ts` includes a hardcoded fallback key (`DATA_GOV_IN_API_KEY`) and falls back to `14250` mock records while labeling them as live. Gemini calls in `server.ts` target `'gemini-3.8-flash'` without clearly marking outputs as AI estimates when enabled.
5. **Browser Dialog Violations (`alert` / `confirm`):**
   - `src/components/PriceExplorerPage.tsx` (`alert`)
   - `src/components/AnalystDashboard.tsx` (`alert`)
   - `src/components/ProfilePage.tsx` (`alert`)
   - `src/components/AdminDashboard.tsx` (`confirm`)
   These break embedded iframe previews and degrade keyboard/screen-reader accessibility.
6. **Non-Persistent Admin & Profile State:** User edits, password changes, CSV uploads, model promotions/rollbacks, watchlists, and alert read-states are stored only in volatile React state or browser `localStorage` rather than a relational database.
7. **Legacy/Partially Unused Components:** Multiple prototype components (`AnalyticsLab.tsx`, `EdaExplorer.tsx`, `LiveCommoditiesHub.tsx`, `MandiMarketView.tsx`, `MobileSimulatorView.tsx`, `RegressionDiagnostics.tsx`, `TimeSeriesLab.tsx`) sit in `src/components/` alongside the newer 14-page dashboards without clear integration.

---

## 2. Repository Inventory

### Frontend (`src/`)
- **Core Entry & Routing:** `src/App.tsx`, `src/main.tsx`, `src/index.css`
- **Primary 14-Page Views:**
  - Public: `LandingPage.tsx`, `AboutPage.tsx`, `PriceExplorerPage.tsx`, `RegisterPage.tsx`, `LoginPage.tsx`
  - Role Dashboards: `FarmerDashboard.tsx`, `TraderDashboard.tsx`, `AnalystDashboard.tsx` (also serves `models`), `AdminDashboard.tsx` (serves `users`, `data`, `logs`, `monitoring`, `matrix`)
  - Shared Authenticated: `AlertsPage.tsx`, `ProfilePage.tsx`, `PageAccessMatrix.tsx`, `Navbar.tsx`
  - Sub-tools: `CultivationCalculator.tsx`, `WatchlistManager.tsx`, `AuthModal.tsx`
- **Legacy/Supplementary Components:** `AnalyticsLab.tsx`, `EdaExplorer.tsx`, `LiveCommoditiesHub.tsx`, `MandiMarketView.tsx`, `MobileSimulatorView.tsx`, `RegressionDiagnostics.tsx`, `TimeSeriesLab.tsx`
- **Services & Types:** `src/services/predictionApi.ts`, `src/services/predictiveEngine.ts`, `src/services/marketSyncService.ts`, `src/lib/firebase.ts`, `src/data/mandiData.ts`, `src/types/mandi.ts`

### Backend (`server.ts` & `server/`)
- `server.ts`: Express + Vite dev/prod server, auth routes, commodity/market endpoints, prediction endpoints, live Gemini spot price endpoints, pipeline/monitoring routes.
- `server/securityMiddleware.ts`: Custom HS256 JWT signing/verification (`alg: none` rejected), rate limiter, method allowlist, `requireAuth`.
- `server/secretManager.ts`: Environment-variable wrapper.
- `server/auditLog.ts`: In-memory audit log array (lost on restart).
- `server/mlEngine.ts`: Heuristic/hardcoded price generator & static backtest arrays.
- `server/featureStore.ts`: Feature transformation helper (v2.1.0), not connected to any real model trainer.
- `server/dataPipeline.ts`: AGMARKNET fetch wrapper + mock reports + static retrain/rollback state.
- `server/modelMonitoring.ts`: Static 3-row PSI/latency monitoring table.
- `server/agmarknetClient.ts`: Axios wrapper for `api.data.gov.in` resource `9ef84268-d588-465a-a308-a864a43d0070` + `validatePriceRecord`.

### Configuration & Tests
- `package.json`, `tsconfig.json`, `vite.config.ts`, `metadata.json`, `.env.example`, `render.yaml`, `firebase-applet-config.json`, `firebase-blueprint.json`, `firestore.rules`, `tests/platform.test.ts`

---

## 3. Baseline Verification Results (Before Modification)

- `npm test`: **8 / 8 tests passed** (`tests/platform.test.ts` — basic unit & token checks, no database or Express RBAC integration tests).
- `npm run lint` (`tsc --noEmit`): **0 errors**.
- `npm run build` (`vite build`): **Succeeded** in ~1.5s (bundled Firebase SDK unconditionally).
- **Runtime Environment Audit:**
  - Node.js `v22.23.2` includes built-in `node:sqlite` (`DatabaseSync`), enabling zero-C++-compilation local SQLite persistence.
  - Python `3.11.2` is available locally (`pandas`, `numpy`, `scikit-learn` can be installed via `pip` on student machines, and a zero-dependency stdlib fallback ensures offline ML execution even in restricted environments).

---

## 4. Remediation Plan

| Area | Baseline Defect | Planned Fix |
| :--- | :--- | :--- |
| **Database** | Firebase required; no local DB | Introduce SQLite (`data/kisanmandi.db` via `node:sqlite`) as default auto-initialized & seeded persistence; make Firebase strictly opt-in (`VITE_ENABLE_FIREBASE=true`). |
| **External APIs** | Gemini & AGMARKNET assume keys / pretend live | Make Gemini & AGMARKNET keys 100% optional. Remove hardcoded fallback API keys. Bundle rich CSV sample dataset (`data/sample_agmarknet_prices.csv`) and clearly label all data as `sample`, `cached`, `live`, `csv_upload`, or `ai_estimate`. |
| **Machine Learning** | Hardcoded multipliers & fake `R²=0.942` | Build real local Python ML engine (`ml/ml_engine.py`) with `pandas`, `numpy`, `scikit-learn` (+ pure-Python stdlib fallback): preprocessing, missing-value imputation, IQR/Z-score outlier detection, lag/rolling/seasonal features, chronological time-based split, Multiple Linear Regression baseline + Random Forest + Seasonal Baseline, genuine MAE/RMSE/MAPE/$R^2$, 1/7/30-day forecasts, and residual CIs. |
| **Authentication & Security** | Any password/role login, `localStorage` tokens, hardcoded admin email | Real `crypto.scryptSync` password hashing in SQLite `users` table; server-enforced roles & RBAC on all admin/analyst routes; in-memory Bearer token + CSRF-safe refresh; runtime-generated fallback JWT secret; HTTP security headers; remove hardcoded admin email & 1-click admin bypass; document safe demo credentials + first-run/env admin bootstrap. |
| **Frontend UX** | `alert()`/`confirm()`, static explorer table, unpersisted settings | Replace all browser dialogs with accessible modals/toasts; connect Price Explorer, Watchlist, Calculator, Profile, Alerts, and Admin Dashboard to live SQLite `/api/*` endpoints; preserve Telugu/English support, 28 states, 12 commodities, 14 pages, and all 5 roles. |
| **Testing & Docs** | 8 basic unit tests; minimal docs | Expand Node integration + Python `unittest` suites covering DB, Auth, RBAC, ML, forecasting, CSV upload/export, profit calculator, and offline startup; author complete installation, architecture, ML, and API documentation. |
