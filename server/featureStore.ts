/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Versioned Feature Store & Engineering Pipeline
 * Ensures identical feature engineering code is executed for both model training and live serving,
 * eliminating training-serving skew.
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
  minPrice: number;
  maxPrice: number;
  arrivalQuantityTonne: number;
  rainfallMm?: number;
  temperatureMaxC?: number;
}

export interface EngineeredFeatureVector {
  commodity: string;
  market: string;
  date: string;
  featureSetVersion: string;
  priceLag1Day: number;
  priceLag7Day: number;
  rolling7DayAvg: number;
  rolling30DayVolatility: number;
  arrivalPressureIndex: number;
  weatherCovariateScore: number;
  targetPriceNextDay: number;
}

class FeatureStoreEngine {
  private activeFeatureVersion: FeatureDefinitionVersion = {
    featureSetVersion: 'v2.1.0',
    description: 'AGMARKNET normalized modal price, 7-day rolling average, 30-day volatility index, and weather covariates.',
    features: [
      'price_lag_1d',
      'price_lag_7d',
      'rolling_7d_avg',
      'rolling_30d_volatility',
      'arrival_pressure_index',
      'weather_covariate_score',
    ],
    createdAt: '2026-10-01T00:00:00Z',
  };

  public getActiveFeatureDefinition(): FeatureDefinitionVersion {
    return this.activeFeatureVersion;
  }

  // Feature schema validation
  public validateFeatureSchema(vector: any): { isValid: boolean; error?: string } {
    if (!vector.featureSetVersion || vector.featureSetVersion !== this.activeFeatureVersion.featureSetVersion) {
      return { isValid: false, error: `Feature set version mismatch. Expected ${this.activeFeatureVersion.featureSetVersion}` };
    }
    if (typeof vector.rolling7DayAvg !== 'number' || isNaN(vector.rolling7DayAvg)) {
      return { isValid: false, error: 'Invalid rolling7DayAvg feature value' };
    }
    if (typeof vector.arrivalPressureIndex !== 'number') {
      return { isValid: false, error: 'Invalid arrivalPressureIndex feature value' };
    }
    return { isValid: true };
  }

  /**
   * Shared feature transformation function used identically in training and inference
   */
  public computeFeatures(rawRecord: RawInputRecord, historicalWindowPrices: number[] = []): EngineeredFeatureVector {
    const prices = historicalWindowPrices.length > 0 ? historicalWindowPrices : [rawRecord.modalPrice, rawRecord.modalPrice * 0.98, rawRecord.modalPrice * 1.02];
    
    const priceLag1Day = prices[prices.length - 1] || rawRecord.modalPrice;
    const priceLag7Day = prices[0] || rawRecord.modalPrice;
    
    const sum = prices.reduce((acc, p) => acc + p, 0);
    const rolling7DayAvg = Math.round((sum / prices.length) * 10) / 10;
    
    // Volatility calculation (standard deviation approximation)
    const mean = rolling7DayAvg;
    const variance = prices.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / prices.length;
    const rolling30DayVolatility = Math.round(Math.sqrt(variance) * 10) / 10;

    const arrivalPressureIndex = Math.round((rawRecord.arrivalQuantityTonne / 1000) * 100) / 100;
    const weatherCovariateScore = rawRecord.rainfallMm && rawRecord.rainfallMm > 20 ? 0.85 : 1.0;

    return {
      commodity: rawRecord.commodity,
      market: rawRecord.market,
      date: rawRecord.date,
      featureSetVersion: this.activeFeatureVersion.featureSetVersion,
      priceLag1Day,
      priceLag7Day,
      rolling7DayAvg,
      rolling30DayVolatility,
      arrivalPressureIndex,
      weatherCovariateScore,
      targetPriceNextDay: Math.round((rolling7DayAvg * 1.02) * 10) / 10,
    };
  }
}

export const featureStore = new FeatureStoreEngine();
