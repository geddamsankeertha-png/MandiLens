# KisanMandi Security Review & Verification Walkthrough

# Security Summary

**Reviewed Files**: 18  
**Issues Resolved**: 4  

### Issues Resolved
| Area | File | Line | What Was Happening | Impact | Status | How It Was Fixed |
|---|---|---|---|---|---|---|
| Unauthenticated Watchlist Access | `server.ts` | 575 | `GET /api/watchlists` used optional authentication and fell back to a demo user ID when no Bearer token was sent, letting unauthenticated callers read stored watchlists. | Medium | Fixed | Switched the route to `requireAuth()` so every caller must present a valid signed access token and only reads `req.user.userId`. |
| Refresh Token Check Fail-Open | `server/securityMiddleware.ts` | 136 | If the SQLite lookup inside `isRefreshTokenActive` threw an exception, the catch block returned `true` instead of denying the token. | Medium | Fixed | Updated the error path to return `false` so any lookup failure safely rejects the refresh attempt. |
| Permissive CSV Upload Validation | `server/dataPipeline.ts` | 290 | CSV ingestion split rows naively on commas, skipped validation on dates and `min <= modal <= max` ranges, and accepted completely invalid files as 0-row uploads. | Low | Fixed | Added a quote-aware CSV parser, calendar date validation, numeric bounds checks, and transaction rollback returning HTTP `400` when no valid rows exist. |
| Unescaped CSV Export Cells | `server.ts` | 728 | `/api/prices/export` joined query strings directly into CSV output without quoting commas or neutralizing leading spreadsheet formula characters (`=`, `+`, `-`, `@`). | Low | Fixed | Added RFC CSV quoting and neutralized leading formula characters in all exported cells. |

### Safeguards Verified
| Area | File | How It's Protected |
|---|---|---|
| Passwords & Session Signing | `server/database.ts`, `server/securityMiddleware.ts` | User passwords are hashed with per-user random salts via `crypto.scryptSync`. Access and refresh tokens use HMAC-SHA256 (`HS256`) with strict header validation, `timingSafeEqual`, short expiry (`30m`), and SQLite-backed refresh token rotation/revocation. |
| Role-Based Access Control | `server.ts`, `server/securityMiddleware.ts` | Every protected endpoint enforces `requireAuth()` and checks live user roles and `Active` status directly from SQLite. Self-registration is locked to `farmer`, `trader`, and `analyst`; first-run admin setup locks immediately once an admin exists. |
| Database Queries | `server.ts`, `server/dataPipeline.ts`, `server/mlEngine.ts` | All SQLite operations use prepared statements with bound `?` parameters so user input cannot alter query structure. |
| Private Keys & Secrets | `server/secretManager.ts`, `server/agmarknetClient.ts` | Optional `GEMINI_API_KEY` and `DATA_GOV_IN_API_KEY` stay strictly on the server via `process.env` and masked UI status; neither key is required to run the app offline. |
| Rate Limiting & Audit Trail | `server/securityMiddleware.ts`, `server/auditLog.ts` | Auth endpoints enforce a strict 25-request threshold (`429`) per 15-minute window, and security audit logs omit passwords, hashes, and tokens. |

*Note on Optional Packages*: Running `bun audit` on `bun.lock` reports two advisories (one high, one low) inside `@grpc/grpc-js@1.9.16` pulled transitively by the optional `firebase` package (`VITE_ENABLE_FIREBASE` defaults to `false`). No other package advisories were reported.

---

## PoC Verification

### 1. Unauthenticated Watchlist Access Check

#### Summary
| Field | Value |
|---|---|
| Issue Type | Missing Authentication Guard |
| Impact | Medium |
| Affected File | `server.ts:575` |
| Test Scenario | `GET /api/watchlists` without an `Authorization: Bearer ...` header |

#### How It Was Fixed
Removed `optionalAuth` and the fallback user identifier `'usr_demo_farmer'`, replacing them with `requireAuth()` so `req.user.userId` is always verified from a valid HS256 access token.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Unauthenticated `GET /api/watchlists` request arrives in `server.ts:575` | Enters `requireAuth()` middleware |
| 2 | `extractBearerToken(req)` in `server/securityMiddleware.ts:233` finds no Bearer header | Missing token detected |
| 3 | Middleware logs `AUTH_FAILURE` and returns HTTP `401 Unauthorized` | **Handled Safely** |

#### Conclusion
**Fix Verified** - Guests and unauthenticated callers can no longer read any user's SQLite watchlist records (`tests/platform.test.ts` verifies HTTP `401`).

---

### 2. Forged `alg: none` & Expired JWT Verification

#### Summary
| Field | Value |
|---|---|
| Issue Type | Session Token Signature & Expiration Validation |
| Impact | High |
| Affected File | `server/securityMiddleware.ts:90` |
| Test Scenario | Sending a forged `alg: none` token or an expired `HS256` token to `GET /api/auth/me` |

#### How It Was Fixed
`verifyToken` strictly requires `{ alg: 'HS256', typ: 'JWT' }`, compares HMAC-SHA256 digests with `crypto.timingSafeEqual`, and verifies `payload.exp` against current epoch seconds; `isRefreshTokenActive` fails closed on lookup error.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Request reaches `GET /api/auth/me` (`server.ts:471`) with forged/expired token | `requireAuth()` calls `verifyToken(token)` |
| 2 | `server/securityMiddleware.ts:100` rejects `header.alg !== 'HS256'`, line `112` rejects signature mismatch, and line `117` rejects expired timestamps | Returns `null` before reading user record |
| 3 | Middleware returns HTTP `401 Unauthorized` | **Handled Safely** |

#### Conclusion
**Fix Verified** - Unsigned, tampered, and expired tokens are consistently rejected across both unit tests and live HTTP endpoints.

---

### 3. Privilege Escalation & SQL Injection Protection

#### Summary
| Field | Value |
|---|---|
| Issue Type | Role Assignment & Parameterized SQL Handling |
| Impact | High |
| Affected File | `server.ts:217`, `server.ts:595` |
| Test Scenario | Self-registering with `role: "admin"` and submitting `"Guntur'); DROP TABLE historical_prices; --"` as a market name |

#### How It Was Fixed
Self-registration validates `role` against `['farmer', 'trader', 'analyst']` and rejects privileged roles with `403`. SQLite mutations use prepared `.run(...)` placeholders.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | `POST /api/auth/register` receives `{ role: "admin" }` | Hits allowlist check at `server.ts:218` -> HTTP `403` |
| 2 | `POST /api/watchlists` receives SQL payload in `market` field | Bound as parameter at `server.ts:598` |
| 3 | Subsequent check confirms `historical_prices` still holds all `8,800` records | **Handled Safely** |

#### Conclusion
**Fix Verified** - Privileged role escalation is blocked (`403`) and SQL metacharacters are stored strictly as literal strings without altering database structure.

---

### 4. Malformed CSV Upload & Formula Export Protection

#### Summary
| Field | Value |
|---|---|
| Issue Type | Untrusted Input Validation & CSV Formula Neutralization |
| Impact | Low |
| Affected File | `server/dataPipeline.ts:290`, `server.ts:728` |
| Test Scenario | Uploading CSV rows with invalid dates / `min > max` prices (`POST /api/pipeline/upload-csv`), and requesting `/api/prices/export` |

#### How It Was Fixed
`ingestCsvUpload` parses quoted fields cleanly, validates ISO calendar dates and price ranges, rolls back transactions that yield zero valid rows (`400`), and `/api/prices/export` quotes cells while prefixing leading formula characters.

#### Step-by-Step Trace
| Step | What Happens in the Code | Outcome |
|---|---|---|
| 1 | Admin submits malformed CSV rows to `POST /api/pipeline/upload-csv` | `normalizeIsoDate` and bounds checks at `server/dataPipeline.ts:295-320` reject invalid rows |
| 2 | `validRows === 0` triggers `ROLLBACK` at `server/dataPipeline.ts:340` | Returns HTTP `400 Bad Request` |
| 3 | Exported CSV rows pass through `csvCell()` at `server.ts:722` | **Handled Safely** |

#### Conclusion
**Fix Verified** - Invalid CSV payloads cannot pollute `historical_prices` and exported sheets remain safe against formula execution.
