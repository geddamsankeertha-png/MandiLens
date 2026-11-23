# KisanMandi — AGMARKNET Reliability Improvements Report

**Author:** Senior Full-Stack Architect & Reliability Engineer  
**Project:** KisanMandi – Mandi Price Predictor & Agricultural Analytics Platform  
**Target Component:** AGMARKNET (`data.gov.in`) Resilient Ingestion Pipeline, Spot-Price Caching, and SQLite Upsert Hardening  
**Date:** November 22, 2026  

---

## 1. Executive Summary

This document details the reliability enhancements implemented for KisanMandi's live data pipeline and spot-market price engine. The changes reinforce resilience against transient network failures and third-party API rate limits while strictly preserving the 100% offline-first, zero-cost architecture.

---

## 2. Summary of Implemented Improvements

### A. Bounded Exponential Backoff & Retry Handling (`server/agmarknetClient.ts`)
- **Transient vs. Permanent Errors**: Configured automatic retry logic for HTTP status codes `429`, `502`, `503`, `504` and network socket timeouts (`ECONNRESET`, `ETIMEDOUT`). Permanent client-side errors (`400`, `401`, `403`, `404`) are rejected immediately without retrying.
- **Backoff & Jitter**: Implemented exponential backoff delays (`initialDelayMs * Math.pow(2, attempt - 1)`) with support for the `Retry-After` HTTP response header.
- **Configurable Limits**: Default limit set to 3 max retries with timeout preservation (30 seconds per request).
- **Audit Logging**: Each attempt and final failure are tracked and persisted in the SQLite `pipeline_runs` audit table.

### B. Admin Dashboard Failure Monitoring (`server/dataPipeline.ts`)
- **Consecutive Failure Tracking**: The pipeline status engine tracks consecutive failed live ingestion runs by inspecting recent entries in `pipeline_runs`.
- **Health Warning Banner**: Automatically triggers a warning state (`consecutiveFailuresWarning = true`) after 3 consecutive failed scheduled runs.
- **Provenance & State Reset**: Displays the last successful synchronization timestamp, latest failure reason, and active failure count. The counter resets strictly upon a successful live ingestion (`status = 'SUCCESS'`).

### C. Spot-Price 15-Minute TTL Caching (`server.ts`)
- **In-Memory TTL Cache**: Added a 15-minute time-to-live (TTL) cache for repeated spot-price queries (`POST /api/commodities/live`).
- **Granular Cache Keys**: Cache keys incorporate state, market, and commodity category (`state::...::market::...::group::...`).
- **Provenance Distinctions**: Maintained strict separation between sample data, live AGMARKNET observations, and Gemini AI estimates. Cached sample prices are never mislabeled as live observations.

### D. SQLite Upsert Hardening (`server/dataPipeline.ts`, `server/database.ts`)
- **Safe Upserts (`ON CONFLICT DO UPDATE`)**: Replaced destructive `INSERT OR REPLACE` statements with explicit `INSERT INTO historical_prices (...) VALUES (...) ON CONFLICT (arrival_date, commodity, market) DO UPDATE SET ...` statements.
- **Data Preservation**: Ensures existing metadata, historical audit logs, and provenance columns are updated safely without corrupting related rows or foreign keys.

---

## 3. Test Evidence & Verification

All implemented changes were verified through automated test suites (`tests/platform.test.ts`), static analysis (`npm run lint`), production build (`npm run build`), and Python ML tests (`npm run test:python`).

- **Test Suite Execution**: 10/10 platform test suites and 7/7 Python ML unit tests passed successfully (`OK`).
- **Spot-Price Cache Verification**: Tested cache misses on initial request and cache hits (`cached_response: true`) on subsequent identical queries within the 15-minute TTL window.
- **SQLite Upsert Verification**: Confirmed that `ON CONFLICT DO UPDATE` successfully updates modal and price ranges for existing arrival dates without duplicating rows.
- **Pipeline Monitoring Verification**: Confirmed consecutive failure tracking and health warning triggers in `pipelineEngine.getStatus()`.

---

## 4. Remaining Limitations

1. **Third-Party API Rate Quotas**: Government portals (`data.gov.in`) enforce daily request quotas. When quotas are exhausted, the pipeline gracefully falls back to cached SQLite data and the 8,800 bundled offline records.
2. **Local Memory Caching**: The spot-price cache resides in Node.js server memory. In multi-instance horizontal scaling, a distributed cache layer (such as Redis) would be required, though unnecessary for single-node college major project deployments.
