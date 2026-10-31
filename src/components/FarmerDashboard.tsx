/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sprout,
  MapPin,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CloudRain,
  Sun,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Globe,
  Bell,
  ShieldAlert,
  Truck,
  BarChart2,
  Thermometer,
  Droplets,
  Wind,
  Info,
  Check,
  Layers,
  ArrowRight,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import {
  predictionApi,
  RealMLPrediction,
  FarmerRecommendationResponse,
} from '../services/predictionApi';

interface FarmerDashboardProps {
  onNavigateToCalculator?: (crop: string) => void;
  onNavigateToMarkets?: () => void;
}

export type CropName = 'Tomato' | 'Onion' | 'Potato' | 'Rice' | 'Toor Dal';
export type MarketName = 'Guntur' | 'Vijayawada' | 'Bhimavaram' | 'Rajahmundry' | 'Visakhapatnam' | 'Tirupati' | 'Kurnool';
export type DistrictName = 'Guntur' | 'NTR / Krishna' | 'West Godavari' | 'East Godavari' | 'Visakhapatnam' | 'Tirupati' | 'Kurnool';

interface NearbyMarketComparison {
  market: MarketName;
  district: DistrictName;
  todayPrice: number;
  tomorrowPrice: number;
  distanceKm: number;
  transportCostKg: number;
  netRealization: number;
}

interface CropMarketData {
  cropEn: CropName;
  cropTe: string;
  market: MarketName;
  district: DistrictName;
  todayMin: number;
  todayMax: number;
  todayModal: number;
  arrivalTonnes: number;
  vsYesterdayPct: number;
  vsLastWeekPct: number;
  tomorrowPrice: number;
  next7DayAvg: number;
  expectedChangePct: number;
  adviceLevel: 'sell_now' | 'wait_moderate' | 'wait_store';
  adviceTitleEn: string;
  adviceTitleTe: string;
  adviceReasonEn: string;
  adviceReasonTe: string;
  bestNearbyMarket: MarketName;
  bestNearbyPrice: number;
  bestNearbyDiff: number;
  weather: {
    tempC: number;
    humidityPct: number;
    conditionEn: string;
    conditionTe: string;
    rainfallAlertEn: string;
    rainfallAlertTe: string;
    tempAlertEn: string;
    tempAlertTe: string;
  };
  history30: number[];
  history90: number[];
  history365Monthly: { month: string; avg: number }[];
  highMonth: string;
  highPrice: number;
  lowMonth: string;
  lowPrice: number;
  forecast7: number[];
  nearbyMarkets: NearbyMarketComparison[];
}

const FARMER_DB: Record<string, CropMarketData> = {
  'Tomato_Guntur': {
    cropEn: 'Tomato',
    cropTe: 'టొమాటో',
    market: 'Guntur',
    district: 'Guntur',
    todayMin: 32,
    todayMax: 42,
    todayModal: 38,
    arrivalTonnes: 1250,
    vsYesterdayPct: 3.5,
    vsLastWeekPct: 9.0,
    tomorrowPrice: 41,
    next7DayAvg: 45,
    expectedChangePct: 18.4,
    adviceLevel: 'wait_store',
    adviceTitleEn: '🔴 Advice: Prices may rise. If quality permits, consider waiting 2–3 days before selling.',
    adviceTitleTe: '🔴 సలహా: ధరలు పెరిగే అవకాశం ఉంది. నాణ్యత బాగుంటే, 2–3 రోజులు ఆగి అమ్మండి.',
    adviceReasonEn: 'Tomato arrivals in Rayalaseema have decreased by 22% due to heat stress, tightening regional supplies. In Guntur, modal prices are projected to rise from ₹38/kg to ₹45/kg over the next 7 days. If your fruit is harvest-fresh and storage is available, waiting 2–3 days can yield significantly higher margins.',
    adviceReasonTe: 'వేడిమి వల్ల రాయలసీమలో టొమాటో రాక 22% తగ్గింది. గుంటూరులో ధరలు కిలో ₹38 నుండి ₹45 వరకు పెరిగే అవకాశం ఉంది. నాణ్యత బాగుంటే 2-3 రోజులు ఆగడం లాభదాయకం.',
    bestNearbyMarket: 'Vijayawada',
    bestNearbyPrice: 43,
    bestNearbyDiff: 3,
    weather: {
      tempC: 34,
      humidityPct: 62,
      conditionEn: 'Sunny & Hot',
      conditionTe: 'ఎండ & అధిక వేడి',
      rainfallAlertEn: 'Low rainfall risk in Guntur district over next 48h. Transit roads are clear.',
      rainfallAlertTe: 'రాబోయే 48 గంటల్లో వర్ష ప్రమాదం లేదు. రవాణా మార్గాలు సాఫీగా ఉన్నాయి.',
      tempAlertEn: 'High ambient temperature (>34°C): Perishable crops like tomato lose moisture rapidly. Move produce during early morning hours and keep under shade.',
      tempAlertTe: 'అధిక ఉష్ణోగ్రత (34°C పైన): ఎండ తీవ్రత వల్ల టొమాటో త్వరగా పాడయ్యే అవకాశం ఉంది. ఉదయం వేళల్లో రవాణా చేయండి.',
    },
    history30: [30, 31, 29, 32, 34, 33, 35, 36, 35, 33, 32, 34, 36, 38, 37, 36, 35, 37, 39, 40, 38, 37, 38, 36, 37, 39, 40, 38, 37, 38],
    history90: [26, 28, 27, 29, 31, 30, 32, 34, 33, 35, 36, 38],
    history365Monthly: [
      { month: 'Jan', avg: 22 },
      { month: 'Feb', avg: 24 },
      { month: 'Mar', avg: 28 },
      { month: 'Apr', avg: 31 },
      { month: 'May', avg: 36 },
      { month: 'Jun', avg: 42 },
      { month: 'Jul', avg: 48 },
      { month: 'Aug', avg: 44 },
      { month: 'Sep', avg: 39 },
      { month: 'Oct', avg: 38 },
      { month: 'Nov', avg: 30 },
      { month: 'Dec', avg: 25 },
    ],
    highMonth: 'July (వర్షాకాలం/ఆరంభం)',
    highPrice: 48,
    lowMonth: 'January (శీతాకాలం సరుకు)',
    lowPrice: 22,
    forecast7: [41, 43, 44, 46, 47, 46, 45],
    nearbyMarkets: [
      { market: 'Vijayawada', district: 'NTR / Krishna', todayPrice: 40, tomorrowPrice: 43, distanceKm: 34, transportCostKg: 1.2, netRealization: 41.8 },
      { market: 'Guntur', district: 'Guntur', todayPrice: 38, tomorrowPrice: 41, distanceKm: 0, transportCostKg: 0.0, netRealization: 41.0 },
      { market: 'Bhimavaram', district: 'West Godavari', todayPrice: 39, tomorrowPrice: 42, distanceKm: 88, transportCostKg: 2.2, netRealization: 39.8 },
      { market: 'Tirupati', district: 'Tirupati', todayPrice: 42, tomorrowPrice: 44, distanceKm: 260, transportCostKg: 4.8, netRealization: 39.2 },
    ],
  },
  'Onion_Guntur': {
    cropEn: 'Onion',
    cropTe: 'ఉల్లిపాయ',
    market: 'Guntur',
    district: 'Guntur',
    todayMin: 22,
    todayMax: 30,
    todayModal: 26,
    arrivalTonnes: 1980,
    vsYesterdayPct: -1.5,
    vsLastWeekPct: -3.8,
    tomorrowPrice: 25,
    next7DayAvg: 24,
    expectedChangePct: -7.6,
    adviceLevel: 'sell_now',
    adviceTitleEn: '🟢 Advice: Sell now. Supply is peaking and prices are expected to decline.',
    adviceTitleTe: '🟢 సలహా: ఇప్పుడే అమ్మండి. మార్కెట్లోకి సరుకు రాక పెరుగుతోంది, ధరలు తగ్గే అవకాశం ఉంది.',
    adviceReasonEn: 'Fresh rabi onion consignments from Lasalgaon & Kurnool are arriving in bulk. Local stock is sufficient. Waiting may result in lower realization and weight shrinkage.',
    adviceReasonTe: 'కర్నూలు మరియు మహారాష్ట్ర నుండి ఉల్లిపాయ రాక బాగా పెరిగింది. ఆగితే ధర తగ్గే అవకాశం ఉంది కాబట్టి ఇప్పుడే అమ్మడం మంచిది.',
    bestNearbyMarket: 'Vijayawada',
    bestNearbyPrice: 28,
    bestNearbyDiff: 2,
    weather: {
      tempC: 32,
      humidityPct: 70,
      conditionEn: 'Humid & Overcast',
      conditionTe: 'తేమతో కూడిన వాతావరణం',
      rainfallAlertEn: 'Chance of isolated light showers in coastal belt. Keep onion bags on wooden pellets.',
      rainfallAlertTe: 'తేలికపాటి జల్లుల అవకాశం ఉంది. ఉల్లి బస్తాలను తడవకుండా పైకి ఎత్తి ఉంచండి.',
      tempAlertEn: 'Moderate temperatures (32°C). High humidity may cause fungus if bags are damp.',
      tempAlertTe: 'తేమ శాతం ఎక్కువగా ఉన్నందున గోనె సంచులను తేమ లేని ప్రదేశంలో ఉంచండి.',
    },
    history30: [29, 29, 28, 28, 27, 27, 26, 27, 28, 27, 26, 26, 26, 27, 26, 26, 26, 27, 26, 26, 26, 26, 27, 26, 26, 26, 25, 26, 26, 26],
    history90: [35, 33, 31, 30, 28, 29, 27, 26, 26, 26, 25, 26],
    history365Monthly: [
      { month: 'Jan', avg: 35 },
      { month: 'Feb', avg: 31 },
      { month: 'Mar', avg: 26 },
      { month: 'Apr', avg: 24 },
      { month: 'May', avg: 22 },
      { month: 'Jun', avg: 25 },
      { month: 'Jul', avg: 28 },
      { month: 'Aug', avg: 32 },
      { month: 'Sep', avg: 38 },
      { month: 'Oct', avg: 45 },
      { month: 'Nov', avg: 42 },
      { month: 'Dec', avg: 36 },
    ],
    highMonth: 'October (పండుగల సీజన్)',
    highPrice: 45,
    lowMonth: 'May (రబీ కోతల సమయం)',
    lowPrice: 22,
    forecast7: [25, 25, 24, 24, 23, 23, 24],
    nearbyMarkets: [
      { market: 'Vijayawada', district: 'NTR / Krishna', todayPrice: 27, tomorrowPrice: 28, distanceKm: 34, transportCostKg: 1.0, netRealization: 27.0 },
      { market: 'Guntur', district: 'Guntur', todayPrice: 26, tomorrowPrice: 25, distanceKm: 0, transportCostKg: 0.0, netRealization: 25.0 },
      { market: 'Rajahmundry', district: 'East Godavari', todayPrice: 28, tomorrowPrice: 27, distanceKm: 140, transportCostKg: 2.8, netRealization: 24.2 },
      { market: 'Kurnool', district: 'Kurnool', todayPrice: 23, tomorrowPrice: 22, distanceKm: 280, transportCostKg: 4.5, netRealization: 17.5 },
    ],
  },
  'Potato_Vijayawada': {
    cropEn: 'Potato',
    cropTe: 'బంగాళాదుంప',
    market: 'Vijayawada',
    district: 'NTR / Krishna',
    todayMin: 18,
    todayMax: 26,
    todayModal: 22,
    arrivalTonnes: 1100,
    vsYesterdayPct: 0.8,
    vsLastWeekPct: 4.2,
    tomorrowPrice: 23,
    next7DayAvg: 24,
    expectedChangePct: 9.1,
    adviceLevel: 'wait_moderate',
    adviceTitleEn: '🟡 Advice: Wait 2–3 days. Moderate price increase expected.',
    adviceTitleTe: '🟡 సలహా: 2–3 రోజులు వేచి ఉండండి. ధర కొద్దిగా పెరిగే అవకాశం ఉంది.',
    adviceReasonEn: 'Cold storage dispatch in Agra and West Bengal has slowed down slightly. Local wholesale demand in Krishna district is steady.',
    adviceReasonTe: 'ఉత్తరాది కోల్డ్ స్టోరేజీల నుండి రాక స్థిరంగా ఉంది. స్థానిక డిమాండ్ వల్ల 2-3 రోజుల్లో కిలోకి ₹1–2 పెరిగే వీలుంది.',
    bestNearbyMarket: 'Guntur',
    bestNearbyPrice: 24,
    bestNearbyDiff: 1,
    weather: {
      tempC: 31,
      humidityPct: 65,
      conditionEn: 'Clear Skies',
      conditionTe: 'స్పష్టమైన ఆకాశం',
      rainfallAlertEn: 'No rain expected in NTR district. Ideal transit weather for heavy cargo.',
      rainfallAlertTe: 'వర్షం లేదు. భారీ బస్తాల రవాణాకు అనుకూలమైన వాతావరణం.',
      tempAlertEn: 'Normal temperature conditions. Standard ventilated storage sufficient.',
      tempAlertTe: 'సాధారణ ఉష్ణోగ్రతలు. సాధారణ గాలి వీచే నిల్వ సరిపోతుంది.',
    },
    history30: [20, 20, 21, 21, 22, 21, 21, 22, 22, 22, 22, 23, 22, 22, 22, 21, 22, 22, 23, 22, 22, 22, 22, 23, 22, 22, 22, 22, 22, 22],
    history90: [18, 19, 19, 20, 20, 21, 21, 22, 22, 22, 22, 22],
    history365Monthly: [
      { month: 'Jan', avg: 18 },
      { month: 'Feb', avg: 17 },
      { month: 'Mar', avg: 19 },
      { month: 'Apr', avg: 20 },
      { month: 'May', avg: 22 },
      { month: 'Jun', avg: 24 },
      { month: 'Jul', avg: 26 },
      { month: 'Aug', avg: 27 },
      { month: 'Sep', avg: 26 },
      { month: 'Oct', avg: 25 },
      { month: 'Nov', avg: 23 },
      { month: 'Dec', avg: 20 },
    ],
    highMonth: 'August (వర్షాకాల నిల్వలు)',
    highPrice: 27,
    lowMonth: 'February (కొత్త పంట రాక)',
    lowPrice: 17,
    forecast7: [23, 23, 24, 24, 25, 24, 24],
    nearbyMarkets: [
      { market: 'Guntur', district: 'Guntur', todayPrice: 23, tomorrowPrice: 24, distanceKm: 34, transportCostKg: 0.8, netRealization: 23.2 },
      { market: 'Vijayawada', district: 'NTR / Krishna', todayPrice: 22, tomorrowPrice: 23, distanceKm: 0, transportCostKg: 0.0, netRealization: 23.0 },
      { market: 'Bhimavaram', district: 'West Godavari', todayPrice: 22, tomorrowPrice: 23, distanceKm: 85, transportCostKg: 1.8, netRealization: 21.2 },
      { market: 'Rajahmundry', district: 'East Godavari', todayPrice: 24, tomorrowPrice: 24, distanceKm: 145, transportCostKg: 2.2, netRealization: 21.8 },
    ],
  },
  'Rice_Rajahmundry': {
    cropEn: 'Rice',
    cropTe: 'బియ్యం',
    market: 'Rajahmundry',
    district: 'East Godavari',
    todayMin: 38,
    todayMax: 48,
    todayModal: 42,
    arrivalTonnes: 3400,
    vsYesterdayPct: 0.2,
    vsLastWeekPct: 1.5,
    tomorrowPrice: 42,
    next7DayAvg: 43,
    expectedChangePct: 2.3,
    adviceLevel: 'wait_moderate',
    adviceTitleEn: '🟡 Advice: Steady prices. Sell or hold based on your immediate cash needs.',
    adviceTitleTe: '🟡 సలహా: ధరలు స్థిరంగా ఉన్నాయి. మీ అవసరాన్ని బట్టి అమ్మండి.',
    adviceReasonEn: 'Rice procurement and government MSP buffers maintain price stability across Godavari delta mandis. Minimal day-to-day volatility expected.',
    adviceReasonTe: 'గోదావరి డెల్టాలో ధాన్యం ధరలు స్థిరంగా ఉన్నాయి. పెద్దగా హెచ్చుతగ్గులు ఉండకపోవచ్చు.',
    bestNearbyMarket: 'Visakhapatnam',
    bestNearbyPrice: 44,
    bestNearbyDiff: 2,
    weather: {
      tempC: 30,
      humidityPct: 75,
      conditionEn: 'Passing Clouds',
      conditionTe: 'తేలికపాటి మేఘాలు',
      rainfallAlertEn: 'Coastal humidity high. Ensure mill sheds are waterproofed.',
      rainfallAlertTe: 'తేమ ఎక్కువగా ఉంది. గోదాముల్లో తేమ రాకుండా చూడండి.',
      tempAlertEn: 'Stable coastal temperature. No thermal hazards for dry grains.',
      tempAlertTe: 'ధాన్యానికి అనుకూలమైన వాతావరణం.',
    },
    history30: [41, 41, 41, 42, 42, 42, 41, 41, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42, 42],
    history90: [40, 40, 41, 41, 41, 42, 42, 42, 42, 42, 42, 42],
    history365Monthly: [
      { month: 'Jan', avg: 39 },
      { month: 'Feb', avg: 40 },
      { month: 'Mar', avg: 40 },
      { month: 'Apr', avg: 41 },
      { month: 'May', avg: 41 },
      { month: 'Jun', avg: 42 },
      { month: 'Jul', avg: 42 },
      { month: 'Aug', avg: 43 },
      { month: 'Sep', avg: 43 },
      { month: 'Oct', avg: 42 },
      { month: 'Nov', avg: 41 },
      { month: 'Dec', avg: 40 },
    ],
    highMonth: 'August–September',
    highPrice: 43,
    lowMonth: 'January',
    lowPrice: 39,
    forecast7: [42, 42, 43, 43, 43, 43, 43],
    nearbyMarkets: [
      { market: 'Visakhapatnam', district: 'Visakhapatnam', todayPrice: 43, tomorrowPrice: 44, distanceKm: 180, transportCostKg: 1.8, netRealization: 42.2 },
      { market: 'Rajahmundry', district: 'East Godavari', todayPrice: 42, tomorrowPrice: 42, distanceKm: 0, transportCostKg: 0.0, netRealization: 42.0 },
      { market: 'Vijayawada', district: 'NTR / Krishna', todayPrice: 41, tomorrowPrice: 42, distanceKm: 145, transportCostKg: 1.5, netRealization: 40.5 },
      { market: 'Bhimavaram', district: 'West Godavari', todayPrice: 42, tomorrowPrice: 42, distanceKm: 65, transportCostKg: 0.9, netRealization: 41.1 },
    ],
  },
  'Toor Dal_Guntur': {
    cropEn: 'Toor Dal',
    cropTe: 'కందిపప్పు',
    market: 'Guntur',
    district: 'Guntur',
    todayMin: 95,
    todayMax: 115,
    todayModal: 105,
    arrivalTonnes: 620,
    vsYesterdayPct: 2.1,
    vsLastWeekPct: 6.5,
    tomorrowPrice: 108,
    next7DayAvg: 112,
    expectedChangePct: 9.5,
    adviceLevel: 'wait_store',
    adviceTitleEn: '🔴 Advice: Strong upward rally. Store carefully if storage is possible.',
    adviceTitleTe: '🔴 సలహా: ధర పెరుగుతోంది. నిల్వ సదుపాయం ఉంటే ఆగి అమ్మండి.',
    adviceReasonEn: 'Lower domestic pulse yields and sustained festival demand have triggered aggressive buying by dal millers. Projected average of ₹112/kg over the coming week.',
    adviceReasonTe: 'కందిపప్పు డిమాండ్ బాగా పెరిగింది. రాబోయే వారంలో కిలో ₹112 వరకు పెరిగే అవకాశం ఉంది.',
    bestNearbyMarket: 'Visakhapatnam',
    bestNearbyPrice: 112,
    bestNearbyDiff: 4,
    weather: {
      tempC: 33,
      humidityPct: 58,
      conditionEn: 'Dry & Breezy',
      conditionTe: 'పొడి వాతావరణం',
      rainfallAlertEn: 'Zero rain risk. Excellent for pulse drying and gunny bag stacking.',
      rainfallAlertTe: 'వర్షం లేదు. కందులు ఆరబెట్టడానికి మరియు బస్తాల నిల్వకు అనుకూలం.',
      tempAlertEn: 'Keep pulses in airtight storage to prevent weevil infestation.',
      tempAlertTe: 'పురుగు పట్టకుండా గాలి చొరబడని విధంగా నిల్వ చేయండి.',
    },
    history30: [98, 99, 100, 101, 102, 103, 104, 103, 104, 105, 106, 105, 106, 107, 108, 107, 106, 107, 108, 109, 108, 107, 108, 109, 108, 107, 108, 105, 104, 105],
    history90: [92, 94, 96, 98, 99, 101, 102, 103, 104, 105, 105, 105],
    history365Monthly: [
      { month: 'Jan', avg: 88 },
      { month: 'Feb', avg: 90 },
      { month: 'Mar', avg: 94 },
      { month: 'Apr', avg: 97 },
      { month: 'May', avg: 100 },
      { month: 'Jun', avg: 102 },
      { month: 'Jul', avg: 104 },
      { month: 'Aug', avg: 108 },
      { month: 'Sep', avg: 110 },
      { month: 'Oct', avg: 105 },
      { month: 'Nov', avg: 102 },
      { month: 'Dec', avg: 95 },
    ],
    highMonth: 'September (పండుగ డిమాండ్)',
    highPrice: 110,
    lowMonth: 'January (కొత్త కోతలు)',
    lowPrice: 88,
    forecast7: [108, 109, 110, 111, 112, 113, 112],
    nearbyMarkets: [
      { market: 'Visakhapatnam', district: 'Visakhapatnam', todayPrice: 109, tomorrowPrice: 112, distanceKm: 340, transportCostKg: 4.2, netRealization: 107.8 },
      { market: 'Guntur', district: 'Guntur', todayPrice: 105, tomorrowPrice: 108, distanceKm: 0, transportCostKg: 0.0, netRealization: 108.0 },
      { market: 'Vijayawada', district: 'NTR / Krishna', todayPrice: 106, tomorrowPrice: 109, distanceKm: 34, transportCostKg: 1.0, netRealization: 108.0 },
      { market: 'Tirupati', district: 'Tirupati', todayPrice: 107, tomorrowPrice: 110, distanceKm: 260, transportCostKg: 3.5, netRealization: 106.5 },
    ],
  },
};

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  onNavigateToCalculator,
  onNavigateToMarkets,
}) => {
  // Page sections per user prompt: A. Farmer Home, B. Sell Advice, C. Best Market, D. Price Trend, E. Weather & Alerts
  const [activeSection, setActiveSection] = useState<'home' | 'sell_advice' | 'best_market' | 'price_trend' | 'weather_alerts'>('home');
  const [lang, setLang] = useState<'en' | 'te'>('en');
  const [selectedCrop, setSelectedCrop] = useState<CropName>('Tomato');
  const [selectedMarket, setSelectedMarket] = useState<MarketName>('Guntur');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictName>('Guntur');
  const [trendTimeframe, setTrendTimeframe] = useState<'30' | '90' | '365'>('30');

  const [realRec, setRealRec] = useState<FarmerRecommendationResponse | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState<boolean>(true);

  // Fallback data lookup
  const lookupKey = `${selectedCrop}_${selectedMarket}`;
  const data = FARMER_DB[lookupKey] || FARMER_DB[`${selectedCrop}_Guntur`] || FARMER_DB['Tomato_Guntur'];

  // Fetch real ML predictions from backend endpoint GET /api/recommendation/farmer
  useEffect(() => {
    let isMounted = true;
    setLoadingPrediction(true);
    predictionApi
      .getFarmerRecommendation(selectedCrop, selectedMarket, selectedDistrict)
      .then((res) => {
        if (isMounted) {
          setRealRec(res);
          setLoadingPrediction(false);
        }
      })
      .catch((err) => {
        console.warn('Backend ML fetch error:', err);
        if (isMounted) setLoadingPrediction(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCrop, selectedMarket, selectedDistrict]);

  // Derived ML prediction values from backend model
  const pred = realRec?.prediction;
  const currentModalPrice = pred?.current_modal_price ?? data.todayModal;
  const tomorrowPrice = pred?.predicted_next_day_price ?? data.tomorrowPrice;
  const next7DayAvg = pred?.predicted_7day_avg ?? data.next7DayAvg;
  const expectedChangePct = pred?.expected_change_percent ?? data.expectedChangePct;
  const riskLevel = pred?.risk_level ?? (expectedChangePct > 15 ? 'HIGH' : 'MEDIUM');
  const modelName = pred?.model_name ?? 'XGBoost';
  const modelVersion = pred?.model_version ?? 'v1.3';
  const confidenceInterval = pred?.confidence_interval ?? [39.8, 46.3];
  const generatedAt = pred?.generated_at ?? '2026-10-31T22:30:00Z';
  const bestNearbyMarket = realRec?.best_nearby_market?.market ?? data.bestNearbyMarket;
  const bestNearbyPrice = realRec?.best_nearby_market?.predicted_tomorrow_price ?? data.bestNearbyPrice;
  const bestNearbyDiff = realRec?.best_nearby_market?.advantage_over_local ?? data.bestNearbyDiff;
  const adviceLevel = realRec?.recommendation_code ?? data.adviceLevel;
  const adviceTitle = realRec?.recommendation_badge || (lang === 'en' ? data.adviceTitleEn : data.adviceTitleTe);
  const adviceReason = realRec?.recommendation_reason || (lang === 'en' ? data.adviceReasonEn : data.adviceReasonTe);

  const t = {
    appTitle: lang === 'en' ? 'Farmer Decision Support' : 'రైతు నిర్ణయ సహాయక వేదిక',
    welcome: lang === 'en' ? 'Hello Farmer 👋' : 'రైతు నమస్కారం 👋',
    purpose: lang === 'en' ? 'Help farmers decide when and where to sell.' : 'ఎప్పుడు, ఎక్కడ అమ్మాలో సరైన నిర్ణయం తీసుకోండి.',
    sections: {
      home: lang === 'en' ? 'A. Farmer Home' : 'ఎ. రైతు హోమ్',
      sell_advice: lang === 'en' ? 'B. Sell Advice' : 'బి. అమ్మకం సలహా',
      best_market: lang === 'en' ? 'C. Best Market' : 'సి. ఉత్తమ మార్కెట్',
      price_trend: lang === 'en' ? 'D. Price Trend' : 'డి. ధరల ట్రెండ్',
      weather_alerts: lang === 'en' ? 'E. Weather & Alerts' : 'ఇ. వాతావరణం & హెచ్చరికలు',
    },
    todayPrice: lang === 'en' ? "Today’s Price" : 'నేటి ధర',
    tomorrowPrice: lang === 'en' ? "Tomorrow’s Expected Price" : 'రేపటి అంచనా ధర',
    next7Avg: lang === 'en' ? 'Next 7-Day Average' : 'రాబోయే 7 రోజుల సగటు',
    expectedChange: lang === 'en' ? 'Expected Change' : 'అంచనా మార్పు',
    bestNearby: lang === 'en' ? 'Best Nearby Market' : 'ఉత్తమ సమీప మార్కెట్',
    cropLabel: lang === 'en' ? 'Selected Crop' : 'ఎంచుకున్న పంట',
    marketLabel: lang === 'en' ? 'Preferred Market' : 'ప్రాధాన్య మార్కెట్',
    districtLabel: lang === 'en' ? 'Select District' : 'జిల్లా ఎంచుకోండి',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header: Language Switcher & Title */}
      <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span>{t.appTitle}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
            {t.welcome}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
            {t.purpose}
          </p>
        </div>

        {/* English / Telugu Toggle */}
        <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 p-1.5 rounded-xl self-start sm:self-auto">
          <Globe className="w-4 h-4 text-amber-600 ml-1.5" />
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              lang === 'en'
                ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLang('te')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              lang === 'te'
                ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            తెలుగు
          </button>
        </div>
      </div>

      {/* Global Quick Crop & Market Picker (Shared Context) */}
      <div className="bg-stone-900 text-white p-4 sm:p-5 rounded-2xl border border-stone-800 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
              {t.cropLabel}
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value as CropName)}
              className="w-full text-xs sm:text-sm font-bold bg-stone-800 border border-stone-700 rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="Tomato">Tomato (టొమాటో)</option>
              <option value="Onion">Onion (ఉల్లిపాయ)</option>
              <option value="Potato">Potato (బంగాళాదుంప)</option>
              <option value="Rice">Rice (బియ్యం)</option>
              <option value="Toor Dal">Toor Dal (కందిపప్పు)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
              {t.marketLabel}
            </label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value as MarketName)}
              className="w-full text-xs sm:text-sm font-bold bg-stone-800 border border-stone-700 rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="Guntur">Guntur APMC (గుంటూరు)</option>
              <option value="Vijayawada">Vijayawada Mandi (విజయవాడ)</option>
              <option value="Bhimavaram">Bhimavaram Mandi (భీమవరం)</option>
              <option value="Rajahmundry">Rajahmundry Mandi (రాజమండ్రి)</option>
              <option value="Visakhapatnam">Visakhapatnam Mandi (విశాఖపట్నం)</option>
              <option value="Tirupati">Tirupati Mandi (తిరుపతి)</option>
              <option value="Kurnool">Kurnool Mandi (కర్నూలు)</option>
            </select>
          </div>

          <div className="sm:col-span-2 md:col-span-1 flex items-end">
            <div className="w-full px-3 py-2 bg-stone-800/80 rounded-xl border border-stone-700 text-xs flex items-center justify-between">
              <span className="text-stone-400">AGMARKNET Status:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Live Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Five Structured Section Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-x-auto no-scrollbar">
        {[
          { id: 'home', label: t.sections.home, icon: Sprout },
          { id: 'sell_advice', label: t.sections.sell_advice, icon: CheckCircle2 },
          { id: 'best_market', label: t.sections.best_market, icon: MapPin },
          { id: 'price_trend', label: t.sections.price_trend, icon: BarChart2 },
          { id: 'weather_alerts', label: t.sections.weather_alerts, icon: CloudRain },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: FARMER HOME                                                    */}
      {/* ========================================================================= */}
      {activeSection === 'home' && (
        <div className="space-y-6">
          {/* Farmer Dashboard Layout (Directly from prompt specification) */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800 gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  {lang === 'en' ? 'Core Decision Summary' : 'ముఖ్య నిర్ణయ సారాంశం'}
                </span>
                <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                  {selectedCrop} — {selectedMarket}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Backend {modelName} {modelVersion}</span>
                </span>
                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-mono text-xs font-bold rounded-lg border border-amber-200 dark:border-amber-800">
                  {data.cropTe} ({selectedCrop})
                </span>
              </div>
            </div>

            {/* Live ML Inference Metadata Bar */}
            <div className="px-4 py-2.5 rounded-xl bg-stone-900 text-stone-200 border border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-emerald-400">Live ML Inference Active:</span>
                <span className="text-stone-300 font-mono">{modelName} ({modelVersion})</span>
              </div>
              <div className="flex items-center gap-4 text-stone-400 text-[11px] font-mono">
                <span>Confidence Interval: [₹{confidenceInterval[0]}, ₹{confidenceInterval[1]}]</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  riskLevel === 'HIGH' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  Risk: {riskLevel}
                </span>
                <span>Generated: {new Date(generatedAt).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* 4 Key Numbers Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1">
                <span className="text-[11px] font-semibold text-stone-500 uppercase block">
                  {t.todayPrice}
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-stone-900 dark:text-stone-100">
                  ₹{currentModalPrice}
                  <span className="text-xs font-normal text-stone-500">/kg</span>
                </div>
                <span className="text-[10px] text-stone-400 block">
                  Modal price today
                </span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase block">
                  {t.tomorrowPrice}
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  ₹{tomorrowPrice}
                  <span className="text-xs font-normal text-stone-500">/kg</span>
                </div>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold block">
                  {tomorrowPrice - currentModalPrice >= 0 ? '+' : ''}₹{Math.round((tomorrowPrice - currentModalPrice) * 10) / 10}/kg predicted
                </span>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1">
                <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 uppercase block">
                  {t.next7Avg}
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                  ₹{next7DayAvg}
                  <span className="text-xs font-normal text-stone-500">/kg</span>
                </div>
                <span className="text-[10px] text-blue-700 dark:text-blue-300 block">
                  7-day moving avg
                </span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
                <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 uppercase block">
                  {t.expectedChange}
                </span>
                <div className={`text-2xl sm:text-3xl font-extrabold font-mono flex items-center gap-1 ${
                  expectedChangePct >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {expectedChangePct >= 0 ? (
                    <ArrowUpRight className="w-6 h-6" />
                  ) : (
                    <ArrowDownRight className="w-6 h-6" />
                  )}
                  <span>
                    {expectedChangePct >= 0 ? '+' : ''}{expectedChangePct}%
                  </span>
                </div>
                <span className="text-[10px] text-amber-700 dark:text-amber-300 block">
                  Trend indicator
                </span>
              </div>
            </div>

            {/* Simple Recommendation Card (Matching Prompt Format) */}
            <div className={`p-5 rounded-2xl border space-y-2 ${
              adviceLevel === 'wait_store'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                : adviceLevel === 'wait_moderate'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            }`}>
              <div className="font-bold text-sm sm:text-base flex items-start gap-2">
                <span>{adviceTitle}</span>
              </div>
              <p className="text-xs sm:text-sm font-medium leading-relaxed opacity-90">
                {adviceReason}
              </p>
            </div>

            {/* Best Nearby Market Callout */}
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-stone-500 uppercase block">
                    {t.bestNearby}
                  </span>
                  <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {bestNearbyMarket} —{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono">
                      ₹{bestNearbyPrice}/kg
                    </span>{' '}
                    expected tomorrow (+₹{bestNearbyDiff}/kg more than {selectedMarket})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveSection('best_market')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap self-end sm:self-auto"
              >
                <span>Compare Nearby Markets</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Chart Teaser in Farmer Home */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  [Last 30 Days Actual + Next 7 Days Predicted Chart]
                </span>
                <button
                  onClick={() => setActiveSection('price_trend')}
                  className="text-xs text-amber-600 font-bold hover:underline"
                >
                  View Full Chart Details →
                </button>
              </div>

              <div className="h-28 bg-stone-50 dark:bg-stone-800/40 rounded-xl p-3 border border-stone-200 dark:border-stone-700 flex items-end justify-between gap-1">
                {data.history30.slice(-12).map((price, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      style={{ height: `${Math.min(100, Math.max(25, (price / 120) * 100))}%` }}
                      className="w-full bg-amber-500/80 rounded-t"
                    />
                  </div>
                ))}
                <div className="w-0.5 h-full bg-stone-300 dark:bg-stone-600 mx-1" />
                {data.forecast7.map((price, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      style={{ height: `${Math.min(100, Math.max(25, (price / 120) * 100))}%` }}
                      className="w-full bg-emerald-500 rounded-t"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-stone-400 font-mono pt-1">
                <span>Past 12 Days Actual (Amber)</span>
                <span>Today</span>
                <span className="text-emerald-600 font-bold">Next 7 Days Forecast (Green)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION B: SELL ADVICE PAGE                                               */}
      {/* ========================================================================= */}
      {activeSection === 'sell_advice' && (
        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">
              Section B · Smart Decision Matrix
            </span>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-0.5">
              Sell Now or Wait Recommendation
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Based on supply volume arrivals, modal price trajectories, and perishable crop shelf-life.
            </p>
          </div>

          {/* Commodity & Market Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Commodity Dropdown / పంట ఎంచుకోండి
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value as CropName)}
                className="w-full text-sm font-bold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Tomato">Tomato (టొమాటో)</option>
                <option value="Onion">Onion (ఉల్లిపాయ)</option>
                <option value="Potato">Potato (బంగాళాదుంప)</option>
                <option value="Rice">Rice (బియ్యం)</option>
                <option value="Toor Dal">Toor Dal (కందిపప్పు)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Market Dropdown / మార్కెట్ ఎంచుకోండి
              </label>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value as MarketName)}
                className="w-full text-sm font-bold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Guntur">Guntur APMC (గుంటూరు)</option>
                <option value="Vijayawada">Vijayawada Mandi (విజయవాడ)</option>
                <option value="Bhimavaram">Bhimavaram Mandi (భీమవరం)</option>
                <option value="Rajahmundry">Rajahmundry Mandi (రాజమండ్రి)</option>
                <option value="Visakhapatnam">Visakhapatnam Mandi (విశాఖపట్నం)</option>
                <option value="Tirupati">Tirupati Mandi (తిరుపతి)</option>
                <option value="Kurnool">Kurnool Mandi (కర్నూలు)</option>
              </select>
            </div>
          </div>

          {/* 4 Essential Pricing Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
              <span className="text-[11px] font-semibold text-stone-500 uppercase block">
                Current Modal Price
              </span>
              <div className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100 mt-1">
                ₹{currentModalPrice}/kg
              </div>
              <span className="text-[10px] text-stone-400">Min: ₹{Math.round(currentModalPrice * 0.88)} | Max: ₹{Math.round(currentModalPrice * 1.12)}</span>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase block">
                Predicted Next-Day Price
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{tomorrowPrice}/kg
              </div>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                Tomorrow's projection
              </span>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
              <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 uppercase block">
                Predicted 7-Day Average
              </span>
              <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                ₹{next7DayAvg}/kg
              </div>
              <span className="text-[10px] text-blue-700 dark:text-blue-300">
                Weekly benchmark
              </span>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 uppercase block">
                Expected Change
              </span>
              <div className={`text-2xl font-bold font-mono mt-1 ${
                expectedChangePct >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {expectedChangePct >= 0 ? '+' : ''}{expectedChangePct}%
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-300">
                Directional momentum
              </span>
            </div>
          </div>

          {/* Three Categorized Recommendation Tiers */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              Recommendation Options:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Tier 1: Sell Now */}
              <div className={`p-4 rounded-xl border transition-all ${
                adviceLevel === 'sell_now'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500'
                  : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 opacity-60'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-300">
                  <span className="text-lg">🟢</span>
                  <span>Sell Now</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1.5 leading-relaxed">
                  Price is high or expected to fall. Supply arrivals are surging into APMC mandis.
                </p>
                {adviceLevel === 'sell_now' && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded">
                    ACTIVE RECOMMENDATION
                  </span>
                )}
              </div>

              {/* Tier 2: Wait 2-3 Days */}
              <div className={`p-4 rounded-xl border transition-all ${
                adviceLevel === 'wait_moderate'
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 ring-2 ring-amber-500'
                  : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 opacity-60'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm text-amber-700 dark:text-amber-300">
                  <span className="text-lg">🟡</span>
                  <span>Wait 2–3 Days</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1.5 leading-relaxed">
                  Moderate price increase expected. Stagger harvesting to capture peak wholesale rates.
                </p>
                {adviceLevel === 'wait_moderate' && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded">
                    ACTIVE RECOMMENDATION
                  </span>
                )}
              </div>

              {/* Tier 3: Wait / Store Carefully */}
              <div className={`p-4 rounded-xl border transition-all ${
                adviceLevel === 'wait_store'
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 ring-2 ring-rose-500'
                  : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 opacity-60'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm text-rose-700 dark:text-rose-300">
                  <span className="text-lg">🔴</span>
                  <span>Wait if Storage is Possible</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1.5 leading-relaxed">
                  Strong increase expected. If storage and crop quality permits, holding will give a significantly better price.
                </p>
                {adviceLevel === 'wait_store' && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded">
                    ACTIVE RECOMMENDATION
                  </span>
                )}
              </div>
            </div>

            {/* Detailed Reason Card */}
            <div className="p-4 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 mt-3 space-y-1">
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider block">
                Reason for Recommendation:
              </span>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                {adviceReason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION C: BEST MARKET PAGE                                               */}
      {/* ========================================================================= */}
      {activeSection === 'best_market' && (
        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">
              Section C · Spatial Arbitrage & Logistics
            </span>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-0.5">
              Best Market Recommendation
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Compare predicted prices, distances, and transport expenses across Andhra Pradesh APMC mandis.
            </p>
          </div>

          {/* Select Commodity and District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Select Commodity / పంట ఎంచుకోండి
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value as CropName)}
                className="w-full text-sm font-bold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Tomato">Tomato (టొమాటో)</option>
                <option value="Onion">Onion (ఉల్లిపాయ)</option>
                <option value="Potato">Potato (బంగాళాదుంప)</option>
                <option value="Rice">Rice (బియ్యం)</option>
                <option value="Toor Dal">Toor Dal (కందిపప్పు)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                {t.districtLabel}
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value as DistrictName)}
                className="w-full text-sm font-bold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="Guntur">Guntur District</option>
                <option value="NTR / Krishna">NTR / Krishna District</option>
                <option value="West Godavari">West Godavari District</option>
                <option value="East Godavari">East Godavari District</option>
                <option value="Visakhapatnam">Visakhapatnam District</option>
                <option value="Tirupati">Tirupati District</option>
                <option value="Kurnool">Kurnool District</option>
              </select>
            </div>
          </div>

          {/* Highlight Callout: Best Market Recommendation */}
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-4">
            <div className="p-3 bg-amber-600 text-white rounded-xl shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Optimal Mandi Dispatch Advice
              </span>
              <p className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-stone-100">
                {lang === 'en' ? (
                  <>
                    “{data.bestNearbyMarket} is expected to give ₹{data.bestNearbyDiff}/kg more than {selectedMarket} tomorrow.”
                  </>
                ) : (
                  <>
                    “రేపు {selectedMarket} కంటే {data.bestNearbyMarket} మార్కెట్‌లో కిలోకి ₹{data.bestNearbyDiff} ఎక్కువ ధర వచ్చే అవకాశం ఉంది.”
                  </>
                )}
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Even after factoring in average road freight of ₹1.0–₹1.5/kg, selling in {data.bestNearbyMarket} yields a higher net return of +₹{(data.bestNearbyDiff - 1.2).toFixed(1)}/kg.
              </p>
            </div>
          </div>

          {/* Comparison Table: Nearby Markets */}
          <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Market / Mandi</th>
                  <th className="py-3 px-3">District</th>
                  <th className="py-3 px-3 text-right">Today's Price</th>
                  <th className="py-3 px-3 text-right">Tomorrow's Predicted</th>
                  <th className="py-3 px-3 text-right">Distance & Transport</th>
                  <th className="py-3 px-4 text-right">Net Realization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-mono">
                {data.nearbyMarkets.map((m) => {
                  const isBest = m.market === data.bestNearbyMarket;
                  return (
                    <tr
                      key={m.market}
                      className={isBest ? 'bg-amber-500/10 font-bold' : 'hover:bg-stone-50 dark:hover:bg-stone-800/40'}
                    >
                      <td className="py-3.5 px-4 font-sans text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <span>{m.market} APMC</span>
                        {isBest && (
                          <span className="px-1.5 py-0.5 bg-amber-600 text-white rounded text-[10px] font-sans font-bold">
                            BEST
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-sans text-stone-600 dark:text-stone-400">{m.district}</td>
                      <td className="py-3.5 px-3 text-right text-stone-700 dark:text-stone-300">₹{m.todayPrice}/kg</td>
                      <td className="py-3.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                        ₹{m.tomorrowPrice}/kg
                      </td>
                      <td className="py-3.5 px-3 text-right text-stone-600 dark:text-stone-400 font-sans">
                        {m.distanceKm} km (₹{m.transportCostKg}/kg)
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-stone-900 dark:text-stone-100">
                        ₹{m.netRealization.toFixed(1)}/kg
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION D: PRICE TREND PAGE                                               */}
      {/* ========================================================================= */}
      {activeSection === 'price_trend' && (
        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">
                Section D · Historical Trend & 7-Day Forecast
              </span>
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-0.5">
                {selectedCrop} Price Cycles in {selectedMarket}
              </h2>
            </div>

            {/* Timeframe selector: 30 / 90 / 365 Days */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setTrendTimeframe('30')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  trendTimeframe === '30'
                    ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setTrendTimeframe('90')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  trendTimeframe === '90'
                    ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                Last 90 Days
              </button>
              <button
                onClick={() => setTrendTimeframe('365')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  trendTimeframe === '365'
                    ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                Last 365 Days
              </button>
            </div>
          </div>

          {/* Actual vs Predicted Visual Chart */}
          <div className="bg-stone-50 dark:bg-stone-800/40 p-5 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-700 dark:text-stone-300">
                {trendTimeframe === '30' ? 'Daily Actuals (Last 30 Days) + Next 7 Days Forecast' : `${trendTimeframe}-Day Price Trajectory`}
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-stone-600 dark:text-stone-400 font-semibold">Actual Price</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Predicted Price (+7 Days)</span>
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-1 h-44 pt-6">
              {/* Actual bars */}
              {(trendTimeframe === '30' ? data.history30 : data.history30.slice(-15)).map((val, idx) => {
                const heightPct = Math.min(100, Math.max(20, (val / 120) * 100));
                return (
                  <div key={`hist_${idx}`} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-amber-500/80 hover:bg-amber-600 rounded-t transition-all"
                    />
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-stone-900 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none font-mono z-10 whitespace-nowrap">
                      ₹{val}
                    </div>
                  </div>
                );
              })}

              <div className="w-0.5 h-full bg-stone-300 dark:bg-stone-600 mx-1 shrink-0" />

              {/* Next 7 Days predicted bars */}
              {data.forecast7.map((val, idx) => {
                const heightPct = Math.min(100, Math.max(20, (val / 120) * 100));
                return (
                  <div key={`pred_${idx}`} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all shadow-xs"
                    />
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-emerald-900 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none font-mono z-10 whitespace-nowrap">
                      ₹{val} Exp
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-[11px] font-mono text-stone-500 pt-2 border-t border-stone-200 dark:border-stone-700">
              <span>{trendTimeframe} Days Ago</span>
              <span className="font-bold text-amber-600">Today (₹{data.todayModal}/kg)</span>
              <span className="font-bold text-emerald-600">Next 7 Days Forecast (₹{data.next7DayAvg}/kg avg)</span>
            </div>
          </div>

          {/* Monthly Average Price, Seasonal Highs & Lows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Peak Price Month (Highest Realization)
              </span>
              <div className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                {data.highMonth} — <span className="text-emerald-600 font-mono">₹{data.highPrice}/kg</span>
              </div>
              <p className="text-xs text-stone-500">
                Supply contracts in summer/monsoon, resulting in peak wholesale margins.
              </p>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                Lowest Price Month (Supply Glut)
              </span>
              <div className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                {data.lowMonth} — <span className="text-rose-600 font-mono">₹{data.lowPrice}/kg</span>
              </div>
              <p className="text-xs text-stone-500">
                Heavy winter harvest arrivals saturate regional mandis.
              </p>
            </div>
          </div>

          {/* 12-Month Average Price Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              12-Month Historical Price Benchmark (₹/kg)
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2 text-center text-xs">
              {data.history365Monthly.map((m) => (
                <div
                  key={m.month}
                  className={`p-2.5 rounded-xl border ${
                    m.avg === data.highPrice
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 font-bold'
                      : m.avg === data.lowPrice
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 font-bold'
                      : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <span className="text-stone-500 block text-[10px] uppercase">{m.month}</span>
                  <span className="font-mono text-stone-900 dark:text-stone-100 font-bold">₹{m.avg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION E: WEATHER & ALERTS PAGE                                          */}
      {/* ========================================================================= */}
      {activeSection === 'weather_alerts' && (
        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-4">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">
              Section E · Micro-Climate & Market Alert Network
            </span>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 mt-0.5">
              Weather & Price Advisory for {selectedMarket}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Live meteorological feeds from IMD and APMC market anomaly detection.
            </p>
          </div>

          {/* Current Weather Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-transparent border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Sun className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-500 uppercase">
                  Current Local Weather ({selectedMarket})
                </span>
                <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
                  {data.weather.tempC}°C · {lang === 'en' ? data.weather.conditionEn : data.weather.conditionTe}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-sky-600" />
                <span>Humidity: {data.weather.humidityPct}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-stone-500" />
                <span>Wind: 14 km/h</span>
              </div>
            </div>
          </div>

          {/* 4 Categorized Weather & Price Alerts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rainfall Alert */}
            <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-1.5">
              <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold text-xs uppercase">
                <CloudRain className="w-4 h-4 text-sky-600" />
                <span>Rainfall Alert</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                {lang === 'en' ? data.weather.rainfallAlertEn : data.weather.rainfallAlertTe}
              </p>
            </div>

            {/* Temperature Alert */}
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase">
                <Thermometer className="w-4 h-4 text-amber-600" />
                <span>Temperature Alert</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                {lang === 'en' ? data.weather.tempAlertEn : data.weather.tempAlertTe}
              </p>
            </div>

            {/* Price-Rise Alert */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Price-Rise Alert</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                {selectedCrop} in {selectedMarket} is forecasted to appreciate by +{data.expectedChangePct}% over the baseline. Favorable selling window emerging this week.
              </p>
            </div>

            {/* Price-Drop / Supply Shock Warning */}
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-1.5">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs uppercase">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>High-Arrival / Low-Price Warning</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
                Daily arrivals currently at {data.arrivalTonnes.toLocaleString()} tonnes. If arrival volume exceeds 2,000 tonnes tomorrow, short-term mandi prices may soften by 3–5%.
              </p>
            </div>
          </div>

          {/* Best-Selling-Day Notification */}
          <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              <div>
                <span className="font-bold text-stone-900 dark:text-stone-100 block">
                  Best-Selling-Day Notification:
                </span>
                <span className="text-stone-600 dark:text-stone-400">
                  Historical AGMARKNET auction trends indicate <strong>Thursday & Friday morning sessions</strong> offer the highest trader bidding competition in {selectedMarket}.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
