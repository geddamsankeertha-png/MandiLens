# REST API Reference

Base URL (local development): `http://localhost:3000`

Protected routes require header: `Authorization: Bearer <access_token>`.

---

## 1. System & Capabilities

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Basic health status (`database: 'sqlite'`, `offlineReady: true`) |
| `GET` | `/api/system/capabilities` | Public | Runtime capabilities (`mlRuntime`, `historicalPriceRows`, optional key flags, `hasAdmin`) |

---

## 2. Authentication & User Session

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/auth/admin-status` | Public | Returns `{ hasAdmin: boolean }` to show First-Run Admin Setup when unconfigured |
| `POST` | `/api/auth/setup-admin` | Public (Once) | Creates the initial `admin` account in SQLite; returns `403` once an admin exists |
| `POST` | `/api/auth/register` | Public | Registers `farmer`, `trader`, or `analyst` (blocks `admin` escalation with `403`) |
| `POST` | `/api/auth/login` | Public | Verifies email + scrypt password; returns 30m access JWT + 7d refresh token |
| `POST` | `/api/auth/demo-login` | Public | Non-admin walkthrough token (`farmer`, `trader`, `analyst`) |
| `POST` | `/api/auth/refresh` | Public | Rotates active refresh token in SQLite and issues new access/refresh pair |
| `POST` | `/api/auth/logout` | Public | Revokes supplied refresh token in SQLite |
| `GET` | `/api/auth/me` | Bearer Auth | Returns sanitized current user profile |
| `PUT` | `/api/profile` | Bearer Auth | Updates display name, state, district, preferred commodities, language |
| `POST` | `/api/auth/change-password` | Bearer Auth | Verifies current password, updates hash, revokes prior tokens |
| `DELETE` | `/api/profile` | Bearer Auth | Permanently deletes user account and personal records |

---

## 3. Market Explorer & Python ML Predictions

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/commodities` | Public | Returns metadata catalog of all 12 monitored commodities |
| `GET` | `/api/markets` | Public | Returns mandi market metadata catalog |
| `GET` | `/api/features/active` | Public | Returns active feature schema version (`v2.2.0`) |
| `GET` | `/api/prices/history` | Public | Query `?commodity=Tomato&market=Guntur&days=30` |
| `GET` | `/api/prices/export` | Public | Downloads real CSV dataset (`?commodity=...&market=...&days=90`) |
| `GET` | `/api/predict/next-day` | Public | Next-day ML forecast + 95% confidence interval (`?commodity=&market=`) |
| `GET` | `/api/predict/7-day` | Public | 7-day forecast trajectory (`daily_forecasts`) |
| `GET` | `/api/predict/30-day` | Public | 30-day extended trajectory (`daily_forecasts`, `predicted_30day_avg`) |
| `GET` | `/api/recommendation/farmer` | Public | Farmer sell/hold advice, nearby mandi comparison, weather risk |
| `GET` | `/api/recommendation/trader` | Public | Trader BUY/SELL/HOLD signal, arbitrage spread, break-even lot sizing |
| `GET` | `/api/model-performance` | Public | Chronological holdout metrics (MAE, RMSE, MAPE, $R^2$) & disclaimer |
| `POST` | `/api/commodities/live` | Public | Spot benchmarks from SQLite sample series (or optional Gemini overlay) |
| `POST` | `/api/commodities/pan-india` | Public | Pan-India commodity price summary from SQLite & ML cache |

---

## 4. User Watchlists, Scenarios & Alerts

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/watchlists` | Optional Auth | Lists watchlists for authenticated user |
| `POST` | `/api/watchlists` | Bearer Auth | Saves watchlist item in SQLite (`state`, `market`, `targetPrice`) |
| `DELETE` | `/api/watchlists/:id` | Bearer Auth | Removes owned watchlist entry |
| `GET` | `/api/scenarios` | Bearer Auth | Lists saved cultivation cost/profit scenarios |
| `POST` | `/api/scenarios` | Bearer Auth | Persists cultivation scenario in SQLite |
| `DELETE` | `/api/scenarios/:id` | Bearer Auth | Deletes owned scenario |
| `GET` | `/api/alerts` | Optional Auth | Returns active system & admin-published alerts |
| `POST` | `/api/alerts/read` | Bearer Auth | Marks alert ID as read for authenticated user |

---

## 5. Analyst & Admin Protected Routes

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/pipeline/status` | `analyst`, `admin` | Historical row count, pipeline run history, optional API status |
| `GET` | `/api/pipeline/missing-report` | `analyst`, `admin` | Python missing-value audit report |
| `GET` | `/api/pipeline/outliers` | `analyst`, `admin` | Per-series Z-score & IQR outlier report |
| `GET` | `/api/pipeline/validate-retrain` | `analyst`, `admin` | Pre-retraining completeness & outlier gate check |
| `GET` | `/api/pipeline/models` | `analyst`, `admin` | SQLite model registry entries |
| `GET` | `/api/monitoring/metrics` | `analyst`, `admin` | Model metrics, PSI drift scores, and drift alerts |
| `POST` | `/api/pipeline/api-key` | `admin` | Configure or clear optional `DATA_GOV_IN_API_KEY` |
| `POST` | `/api/pipeline/trigger-fetch` | `admin` | Trigger AGMARKNET live fetch (or offline sample report if no key) |
| `GET` | `/api/pipeline/datasets` | `admin` | List uploaded CSV staging queue |
| `POST` | `/api/pipeline/upload-csv` | `admin` | Upload CSV text into SQLite `historical_prices` & staging queue |
| `PATCH` | `/api/pipeline/datasets/:id` | `admin` | Approve or reject staged dataset |
| `POST` | `/api/pipeline/retrain` | `admin` | Run Python retraining for a commodity-market pair |
| `POST` | `/api/pipeline/rollback` | `admin` | Roll back active model to previous registered version |
| `POST` | `/api/monitoring/investigate` | `admin` | Run PSI drift inspection for commodity-market |
| `POST` | `/api/monitoring/resolve-alert` | `admin` | Acknowledge/resolve drift threshold alert |
| `GET` | `/api/admin/users` | `admin` | List all SQLite accounts (sanitized, no password hashes) |
| `PATCH` | `/api/admin/users/:id/role` | `admin` | Update user role |
| `PATCH` | `/api/admin/users/:id/status` | `admin` | Activate or deactivate user account |
| `POST` | `/api/admin/users/:id/reset-password` | `admin` | Issue temporary password and revoke user refresh tokens |
| `DELETE` | `/api/admin/users/:id` | `admin` | Delete user account (cannot delete self) |
| `GET` | `/api/admin/audit-logs` | `admin` | Query SQLite security & admin audit trail |
| `POST` | `/api/admin/alerts` | `admin` | Publish custom advisory alert |
| `PATCH` | `/api/admin/alerts/:id/disable` | `admin` | Suppress alert from user feeds |
