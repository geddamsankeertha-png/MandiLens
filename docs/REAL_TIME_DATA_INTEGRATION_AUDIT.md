# KisanMandi — Real-Time Data Integration Audit Report

**Author:** Senior Full-Stack Architect & Data Pipeline Engineer  
**Project:** KisanMandi – Mandi Price Predictor & Agricultural Analytics Platform  
**Audit Target:** Market Price Endpoints, AGMARKNET (`data.gov.in`) Integration, SQLite Storage, and Offline-First Architecture  
**Date:** November 22, 2026  

---

## 1. Executive Summary

This audit inspects the real-time data synchronization and market price endpoints in KisanMandi to evaluate how the application bridges live external data (`data.gov.in` AGMARKNET API resource `9ef84268-d588-465a-a308-a864a43d0070`) with its 100% offline-first, zero-cost student project architecture.

The project successfully maintains a dual-mode data architecture:
1. **Offline-First Baseline**: Bundled with 8,800 historical agricultural price records in SQLite (`./data/kisanmandi.db`), operating entirely without internet connectivity or paid external APIs.
2. **Optional Live AGMARKNET Sync**: When an optional `DATA_GOV_IN_API_KEY` is supplied, the backend pipeline (`server/dataPipeline.ts` & `server/agmarknetClient.ts`) executes actual HTTP requests to `api.data.gov.in`, validates records, normalizes dates and quintal/kg pricing units, and persists live records into SQLite (`data_source = 'live'`).

---

## 2. Endpoint Implementation Inspection

### A. `GET /api/prices/history`
- **Implementation**: Queries the SQLite relational table `historical_prices` filtered by commodity, market, and time horizon (e.g. 30, 90 days).
- **Data Provenance**: Detects whether records originated from sample demonstration datasets, CSV uploads (`csv_upload`), or live AGMARKNET sync (`live` / `agmarknet_live`).
- **Offline Support**: Fully functional offline using the 8,800 bundled sample rows.

### B. `POST /api/commodities/live`
- **Implementation**: Computes spot market estimates for a given state and market (e.g., Guntur, Maharashtra, etc.).
- **External vs. Stored Data**: 
  - By default (when offline or unconfigured), it queries SQLite historical prices for the specified commodity and applies market-specific price multipliers (`MARKETS[market].price_multiplier`) combined with the `COMMODITIES` catalog.
  - If an optional `GEMINI_API_KEY` is configured, it can optionally request AI spot estimates via Gemini 2.5 Flash, returning data marked as `ai_estimate`.
  - It does **not** make synchronous blocking requests to `data.gov.in` on every spot price view; instead, it queries the local SQLite cache populated by pipeline ingestion or bundled samples.

### C. `POST /api/commodities/pan-india`
- **Implementation**: Returns Pan-India benchmark price indexes from the pre-computed ML feature cache (`ml_artifacts_cache.json`) or fallback sample catalog.

---

## 3. External API Integration Status (`data.gov.in` AGMARKNET)

### A. API Client (`server/agmarknetClient.ts`) & Pipeline (`server/dataPipeline.ts`)
- **Actual HTTP Requests**: The codebase includes fully implemented API client methods (`fetchAgmarknetPage` and `fetchAllAgmarknetRecords`) using `axios` and native `fetch` targeting:
  ```
  https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
  ```
- **API Key Usage (`DATA_GOV_IN_API_KEY`)**: 
  - The key is managed securely via `secretManager` and passed as `?api-key=...` in the query parameters.
  - If `DATA_GOV_IN_API_KEY` is **empty/unconfigured**, the pipeline gracefully bypasses live fetching, logs an `OFFLINE_SAMPLE` pipeline run, and serves all 100% of pages offline without throwing errors.
- **Supported Filters & Pagination**: 
  - Supports `limit`, `offset`, `filters[commodity]`, and `filters[state]`.
  - Automatically paginates through total records (`total` count) when calling `fetchAllAgmarknetRecords`.
- **Validation & Sanitization**:
  - `validatePriceRecord` verifies that `arrival_date`, `market`, and `commodity` are present, and that `min_price`, `max_price`, and `modal_price` are valid positive numbers with `min <= modal <= max`.
  - Normalizes date formats (`DD/MM/YYYY` to `YYYY-MM-DD`) and converts quintal prices to ₹/kg when pricing values are $\ge 400$.
- **Duplicate Prevention & Preservation**:
  - Uses SQLite `INSERT OR REPLACE` (or `UNIQUE` constraints) keyed on `(arrival_date, commodity, market)` to prevent duplicate records while preserving historical time series.
  - Logs ingestion success, quarantine/rejection counts, and failure reasons in the `pipeline_runs` audit table.

---

## 4. Provenance & Frontend Synchronization Display

- **Data Provenance Labels**: Every record and endpoint response explicitly identifies its origin (`sample`, `live`, `csv_upload`, `ai_estimate`).
- **Freshness & Synchronization Status**: The Analyst and Admin dashboards display real-time pipeline status, freshness metrics (latest sync date per commodity/market), and record counts.
- **Offline Resilience**: If the internet connection drops or `data.gov.in` rate-limits requests, the application catches network exceptions, records a `FAILED_GRACEFUL` status, and continues operating seamlessly using the cached SQLite dataset.

---

## 5. Security & Reliability Findings

1. **API Key Exposure Risk**: Ensure `DATA_GOV_IN_API_KEY` is kept server-side in `.env` and never leaked to client browser bundles. (Currently correctly enforced in `server/secretManager.ts` / server routes).
2. **Rate Limiting on Ingestion Triggers**: Admin endpoint `POST /api/pipeline/trigger-fetch` should be protected with strict rate limiting to prevent spamming third-party gov APIs.
3. **Timeout Handling**: AGMARKNET fetches include a 12-second abort controller timeout, preventing hanging worker threads.

---

## 6. Recommended Changes (Prioritized)

1. **Priority 1 (Reliability)**: Add exponential backoff retry logic to `triggerIngestion()` when `data.gov.in` returns HTTP 429 (Too Many Requests) or gateway timeouts.
2. **Priority 2 (Monitoring)**: Add automated alerts in the Admin Dashboard when live pipeline sync fails for more than 3 consecutive scheduled runs.
3. **Priority 3 (Caching)**: Implement in-memory caching (TTL 15 minutes) for live spot queries to reduce database read overhead during peak advisory hours.
