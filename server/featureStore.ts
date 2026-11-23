/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Versioned Feature Store & Engineering Schema (v2.2.0)
 * Synchronized identically with ml/ml_engine.py FEATURE_SET_VERSION = "v2.2.0"
 * to prevent training-serving skew across offline training and live API inference.
 */

export interface FeatureDefinitionVersion {
  featureSetVersion: string;
  description: string;
  features: string[];
  createdAt: string;
}

export interface RawInputRecord {
  commodity: string;
  market: string;
  date: string;
  modalPrice: number;
  minPrice?: number;
  maxPrice?: number;
  arrivalQuantityTonne?: number;
  rainfallMm?: number;
  temperatureMaxC?: number;
}

export interface EngineeredFeatureVector {
  commodity: string;
  market: string;
  date: string;
  featureSetVersion: string;
  lag1d: number;
  lag2d: number;
  lag3d: number;
  lag7d: number;
  rolling7dMean: number;
  rolling14dMean: number;
  rolling14dStd: number;
  sinDoy: number;
  cosDoy: number;
  arrivalTonnesScaled: number;
  rainfallMmScaled: number;
  tempCScaled: number;
}

class FeatureStoreEngine {
  private activeFeatureVersion: FeatureDefinitionVersion = {
    featureSetVersion: 'v2.2.0',
    description:
      'AGMARKNET chronological lag features (1d, 2d, 3d, 7d), 7d/14d rolling statistics, cyclic day-of-year harmonics, and scaled arrival/weather covariates.',
    features: [
      'lag_1d',
      'lag_2d',
      'lag_3d',
      'lag_7d',
      'rolling_7d_mean',
      'rolling_14d_mean',
      'rolling_14d_std',
      'sin_doy',
      'cos_doy',
      'arrival_tonnes_scaled',
      'rainfall_mm_scaled',
      'temp_c_scaled',
    ],
    createdAt: '2026-11-01T00:00:00Z',
  };

  public getActiveFeatureDefinition(): FeatureDefinitionVersion {
    return this.activeFeatureVersion;
  }

  public validateFeatureSchema(vector: any): { isValid: boolean; error?: string } {
    if (!vector?.featureSetVersion || vector.featureSetVersion !== this.activeFeatureVersion.featureSetVersion) {
      return {
        isValid: false,
        error: `Feature set version mismatch. Expected ${this.activeFeatureVersion.featureSetVersion}`,
      };
    }
    const numericFields: Array<keyof EngineeredFeatureVector> = [
      'lag1d',
      'lag7d',
      'rolling7dMean',
      'rolling14dMean',
      'rolling14dStd',
    ];
    for (const field of numericFields) {
      if (typeof vector[field] !== 'number' || Number.isNaN(vector[field])) {
        return { isValid: false, error: `Invalid numeric feature: ${String(field)}` };
      }
    }
    return { isValid: true };
  }

  public computeFeatures(rawRecord: RawInputRecord, historicalWindowPrices: number[] = []): EngineeredFeatureVector {
    const prices =
      historicalWindowPrices.length > 0 ? historicalWindowPrices : [rawRecord.modalPrice];
    const getAt = (offsetFromEnd: number) =>
      prices[Math.max(0, prices.length - 1 - offsetFromEnd)] ?? rawRecord.modalPrice;

    const last7 = prices.slice(-7);
    const last14 = prices.slice(-14);
    const mean7 = last7.reduce((a, b) => a + b, 0) / last7.length;
    const mean14 = last14.reduce((a, b) => a + b, 0) / last14.length;
    const variance14 = last14.reduce((a, b) => a + Math.pow(b - mean14, 2), 0) / last14.length;

    const dt = new Date(rawRecord.date || Date.now());
    const startOfYear = new Date(dt.getFullYear(), 0, 0);
    const doy = Math.max(1, Math.floor((dt.getTime() - startOfYear.getTime()) / 86400000));
    const angle = (2 * Math.PI * doy) / 365.25;

    return {
      commodity: rawRecord.commodity,
      market: rawRecord.market,
      date: rawRecord.date,
      featureSetVersion: this.activeFeatureVersion.featureSetVersion,
      lag1d: Math.round(getAt(0) * 100) / 100,
      lag2d: Math.round(getAt(1) * 100) / 100,
      lag3d: Math.round(getAt(2) * 100) / 100,
      lag7d: Math.round(getAt(6) * 100) / 100,
      rolling7dMean: Math.round(mean7 * 100) / 100,
      rolling14dMean: Math.round(mean14 * 100) / 100,
      rolling14dStd: Math.round(Math.sqrt(variance14) * 100) / 100,
      sinDoy: Math.round(Math.sin(angle) * 10000) / 10000,
      cosDoy: Math.round(Math.cos(angle) * 10000) / 10000,
      arrivalTonnesScaled: Math.round(((rawRecord.arrivalQuantityTonne ?? 250) / 500) * 1000) / 1000,
      rainfallMmScaled: Math.round(((rawRecord.rainfallMm ?? 50) / 100) * 1000) / 1000,
      tempCScaled: Math.round(((rawRecord.temperatureMaxC ?? 30) / 45) * 1000) / 1000,
    };
  }
}

export const featureStore = new FeatureStoreEngine();
