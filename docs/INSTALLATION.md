# Installation & Local Development Guide

This guide explains how to set up and run **KisanMandi – Mandi Price Predictor** locally on Windows, macOS, or Linux with **zero paid accounts or cloud subscriptions**.

---

## 1. System Requirements

- **Node.js:** `v22.13+` (recommended `v22 LTS`). Required because KisanMandi uses Node's built-in `node:sqlite` module (`DatabaseSync`) with zero native C++ build toolchains (`node-gyp` is NOT needed!).
- **npm:** `v10+` (bundled with Node.js 22).
- **Python:** `3.10+` (`python3`). Works immediately with the Python standard library; optionally install scientific packages in a virtualenv.

Verify your versions:
```bash
node -v
npm -v
python3 --version
```

---

## 2. Standard Offline-First Setup

```bash
# 1. Install JavaScript/TypeScript dependencies
npm install

# 2. (Optional) Copy environment template — all external keys may remain empty!
cp .env.example .env

# 3. Initialize local SQLite database from bundled sample dataset
npm run db:init

# 4. Run Python ML engine to refresh local model artifacts cache
npm run ml:run

# 5. Start Express + Vite dev server on http://localhost:3000
npm run dev
```

After `npm install`, disconnect from the internet if desired—every core feature, login, calculator, chart, CSV export, watchlist, and ML forecast continues working completely offline.

---

## 3. Optional Python Scientific Libraries

`ml/ml_engine.py` detects `pandas`, `numpy`, and `scikit-learn` automatically. If they are not installed (or on restricted student machines), it transparently uses a pure-Python standard-library Ridge OLS & Bagged Tree ensemble implementation.

To enable the full `scikit-learn` execution path:
```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r ml/requirements.txt
npm run ml:run
```

---

## 4. Production Build & Verification

```bash
# TypeScript static type checking
npm run lint

# Build Vite React production bundle into dist/
npm run build

# Run full JS/TS + Python test suites
npm run test:all
```

---

## 5. Free Hosting / Deployment Notes (e.g., Render / Railway / Local LAN)

1. Set build command: `npm install && npm run build`
2. Set start command: `NODE_ENV=production npm start`
3. Environment variables to configure on your host:
   - `JWT_SECRET`: Generate a strong 32+ character random secret.
   - `SQLITE_DB_PATH`: Point to a writable path (or persistent disk volume if preserving SQLite across restarts).
   - Leave `GEMINI_API_KEY` and `DATA_GOV_IN_API_KEY` unset unless you wish to test optional external overlays.

---

## 6. Troubleshooting

| Issue | Resolution |
| :--- | :--- |
| `SyntaxError` or `Cannot find module 'node:sqlite'` | Upgrade Node.js to **v22.13 or newer** (`node -v`). |
| `EADDRINUSE: address already in use :::3000` | Another process is using port 3000; set `PORT=3001` or stop the other process. |
| Admin dashboard shows `401 / 403` | Log out and sign in with the Administrator account created via First-Run Admin Setup (demo role buttons intentionally do not include Admin). |
| Missing `data/kisanmandi.db` | Run `npm run db:init` or start `npm run dev`; schema and sample seed data are created automatically on boot. |
