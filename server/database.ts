/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * KisanMandi SQLite Persistence Layer (Node.js built-in node:sqlite)
 * Provides zero-cost, offline-first relational storage with parameterized queries,
 * automatic schema creation, CSV dataset seeding, and backup support.
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

export interface DbUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'farmer' | 'trader' | 'analyst' | 'admin';
  state: string;
  district: string;
  preferred_market: string;
  preferred_commodities: string;
  language: string;
  alerts_enabled: number;
  alert_channels: string;
  phone: string | null;
  email_verified: number;
  email_verified_at: string | null;
  status: 'Active' | 'Deactivated';
  created_at: string;
  last_login: string | null;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHex] = parts;
  if (!salt || !originalHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

let dbInstance: DatabaseSync | null = null;

export function getDbPath(): string {
  return process.env.SQLITE_DB_PATH
    ? path.resolve(process.env.SQLITE_DB_PATH)
    : path.join(ROOT_DIR, 'data', 'kisanmandi.db');
}

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dbPath = getDbPath();
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  dbInstance = new DatabaseSync(dbPath);
  dbInstance.exec('PRAGMA journal_mode = WAL;');
  dbInstance.exec('PRAGMA foreign_keys = ON;');

  initializeSchema(dbInstance);
  seedInitialData(dbInstance);

  return dbInstance;
}

export function resetDbForTests(customPath: string = ':memory:'): DatabaseSync {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore close errors
    }
    dbInstance = null;
  }
  process.env.SQLITE_DB_PATH = customPath;
  dbInstance = new DatabaseSync(customPath);
  dbInstance.exec('PRAGMA foreign_keys = ON;');
  initializeSchema(dbInstance);
  seedInitialData(dbInstance);
  return dbInstance;
}

export function initializeSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('farmer', 'trader', 'analyst', 'admin')),
      state TEXT NOT NULL DEFAULT 'Andhra Pradesh',
      district TEXT NOT NULL DEFAULT 'Guntur',
      preferred_market TEXT NOT NULL DEFAULT 'Guntur',
      preferred_commodities TEXT NOT NULL DEFAULT '["Tomato","Onion"]',
      language TEXT NOT NULL DEFAULT 'en',
      alerts_enabled INTEGER NOT NULL DEFAULT 1,
      alert_channels TEXT NOT NULL DEFAULT '["dashboard"]',
      phone TEXT,
      email_verified INTEGER NOT NULL DEFAULT 0,
      email_verified_at TEXT,
      status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Deactivated')),
      created_at TEXT NOT NULL,
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS historical_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arrival_date TEXT NOT NULL,
      state TEXT NOT NULL,
      district TEXT NOT NULL,
      market TEXT NOT NULL,
      commodity TEXT NOT NULL,
      variety TEXT NOT NULL DEFAULT 'FAQ',
      grade TEXT NOT NULL DEFAULT 'FAQ',
      min_price REAL NOT NULL,
      max_price REAL NOT NULL,
      modal_price REAL NOT NULL,
      arrival_tonnes REAL,
      rainfall_mm REAL,
      temp_c REAL,
      data_source TEXT NOT NULL DEFAULT 'sample',
      created_at TEXT NOT NULL,
      UNIQUE (arrival_date, commodity, market)
    );

    CREATE INDEX IF NOT EXISTS idx_prices_lookup
      ON historical_prices (commodity, market, arrival_date DESC);

    CREATE TABLE IF NOT EXISTS model_registry (
      id TEXT PRIMARY KEY,
      version TEXT NOT NULL,
      commodity TEXT NOT NULL,
      market TEXT NOT NULL,
      algorithm TEXT NOT NULL,
      feature_set_version TEXT NOT NULL,
      dataset_snapshot TEXT NOT NULL,
      hyperparameters TEXT NOT NULL,
      mae REAL NOT NULL,
      rmse REAL NOT NULL,
      mape REAL NOT NULL,
      r2 REAL NOT NULL,
      directional_accuracy REAL NOT NULL DEFAULT 0,
      approval_status TEXT NOT NULL DEFAULT 'APPROVED',
      status TEXT NOT NULL CHECK (status IN ('Active', 'Archived', 'RolledBack')),
      training_dataset_size INTEGER NOT NULL,
      data_origin TEXT NOT NULL DEFAULT 'sample_dataset_demonstration',
      trained_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS watchlists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      state TEXT NOT NULL,
      market TEXT NOT NULL,
      commodity TEXT NOT NULL DEFAULT 'Tomato',
      target_price REAL NOT NULL,
      alert_condition TEXT NOT NULL CHECK (alert_condition IN ('above', 'below')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_scenarios (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      crop_group TEXT NOT NULL,
      crop_name TEXT NOT NULL,
      state TEXT NOT NULL,
      market TEXT NOT NULL,
      inputs_json TEXT NOT NULL,
      predicted_price_quintal REAL NOT NULL,
      predicted_price_tonne REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      role_target TEXT NOT NULL,
      alert_type TEXT NOT NULL,
      commodity TEXT NOT NULL,
      market TEXT NOT NULL,
      state TEXT NOT NULL,
      alert_date TEXT NOT NULL,
      current_price REAL NOT NULL DEFAULT 0,
      predicted_price REAL NOT NULL DEFAULT 0,
      expected_change TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      recommended_action TEXT NOT NULL,
      message TEXT NOT NULL,
      is_disabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notification_reads (
      user_id TEXT NOT NULL,
      alert_id TEXT NOT NULL,
      read_at TEXT NOT NULL,
      PRIMARY KEY (user_id, alert_id)
    );

    CREATE TABLE IF NOT EXISTS datasets_queue (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      source TEXT NOT NULL,
      rows_count INTEGER NOT NULL,
      missing_pct TEXT NOT NULL,
      duplicate_rows INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK (status IN ('Pending Review', 'Approved', 'Rejected')),
      uploaded_by TEXT,
      uploaded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pipeline_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      source_url TEXT NOT NULL,
      record_count INTEGER NOT NULL,
      status TEXT NOT NULL,
      failure_reason TEXT,
      retry_attempts INTEGER NOT NULL DEFAULT 0,
      executed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      user_id TEXT,
      user_email TEXT,
      role TEXT,
      ip_address TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      revoked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function seedHistoricalPricesFromCsv(db: DatabaseSync, csvPath: string): number {
  if (!fs.existsSync(csvPath)) return 0;
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return 0;

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO historical_prices (
      arrival_date, state, district, market, commodity, variety, grade,
      min_price, max_price, modal_price, arrival_tonnes, rainfall_mm, temp_c, data_source, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const nowIso = new Date().toISOString();
  let inserted = 0;

  db.exec('BEGIN;');
  try {
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length < headers.length) continue;
      const row: Record<string, string> = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = (cols[j] ?? '').trim();
      }
      const modal = parseFloat(row.modal_price);
      const minP = parseFloat(row.min_price);
      const maxP = parseFloat(row.max_price);
      if (!row.arrival_date || !row.commodity || !row.market || isNaN(modal) || modal <= 0) continue;

      const arr = row.arrival_tonnes === '' ? null : parseFloat(row.arrival_tonnes);
      const rain = row.rainfall_mm === '' ? null : parseFloat(row.rainfall_mm);
      const temp = row.temp_c === '' ? null : parseFloat(row.temp_c);

      const res = insertStmt.run(
        row.arrival_date,
        row.state || 'Unknown',
        row.district || row.market,
        row.market,
        row.commodity,
        row.variety || 'FAQ',
        row.grade || 'FAQ',
        isNaN(minP) ? Math.round(modal * 0.9 * 100) / 100 : minP,
        isNaN(maxP) ? Math.round(modal * 1.1 * 100) / 100 : maxP,
        modal,
        arr !== null && !isNaN(arr) ? arr : null,
        rain !== null && !isNaN(rain) ? rain : null,
        temp !== null && !isNaN(temp) ? temp : null,
        row.data_source || 'sample',
        nowIso
      );
      if (res.changes > 0) inserted++;
    }
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  return inserted;
}

export function seedInitialData(db: DatabaseSync): void {
  const nowIso = new Date().toISOString();

  // 1. Seed sample non-admin student demonstration accounts if none exist
  const userCountRow = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  if (userCountRow.cnt === 0) {
    const demoPass = process.env.DEMO_USER_PASSWORD || 'KisanDemo#2026';
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, state, district, preferred_market, preferred_commodities, language, email_verified, email_verified_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `);

    insertUser.run(
      'usr_demo_farmer',
      'Ramesh Patel (Demo Farmer)',
      'farmer@kisanmandi.local',
      hashPassword(demoPass),
      'farmer',
      'Andhra Pradesh',
      'Guntur',
      'Guntur',
      '["Tomato","Onion"]',
      'en',
      nowIso,
      nowIso
    );

    insertUser.run(
      'usr_demo_trader',
      'Gurpreet Singh (Demo Trader)',
      'trader@kisanmandi.local',
      hashPassword(demoPass),
      'trader',
      'Andhra Pradesh',
      'NTR',
      'Vijayawada',
      '["Onion","Tomato","Toor Dal"]',
      'en',
      nowIso,
      nowIso
    );

    insertUser.run(
      'usr_demo_analyst',
      'Dr. Sunita Rao (Demo Analyst)',
      'analyst@kisanmandi.local',
      hashPassword(demoPass),
      'analyst',
      'Andhra Pradesh',
      'Guntur',
      'Guntur',
      '["Tomato","Onion","Potato","Chilli"]',
      'en',
      nowIso,
      nowIso
    );

    // Optional admin bootstrap strictly via explicit environment variable (no hardcoded credential)
    if (process.env.ADMIN_BOOTSTRAP_PASSWORD && process.env.ADMIN_BOOTSTRAP_PASSWORD.length >= 8) {
      const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@kisanmandi.local';
      insertUser.run(
        'usr_bootstrap_admin',
        'System Administrator',
        adminEmail.toLowerCase(),
        hashPassword(process.env.ADMIN_BOOTSTRAP_PASSWORD),
        'admin',
        'Andhra Pradesh',
        'Guntur',
        'Guntur',
        '["Tomato","Onion","Potato","Rice"]',
        'en',
        nowIso,
        nowIso
      );
    }
  }

  // 2. Seed historical agricultural dataset from sample CSV if table empty
  const priceCountRow = db.prepare('SELECT COUNT(*) as cnt FROM historical_prices').get() as { cnt: number };
  if (priceCountRow.cnt === 0) {
    const sampleCsv = path.join(ROOT_DIR, 'data', 'sample_agmarknet_prices.csv');
    seedHistoricalPricesFromCsv(db, sampleCsv);
  }

  // 3. Seed baseline watchlist for guest/demo experience
  const wlCount = db.prepare('SELECT COUNT(*) as cnt FROM watchlists').get() as { cnt: number };
  if (wlCount.cnt === 0) {
    const insWl = db.prepare(`
      INSERT INTO watchlists (id, user_id, state, market, commodity, target_price, alert_condition, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insWl.run('wl_sample_ap_guntur', 'usr_demo_farmer', 'Andhra Pradesh', 'Guntur', 'Tomato', 40, 'above', nowIso);
    insWl.run('wl_sample_mh_lasalgaon', 'usr_demo_trader', 'Maharashtra', 'Lasalgaon', 'Onion', 25, 'below', nowIso);
  }

  // 4. Seed dataset staging queue metadata reflecting the sample CSV
  const dsCount = db.prepare('SELECT COUNT(*) as cnt FROM datasets_queue').get() as { cnt: number };
  if (dsCount.cnt === 0) {
    db.prepare(`
      INSERT INTO datasets_queue (id, filename, source, rows_count, missing_pct, duplicate_rows, status, uploaded_by, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'ds_sample_baseline',
      'sample_agmarknet_prices.csv',
      'Bundled Educational Sample Dataset (Offline)',
      (db.prepare('SELECT COUNT(*) as cnt FROM historical_prices').get() as { cnt: number }).cnt,
      '0.5%',
      0,
      'Approved',
      'system',
      nowIso
    );
  }
}

export function sanitizeUserForClient(u: DbUser) {
  let preferredCommodities: string[] = [];
  let alertChannels: string[] = ['dashboard'];
  try {
    preferredCommodities = JSON.parse(u.preferred_commodities || '[]');
  } catch {
    preferredCommodities = [];
  }
  try {
    alertChannels = JSON.parse(u.alert_channels || '["dashboard"]');
  } catch {
    alertChannels = ['dashboard'];
  }

  return {
    id: u.id,
    email: u.email,
    displayName: u.name,
    role: u.role,
    preferredState: u.state,
    preferredDistrict: u.district,
    preferredMarket: u.preferred_market,
    preferredCommodities,
    language: u.language as 'en' | 'te' | 'hi',
    alertsEnabled: Boolean(u.alerts_enabled),
    alertChannels,
    phone: u.phone || undefined,
    emailVerified: Boolean(u.email_verified),
    status: u.status,
    createdAt: u.created_at,
    lastLogin: u.last_login,
  };
}
