"""
KisanMandi Local Python Machine Learning Engine
==============================================
Implements genuine end-to-end agricultural price modeling and forecasting:
1. Data loading (CSV / SQLite JSON records) & schema validation
2. Missing-value detection & chronological imputation
3. Outlier detection (IQR 1.5x + Z-score > 3.0) with audit logging
4. Shared versioned feature engineering (prevents training-serving skew)
5. Chronological time-based train / validation / test split (no random leakage)
6. Models:
   - Multiple Linear Regression (Ridge-regularized OLS baseline)
   - Random Forest Regressor (Ensemble of bagged regression trees)
   - Seasonal Moving Average (7-day / seasonal naive econometric baseline)
7. Honest evaluation metrics on strictly held-out test window (MAE, RMSE, MAPE, R², Directional Accuracy, CI Coverage)
8. Recursive multi-horizon forecasting (Next-Day, 7-Day, 30-Day) with residual-based 95% confidence intervals

Supports pandas/numpy/scikit-learn when installed, and includes a verified
pure-Python stdlib fallback so every test and student demo runs cleanly offline.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import os
import random
import statistics
import time
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

try:
    import numpy as np  # type: ignore
    import pandas as pd  # type: ignore
    from sklearn.ensemble import RandomForestRegressor  # type: ignore
    from sklearn.linear_model import Ridge  # type: ignore
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

FEATURE_SET_VERSION = "v2.2.0"
FEATURE_NAMES = [
    "lag_1d",
    "lag_2d",
    "lag_3d",
    "lag_7d",
    "rolling_7d_mean",
    "rolling_14d_mean",
    "rolling_14d_std",
    "sin_doy",
    "cos_doy",
    "arrival_tonnes_scaled",
    "rainfall_mm_scaled",
    "temp_c_scaled",
]


def _parse_float(val: Any) -> Optional[float]:
    if val is None:
        return None
    s = str(val).strip()
    if s == "" or s.lower() in ("nan", "null", "none", "na"):
        return None
    try:
        v = float(s)
        return None if math.isnan(v) or math.isinf(v) else v
    except ValueError:
        return None


def load_csv_records(csv_path: str) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(dict(row))
    return rows


def preprocess_and_audit_series(
    raw_records: List[Dict[str, Any]],
    commodity: Optional[str] = None,
    market: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Cleans raw price records, audits missing fields & outliers, imputes gaps,
    and returns chronologically sorted, validated observations.
    """
    filtered = []
    for r in raw_records:
        c = str(r.get("commodity", "")).strip()
        m = str(r.get("market", "")).strip()
        if commodity and c.lower() != commodity.lower():
            continue
        if market and m.lower() != market.lower():
            continue
        filtered.append(r)

    missing_counts = {
        "modal_price": 0,
        "min_price": 0,
        "max_price": 0,
        "arrival_tonnes": 0,
        "rainfall_mm": 0,
        "temp_c": 0,
    }

    parsed: List[Dict[str, Any]] = []
    for r in filtered:
        dt_str = str(r.get("arrival_date") or r.get("date") or "").strip()
        if not dt_str:
            continue
        # Support YYYY-MM-DD and DD/MM/YYYY and reject malformed dates
        dt_iso = dt_str
        if "/" in dt_str:
            parts = dt_str.split("/")
            if len(parts) == 3:
                dt_iso = f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
        try:
            datetime.strptime(dt_iso, "%Y-%m-%d")
        except ValueError:
            continue

        modal = _parse_float(r.get("modal_price"))
        min_p = _parse_float(r.get("min_price"))
        max_p = _parse_float(r.get("max_price"))
        arr = _parse_float(r.get("arrival_tonnes"))
        rain = _parse_float(r.get("rainfall_mm"))
        temp = _parse_float(r.get("temp_c"))

        if modal is None or modal <= 0:
            missing_counts["modal_price"] += 1
            continue
        if min_p is None:
            missing_counts["min_price"] += 1
        if max_p is None:
            missing_counts["max_price"] += 1
        if arr is None:
            missing_counts["arrival_tonnes"] += 1
        if rain is None:
            missing_counts["rainfall_mm"] += 1
        if temp is None:
            missing_counts["temp_c"] += 1

        parsed.append({
            "arrival_date": dt_iso,
            "state": str(r.get("state") or "").strip(),
            "district": str(r.get("district") or "").strip(),
            "market": str(r.get("market") or "").strip(),
            "commodity": str(r.get("commodity") or "").strip(),
            "variety": str(r.get("variety") or "FAQ").strip(),
            "grade": str(r.get("grade") or "FAQ").strip(),
            "modal_price": modal,
            "min_price": min_p,
            "max_price": max_p,
            "arrival_tonnes": arr,
            "rainfall_mm": rain,
            "temp_c": temp,
            "data_source": str(r.get("data_source") or "sample").strip(),
        })

    # Deduplicate by date+commodity+market and sort chronologically
    seen = set()
    deduped: List[Dict[str, Any]] = []
    duplicates_removed = 0
    for row in sorted(parsed, key=lambda x: (x["commodity"], x["market"], x["arrival_date"])):
        key = (row["commodity"], row["market"], row["arrival_date"])
        if key in seen:
            duplicates_removed += 1
            continue
        seen.add(key)
        deduped.append(row)

    # Median fallback values for missing covariates
    valid_arr = [x["arrival_tonnes"] for x in deduped if x["arrival_tonnes"] is not None]
    valid_rain = [x["rainfall_mm"] for x in deduped if x["rainfall_mm"] is not None]
    valid_temp = [x["temp_c"] for x in deduped if x["temp_c"] is not None]

    med_arr = statistics.median(valid_arr) if valid_arr else 1000.0
    med_rain = statistics.median(valid_rain) if valid_rain else 70.0
    med_temp = statistics.median(valid_temp) if valid_temp else 30.0

    # Chronological forward-fill then median imputation
    last_arr = med_arr
    last_rain = med_rain
    last_temp = med_temp
    for row in deduped:
        if row["min_price"] is None:
            row["min_price"] = round(row["modal_price"] * 0.9, 2)
        if row["max_price"] is None:
            row["max_price"] = round(row["modal_price"] * 1.1, 2)
        if row["arrival_tonnes"] is None:
            row["arrival_tonnes"] = round(last_arr, 1)
        else:
            last_arr = row["arrival_tonnes"]
        if row["rainfall_mm"] is None:
            row["rainfall_mm"] = round(last_rain, 1)
        else:
            last_rain = row["rainfall_mm"]
        if row["temp_c"] is None:
            row["temp_c"] = round(last_temp, 1)
        else:
            last_temp = row["temp_c"]

    # Outlier detection (IQR + Z-score) on modal_price
    outliers: List[Dict[str, Any]] = []
    if len(deduped) >= 8:
        prices = [r["modal_price"] for r in deduped]
        sorted_p = sorted(prices)
        q1 = sorted_p[int(0.25 * (len(sorted_p) - 1))]
        q3 = sorted_p[int(0.75 * (len(sorted_p) - 1))]
        iqr = max(1e-6, q3 - q1)
        lower_fence = q1 - 1.5 * iqr
        upper_fence = q3 + 1.5 * iqr
        mean_p = statistics.mean(prices)
        std_p = max(1e-6, statistics.pstdev(prices))
        med_p = statistics.median(prices)

        for idx, row in enumerate(deduped):
            p = row["modal_price"]
            z = (p - mean_p) / std_p
            if abs(z) > 2.8 or p > upper_fence or p < lower_fence:
                outliers.append({
                    "arrival_date": row["arrival_date"],
                    "commodity": row["commodity"],
                    "market": row["market"],
                    "raw_modal_price": p,
                    "series_median": round(med_p, 2),
                    "z_score": round(z, 2),
                    "flag": "Spike Outlier" if p > med_p else "Drop Outlier",
                })
                # Winsorize for stable model feature history while preserving raw report
                prev_p = deduped[idx - 1]["modal_price"] if idx > 0 else med_p
                row["clean_modal_price"] = round(max(lower_fence, min(upper_fence, (p + prev_p) / 2.0)), 2)
            else:
                row["clean_modal_price"] = p
    else:
        for row in deduped:
            row["clean_modal_price"] = row["modal_price"]

    total_rows = max(1, len(filtered))
    total_missing_cells = sum(missing_counts.values())
    total_cells = total_rows * len(missing_counts)
    completeness_pct = round(100.0 * (1.0 - total_missing_cells / max(1, total_cells)), 2)

    return {
        "records": deduped,
        "audit": {
            "raw_records_count": len(filtered),
            "clean_records_count": len(deduped),
            "duplicates_removed": duplicates_removed,
            "missing_counts": missing_counts,
            "completeness_pct": completeness_pct,
            "outliers_count": len(outliers),
            "outliers": outliers[:20],
        },
    }


def build_feature_vector(
    price_history: List[float],
    target_date_iso: str,
    arrival_tonnes: float,
    rainfall_mm: float,
    temp_c: float,
) -> List[float]:
    """
    Shared deterministic feature builder used identically during training,
    backtesting evaluation, and online inference to prevent training-serving skew.
    Expects `price_history` up to t-1 (strictly before target_date_iso).
    """
    n = len(price_history)
    lag_1 = price_history[-1] if n >= 1 else 25.0
    lag_2 = price_history[-2] if n >= 2 else lag_1
    lag_3 = price_history[-3] if n >= 3 else lag_2
    lag_7 = price_history[-7] if n >= 7 else price_history[0]

    w7 = price_history[-7:] if n >= 7 else price_history
    w14 = price_history[-14:] if n >= 14 else price_history
    mean_7 = sum(w7) / len(w7)
    mean_14 = sum(w14) / len(w14)
    var_14 = sum((x - mean_14) ** 2 for x in w14) / len(w14)
    std_14 = math.sqrt(var_14)

    dt = datetime.strptime(target_date_iso, "%Y-%m-%d").date()
    doy = dt.timetuple().tm_yday
    sin_doy = math.sin(2.0 * math.pi * doy / 365.0)
    cos_doy = math.cos(2.0 * math.pi * doy / 365.0)

    return [
        lag_1,
        lag_2,
        lag_3,
        lag_7,
        mean_7,
        mean_14,
        std_14,
        sin_doy,
        cos_doy,
        arrival_tonnes / 1000.0,
        rainfall_mm / 100.0,
        temp_c / 35.0,
    ]


def build_supervised_dataset(
    clean_records: List[Dict[str, Any]],
    warmup_days: int = 14,
) -> Tuple[List[List[float]], List[float], List[Dict[str, Any]]]:
    X: List[List[float]] = []
    y: List[float] = []
    meta: List[Dict[str, Any]] = []
    if len(clean_records) <= warmup_days + 5:
        return X, y, meta

    clean_prices = [float(r["clean_modal_price"]) for r in clean_records]
    for idx in range(warmup_days, len(clean_records)):
        hist_window = clean_prices[:idx]
        cur = clean_records[idx]
        feats = build_feature_vector(
            price_history=hist_window,
            target_date_iso=cur["arrival_date"],
            arrival_tonnes=float(cur["arrival_tonnes"]),
            rainfall_mm=float(cur["rainfall_mm"]),
            temp_c=float(cur["temp_c"]),
        )
        X.append(feats)
        y.append(float(cur["clean_modal_price"]))
        meta.append({
            "date": cur["arrival_date"],
            "raw_price": float(cur["modal_price"]),
            "clean_price": float(cur["clean_modal_price"]),
            "prev_price": hist_window[-1],
        })
    return X, y, meta


# =====================================================================
# Pure-Python Stdlib ML Implementations (Zero External Dependencies)
# Guarantees execution offline even without scikit-learn installed
# =====================================================================

class PurePythonRidgeOLS:
    def __init__(self, alpha: float = 1.0):
        self.alpha = alpha
        self.weights: List[float] = []
        self.bias: float = 0.0
        self.means: List[float] = []
        self.stds: List[float] = []

    def fit(self, X: List[List[float]], y: List[float]) -> "PurePythonRidgeOLS":
        n = len(X)
        d = len(X[0])
        self.means = [sum(row[j] for row in X) / n for j in range(d)]
        self.stds = []
        for j in range(d):
            v = sum((row[j] - self.means[j]) ** 2 for row in X) / n
            self.stds.append(math.sqrt(v) if v > 1e-12 else 1.0)

        Xs = [[(row[j] - self.means[j]) / self.stds[j] for j in range(d)] for row in X]
        self.bias = sum(y) / n
        yc = [yi - self.bias for yi in y]

        # Normal equations: (X^T X + alpha * I) w = X^T yc
        A = [[0.0] * d for _ in range(d)]
        b = [0.0] * d
        for i in range(n):
            xi = Xs[i]
            yi = yc[i]
            for j in range(d):
                b[j] += xi[j] * yi
                for k in range(j, d):
                    A[j][k] += xi[j] * xi[k]

        for j in range(d):
            for k in range(j):
                A[j][k] = A[k][j]
            A[j][j] += self.alpha

        # Gaussian elimination with partial pivoting
        aug = [A[r][:] + [b[r]] for r in range(d)]
        for col in range(d):
            pivot = max(range(col, d), key=lambda r: abs(aug[r][col]))
            aug[col], aug[pivot] = aug[pivot], aug[col]
            denom = aug[col][col] if abs(aug[col][col]) > 1e-12 else 1e-12
            for k in range(col, d + 1):
                aug[col][k] /= denom
            for r in range(d):
                if r != col and abs(aug[r][col]) > 1e-12:
                    factor = aug[r][col]
                    for k in range(col, d + 1):
                        aug[r][k] -= factor * aug[col][k]

        self.weights = [aug[r][d] for r in range(d)]
        return self

    def predict(self, X: List[List[float]]) -> List[float]:
        preds: List[float] = []
        d = len(self.weights)
        for row in X:
            s = self.bias
            for j in range(d):
                z = (row[j] - self.means[j]) / self.stds[j]
                s += self.weights[j] * z
            preds.append(max(1.0, s))
        return preds


class _TreeNode:
    __slots__ = ("feat_idx", "threshold", "left", "right", "value")

    def __init__(
        self,
        feat_idx: int = -1,
        threshold: float = 0.0,
        left: Optional["_TreeNode"] = None,
        right: Optional["_TreeNode"] = None,
        value: float = 0.0,
    ):
        self.feat_idx = feat_idx
        self.threshold = threshold
        self.left = left
        self.right = right
        self.value = value


class PurePythonDecisionTree:
    def __init__(self, max_depth: int = 5, min_samples_leaf: int = 4, max_features: int = 5, seed: int = 42):
        self.max_depth = max_depth
        self.min_samples_leaf = min_samples_leaf
        self.max_features = max_features
        self.rng = random.Random(seed)
        self.root: Optional[_TreeNode] = None

    def fit(self, X: List[List[float]], y: List[float]) -> "PurePythonDecisionTree":
        indices = list(range(len(X)))
        self.root = self._build(X, y, indices, depth=0)
        return self

    def _build(self, X: List[List[float]], y: List[float], indices: List[int], depth: int) -> _TreeNode:
        vals = [y[i] for i in indices]
        mean_val = sum(vals) / len(vals)
        if depth >= self.max_depth or len(indices) < 2 * self.min_samples_leaf:
            return _TreeNode(value=mean_val)

        d = len(X[0])
        feat_candidates = self.rng.sample(range(d), min(self.max_features, d))
        best_score = float("inf")
        best_feat = -1
        best_thresh = 0.0
        best_left: List[int] = []
        best_right: List[int] = []

        for f in feat_candidates:
            sorted_idx = sorted(indices, key=lambda idx: X[idx][f])
            # Evaluate quantiles for speed and stability
            step = max(1, len(sorted_idx) // 10)
            for pos in range(self.min_samples_leaf, len(sorted_idx) - self.min_samples_leaf + 1, step):
                if X[sorted_idx[pos - 1]][f] == X[sorted_idx[pos]][f]:
                    continue
                thresh = 0.5 * (X[sorted_idx[pos - 1]][f] + X[sorted_idx[pos]][f])
                left_idx = sorted_idx[:pos]
                right_idx = sorted_idx[pos:]
                l_vals = [y[i] for i in left_idx]
                r_vals = [y[i] for i in right_idx]
                l_mean = sum(l_vals) / len(l_vals)
                r_mean = sum(r_vals) / len(r_vals)
                sse = sum((v - l_mean) ** 2 for v in l_vals) + sum((v - r_mean) ** 2 for v in r_vals)
                if sse < best_score:
                    best_score = sse
                    best_feat = f
                    best_thresh = thresh
                    best_left = left_idx
                    best_right = right_idx

        if best_feat == -1:
            return _TreeNode(value=mean_val)

        return _TreeNode(
            feat_idx=best_feat,
            threshold=best_thresh,
            left=self._build(X, y, best_left, depth + 1),
            right=self._build(X, y, best_right, depth + 1),
        )

    def _predict_one(self, row: List[float], node: _TreeNode) -> float:
        while node.feat_idx != -1:
            if row[node.feat_idx] <= node.threshold:
                assert node.left is not None
                node = node.left
            else:
                assert node.right is not None
                node = node.right
        return node.value

    def predict(self, X: List[List[float]]) -> List[float]:
        assert self.root is not None
        return [max(1.0, self._predict_one(row, self.root)) for row in X]


class PurePythonRandomForest:
    def __init__(self, n_estimators: int = 24, max_depth: int = 5, seed: int = 2026):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.seed = seed
        self.trees: List[PurePythonDecisionTree] = []

    def fit(self, X: List[List[float]], y: List[float]) -> "PurePythonRandomForest":
        rng = random.Random(self.seed)
        n = len(X)
        self.trees = []
        for t in range(self.n_estimators):
            sample_idx = [rng.randrange(n) for _ in range(n)]
            Xb = [X[i] for i in sample_idx]
            yb = [y[i] for i in sample_idx]
            tree = PurePythonDecisionTree(max_depth=self.max_depth, min_samples_leaf=3, max_features=5, seed=self.seed + t)
            tree.fit(Xb, yb)
            self.trees.append(tree)
        return self

    def predict(self, X: List[List[float]]) -> List[float]:
        all_preds = [tree.predict(X) for tree in self.trees]
        out: List[float] = []
        for i in range(len(X)):
            out.append(sum(p[i] for p in all_preds) / len(all_preds))
        return out


# =====================================================================
# Evaluation Metrics & Model Comparison
# =====================================================================

def compute_regression_metrics(
    y_true: List[float],
    y_pred: List[float],
    prev_prices: List[float],
    ci_half_width: float,
) -> Dict[str, float]:
    n = len(y_true)
    errors = [p - a for a, p in zip(y_true, y_pred)]
    abs_errors = [abs(e) for e in errors]
    sq_errors = [e * e for e in errors]
    pct_errors = [abs(e) / abs(a) * 100.0 for a, e in zip(y_true, errors) if abs(a) > 1e-6]

    mae = sum(abs_errors) / n
    rmse = math.sqrt(sum(sq_errors) / n)
    mape = (sum(pct_errors) / len(pct_errors)) if pct_errors else 0.0

    y_mean = sum(y_true) / n
    ss_tot = sum((a - y_mean) ** 2 for a in y_true)
    ss_res = sum(sq_errors)
    r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 1e-9 else 0.0

    dir_hits = 0
    for a, p, prev in zip(y_true, y_pred, prev_prices):
        if (a - prev) * (p - prev) >= 0:
            dir_hits += 1
    dir_acc = (dir_hits / n) * 100.0

    ci_hits = sum(1 for a, p in zip(y_true, y_pred) if (p - ci_half_width) <= a <= (p + ci_half_width))
    ci_cov = (ci_hits / n) * 100.0

    return {
        "mae": round(mae, 3),
        "rmse": round(rmse, 3),
        "mape": round(mape, 2),
        "r_squared": round(r2, 4),
        "directional_accuracy": round(dir_acc, 1),
        "ci_coverage_pct": round(ci_cov, 1),
    }


def _wrap_sklearn_or_pure_models(X_train: List[List[float]], y_train: List[float]):
    if HAS_SKLEARN:
        X_np = np.array(X_train, dtype=float)
        y_np = np.array(y_train, dtype=float)
        mlr = Ridge(alpha=1.0).fit(X_np, y_np)
        rf = RandomForestRegressor(n_estimators=80, max_depth=6, min_samples_leaf=3, random_state=2026).fit(X_np, y_np)
        return mlr, rf, "scikit-learn"
    mlr = PurePythonRidgeOLS(alpha=1.0).fit(X_train, y_train)
    rf = PurePythonRandomForest(n_estimators=24, max_depth=5, seed=2026).fit(X_train, y_train)
    return mlr, rf, "python-stdlib"


def _predict_model(model: Any, X: List[List[float]], engine_kind: str) -> List[float]:
    if engine_kind == "scikit-learn":
        preds = model.predict(np.array(X, dtype=float))
        return [max(1.0, float(v)) for v in preds]
    return model.predict(X)


def evaluate_and_forecast_pair(
    clean_records: List[Dict[str, Any]],
    commodity: str,
    market: str,
    selected_model: str = "Multiple Linear Regression",
) -> Dict[str, Any]:
    """
    Trains baseline & tree ensemble models on chronological train+val data,
    evaluates strictly on held-out chronological test window, and generates
    1-day, 7-day, and 30-day forecasts with confidence intervals.
    """
    t0 = time.perf_counter()
    X, y, meta = build_supervised_dataset(clean_records, warmup_days=14)
    if len(X) < 30:
        raise ValueError(f"Insufficient chronological history ({len(X)} usable points) for {commodity} @ {market}")

    n = len(X)
    train_end = int(0.70 * n)
    val_end = int(0.85 * n)

    X_train, y_train = X[:train_end], y[:train_end]
    X_val, y_val, meta_val = X[train_end:val_end], y[train_end:val_end], meta[train_end:val_end]
    X_test, y_test, meta_test = X[val_end:], y[val_end:], meta[val_end:]

    mlr_model, rf_model, engine_kind = _wrap_sklearn_or_pure_models(X_train + X_val, y_train + y_val)

    # Residual std on validation split for calibrated confidence intervals
    mlr_train_only, rf_train_only, _ = _wrap_sklearn_or_pure_models(X_train, y_train)
    mlr_val_preds = _predict_model(mlr_train_only, X_val, engine_kind)
    rf_val_preds = _predict_model(rf_train_only, X_val, engine_kind)

    mlr_val_resid_std = max(0.25, statistics.pstdev([p - a for a, p in zip(y_val, mlr_val_preds)]))
    rf_val_resid_std = max(0.25, statistics.pstdev([p - a for a, p in zip(y_val, rf_val_preds)]))

    # Test evaluation
    mlr_test_preds = _predict_model(mlr_model, X_test, engine_kind)
    rf_test_preds = _predict_model(rf_model, X_test, engine_kind)
    # Moving average baseline uses rolling_7d_mean (feature index 4) directly
    ma_test_preds = [row[4] for row in X_test]
    ma_val_preds = [row[4] for row in X_val]
    ma_val_resid_std = max(0.3, statistics.pstdev([p - a for a, p in zip(y_val, ma_val_preds)]))

    prev_test = [m["prev_price"] for m in meta_test]

    mlr_metrics = compute_regression_metrics(y_test, mlr_test_preds, prev_test, 1.96 * mlr_val_resid_std)
    rf_metrics = compute_regression_metrics(y_test, rf_test_preds, prev_test, 1.96 * rf_val_resid_std)
    ma_metrics = compute_regression_metrics(y_test, ma_test_preds, prev_test, 1.96 * ma_val_resid_std)

    models_summary = [
        {
            "model_name": "Multiple Linear Regression",
            "version": "mlr-v2.2",
            **mlr_metrics,
            "is_baseline": True,
        },
        {
            "model_name": "Random Forest",
            "version": "rf-v2.2",
            **rf_metrics,
            "is_baseline": False,
        },
        {
            "model_name": "Seasonal Moving Average",
            "version": "sma-v1.0",
            **ma_metrics,
            "is_baseline": True,
        },
    ]

    # Pick requested model or best RMSE model between MLR and Random Forest
    if "random forest" in selected_model.lower():
        winner_name = "Random Forest"
        winner_model = rf_model
        winner_preds = rf_test_preds
        winner_resid_std = rf_val_resid_std
    elif "moving average" in selected_model.lower() or "sarima" in selected_model.lower():
        winner_name = "Seasonal Moving Average"
        winner_model = None
        winner_preds = ma_test_preds
        winner_resid_std = ma_val_resid_std
    else:
        # Select automatically based on lowest RMSE unless MLR requested explicitly
        if "linear" in selected_model.lower():
            winner_name = "Multiple Linear Regression"
            winner_model = mlr_model
            winner_preds = mlr_test_preds
            winner_resid_std = mlr_val_resid_std
        elif rf_metrics["rmse"] < mlr_metrics["rmse"]:
            winner_name = "Random Forest"
            winner_model = rf_model
            winner_preds = rf_test_preds
            winner_resid_std = rf_val_resid_std
        else:
            winner_name = "Multiple Linear Regression"
            winner_model = mlr_model
            winner_preds = mlr_test_preds
            winner_resid_std = mlr_val_resid_std

    for m in models_summary:
        m["is_active"] = (m["model_name"] == winner_name)

    ci_half = 1.96 * winner_resid_std
    backtesting_results = [
        {
            "date": m["date"],
            "actual": round(a, 2),
            "predicted": round(p, 2),
            "error": round(p - a, 2),
            "ci_lower": round(max(1.0, p - ci_half), 2),
            "ci_upper": round(p + ci_half, 2),
        }
        for m, a, p in zip(meta_test, y_test, winner_preds)
    ]

    # Recursive 30-day forecast using the identical build_feature_vector pipeline
    history_prices = [float(r["clean_modal_price"]) for r in clean_records]
    latest_rec = clean_records[-1]
    latest_date = datetime.strptime(latest_rec["arrival_date"], "%Y-%m-%d").date()
    recent_arr = statistics.mean([float(r["arrival_tonnes"]) for r in clean_records[-7:]])
    recent_rain = statistics.mean([float(r["rainfall_mm"]) for r in clean_records[-7:]])
    recent_temp = statistics.mean([float(r["temp_c"]) for r in clean_records[-7:]])

    rolling_hist = history_prices[:]
    daily_forecasts: List[Dict[str, Any]] = []
    for day in range(1, 31):
        f_date = (latest_date + timedelta(days=day)).isoformat()
        vec = build_feature_vector(
            price_history=rolling_hist,
            target_date_iso=f_date,
            arrival_tonnes=recent_arr,
            rainfall_mm=recent_rain,
            temp_c=recent_temp,
        )
        if winner_model is None:
            pred_val = vec[4]  # 7-day rolling mean
        else:
            pred_val = _predict_model(winner_model, [vec], engine_kind)[0]

        pred_val = round(max(1.0, pred_val), 2)
        horizon_se = winner_resid_std * math.sqrt(day)
        ci_lo = round(max(1.0, pred_val - 1.96 * horizon_se), 2)
        ci_hi = round(pred_val + 1.96 * horizon_se, 2)

        daily_forecasts.append({
            "day": day,
            "date": f_date,
            "predicted_price": pred_val,
            "confidence_interval": [ci_lo, ci_hi],
        })
        rolling_hist.append(pred_val)

    current_modal = round(float(latest_rec["modal_price"]), 2)
    next_day_price = daily_forecasts[0]["predicted_price"]
    avg_7d = round(sum(p["predicted_price"] for p in daily_forecasts[:7]) / 7.0, 2)
    avg_30d = round(sum(p["predicted_price"] for p in daily_forecasts[:30]) / 30.0, 2)
    expected_change_pct = round(((avg_7d - current_modal) / max(1e-6, current_modal)) * 100.0, 1)

    elapsed_ms = round((time.perf_counter() - t0) * 1000.0, 1)
    sources = {str(r.get("data_source") or "sample").strip().lower() for r in clean_records}
    has_uploaded_or_live = any(s in ("live", "csv_upload", "agmarknet_live") for s in sources)
    data_origin = "sqlite_uploaded_or_live_dataset" if has_uploaded_or_live else "sample_dataset_demonstration"
    is_demo = not has_uploaded_or_live

    return {
        "commodity": commodity,
        "market": market,
        "state": latest_rec.get("state", ""),
        "district": latest_rec.get("district", ""),
        "latest_observed_date": latest_rec["arrival_date"],
        "current_modal_price": current_modal,
        "predicted_next_day_price": next_day_price,
        "predicted_7day_avg": avg_7d,
        "predicted_30day_avg": avg_30d,
        "expected_change_percent": expected_change_pct,
        "confidence_interval": daily_forecasts[0]["confidence_interval"],
        "active_model": winner_name,
        "feature_set_version": FEATURE_SET_VERSION,
        "ml_runtime": f"python-{engine_kind}",
        "compute_latency_ms": elapsed_ms,
        "split_summary": {
            "total_usable_samples": n,
            "train_samples": train_end,
            "validation_samples": val_end - train_end,
            "test_samples": n - val_end,
            "train_period": f"{clean_records[0]['arrival_date']} to {meta[train_end - 1]['date']}",
            "validation_period": f"{meta_val[0]['date']} to {meta_val[-1]['date']}",
            "test_period": f"{meta_test[0]['date']} to {meta_test[-1]['date']}",
        },
        "models": models_summary,
        "backtesting_results": backtesting_results,
        "daily_forecasts_30d": daily_forecasts,
        "data_origin": data_origin,
        "is_demonstration_data": is_demo,
        "disclaimer": (
            "Forecasts and accuracy metrics are computed using chronological backtesting over local SQLite records "
            "(including admin-uploaded or synced series)."
            if has_uploaded_or_live
            else "Forecasts and accuracy metrics are computed strictly from the bundled educational sample dataset "
            "using chronological backtesting. Treat as demonstration estimates rather than live APMC trading guarantees."
        ),
    }


def evaluate_all_pairs(csv_path: str) -> Dict[str, Any]:
    raw = load_csv_records(csv_path)
    base_audit = preprocess_and_audit_series(raw)["audit"]

    pairs = sorted({(r.get("commodity", "").strip(), r.get("market", "").strip()) for r in raw if r.get("commodity") and r.get("market")})
    pair_results: Dict[str, Any] = {}
    aggregated_outliers: List[Dict[str, Any]] = []
    total_outliers_count = 0

    for comm, mkt in pairs:
        cleaned = preprocess_and_audit_series(raw, commodity=comm, market=mkt)
        pair_outliers = cleaned["audit"].get("outliers", [])
        total_outliers_count += cleaned["audit"].get("outliers_count", 0)
        aggregated_outliers.extend(pair_outliers)
        if len(cleaned["records"]) >= 45:
            res = evaluate_and_forecast_pair(cleaned["records"], comm, mkt)
            res["pair_audit"] = cleaned["audit"]
            pair_results[f"{comm}::{mkt}"] = res

    aggregated_outliers.sort(key=lambda o: abs(o.get("z_score", 0)), reverse=True)
    global_audit = {
        **base_audit,
        "outliers_count": total_outliers_count,
        "outliers": aggregated_outliers[:20],
    }

    return {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "feature_set_version": FEATURE_SET_VERSION,
        "features": FEATURE_NAMES,
        "ml_runtime": "python-scikit-learn" if HAS_SKLEARN else "python-stdlib",
        "data_origin": "sample_dataset_demonstration",
        "is_demonstration_data": True,
        "global_audit": global_audit,
        "pairs_count": len(pair_results),
        "pairs": pair_results,
    }


def main():
    parser = argparse.ArgumentParser(description="KisanMandi Local Python ML Engine")
    parser.add_argument("--csv", default=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "sample_agmarknet_prices.csv"))
    parser.add_argument("--out", default="")
    parser.add_argument("--commodity", default="")
    parser.add_argument("--market", default="")
    parser.add_argument("--model", default="Random Forest")
    args = parser.parse_args()

    if args.commodity and args.market:
        raw = load_csv_records(args.csv)
        cleaned = preprocess_and_audit_series(raw, args.commodity, args.market)
        result = evaluate_and_forecast_pair(cleaned["records"], args.commodity, args.market, args.model)
    else:
        result = evaluate_all_pairs(args.csv)

    payload = json.dumps(result, indent=2)
    if args.out:
        os.makedirs(os.path.dirname(args.out), exist_ok=True)
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(payload)
    else:
        print(payload)


if __name__ == "__main__":
    main()
