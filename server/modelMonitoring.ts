/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Continuous Model Monitoring & Data Drift Engine
 * Tracks MAE, RMSE, MAPE, R², Directional Accuracy, Prediction Latency,
 * Missing-Value Percentage, Price Distribution Shifts, PSI (Population Stability Index),
 * Stale Markets (>48h), and automated threshold action gating.
 */

export interface ModelMonitoringMetrics {
  commodity: string;
  market: string;
  modelVersion: string;
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
  directionalAccuracy: number; // percentage e.g. 84.5%
  predictionLatencyMs: number;
  missingValuePct: number;
  psi: number; // Population Stability Index for feature drift
  staleMarketHours: number;
  driftStatus: 'STABLE' | 'WARNING_PSI' | 'CRITICAL_DRIFT' | 'STALE_DATA';
  lastEvaluated: string;
}

export interface MonitoringAlert {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  metric: string;
  message: string;
  recommendedAction: string;
  status: 'Open' | 'Investigating' | 'Resolved';
}

class ModelMonitoringEngine {
  private metricsTable: ModelMonitoringMetrics[] = [
    {
      commodity: 'Tomato',
      market: 'Guntur',
      modelVersion: 'v1.4',
      mae: 1.45,
      rmse: 1.82,
      mape: 3.2,
      r2: 0.94,
      directionalAccuracy: 88.4,
      predictionLatencyMs: 38,
      missingValuePct: 1.2,
      psi: 0.08, // < 0.1 (stable)
      staleMarketHours: 4,
      driftStatus: 'STABLE',
      lastEvaluated: new Date().toISOString(),
    },
    {
      commodity: 'Onion',
      market: 'Lasalgaon',
      modelVersion: 'v1.2',
      mae: 2.10,
      rmse: 2.65,
      mape: 4.1,
      r2: 0.91,
      directionalAccuracy: 84.2,
      predictionLatencyMs: 42,
      missingValuePct: 3.8,
      psi: 0.28, // > 0.25 (critical drift!)
      staleMarketHours: 12,
      driftStatus: 'CRITICAL_DRIFT',
      lastEvaluated: new Date().toISOString(),
    },
    {
      commodity: 'Potato',
      market: 'Agra',
      modelVersion: 'v2.3.9',
      mae: 2.45,
      rmse: 3.10,
      mape: 6.8,
      r2: 0.79,
      directionalAccuracy: 76.5,
      predictionLatencyMs: 45,
      missingValuePct: 11.4, // > 10% missing (pause retraining!)
      psi: 0.15,
      staleMarketHours: 54, // > 48h stale market!
      driftStatus: 'STALE_DATA',
      lastEvaluated: new Date().toISOString(),
    },
  ];

  private alerts: MonitoringAlert[] = [
    {
      id: 'm_alt_1',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      level: 'CRITICAL',
      metric: 'PSI (Population Stability Index)',
      message: 'Onion in Lasalgaon exhibits feature PSI = 0.28 (> 0.25 threshold). Distribution shift detected in modal arrivals.',
      recommendedAction: 'Trigger drift investigation before retraining. Verify schema changes and weather covariate alignment.',
      status: 'Open',
    },
    {
      id: 'm_alt_2',
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      level: 'WARNING',
      metric: 'Missing Prices Percentage',
      message: 'Potato in Agra has 11.4% missing price records (exceeds 10% safety threshold).',
      recommendedAction: 'Paused automated model retraining. Notify data engineer to check APMC feed ingestion.',
      status: 'Investigating',
    },
    {
      id: 'm_alt_3',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      level: 'CRITICAL',
      metric: 'Market Data Stale',
      message: 'Potato in Agra has not received updated market arrivals for 54 hours (> 48 hours).',
      recommendedAction: 'Marked market data as stale. Disabling active trading recommendation until refresh.',
      status: 'Open',
    },
  ];

  public getDashboardMetrics() {
    return {
      success: true,
      summary: {
        totalMonitoredPairs: this.metricsTable.length,
        stableCount: this.metricsTable.filter(m => m.driftStatus === 'STABLE').length,
        driftWarningCount: this.metricsTable.filter(m => m.driftStatus === 'CRITICAL_DRIFT' || m.driftStatus === 'WARNING_PSI').length,
        staleMarketsCount: this.metricsTable.filter(m => m.staleMarketHours > 48).length,
        averageLatencyMs: Math.round(this.metricsTable.reduce((acc, m) => acc + m.predictionLatencyMs, 0) / this.metricsTable.length),
        averageR2: parseFloat((this.metricsTable.reduce((acc, m) => acc + m.r2, 0) / this.metricsTable.length).toFixed(2)),
      },
      metrics: this.metricsTable,
      alerts: this.alerts,
    };
  }

  public acknowledgeAlert(alertId: string) {
    this.alerts = this.alerts.map(a => a.id === alertId ? { ...a, status: 'Resolved' as const } : a);
    return { success: true, message: `Alert ${alertId} marked as resolved.` };
  }

  public runDriftInvestigation(commodity: string, market: string) {
    return {
      success: true,
      commodity,
      market,
      investigationResult: {
        status: 'Completed',
        findings: [
          'Feature distribution shift primarily driven by unseasonal rainfall in Maharashtra onion belt.',
          'Target label definitions remain consistent with AGMARKNET standards.',
          'Recommended action: Re-align seasonal lag features and perform weighted retraining with recent 60-day window.',
        ],
        psiScore: 0.28,
        recommendedAction: 'Approve weighted retraining after data quality verification.',
      },
    };
  }
}

export const monitoringEngine = new ModelMonitoringEngine();
