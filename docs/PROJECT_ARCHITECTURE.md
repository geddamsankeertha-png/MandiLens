# System Architecture & RBAC Specification

## 1. High-Level Architecture

KisanMandi uses a modular, single-command full-stack architecture designed for zero external runtime dependencies:

```text
+-------------------------------------------------------------------+
|               React 19 + TypeScript + Tailwind SPA                |
|  - 14 Views across Guest, Farmer, Trader, Analyst, Admin roles   |
|  - In-memory JWT Bearer authentication (zero localStorage auth)   |
|  -predictionApi.ts client with transparent refresh rotation       |
+---------------------------------+---------------------------------+
                                  | HTTP/JSON + Bearer JWT
                                  v
+-------------------------------------------------------------------+
|              Express API Server (server.ts, Port 3000)            |
|  - Security headers, HTTP method allowlist, JSON size cap (512kb) |
|  - Strict auth rate limiter + general rate limiter                |
|  - Server-side RBAC (requireAuth(['admin']), ['analyst','admin']) |
+----------------+--------------------------------+-----------------+
                 |                                |
                 v                                v
+--------------------------------+  +-------------------------------+
| Built-in SQLite (node:sqlite)  |  |  Local Python ML Bridge       |
| ./data/kisanmandi.db           |  |  ml/ml_engine.py              |
|  - users (scrypt hashes)       |  |  - Feature engineering v2.2.0 |
|  - refresh_tokens              |  |  - Ridge MLR & Random Forest  |
|  - historical_prices (8800+)   |  |  - Chronological split eval   |
|  - model_registry              |  |  - /data/ml_artifacts_cache   |
|  - watchlists, saved_scenarios |  +-------------------------------+
|  - notifications, audit_logs   |
|  - datasets_queue              |
+--------------------------------+
```

---

## 2. SQLite Database Schema (`server/database.ts`)

| Table | Purpose |
| :--- | :--- |
| `users` | User profile, role (`farmer`/`trader`/`analyst`/`admin`), state/district, scrypt password hash, status (`Active`/`Deactivated`) |
| `refresh_tokens` | SHA-256 hashed refresh tokens with expiry & revocation flag (`revoked`) |
| `historical_prices` | Time-series mandi modal/min/max prices, arrivals, rainfall, temp, `data_source` provenance |
| `datasets_queue` | Uploaded CSV ingestion staging queue (`Pending Review`, `Approved`, `Rejected`) |
| `model_registry` | Versioned model runs per commodity-market (`algorithm`, `version`, `feature_set_version`, `dataset_snapshot`, metrics, `status`) |
| `watchlists` | User-specific target price alerts |
| `saved_scenarios` | Farmer cultivation cost & break-even profit scenarios |
| `notifications` / `notification_reads` | System/admin advisories and per-user read tracking |
| `audit_logs` | Security failures, denied RBAC requests, admin actions, CSV uploads, model actions |
| `pipeline_runs` | History of offline/CSV/optional-AGMARKNET sync jobs |

---

## 3. Authentication & Security Design

1. **Password Storage:** Uses Node `crypto.scryptSync` with 16-byte random salt per password and constant-time `crypto.timingSafeEqual`.
2. **JWT Controls:** Custom HS256 JWT implementation explicitly verifying header `{ alg: 'HS256', typ: 'JWT' }`—rejecting `alg: none` or mismatched signatures—with 30-minute access token TTL and 7-day rotating refresh tokens tracked in SQLite.
3. **Privilege Escalation Prevention:** `/api/auth/register` rejects `admin` role creation; `/api/auth/demo-login` is restricted strictly to `farmer`, `trader`, and `analyst`. Initial admin creation uses one-time `/api/auth/setup-admin`.
4. **No Phone Verification Gate:** Phone numbers remain optional metadata with zero SMS OTP billing or dependency.

---

## 4. Five-Role 14-Page RBAC Matrix

| Role | Accessible Views |
| :--- | :--- |
| **Guest** | Landing, About / Methodology, National Price Explorer (28 states, 12 commodities), Register, Login |
| **Farmer** | Guest views + Farmer Decision Support (EN/TE), Cultivation Cost Calculator, Alerts, User Profile |
| **Trader** | Guest views + Trader Terminal, Market Comparison & Watchlists, Profit Calculator, Alerts, Profile |
| **Analyst** | Guest views + Econometric Home, Explorer, 30-Day Forecasts, Seasonality, Elasticity, Heatmap, Volatility, Model Leaderboard |
| **Admin** | All dashboards + User Management, CSV/AGMARKNET Pipeline, Model Registry/Rollback, Drift Monitoring, Alert Broadcast, SQLite Audit Logs |

---

## 5. Optional Cloud Integrations

All external services are disabled or bypassed cleanly by default:
- `GEMINI_API_KEY=""` → Local deterministic sample series & Python ML serve all views.
- `DATA_GOV_IN_API_KEY=""` → Local SQLite sample CSV serves all mandi routes.
- `VITE_ENABLE_FIREBASE="false"` → SQLite handles authentication and persistence locally.
