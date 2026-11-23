/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Python ML Runner & SQLite Model Registry Synchronizer
 * Connects Node/Express API to local Python ML engine (ml/ml_engine.py)
 * and persists trained model evaluation artifacts into SQLite.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'url';
import { getDb } from './database.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const CACHE_PATH = path.join(ROOT_DIR, 'data', 'ml_artifacts_cache.json');
const SAMPLE_CSV_PATH = path.join(ROOT_DIR, 'data', 'sample_agmarknet_prices.csv');
const ML_SCRIPT_PATH = path.join(ROOT_DIR, 'ml', 'ml_engine.py');

export interface ModelEvaluationSummary {
  model_name: string;
  version: string;
  mae: number;
  rmse: number;
  mape: number;
  r_squared: number;
  directional_accuracy: number;
  ci_coverage_pct: number;
  is_baseline: boolean;
  is_active: boolean;
}

export interface PairMLArtifact {
  commodity: string;
  market: string;
  state: string;
  district: string;
  latest_observed_date: string;
  current_modal_price: number;
  predicted_next_day_price: number;
  predicted_7day_avg: number;
  predicted_30day_avg: number;
  expected_change_percent: number;
  confidence_interval: [number, number];
  active_model: string;
  feature_set_version: string;
  ml_runtime: string;
  compute_latency_ms: number;
  split_summary: {
    total_usable_samples: number;
    train_samples: number;
    validation_samples: number;
    test_samples: number;
    train_period: string;
    validation_period: string;
    test_period: string;
  };
  models: ModelEvaluationSummary[];
  backtesting_results: Array<{
    date: string;
    actual: number;
    predicted: number;
    error: number;
    ci_lower: number;
    ci_upper: number;
  }>;
  daily_forecasts_30d: Array<{
    day: number;
    date: string;
    predicted_price: number;
    confidence_interval: [number, number];
  }>;
  data_origin: string;
  is_demonstration_data: boolean;
  disclaimer: string;
  pair_audit?: {
    raw_records_count: number;
    clean_records_count: number;
    duplicates_removed: number;
    missing_counts: Record<string, number>;
    completeness_pct: number;
    outliers_count: number;
    outliers: Array<Record<string, any>>;
  };
}

export interface GlobalMLCache {
  generated_at: string;
  feature_set_version: string;
  features: string[];
  ml_runtime: string;
  data_origin: string;
  is_demonstration_data: boolean;
  global_audit: {
    raw_records_count: number;
    clean_records_count: number;
    duplicates_removed: number;
    missing_counts: Record<string, number>;
    completeness_pct: number;
    outliers_count: number;
    outliers: Array<Record<string, any>>;
  };
  pairs_count: number;
  pairs: Record<string, PairMLArtifact>;
}

let memoryCache: GlobalMLCache | null = null;

export function runPythonMLEngine(): GlobalMLCache | null {
  try {
    execFileSync('python3', [ML_SCRIPT_PATH, '--csv', SAMPLE_CSV_PATH, '--out', CACHE_PATH], {
      cwd: ROOT_DIR,
      timeout: 45000,
      stdio: 'pipe',
    });
    if (fs.existsSync(CACHE_PATH)) {
      memoryCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8')) as GlobalMLCache;
      syncRegistryFromCache(memoryCache);
      return memoryCache;
    }
  } catch (err) {
    console.warn('Python ML runner execution warning:', err);
  }
  return null;
}

export function getMLCache(): GlobalMLCache | null {
  if (memoryCache) return memoryCache;
  if (fs.existsSync(CACHE_PATH)) {
    try {
      memoryCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8')) as GlobalMLCache;
      syncRegistryFromCache(memoryCache);
      return memoryCache;
    } catch {
      // regenerate
    }
  }
  return runPythonMLEngine();
}

function escapeCsvCell(val: unknown): string {
  const s = val === null || val === undefined ? '' : String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function runPairRetraining(
  commodity: string,
  market: string,
  algorithm: string = 'Random Forest'
): PairMLArtifact | null {
  const tmpCsv = path.join(ROOT_DIR, 'data', `.retrain_${Date.now()}_${commodity}_${market}.csv`.replace(/[^a-zA-Z0-9._-]/g, '_'));
  try {
    // Export current SQLite rows for the series to a temp CSV so admin-uploaded rows are included!
    const db = getDb();
    const rows = db
      .prepare(`
        SELECT arrival_date, state, district, market, commodity, variety, grade,
               min_price, max_price, modal_price, arrival_tonnes, rainfall_mm, temp_c, data_source
        FROM historical_prices
        WHERE LOWER(commodity) = LOWER(?) AND LOWER(market) = LOWER(?)
        ORDER BY arrival_date ASC
      `)
      .all(commodity, market) as Array<Record<string, any>>;

    if (rows.length >= 45) {
      const headers = [
        'arrival_date', 'state', 'district', 'market', 'commodity', 'variety', 'grade',
        'min_price', 'max_price', 'modal_price', 'arrival_tonnes', 'rainfall_mm', 'temp_c', 'data_source',
      ];
      const csvLines = [
        headers.join(','),
        ...rows.map((r) => headers.map((h) => escapeCsvCell(r[h])).join(',')),
      ];
      fs.writeFileSync(tmpCsv, csvLines.join('\n'), 'utf-8');
    }

    const csvArg = fs.existsSync(tmpCsv) ? tmpCsv : SAMPLE_CSV_PATH;
    const rawOut = execFileSync(
      'python3',
      [ML_SCRIPT_PATH, '--csv', csvArg, '--commodity', commodity, '--market', market, '--model', algorithm],
      { cwd: ROOT_DIR, timeout: 25000, encoding: 'utf-8' }
    );

    const artifact = JSON.parse(rawOut) as PairMLArtifact;
    const cache = getMLCache();
    if (cache) {
      cache.pairs[`${commodity}::${market}`] = artifact;
      const isIsolatedTestRun =
        process.env.NODE_ENV === 'test' ||
        Boolean(process.env.SQLITE_DB_PATH && path.resolve(process.env.SQLITE_DB_PATH) !== path.resolve(ROOT_DIR, 'data', 'kisanmandi.db'));
      if (!isIsolatedTestRun) {
        fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
      }
    }

    // Record new version in SQLite model_registry
    recordModelVersionInDb(artifact, algorithm);
    return artifact;
  } catch (err) {
    console.warn('Pair retraining error:', err);
    return null;
  } finally {
    if (fs.existsSync(tmpCsv)) {
      try {
        fs.unlinkSync(tmpCsv);
      } catch {
        // ignore cleanup failure
      }
    }
  }
}

function recordModelVersionInDb(artifact: PairMLArtifact, algorithm: string) {
  try {
    const db = getDb();
    const activeMetric =
      artifact.models.find((m) => m.is_active) || artifact.models[0];

    const existingCount = (
      db
        .prepare('SELECT COUNT(*) as cnt FROM model_registry WHERE commodity = ? AND market = ?')
        .get(artifact.commodity, artifact.market) as { cnt: number }
    ).cnt;

    const version = `v2.${existingCount + 1}`;
    const id = `mdl_${artifact.commodity.toLowerCase()}_${artifact.market.toLowerCase()}_v2_${existingCount + 1}`.replace(/[^a-z0-9_]/g, '_');

    db.prepare(`
      UPDATE model_registry SET status = 'Archived'
      WHERE commodity = ? AND market = ? AND status = 'Active'
    `).run(artifact.commodity, artifact.market);

    db.prepare(`
      INSERT INTO model_registry (
        id, version, commodity, market, algorithm, feature_set_version, dataset_snapshot,
        hyperparameters, mae, rmse, mape, r2, directional_accuracy, approval_status,
        status, training_dataset_size, data_origin, trained_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?)
    `).run(
      id,
      version,
      artifact.commodity,
      artifact.market,
      algorithm || artifact.active_model,
      artifact.feature_set_version,
      `sqlite_snapshot_${artifact.latest_observed_date}`,
      JSON.stringify(
        algorithm.toLowerCase().includes('forest')
          ? { n_estimators: 24, max_depth: 5 }
          : { alpha: 1.0, solver: 'ridge-ols' }
      ),
      activeMetric?.mae ?? 1.0,
      activeMetric?.rmse ?? 1.3,
      activeMetric?.mape ?? 3.5,
      activeMetric?.r_squared ?? 0.7,
      activeMetric?.directional_accuracy ?? 65.0,
      'APPROVED',
      artifact.split_summary.total_usable_samples,
      artifact.data_origin,
      new Date().toISOString()
    );
  } catch (err) {
    console.warn('Failed to persist model version in SQLite:', err);
  }
}

export function syncRegistryFromCache(cache: GlobalMLCache): void {
  try {
    const db = getDb();
    const countRow = db.prepare('SELECT COUNT(*) as cnt FROM model_registry').get() as { cnt: number };
    if (countRow.cnt > 0) return;

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO model_registry (
        id, version, commodity, market, algorithm, feature_set_version, dataset_snapshot,
        hyperparameters, mae, rmse, mape, r2, directional_accuracy, approval_status,
        status, training_dataset_size, data_origin, trained_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', ?, ?, ?, ?)
    `);

    const nowIso = new Date().toISOString();
    const entries = Object.values(cache.pairs);

    db.exec('BEGIN;');
    try {
      for (const pair of entries) {
        for (const model of pair.models) {
          if (model.model_name === 'Seasonal Moving Average') continue;
          const id = `mdl_${pair.commodity}_${pair.market}_${model.version}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
          const status = model.is_active ? 'Active' : 'Archived';
          insertStmt.run(
            id,
            model.version,
            pair.commodity,
            pair.market,
            model.model_name,
            pair.feature_set_version,
            `sample_csv_${pair.latest_observed_date}`,
            JSON.stringify(
              model.model_name === 'Random Forest'
                ? { n_estimators: 24, max_depth: 5 }
                : { alpha: 1.0 }
            ),
            model.mae,
            model.rmse,
            model.mape,
            model.r_squared,
            model.directional_accuracy,
            status,
            pair.split_summary.total_usable_samples,
            pair.data_origin,
            nowIso
          );
        }
      }
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  } catch (err) {
    console.warn('Sync model registry warning:', err);
  }
}

export function findPairArtifact(commodity: string, market: string): PairMLArtifact | null {
  const cache = getMLCache();
  if (!cache) return null;

  const exactKey = `${commodity}::${market}`;
  if (cache.pairs[exactKey]) return cache.pairs[exactKey];

  // Match case-insensitively by commodity + market
  const foundExact = Object.values(cache.pairs).find(
    (p) =>
      p.commodity.toLowerCase() === commodity.toLowerCase() &&
      p.market.toLowerCase() === market.toLowerCase()
  );
  if (foundExact) return foundExact;

  // Match same commodity in default benchmark market if custom market specified
  const byCommodity = Object.values(cache.pairs).find(
    (p) => p.commodity.toLowerCase() === commodity.toLowerCase()
  );
  return byCommodity || Object.values(cache.pairs)[0] || null;
}
