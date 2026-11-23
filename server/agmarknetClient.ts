/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AGMARKNET (data.gov.in) API Client with Bounded Exponential Backoff & Retry Handling
 */

import axios, { AxiosError } from 'axios';

const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
const BASE_URL = `https://api.data.gov.in/resource/${RESOURCE_ID}`;

export interface AgmarknetRecord {
  arrival_date: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  min_price: string | number;
  max_price: string | number;
  modal_price: string | number;
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchAgmarknetPage(params: {
  apiKey: string;
  limit?: number;
  offset?: number;
  commodity?: string;
  state?: string;
  retryOptions?: RetryOptions;
}) {
  const {
    apiKey,
    limit = 100,
    offset = 0,
    commodity,
    state,
    retryOptions = {},
  } = params;

  const maxRetries = retryOptions.maxRetries ?? 3;
  const initialDelayMs = retryOptions.initialDelayMs ?? 1000;

  const query: Record<string, string | number> = {
    'api-key': apiKey,
    format: 'json',
    limit,
    offset,
  };

  if (commodity) query['filters[commodity]'] = commodity;
  if (state) query['filters[state]'] = state;

  let attempt = 0;
  while (true) {
    try {
      const { data } = await axios.get(BASE_URL, {
        params: query,
        timeout: 30000,
      });

      return {
        records: (data.records ?? []) as AgmarknetRecord[],
        total: Number(data.total ?? 0),
        attemptsMade: attempt + 1,
      };
    } catch (err: any) {
      const axiosErr = err as AxiosError;
      const status = axiosErr.response?.status;

      // Permanent errors should not be retried (400, 401, 403, 404)
      const isPermanentError = status && [400, 401, 403, 404].includes(status);
      const isRetryableStatus = status && [429, 502, 503, 504].includes(status);
      const isNetworkError = !status || axiosErr.code === 'ECONNRESET' || axiosErr.code === 'ETIMEDOUT' || axiosErr.code === 'ECONNABORTED';

      if (isPermanentError || attempt >= maxRetries || (!isRetryableStatus && !isNetworkError)) {
        throw err;
      }

      attempt++;
      let delay = initialDelayMs * Math.pow(2, attempt - 1);

      // Respect Retry-After header if supplied
      const retryAfterHeader = axiosErr.response?.headers?.['retry-after'];
      if (retryAfterHeader) {
        const parsedSeconds = parseInt(Array.isArray(retryAfterHeader) ? retryAfterHeader[0] : retryAfterHeader, 10);
        if (!isNaN(parsedSeconds)) {
          delay = Math.max(delay, parsedSeconds * 1000);
        }
      }

      console.warn(`[AgmarknetClient] Transient failure (status: ${status || 'network'}, attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

export async function fetchAllAgmarknetRecords(params: {
  apiKey: string;
  commodity: string;
  state?: string;
  pageSize?: number;
  retryOptions?: RetryOptions;
}) {
  const { apiKey, commodity, state, pageSize = 100, retryOptions } = params;

  const allRecords: AgmarknetRecord[] = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const page = await fetchAgmarknetPage({
      apiKey,
      commodity,
      state,
      limit: pageSize,
      offset,
      retryOptions,
    });

    allRecords.push(...page.records);
    total = page.total;
    offset += pageSize;

    if (page.records.length === 0) break;
  }

  return allRecords;
}

export function validatePriceRecord(record: AgmarknetRecord) {
  const min = Number(record.min_price);
  const max = Number(record.max_price);
  const modal = Number(record.modal_price);

  const errors: string[] = [];

  if (!record.arrival_date) errors.push('Missing arrival_date');
  if (!record.market) errors.push('Missing market');
  if (!record.commodity) errors.push('Missing commodity');

  if (Number.isNaN(min) || min <= 0) errors.push('Invalid min_price');
  if (Number.isNaN(max) || max <= 0) errors.push('Invalid max_price');
  if (Number.isNaN(modal) || modal <= 0) errors.push('Invalid modal_price');

  if (modal < min || modal > max) {
    errors.push('Modal price must be between min and max price');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
