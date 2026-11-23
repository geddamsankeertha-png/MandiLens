# KisanMandi – Academic Project Presentation Outline & Screenshot Capture Guide

---

## Part A: 14-Slide Viva & Seminar Presentation Outline

### Slide 1 — Title Slide
- **Title**: KisanMandi – Offline-First Agricultural Mandi Price Predictor & Decision Support System
- **Subtitle**: Full-Stack Web & Machine Learning Major Project (React 19 + Express + SQLite + Python ML)
- **Key Highlights**: Zero Mandatory Paid APIs · 5 User Roles · 14 Pages · EN/Telugu Interface

### Slide 2 — Introduction & Agricultural Context
- Price volatility in Indian APMC mandis forces distress selling by smallholder farmers and exposes traders to transit-margin losses.
- Existing national portals provide tabular daily quotes (`₹/quintal`) without decision guidance, bilingual accessibility, net transport realization math, or multi-horizon forecasting.

### Slide 3 — Problem Statement & Limitations of Existing Systems
- Lack of per-kg clarity alongside wholesale quintal prices.
- No integrated transport-adjusted net realization comparison across nearby mandis.
- Proprietary/cloud-coupled student prototypes fail offline or fabricate static prediction accuracy scores.

### Slide 4 — Project Objectives & Student-Friendly Scope
- Build an offline-capable, zero-cost full-stack system powered by `node:sqlite` and local Python ML.
- Support 5 roles (`Guest`, `Farmer`, `Trader`, `Analyst`, `Admin`), 14 routed views, 28 Indian states, 12 essential commodities, and optional `data.gov.in` AGMARKNET / Gemini overlays.
- Maintain strict academic honesty distinguishing demonstration sample series (`8,800` rows) from live market feeds.

### Slide 5 — System Architecture (Three-Tier Offline-First Design)
- **Presentation**: React 19 + TypeScript + Tailwind CSS (Vite).
- **Application**: Node.js v22 + Express (`server.ts`, port `3000`) with HS256 JWT Auth & RBAC.
- **Persistence & ML**: Built-in SQLite (`kisanmandi.db`, 11 tables) + `ml/ml_engine.py` (`ml_artifacts_cache.json`).

### Slide 6 — Database Design & Security Architecture
- 11 normalized SQLite tables (`users`, `refresh_tokens`, `historical_prices`, `model_registry`, `watchlists`, `saved_scenarios`, `notifications`, `notification_reads`, `datasets_queue`, `pipeline_runs`, `audit_logs`).
- Password security (`scryptSync` + `timingSafeEqual`), short-lived Bearer JWTs in React memory (`alg: none` rejected), rotating SQLite refresh tokens, strict auth rate limiting (`429`), and no mandatory phone/SMS gate.

### Slide 7 — Role-Based Access Control (5 Roles × 14 Pages)
- Visual walkthrough of the live `PageAccessMatrix` on the Landing Page.
- Guest (5 public/limited pages) vs Farmer, Trader, Analyst, and Admin privileges enforced on both frontend routes and Express middleware.

### Slide 8 — Farmer & Trader Decision Modules
- **Farmer**: Bilingual English & Telugu (`EN / తెలుగు`) toggle, sell-vs-hold badge, nearby mandi comparison subtracting distance transport cost, weather risk alert, watchlist targets.
- **Trader**: Procurement, transport, handling, and spoilage-wastage break-even calculator + inter-mandi arbitrage spread + saved scenarios in SQLite.

### Slide 9 — Dataset Description & Preprocessing Pipeline
- `data/sample_agmarknet_prices.csv`: **8,800** records spanning `2025-10-19` to `2026-11-22` across 12 commodities and 8 benchmark mandis (22 series × 400 days).
- Missing covariate forward-fill + median imputation (`44` missing arrivals, `99.92%` completeness) and per-series outlier auditing (`IQR 1.5x` & `|z| > 2.8`, `35` outliers winsorized).

### Slide 10 — Feature Engineering & ML Models (`v2.2.0`)
- Strictly causal `t-1` window generating 12 features (`lag_1d`, `lag_2d`, `lag_3d`, `lag_7d`, `rolling_7d_mean`, `rolling_14d_mean`, `rolling_14d_std`, `sin_doy`, `cos_doy`, scaled arrivals, rainfall, temperature).
- Side-by-side comparison of **Multiple Linear Regression (Ridge OLS, α=1.0)**, **Random Forest Regressor (24 trees / sklearn)**, and **7-Day Seasonal Moving Average**.

### Slide 11 — Chronological Evaluation & Honest Metrics
- 70% Train (`270` usable rows) / 15% Validation (`58`) / 15% Unseen Test (`58`) — zero shuffling leakage.
- Real observed results on demonstration series (e.g., *Tomato @ Guntur*: Ridge MLR MAE `₹0.969/kg`, RMSE `₹1.203/kg`, MAPE `3.5%`, $R^2$ `0.7556`, 95% CI coverage `94.8%`; *Rice @ Vijayawada*: MAE `₹0.229/kg`, MAPE `0.55%`, $R^2$ `0.7068`).
- Horizon uncertainty intervals widen monotonically via $1.96 \cdot \sigma_{val} \cdot \sqrt{h}$ across 1-day, 7-day, and 30-day forecasts.

### Slide 12 — Admin MLOps, Retraining, Rollback & PSI Drift
- CSV upload with quote-aware validation, pre-retraining quality gate (`< 5%` missing/outliers), live Python retraining to `model_registry`, one-step rollback, and Population Stability Index (PSI) drift monitoring.

### Slide 13 — Testing Methodology & Independent QA Results
- **9/9** Node.js integration & security tests passed (`npm test`).
- **7/7** Python ML `unittest` cases passed (`npm run test:python`).
- TypeScript `tsc --noEmit` & Vite production build (`npm run build`) clean with `GEMINI_API_KEY=""` and `DATA_GOV_IN_API_KEY=""`.

### Slide 14 — Limitations, Future Enhancements & Conclusion
- Honest discussion of synthetic demonstration series vs live multi-year APMC feeds, pure-Python stdlib fallback vs `scikit-learn` acceleration, and roadmap (district weather APIs, automated scheduled AGMARKNET sync, deep-learning LSTM benchmarks).

---

## Part B: Screenshot Capture Checklist (From Live Local App)

Do **not** fabricate or edit screenshots. Start the local server (`npm run dev`), open `http://localhost:3000`, and capture actual browser screenshots for all 14 pages + key workflows in the order below:

| Screenshot # | Page / Screen to Capture | User Role Used | Exact UI State to Show Before Capturing |
|---|---|---|---|
| `Fig-01` | **Home / Landing Page** | Guest | Full hero section, Offline SQLite + Python ML badge, and scrolled **14-Page RBAC Access Matrix** (`PageAccessMatrix`). |
| `Fig-02` | **About Project Page** | Guest | Methodology cards showing chronological 70/15/15 split and demonstration data provenance notice. |
| `Fig-03` | **Commodity Price Explorer** | Guest | Filter set to `Tomato` in `Andhra Pradesh / Guntur`, price history chart + tabular records + `Export CSV` button. |
| `Fig-04` | **Register Page** | Guest | Registration form showing role selection (`Farmer`, `Trader`, `Analyst`) with zero mandatory phone verification. |
| `Fig-05` | **Login & First-Run Admin Claim** | Guest | Email/password sign-in form (and first-run Admin setup banner on a fresh database). |
| `Fig-06a` | **Farmer Dashboard (English)** | Farmer | `Tomato @ Guntur` selected showing `Sell/Hold Advice` badge, nearby mandi transport-adjusted table, and watchlist button. |
| `Fig-06b` | **Farmer Dashboard (Telugu / తెలుగు)** | Farmer | Language toggle switched to `తెలుగు`, showing translated crop names, advice banners, and weather alert. |
| `Fig-07` | **Trader Dashboard** | Trader | Arbitrage signal (`BUY`/`SELL`/`HOLD`), Procurement/Wastage/Break-Even Calculator result, and Saved Scenarios list. |
| `Fig-08` | **Market Analyst Dashboard** | Analyst | Historical price explorer + 30-day recursive forecast chart with widening 95% confidence bands. |
| `Fig-09` | **Model Performance Leaderboard** | Analyst | 3-model comparison table (Multiple Linear Regression vs Random Forest vs Seasonal Moving Average) + holdout backtest chart. |
| `Fig-10` | **Alerts & Notifications Page** | Farmer / Admin | Role-filtered price-rise/drop warnings + outlier alert card showing `Mark as Read` state update. |
| `Fig-11` | **Profile / Settings Page** | Farmer | Personal profile details, preferred commodities selector, language selector, and password update panel. |
| `Fig-12` | **Admin – Data Management & Retrain** | Admin | CSV Upload Staging Queue, Missing-Value & Outlier audit reports, and Model Registry with Retrain / Rollback actions. |
| `Fig-13` | **Admin – User Management** | Admin | User directory table showing role assignment dropdowns, `Active / Deactivated` toggles, and temporary password reset dialog. |
| `Fig-14` | **Admin – System Audit Logs** | Admin | Audit log viewer filtered by `MODEL_ACTION` / `DENIED` showing real SQLite trail without any leaked secrets. |
