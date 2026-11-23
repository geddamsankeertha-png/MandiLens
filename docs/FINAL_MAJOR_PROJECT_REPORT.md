# KisanMandi – Mandi Price Predictor & Agricultural Market Intelligence System
## Academic Major Project Documentation

---

## 1. Cover Page (Template)

> **[INSTITUTION / UNIVERSITY LOGO PLACEHOLDER]**
>
> **A MAJOR PROJECT REPORT ON**
>
> # KISANMANDI – MANDI PRICE PREDICTOR & AGRICULTURAL MARKET INTELLIGENCE PLATFORM
>
> *Submitted in partial fulfillment of the requirements for the award of the degree of*  
> **BACHELOR OF TECHNOLOGY (B.Tech) / MASTER OF COMPUTER APPLICATIONS**  
> *in*  
> **[DEPARTMENT NAME — e.g., COMPUTER SCIENCE AND ENGINEERING]**
>
> **Submitted By:**  
> `[Student Name 1]` — `[Roll Number]`  
> `[Student Name 2]` — `[Roll Number]`  
> *(Adapt author details per college formatting guidelines)*
>
> **Under the Esteemed Guidance of:**  
> `[Guide Name, Designation]`  
>
> **[COLLEGE / UNIVERSITY NAME]**  
> **[CITY, STATE — PIN CODE]**  
> **Academic Year: 2025 – 2026**

---

## 2. Certificate (Template)

> **DEPARTMENT OF `[COMPUTER SCIENCE AND ENGINEERING]`**  
> **`[COLLEGE / UNIVERSITY NAME]`**
>
> ### BONAFIDE CERTIFICATE
>
> This is to certify that the major project work entitled **"KisanMandi – Mandi Price Predictor & Agricultural Market Intelligence Platform"** is a bonafide work carried out by **`[Student Name(s)]`** bearing Roll Number(s) **`[Roll Number(s)]`** in partial fulfillment of the requirements for the award of the degree of **`[B.Tech / M.Tech / MCA]`** in **`[Department]`** during the academic year **2025–2026**.
>
> The contents of this report and verified software implementation have been checked against source modules, SQLite schemas, local Python ML scripts, and automated test results, and have not been submitted to any other university or institution for the award of any degree.
>
> | | | |
> |---|---|---|
> | **Project Guide** | **Head of Department** | **External Examiner** |
> | `[Guide Name]` | `[HOD Name]` | `____________________` |
> | Date: `____________` | Date: `____________` | Date: `____________` |

---

## 3. Declaration

We hereby declare that the major project entitled **"KisanMandi – Mandi Price Predictor & Agricultural Market Intelligence Platform"** submitted to **`[College / University Name]`** is an authentic record of software engineering, machine learning, and security verification work carried out by us under the supervision of **`[Guide Name]`**. All source code modules, datasets, evaluation tables, and automated test results presented in this document reflect the actual repository implementation verified in `docs/FINAL_QA_REPORT.md`. Demonstration datasets are explicitly labeled as educational sample series and are not represented as live trading performance guarantees.

**Place:** `[City]`  
**Date:** `[Date]`  
**Signature(s):** `[Student Signature(s)]`

---

## 4. Acknowledgement

We express our sincere gratitude to **`[Principal Name]`**, **`[HOD Name]`**, and our project guide **`[Guide Name]`** for their continuous technical mentorship throughout this project. We thank the Ministry of Agriculture & Farmers Welfare (Government of India) and the Open Government Data (`data.gov.in`) AGMARKNET initiative for publishing structured market-price schemas (`9ef84268-d588-465a-a308-a864a43d0070`), as well as the open-source maintainers of React, Vite, Express, Node.js, SQLite, Python, NumPy, pandas, and scikit-learn. Finally, we acknowledge the agricultural research on Indian crop groups and cultivation inputs referenced in our platform data models.

---

## 5. Abstract

Agricultural price volatility across Indian Agricultural Produce Market Committee (APMC) mandis regularly exposes smallholder farmers to distress selling and places agricultural traders at margin risk. While public market portals publish tabular daily spot quotations in rupees per quintal, farmers and analysts lack integrated decision-support tools that combine multi-horizon forecasting, transport-adjusted market comparison, bilingual local-language accessibility, profit/wastage modeling, and offline reliability without costly cloud subscriptions.

**KisanMandi – Mandi Price Predictor** addresses these gaps through an offline-first, zero-mandatory-cost full-stack architecture built using **React 19, TypeScript, Tailwind CSS, Vite, Node.js v22 (`Express` + built-in `node:sqlite`), and a local Python ML engine (`ml/ml_engine.py`)**. The system supports **5 user roles** (`Guest`, `Farmer`, `Trader`, `Analyst`, `Admin`), **14 routed pages** guarded by server-side Role-Based Access Control (RBAC), metadata coverage across **28 Indian states**, **12 monitored commodities**, **bilingual English and Telugu (`తెలుగు`) farmer guidance**, and optional integration hooks for `data.gov.in` AGMARKNET daily feeds and Gemini AI when keys are provided.

By default, the platform automatically seeds a relational SQLite database (`data/kisanmandi.db`) with **8,800 sample market price rows** (`2025-10-19` to `2026-11-22` across 22 commodity–market pairs). The Python ML pipeline enforces strict chronological 70% training / 15% validation / 15% unseen test splits without look-ahead leakage, trains **Multiple Linear Regression (Ridge OLS, $\alpha = 1.0$)**, **Random Forest Regressor**, and a **7-Day Seasonal Moving Average** baseline on 12 versioned lag, rolling, seasonal, and arrival/weather covariates (`v2.2.0`), and produces recursive **Next-Day, 7-Day, and 30-Day forecasts** with widening validation-calibrated 95% confidence intervals. Independent post-transformation verification achieved **9/9 passing JavaScript/TypeScript platform & security tests**, **7/7 passing Python ML tests**, zero TypeScript lint errors, and clean Vite production compilation completely offline.

---

## 6. Table of Contents

1. Cover Page  
2. Certificate Template  
3. Declaration  
4. Acknowledgement  
5. Abstract  
6. Table of Contents  
7. List of Figures  
8. List of Tables  
9. Introduction  
10. Problem Statement  
11. Existing System  
12. Proposed System  
13. Project Objectives  
14. Scope of the Project  
15. Hardware and Software Requirements  
16. Feasibility Study  
17. System Architecture  
18. Module Descriptions  
19. Database Design  
20. Entity–Relationship (ER) Diagram  
21. Data Flow Diagrams (Level 0, Level 1, Level 2)  
22. UML Use-Case Diagram  
23. UML Activity Diagram  
24. UML Sequence Diagram  
25. Machine Learning Methodology  
26. Dataset Description  
27. Data Preprocessing  
28. Model Training and Evaluation  
29. Implementation Details  
30. Security Implementation  
31. Testing Methodology  
32. Test Results  
33. Screenshots of Actual Application Pages  
34. Limitations  
35. Future Enhancements  
36. Conclusion  
37. References  

---

## 7. List of Figures

| Figure No. | Title | Location |
|---|---|---|
| **Fig. 1** | High-Level Three-Tier Offline-First System Architecture | Section 17 & `docs/DIAGRAMS.md` |
| **Fig. 2** | 11-Table SQLite Entity–Relationship (ER) Diagram | Section 20 & `docs/DIAGRAMS.md` |
| **Fig. 3** | Level 0 Context Data Flow Diagram | Section 21.1 & `docs/DIAGRAMS.md` |
| **Fig. 4** | Level 1 Functional System Data Flow Diagram | Section 21.2 & `docs/DIAGRAMS.md` |
| **Fig. 5** | Level 2 Machine Learning & Retraining Data Flow Diagram | Section 21.3 & `docs/DIAGRAMS.md` |
| **Fig. 6** | Multi-Role UML Use-Case Diagram (5 Actors) | Section 22 & `docs/DIAGRAMS.md` |
| **Fig. 7** | Admin CSV Upload, Quality Gate & Model Retrain Activity Diagram | Section 23 & `docs/DIAGRAMS.md` |
| **Fig. 8** | Authenticated Forecast, Refresh Token Rotation & Watchlist Sequence Diagram | Section 24 & `docs/DIAGRAMS.md` |
| **Fig. 9** | Python Machine Learning End-to-End Pipeline Diagram | Section 25 & `docs/DIAGRAMS.md` |

---

## 8. List of Tables

| Table No. | Title | Section |
|---|---|---|
| **Table 1** | Comparison Between Existing Portals and Proposed KisanMandi System | Section 12 |
| **Table 2** | Minimum Development and Execution Environment Specifications | Section 15 |
| **Table 3** | 14-Page Application Routing and 5-Role RBAC Matrix | Section 18 |
| **Table 4** | 12 Monitored Essential Commodities & Configuration Metadata | Section 18 |
| **Table 5** | Summary of Implemented SQLite Database Tables (`server/database.ts`) | Section 19 |
| **Table 6** | Detailed Column Specification of Core Tables (`users`, `historical_prices`, `model_registry`) | Section 19 |
| **Table 7** | Engineered Feature Vector Specification (`FEATURE_SET_VERSION = v2.2.0`) | Section 25 |
| **Table 8** | Sample Demonstration Dataset Coverage (`data/sample_agmarknet_prices.csv`) | Section 26 |
| **Table 9** | Held-Out Test Evaluation Metrics on Demonstration Series (`data/ml_artifacts_cache.json`) | Section 28 |
| **Table 10** | Implemented Security Controls & Verified Test Cases | Section 30 |
| **Table 11** | Consolidated Automated & Offline Verification Summary (`docs/FINAL_QA_REPORT.md`) | Section 32 |
| **Table 12** | Required Screenshot Capture Matrix (`docs/PROJECT_PRESENTATION_OUTLINE.md`) | Section 33 |

---

## 9. Introduction

Agriculture employs a large share of India's rural workforce, yet farm-gate revenue remains vulnerable to sharp daily fluctuations across local APMC mandis. When harvest arrivals peak simultaneously in regional yards such as Guntur, Madanapalle, Kurnool, or Lasalgaon, spot prices frequently dip before recovering days later. Conversely, inter-mandi price spreads create profitable arbitrage opportunities for traders only when transport cost and perishability losses are quantified accurately.

**KisanMandi** is engineered as a complete decision-support web platform bridging historical mandi price analytics, explainable machine learning forecasts, role-tailored operational calculators, and accountable administrative governance. Crucially, unlike commercial demos that fail when API credits expire or cloud databases disconnect, KisanMandi operates out of the box with zero mandatory external services. Every user account, watchlist, trader scenario, audit trail, historical price record, and versioned ML run persists locally in SQLite while supporting optional live ingestion from Government of India Open Government Data (`data.gov.in`) AGMARKNET feeds.

---

## 10. Problem Statement

Smallholder farmers, agricultural traders, market analysts, and system administrators face four interconnected limitations in conventional agri-price systems:
1. **Raw Quotations Without Actionable Decisions**: Spot tables display `min_price`, `max_price`, and `modal_price` per quintal without computing whether holding inventory 2–3 days offsets perishability, or which nearby market delivers highest net realization after transport costs.
2. **Language & Accessibility Barriers**: English-only portals limit adoption among regional farmers (such as Telugu-speaking growers in Andhra Pradesh and Telangana).
3. **Opaque or Methodologically Flawed Forecasting**: Many academic prototypes either return hardcoded forecasts or evaluate models using randomly shuffled train/test splits that leak future prices into historical lag features.
4. **Cloud & API Lock-In for Student Demonstration**: Requiring paid cloud databases, mandatory SMS OTP gateways, or paid AI keys creates barriers to offline classroom execution, reproducible testing, and external viva evaluation.

---

## 11. Existing System

Conventional agricultural market portals (such as static AGMARKNET web tables and baseline prototype dashboards audited in `docs/STUDENT_PROJECT_AUDIT.md`) exhibit the following drawbacks:
- **Static Reporting Only**: Users can filter yesterday's market rates, but cannot run multi-horizon 1-day, 7-day, or 30-day rolling forecasts with uncertainty bounds.
- **Zero Integrated Margin Calculators**: Traders must manually calculate lot procurement totals, handling overhead, transit losses (spoilage/wastage percentage), and break-even selling thresholds.
- **Audit Findings in Baseline Code**: Prior to transformation (`docs/STUDENT_PROJECT_AUDIT.md`), the legacy codebase coupled startup to Firebase, returned hardcoded multipliers (`R² = 0.942` without computation), lacked password hashing checks in `/api/auth/login`, relied on browser `alert()`/`confirm()` dialogs, and stored session tokens in `localStorage`.

---

## 12. Proposed System

The verified **KisanMandi** implementation introduces a clean, modular, offline-first architecture overcoming all baseline gaps:

| Dimension | Existing / Legacy Systems | Proposed KisanMandi System |
|---|---|---|
| **Database Layer** | Paid cloud DB or non-persistent UI state | Built-in zero-config SQLite (`node:sqlite`, 11 tables, WAL mode) auto-seeded with 8,800 rows |
| **Forecasting Engine** | Hardcoded static arrays or cloud-only APIs | Local Python ML (`ml/ml_engine.py`) with Ridge OLS, Random Forest, and 7-day SMA on 70/15/15 chronological splits |
| **Decision Guidance** | Raw quintal tables only | Farmer sell/wait advice (`EN`/`తెలుగు`), transport-adjusted nearby mandi rankings, Trader profit/break-even & arbitrage calculator |
| **Security & Auth** | Weak client checks / `localStorage` tokens | Server-side `scryptSync` password hashing, in-memory `HS256` JWTs (`alg: none` blocked), rotating SQLite refresh tokens, strict RBAC |
| **Data Transparency** | Blurred static and live figures | Explicit `data_origin` & `is_demonstration_data` provenance tracking across CSV, cache, and SQLite |
| **Cost & Portability** | Requires billing / internet access | Runs 100% locally offline (`GEMINI_API_KEY=""`, `DATA_GOV_IN_API_KEY=""`) after `npm install` |

*Table 1: Comparison Between Existing Portals and Proposed KisanMandi System*

---

## 13. Project Objectives

1. **Zero-Cost Offline Executability**: Ensure 100% of core routes, dashboards, calculators, logins, CSV exports, and ML forecasts execute cleanly without internet connectivity or paid API keys.
2. **Methodologically Honest Time-Series ML**: Eliminate look-ahead leakage via chronological splitting, shared deterministic feature builders (`v2.2.0`), transparent holdout metrics (`MAE`, `RMSE`, `MAPE`, $R^2$, directional accuracy), and widening residual confidence bounds.
3. **Role-Specific Agricultural Utility**: Deliver tailored interfaces across 5 roles (`Guest`, `Farmer`, `Trader`, `Analyst`, `Admin`) spanning 14 pages, 28 Indian states metadata, 12 commodities, and English/Telugu farmer guidance.
4. **Enterprise-Grade Security Hygiene**: Enforce server-side authorization, prepared SQL statements, password hashing, refresh rotation, rate limiting, CSV upload/export sanitization, and persistent audit logging without mandatory phone/OTP gates.
5. **Reproducible Verification**: Automate backend/security tests (`npm test`) and Python ML unit tests (`python3 -m unittest ml/test_ml.py`) plus comprehensive documentation ready for academic defense.

---

## 14. Scope of the Project

- **Geographical Metadata**: All **28 Indian states** categorized across 6 zones (`North`, `South`, `East`, `West`, `Central`, `North-East`) with regional capitals, major crops, rainfall indices, and named APMC mandis in `src/data/mandiData.ts`.
- **Commodity Coverage**: **12 essential commodities** (`Chilli`, `Cotton`, `Edible Oils`, `Milk`, `Onion`, `Potato`, `Rice`, `Salt`, `Sugar`, `Tomato`, `Toor Dal`, `Wheat`) covering vegetables, cereals, pulses, spices, oil seeds, fibre crops, livestock products, and essentials.
- **Historical & Demonstration Window**: Bundled dataset covers 400 continuous daily observations (`2025-10-19` to `2026-11-22`) across 22 benchmark `(commodity, market)` series (`8,800` records total), extensible by Admin CSV uploads or optional live `data.gov.in` AGMARKNET sync.
- **Out of Scope**: Real-money payment gateways, mandatory telecom SMS OTP verification, and automated financial brokerage execution.

---

## 15. Hardware and Software Requirements

| Category | Minimum Requirement | Verified Project Environment |
|---|---|---|
| **Processor** | Dual-core 64-bit x86 / ARM CPU (1.8 GHz+) | Cloud / Standard Student Laptop CPU |
| **RAM** | 2 GB minimum (4 GB recommended) | Tested comfortably under < 512 MB RSS |
| **Storage** | 300 MB free disk space | ~120 MB including `node_modules` & SQLite DB |
| **Operating System** | Windows 10/11, macOS 12+, or Linux (Ubuntu/Debian) | Linux container (`bash`) |
| **Node.js Runtime** | Node.js **v22.13+** (built-in `node:sqlite`) | Node.js `v22.23.2` + `npm` v10+ |
| **Python Runtime** | Python **3.10+** (`ml/ml_engine.py` stdlib-ready) | Python `3.11.2` (optional `pandas`, `numpy`, `scikit-learn`) |
| **Browser** | Modern Chromium / Firefox / Edge / Safari | Standards-compliant React 19 SPA |

*Table 2: Minimum Development and Execution Environment Specifications*

---

## 16. Feasibility Study

1. **Technical Feasibility**: Built on mature JavaScript/TypeScript tooling (React 19, Express 4) paired with Node v22's native `node:sqlite` (`DatabaseSync`), removing C++ compilation issues (`node-gyp`) common with legacy `better-sqlite3` setups. Similarly, `ml/ml_engine.py` uses `scikit-learn`/`pandas`/`numpy` when available and drops transparently to pure-Python stdlib linear algebra (`PurePythonRidgeOLS`) and tree bagging (`PurePythonRandomForest`) when offline without pip packages.
2. **Economic Feasibility**: Software stack, SQLite storage, and local execution cost **$0** with zero mandatory cloud subscriptions (`GEMINI_API_KEY=""`, `DATA_GOV_IN_API_KEY=""`, `VITE_ENABLE_FIREBASE="false"`). Free-tier deployment configuration is also ready via `render.yaml`.
3. **Operational Feasibility**: Single-command setup (`npm install && npm run dev`) automatically initializes SQLite schema, seeds sample price rows, populates demonstration user personas (`farmer`, `trader`, `analyst`), and prompts interactive first-run administrator setup without shipping hardcoded admin credentials.

---

## 17. System Architecture

KisanMandi follows a **Three-Tier Offline-First Monolith-with-Python-Bridge Architecture** served on port `3000` (`server.ts`):

1. **Presentation Tier (`src/`)**: React 19 + TypeScript + Tailwind CSS v4 Single-Page Application compiled with Vite (`npm run build` / dev `vite.middlewares`). Stores authentication state strictly in React memory (`predictionApi.ts`) with automatic silent refresh token rotation on `401`.
2. **Application & Security Tier (`server.ts`, `server/*.ts`)**: Express server exposing REST JSON endpoints behind security headers (`nosniff`, strict referrer/permissions policies), method allowlisting, JSON body caps (`512kb`), two-tier rate limiting (25 req/15m on auth routes; 400 req/15m general), HMAC-SHA256 JWT authentication, and RBAC guards (`requireAuth`).
3. **Persistence & Local ML Compute Tier (`server/database.ts`, `ml/ml_engine.py`, `data/`)**: Embedded SQLite database (`data/kisanmandi.db`) enabled with `WAL` mode and foreign keys, paired with precomputed Python ML artifacts cached in `data/ml_artifacts_cache.json` and refreshed dynamically via `execFileSync` during admin retraining.

*(Refer to **Fig. 1** in `docs/DIAGRAMS.md` Section 1 for the complete Mermaid System Architecture diagram.)*

---

## 18. Module Descriptions

### 18.1 Frontend Modules (`src/`) — 14-Page RBAC Architecture

| Page # | Page Name | Route ID | Primary Component(s) | Guest | Farmer | Trader | Analyst | Admin |
|---|---|---|---|---|---|---|---|---|
| 1 | Home / Landing | `landing` | `LandingPage.tsx`, `PageAccessMatrix.tsx` | Allow | Allow | Allow | Allow | Allow |
| 2 | About Project | `about` | `AboutPage.tsx` | Allow | Allow | Allow | Allow | Allow |
| 3 | Commodity Price Explorer | `explorer` | `PriceExplorerPage.tsx` | Limited | Allow | Allow | Allow | Allow |
| 4 | Register | `register` | `RegisterPage.tsx` | Allow | Allow | Allow | Allow | Allow |
| 5 | Login | `login` | `LoginPage.tsx` | Allow | Allow | Allow | Allow | Allow |
| 6 | Farmer Dashboard | `farmer` | `FarmerDashboard.tsx` | Deny | Allow | Deny | Deny | Allow |
| 7 | Trader Dashboard | `markets` | `TraderDashboard.tsx` | Deny | Deny | Allow | Deny | Allow |
| 8 | Market Analyst Dashboard | `analytics` | `AnalystDashboard.tsx` (`home`) | Deny | Deny | Deny | Allow | Allow |
| 9 | Model Performance | `models` | `AnalystDashboard.tsx` (`models`) | Deny | Deny | Deny | Allow | Allow |
| 10 | Alerts & Notifications | `alerts` | `AlertsPage.tsx` | Deny | Allow | Allow | Allow | Allow |
| 11 | Profile / Settings | `profile` | `ProfilePage.tsx` | Deny | Allow | Allow | Allow | Allow |
| 12 | Data Management | `data_management` | `AdminDashboard.tsx` (`data`) | Deny | Deny | Deny | Deny | Allow |
| 13 | User Management | `user_management` | `AdminDashboard.tsx` (`users`) | Deny | Deny | Deny | Deny | Allow |
| 14 | System Logs | `system_logs` | `AdminDashboard.tsx` (`logs`) | Deny | Deny | Deny | Deny | Allow |

*Table 3: 14-Page Application Routing and 5-Role RBAC Matrix (`src/App.tsx`, `src/components/PageAccessMatrix.tsx`)*

### 18.2 Monitored Commodity Catalog (`server/mlEngine.ts`)

| # | Commodity | Telugu Name (`name_te`) | Category | Base Price | Shelf Life (Days) |
|---|---|---|---|---|---|
| 1 | Tomato | టొమాటో | Vegetables | ₹36.0/kg | 4 |
| 2 | Onion | ఉల్లిపాయ | Vegetables | ₹25.0/kg | 30 |
| 3 | Potato | బంగాళాదుంప | Vegetables | ₹21.5/kg | 60 |
| 4 | Rice | బియ్యం (వరి) | Cereals | ₹42.0/kg | 365 |
| 5 | Wheat | గోధుమలు | Cereals | ₹26.5/kg | 365 |
| 6 | Toor Dal | కందిపప్పు | Pulses | ₹142.0/kg | 180 |
| 7 | Edible Oils | వంట నూనెలు | Oil Seeds | ₹136.0/litre | 180 |
| 8 | Sugar | చక్కెర | Other | ₹39.0/kg | 365 |
| 9 | Milk | పాలు | Live Stock/Poultry/Fisheries | ₹56.0/litre | 2 |
| 10 | Salt | ఉప్పు | Other | ₹16.0/kg | 720 |
| 11 | Cotton | పత్తి | Fibre Crops | ₹71.0/kg | 240 |
| 12 | Chilli | ఎండుమిర్చి | Spices | ₹182.0/kg | 180 |

*Table 4: 12 Monitored Essential Commodities & Configuration Metadata*

### 18.3 Backend & ML Subsystems
- **Authentication & Security (`server/securityMiddleware.ts`, `server/secretManager.ts`, `server/auditLog.ts`)**: `HS256` token signing/verification, SQLite-backed refresh rotation, two-tier rate limiter, and persistent `audit_logs` writer.
- **ML Inference Bridge (`server/mlEngine.ts`, `server/mlRunner.ts`, `server/featureStore.ts`)**: Serves next-day, 7-day, and 30-day trajectories, Farmer/Trader recommendations, nearby mandi transport comparisons (`MARKETS` catalog with `price_multiplier` and distance factors), and dynamic SQLite fallback queries.
- **Pipeline, CSV & AGMARKNET Client (`server/dataPipeline.ts`, `server/agmarknetClient.ts`)**: Quote-aware CSV ingestion, date/price validation, quality gate checks (`validateDataQualityForRetraining`), one-step model rollback, and optional `data.gov.in` resource `9ef84268-d588-465a-a308-a864a43d0070` fetcher.
- **Continuous Model Monitoring (`server/modelMonitoring.ts`)**: Dynamically computes 5-bin **Population Stability Index (PSI)** comparing earliest 75% baseline modal prices vs latest 25% prices and evaluates staleness hours.

---

## 19. Database Design

All persistence is implemented in `server/database.ts` via SQLite (`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`).

| # | Table Name | Primary Key | Key Columns & Purpose |
|---|---|---|---|
| 1 | `users` | `id` | Credentials (`scryptSync`), role check (`farmer`/`trader`/`analyst`/`admin`), regional prefs, `status` (`Active`/`Deactivated`) |
| 2 | `refresh_tokens` | `token_hash` | SHA-256 hashed refresh tokens, `user_id`, `expires_at`, `revoked` flag for rotation |
| 3 | `historical_prices` | `id` (`AUTOINCREMENT`) | `arrival_date`, `state`, `district`, `market`, `commodity`, `min/max/modal_price`, `arrival_tonnes`, `rainfall_mm`, `temp_c`, `data_source`; `UNIQUE (arrival_date, commodity, market)` + covering index `idx_prices_lookup` |
| 4 | `model_registry` | `id` | Versioned runs per `(commodity, market)`: `algorithm`, `feature_set_version`, `hyperparameters`, `mae`, `rmse`, `mape`, `r2`, `directional_accuracy`, `status` (`Active`/`Archived`/`RolledBack`), `data_origin` |
| 5 | `watchlists` | `id` | User target alerts (`user_id`, `state`, `market`, `commodity`, `target_price`, `alert_condition`) |
| 6 | `saved_scenarios` | `id` | Saved profit/cultivation scenarios (`user_id`, `crop_group`, `crop_name`, `inputs_json`, `predicted_price_quintal`, `predicted_price_tonne`) |
| 7 | `notifications` | `id` | Role-targeted advisories (`role_target`, `alert_type`, `risk_level`, `message`, `is_disabled`) |
| 8 | `notification_reads` | `(user_id, alert_id)` | Tracks per-user read timestamps cleanly across sessions |
| 9 | `datasets_queue` | `id` | Tracks sample baseline and uploaded CSV staging (`rows_count`, `missing_pct`, `duplicate_rows`, `status`) |
| 10 | `pipeline_runs` | `id` (`AUTOINCREMENT`) | Audit history of offline/live AGMARKNET ingestion jobs |
| 11 | `audit_logs` | `id` | Timestamped security & admin ledger (`USER_AUTH`, `AUTH_FAILURE`, `DENIED`, `ADMIN_ACTION`, `DATA_INGESTION`, `MODEL_ACTION`) |

*Table 5: Summary of Implemented SQLite Database Tables (`server/database.ts`)*

### Core Schema Field Details

| Table | Column | Data Type & Constraints | Purpose |
|---|---|---|---|
| `users` | `id`, `email`, `password_hash`, `role`, `status` | `TEXT PK`, `UNIQUE NOT NULL`, `CHECK role`, `CHECK status` | Identity, hashed credentials (`salt:64-byte hex`), RBAC enforcement |
| `historical_prices` | `arrival_date`, `market`, `commodity`, `modal_price`, `data_source` | `UNIQUE(arrival_date, commodity, market)`, `REAL NOT NULL` | Time-series daily market quotations (`sample`, `csv_upload`, `live`) |
| `model_registry` | `version`, `algorithm`, `mae`, `rmse`, `mape`, `r2`, `status` | `TEXT`, `REAL`, `CHECK status IN ('Active','Archived','RolledBack')` | Version tracking & one-step rollback support |

*Table 6: Detailed Specification of Core Database Columns*

---

## 20. Entity–Relationship (ER) Diagram

Refer to `docs/DIAGRAMS.md` (Section 2) for the full 11-table Mermaid ER diagram modeling relationships across `USERS`, `REFRESH_TOKENS`, `WATCHLISTS`, `SAVED_SCENARIOS`, `NOTIFICATIONS`, `NOTIFICATION_READS`, `HISTORICAL_PRICES`, `MODEL_REGISTRY`, `DATASETS_QUEUE`, `PIPELINE_RUNS`, and `AUDIT_LOGS`.

---

## 21. Data Flow Diagrams (Level 0, Level 1, and Level 2)

1. **Level 0 (Context DFD)**: Shows interactions between the five human actors (`Guest`, `Farmer`, `Trader`, `Market Analyst`, `System Administrator`), the optional external `data.gov.in` AGMARKNET feed, and the central `KisanMandi` process (`docs/DIAGRAMS.md` Section 3.1).
2. **Level 1 (System Decomposition DFD)**: Decomposes KisanMandi into 5 processes (`1.0 Authentication & RBAC`, `2.0 Data Ingestion & CSV Pipeline`, `3.0 Python ML Training & Forecasting`, `4.0 Market Explorer & Calculators`, `5.0 Monitoring, Alerts & Audit Engine`) connected to 5 SQLite/Cache data stores (`docs/DIAGRAMS.md` Section 3.2).
3. **Level 2 (ML Retraining & Forecast Sub-Process DFD)**: Traces SQLite export -> Preprocessing & Outlier Audit (`IQR` / `Z-score`) -> Feature Vector Construction (`v2.2.0`) -> 70/15/15 Split -> Model Fitting & Validation Calibration -> Recursive 30-Day Forecast -> Persistence in `model_registry` and `ml_artifacts_cache.json` (`docs/DIAGRAMS.md` Section 3.3).

---

## 22. UML Use-Case Diagram

Models all 14 system use cases grouped by actor role across public exploration, bilingual farmer advisory, trader procurement/arbitrage calculators, analyst backtesting/drift monitoring, and administrator MLOps/user management (`docs/DIAGRAMS.md` Section 4).

---

## 23. UML Activity Diagram

Illustrates the end-to-end administrative workflow: Admin verification -> CSV upload parsing & bounds checks -> HTTP `400` rollback vs SQLite staging -> Pre-retraining data quality gate (`< 5%` missing & outliers) -> Python retraining -> `model_registry` archival/activation -> optional one-step rollback (`docs/DIAGRAMS.md` Section 5).

---

## 24. UML Sequence Diagram

Details the chronological message exchange across `React SPA -> Express Server -> securityMiddleware -> SQLite -> mlEngine` for forecast queries followed by transparent handling of an expired 30-minute access JWT, `POST /api/auth/refresh` rotation in `refresh_tokens`, and successful watchlist persistence (`201 Created`) (`docs/DIAGRAMS.md` Section 6).

---

## 25. Machine Learning Methodology

KisanMandi treats agricultural mandi forecasting as a **causal supervised time-series regression problem**. All modeling code lives cleanly in `ml/ml_engine.py`, synchronized with `server/featureStore.ts` at `FEATURE_SET_VERSION = "v2.2.0"`.

### Engineered Feature Vector (`v2.2.0` — Strictly $t-1$ History, 14-Day Warmup)

| Index | Feature Name | Mathematical Formula / Definition | Purpose |
|---|---|---|---|
| 0 | `lag_1d` | $P_{t-1}$ | Short-term yesterday persistence |
| 1 | `lag_2d` | $P_{t-2}$ | Immediate 2-day momentum |
| 2 | `lag_3d` | $P_{t-3}$ | Mid-week autocorrelation |
| 3 | `lag_7d` | $P_{t-7}$ | Weekly mandi cycle effect |
| 4 | `rolling_7d_mean` | $\frac{1}{7}\sum_{k=1}^{7} P_{t-k}$ | Weekly smoothed trend level |
| 5 | `rolling_14d_mean` | $\frac{1}{14}\sum_{k=1}^{14} P_{t-k}$ | Bi-weekly baseline price level |
| 6 | `rolling_14d_std` | $\sqrt{\frac{1}{14}\sum_{k=1}^{14}(P_{t-k}-\bar{P}_{14})^2}$ | Short-term volatility indicator |
| 7 | `sin_doy` | $\sin\!\left(\frac{2\pi \cdot \text{day\_of\_year}}{365}\right)$ | Smooth annual cyclical seasonality |
| 8 | `cos_doy` | $\cos\!\left(\frac{2\pi \cdot \text{day\_of\_year}}{365}\right)$ | Orthogonal annual seasonal phase |
| 9 | `arrival_tonnes_scaled` | $\text{arrival\_tonnes} / 1000.0$ | Market supply arrival pressure |
| 10 | `rainfall_mm_scaled` | $\text{rainfall\_mm} / 100.0$ | Precipitation / harvest transit covariate |
| 11 | `temp_c_scaled` | $\text{temp\_c} / 35.0$ | Ambient temperature covariate |

*Table 7: Engineered Feature Vector Specification (`ml/ml_engine.py`)*

---

## 26. Dataset Description

The repository bundles `data/sample_agmarknet_prices.csv` so the project runs completely offline:

| Dataset Attribute | Verified Value (`sample_agmarknet_prices.csv`) |
|---|---|
| **Total Rows** | **8,800** daily market observations |
| **Date Range** | `2025-10-19` to `2026-11-22` (400 consecutive calendar days per series) |
| **Series Coverage** | **22 `(commodity, market)` pairs** spanning **12 commodities**, **8 mandis**, and **3 states** (`Andhra Pradesh`, `Maharashtra`, `Uttar Pradesh`) |
| **Dataset Completeness** | **99.92%** (`0` missing modal prices; `44` missing `arrival_tonnes` values across 8,800 rows to exercise imputation auditing) |
| **Outliers Present** | **35** extreme spike/drop records detected across per-series IQR/Z-score audits |
| **Provenance Tag** | `data_origin = "sample_dataset_demonstration"`, `is_demonstration_data = true` |

*Table 8: Sample Demonstration Dataset Coverage*

**Methodological Disclaimer**: When `DATA_GOV_IN_API_KEY` is provided and `/api/pipeline/trigger-fetch` or `/api/pipeline/upload-csv` ingests new records, SQLite tags those rows `live` or `csv_upload` (normalizing `₹/quintal` feeds `>= 400` into consistent `₹/kg` units) and dynamically flips `is_demonstration_data` to `false`.

---

## 27. Data Preprocessing

Implemented identically during both batch cache creation and Admin retraining (`preprocess_and_audit_series` in `ml/ml_engine.py`):
1. **Date & Target Validation**: Supports `YYYY-MM-DD` and `DD/MM/YYYY` formats, validates calendar legality (`datetime.strptime`), and filters rows lacking strictly positive `modal_price`.
2. **Chronological Deduplication**: Sorts by `(commodity, market, arrival_date)` and removes duplicate date keys while incrementing `duplicates_removed`.
3. **Chronological Covariate Imputation**: Missing `min_price` / `max_price` default to `0.9x` / `1.1x` `modal_price`. Missing covariates (`arrival_tonnes`, `rainfall_mm`, `temp_c`) are filled forward sequentially in date order using the preceding observed value (falling back to series median for leading gaps).
4. **Per-Series Outlier Auditing & Winsorization**: Computes quartile fences ($Q_1 - 1.5\cdot\text{IQR}$, $Q_3 + 1.5\cdot\text{IQR}$) and Z-score ($|z| > 2.8$) **independently per `(commodity, market)` pair** so expensive spices (`Chilli`) are never falsely flagged against staple vegetables (`Potato`). Detected spikes remain visible in `/api/pipeline/outliers`, while training series `clean_modal_price` is blended with the prior day and clamped to IQR fences to stabilize model weights.

---

## 28. Model Training and Evaluation

### 28.1 Chronological Partitioning (Zero Data Leakage)
With `warmup_days = 14`, each 400-day series yields **386** usable supervised samples partitioned strictly in calendar order (`ml/ml_engine.py:606-612`):
- **Training Split (First 70%)**: `270` samples (`2025-11-02` to `2026-07-29`, after warmup)
- **Validation Split (Middle 15%)**: `58` samples (`2026-07-30` to `2026-09-25`) — used solely to measure out-of-sample residual dispersion $\sigma_{\text{val}}$ for 95% confidence interval calibration.
- **Unseen Test Holdout Split (Final 15%)**: `58` samples (`2026-09-26` to `2026-11-22`) — untouched until final scoring.

### 28.2 Algorithms Explained
1. **Multiple Linear Regression (Ridge OLS Baseline)**: Minimizes $\|Xw - y\|_2^2 + \alpha \|w\|_2^2$ with $\alpha = 1.0$. Standardization ($z$-scoring each feature using training means/stds) and $L_2$ penalty neutralize multicollinearity among overlapping 1-day/2-day/7-day/14-day lag features.
2. **Random Forest Regressor**: Ensemble average of decision trees trained on bootstrap samples with random feature subsampling (`n_estimators = 24, max_depth = 5, min_samples_leaf = 3, max_features = 5` in `PurePythonRandomForest`; `n_estimators = 80, max_depth = 6` when `scikit-learn` is installed).
3. **7-Day Seasonal Moving Average (SMA Baseline)**: Non-parametric naive benchmark returning `rolling_7d_mean` (`feature[4]`) directly.

### 28.3 Evaluation Metrics & Observed Sample Results
- $\text{MAE} = \frac{1}{n}\sum |y_i - \hat{y}_i|$ (`₹/kg`)
- $\text{RMSE} = \sqrt{\frac{1}{n}\sum (y_i - \hat{y}_i)^2}$ (`₹/kg`, always $\ge \text{MAE}$)
- $\text{MAPE} = \frac{100\%}{m}\sum_{|y_i|>10^{-6}} \frac{|y_i - \hat{y}_i|}{|y_i|}$ (safely excludes zero-price actuals)
- $R^2 = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}$
- **95% Horizon Confidence Intervals**: $\hat{y}_{T+h} \pm 1.96 \cdot \sigma_{\text{val}} \cdot \sqrt{h}$ for $h = 1 \dots 30$ days.

| Series | Active Winning Model | MAE (₹/kg) | RMSE (₹/kg) | MAPE (%) | Test $R^2$ | Dir. Acc (%) | 95% CI Cov. (%) |
|---|---|---|---|---|---|---|---|
| **Tomato @ Guntur** | Multiple Linear Regression | 0.969 | 1.203 | 3.50% | 0.7556 | 67.2% | 94.8% |
| **Tomato @ Madanapalle** | Multiple Linear Regression | 1.269 | 1.550 | 4.11% | 0.8277 | 50.0% | 100.0% |
| **Onion @ Guntur** | Multiple Linear Regression | 0.585 | 0.706 | 2.35% | 0.8635 | 67.2% | 94.8% |
| **Onion @ Lasalgaon** | Multiple Linear Regression | 0.480 | 0.594 | 1.80% | 0.5185 | 62.1% | 98.3% |
| **Potato @ Agra** | Multiple Linear Regression | 0.491 | 1.092 | 2.93% | 0.0881 | 58.6% | 93.1% |
| **Rice @ Vijayawada** | Multiple Linear Regression | 0.229 | 0.277 | 0.55% | 0.7068 | 70.7% | 94.8% |
| **Chilli @ Guntur** | Multiple Linear Regression | 1.703 | 1.998 | 1.17% | 0.7009 | 67.2% | 100.0% |
| **Wheat @ Guntur** | Multiple Linear Regression | 0.186 | 0.240 | 0.65% | 0.5812 | 72.4% | 98.3% |
| **Cotton @ Guntur** | Multiple Linear Regression | 1.121 | 1.412 | 1.79% | -0.3399 | 63.8% | 87.9% |

*Table 9: Observed Chronological Holdout Test Metrics Across Representative Pairs (`data/ml_artifacts_cache.json`)*

**Note on Honest Results**: On `Tomato @ Guntur`, Ridge MLR (`RMSE = 1.203`) outperformed both Random Forest (`RMSE = 1.517`, $R^2 = 0.6116$) and the 7-day SMA baseline (`RMSE = 1.485`, $R^2 = 0.6276$). On highly volatile or near-flat segments like `Cotton @ Guntur` or `Potato @ Agra`, lower/negative $R^2$ values are reported authentically rather than fabricated—and prove why real-world deployment requires retraining on genuine multi-year APMC series.

---

## 29. Implementation Details

- **Project Entry (`server.ts`)**: Exposes `createApp()` and boots Vite dev middleware in development or serves `dist/` static assets in production on port `3000`. Exports `KISANMANDI_NO_AUTOSTART=1` support so integration tests run cleanly in-process on ephemeral ports (`127.0.0.1:0`).
- **REST API Endpoints**: 40+ documented routes grouped under `/api/health`, `/api/system/capabilities`, `/api/auth/*`, `/api/watchlists`, `/api/scenarios`, `/api/commodities/*`, `/api/prices/*`, `/api/predict/*`, `/api/recommendation/*`, `/api/alerts/*`, `/api/pipeline/*`, `/api/monitoring/*`, and `/api/admin/*`.
- **Frontend State & Calculators**:
  - `FarmerDashboard.tsx` calculates net realization across surrounding mandis (`predicted_tomorrow_price - transport_cost_per_kg`) and renders EN/Telugu decision advice.
  - `TraderDashboard.tsx` calculates procurement lot costs, handling fees, effective post-wastage sellable quantity ($Q \cdot (1 - w/100)$), net profit, margin percentage, and break-even price per kg, saving scenarios to SQLite.

---

## 30. Security Implementation

| Control Domain | Implementation Details | Verified QA Check |
|---|---|---|
| **Password Cryptography** | `crypto.scryptSync` with 16-byte random salt + `timingSafeEqual` | Wrong passwords return `401` and log `AUTH_FAILURE` |
| **Session & JWT Security** | Custom `HS256` tokens (`30m` access) held in React memory only; rejects `alg: none`, tampered signatures, and expired tokens; 7-day SQLite refresh rotation with fail-closed DB verification | Tested directly in unit & live HTTP tests (`401` on tampered, expired, `alg: none`, and reused refresh tokens) |
| **Server-Side RBAC & Bootstrap** | `requireAuth(allowedRoles)` queries SQLite live status & role; `/api/auth/register` blocks `admin` (`403`); `/api/auth/setup-admin` locks permanently after initial claim | Tested Guest (`401`), Farmer/Analyst (`403` on admin routes), Watchlists (`401` without auth) |
| **Injection & Input Hygiene** | Parameterized SQLite `.prepare().all/run()`; quote-aware CSV parser rejecting bad dates and `min > max`; formula escaping on `/api/prices/export` | SQLi strings stored harmlessly; malformed CSVs rolled back (`400`) |
| **Rate Limiting & Audit Trail** | 25 req/15m strict auth limiter (`429`); immutable `audit_logs` omitting plaintext passwords and JWTs | Rate limit verified hitting `429`; audit log JSON verified clean of secrets |
| **Optional Package Hygiene** | `bun audit` notes 2 advisories (`@grpc/grpc-js@1.9.16`) strictly inside optional `firebase` (disabled by default via `VITE_ENABLE_FIREBASE=false`) | Logged transparently in `docs/FINAL_QA_REPORT.md` & `walkthrough.md` |

*Table 10: Implemented Security Controls & Verified Test Cases*

---

## 31. Testing Methodology

Verification combined four complementary layers:
1. **Static Code & Type Audit**: End-to-end review of all frontend TSX views, Express routes, Python ML functions, and `tsc --noEmit` (`npm run lint`).
2. **Production Bundle Verification**: Full React + Vite bundling (`npm run build`).
3. **Node.js Platform & Security Integration Suite (`tests/platform.test.ts`)**: Runs live HTTP requests against `createApp()` backed by an isolated temporary SQLite database covering unit arithmetic, token attacks, SQL injection, CSV validation, all 5 user workflows, retrain/rollback, and `429` throttling.
4. **Python ML `unittest` Suite (`ml/test_ml.py`)**: Independently tests 8,800-row dataset loading, imputation/outlier handling, zero-price MAPE behavior, chronological split integrity, confidence interval scaling, feature determinism, and provenance tagging.

---

## 32. Test Results

| Verification Check | Command Executed | Observed Result |
|---|---|---|
| **Offline Platform & Security Suite** | `GEMINI_API_KEY="" DATA_GOV_IN_API_KEY="" npm test` | **9 / 9 Passed** (`100%`) |
| **Offline Python ML Test Suite** | `npm run test:python` (`python3 -m unittest ml/test_ml.py`) | **7 / 7 Passed** (`100%`) |
| **Offline Endpoint Live Probe** | Booted `createApp()` offline; queried 12 core GET routes | **12 / 12 HTTP 200 OK** |
| **TypeScript Static Check** | `npm run lint` (`tsc --noEmit`) | **0 Errors** |
| **Production Build** | `npm run build` (`vite build`) | **Succeeded cleanly** |

*Table 11: Consolidated Automated & Offline Verification Summary*

---

## 33. Screenshots of Actual Application Pages

To maintain academic integrity, screenshots must be captured directly from the running local application (`http://localhost:3000` via `npm run dev`) rather than fabricated. Use the checklist below (detailed UI states provided in `docs/PROJECT_PRESENTATION_OUTLINE.md`) when inserting figures into your college-bound hardcopy:

| Screenshot Ref | Page Name | Role | Verification State to Capture |
|---|---|---|---|
| `Fig-01` | Home / Landing Page | Guest | Offline status badge + clickable 14-page `PageAccessMatrix` |
| `Fig-02` | About Project Page | Guest | System methodology & demonstration dataset notice |
| `Fig-03` | Commodity Price Explorer | Guest | `Tomato @ Guntur` 30-day chart, table, and `Export CSV` control |
| `Fig-04` | Register Page | Guest | Role selector without phone verification gate |
| `Fig-05` | Login Page | Guest | Standard login + first-run admin bootstrap view |
| `Fig-06a/b` | Farmer Dashboard | Farmer | English & Telugu (`తెలుగు`) toggle, advice badge, nearby mandi comparison |
| `Fig-07` | Trader Dashboard | Trader | BUY/SELL signal, profit/wastage/break-even calculator, saved scenarios |
| `Fig-08` | Market Analyst Dashboard | Analyst | Historical series + 30-day forecast with widening CI bounds |
| `Fig-09` | Model Performance Page | Analyst | 3-model leaderboard (`MLR` vs `RF` vs `SMA`) + unseen test backtest |
| `Fig-10` | Alerts & Notifications | Farmer | Role-filtered price spikes & persistent `Mark as Read` state |
| `Fig-11` | Profile / Settings | Farmer | Profile editor, commodity preferences & password reset |
| `Fig-12` | Admin – Data Management | Admin | CSV upload queue, outlier/missing reports, retrain & rollback controls |
| `Fig-13` | Admin – User Management | Admin | User directory, role changes & account activation toggles |
| `Fig-14` | Admin – System Logs | Admin | Filtered security & model audit trail |

*Table 12: Live Application Screenshot Capture Checklist*

---

## 34. Limitations

1. **Demonstration Sample Series vs Live APMC Feeds**: Default predictions and metrics run over `sample_agmarknet_prices.csv` (`8,800` educational sample rows across 8 core mandis). Real-world trading requires sustained ingestion of live `data.gov.in` records across multiple years.
2. **Python Scientific Acceleration Optionality**: In minimal environments lacking `scikit-learn`/`pandas`, the pure-Python stdlib engine executes cleanly (`python-stdlib`), though `scikit-learn` offers faster tree training on very large uploaded datasets.
3. **Optional Firebase Dependency Advisory**: Retaining `firebase` in `package.json` for optional cloud opt-in introduces 2 upstream `@grpc/grpc-js@1.9.16` advisories (inactive unless `VITE_ENABLE_FIREBASE=true`).
4. **No Automated Browser DOM Screenshots in Sandbox**: UI verification relied on JSX/state inspection, API contract tests, TypeScript checks, and production bundling because headless Chromium was unavailable.

---

## 35. Future Enhancements

1. **Scheduled Daily AGMARKNET Sync Worker**: Automated cron-style background ingestion (with admin notification on upstream schema changes) when `DATA_GOV_IN_API_KEY` is configured.
2. **District-Level Weather API Grounding**: Integrating free Indian Meteorological Department (IMD) / Open-Meteo precipitation feeds into `rainfall_mm` and `temp_c` covariates during recursive 7-day/30-day roll-forwards.
3. **Additional Regional Languages**: Extending the EN/Telugu switcher cleanly to Hindi, Kannada, Tamil, and Marathi translation bundles.
4. **Conformal Prediction Intervals & Gradient Boosting Benchmarks**: Benchmarking XGBoost/LightGBM alongside conformal quantile regression when `scikit-learn`/Python ML dependencies are installed.

---

## 36. Conclusion

**KisanMandi – Mandi Price Predictor** demonstrates that an academically rigorous, security-hardened agricultural intelligence system can be engineered with **zero mandatory operational cost**. By uniting a responsive 14-page React 19 interface, 5 role-based workflows, English and Telugu accessibility, built-in `node:sqlite` persistence (`8,800` seeded price rows across 11 tables), and an honest chronological Python ML pipeline, the application addresses real agricultural decision bottlenecks while maintaining full offline reproducibility and transparent verification (`16/16` passing automated tests).

---

## 37. References

*(Full bibliography provided in `docs/REFERENCES.md`)*

1. React 19 Documentation (`https://react.dev/`).
2. Vite Build Tool Documentation (`https://vite.dev/`).
3. Tailwind CSS v4 Documentation (`https://tailwindcss.com/docs`).
4. Express.js Web Framework (`https://expressjs.com/`).
5. Node.js v22 `node:sqlite` & `node:crypto` API Documentation (`https://nodejs.org/api/sqlite.html`).
6. Pedregosa et al., *Scikit-learn: Machine Learning in Python*, JMLR 12, 2011.
7. Hoerl & Kennard, *Ridge Regression: Biased Estimation for Nonorthogonal Problems*, Technometrics 12(1), 1970.
8. Breiman, L., *Random Forests*, Machine Learning 45(1), 2001.
9. Hyndman, R. J., & Athanasopoulos, G., *Forecasting: Principles and Practice* (3rd ed.), OTexts, 2021.
10. Government of India Open Government Data (`data.gov.in`) AGMARKNET Daily Mandi Price Resource (`9ef84268-d588-465a-a308-a864a43d0070`).
11. Taparia, S., Agricultural Market & Cultivation Input Taxonomy (referenced in `src/types/mandi.ts`).
12. IETF RFC 7519 (*JSON Web Token*) & RFC 7914 (*scrypt Key Derivation*).
13. Project Artifacts: `docs/STUDENT_PROJECT_AUDIT.md`, `docs/PROJECT_ARCHITECTURE.md`, `docs/ML_DOCUMENTATION.md`, `docs/API_DOCUMENTATION.md`, `docs/FINAL_QA_REPORT.md`, and `walkthrough.md`.
