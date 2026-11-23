/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Secret Manager module for secure credential handling.
 * Reads from environment variables (or secret manager injection in production).
 * Generates a cryptographically strong ephemeral runtime key for JWT signing
 * if JWT_SECRET is omitted in offline local student setups (never hardcoded).
 */

import crypto from 'node:crypto';

export class SecretManager {
  private secrets: Map<string, string> = new Map();
  private ephemeralJwtSecret: string;

  constructor() {
    this.ephemeralJwtSecret = crypto.randomBytes(32).toString('hex');
    const keys = [
      'JWT_SECRET',
      'DATA_GOV_IN_API_KEY',
      'GEMINI_API_KEY',
      'DATABASE_URL',
      'ADMIN_BOOTSTRAP_PASSWORD',
    ];
    for (const k of keys) {
      if (process.env[k]) {
        this.secrets.set(k, process.env[k]!);
      }
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
    if (key === 'JWT_SECRET' && !fallback) {
      return this.ephemeralJwtSecret;
    }
    return fallback;
  }

  public hasSecret(key: string): boolean {
    const val = this.secrets.get(key) || process.env[key] || '';
    return Boolean(val && val !== 'MY_GEMINI_API_KEY' && val !== 'MY_APP_URL');
  }

  public setSecret(key: string, value: string): void {
    this.secrets.set(key, value);
    process.env[key] = value;
  }
}

export const secretManager = new SecretManager();
