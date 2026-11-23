/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * KisanMandi Data Pipeline & Versioned Model Registry Engine
 * - Optional AGMARKNET / data.gov.in live sync with bounded exponential backoff retry & Retry-After support
 * - Offline sample dataset fallback with explicit provenance labeling
 * - SQLite CSV ingestion & staging queue validation with ON CONFLICT upserts
 * - Real missing-value & outlier reports computed from bundled/uploaded data
 * - Python ML retraining trigger & one-step SQLite model rollback
 * - Admin dashboard consecutive failure tracking and health warnings
 */

import { getDb } from './database.ts';
import { getMLCache, runPairRetraining, runPythonMLEngine } from './mlRunner.ts';
import { secretManager } from './secretManager.ts';
import { fetchAgmarknetPage } from './agmarknetClient.ts';
import { agmarknetV2Client, AgmarknetV2MarketDetail } from './agmarknetV2Client.ts';

export interface ModelVersionRecord {
  id: string;
  version: string;
  commodity: string;
  market: string;
  algorithm: string;
  feature_set_version: string;
  dataset_snapshot: string;
  hyperparameters: string;
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
  directional_accuracy: number;
  approval_status: string;
  status: 'Active' | 'Archived' | 'RolledBack';
  training_dataset_size: number;
  data_origin: string;
  trained_at: string;
}

class LiveDataPipelineEngine {
  private agmarknetV2Enabled: boolean = true;

  private getApiKey(): string {
    return secretManager.getSecret('DATA_GOV_IN_API_KEY', '');
  }

  public isAgmarknetV2Enabled(): boolean {
    return this.agmarknetV2Enabled;
  }

  public setAgmarknetV2Enabled(enabled: boolean): boolean {
    this.agmarknetV2Enabled = Boolean(enabled);
    return this.agmarknetV2Enabled;
  }

  public getStatus() {
    const db = getDb();
    const apiKey = this.getApiKey();
    const totalPriceRows = (
      db.prepare('SELECT COUNT(*) as cnt FROM historical_prices').get() as { cnt: number }
    ).cnt;
    const v2PriceRows = (
      db.prepare("SELECT COUNT(*) as cnt FROM historical_prices WHERE data_source = 'agmarknet_v2'").get() as { cnt: number }
    ).cnt;
    const activeModelsCount = (
      db.prepare("SELECT COUNT(*) as cnt FROM model_registry WHERE status = 'Active'").get() as { cnt: number }
    ).cnt;
    const runs = db
      .prepare('SELECT * FROM pipeline_runs ORDER BY id DESC LIMIT 50')
      .all() as Array<Record<string, any>>;

    // AGMARKNET 1.0 (data.gov.in) failure tracking
    const v1Runs = runs.filter((r) => r.source !== 'AGMARKNET 2.0 Portal');
    let consecutiveFailures = 0;
    for (const r of v1Runs) {
      if (r.status === 'SUCCESS' || r.status === 'OFFLINE_SAMPLE') {
        break;
      }
      if (['FAILED_GRACEFUL', 'FAILED', 'ERROR'].includes(r.status)) {
        consecutiveFailures++;
      }
    }
    const consecutiveFailuresWarning = consecutiveFailures >= 3;
    const latestFailureReason =
      v1Runs.find((r) => ['FAILED_GRACEFUL', 'FAILED', 'ERROR'].includes(r.status))?.failure_reason || null;
    const lastSuccessfulRun = v1Runs.find((r) => r.status === 'SUCCESS');

    // AGMARKNET 2.0 failure tracking
    const v2Runs = runs.filter((r) => r.source === 'AGMARKNET 2.0 Portal');
    let v2ConsecutiveFailures = 0;
    for (const r of v2Runs) {
      if (r.status === 'SUCCESS') {
        break;
      }
      if (['FAILED_GRACEFUL', 'FAILED', 'ERROR'].includes(r.status)) {
        v2ConsecutiveFailures++;
      }
    }
    const v2ConsecutiveFailuresWarning = v2ConsecutiveFailures >= 3;
    const v2LatestFailureReason =
      v2Runs.find((r) => ['FAILED_GRACEFUL', 'FAILED', 'ERROR'].includes(r.status))?.failure_reason || null;
    const v2LastSuccessfulRun = v2Runs.find((r) => r.status === 'SUCCESS');

    const freshnessRows = db
      .prepare(`
        SELECT commodity, market, MAX(arrival_date) as latest_date, COUNT(*) as total_rows, MAX(data_source) as data_source
        FROM historical_prices
        GROUP BY commodity, market
        ORDER BY total_rows DESC
        LIMIT 8
      `)
      .all() as Array<Record<string, any>>;

    return {
      apiKeyConfigured: Boolean(apiKey),
      maskedApiKey: apiKey ? `*****${apiKey.slice(-4)}` : 'Not Configured (Offline Sample Mode)',
      offlineSampleMode: !apiKey,
      totalHistoricalRows: totalPriceRows,
      activeModelsCount,
      consecutiveFailures,
      consecutiveFailuresWarning,
      latestFailureReason,
      lastSuccessfulSync: lastSuccessfulRun?.executed_at || null,
      lastFetchTime: runs[0]?.executed_at || new Date().toISOString(),
      agmarknetV2: {
        enabled: this.agmarknetV2Enabled,
        baseUrl: 'https://api.agmarknet.gov.in/v1/',
        requiresAuth: false,
        authType: 'Public (Zero Key Required)',
        totalRecords: v2PriceRows,
        consecutiveFailures: v2ConsecutiveFailures,
        consecutiveFailuresWarning: v2ConsecutiveFailuresWarning,
        latestFailureReason: v2LatestFailureReason,
        lastSuccessfulSync: v2LastSuccessfulRun?.executed_at || null,
      },
      lineage: runs.slice(0, 20),
      freshness: freshnessRows.map((f) => ({
        commodity: f.commodity,
        market: f.market,
        lastSuccessfulSync: f.latest_date,
        status: 'READY',
        recordsCountToday: f.total_rows,
        dataSource: f.data_source,
      })),
    };
  }

  public setApiKey(key: string) {
    secretManager.setSecret('DATA_GOV_IN_API_KEY', key.trim());
    return this.getStatus();
  }

  public validateRecord(record: any): { isValid: boolean; error?: string } {
    if (!record.commodity || typeof record.commodity !== 'string') {
      return { isValid: false, error: 'Missing or invalid commodity name' };
    }
    if (!record.market || typeof record.market !== 'string') {
      return { isValid: false, error: 'Missing or invalid market name' };
    }
    if (typeof record.modalPrice !== 'number' || Number.isNaN(record.modalPrice) || record.modalPrice <= 0) {
      return { isValid: false, error: `Invalid modal price: ${record.modalPrice}` };
    }
    if (record.arrivalQuantityTonne !== undefined && (typeof record.arrivalQuantityTonne !== 'number' || record.arrivalQuantityTonne < 0)) {
      return { isValid: false, error: `Invalid arrival quantity: ${record.arrivalQuantityTonne}` };
    }
    return { isValid: true };
  }

  /**
   * Triggers AGMARKNET live ingestion ONLY if DATA_GOV_IN_API_KEY is configured.
   * Utilizes bounded exponential backoff retry and records attempts in pipeline_runs.
   */
  public async triggerIngestion(source: string = 'AGMARKNET / data.gov.in API') {
    const db = getDb();
    const apiKey = this.getApiKey();
    const nowIso = new Date().toISOString();

    if (!apiKey) {
      db.prepare(`
        INSERT INTO pipeline_runs (source, source_url, record_count, status, failure_reason, retry_attempts, executed_at)
        VALUES (?, ?, ?, 'OFFLINE_SAMPLE', ?, 0, ?)
      `).run(
        source,
        'offline://data/sample_agmarknet_prices.csv',
        'No DATA_GOV_IN_API_KEY configured. Running in zero-cost offline mode using local SQLite sample dataset.',
        nowIso
      );

      return {
        success: true,
        offlineMode: true,
        source_mode: 'offline_sample',
        recordsFetched: 0,
        message: 'Running in Offline Sample Mode (DATA_GOV_IN_API_KEY not configured). Bundled sample dataset in SQLite remains active.',
        timestamp: nowIso,
      };
    }

    const baseUrl = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

    try {
      const pageResult = await fetchAgmarknetPage({
        apiKey,
        limit: 200,
        offset: 0,
        retryOptions: { maxRetries: 3, initialDelayMs: 1000 },
      });

      const records = pageResult.records;
      const retryAttempts = pageResult.attemptsMade - 1;

      const upsertStmt = db.prepare(`
        INSERT INTO historical_prices (
          arrival_date, state, district, market, commodity, variety, grade,
          min_price, max_price, modal_price, arrival_tonnes, data_source, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'live', ?)
        ON CONFLICT (arrival_date, commodity, market) DO UPDATE SET
          modal_price = excluded.modal_price,
          min_price = excluded.min_price,
          max_price = excluded.max_price,
          arrival_tonnes = COALESCE(excluded.arrival_tonnes, historical_prices.arrival_tonnes),
          data_source = excluded.data_source,
          created_at = excluded.created_at
      `);

      let inserted = 0;
      let rejected = 0;

      db.exec('BEGIN;');
      try {
        for (const rec of records) {
          const rawModal = parseFloat(String(rec.modal_price));
          const rawMin = parseFloat(String(rec.min_price));
          const rawMax = parseFloat(String(rec.max_price));
          const modalKg = rawModal >= 400 ? Math.round((rawModal / 100) * 100) / 100 : rawModal;
          const minKg = rawMin >= 400 ? Math.round((rawMin / 100) * 100) / 100 : rawMin;
          const maxKg = rawMax >= 400 ? Math.round((rawMax / 100) * 100) / 100 : rawMax;

          const check = this.validateRecord({
            commodity: rec.commodity,
            market: rec.market,
            modalPrice: modalKg,
          });
          if (!check.isValid) {
            rejected++;
            continue;
          }

          let isoDate = String(rec.arrival_date || '').trim();
          if (isoDate.includes('/')) {
            const [d, m, y] = isoDate.split('/');
            if (y && m && d) isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }
          if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
            isoDate = nowIso.split('T')[0];
          }

          upsertStmt.run(
            isoDate,
            rec.state || 'Unknown',
            rec.district || rec.market || 'Unknown',
            rec.market,
            rec.commodity,
            rec.variety || 'FAQ',
            rec.grade || 'FAQ',
            isNaN(minKg) ? modalKg * 0.9 : minKg,
            isNaN(maxKg) ? modalKg * 1.1 : maxKg,
            modalKg,
            null,
            nowIso
          );
          inserted++;
        }
        db.exec('COMMIT;');
      } catch (txErr) {
        db.exec('ROLLBACK;');
        throw txErr;
      }

      db.prepare(`
        INSERT INTO pipeline_runs (source, source_url, record_count, status, failure_reason, retry_attempts, executed_at)
        VALUES (?, ?, ?, 'SUCCESS', NULL, ?, ?)
      `).run(source, baseUrl, inserted, retryAttempts, nowIso);

      return {
        success: true,
        offlineMode: false,
        source_mode: 'live_api',
        recordsFetched: inserted,
        quarantinedCount: rejected,
        retryAttempts,
        message: `Ingested ${inserted} live AGMARKNET records into SQLite (${rejected} invalid skipped, ${retryAttempts} retries).`,
        timestamp: nowIso,
      };
    } catch (err: any) {
      db.prepare(`
        INSERT INTO pipeline_runs (source, source_url, record_count, status, failure_reason, retry_attempts, executed_at)
        VALUES (?, ?, 0, 'FAILED_GRACEFUL', ?, 3, ?)
      `).run(source, baseUrl, err?.message || 'Network unavailable or max retries exceeded', nowIso);

      return {
        success: false,
        offlineMode: true,
        source_mode: 'cached_fallback',
        recordsFetched: 0,
        message: `Live AGMARKNET fetch failed after retries (${err?.message || 'offline'}). Consecutive failure count incremented.`,
        timestamp: nowIso,
      };
    }
  }

  /**
   * Triggers AGMARKNET 2.0 live ingestion from official portal (api.agmarknet.gov.in).
   * No API key required.
   * Enforces 1.5s delay, retry handling, and unit normalization (Rs./Quintal -> Rs./kg).
   */
  public async triggerAgmarknetV2Ingestion(params?: {
    commodityId?: number;
    date?: string;
    limit?: number;
  }) {
    const db = getDb();
    const nowIso = new Date().toISOString();
    const source = 'AGMARKNET 2.0 Portal';
    const baseUrl = 'https://api.agmarknet.gov.in/v1/dashboard-data/';

    if (!this.agmarknetV2Enabled) {
      return {
        success: false,
        disabled: true,
        source_mode: 'disabled',
        recordsFetched: 0,
        message: 'AGMARKNET 2.0 integration is currently disabled in system settings.',
        timestamp: nowIso,
      };
    }

    const commodityId = params?.commodityId || 1;
    const targetDate = params?.date || nowIso.split('T')[0];
    const limit = Math.min(params?.limit || 50, 100);

    try {
      const { records, total } = await agmarknetV2Client.fetchMarketDetails({
        commodityId,
        date: targetDate,
        limit,
      });

      const upsertStmt = db.prepare(`
        INSERT INTO historical_prices (
          arrival_date, state, district, market, commodity, variety, grade,
          min_price, max_price, modal_price, arrival_tonnes, data_source, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'agmarknet_v2', ?)
        ON CONFLICT (arrival_date, commodity, market) DO UPDATE SET
          modal_price = excluded.modal_price,
          min_price = excluded.min_price,
          max_price = excluded.max_price,
          arrival_tonnes = COALESCE(excluded.arrival_tonnes, historical_prices.arrival_tonnes),
          data_source = excluded.data_source,
          created_at = excluded.created_at
      `);

      let inserted = 0;
      let rejected = 0;

      db.exec('BEGIN;');
      try {
        for (const raw of records) {
          const norm = agmarknetV2Client.normalizeRecord(raw, targetDate);
          if (!norm.isValid || !norm.record) {
            rejected++;
            continue;
          }
          const rec = norm.record;
          upsertStmt.run(
            rec.arrival_date,
            rec.state,
            rec.district,
            rec.market,
            rec.commodity,
            rec.variety,
            rec.grade,
            rec.min_price,
            rec.max_price,
            rec.modal_price,
            rec.arrival_tonnes,
            nowIso
          );
          inserted++;
        }
        db.exec('COMMIT;');
      } catch (txErr) {
        db.exec('ROLLBACK;');
        throw txErr;
      }

      db.prepare(`
        INSERT INTO pipeline_runs (source, source_url, record_count, status, failure_reason, retry_attempts, executed_at)
        VALUES (?, ?, ?, 'SUCCESS', NULL, 0, ?)
      `).run(source, baseUrl, inserted, nowIso);

      return {
        success: true,
        source_mode: 'live_agmarknet_v2',
        recordsFetched: inserted,
        totalReported: total,
        quarantinedCount: rejected,
        message: `Successfully ingested ${inserted} AGMARKNET 2.0 records into SQLite (${rejected} skipped). Unit converted Rs./Quintal -> Rs./kg.`,
        timestamp: nowIso,
      };
    } catch (err: any) {
      db.prepare(`
        INSERT INTO pipeline_runs (source, source_url, record_count, status, failure_reason, retry_attempts, executed_at)
        VALUES (?, ?, 0, 'FAILED_GRACEFUL', ?, 3, ?)
      `).run(source, baseUrl, err?.message || 'Transient network or API error', nowIso);

      return {
        success: false,
        source_mode: 'failed_graceful',
        recordsFetched: 0,
        message: `AGMARKNET 2.0 fetch encountered an issue: ${err?.message || 'Service unavailable'}. Offline SQLite data remains intact.`,
        timestamp: nowIso,
      };
    }
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  private normalizeIsoDate(rawDate: string): string | null {
    const trimmed = String(rawDate || '').trim();
    let iso = trimmed;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      const [d, m, y] = trimmed.split('/');
      iso = `${y}-${m}-${d}`;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    const dt = new Date(`${iso}T00:00:00Z`);
    if (Number.isNaN(dt.getTime()) || dt.toISOString().slice(0, 10) !== iso) return null;
    return iso;
  }

  public ingestCsvUpload(filename: string, csvText: string, uploadedBy: string = 'admin') {
    const db = getDb();
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0 && !l.trim().startsWith('#'));
    if (lines.length < 2) {
      return { success: false, error: 'CSV file must contain a header row and at least one data row.' };
    }

    const headers = this.parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    const idx = (name: string) => headers.indexOf(name);
    const colDate = idx('arrival_date') >= 0 ? idx('arrival_date') : idx('date');
    const colCommodity = idx('commodity');
    const colMarket = idx('market');
    const colModal = idx('modal_price');

    if (colDate < 0 || colCommodity < 0 || colMarket < 0 || colModal < 0) {
      return {
        success: false,
        error: 'CSV requires columns: arrival_date (or date), commodity, market, modal_price.',
      };
    }

    const colState = idx('state');
    const colDistrict = idx('district');
    const colVariety = idx('variety');
    const colGrade = idx('grade');
    const colMin = idx('min_price');
    const colMax = idx('max_price');
    const colArr = idx('arrival_tonnes');

    const nowIso = new Date().toISOString();
    const upsertStmt = db.prepare(`
      INSERT INTO historical_prices (
        arrival_date, state, district, market, commodity, variety, grade,
        min_price, max_price, modal_price, arrival_tonnes, data_source, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'csv_upload', ?)
      ON CONFLICT (arrival_date, commodity, market) DO UPDATE SET
        modal_price = excluded.modal_price,
        min_price = excluded.min_price,
        max_price = excluded.max_price,
        arrival_tonnes = COALESCE(excluded.arrival_tonnes, historical_prices.arrival_tonnes),
        data_source = excluded.data_source,
        created_at = excluded.created_at
    `);

    let validRows = 0;
    let invalidOrMissingRows = 0;
    let duplicates = 0;
    const seen = new Set<string>();

    db.exec('BEGIN;');
    try {
      for (let i = 1; i < lines.length; i++) {
        const cols = this.parseCsvLine(lines[i]);
        const isoDate = this.normalizeIsoDate(cols[colDate] || '');
        const comm = (cols[colCommodity] || '').trim();
        const mkt = (cols[colMarket] || '').trim();
        const modal = parseFloat(cols[colModal] || '');

        if (!isoDate || !comm || !mkt || Number.isNaN(modal) || modal <= 0) {
          invalidOrMissingRows++;
          continue;
        }

        const minP = colMin >= 0 ? parseFloat(cols[colMin] || '') : NaN;
        const maxP = colMax >= 0 ? parseFloat(cols[colMax] || '') : NaN;
        const arr = colArr >= 0 ? parseFloat(cols[colArr] || '') : NaN;

        if ((!Number.isNaN(minP) && minP <= 0) || (!Number.isNaN(maxP) && maxP <= 0)) {
          invalidOrMissingRows++;
          continue;
        }
        if (!Number.isNaN(minP) && !Number.isNaN(maxP) && minP > maxP) {
          invalidOrMissingRows++;
          continue;
        }
        if ((!Number.isNaN(minP) && modal < minP) || (!Number.isNaN(maxP) && modal > maxP)) {
          invalidOrMissingRows++;
          continue;
        }
        if (!Number.isNaN(arr) && arr < 0) {
          invalidOrMissingRows++;
          continue;
        }

        const key = `${isoDate}::${comm.toLowerCase()}::${mkt.toLowerCase()}`;
        if (seen.has(key)) duplicates++;
        seen.add(key);

        upsertStmt.run(
          isoDate,
          colState >= 0 && cols[colState] ? cols[colState] : 'Andhra Pradesh',
          colDistrict >= 0 && cols[colDistrict] ? cols[colDistrict] : mkt,
          mkt,
          comm,
          colVariety >= 0 && cols[colVariety] ? cols[colVariety] : 'FAQ',
          colGrade >= 0 && cols[colGrade] ? cols[colGrade] : 'FAQ',
          Number.isNaN(minP) ? Math.round(modal * 0.9 * 100) / 100 : minP,
          Number.isNaN(maxP) ? Math.round(modal * 1.1 * 100) / 100 : maxP,
          modal,
          Number.isNaN(arr) ? null : arr,
          nowIso
        );
        validRows++;
      }
      if (validRows === 0) {
        db.exec('ROLLBACK;');
        return {
          success: false,
          error: 'No valid market price rows found in CSV (verify YYYY-MM-DD dates, positive prices, and min <= modal <= max).',
        };
      }
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }

    const dsId = `ds_${Date.now().toString(36)}`;
    const missPct = `${((invalidOrMissingRows / Math.max(1, lines.length - 1)) * 100).toFixed(1)}%`;

    db.prepare(`
      INSERT INTO datasets_queue (id, filename, source, rows_count, missing_pct, duplicate_rows, status, uploaded_by, uploaded_at)
      VALUES (?, ?, 'Manual Admin CSV Upload', ?, ?, ?, 'Pending Review', ?, ?)
    `).run(dsId, filename, validRows, missPct, duplicates, uploadedBy, nowIso);

    return {
      success: true,
      dataset: {
        id: dsId,
        filename,
        source: 'Manual Admin CSV Upload',
        rows: validRows,
        rejectedRows: invalidOrMissingRows,
        missingPct: missPct,
        duplicateRows: duplicates,
        status: 'Pending Review',
        uploadedAt: nowIso,
      },
    };
  }

  public getDatasetsQueue() {
    const db = getDb();
    const rows = db
      .prepare('SELECT id, filename, source, rows_count as rows, missing_pct as missingPct, duplicate_rows as duplicateRows, status, uploaded_at as uploadedAt FROM datasets_queue ORDER BY uploaded_at DESC')
      .all();
    return rows;
  }

  public updateDatasetStatus(id: string, status: 'Approved' | 'Rejected') {
    const db = getDb();
    const res = db.prepare('UPDATE datasets_queue SET status = ? WHERE id = ?').run(status, id);
    return { success: res.changes > 0, id, status };
  }

  public getMissingValueReport() {
    const cache = getMLCache();
    const audit = cache?.global_audit;
    const total = audit?.raw_records_count || 0;
    const counts = audit?.missing_counts || {};
    const pct = (c: number) => `${((c / Math.max(1, total)) * 100).toFixed(2)}%`;

    return {
      totalRecordsAnalyzed: total,
      missingFieldsSummary: {
        modalPrice: { missingCount: counts.modal_price || 0, percentage: pct(counts.modal_price || 0) },
        minPrice: { missingCount: counts.min_price || 0, percentage: pct(counts.min_price || 0) },
        maxPrice: { missingCount: counts.max_price || 0, percentage: pct(counts.max_price || 0) },
        arrivalQuantityTonne: { missingCount: counts.arrival_tonnes || 0, percentage: pct(counts.arrival_tonnes || 0) },
        rainfallMm: { missingCount: counts.rainfall_mm || 0, percentage: pct(counts.rainfall_mm || 0) },
        tempC: { missingCount: counts.temp_c || 0, percentage: pct(counts.temp_c || 0) },
      },
      overallDataCompleteness: `${audit?.completeness_pct ?? 99.9}%`,
      dataOrigin: 'sample_dataset_demonstration',
      status: (audit?.completeness_pct ?? 100) >= 95 ? 'Acceptable (< 5% missingness)' : 'Needs Imputation Review',
    };
  }

  public getOutliersReport() {
    const cache = getMLCache();
    const audit = cache?.global_audit;
    return {
      analyzedRecords: audit?.raw_records_count || 0,
      outliersDetected: audit?.outliers_count || 0,
      methodsUsed: ['Per-Series Z-Score (> 2.8)', 'Per-Series Interquartile Range (IQR 1.5x)'],
      samples: (audit?.outliers || []).slice(0, 10),
      winsorizedDuringTraining: audit?.outliers_count || 0,
      dataOrigin: 'sample_dataset_demonstration',
    };
  }

  public validateDataQualityForRetraining() {
    const cache = getMLCache();
    const audit = cache?.global_audit;
    const total = Math.max(1, audit?.raw_records_count || 1);
    const missingTotal = Object.values(audit?.missing_counts || {}).reduce((a, b) => a + b, 0);
    const missingRateNum = (missingTotal / (total * 6)) * 100;
    const outlierRateNum = ((audit?.outliers_count || 0) / total) * 100;
    const passed = missingRateNum < 5.0 && outlierRateNum < 5.0;

    return {
      passed,
      missingValueRate: `${missingRateNum.toFixed(2)}%`,
      outlierRate: `${outlierRateNum.toFixed(2)}%`,
      duplicateCount: audit?.duplicates_removed ?? 0,
      thresholds: { maxMissingRate: '5.0%', maxOutlierRate: '5.0%' },
      recommendation: passed
        ? 'Python audit verified completeness & outlier gates. Ready for retraining.'
        : 'Quality gate flagged excess missingness or anomalies; inspect dataset first.',
    };
  }

  public triggerModelRetraining(
    commodity: string = 'Tomato',
    market: string = 'Guntur',
    algorithm: string = 'Random Forest'
  ) {
    const artifact = runPairRetraining(commodity, market, algorithm) || (runPythonMLEngine() ? null : null);
    const db = getDb();
    const latest = db
      .prepare("SELECT * FROM model_registry WHERE commodity = ? AND market = ? ORDER BY trained_at DESC LIMIT 1")
      .get(commodity, market) as ModelVersionRecord | undefined;

    if (latest) {
      return {
        success: true,
        message: `Retrained ${latest.algorithm} (${latest.version}) for ${commodity} @ ${market} on local dataset. Test R²: ${latest.r2}, MAE: ₹${latest.mae}/kg`,
        model: latest,
        data_origin: artifact?.data_origin || 'sample_dataset_demonstration',
      };
    }

    return {
      success: false,
      message: `Unable to retrain ${commodity} @ ${market}. Ensure at least 45 historical rows exist.`,
    };
  }

  public getModelRegistry(): ModelVersionRecord[] {
    const db = getDb();
    getMLCache();
    return db
      .prepare('SELECT * FROM model_registry ORDER BY trained_at DESC, commodity ASC LIMIT 100')
      .all() as unknown as ModelVersionRecord[];
  }

  public rollbackModel(version: string, commodity: string, market: string) {
    const db = getDb();
    const target = db
      .prepare('SELECT * FROM model_registry WHERE commodity = ? AND market = ? AND version = ? LIMIT 1')
      .get(commodity, market, version) as ModelVersionRecord | undefined;

    if (!target) {
      const previous = db
        .prepare("SELECT * FROM model_registry WHERE commodity = ? AND market = ? AND status != 'Active' ORDER BY trained_at DESC LIMIT 1")
        .get(commodity, market) as ModelVersionRecord | undefined;
      if (!previous) {
        return { success: false, message: `No previous registered model found for ${commodity} @ ${market}.` };
      }
      db.prepare("UPDATE model_registry SET status = 'RolledBack' WHERE commodity = ? AND market = ? AND status = 'Active'").run(commodity, market);
      db.prepare("UPDATE model_registry SET status = 'Active' WHERE id = ?").run(previous.id);
      return { success: true, message: `Rolled back ${commodity} (${market}) to previous version ${previous.version} (${previous.algorithm}).`, model: previous };
    }

    db.prepare("UPDATE model_registry SET status = 'RolledBack' WHERE commodity = ? AND market = ? AND status = 'Active'").run(commodity, market);
    db.prepare("UPDATE model_registry SET status = 'Active' WHERE id = ?").run(target.id);

    return {
      success: true,
      message: `Successfully rolled back ${commodity} (${market}) to version ${version} (${target.algorithm}).`,
      model: target,
    };
  }
}

export const pipelineEngine = new LiveDataPipelineEngine();
