# KisanMandi – Agricultural Mandi Price Predictor

> **Student-Friendly, Zero-Cost, Offline-First Major Project**  
> Built with React, TypeScript, Tailwind CSS, Express, SQLite (`node:sqlite`), and a local Python Machine Learning Engine.

---

## Key Highlights (Zero Mandatory Spending)

- **100% Free & Offline-Ready:** Runs locally after initial `npm install` with **no mandatory paid APIs, no cloud billing, no Firebase requirement, and no mandatory API keys**.
- **Built-in SQLite Database:** Uses Node.js 22 native `node:sqlite` (`./data/kisanmandi.db`) automatically initialized and seeded from `/data/sample_agmarknet_prices.csv` (8,800 rows across 22 commodity-market pairs and 400 days).
- **Genuine Local Python ML Forecasting Engine (`/ml/`):**
  - Chronological time-split training/validation/test evaluation (no random leakage).
  - Real Multiple Linear Regression (Ridge OLS) & Bagged Decision-Tree Random Forest + 7-Day SMA Baseline.
  - Supports both `pandas`/`numpy`/`scikit-learn` (when installed) and a built-in pure-Python standard-library execution path (works with stock Python 3.10+!).
  - Outputs honest MAE, RMSE, MAPE, $R^2$, Directional Accuracy, 95% confidence intervals, Next-Day / 7-Day / 30-Day forecasts, and explicit **sample demonstration dataset** provenance notices.
- **Role-Based Platform (5 User Roles · 14 Pages):**
  1. **Guest:** Landing, About/Methodology, National Mandi Price Explorer (all 28 Indian states & 12 monitored commodities), CSV Export.
  2. **Farmer:** Bilingual English/Telugu Decision Support, Sell/Store Advice, Best Nearby Market Transport Calculator, Cultivation Cost Calculator, Weather Advisories, Saved Scenarios.
  3. **Trader:** Market Comparison & Arbitrage Ranking, Procurement Planner, Buy/Sell Signals, Net Profit & Break-Even Calculator, SQLite Watchlists.
  4. **Market Analyst:** Interactive Econometric Explorer, Next-Day/7-Day/30-Day Forecast Curves, Seasonality Decomposition, Supply-Demand Elasticity, Regional Price Heatmap, Volatility Anomalies, Model Backtesting Leaderboard.
  5. **Administrator:** SQLite User Directory & RBAC, CSV & Optional AGMARKNET Data Pipeline Staging Queue, Versioned ML Registry & One-Step Rollback, PSI Drift Monitoring, Advisory Alert Publisher, SQLite Security Audit Logs.
- **Optional External Integrations:**
  - `DATA_GOV_IN_API_KEY`: Optional AGMARKNET daily mandi feed (`resource/9ef84268-d588-465a-a308-a864a43d0070`).
  - `GEMINI_API_KEY`: Optional Gemini AI spot-estimate overlay (explicitly labeled as an AI estimate).
  - `VITE_ENABLE_FIREBASE`: Optional Firebase opt-in (`false` by default).

---

## Quick Start (Zero Configuration)

### Prerequisites
- **Node.js v22.13+** (for built-in `node:sqlite`)
- **Python 3.10+** (standard library is enough; optionally install `ml/requirements.txt`)

### Run Locally in 3 Steps

```bash
# 1. Install JavaScript dependencies
npm install

# 2. (Optional) Regenerate local Python ML cache from sample CSV
npm run ml:run

# 3. Start full-stack dev server (Express + Vite + SQLite)
npm run dev
```

Open `http://localhost:3000`. Everything works immediately with zero `.env` setup!

---

## Authentication & Demo Accounts

- **Passwords:** Local SQLite authentication using Node `crypto.scryptSync` + constant-time `timingSafeEqual`, HS256 JWT access tokens (`30m`), and rotating refresh tokens persisted in SQLite.
- **1-Click Student Walkthroughs:** On the Login page, use the **Farmer**, **Trader**, or **Analyst** demo walkthrough buttons for instant evaluation without registration.
- **Administrator Account:** On first launch (when no admin exists in SQLite), click **First-Run Admin Setup** on the Login page to create your local administrator credentials.
- **Custom Registration:** Any user can register for `farmer`, `trader`, or `analyst` roles using only their name, email, password, and state/district (phone number is strictly optional; no OTP/SMS billing required).

---

## Scripts & Verification

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start full-stack Express + Vite server on port 3000 |
| `npm run build` | Build production frontend bundle (`dist/`) |
| `npm run lint` | Run TypeScript static typecheck (`tsc --noEmit`) |
| `npm test` | Run Node unit, security, RBAC, and SQLite integration tests |
| `npm run test:python` | Run Python ML engine unit tests (`ml/test_ml.py`) |
| `npm run test:all` | Run both JS/TS and Python test suites |
| `npm run db:init` | Initialize/verify `./data/kisanmandi.db` schema and seed data |
| `npm run ml:run` | Run Python ML pipeline on `/data/sample_agmarknet_prices.csv` |

---

## Project Documentation

Detailed documentation for project defense & viva submission:

- [Installation & Troubleshooting Guide](docs/INSTALLATION.md)
- [System Architecture & RBAC Matrix](docs/PROJECT_ARCHITECTURE.md)
- [Machine Learning Pipeline & Honest Evaluation](docs/ML_DOCUMENTATION.md)
- [REST API Reference](docs/API_DOCUMENTATION.md)
- [Pre-Transformation Technical Audit Report](docs/STUDENT_PROJECT_AUDIT.md)
