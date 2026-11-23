# KisanMandi – System Architecture & UML/DFD Diagrams

All diagrams in this document are written in **Mermaid** syntax for maintainability and render directly in GitHub, VS Code, Notion, and Markdown-to-PDF academic converters. Every entity, table, endpoint, actor, and pipeline stage matches the implemented codebase (`server.ts`, `server/*.ts`, `ml/ml_engine.py`, `src/App.tsx`).

---

## 1. High-Level System Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["Presentation Tier (React 19 + TypeScript + Tailwind CSS + Vite)"]
        UI["14 Application Views & Role Dashboards\n(EN / Telugu UI, Explorers, Calculators, Alerts)"]
        AuthMem["In-Memory Auth Session\n(React State + Bearer JWT; Zero localStorage Tokens)"]
        ApiSvc["Frontend Service Layer\n(predictionApi.ts, marketSyncService.ts)"]
        UI --> ApiSvc
        AuthMem --> ApiSvc
    end

    subgraph Server["Application & Security Tier (Node.js v22 + Express Port 3000)"]
        SecMW["Security Middleware\n(HS256 JWT, scryptSync, TimingSafeEqual,\nRate Limiter 25/400, Allowlisted Methods)"]
        RBAC["Server-Side RBAC & Validation\n(requireAuth Roles: farmer, trader, analyst, admin)"]
        Routes["REST API Controller (server.ts)\n/api/auth/*, /api/predict/*, /api/prices/*,\n/api/pipeline/*, /api/admin/*"]
        Pipeline["Data Pipeline & Monitoring\n(dataPipeline.ts, modelMonitoring.ts, auditLog.ts)"]
        FeatureBridge["Feature & ML Bridge\n(featureStore.ts v2.2.0, mlEngine.ts, mlRunner.ts)"]

        ApiSvc -- "HTTPS / HTTP JSON + Bearer JWT" --> SecMW
        SecMW --> RBAC --> Routes
        Routes --> Pipeline
        Routes --> FeatureBridge
    end

    subgraph Storage["Persistence & Local Compute Tier (Zero Mandatory Cloud Cost)"]
        SQLite[("Built-in SQLite (node:sqlite)\n./data/kisanmandi.db (11 Tables)\n8,800+ Sample Price Rows")]
        PyML["Local Python ML Engine\n(ml/ml_engine.py)\nPandas/NumPy/scikit-learn OR Stdlib Fallback"]
        Cache[("Model Artifacts Cache\n./data/ml_artifacts_cache.json")]
        CSV[("Bundled Sample Dataset\n./data/sample_agmarknet_prices.csv")]

        Pipeline --> SQLite
        FeatureBridge --> SQLite
        FeatureBridge -- "execFileSync" --> PyML
        CSV --> SQLite
        CSV --> PyML
        PyML --> Cache
        Cache --> FeatureBridge
    end

    subgraph Optional["Optional External Integrations (Disabled by Default)"]
        OGD["data.gov.in AGMARKNET API\n(Resource 9ef84268... if DATA_GOV_IN_API_KEY set)"]
        Gemini["Google Gemini API\n(if GEMINI_API_KEY set)"]
        Firebase["Firebase Auth/Firestore\n(if VITE_ENABLE_FIREBASE=true)"]
    end

    Pipeline -. "Optional Live Sync" .-> OGD
    Routes -. "Optional AI Estimates" .-> Gemini
    Client -. "Optional Cloud Sync" .-> Firebase
```

---

## 2. Entity–Relationship (ER) Diagram (SQLite Schema — `server/database.ts`)

```mermaid
erDiagram
    USERS {
        TEXT id PK
        TEXT name
        TEXT email UK
        TEXT password_hash
        TEXT role "farmer|trader|analyst|admin"
        TEXT state
        TEXT district
        TEXT preferred_market
        TEXT preferred_commodities "JSON array"
        TEXT language "en|te|hi"
        INTEGER alerts_enabled
        TEXT alert_channels "JSON array"
        TEXT phone "Optional metadata"
        TEXT status "Active|Deactivated"
        TEXT created_at
        TEXT last_login
    }

    REFRESH_TOKENS {
        TEXT token_hash PK
        TEXT user_id FK
        INTEGER expires_at
        INTEGER revoked
        TEXT created_at
    }

    WATCHLISTS {
        TEXT id PK
        TEXT user_id FK
        TEXT state
        TEXT market
        TEXT commodity
        REAL target_price
        TEXT alert_condition "above|below"
        TEXT created_at
    }

    SAVED_SCENARIOS {
        TEXT id PK
        TEXT user_id FK
        TEXT crop_group
        TEXT crop_name
        TEXT state
        TEXT market
        TEXT inputs_json
        REAL predicted_price_quintal
        REAL predicted_price_tonne
        TEXT created_at
    }

    NOTIFICATIONS {
        TEXT id PK
        TEXT role_target
        TEXT alert_type
        TEXT commodity
        TEXT market
        TEXT state
        TEXT alert_date
        REAL current_price
        REAL predicted_price
        TEXT expected_change
        TEXT risk_level
        TEXT recommended_action
        TEXT message
        INTEGER is_disabled
        TEXT created_at
    }

    NOTIFICATION_READS {
        TEXT user_id PK,FK
        TEXT alert_id PK,FK
        TEXT read_at
    }

    HISTORICAL_PRICES {
        INTEGER id PK
        TEXT arrival_date "Composite UK"
        TEXT state
        TEXT district
        TEXT market "Composite UK"
        TEXT commodity "Composite UK"
        TEXT variety
        TEXT grade
        REAL min_price
        REAL max_price
        REAL modal_price
        REAL arrival_tonnes
        REAL rainfall_mm
        REAL temp_c
        TEXT data_source "sample|csv_upload|live"
        TEXT created_at
    }

    MODEL_REGISTRY {
        TEXT id PK
        TEXT version
        TEXT commodity
        TEXT market
        TEXT algorithm
        TEXT feature_set_version
        TEXT dataset_snapshot
        TEXT hyperparameters
        REAL mae
        REAL rmse
        REAL mape
        REAL r2
        REAL directional_accuracy
        TEXT approval_status
        TEXT status "Active|Archived|RolledBack"
        INTEGER training_dataset_size
        TEXT data_origin
        TEXT trained_at
    }

    DATASETS_QUEUE {
        TEXT id PK
        TEXT filename
        TEXT source
        INTEGER rows_count
        TEXT missing_pct
        INTEGER duplicate_rows
        TEXT status "Pending Review|Approved|Rejected"
        TEXT uploaded_by
        TEXT uploaded_at
    }

    PIPELINE_RUNS {
        INTEGER id PK
        TEXT source
        TEXT source_url
        INTEGER record_count
        TEXT status
        TEXT failure_reason
        INTEGER retry_attempts
        TEXT executed_at
    }

    AUDIT_LOGS {
        TEXT id PK
        TEXT timestamp
        TEXT user_id
        TEXT user_email
        TEXT role
        TEXT ip_address
        TEXT method
        TEXT path
        TEXT action
        TEXT details
    }

    USERS ||--o{ REFRESH_TOKENS : "owns_sessions"
    USERS ||--o{ WATCHLISTS : "monitors"
    USERS ||--o{ SAVED_SCENARIOS : "saves"
    USERS ||--o{ NOTIFICATION_READS : "reads"
    NOTIFICATIONS ||--o{ NOTIFICATION_READS : "tracked_in"
    USERS ||--o{ AUDIT_LOGS : "generates_events"
```

---

## 3. Data Flow Diagrams (DFD Level 0, Level 1, and Level 2)

### 3.1 Level 0 — Context Diagram

```mermaid
flowchart LR
    Guest(["Guest User"])
    Farmer(["Farmer"])
    Trader(["Trader"])
    Analyst(["Market Analyst"])
    Admin(["System Administrator"])
    OGD(["Optional data.gov.in\nAGMARKNET API"])

    System(("0.0\nKisanMandi\nMandi Price Predictor\nSystem"))

    Guest -- "Browse Queries, Register" --> System
    System -- "Public Prices, Forecasts, Charts" --> Guest

    Farmer -- "Login, Crop/Mandi Choice, Watchlist" --> System
    System -- "EN/TE Advice, Predictions, Alerts" --> Farmer

    Trader -- "Login, Arbitrage Inputs, Scenarios" --> System
    System -- "BUY/SELL Signals, Margins, Exports" --> Trader

    Analyst -- "Login, Model & Horizon Queries" --> System
    System -- "Holdout Metrics, Backtests, PSI Drift" --> Analyst

    Admin -- "First-Run Claim, CSV Uploads,\nRetrain/Rollback, User Edits" --> System
    System -- "Registry Versions, Audit Logs, Queues" --> Admin

    OGD -. "Daily Mandi Records (Optional)" .-> System
```

### 3.2 Level 1 — System Functional Decomposition

```mermaid
flowchart TB
    User(["Authenticated / Public User"])
    Admin(["Administrator"])

    P1(("1.0\nAuthentication &\nRBAC Engine"))
    P2(("2.0\nData Ingestion &\nCSV Pipeline"))
    P3(("3.0\nPython ML Training\n& Forecasting"))
    P4(("4.0\nMarket Explorer &\nCalculators"))
    P5(("5.0\nMonitoring, Alerts\n& Audit Engine"))

    D1[("D1: users & refresh_tokens")]
    D2[("D2: historical_prices & datasets_queue")]
    D3[("D3: model_registry & ml_artifacts_cache")]
    D4[("D4: watchlists & saved_scenarios")]
    D5[("D5: notifications & audit_logs")]

    User -- "Credentials / Registration" --> P1
    P1 <--> D1
    P1 -- "Bearer JWT + Role Claims" --> P4
    P1 -- "Security Events" --> P5

    Admin -- "CSV Upload / Optional Sync" --> P2
    P2 -- "Validated Records" --> D2
    P2 -- "Cleaned Pair Series" --> P3

    D2 --> P3
    P3 <--> D3

    User -- "Commodity/Market Queries" --> P4
    D2 --> P4
    D3 --> P4
    P4 <--> D4
    P4 -- "Forecasts, Profit & CSV Export" --> User

    Admin -- "Retrain / Rollback / Broadcast" --> P5
    D3 --> P5
    P5 <--> D5
    P5 -- "PSI Alerts & Audit Logs" --> Admin
```

### 3.3 Level 2 — ML Forecasting & Retraining Data Flow

```mermaid
flowchart LR
    SQL[("SQLite\nhistorical_prices")] -->|"Export series rows\n(runPairRetraining)"| Pre["3.1 Preprocessing &\nOutlier Audit\n(IQR 1.5x + |z| > 2.8)"]
    Pre -->|"Chronological forward-fill\n& median imputation"| Feat["3.2 Feature Builder v2.2.0\n(Lags 1,2,3,7; Rolling 7/14;\nSin/Cos DOY; Covariates)"]
    Feat -->|"70% / 15% / 15%\nTime-Ordered Split"| Train["3.3 Model Fitting\n(Ridge MLR, Random Forest,\n7d Moving Average)"]
    Train -->|"Evaluate on strictly unseen\ntest 15% + val residual std"| Eval["3.4 Metrics & CI Calibration\n(MAE, RMSE, MAPE, R²,\nDirAcc, 1.96*sigma*sqrt(h))"]
    Eval -->|"30-day iterative\nroll-forward"| Forecast["3.5 Forecast Output\n(D+1, 7-Day, 30-Day JSON)"]
    Forecast --> Reg[("SQLite\nmodel_registry")]
    Forecast --> Cache[("ml_artifacts_cache.json")]
```

---

## 4. UML Use-Case Diagram

```mermaid
flowchart LR
    Guest(["Guest"])
    Farmer(["Farmer"])
    Trader(["Trader"])
    Analyst(["Market Analyst"])
    Admin(["System Administrator"])

    subgraph Platform["KisanMandi System Boundary"]
        UC1(["Explore Historical Mandi Prices & Export CSV"])
        UC2(["Register Account / Sign In (No Phone Required)"])
        UC3(["View Next-Day, 7-Day & 30-Day Forecasts"])
        UC4(["View Bilingual EN/TE Sell-vs-Wait Advice"])
        UC5(["Compare Nearby Mandis & Net Realization"])
        UC6(["Manage Watchlists & Read Role Alerts"])
        UC7(["Compute Procurement, Wastage & Break-Even Profit"])
        UC8(["Save & Delete Trading Scenarios"])
        UC9(["Compare ML Model Performance & Backtests"])
        UC10(["Inspect PSI Drift, Missing Values & Outliers"])
        UC11(["Complete First-Run Admin Setup"])
        UC12(["Upload CSV Datasets & Trigger Retrain/Rollback"])
        UC13(["Manage Users (Role, Status, Password Reset)"])
        UC14(["Inspect Audit Logs & Broadcast Alerts"])
    end

    Guest --> UC1
    Guest --> UC2
    Guest --> UC3

    Farmer --> UC1
    Farmer --> UC3
    Farmer --> UC4
    Farmer --> UC5
    Farmer --> UC6

    Trader --> UC1
    Trader --> UC3
    Trader --> UC6
    Trader --> UC7
    Trader --> UC8

    Analyst --> UC1
    Analyst --> UC3
    Analyst --> UC6
    Analyst --> UC9
    Analyst --> UC10

    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
    Admin --> UC9
```

---

## 5. UML Activity Diagram (Authentication, CSV Upload & Retraining Flow)

```mermaid
flowchart TD
    Start((Start)) --> CheckAuth{"User Authenticated\nas Admin?"}
    CheckAuth -- No --> Login["Sign In or Run First-Run\n/api/auth/setup-admin"]
    Login --> CheckPass{"Valid scrypt Hash &\nStatus == Active?"}
    CheckPass -- No --> Deny401["Return 401 / 403 &\nLog AUTH_FAILURE"] --> Stop((End))
    CheckPass -- Yes --> IssueJWT["Issue 30m Access JWT +\n7d SQLite Refresh Token"] --> Upload

    CheckAuth -- Yes --> Upload["Submit CSV via\nPOST /api/pipeline/upload-csv"]
    Upload --> ValidateCSV{"Valid Headers, Dates &\n0 < min <= modal <= max?"}
    ValidateCSV -- "No (0 valid rows)" --> Reject400["Rollback Transaction &\nReturn HTTP 400"] --> Stop
    ValidateCSV -- Yes --> Stage["Insert/Replace into historical_prices\n& Stage in datasets_queue"]
    Stage --> Gate["Run Pre-Retrain Quality Gate\nGET /api/pipeline/validate-retrain"]
    Gate --> GatePass{"Missing < 5% and\nOutliers < 5%?"}
    GatePass -- No --> Warn["Flag Dataset Audit Warning"] --> Stop
    GatePass -- Yes --> Retrain["Execute Python ML Retrain\n(ml/ml_engine.py)"]
    Retrain --> RecordReg["Archive Old Version & Insert\nActive Row in model_registry"]
    RecordReg --> Inspect{"Accept New Model?"}
    Inspect -- Yes --> Done((End))
    Inspect -- No --> Rollback["POST /api/pipeline/rollback\nRestore Prior Model"] --> Done
```

---

## 6. UML Sequence Diagram (Authenticated Forecasting, Refresh Rotation & CSV Export)

```mermaid
sequenceDiagram
    actor U as Farmer / Analyst
    participant UI as React SPA (App.tsx)
    participant API as Express Server (server.ts)
    participant Auth as securityMiddleware.ts
    participant DB as SQLite (kisanmandi.db)
    participant ML as mlEngine / Python Cache

    U->>UI: Select Commodity (Tomato) & Market (Guntur)
    UI->>API: GET /api/predict/7-day?commodity=Tomato&market=Guntur
    API->>ML: generateRealMLPrediction('Tomato', 'Guntur')
    ML->>DB: Fallback query historical_prices if cache miss
    ML-->>API: Prediction + 7-day trajectory + data_origin provenance
    API-->>UI: HTTP 200 JSON (predicted_price, CI, is_demonstration_data)

    Note over UI,API: User saves watchlist threshold (Access Token expired scenario)
    UI->>API: POST /api/watchlists (Bearer expiredAccessJWT)
    API->>Auth: requireAuth() verifies token expiry
    Auth-->>API: Expired -> Log AUTH_FAILURE
    API-->>UI: HTTP 401 Unauthorized

    UI->>API: POST /api/auth/refresh { refresh_token }
    API->>Auth: Verify HS256 & isRefreshTokenActive() in SQLite
    Auth->>DB: Revoke old token_hash & store rotated token_hash
    API-->>UI: HTTP 200 { new token, new refresh_token }

    UI->>API: Retry POST /api/watchlists (Bearer newAccessJWT)
    API->>Auth: Verify HS256 & Active role in DB
    API->>DB: INSERT OR REPLACE INTO watchlists
    API-->>UI: HTTP 201 Created
```

---

## 7. Machine Learning Workflow Diagram (`ml/ml_engine.py`)

```mermaid
flowchart TD
    A["Load CSV / SQLite Rows\n(sample_agmarknet_prices.csv: 8,800 rows)"] --> B["Filter Series & Validate ISO Dates\n& Positive Modal Prices"]
    B --> C["Deduplicate by\n(commodity, market, arrival_date)"]
    C --> D["Audit & Impute Covariates\n(Chronological Forward-Fill + Median Fallback)"]
    D --> E["Outlier Audit per Series\n(IQR 1.5x & |z| > 2.8) -> Winsorize Training Spike"]
    E --> F["Feature Engineering (v2.2.0, Warmup = 14d)\n12 Deterministic Features (Strictly t-1 History)"]
    F --> G["Chronological Split (Zero Shuffling)\n70% Train | 15% Validation | 15% Unseen Test"]
    G --> H1["Model 1: Ridge OLS (alpha=1.0)"]
    G --> H2["Model 2: Random Forest (24 trees / sklearn)"]
    G --> H3["Baseline 3: 7-Day Moving Average"]
    H1 --> I["Calibrate Residual Std on Validation 15%"]
    H2 --> I
    H3 --> I
    I --> J["Evaluate All 3 Strictly on Unseen Test 15%\n(MAE, RMSE, MAPE, R², DirAcc, 95% CI Coverage)"]
    J --> K["Recursive Forecast Roll-Forward\n(Day 1, Day 7, Day 30 with sqrt(day) CI Bounds)"]
    K --> L["Persist to ml_artifacts_cache.json &\nSQLite model_registry"]
```
