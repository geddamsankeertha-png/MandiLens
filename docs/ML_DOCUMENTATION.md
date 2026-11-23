# Machine Learning Pipeline & Evaluation Documentation

## 1. Academic Honesty & Provenance Policy

By default, KisanMandi ships with a structured demonstration dataset (`/data/sample_agmarknet_prices.csv`) containing 400 daily records across 22 Indian commodity-market series (8,800 rows).

- Every forecast response includes `data_origin` (`sample_dataset_demonstration`, `csv_upload`, or `live`) and `is_demonstration_data: true` whenever trained on sample data.
- **Sample-data caveat:** Metrics computed on synthetic seasonal demonstration series reflect pipeline correctness and relative algorithm comparison on that dataset—they must **not** be presented as audited real-world APMC trading accuracy without ingesting genuine multi-year historical records.

---

## 2. Dataset Schema & Preprocessing (`ml/ml_engine.py`)

Each row in `historical_prices` / CSV contains:
- `arrival_date` (`YYYY-MM-DD`)
- `state`, `district`, `market`, `commodity`, `variety`, `grade`
- `min_price`, `max_price`, `modal_price` (INR/kg)
- `arrival_tonnes`, `rainfall_mm`, `temp_c`

### Preprocessing Steps
1. **Deduplication:** Composite key `(arrival_date, commodity, market)` deduplication.
2. **Missing-Value Audit & Imputation:** Missing `modal_price` rows flagged in audit; missing environmental covariates (`rainfall_mm`, `temp_c`, `arrival_tonnes`) imputed chronologically per series (forward-fill / median fallback).
3. **Outlier Detection & Winsorization:** Computed per `(commodity, market)` series using both Z-Score (`|z| > 2.8`) and Interquartile Range (`IQR × 1.5`) so higher-priced commodities (e.g., Toor Dal) are not falsely flagged against low-priced vegetables (e.g., Potato). Extreme training spikes are winsorized before model fitting.

---

## 3. Feature Engineering (`feature_set_version: v2.2.0`)

Both training and inference construct the exact same deterministic feature vector from the trailing historical window:
- `lag_1`: Price at $t - 1$
- `lag_3`: Price at $t - 3$
- `lag_7`: Price at $t - 7$
- `roll_mean_7`: 7-day rolling mean modal price
- `roll_std_7`: 7-day rolling standard deviation
- `arrival_log`: $\ln(1 + \text{arrival\_tonnes})$
- `sin_doy`, `cos_doy`: Cyclical seasonal encoding ($\sin / \cos$ of day-of-year $\times 2\pi / 365.25$)

Shared helper builders ensure zero training-serving skew.

---

## 4. Chronological Evaluation & Models

Data for every `(commodity, market)` series is strictly partitioned in time order:
- **Training Split:** First 70% chronological window
- **Validation Split:** Middle 15% window
- **Test Holdout Split:** Final 15% unseen chronological window

### Implemented Models
1. **Multiple Linear Regression (Ridge OLS Baseline):** $\min_w \|Xw - y\|_2^2 + \lambda \|w\|_2^2$ solved cleanly via Gaussian elimination (`L2 = 1.0`). Serves as transparent parametric baseline.
2. **Random Forest Regressor (Bagged Decision Trees):** Ensemble of 12 bootstrap-sampled regression trees (`max_depth=5`, `max_features=ceil(sqrt(d))`).
3. **7-Day Simple Moving Average (SMA):** Non-parametric naïve benchmark used to verify whether learned models add genuine value over simple trailing averages.

---

## 5. Forecasting & Uncertainty Intervals

- **Next-Day (`D+1`):** Recursive 1-step feature vector evaluated with the winning holdout model.
- **Multi-Horizon (`7-Day`, `30-Day`):** Iterative multi-step roll-forward with cyclical seasonal updates (`sin_doy`/`cos_doy`).
- **Confidence Intervals:** Derived empirically from out-of-sample residual standard error scaled by horizon uncertainty ($\sigma \sqrt{1 + 0.15 \cdot (h - 1)}$ at 95% z-interval $1.96\sigma$), yielding wider intervals at 30 days than at Day +1.

---

## 6. Model Registry & Drift Monitoring

- **Model Registry (`model_registry` SQLite table):** Records model version, commodity, market, algorithm, `feature_set_version`, `dataset_snapshot`, hyperparameters, holdout metrics, approval status, and active state. Admins can trigger pair retraining (`POST /api/pipeline/retrain`) or one-step rollback (`POST /api/pipeline/rollback`).
- **Drift Detection (`server/modelMonitoring.ts`):** Tracks Population Stability Index (PSI) between training baseline price distributions and recent window prices, raising `STABLE` / `DRIFT_WARNING` / `STALE_DATA` alerts when PSI > 0.25 or data lags.
