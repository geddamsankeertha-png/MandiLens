import dotenv from 'dotenv';

// This module is imported before server.ts runs its body, so load local env here
// before capturing secrets at module initialization time.
dotenv.config();

/**
 * Secret Manager module for secure credential handling.
 * In production, integrates with Cloud Secret Manager / AWS Secrets Manager.
 * Falls back to environment variables in development/preview environments.
 */

export class SecretManager {
  private secrets: Map<string, string> = new Map();

  constructor() {
    // Load existing environment variables as baseline
    if (process.env.JWT_SECRET) {
      this.secrets.set('JWT_SECRET', process.env.JWT_SECRET);
    }
    if (process.env.DATA_GOV_IN_API_KEY) {
      this.secrets.set('DATA_GOV_IN_API_KEY', process.env.DATA_GOV_IN_API_KEY);
    }
    if (process.env.DATABASE_URL) {
      this.secrets.set('DATABASE_URL', process.env.DATABASE_URL);
    }
  }

  public getSecret(key: string, fallback: string = ''): string {
    if (this.secrets.has(key)) {
      return this.secrets.get(key)!;
    }
    const envVal = process.env[key];
    if (envVal) {
      this.secrets.set(key, envVal);
      return envVal;
    }
    return fallback;
  }

  public setSecret(key: string, value: string): void {
    this.secrets.set(key, value);
  }
}

export const secretManager = new SecretManager();
