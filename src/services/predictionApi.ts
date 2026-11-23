/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Mandi Prediction & Platform API Client
 * Manages in-memory JWT Bearer authentication, automatic refresh rotation,
 * and typed requests to Express + SQLite + Python ML backend routes (/api/*).
 */

import type { UserProfile, UserRole } from '../types/mandi';

export interface RealMLPrediction {
  commodity: string;
  market: string;
  prediction_date: string;
  current_modal_price: number;
  predicted_next_day_price: number;
  predicted_7day_avg: number;
  expected_change_percent: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  model_name: string;
  model_version: string;
  feature_set_version?: string;
  confidence_interval: [number, number];
  data_origin?: string;
  is_demonstration_data?: boolean;
  disclaimer?: string;
  generated_at: string;
  forecast_horizon_days?: number;
  predicted_30day_avg?: number;
  daily_forecasts?: {
    day: number;
    date: string;
    predicted_price: number;
    confidence_interval: [number, number];
  }[];
}

export interface FarmerRecommendationResponse {
  commodity: string;
  market: string;
  district: string;
  prediction: RealMLPrediction;
  recommendation_code: 'sell_now' | 'wait_moderate' | 'wait_store';
  recommendation_badge: string;
  recommendation_reason: string;
  best_nearby_market: {
    market: string;
    district: string;
    distance_km: number;
    today_price: number;
    predicted_tomorrow_price: number;
    transport_cost_per_kg: number;
    net_realization_per_kg: number;
    advantage_over_local: number;
  };
  nearby_markets_comparison: {
    market: string;
    district: string;
    distance_km: number;
    today_price: number;
    predicted_tomorrow_price: number;
    transport_cost_per_kg: number;
    net_realization_per_kg: number;
  }[];
  weather_alert: {
    temp_c: number;
    humidity_pct: number;
    condition: string;
    rainfall_alert: string;
    temperature_alert: string;
  };
  data_origin?: string;
  is_demonstration_data?: boolean;
}

export interface TraderRecommendationResponse {
  commodity: string;
  market: string;
  prediction: RealMLPrediction;
  signal: 'BUY' | 'SELL' | 'HOLD';
  signal_rationale: string;
  confidence_pct: number;
  model_error_rate_mape: number;
  arbitrage_analysis: {
    purchase_market: string;
    current_purchase_price: number;
    recommended_selling_market: string;
    target_selling_price: number;
    gross_spread: number;
    estimated_transport_cost: number;
    net_margin_percent: number;
  };
  procurement_advice: {
    recommended_lot_size_quintals: number;
    break_even_selling_price: number;
    risk_rating: string;
  };
  data_origin?: string;
  is_demonstration_data?: boolean;
}

export interface RealMLAlert {
  id: string;
  alert_type: string;
  target_role: string;
  commodity: string;
  market: string;
  state: string;
  alert_date: string;
  current_price: number;
  predicted_price: number;
  expected_change: string;
  risk_level: string;
  recommended_action: string;
  message: string;
  data_origin?: string;
  read?: boolean;
}

export interface ModelPerformanceData {
  success: boolean;
  commodity: string;
  market: string;
  active_model: string;
  active_version: string;
  feature_set_version?: string;
  ml_runtime?: string;
  last_retrained: string;
  data_origin?: string;
  is_demonstration_data?: boolean;
  disclaimer?: string;
  experimental_periods?: {
    training_period: string;
    validation_period: string;
    test_period: string;
  };
  models: {
    model_name: string;
    version: string;
    mae: number;
    rmse: number;
    mape: number;
    r_squared: number;
    directional_accuracy: number;
    ci_coverage_pct?: number;
    latency_ms: number;
    is_baseline?: boolean;
    is_active: boolean;
  }[];
  backtesting_results: {
    date: string;
    actual: number;
    predicted: number;
    error: number;
    ci_lower?: number;
    ci_upper?: number;
  }[];
}

class MandiPredictionApi {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  public setTokens(token: string | null, refresh?: string | null) {
    this.accessToken = token;
    if (refresh !== undefined) {
      this.refreshToken = refresh;
    }
  }

  public clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  public hasToken(): boolean {
    return Boolean(this.accessToken);
  }

  private async request<T = any>(
    url: string,
    options: RequestInit = {},
    retryOnUnauthorized = true
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const res = await fetch(url, { ...options, headers });

    if (res.status === 401 && retryOnUnauthorized && this.refreshToken && !url.includes('/api/auth/')) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.request<T>(url, options, false);
      }
    }

    const data = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
    if (!res.ok) {
      throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
    }
    return data as T;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });
      if (!res.ok) {
        this.clearTokens();
        return false;
      }
      const data = await res.json();
      if (data.token) {
        this.accessToken = data.token;
        this.refreshToken = data.refresh_token || this.refreshToken;
        return true;
      }
    } catch {
      // ignore network error during refresh
    }
    return false;
  }

  /**
   * SYSTEM & AUTH ENDPOINTS
   */
  async getSystemCapabilities() {
    return this.request('/api/system/capabilities');
  }

  async getAdminStatus(): Promise<{ hasAdmin: boolean }> {
    return this.request('/api/auth/admin-status');
  }

  async setupAdmin(name: string, email: string, password: string) {
    const data = await this.request<{
      success: boolean;
      token: string;
      refresh_token: string;
      user: UserProfile;
    }>('/api/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    this.setTokens(data.token, data.refresh_token);
    return data;
  }

  async login(identifier: string, _role?: string, password?: string) {
    const data = await this.request<{
      success: boolean;
      token: string;
      refresh_token: string;
      user: UserProfile;
      error?: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: identifier, password: password || '' }),
    });
    this.setTokens(data.token, data.refresh_token);
    return data;
  }

  async demoLogin(role: 'farmer' | 'trader' | 'analyst') {
    const data = await this.request<{
      success: boolean;
      token: string;
      refresh_token: string;
      user: UserProfile;
    }>('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    this.setTokens(data.token, data.refresh_token);
    return data;
  }

  async register(payload: {
    displayName: string;
    email: string;
    password: string;
    role: UserRole;
    preferredState: string;
    preferredDistrict: string;
    preferredMarket?: string;
    preferredCommodities: string[];
    phone?: string;
    language?: string;
  }) {
    const data = await this.request<{
      success: boolean;
      token: string;
      refresh_token: string;
      user: UserProfile;
      requiresVerification?: boolean;
      dev_token?: string;
      message?: string;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token) {
      this.setTokens(data.token, data.refresh_token);
    }
    return data;
  }

  async verifyEmail(token: string) {
    const data = await this.request<{
      success: boolean;
      message: string;
      token?: string;
      refresh_token?: string;
      user?: UserProfile;
    }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    if (data.token) {
      this.setTokens(data.token, data.refresh_token);
    }
    return data;
  }

  async resendVerification(email: string) {
    return this.request<{ success: boolean; message: string; dev_token?: string }>('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async logout() {
    try {
      if (this.refreshToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: this.refreshToken }),
        });
      }
    } finally {
      this.clearTokens();
    }
  }

  async updateProfile(updates: Partial<UserProfile>) {
    return this.request<{ success: boolean; user: UserProfile }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async deleteAccount() {
    const res = await this.request<{ success: boolean; message: string }>('/api/profile', {
      method: 'DELETE',
    });
    this.clearTokens();
    return res;
  }

  /**
   * WATCHLISTS & SCENARIOS (SQLite Backed)
   */
  async getWatchlists() {
    return this.request<{ success: boolean; items: any[] }>('/api/watchlists');
  }

  async addWatchlist(item: { state: string; market: string; commodity?: string; targetPrice: number; alertCondition: 'above' | 'below' }) {
    return this.request<{ success: boolean; item: any }>('/api/watchlists', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async deleteWatchlist(id: string) {
    return this.request<{ success: boolean }>(`/api/watchlists/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async getScenarios() {
    return this.request<{ success: boolean; items: any[] }>('/api/scenarios');
  }

  async addScenario(scenario: any) {
    return this.request<{ success: boolean; item: any }>('/api/scenarios', {
      method: 'POST',
      body: JSON.stringify(scenario),
    });
  }

  async deleteScenario(id: string) {
    return this.request<{ success: boolean }>(`/api/scenarios/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  /**
   * PUBLIC MARKET & PYTHON ML FORECASTING ENDPOINTS
   */
  async getCommodities() {
    try {
      const data = await this.request<{ commodities: any[] }>('/api/commodities');
      return data.commodities;
    } catch {
      return [];
    }
  }

  async getMarkets() {
    try {
      const data = await this.request<{ markets: any[] }>('/api/markets');
      return data.markets;
    } catch {
      return [];
    }
  }

  async getPriceHistory(commodity: string, market: string, days: number = 30) {
    try {
      const params = new URLSearchParams({ commodity, market, days: String(days) });
      const data = await this.request<{ history: any[] }>(`/api/prices/history?${params.toString()}`);
      return data.history;
    } catch {
      return [];
    }
  }

  async predictNextDay(commodity: string = 'Tomato', market: string = 'Guntur', model?: string): Promise<RealMLPrediction> {
    const params = new URLSearchParams({ commodity, market });
    if (model) params.set('model', model);
    return this.request<RealMLPrediction>(`/api/predict/next-day?${params.toString()}`);
  }

  async predict7Day(commodity: string = 'Tomato', market: string = 'Guntur', model?: string): Promise<RealMLPrediction> {
    const params = new URLSearchParams({ commodity, market });
    if (model) params.set('model', model);
    return this.request<RealMLPrediction>(`/api/predict/7-day?${params.toString()}`);
  }

  async predict30Day(commodity: string = 'Tomato', market: string = 'Guntur', model?: string): Promise<RealMLPrediction> {
    const params = new URLSearchParams({ commodity, market });
    if (model) params.set('model', model);
    return this.request<RealMLPrediction>(`/api/predict/30-day?${params.toString()}`);
  }

  async getFarmerRecommendation(commodity: string = 'Tomato', market: string = 'Guntur', district?: string): Promise<FarmerRecommendationResponse> {
    const params = new URLSearchParams({ commodity, market });
    if (district) params.set('district', district);
    return this.request<FarmerRecommendationResponse>(`/api/recommendation/farmer?${params.toString()}`);
  }

  async getTraderRecommendation(commodity: string = 'Tomato', market: string = 'Guntur', targetMarket?: string): Promise<TraderRecommendationResponse> {
    const params = new URLSearchParams({ commodity, market });
    if (targetMarket) params.set('target_market', targetMarket);
    return this.request<TraderRecommendationResponse>(`/api/recommendation/trader?${params.toString()}`);
  }

  async getAlerts(role?: string, commodity?: string, market?: string): Promise<RealMLAlert[]> {
    try {
      const params = new URLSearchParams();
      if (role) params.set('role', role);
      if (commodity) params.set('commodity', commodity);
      if (market) params.set('market', market);
      const data = await this.request<{ alerts: RealMLAlert[] }>(`/api/alerts?${params.toString()}`);
      return data.alerts || [];
    } catch {
      return [];
    }
  }

  async markAlertRead(alertId: string) {
    return this.request('/api/alerts/read', {
      method: 'POST',
      body: JSON.stringify({ alertId }),
    });
  }

  async getModelPerformance(commodity: string = 'Tomato', market: string = 'Guntur'): Promise<ModelPerformanceData | null> {
    try {
      const params = new URLSearchParams({ commodity, market });
      return await this.request<ModelPerformanceData>(`/api/model-performance?${params.toString()}`);
    } catch {
      return null;
    }
  }

  /**
   * ANALYST & ADMIN PROTECTED ENDPOINTS
   */
  async getPipelineStatus() {
    return this.request('/api/pipeline/status');
  }

  async getMissingReport() {
    return this.request('/api/pipeline/missing-report');
  }

  async getOutliersReport() {
    return this.request('/api/pipeline/outliers');
  }

  async getValidateRetrain() {
    return this.request('/api/pipeline/validate-retrain');
  }

  async getModelsRegistry() {
    return this.request<{ success: boolean; models: any[] }>('/api/pipeline/models');
  }

  async getMonitoringMetrics() {
    return this.request('/api/monitoring/metrics');
  }

  async getDatasetsQueue() {
    return this.request<{ success: boolean; datasets: any[] }>('/api/pipeline/datasets');
  }

  async uploadCsv(filename: string, csvContent: string) {
    return this.request('/api/pipeline/upload-csv', {
      method: 'POST',
      body: JSON.stringify({ filename, csvContent }),
    });
  }

  async updateDatasetStatus(id: string, status: 'Approved' | 'Rejected') {
    return this.request(`/api/pipeline/datasets/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async setAgmarknetKey(apiKey: string) {
    return this.request('/api/pipeline/api-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    });
  }

  async triggerFetch(source: string = 'AGMARKNET / data.gov.in') {
    return this.request('/api/pipeline/trigger-fetch', {
      method: 'POST',
      body: JSON.stringify({ source }),
    });
  }

  async triggerAgmarknetV2Fetch(params?: { commodityId?: number; date?: string; limit?: number }) {
    return this.request<{
      success: boolean;
      source_mode: string;
      recordsFetched: number;
      totalReported?: number;
      quarantinedCount?: number;
      message: string;
      timestamp: string;
      disabled?: boolean;
    }>('/api/pipeline/trigger-fetch-v2', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  }

  async toggleAgmarknetV2(enabled: boolean) {
    return this.request<{ success: boolean; enabled: boolean }>('/api/pipeline/v2-toggle', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  async getAgmarknetV2Filters() {
    return this.request<{ success: boolean; cached: boolean; data: any }>('/api/agmarknet-v2/filters');
  }

  async getAgmarknetV2LastWeek(marketId: number | string, stateId: number | string, commodityId: number | string) {
    const q = new URLSearchParams({
      marketId: String(marketId),
      stateId: String(stateId),
      commodityId: String(commodityId),
    });
    return this.request<{ success: boolean; cached: boolean; data: any }>(`/api/agmarknet-v2/lastweek?${q.toString()}`);
  }

  async getAgmarknetV2WholesaleMonthly(params: {
    commodity: number | string;
    year: number | string;
    month: number | string;
    reportMode?: string;
    state?: number | string;
    district?: number | string;
  }) {
    const q = new URLSearchParams({
      commodity: String(params.commodity),
      year: String(params.year),
      month: String(params.month),
      reportMode: params.reportMode || 'Statewise',
      state: String(params.state ?? 0),
      district: String(params.district ?? 0),
    });
    return this.request<{ success: boolean; cached: boolean; data: any }>(`/api/agmarknet-v2/wholesale-monthly?${q.toString()}`);
  }

  async getAgmarknetV2WholesaleArrivals(params: {
    commodity: number | string;
    year: number | string;
    month: number | string;
    state: number | string;
    district?: number | string;
  }) {
    const q = new URLSearchParams({
      commodity: String(params.commodity),
      year: String(params.year),
      month: String(params.month),
      state: String(params.state),
      district: String(params.district ?? 0),
    });
    return this.request<{ success: boolean; cached: boolean; data: any }>(`/api/agmarknet-v2/wholesale-arrivals?${q.toString()}`);
  }

  async retrainModel(commodity: string, market: string, algorithm: string) {
    return this.request('/api/pipeline/retrain', {
      method: 'POST',
      body: JSON.stringify({ commodity, market, algorithm }),
    });
  }

  async rollbackModel(version: string, commodity: string, market: string) {
    return this.request('/api/pipeline/rollback', {
      method: 'POST',
      body: JSON.stringify({ version, commodity, market }),
    });
  }

  async resolveMonitoringAlert(alertId: string) {
    return this.request('/api/monitoring/resolve-alert', {
      method: 'POST',
      body: JSON.stringify({ alertId }),
    });
  }

  async investigateDrift(commodity: string, market: string) {
    return this.request('/api/monitoring/investigate', {
      method: 'POST',
      body: JSON.stringify({ commodity, market }),
    });
  }

  async getAdminUsers() {
    return this.request<{ success: boolean; users: UserProfile[] }>('/api/admin/users');
  }

  async updateAdminUserRole(id: string, role: UserRole) {
    return this.request(`/api/admin/users/${encodeURIComponent(id)}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async updateAdminUserStatus(id: string, status: 'Active' | 'Deactivated') {
    return this.request(`/api/admin/users/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async resetAdminUserPassword(id: string) {
    return this.request<{ success: boolean; temporaryPassword: string; email: string }>(
      `/api/admin/users/${encodeURIComponent(id)}/reset-password`,
      { method: 'POST' }
    );
  }

  async deleteAdminUser(id: string) {
    return this.request(`/api/admin/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async getAuditLogs(limit = 100, type = 'all') {
    const params = new URLSearchParams({ limit: String(limit), type });
    return this.request<{ success: boolean; logs: any[] }>(`/api/admin/audit-logs?${params.toString()}`);
  }

  async createAdminAlert(payload: {
    roleTarget: string;
    alertType: string;
    commodity: string;
    market: string;
    state: string;
    riskLevel: string;
    recommendedAction: string;
    message: string;
  }) {
    return this.request('/api/admin/alerts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async disableAdminAlert(id: string) {
    return this.request(`/api/admin/alerts/${encodeURIComponent(id)}/disable`, {
      method: 'PATCH',
    });
  }
}

export const predictionApi = new MandiPredictionApi();
