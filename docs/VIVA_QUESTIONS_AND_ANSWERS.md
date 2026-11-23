# KisanMandi – Comprehensive Viva Questions & Answers Guide

This guide prepares final-year undergraduate students to explain **every architectural, security, database, agricultural, and machine learning design decision** in **KisanMandi** confidently during project reviews and external viva-voce examinations.

---

## Section A: Project Overview & System Architecture

### Q1. What problem does KisanMandi solve, and why did you adopt an offline-first architecture?
**Answer:** Indian agricultural mandi portals report daily modal prices in `₹/quintal`, which helps record-keeping but does not directly tell a farmer whether selling today or waiting 2–3 days yields better realization, nor does it subtract transport costs across nearby mandis. Furthermore, student major projects often break during live vivas if they depend on paid cloud subscriptions or live external APIs. KisanMandi solves both problems: it runs 100% locally on Node.js v22, Express, built-in `node:sqlite`, and Python with **zero paid APIs required**, while preserving optional hooks for `data.gov.in` AGMARKNET and Gemini when API keys are explicitly supplied.

### Q2. Why did you choose Node.js `node:sqlite` instead of Firebase or PostgreSQL for default storage?
**Answer:** Starting in Node.js 22 LTS, `node:sqlite` (`DatabaseSync`) is built directly into the runtime. It eliminates native C++ build toolchains (`node-gyp`), needs no external database daemon or cloud billing tier, supports WAL concurrency, enforces `FOREIGN KEY` and `CHECK` constraints, and stores the entire state cleanly in a single portable file (`./data/kisanmandi.db`) auto-seeded with **8,800** market rows on first boot.

### Q3. How does your React frontend communicate with the Python ML engine?
**Answer:** The React SPA calls REST JSON endpoints on the Express backend (`server.ts`). At build/startup or when an Admin triggers retraining (`POST /api/pipeline/retrain`), `server/mlRunner.ts` executes `ml/ml_engine.py` via Node's `execFileSync` (safe argument array, no shell interpolation), producing precomputed metrics and 30-day forecasts cached in `data/ml_artifacts_cache.json` and recorded in SQLite's `model_registry` table. `server/mlEngine.ts` reads those artifacts to serve sub-millisecond predictions while falling back dynamically to live SQLite queries (`generatePriceHistory`) when needed.

### Q4. How are the 5 user roles and 14 pages structured and enforced?
**Answer:** The application defines 5 roles (`guest`, `farmer`, `trader`, `analyst`, `admin`) across 14 pages (5 public/auth pages, 4 role-specific dashboards/model pages, 2 shared authenticated pages, and 3 admin management views). Access is controlled visually in `Navbar.tsx` and `App.tsx`, **and enforced server-side** on API routes using Express `requireAuth(['admin'])` or `requireAuth(['analyst', 'admin'])` middleware so bypassing the UI still returns HTTP `401` or `403`.

### Q5. How is bilingual support (English & Telugu) implemented for farmers?
**Answer:** In `FarmerDashboard.tsx` and the commodity metadata in `server/mlEngine.ts` / `src/data/mandiData.ts`, commodities carry Telugu translations (`name_te`, e.g., Tomato → *టొమాటో*, Onion → *ఉల్లిపాయ*, Rice → *బియ్యం (వరి)*), and the Farmer Dashboard provides a live `EN / తెలుగు` switcher translating recommendations, nearby mandi comparisons, and weather risk notices cleanly.

---

## Section B: Security & Database Questions

### Q6. How are user passwords stored and verified?
**Answer:** Passwords are never stored in plaintext. In `server/database.ts`, `hashPassword()` generates a 16-byte cryptographic random salt per user (`crypto.randomBytes(16)`) and derives a 64-byte key using `crypto.scryptSync`. Verification (`verifyPassword()`) recomputes the derived hash and compares buffers with `crypto.timingSafeEqual()` to protect against timing attacks.

### Q7. How do your JWT access tokens and refresh tokens work, and why are they not saved in `localStorage`?
**Answer:** Saving auth tokens in `localStorage` exposes them if a cross-site script ever executes. In KisanMandi, `src/services/predictionApi.ts` holds the 30-minute access JWT and 7-day refresh token strictly in JavaScript memory. On each `POST /api/auth/refresh`, `server.ts` checks the SQLite `refresh_tokens` table, revokes the old SHA-256 token hash, and issues a rotated refresh token. Reusing an old refresh token fails with HTTP `401`.

### Q8. How does your custom JWT verifier prevent `alg: none` and signature-forgery attacks?
**Answer:** In `server/securityMiddleware.ts`, `verifyToken()` decodes the JWT header and explicitly asserts `header.alg === 'HS256' && header.typ === 'JWT'`. Any token declaring `alg: none` or an unexpected algorithm is rejected immediately before signature checks. Valid headers then undergo HMAC-SHA256 verification using `crypto.timingSafeEqual` and an expiration check (`payload.exp`).

### Q9. How do you prevent privilege escalation during registration or first-run setup?
**Answer:** Two independent safeguards prevent unauthorized admin access:
1. `POST /api/auth/register` restricts self-registration to `['farmer', 'trader', 'analyst']`, returning `403 Forbidden` if someone sends `role: 'admin'`.
2. `POST /api/auth/setup-admin` allows claiming the first administrator account **only when zero admin rows exist in SQLite**, immediately locking with `403` thereafter. Demo quick-login buttons intentionally exclude the admin role.

### Q10. How is SQL injection prevented across search, watchlists, and admin actions?
**Answer:** Every SQLite query uses prepared statements with positional `?` placeholders (e.g., `.prepare('SELECT ... WHERE LOWER(commodity) = LOWER(?)').all(commKey)`). In our automated test suite, submitting `"Guntur'); DROP TABLE historical_prices; --"` into `POST /api/watchlists` safely stores it as literal text without executing any DDL/DML injection, leaving all `8,800` price rows intact.

---

## Section C: Machine Learning Concepts (Core Viva Focus)

### Q11. Explain Multiple Linear Regression (MLR) as used in KisanMandi.
**Answer:** Multiple Linear Regression models next-day modal price $\hat{y}_t$ as a weighted linear combination of $d = 12$ engineered features plus an intercept bias:
$$\hat{y}_t = \beta_0 + \sum_{j=1}^{12} \beta_j x_{t,j}$$
Here $x_{t,j}$ includes recent lagged prices ($t-1, t-2, t-3, t-7$), 7-day and 14-day rolling averages, 14-day rolling volatility, cyclical day-of-year sine/cosine features, and scaled arrival tonnage, rainfall, and temperature. MLR serves as an interpretable parametric benchmark that captures smooth trend continuation and autoregressive momentum.

### Q12. What is Ridge Regression, and why did you include $L_2$ regularization ($\alpha = 1.0$) instead of unregularized OLS?
**Answer:** In agricultural price time series, lag features like `lag_1d`, `lag_2d`, `rolling_7d_mean`, and `rolling_14d_mean` are strongly correlated (**multicollinearity**). Ordinary Least Squares (`X^T X` inversion) can produce large, unstable oscillating weights when columns are correlated. **Ridge Regression** adds an $L_2$ penalty term to the loss function:
$$\mathcal{L}(w) = \|Xw - y\|_2^2 + \alpha \|w\|_2^2 \quad (\alpha = 1.0)$$
Adding $\alpha I$ to the diagonal of $X^T X$ ensures the normal-equation matrix is strictly positive definite and numerically stable during Gaussian elimination (`PurePythonRidgeOLS`), preventing overfitting on 400-day series.

### Q13. Explain Random Forest Regressor and how your implementation builds trees.
**Answer:** Random Forest is an ensemble method (**bootstrap aggregating / bagging + feature subsampling**) of multiple decorrelated Decision Trees whose predictions are averaged:
$$\hat{y}_{RF}(x) = \frac{1}{T} \sum_{t=1}^{T} h_t(x)$$
In `ml/ml_engine.py`, when `scikit-learn` is installed we train 80 trees (`max_depth=6`); in zero-dependency mode, `PurePythonRandomForest` trains `n_estimators = 24` bootstrap-sampled `PurePythonDecisionTree` models (`max_depth=5`, `min_samples_leaf=3`, sampling `max_features=5` of the 12 features at each split to minimize Sum of Squared Errors). Averaging trees reduces variance and models non-linear threshold effects (such as sharp arrival spikes) that linear models cannot express.

### Q14. Why do you include a 7-Day Seasonal Moving Average baseline?
**Answer:** In forecasting research (Hyndman & Athanasopoulos), complex ML models must always be benchmarked against a simple naïve/moving-average baseline (`rolling_7d_mean` directly). If MLR or Random Forest cannot beat a 7-day average on unseen holdout RMSE, the added complexity is unjustified. Including all three models side-by-side in `Model Performance` guarantees honest model comparison.

### Q15. Explain MAE, RMSE, MAPE, and $R^2$ (and how you handled zero prices in MAPE).
**Answer:** For $n$ held-out test observations with actual values $y_i$ and predictions $\hat{y}_i$:
- **MAE (Mean Absolute Error)**: $\frac{1}{n}\sum_{i=1}^n |y_i - \hat{y}_i|$ — average error magnitude directly in `₹/kg`, robust to single spikes.
- **RMSE (Root Mean Squared Error)**: $\sqrt{\frac{1}{n}\sum_{i=1}^n (y_i - \hat{y}_i)^2}$ — penalizes large forecasting misses more heavily than MAE ($\text{RMSE} \ge \text{MAE}$ always holds mathematically).
- **MAPE (Mean Absolute Percentage Error)**: $\frac{100\%}{m}\sum_{y_i \neq 0} \frac{|y_i - \hat{y}_i|}{|y_i|}$ — scale-free error percentage allowing cross-crop comparison (e.g., Chilli at `₹182/kg` vs Potato at `₹21.5/kg`). During QA, we fixed `compute_regression_metrics` so rows with `|y_i| <= 1e-6` are excluded instead of dividing by `1e-6` and blowing up MAPE.
- **$R^2$ (Coefficient of Determination)**: $1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}$ — fraction of variance explained relative to predicting the constant test mean ($\le 1.0$; can be negative if a model underperforms the constant test-window mean during high regime volatility, as observed honestly on `Cotton::Guntur` with $R^2 = -0.3399$).

### Q16. How are the 95% confidence intervals calculated for 1-day, 7-day, and 30-day forecasts?
**Answer:** We fit models on the first 70% training split and compute out-of-sample residual standard deviation $\sigma_{\text{val}}$ on the middle 15% validation split. For forecast horizon day $h \in \{1 \dots 30\}$, forecast uncertainty accumulates over multi-step roll-forward according to random-walk error growth:
$$\text{CI}_h = \hat{y}_{T+h} \pm 1.96 \cdot \sigma_{\text{val}} \cdot \sqrt{h}$$
This ensures 30-day prediction bands are mathematically wider than 7-day and 1-day intervals (`verified in ml/test_ml.py`), reflecting growing long-horizon uncertainty.

### Q17. Why must time-series data use chronological train/validation/test splitting instead of random `train_test_split`?
**Answer:** Randomly shuffling daily mandi prices leaks future observations ($t+1, t+2$) into the training set while evaluating on day $t$ via lag/rolling features, producing artificially inflated accuracy (**look-ahead data leakage**). KisanMandi sorts every `(commodity, market)` series strictly by `arrival_date` after a 14-day warmup, training on the earliest 70%, calibrating residuals on the middle 15%, and scoring strictly on the final 15% unseen chronological window (`test_chronological_split_and_feature_consistency` verifies zero date overlap).

### Q18. Explain your data preprocessing: missing-value imputation, outlier handling, and training–serving skew prevention.
**Answer:**
1. **Deduplication**: Composite key `(commodity, market, arrival_date)` removes duplicates.
2. **Missing Values**: Records missing positive `modal_price` are quarantined/skipped and audited; missing `min_price`/`max_price` fall back to `0.9x` / `1.1x` modal; missing covariates (`arrival_tonnes` — 44 rows in the sample CSV — plus rainfall/temperature) are filled sequentially using chronological **forward-fill** seeded with the series median (never future medians).
3. **Outliers**: Computed per `(commodity, market)` series using `IQR * 1.5` fences and `|z| > 2.8` (`35` extreme spikes logged across the `8,800` sample rows). During training only, extreme spikes are winsorized using midpoint blending clipped to the IQR fences while retaining raw spike records for analyst inspection.
4. **No Training–Serving Skew**: Both `ml/ml_engine.py` (`build_feature_vector`) and `server/featureStore.ts` synchronize on `FEATURE_SET_VERSION = "v2.2.0"` using identical causal `t-1` feature definitions.

### Q19. Why should you not claim that `sample_agmarknet_prices.csv` metrics prove real-world APMC accuracy?
**Answer:** The bundled `sample_agmarknet_prices.csv` (`8,800` rows from `2025-10-19` to `2026-11-22`) is a structured educational demonstration dataset generated to benchmark pipeline integrity offline without cost. Real APMC mandis are subject to sudden export bans, unseasonal hailstorms, transport strikes, and festival demand shocks. That is why every prediction and metric response explicitly includes `data_origin` and `is_demonstration_data: true` whenever trained on sample data.

### Q20. What does Population Stability Index (PSI) measure in `server/modelMonitoring.ts`?
**Answer:** PSI quantifies how much the recent 25% modal-price distribution has shifted compared to the earliest 75% training baseline across 5 histogram bins:
$$\text{PSI} = \sum_{i=1}^{5} (c_i - b_i) \ln\left(\frac{c_i}{b_i}\right)$$
Values `< 0.12` are marked `STABLE`, `0.12–0.24` trigger `WARNING_PSI`, and `>= 0.25` trigger `CRITICAL_DRIFT` advisories recommending Admin investigation and model retraining.
