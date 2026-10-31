/**
 * Types and interfaces for the Mandi Price Predictor platform
 * Grounded in the empirical research paper by Sudhansu Taparia
 */

export type CropGroup =
  | 'Cereals'
  | 'Vegetables'
  | 'Oil Seeds'
  | 'Pulses'
  | 'Spices'
  | 'Fruits'
  | 'Fibre Crops'
  | 'Dry Fruits'
  | 'Forest Products'
  | 'Drug and Narcotics'
  | 'Live Stock/Poultry/Fisheries'
  | 'Flowers'
  | 'Other';

export type IndianState =
  | 'Andhra Pradesh'
  | 'Arunachal Pradesh'
  | 'Assam'
  | 'Bihar'
  | 'Chhattisgarh'
  | 'Goa'
  | 'Gujarat'
  | 'Haryana'
  | 'Himachal Pradesh'
  | 'Jharkhand'
  | 'Karnataka'
  | 'Kerala'
  | 'Madhya Pradesh'
  | 'Maharashtra'
  | 'Manipur'
  | 'Meghalaya'
  | 'Mizoram'
  | 'Nagaland'
  | 'Odisha'
  | 'Punjab'
  | 'Rajasthan'
  | 'Sikkim'
  | 'Tamil Nadu'
  | 'Telangana'
  | 'Tripura'
  | 'Uttar Pradesh'
  | 'Uttarakhand'
  | 'West Bengal';

export type IndianRegion = 'North' | 'South' | 'East' | 'West' | 'Central' | 'North-East';

export interface StateMetadata {
  state: IndianState;
  region: IndianRegion;
  capital: string;
  majorCrops: string[];
  averageRainfallMm: number;
}

export interface MandiMarket {
  id: string;
  name: string;
  state: IndianState;
  district: string;
  totalArrivalsAnnualTonne: number;
  averageRainfallMm: number;
}

export interface CultivationInputs {
  farmLabourHours: number;
  farmLabourCost: number;
  machineryHours: number;
  machineryCost: number;
  animalOwnedHours: number;
  animalOwnedCost: number;
  seedQuantityKg: number;
  seedCost: number;
  fertilizerQuantityKg: number;
  fertilizerCost: number;
  manureTonne: number;
  manureCost: number;
  insecticideCost: number;
  totalCapitalCost: number;
  cropAreaHectare: number;
  mainProductTonne: number;
  rainfallMm: number;
  arrivalQuantityTonne: number;
}

export interface PredictionResult {
  group: CropGroup;
  logPrice: number;
  pricePerQuintal: number;
  pricePerTonne: number;
  lowerBoundQuintal: number;
  upperBoundQuintal: number;
  momChangePercent: number;
  direction: 'up' | 'down' | 'flat';
  confidenceIntervalPercent: number;
}

export interface SavedScenario {
  id: string;
  userId: string;
  cropGroup: CropGroup;
  cropName: string;
  state: IndianState;
  market: string;
  inputs: Partial<CultivationInputs>;
  predictedPriceQuintal: number;
  predictedPriceTonne: number;
  createdAt: string;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  state: IndianState;
  market: string;
  targetPrice: number;
  alertCondition: 'above' | 'below';
  addedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  role: 'farmer' | 'trader' | 'analyst' | 'admin';
  preferredState: IndianState;
  preferredMarket: string;
  preferredDistrict?: string;
  preferredCommodities?: string[];
  language?: 'en' | 'te' | 'hi';
  alertsEnabled?: boolean;
  alertChannels?: ('dashboard' | 'email' | 'sms' | 'whatsapp')[];
  createdAt: string;
}

export interface TimeSeriesPoint {
  index: number;
  date: string;
  actualPrice?: number;
  meanForecast?: number;
  naiveForecast?: number;
  driftForecast?: number;
  hwLevelForecast?: number;
  hwTrendForecast?: number;
  arimaForecast?: number;
  lower80?: number;
  upper80?: number;
  lower95?: number;
  upper95?: number;
}

export interface ClusterInfo {
  group: CropGroup;
  cluster1: number;
  cluster2: number;
  cluster3: number;
  dominantCluster: number;
  percentageInDominant: number;
  notes: string;
}

export interface DiagnosticDataPoint {
  index: number;
  fittedValue: number;
  residual: number;
  cooksDistance: number;
  theoreticalQuantile: number;
  standardizedResidual: number;
  isInfluential?: boolean;
}
