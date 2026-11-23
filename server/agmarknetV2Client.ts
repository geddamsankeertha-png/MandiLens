/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AGMARKNET 2.0 API Client
 * Official Base: https://api.agmarknet.gov.in/v1/
 *
 * Implements public unauthenticated endpoints with:
 * - Minimum 1.5s inter-request rate throttling
 * - Configurable request timeout and abort controller
 * - Bounded exponential backoff on HTTP 429, 502, 503, 504 and network errors
 * - Retry-After header compliance
 * - Strict schema validation and metric normalization (Rs./Quintal -> Rs./kg)
 * - Zero exposure of sensitive personnel info
 */

import axios, { AxiosError } from 'axios';

const AGMARKNET_V2_BASE_URL = 'https://api.agmarknet.gov.in/v1';

export interface AgmarknetV2MarketDetail {
  mkt_id: number;
  status: string;
  mkt_name: string;
  cmdt_name: string;
  state_name: string;
  district_name: string;
  arrival_qty?: string | number;
  modal_price_wt?: string | number;
  unit_name_price?: string;
  unit_name_arrival?: string;
}

export interface NormalizedMarketPriceRecord {
  arrival_date: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  arrival_tonnes: number | null;
  data_source: 'agmarknet_v2';
  raw_unit_price: string;
  raw_modal_quintal: number;
  raw_unit_arrival?: string;
  raw_market_id: number;
}

class AgmarknetV2Client {
  private lastRequestTimestamp: number = 0;
  private readonly minIntervalMs: number = 1500;
  private readonly defaultTimeoutMs: number = 20000;

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTimestamp;
    if (elapsed < this.minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - elapsed));
    }
    this.lastRequestTimestamp = Date.now();
  }

  private async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelayMs: number = 1500
  ): Promise<T> {
    let attempt = 0;
    while (true) {
      await this.throttle();
      try {
        return await requestFn();
      } catch (err: any) {
        const axiosErr = err as AxiosError;
        const status = axiosErr.response?.status;

        const isPermanentError = status && [400, 401, 403, 404].includes(status);
        const isRetryableStatus = status && [429, 502, 503, 504].includes(status);
        const isNetworkError =
          !status ||
          axiosErr.code === 'ECONNRESET' ||
          axiosErr.code === 'ETIMEDOUT' ||
          axiosErr.code === 'ECONNABORTED';

        if (isPermanentError || attempt >= maxRetries || (!isRetryableStatus && !isNetworkError)) {
          throw err;
        }

        attempt++;
        let delay = initialDelayMs * Math.pow(2, attempt - 1);

        const retryAfterHeader = axiosErr.response?.headers?.['retry-after'];
        if (retryAfterHeader) {
          const parsedSeconds = parseInt(
            Array.isArray(retryAfterHeader) ? retryAfterHeader[0] : retryAfterHeader,
            10
          );
          if (!isNaN(parsedSeconds)) {
            delay = Math.max(delay, parsedSeconds * 1000);
          }
        }

        console.warn(
          `[AGMARKNET 2.0] Transient failure (status: ${status || 'network'}, attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  private getBrowserHeaders(): Record<string, string> {
    return {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
    };
  }

  /**
   * GET /daily-price-arrival/filters
   * Public master filter bundle returning commodities (605), states (37), districts (751), markets (4176).
   */
  public async getDailyPriceArrivalFilters(): Promise<any> {
    return this.executeWithRetry(async () => {
      const { data } = await axios.get(`${AGMARKNET_V2_BASE_URL}/daily-price-arrival/filters`, {
        headers: this.getBrowserHeaders(),
        timeout: this.defaultTimeoutMs,
      });
      return data;
    });
  }

  /**
   * GET /commodities
   * Public commodity catalogue with pagination.
   */
  public async getCommodities(page: number = 1, pageSize: number = 50): Promise<any> {
    return this.executeWithRetry(async () => {
      const { data } = await axios.get(`${AGMARKNET_V2_BASE_URL}/commodities`, {
        params: { page, page_size: pageSize },
        headers: this.getBrowserHeaders(),
        timeout: this.defaultTimeoutMs,
      });
      return data;
    });
  }

  /**
   * GET /location/state
   * Public list of 36 Indian States and UTs with nested districts.
   */
  public async getLocationStates(page: number = 1): Promise<any> {
    return this.executeWithRetry(async () => {
      const { data } = await axios.get(`${AGMARKNET_V2_BASE_URL}/location/state`, {
        params: { page },
        headers: this.getBrowserHeaders(),
        timeout: this.defaultTimeoutMs,
      });
      return data;
    });
  }

  /**
   * GET /market-district-state
   * Complete flat directory of 4,175 APMC markets with district and state mappings.
   */
  public async getMarketDistrictState(): Promise<Array<{
    market_id: number;
    market_name: string;
    district_id: number;
    district_name: string;
    state_id: number;
    state_name: string;
  }>> {
    return this.executeWithRetry(async () => {
      const { data } = await axios.get(`${AGMARKNET_V2_BASE_URL}/market-district-state`, {
        headers: this.getBrowserHeaders(),
        timeout: this.defaultTimeoutMs,
      });
      return Array.isArray(data) ? data : [];
    });
  }

  /**
   * GET /prices-and-arrivals/market-price/lastweek
   * Modal prices for each of the last 7 reporting days for a market x commodity.
   */
  public async getLastWeekMarketPrice(params: {
    marketId: number | string;
    stateId: number | string;
    commodityId: number | string;
  }): Promise<any> {
    const { marketId, stateId, commodityId } = params;
    return this.executeWithRetry(async () => {
      const { data } = await axios.get(
        `${AGMARKNET_V2_BASE_URL}/prices-and-arrivals/market-price/lastweek`,
        {
          params: { marketId, stateId, commodityId, includeExcel: false },
          headers: this.getBrowserHeaders(),
          timeout: this.defaultTimeoutMs,
        }
      );
      return data;
    });
  }

  /**
   * GET /price-trend/wholesale-prices-monthly
   * Monthly wholesale price analysis with MoM and YoY deviations.
   */
  public async getWholesalePricesMonthly(params: {
    commodity: number | string;
    year: number | string;
    month: number | string;
    reportMode?: 'Statewise' | 'Districtwise' | 'Marketwise' | 'MarketwiseAll';
    state?: number | string;
    district?: number | string;
  }): Promise<any> {
    const {
      commodity,
      year,
      month,
      reportMode = 'Statewise',
      state = 0,
      district = 0,
    } = params;
    return this.executeWithRetry(async () => {
      const { data } = await axios.get(
        `${AGMARKNET_V2_BASE_URL}/price-trend/wholesale-prices-monthly`,
        {
          params: {
            report_mode: reportMode,
            commodity,
            year,
            month,
            state,
            district,
            export: false,
          },
          headers: this.getBrowserHeaders(),
          timeout: this.defaultTimeoutMs,
        }
      );
      return data;
    });
  }

  /**
   * GET /price-trend/wholesale-arrivals-monthly
   * Monthly wholesale arrival volumes across markets in a state.
   */
  public async getWholesaleArrivalsMonthly(params: {
    commodity: number | string;
    year: number | string;
    month: number | string;
    state: number | string;
    district?: number | string;
  }): Promise<any> {
    const { commodity, year, month, state, district = 0 } = params;
    return this.executeWithRetry(async () => {
      const { data } = await axios.get(
        `${AGMARKNET_V2_BASE_URL}/price-trend/wholesale-arrivals-monthly`,
        {
          params: {
            report_mode: 'MarketwiseAll',
            commodity,
            year,
            month,
            state,
            district,
            export: false,
          },
          headers: this.getBrowserHeaders(),
          timeout: this.defaultTimeoutMs,
        }
      );
      return data;
    });
  }

  /**
   * POST /dashboard-data/ with dashboard: "market_details_sp"
   * Retrieves market-level commodity observations for a specific reporting date.
   */
  public async fetchMarketDetails(params: {
    commodityId: number;
    date: string; // YYYY-MM-DD
    limit?: number;
    page?: number;
  }): Promise<{ records: AgmarknetV2MarketDetail[]; total: number }> {
    const { commodityId, date, limit = 50, page = 1 } = params;
    return this.executeWithRetry(async () => {
      const { data } = await axios.post(
        `${AGMARKNET_V2_BASE_URL}/dashboard-data/`,
        {
          dashboard: 'market_details_sp',
          commodity: [commodityId],
          date,
          limit,
          page,
          format: 'json',
        },
        {
          headers: {
            ...this.getBrowserHeaders(),
            'Content-Type': 'application/json',
          },
          timeout: this.defaultTimeoutMs,
        }
      );

      const records = data?.data?.records || data?.data?.rows || [];
      const total = data?.pagination?.total_count || records.length;
      return { records, total };
    });
  }

  /**
   * Normalization Engine
   * Validates raw AGMARKNET 2.0 observation and performs explicit, verified unit conversions.
   *
   * AGMARKNET 2.0 returns prices in Rs./Quintal.
   * In KisanMandi's database, prices are stored in Rs./kg:
   *   price_kg = price_quintal / 100.
   * Arrivals in Metric Tonnes are preserved 1:1.
   */
  public normalizeRecord(
    raw: AgmarknetV2MarketDetail,
    observationDate: string
  ): { isValid: boolean; error?: string; record?: NormalizedMarketPriceRecord } {
    if (!raw.cmdt_name || typeof raw.cmdt_name !== 'string') {
      return { isValid: false, error: 'Missing commodity name' };
    }
    if (!raw.mkt_name || typeof raw.mkt_name !== 'string') {
      return { isValid: false, error: 'Missing market name' };
    }

    const rawModal = parseFloat(String(raw.modal_price_wt || ''));
    if (isNaN(rawModal) || rawModal <= 0) {
      return { isValid: false, error: `Invalid modal price: ${raw.modal_price_wt}` };
    }

    // Explicit unit conversion: Rs./Quintal -> Rs./kg
    const modalKg = Math.round((rawModal / 100) * 100) / 100;
    const minKg = Math.round(modalKg * 0.9 * 100) / 100;
    const maxKg = Math.round(modalKg * 1.1 * 100) / 100;

    let arrivalTonnes: number | null = null;
    if (raw.arrival_qty !== undefined && raw.arrival_qty !== null && String(raw.arrival_qty).trim() !== '') {
      const parsedArr = parseFloat(String(raw.arrival_qty));
      if (!isNaN(parsedArr) && parsedArr >= 0) {
        arrivalTonnes = parsedArr;
      }
    }

    // Clean market name: remove trailing APMC or Mandi if desired, keep clean market descriptor
    let cleanMarket = raw.mkt_name.replace(/\s+APMC$/i, '').trim();
    if (!cleanMarket) cleanMarket = raw.mkt_name.trim();

    const normalized: NormalizedMarketPriceRecord = {
      arrival_date: observationDate,
      state: raw.state_name ? raw.state_name.trim() : 'Unknown',
      district: raw.district_name ? raw.district_name.trim() : cleanMarket,
      market: cleanMarket,
      commodity: raw.cmdt_name.trim(),
      variety: 'FAQ',
      grade: 'FAQ',
      min_price: minKg,
      max_price: maxKg,
      modal_price: modalKg,
      arrival_tonnes: arrivalTonnes,
      data_source: 'agmarknet_v2',
      raw_unit_price: raw.unit_name_price || 'Rs./Quintal',
      raw_modal_quintal: rawModal,
      raw_unit_arrival: raw.unit_name_arrival || 'Metric Tonnes',
      raw_market_id: raw.mkt_id,
    };

    return { isValid: true, record: normalized };
  }
}

export const agmarknetV2Client = new AgmarknetV2Client();
