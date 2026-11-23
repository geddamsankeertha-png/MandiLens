import os
import unittest

from ml.ml_engine import (
    FEATURE_SET_VERSION,
    build_feature_vector,
    compute_regression_metrics,
    evaluate_and_forecast_pair,
    load_csv_records,
    preprocess_and_audit_series,
)


class TestKisanMandiMLEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        cls.csv_path = os.path.join(root, "data", "sample_agmarknet_prices.csv")
        cls.raw = load_csv_records(cls.csv_path)

    def test_dataset_loaded_exact_count(self):
        self.assertEqual(len(self.raw), 8800)

    def test_preprocessing_detects_missing_and_outliers(self):
        audited = preprocess_and_audit_series(self.raw, commodity="Tomato", market="Guntur")
        self.assertGreater(len(audited["records"]), 150)
        self.assertGreater(audited["audit"]["outliers_count"], 0)
        for rec in audited["records"]:
            self.assertIsNotNone(rec["arrival_tonnes"])
            self.assertIsNotNone(rec["rainfall_mm"])
            self.assertIsNotNone(rec["temp_c"])
            self.assertGreater(rec["clean_modal_price"], 0)

    def test_zero_price_mape_handling(self):
        metrics = compute_regression_metrics(
            y_true=[0.0, 20.0, 40.0],
            y_pred=[2.0, 22.0, 44.0],
            prev_prices=[10.0, 19.0, 39.0],
            ci_half_width=5.0,
        )
        self.assertAlmostEqual(metrics["mape"], 10.0, places=2)
        all_zero = compute_regression_metrics([0.0, 0.0], [1.0, 2.0], [0.0, 0.0], 3.0)
        self.assertEqual(all_zero["mape"], 0.0)

    def test_chronological_split_and_feature_consistency(self):
        audited = preprocess_and_audit_series(self.raw, commodity="Tomato", market="Guntur")
        res = evaluate_and_forecast_pair(audited["records"], "Tomato", "Guntur")
        split = res["split_summary"]
        self.assertGreater(split["train_samples"], split["validation_samples"])
        self.assertGreater(split["test_samples"], 10)
        self.assertLess(split["train_period"].split(" to ")[1], split["validation_period"].split(" to ")[0])
        self.assertLess(split["validation_period"].split(" to ")[1], split["test_period"].split(" to ")[0])
        self.assertEqual(res["feature_set_version"], FEATURE_SET_VERSION)
        self.assertEqual(res["data_origin"], "sample_dataset_demonstration")
        self.assertTrue(res["is_demonstration_data"])

    def test_model_metrics_and_horizon_ci_widening(self):
        audited = preprocess_and_audit_series(self.raw, commodity="Onion", market="Lasalgaon")
        res = evaluate_and_forecast_pair(audited["records"], "Onion", "Lasalgaon", "Random Forest")
        self.assertEqual(len(res["models"]), 3)
        for m in res["models"]:
            self.assertGreater(m["mae"], 0)
            self.assertGreaterEqual(m["rmse"], m["mae"] - 1e-6)
            self.assertGreater(m["mape"], 0)
            self.assertLessEqual(m["r_squared"], 1.0)

        forecasts = res["daily_forecasts_30d"]
        self.assertEqual(len(forecasts), 30)
        widths = []
        for pt in forecasts:
            lo, hi = pt["confidence_interval"]
            self.assertLess(lo, pt["predicted_price"] + 0.01)
            self.assertGreater(hi, pt["predicted_price"] - 0.01)
            widths.append(hi - lo)
        # 30-day CI band must be wider than 7-day, which must be wider than 1-day (or equal if floored at 1.0)
        self.assertGreater(widths[29], widths[0])
        self.assertGreaterEqual(widths[6], widths[0])

    def test_uploaded_source_provenance_flagged_non_demo(self):
        audited = preprocess_and_audit_series(self.raw, commodity="Potato", market="Agra")
        records = [dict(r, data_source="csv_upload") for r in audited["records"]]
        res = evaluate_and_forecast_pair(records, "Potato", "Agra")
        self.assertEqual(res["data_origin"], "sqlite_uploaded_or_live_dataset")
        self.assertFalse(res["is_demonstration_data"])

    def test_shared_feature_builder_deterministic(self):
        v1 = build_feature_vector([30.0, 31.0, 32.0, 33.0, 34.0, 35.0, 36.0], "2026-10-31", 1200.0, 45.0, 30.0)
        v2 = build_feature_vector([30.0, 31.0, 32.0, 33.0, 34.0, 35.0, 36.0], "2026-10-31", 1200.0, 45.0, 30.0)
        self.assertEqual(v1, v2)
        self.assertEqual(len(v1), 12)


if __name__ == "__main__":
    unittest.main()
