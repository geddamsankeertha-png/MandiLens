/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from 'axios';

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

export async function fetchAgmarknetPage(params: {
  apiKey: string;
  limit?: number;
  offset?: number;
  commodity?: string;
  state?: string;
}) {
  const {
    apiKey,
    limit = 100,
    offset = 0,
    commodity,
    state,
  } = params;

  const query: Record<string, string | number> = {
    'api-key': apiKey,
    format: 'json',
    limit,
    offset,
  };

  if (commodity) query['filters[commodity]'] = commodity;
  if (state) query['filters[state]'] = state;

  const { data } = await axios.get(BASE_URL, {
    params: query,
    timeout: 30000,
  });

  return {
    records: (data.records ?? []) as AgmarknetRecord[],
    total: Number(data.total ?? 0),
  };
}

export async function fetchAllAgmarknetRecords(params: {
  apiKey: string;
  commodity: string;
  state?: string;
  pageSize?: number;
}) {
  const { apiKey, commodity, state, pageSize = 100 } = params;

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
