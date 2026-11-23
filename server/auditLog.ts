/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SQLite-Backed Security & Admin Audit Logger
 */

import { getDb } from './database.ts';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  role?: string;
  ipAddress: string;
  method: string;
  path: string;
  action:
    | 'AUTH_FAILURE'
    | 'DENIED'
    | 'ADMIN_ACTION'
    | 'DATA_INGESTION'
    | 'MODEL_ACTION'
    | 'USER_AUTH'
    | 'USER_UPDATE';
  details: string;
}

class AuditLogger {
  public log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      id: `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    try {
      const db = getDb();
      db.prepare(`
        INSERT INTO audit_logs (id, timestamp, user_id, user_email, role, ip_address, method, path, action, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        fullEntry.id,
        fullEntry.timestamp,
        fullEntry.userId || null,
        fullEntry.userEmail || null,
        fullEntry.role || null,
        fullEntry.ipAddress,
        fullEntry.method,
        fullEntry.path,
        fullEntry.action,
        fullEntry.details
      );
    } catch (err) {
      console.warn('Audit log write skipped:', err);
    }

    return fullEntry;
  }

  public getLogs(limit: number = 100, typeFilter?: string): AuditLogEntry[] {
    try {
      const db = getDb();
      const safeLimit = Math.min(Math.max(1, Number(limit) || 100), 500);
      let rows: any[];
      if (typeFilter && typeFilter !== 'all') {
        rows = db
          .prepare(`
            SELECT id, timestamp, user_id as userId, user_email as userEmail, role, ip_address as ipAddress, method, path, action, details
            FROM audit_logs
            WHERE action = ?
            ORDER BY timestamp DESC
            LIMIT ?
          `)
          .all(typeFilter, safeLimit);
      } else {
        rows = db
          .prepare(`
            SELECT id, timestamp, user_id as userId, user_email as userEmail, role, ip_address as ipAddress, method, path, action, details
            FROM audit_logs
            ORDER BY timestamp DESC
            LIMIT ?
          `)
          .all(safeLimit);
      }
      return rows as AuditLogEntry[];
    } catch {
      return [];
    }
  }
}

export const auditLogger = new AuditLogger();
