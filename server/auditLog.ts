/**
 * Audit Logging Engine for tracking security events, authorization failures, and admin actions.
 */

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  role?: string;
  ipAddress: string;
  method: string;
  path: string;
  action: 'SUCCESS' | 'AUTH_FAILURE' | 'DENIED' | 'ADMIN_ACTION';
  details: string;
}

class AuditLogEngine {
  private logs: AuditLogEntry[] = [];
  private maxLogs: number = 1000;

  public log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.logs.unshift(fullEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
    if (fullEntry.action === 'AUTH_FAILURE' || fullEntry.action === 'DENIED') {
      console.warn(`[SECURITY AUDIT] [${fullEntry.action}] ${fullEntry.method} ${fullEntry.path} - User: ${fullEntry.userEmail || 'Anonymous'} (IP: ${fullEntry.ipAddress}) - ${fullEntry.details}`);
    }
    return fullEntry;
  }

  public getLogs(limit: number = 100): AuditLogEntry[] {
    return this.logs.slice(0, limit);
  }

  public getFailureLogs(): AuditLogEntry[] {
    return this.logs.filter(l => l.action === 'AUTH_FAILURE' || l.action === 'DENIED');
  }
}

export const auditLogger = new AuditLogEngine();
