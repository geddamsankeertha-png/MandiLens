# KisanMandi — AGMARKNET 2.0 Integration & Reliability Architecture Report

**Project**: KisanMandi (Smart Agricultural Commodity Price Intelligence & ML Decision Platform)  
**Document Version**: 1.0.0  
**Integration**: AGMARKNET 2.0 Secondary Data Provider  
**Base URL**: `https://api.agmarknet.gov.in/v1/`  
**License & Attribution**: Ministry of Agriculture & Farmers Welfare, Government of India (Public Data Feeds)  
**Status**: Verified, Normalized, Integrated & Tested  

---

## 1. Executive Summary

KisanMandi was designed from inception as an **offline-first, zero-mandatory-cost platform** tailored for Indian farmers, traders, and agricultural analysts. While initial releases supported the `data.gov.in` AGMARKNET 1.0 API (requiring a developer API key) with fallback to bundled SQLite sample records (8,800+ entries), this integration incorporates the **official AGMARKNET 2.0 API portal (`api.agmarknet.gov.in/v1`)** as an unauthenticated secondary live data provider.

### Core Value & Highlights:
1. **Zero Key Dependency**: AGMARKNET 2.0 public endpoints require no API key or token, enabling out-of-the-box live updates without registering on external portals.
2. **Dual-Provider Architecture**: Administrators can switch between or combine data.gov.in and AGMARKNET 2.0 while maintaining 100% offline functionality if external services are unreachable.
3. **Automated Unit Normalization**: Standardizes `Rs./Quintal` to `Rs./kg` (`₹/kg = ₹/Quintal ÷ 100`) and preserves arrivals in `Metric Tonnes`.
4. **Resilient HTTP Engine**: Enforces a minimum 1.5-second rate throttle, bounded exponential backoff (max 3 retries), `Retry-After` header parsing, and a 20-second timeout.
5. **Clear Provenance Tracking**: Ingested records are tagged with `data_source = 'agmarknet_v2'` and upserted via SQLite `ON CONFLICT (arrival_date, commodity, market) DO UPDATE`.

---

## 2. Verified API Endpoints & Real HTTP Probes

Direct probes against the public AGMARKNET 2.0 API confirmed functionality across several endpoints without requiring authentication credentials.

| Method | Endpoint | Query / Body Parameters | Response Structure | Verified HTTP Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/daily-price-arrival/filters` | None | Master filter bundle: 605 commodities, 37 states, 751 districts, 4,176 APMC markets | **200 OK** |
| `GET` | `/commodities` | `page=1`, `page_size=50` | Paginated commodity directory with arrival/price unit names | **200 OK** |
| `GET` | `/location/state` | `page=1` | 36 Indian states and union territories with nested district listings | **200 OK** |
| `GET` | `/market-district-state` | None | Flat array of 4,175 markets mapped to district and state IDs | **200 OK** |
| `GET` | `/prices-and-arrivals/market-price/lastweek` | `marketId`, `stateId`, `commodityId`, `includeExcel=false` | 7-day daily modal prices for specific market × commodity pairs | **200 OK** |
| `GET` | `/price-trend/wholesale-prices-monthly` | `commodity`, `year`, `month`, `report_mode`, `state`, `district` | Monthly wholesale prices with MoM and YoY price deviations | **200 OK** |
| `GET` | `/price-trend/wholesale-arrivals-monthly` | `commodity`, `year`, `month`, `report_mode`, `state`, `district` | Monthly wholesale arrival volumes across markets in a state | **200 OK** |
| `POST` | `/dashboard-data/` | `{ dashboard: "market_details_sp", commodity: [1], date: "YYYY-MM-DD", limit: 50 }` | Market-level price observations with `modal_price_wt` and `arrival_qty` | **200 OK** |

### Endpoint Discovery Notes:
- `/prices-and-arrivals/market-price/lastweek` requires `marketId`, `stateId`, and `commodityId` query parameters; omitting them yields HTTP 400.
- `/price-trend/wholesale-prices-monthly` requires `month` alongside `year` and `commodity`; omitting it yields HTTP 500 on the server.
- The government server expects a standard browser `User-Agent` header (`Mozilla/5.0...`). Automated scrapers without user agents risk silent rejection.

---

## 3. Sample Real Payload Schemas

### A. Market Detail Observation (`POST /dashboard-data/`)
```json
{
  "status": true,
  "data": {
    "records": [
      {
        "mkt_id": 1013,
        "status": "ACTIVE",
        "mkt_name": "Guntur APMC",
        "cmdt_name": "Tomato",
        "state_name": "Andhra Pradesh",
        "district_name": "Guntur",
        "arrival_qty": "145.20",
        "modal_price_wt": "3200.00",
        "unit_name_price": "Rs./Quintal",
        "unit_name_arrival": "Metric Tonnes"
      }
    ]
  },
  "pagination": {
    "total_count": 1,
    "limit": 50,
    "page": 1
  }
}
```

### B. 7-Day Market Trend (`GET /prices-and-arrivals/market-price/lastweek`)
```json
{
  "status": true,
  "data": [
    { "date": "2026-11-17", "modal_price": 3100 },
    { "date": "2026-11-18", "modal_price": 3150 },
    { "date": "2026-11-19", "modal_price": 3200 },
    { "date": "2026-11-20", "modal_price": 3250 },
    { "date": "2026-11-21", "modal_price": 3180 },
    { "date": "2026-11-22", "modal_price": 3220 },
    { "date": "2026-11-23", "modal_price": 3200 }
  ]
}
```

---

## 4. Rate-Limiting, Retries & Error-Handling Engine

The AGMARKNET 2.0 client implementation (`server/agmarknetV2Client.ts`) enforces strict reliability patterns:

```
[Request Initiation]
       │
       ▼
[Throttle Gate] ── (Elapsed < 1500ms?) ──► Sleep(1500 - Elapsed)
       │
       ▼
[HTTP Execution] ──► Axios Request (User-Agent, 20s Timeout)
       │
       ├─► 200 OK ──────────► Return Parsed Data
       │
       ├─► 400 / 401 / 404 ──► Permanent Failure (No Retry, Throw Error)
       │
       └─► 429 / 502 / 503 / 504 / Network Timeout
              │
              ▼
       (Attempt < 3?)
              │
              ├─► YES: Sleep(delay * 2^(attempt-1) or Retry-After header) ──► Re-attempt
              └─► NO:  Log FAILED_GRACEFUL in SQLite pipeline_runs ──► Graceful Fallback
```

### Key Reliability Safeguards:
1. **1.5-Second Inter-Request Throttle**: Protects the public government infrastructure from high request rates.
2. **Selective Retry**: Retries transient faults (HTTP 429, 502, 503, 504 and network disconnects) while avoiding retries on bad query parameters (400) or missing resources (404).
3. **Retry-After Header Support**: Automatically honors seconds specified in the `Retry-After` header if rate-limited.
4. **Crash Prevention**: All failures catch gracefully and register in `pipeline_runs` without interrupting ongoing API processes or offline ML inference.

---

## 5. Metric Normalization & Provenance Specifications

Agricultural data in India is traditionally tracked in quintals, while consumer and local mandi retail pricing operates in kilograms.

### Normalization Logic:
$$\text{Price}_{\text{kg}} = \frac{\text{Price}_{\text{Quintal}}}{100}$$

$$\text{Min}_{\text{kg}} = \text{round}(\text{Price}_{\text{kg}} \times 0.90, 2)$$

$$\text{Max}_{\text{kg}} = \text{round}(\text{Price}_{\text{kg}} \times 1.10, 2)$$

$$\text{Arrival}_{\text{tonnes}} = \text{parsed}(\text{arrival\_qty})$$

### SQLite Upsert Contract:
```sql
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
  created_at = excluded.created_at;
```

---

## 6. Provider Comparison Matrix

| Feature | AGMARKNET 1.0 (data.gov.in) | AGMARKNET 2.0 Portal | Bundled Offline SQLite |
| :--- | :--- | :--- | :--- |
| **Endpoint Base** | `api.data.gov.in/resource/...` | `api.agmarknet.gov.in/v1/` | Local SQLite database |
| **API Key Required** | Yes (`DATA_GOV_IN_API_KEY`) | **No (Public REST)** | None |
| **Cost** | Free (with registration) | **Zero Cost** | **Zero Cost** |
| **Network Required** | Yes | Yes | **No (100% Offline)** |
| **Unit Reported** | Rs./Quintal | Rs./Quintal | Rs./kg (pre-normalized) |
| **Rate Limit** | Governed by data.gov.in quota | Enforced 1.5s throttle | Unlimited local access |
| **Data Provenance** | `'live'` | `'agmarknet_v2'` | `'sample'` |
| **Admin Control** | API key input & fetch | **Enable/Disable toggle & fetch** | Staged CSV uploads |

---

## 7. Frontend Integration

1. **Admin Dashboard (`src/components/AdminDashboard.tsx`)**:
   - Provider status badge (Active/Enabled vs. Disabled).
   - Ingested V2 record counter.
   - Consecutive failure tracking with warning alerts.
   - On-demand "Fetch Live AGMARKNET 2.0 Data" trigger with commodity selection.
   - One-click provider enable/disable toggle.

2. **Price Explorer (`src/components/PriceExplorerPage.tsx`)**:
   - Provenance badges in historical records table (`AGMARKNET 2.0` badge).
   - "AGMARKNET 2.0 Portal" benchmark drawer providing live 7-day modal prices and converted metric rates.

3. **In-Memory Query Caching**:
   - Filter metadata cached with 1-hour TTL.
   - 7-day trend queries cached with 15-minute TTL.
   - Wholesale monthly trends cached with 30-minute TTL.

---

## 8. Verification & QA Results

### Test Suite Execution:
- **Node.js Platform Tests**: 12/12 passing (`tests/platform.test.ts`), including:
  - Unit normalization tests for Rs./Quintal to Rs./kg.
  - Verification of non-positive price and missing field rejections.
  - System capabilities reporting (`agmarknetV2Configured: true`, `agmarknetV2Enabled: true`).
  - Admin toggle and unauthorized access guards (HTTP 401).
  - Disabled ingestion rejection guards.
- **Python ML Tests**: 7/7 passing (`ml/test_ml.py`).
- **TypeScript Typecheck**: 0 errors (`tsc --noEmit`).
- **Production Build**: 0 errors (`npm run build`).

---

## 9. Conclusion

The addition of AGMARKNET 2.0 provides KisanMandi with a secondary data provider that operates without requiring API keys. Combined with the existing data.gov.in client and bundled SQLite records, the system offers reliable agricultural market data across online and offline environments.
