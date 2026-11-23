/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sprout,
  MapPin,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CloudRain,
  Sun,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Globe,
  Bell,
  Truck,
  BarChart2,
  Thermometer,
  Droplets,
  Wind,
  Check,
  ArrowRight,
  Cpu,
  Clock,
  Calculator,
  Database,
  ShieldCheck,
} from 'lucide-react';
import {
  predictionApi,
  FarmerRecommendationResponse,
} from '../services/predictionApi';

interface FarmerDashboardProps {
  onNavigateToCalculator?: (crop: string) => void;
  onNavigateToMarkets?: () => void;
}

export type CropName = 'Tomato' | 'Onion' | 'Potato' | 'Rice' | 'Toor Dal';
export type MarketName =
  | 'Guntur'
  | 'Vijayawada'
  | 'Bhimavaram'
  | 'Rajahmundry'
  | 'Visakhapatnam'
  | 'Tirupati'
  | 'Kurnool';
export type DistrictName =
  | 'Guntur'
  | 'NTR / Krishna'
  | 'West Godavari'
  | 'East Godavari'
  | 'Visakhapatnam'
  | 'Tirupati'
  | 'Kurnool';

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
  highMonthEn: string;
  highMonthTe: string;
  highPrice: number;
  lowMonthEn: string;
  lowMonthTe: string;
  lowPrice: number;
  forecast7: number[];
  nearbyMarkets: NearbyMarketComparison[];
  defaultYieldQtl: number;
  defaultCosts: {
    seed: number;
    fertilizer: number;
    labor: number;
    transport: number;
  };
}

const FARMER_DB: Record<string, CropMarketData> = {
  Tomato_Guntur: {
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
    adviceTitleEn: 'Wait if Storage Available: Prices expected to climb over the next 2–3 days.',
    adviceTitleTe: 'సలహా: ధరలు పెరిగే అవకాశం ఉంది. నాణ్యత బాగుంటే 2–3 రోజులు ఆగి అమ్మండి.',
    adviceReasonEn:
      'Tomato arrivals in Rayalaseema have decreased by 22% due to heat stress, tightening regional supplies. In Guntur, modal prices are projected to rise from ₹38/kg toward ₹45/kg over the next 7 days.',
    adviceReasonTe:
      'వేడిమి వల్ల రాయలసీమలో టొమాటో రాక 22% తగ్గింది. గుంటూరులో ధరలు కిలో ₹38 నుండి ₹45 వరకు పెరిగే అవకాశం ఉంది. నాణ్యత బాగుంటే 2–3 రోజులు ఆగడం లాభదాయకం.',
    bestNearbyMarket: 'Vijayawada',
    bestNearbyPrice: 43,
    bestNearbyDiff: 3,
    weather: {
      tempC: 34,
      humidityPct: 62,
      conditionEn: 'Sunny & Warm',
      conditionTe: 'ఎండ & అధిక వేడి',
      rainfallAlertEn: 'Low rainfall risk in Guntur district over next 48h. Transit roads are clear.',
      rainfallAlertTe: 'రాబోయే 48 గంటల్లో వర్ష ప్రమాదం లేదు. రవాణా మార్గాలు సాఫీగా ఉన్నాయి.',
      tempAlertEn:
        'High ambient temperature (>34°C): Move perishable tomatoes during early morning hours and keep under shade.',
      tempAlertTe:
        'అధిక ఉష్ణోగ్రత (34°C పైన): ఎండ తీవ్రత వల్ల టొమాటో త్వరగా పాడయ్యే అవకాశం ఉంది. ఉదయం వేళల్లో రవాణా చేయండి.',
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
    highMonthEn: 'July (Monsoon onset)',
    highMonthTe: 'జూలై (వర్షాకాల ఆరంభం)',
    highPrice: 48,
    lowMonthEn: 'January (Winter harvest)',
    lowMonthTe: 'జనవరి (శీతాకాల పంట)',
    lowPrice: 22,
    forecast7: [41, 43, 44, 46, 47, 46, 45],
    nearbyMarkets: [
      { market: 'Vijayawada', district: 'NTR / Krishna', todayPrice: 40, tomorrowPrice: 43, distanceKm: 34, transportCostKg: 1.2, netRealization: 41.8 },
      { market: 'Guntur', district: 'Guntur', todayPrice: 38, tomorrowPrice: 41, distanceKm: 0, transportCostKg: 0.0, netRealization: 41.0 },
      { market: 'Bhimavaram', district: 'West Godavari', todayPrice: 39, tomorrowPrice: 42, distanceKm: 88, transportCostKg: 2.2, netRealization: 39.8 },
      { market: 'Tirupati', district: 'Tirupati', todayPrice: 42, tomorrowPrice: 44, distanceKm: 260, transportCostKg: 4.8, netRealization: 39.2 },
    ],
    defaultYieldQtl: 35,
    defaultCosts: { seed: 6500, fertilizer: 12000, labor: 18500, transport: 4200 },
  },
  Onion_Guntur: {
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
    adviceTitleEn: 'Sell Now: Supply is peaking and short-term prices may soften.',
    adviceTitleTe: 'సలహా: ఇప్పుడే అమ్మండి. మార్కెట్లోకి సరుకు రాక పెరుగుతోంది, ధరలు తగ్గే అవకాశం ఉంది.',
    adviceReasonEn:
      'Fresh consignments from Kurnool and Maharashtra are arriving in bulk. Waiting may result in softer auction rates and weight shrinkage.',
    adviceReasonTe:
      'కర్నూలు మరియు మహారాష్ట్ర నుండి ఉల్లిపాయ రాక బాగా పెరిగింది. ఆగితే ధర తగ్గే అవకాశం ఉంది కాబట్టి ఇప్పుడే అమ్మడం మంచిది.',
    bestNearbyMarket: 'Vijayawada',
    bestNearbyPrice: 28,
    bestNearbyDiff: 2,
    weather: {
      tempC: 32,
      humidityPct: 70,
      conditionEn: 'Humid & Overcast',
      conditionTe: 'తేమతో కూడిన వాతావరణం',
      rainfallAlertEn: 'Chance of isolated light showers in coastal belt. Keep onion bags off damp floors.',
      rainfallAlertTe: 'తేలికపాటి జల్లుల అవకాశం ఉంది. ఉల్లి బస్తాలను తడవకుండా పైకి ఎత్తి ఉంచండి.',
      tempAlertEn: 'Moderate temperatures (32°C). Ensure dry ventilation to avoid moisture spoilage.',
      tempAlertTe: 'తేమ శాతం ఎక్కువగా ఉన్నందున గోనె సంచులను పొడి ప్రదేశంలో ఉంచండి.',
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
    highMonthEn: 'October (Festival peak)',
    highMonthTe: 'అక్టోబర్ (పండుగల సీజన్)',
    highPrice: 45,
    lowMonthEn: 'May (Rabi harvest supply)',
    lowMonthTe: 'మే (రబీ కోతల సమయం)',
    lowPrice: 22,
    forecast7: [25, 25, 24, 24, 23, 23, 24],
    nearbyMarkets: [
      { market: 'Vijayawada', district: 'NTR / Krishna', todayPrice: 27, tomorrowPrice: 28, distanceKm: 34, transportCostKg: 1.0, netRealization: 27.0 },
      { market: 'Guntur', district: 'Guntur', todayPrice: 26, tomorrowPrice: 25, distanceKm: 0, transportCostKg: 0.0, netRealization: 25.0 },
      { market: 'Rajahmundry', district: 'East Godavari', todayPrice: 28, tomorrowPrice: 27, distanceKm: 140, transportCostKg: 2.8, netRealization: 24.2 },
      { market: 'Kurnool', district: 'Kurnool', todayPrice: 23, tomorrowPrice: 22, distanceKm: 280, transportCostKg: 4.5, netRealization: 17.5 },
    ],
    defaultYieldQtl: 45,
    defaultCosts: { seed: 8000, fertilizer: 11000, labor: 16000, transport: 4500 },
  },
  Potato_Vijayawada: {
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
    adviceTitleEn: 'Wait 2–3 Days: Gradual price improvement expected this week.',
    adviceTitleTe: 'సలహా: 2–3 రోజులు వేచి ఉండండి. ధర కొద్దిగా పెరిగే అవకాశం ఉంది.',
    adviceReasonEn:
      'Cold storage dispatch from northern hubs has slowed slightly while retail demand in Krishna district remains steady.',
    adviceReasonTe:
      'ఉత్తరాది కోల్డ్ స్టోరేజీల నుండి రాక స్థిరంగా ఉంది. స్థానిక డిమాండ్ వల్ల 2–3 రోజుల్లో కిలోకి ₹1–2 పెరిగే వీలుంది.',
    bestNearbyMarket: 'Guntur',
    bestNearbyPrice: 24,
    bestNearbyDiff: 1,
    weather: {
      tempC: 31,
      humidityPct: 65,
      conditionEn: 'Clear Skies',
      conditionTe: 'స్పష్టమైన ఆకాశం',
      rainfallAlertEn: 'No rain expected in NTR district. Good conditions for cargo transit.',
      rainfallAlertTe: 'వర్షం లేదు. బస్తాల రవాణాకు అనుకూలమైన వాతావరణం.',
      tempAlertEn: 'Normal temperatures. Standard ventilated shade storage is sufficient.',
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
    highMonthEn: 'August (Monsoon cold stock)',
    highMonthTe: 'ఆగస్టు (వర్షాకాల నిల్వలు)',
    highPrice: 27,
    lowMonthEn: 'February (Fresh crop)',
    lowMonthTe: 'ఫిబ్రవరి (కొత్త పంట రాక)',
    lowPrice: 17,
    forecast7: [23, 23, 24, 24, 25, 24, 24],
    nearbyMarkets: [
      { market: 'Guntur', district: 'Guntur', todayPrice: 23, tomorrowPrice: 24, distanceKm: 34, transportCostKg: 0.8, netRealization: 23.2 },
      { market: 'Vijayawada', district: 'NTR / Krishna', todayPrice: 22, tomorrowPrice: 23, distanceKm: 0, transportCostKg: 0.0, netRealization: 23.0 },
      { market: 'Bhimavaram', district: 'West Godavari', todayPrice: 22, tomorrowPrice: 23, distanceKm: 85, transportCostKg: 1.8, netRealization: 21.2 },
      { market: 'Rajahmundry', district: 'East Godavari', todayPrice: 24, tomorrowPrice: 24, distanceKm: 145, transportCostKg: 2.2, netRealization: 21.8 },
    ],
    defaultYieldQtl: 50,
    defaultCosts: { seed: 9500, fertilizer: 10500, labor: 14000, transport: 4000 },
  },
  Rice_Rajahmundry: {
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
    adviceTitleEn: 'Steady Market: Prices are stable; sell according to cash needs.',
    adviceTitleTe: 'సలహా: ధరలు స్థిరంగా ఉన్నాయి. మీ అవసరాన్ని బట్టి అమ్మండి.',
    adviceReasonEn:
      'MSP procurement buffers keep prices steady across Godavari delta mandis with minimal day-to-day volatility.',
    adviceReasonTe:
      'గోదావరి డెల్టాలో ధాన్యం ధరలు స్థిరంగా ఉన్నాయి. పెద్దగా హెచ్చుతగ్గులు ఉండకపోవచ్చు.',
    bestNearbyMarket: 'Visakhapatnam',
    bestNearbyPrice: 44,
    bestNearbyDiff: 2,
    weather: {
      tempC: 30,
      humidityPct: 75,
      conditionEn: 'Passing Clouds',
      conditionTe: 'తేలికపాటి మేఘాలు',
      rainfallAlertEn: 'Coastal humidity elevated. Keep grain sacks under dry waterproof tarpaulins.',
      rainfallAlertTe: 'తేమ ఎక్కువగా ఉంది. గోదాముల్లో తేమ రాకుండా చూడండి.',
      tempAlertEn: 'Stable coastal temperature; low thermal risk for dry grain.',
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
    highMonthEn: 'August–September',
    highMonthTe: 'ఆగస్టు–సెప్టెంబర్',
    highPrice: 43,
    lowMonthEn: 'January',
    lowMonthTe: 'జనవరి',
    lowPrice: 39,
    forecast7: [42, 42, 43, 43, 43, 43, 43],
    nearbyMarkets: [
      { market: 'Visakhapatnam', district: 'Visakhapatnam', todayPrice: 43, tomorrowPrice: 44, distanceKm: 180, transportCostKg: 1.8, netRealization: 42.2 },
      { market: 'Rajahmundry', district: 'East Godavari', todayPrice: 42, tomorrowPrice: 42, distanceKm: 0, transportCostKg: 0.0, netRealization: 42.0 },
      { market: 'Vijayawada', district: 'NTR / Krishna', todayPrice: 41, tomorrowPrice: 42, distanceKm: 145, transportCostKg: 1.5, netRealization: 40.5 },
      { market: 'Bhimavaram', district: 'West Godavari', todayPrice: 42, tomorrowPrice: 42, distanceKm: 65, transportCostKg: 0.9, netRealization: 41.1 },
    ],
    defaultYieldQtl: 30,
    defaultCosts: { seed: 4500, fertilizer: 9500, labor: 15000, transport: 3200 },
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
    adviceTitleEn: 'Wait if Storage Available: Firm upward demand from pulse millers.',
    adviceTitleTe: 'సలహా: ధర పెరుగుతోంది. నిల్వ సదుపాయం ఉంటే ఆగి అమ్మండి.',
    adviceReasonEn:
      'Lower pulse yields and steady miller procurement support prices toward ₹112/kg over the coming week.',
    adviceReasonTe:
      'కందిపప్పు డిమాండ్ బాగా పెరిగింది. రాబోయే వారంలో కిలో ₹112 వరకు పెరిగే అవకాశం ఉంది.',
    bestNearbyMarket: 'Visakhapatnam',
    bestNearbyPrice: 112,
    bestNearbyDiff: 4,
    weather: {
      tempC: 33,
      humidityPct: 58,
      conditionEn: 'Dry & Breezy',
      conditionTe: 'పొడి వాతావరణం',
      rainfallAlertEn: 'Zero rain risk. Ideal for grain drying and clean bag stacking.',
      rainfallAlertTe: 'వర్షం లేదు. కందులు ఆరబెట్టడానికి మరియు బస్తాల నిల్వకు అనుకూలం.',
      tempAlertEn: 'Store pulses in sealed dry gunny bags to prevent moisture absorption.',
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
    highMonthEn: 'September (Festival demand)',
    highMonthTe: 'సెప్టెంబర్ (పండుగ డిమాండ్)',
    highPrice: 110,
    lowMonthEn: 'January (Fresh arrivals)',
    lowMonthTe: 'జనవరి (కొత్త కోతలు)',
    lowPrice: 88,
    forecast7: [108, 109, 110, 111, 112, 113, 112],
    nearbyMarkets: [
      { market: 'Visakhapatnam', district: 'Visakhapatnam', todayPrice: 109, tomorrowPrice: 112, distanceKm: 340, transportCostKg: 4.2, netRealization: 107.8 },
      { market: 'Guntur', district: 'Guntur', todayPrice: 105, tomorrowPrice: 108, distanceKm: 0, transportCostKg: 0.0, netRealization: 108.0 },
      { market: 'Vijayawada', district: 'NTR / Krishna', todayPrice: 106, tomorrowPrice: 109, distanceKm: 34, transportCostKg: 1.0, netRealization: 108.0 },
      { market: 'Tirupati', district: 'Tirupati', todayPrice: 107, tomorrowPrice: 110, distanceKm: 260, transportCostKg: 3.5, netRealization: 106.5 },
    ],
    defaultYieldQtl: 12,
    defaultCosts: { seed: 3500, fertilizer: 6500, labor: 11000, transport: 2200 },
  },
};

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  onNavigateToMarkets,
}) => {
  const [activeSection, setActiveSection] = useState<
    'home' | 'sell_advice' | 'best_market' | 'price_trend' | 'weather_alerts' | 'profit_calc'
  >('home');
  const [lang, setLang] = useState<'en' | 'te'>('en');
  const [selectedCrop, setSelectedCrop] = useState<CropName>('Tomato');
  const [selectedMarket, setSelectedMarket] = useState<MarketName>('Guntur');
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictName>('Guntur');
  const [trendTimeframe, setTrendTimeframe] = useState<'30' | '90' | '365'>('30');

  const [realRec, setRealRec] = useState<FarmerRecommendationResponse | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState<boolean>(true);

  const lookupKey = `${selectedCrop}_${selectedMarket}`;
  const data = FARMER_DB[lookupKey] || FARMER_DB[`${selectedCrop}_Guntur`] || FARMER_DB['Tomato_Guntur'];

  // Cultivation Cost & Profit Estimator state synced with selected crop defaults
  const [harvestQtyQtl, setHarvestQtyQtl] = useState<number>(data.defaultYieldQtl);
  const [seedCost, setSeedCost] = useState<number>(data.defaultCosts.seed);
  const [fertilizerCost, setFertilizerCost] = useState<number>(data.defaultCosts.fertilizer);
  const [laborCost, setLaborCost] = useState<number>(data.defaultCosts.labor);
  const [transportCost, setTransportCost] = useState<number>(data.defaultCosts.transport);
  const [sellingPriceBasis, setSellingPriceBasis] = useState<'today' | 'tomorrow' | 'week7'>('tomorrow');

  useEffect(() => {
    setHarvestQtyQtl(data.defaultYieldQtl);
    setSeedCost(data.defaultCosts.seed);
    setFertilizerCost(data.defaultCosts.fertilizer);
    setLaborCost(data.defaultCosts.labor);
    setTransportCost(data.defaultCosts.transport);
  }, [selectedCrop]);

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
      .catch(() => {
        if (isMounted) setLoadingPrediction(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCrop, selectedMarket, selectedDistrict]);

  const pred = realRec?.prediction;
  const currentModalPrice = pred?.current_modal_price ?? data.todayModal;
  const tomorrowPrice = pred?.predicted_next_day_price ?? data.tomorrowPrice;
  const next7DayAvg = pred?.predicted_7day_avg ?? data.next7DayAvg;
  const expectedChangePct = pred?.expected_change_percent ?? data.expectedChangePct;
  const riskLevel = pred?.risk_level ?? (expectedChangePct > 15 ? 'HIGH' : 'MEDIUM');
  const modelName = pred?.model_name ?? 'Random Forest Regressor';
  const modelVersion = pred?.model_version ?? 'v1.0.0';
  const confidenceInterval = pred?.confidence_interval ?? [Math.round(tomorrowPrice * 0.92), Math.round(tomorrowPrice * 1.08)];
  const bestNearbyMarket = realRec?.best_nearby_market?.market ?? data.bestNearbyMarket;
  const bestNearbyPrice = realRec?.best_nearby_market?.predicted_tomorrow_price ?? data.bestNearbyPrice;
  const bestNearbyDiff = realRec?.best_nearby_market?.advantage_over_local ?? data.bestNearbyDiff;
  const adviceLevel = realRec?.recommendation_code ?? data.adviceLevel;
  const isLiveData = realRec?.is_demonstration_data === false;

  const adviceTitle = lang === 'en' ? data.adviceTitleEn : data.adviceTitleTe;
  const adviceReason =
    lang === 'en' && realRec?.recommendation_reason
      ? realRec.recommendation_reason
      : lang === 'en'
      ? data.adviceReasonEn
      : data.adviceReasonTe;

  // Nearby comparison rows prefer backend when available
  const nearbyRows =
    realRec?.nearby_markets_comparison && realRec.nearby_markets_comparison.length > 0
      ? realRec.nearby_markets_comparison.map((m) => ({
          market: m.market,
          district: m.district,
          todayPrice: m.today_price,
          tomorrowPrice: m.predicted_tomorrow_price,
          distanceKm: m.distance_km,
          transportCostKg: m.transport_cost_per_kg,
          netRealization: m.net_realization_per_kg,
        }))
      : data.nearbyMarkets;

  // Profit Calculator Computations
  const activeSellRateKg =
    sellingPriceBasis === 'today'
      ? currentModalPrice
      : sellingPriceBasis === 'tomorrow'
      ? tomorrowPrice
      : next7DayAvg;
  const totalCultivationCost = seedCost + fertilizerCost + laborCost + transportCost;
  const expectedGrossRevenue = Math.round(harvestQtyQtl * 100 * activeSellRateKg);
  const estimatedNetProfit = expectedGrossRevenue - totalCultivationCost;
  const breakEvenPriceKg = harvestQtyQtl > 0 ? totalCultivationCost / (harvestQtyQtl * 100) : 0;
  const roiPct = totalCultivationCost > 0 ? (estimatedNetProfit / totalCultivationCost) * 100 : 0;

  // Bilingual dictionary covering every heading, control, card & label
  const t = {
    badge: lang === 'en' ? 'Farmer Decision Support' : 'రైతు నిర్ణయ సహాయక వేదిక',
    welcome: lang === 'en' ? 'Farmer Crop & Profit Workspace' : 'రైతు పంట మరియు లాభ మార్గదర్శి',
    purpose:
      lang === 'en'
        ? 'Check mandi rates, compare nearby markets, and estimate profit before harvesting.'
        : 'కోతకు ముందే మార్కెట్ ధరలు, సమీప మండీలు మరియు నికర లాభాన్ని అంచనా వేయండి.',
    sections: {
      home: lang === 'en' ? 'Overview' : 'సారాంశం',
      sell_advice: lang === 'en' ? 'Sell or Hold' : 'అమ్మకం సలహా',
      best_market: lang === 'en' ? 'Nearby Mandis' : 'సమీప మార్కెట్లు',
      price_trend: lang === 'en' ? 'Price Trend' : 'ధరల ట్రెండ్',
      weather_alerts: lang === 'en' ? 'Weather & Alerts' : 'వాతావరణం',
      profit_calc: lang === 'en' ? 'Profit Estimator' : 'లాభ అంచనా',
    },
    cropLabel: lang === 'en' ? 'Select Crop' : 'పంట ఎంచుకోండి',
    marketLabel: lang === 'en' ? 'Your Mandi' : 'మీ మార్కెట్',
    districtLabel: lang === 'en' ? 'Select District' : 'జిల్లా ఎంచుకోండి',
    datasetMode: lang === 'en' ? 'Data Source' : 'డేటా మూలం',
    liveLabel: lang === 'en' ? 'Live / Uploaded Data' : 'లైవ్ / అప్‌లోడ్ డేటా',
    sampleLabel: lang === 'en' ? 'Sample Dataset (Offline)' : 'నమూనా డేటా (ఆఫ్‌లైన్)',
    todayPrice: lang === 'en' ? "Today's Modal Rate" : 'నేటి సగటు ధర',
    tomorrowPrice: lang === 'en' ? 'Next-Day Forecast' : 'రేపటి అంచనా ధర',
    next7Avg: lang === 'en' ? '7-Day Forecast Avg' : '7 రోజుల సగటు ధర',
    expectedChange: lang === 'en' ? 'Expected Direction' : 'ధర మార్పు అంచనా',
    bestNearby: lang === 'en' ? 'Best Nearby Mandi' : 'ఉత్తమ సమీప మార్కెట్',
    compareBtn: lang === 'en' ? 'Compare Mandis' : 'మార్కెట్లను పోల్చండి',
    calcBtn: lang === 'en' ? 'Calculate My Profit' : 'నా లాభం లెక్కించండి',
    actualSeries: lang === 'en' ? 'Actual Historical (₹/kg)' : 'గత ధరలు (₹/కిలో)',
    forecastSeries: lang === 'en' ? '7-Day ML Forecast (₹/kg)' : '7 రోజుల అంచనా (₹/కిలో)',
    viewChart: lang === 'en' ? 'Open Full Chart' : 'పూర్తి చార్ట్ చూడండి',
    watchAlerts: lang === 'en' ? 'Manage Price Alerts' : 'ధర హెచ్చరికలు',
    loadingText: lang === 'en' ? 'Updating ML forecast...' : 'అంచనా అప్‌డేట్ అవుతోంది...',
  };

  // Build SVG trend chart points cleanly
  const actualSlice = trendTimeframe === '30' ? data.history30.slice(-14) : data.history30.slice(-10);
  const forecastSlice = data.forecast7;
  const combinedSeries = [
    ...actualSlice.map((val, i) => ({ label: `-${actualSlice.length - i}d`, val, isForecast: false })),
    ...forecastSlice.map((val, i) => ({ label: `+${i + 1}d`, val, isForecast: true })),
  ];
  const minChart = Math.max(0, Math.floor(Math.min(...combinedSeries.map((p) => p.val)) * 0.85));
  const maxChart = Math.ceil(Math.max(...combinedSeries.map((p) => p.val)) * 1.12);
  const spanChart = Math.max(1, maxChart - minChart);
  const svgW = 680;
  const svgH = 200;
  const padL = 44;
  const padR = 16;
  const padT = 18;
  const padB = 28;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const toX = (i: number) => padL + (i / Math.max(1, combinedSeries.length - 1)) * plotW;
  const toY = (v: number) => padT + plotH - ((v - minChart) / spanChart) * plotH;

  const actualCount = actualSlice.length;
  const actualPath = combinedSeries
    .slice(0, actualCount)
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(pt.val).toFixed(1)}`)
    .join(' ');
  const forecastPath = combinedSeries
    .slice(actualCount - 1)
    .map((pt, idx) => {
      const i = actualCount - 1 + idx;
      return `${idx === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(pt.val).toFixed(1)}`;
    })
    .join(' ');
  const splitX = toX(actualCount - 1);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner + Bilingual EN / TE Toggle */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span>{t.badge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {t.welcome}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t.purpose}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            role="group"
            aria-label="Language switch"
            className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700"
          >
            <Globe className="w-4 h-4 text-emerald-600 ml-1.5" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                lang === 'en'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang('te')}
              aria-pressed={lang === 'te'}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                lang === 'te'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              తెలుగు
            </button>
          </div>
        </div>
      </div>

      {/* Crop, Market & Offline/Live Provenance Context Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label
              htmlFor="farmer-crop-select"
              className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1"
            >
              {t.cropLabel}
            </label>
            <select
              id="farmer-crop-select"
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value as CropName)}
              className="w-full text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="Tomato">Tomato — టొమాటో</option>
              <option value="Onion">Onion — ఉల్లిపాయ</option>
              <option value="Potato">Potato — బంగాళాదుంప</option>
              <option value="Rice">Rice — బియ్యం</option>
              <option value="Toor Dal">Toor Dal — కందిపప్పు</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="farmer-market-select"
              className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1"
            >
              {t.marketLabel}
            </label>
            <select
              id="farmer-market-select"
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value as MarketName)}
              className="w-full text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="Guntur">Guntur APMC — గుంటూరు</option>
              <option value="Vijayawada">Vijayawada — విజయవాడ</option>
              <option value="Bhimavaram">Bhimavaram — భీమవరం</option>
              <option value="Rajahmundry">Rajahmundry — రాజమండ్రి</option>
              <option value="Visakhapatnam">Visakhapatnam — విశాఖపట్నం</option>
              <option value="Tirupati">Tirupati — తిరుపతి</option>
              <option value="Kurnool">Kurnool — కర్నూలు</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-1 flex items-end">
            <div className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between gap-2">
              <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                {t.datasetMode}:
              </span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  isLiveData ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                {isLiveData ? t.liveLabel : t.sampleLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Workspace Section Tabs */}
      <div
        role="tablist"
        aria-label="Farmer tools"
        className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto no-scrollbar"
      >
        {[
          { id: 'home', label: t.sections.home, icon: Sprout },
          { id: 'sell_advice', label: t.sections.sell_advice, icon: CheckCircle2 },
          { id: 'best_market', label: t.sections.best_market, icon: MapPin },
          { id: 'price_trend', label: t.sections.price_trend, icon: BarChart2 },
          { id: 'weather_alerts', label: t.sections.weather_alerts, icon: CloudRain },
          { id: 'profit_calc', label: t.sections.profit_calc, icon: Calculator },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveSection(tab.id as typeof activeSection)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION A: FARMER OVERVIEW */}
      {activeSection === 'home' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  {lang === 'en' ? 'Daily Market Summary' : 'రోజువారీ మార్కెట్ సారాంశం'}
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                  {lang === 'en' ? `${selectedCrop} — ${selectedMarket} Mandi` : `${data.cropTe} — ${selectedMarket} మార్కెట్`}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{modelName} ({modelVersion})</span>
                </span>
                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-800">
                  {lang === 'en' ? `Risk: ${riskLevel}` : `రిస్క్: ${riskLevel}`}
                </span>
              </div>
            </div>

            {loadingPrediction && (
              <div aria-live="polite" className="text-xs text-slate-500 dark:text-slate-400">
                {t.loadingText}
              </div>
            )}

            {/* 4 Key KPI Numbers */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase block">
                  {t.todayPrice}
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100">
                  ₹{currentModalPrice}
                  <span className="text-xs font-medium text-slate-500">/{lang === 'en' ? 'kg' : 'కిలో'}</span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {lang === 'en'
                    ? `Range ₹${data.todayMin}–₹${data.todayMax}/kg`
                    : `ధర పరిధి ₹${data.todayMin}–₹${data.todayMax}`}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase block">
                  {t.tomorrowPrice}
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400">
                  ₹{tomorrowPrice}
                  <span className="text-xs font-medium text-slate-500">/{lang === 'en' ? 'kg' : 'కిలో'}</span>
                </div>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold block tabular-nums">
                  {lang === 'en'
                    ? `95% CI: ₹${confidenceInterval[0]}–₹${confidenceInterval[1]}`
                    : `అంచనా పరిధి: ₹${confidenceInterval[0]}–₹${confidenceInterval[1]}`}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase block">
                  {t.next7Avg}
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold tabular-nums text-slate-900 dark:text-slate-100">
                  ₹{next7DayAvg}
                  <span className="text-xs font-medium text-slate-500">/{lang === 'en' ? 'kg' : 'కిలో'}</span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {lang === 'en' ? 'Weekly mean projection' : 'వారపు సగటు అంచనా'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase block">
                  {t.expectedChange}
                </span>
                <div
                  className={`text-2xl sm:text-3xl font-extrabold tabular-nums flex items-center gap-1 ${
                    expectedChangePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {expectedChangePct >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  <span>
                    {expectedChangePct >= 0 ? '+' : ''}
                    {expectedChangePct}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {lang === 'en' ? '7-day price momentum' : '7 రోజుల ధర వేగం'}
                </span>
              </div>
            </div>

            {/* Primary Sell / Wait Action Card */}
            <div
              className={`p-5 rounded-2xl border space-y-2 ${
                adviceLevel === 'wait_store'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                  : adviceLevel === 'wait_moderate'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100'
                  : 'bg-sky-50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800 text-sky-950 dark:text-sky-100'
              }`}
            >
              <div className="font-bold text-sm sm:text-base flex items-center gap-2">
                {adviceLevel === 'wait_store' ? (
                  <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : adviceLevel === 'wait_moderate' ? (
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0" />
                )}
                <span>{adviceTitle}</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed opacity-90">{adviceReason}</p>
            </div>

            {/* Best Nearby Mandi + Quick Profit Estimator Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">{t.bestNearby}</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {bestNearbyMarket} —{' '}
                      <span className="text-emerald-700 dark:text-emerald-400 tabular-nums">₹{bestNearbyPrice}/kg</span>
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {lang === 'en'
                        ? `+₹${bestNearbyDiff}/kg higher than ${selectedMarket}`
                        : `${selectedMarket} కంటే కిలోకి ₹${bestNearbyDiff} ఎక్కువ`}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('best_market')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <span>{t.compareBtn}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">
                      {lang === 'en' ? 'Estimated Harvest Profit' : 'అంచనా నికర లాభం'}
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      ₹{estimatedNetProfit.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-500">
                        ({harvestQtyQtl} qtl)
                      </span>
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {lang === 'en'
                        ? `Break-even: ₹${breakEvenPriceKg.toFixed(1)}/kg`
                        : `నష్టం లేని ధర: ₹${breakEvenPriceKg.toFixed(1)}/కిలో`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveSection('profit_calc')}
                    className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors whitespace-nowrap"
                  >
                    {t.calcBtn}
                  </button>
                  {onNavigateToMarkets && (
                    <button
                      type="button"
                      onClick={onNavigateToMarkets}
                      aria-label={t.watchAlerts}
                      title={t.watchAlerts}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Clean Responsive SVG Chart Preview */}
            <div className="pt-1 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'en'
                    ? `${selectedCrop} Price Curve (Past 14 Days + 7-Day Forecast)`
                    : `${data.cropTe} ధర రేఖాచిత్రం (గత 14 రోజులు + 7 రోజుల అంచనా)`}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSection('price_trend')}
                  className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                >
                  <span>{t.viewChart}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                <svg
                  viewBox={`0 0 ${svgW} ${svgH}`}
                  className="w-full h-44"
                  role="img"
                  aria-label={`${selectedCrop} historical and 7-day forecast price chart`}
                >
                  {[0, 0.5, 1].map((frac, idx) => {
                    const y = padT + plotH * (1 - frac);
                    const val = Math.round(minChart + spanChart * frac);
                    return (
                      <g key={idx}>
                        <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeDasharray="3 3" />
                        <text x={padL - 6} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px] font-mono">
                          ₹{val}
                        </text>
                      </g>
                    );
                  })}
                  <line x1={splitX} y1={padT} x2={splitX} y2={svgH - padB} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="1.5" />
                  <path d={actualPath} fill="none" stroke="#475569" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                  <path d={forecastPath} fill="none" stroke="#059669" strokeWidth="2.75" strokeDasharray="5 3" strokeLinejoin="round" strokeLinecap="round" />
                  {combinedSeries.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={toX(idx)}
                      cy={toY(pt.val)}
                      r={pt.isForecast ? 3.5 : 2.5}
                      className={pt.isForecast ? 'fill-emerald-600' : 'fill-slate-600 dark:fill-slate-300'}
                    >
                      <title>{`${pt.label}: ₹${pt.val}/kg`}</title>
                    </circle>
                  ))}
                  <text x={padL} y={svgH - 8} className="fill-slate-500 text-[10px]">
                    {combinedSeries[0]?.label}
                  </text>
                  <text x={splitX} y={svgH - 8} textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[10px] font-bold">
                    {lang === 'en' ? 'Today' : 'నేడు'}
                  </text>
                  <text x={svgW - padR} y={svgH - 8} textAnchor="end" className="fill-emerald-600 text-[10px] font-bold">
                    +7d
                  </text>
                </svg>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-1 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-slate-600 inline-block" /> {t.actualSeries}
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <span className="w-3 h-0.5 bg-emerald-600 inline-block border-b border-dashed" /> {t.forecastSeries}
                    </span>
                  </div>
                  <span className="tabular-nums">
                    {lang === 'en' ? `Source: AGMARKNET (${selectedMarket})` : `మూలం: అగ్మార్క్‌నెట్ (${selectedMarket})`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: SELL OR HOLD DECISION */}
      {activeSection === 'sell_advice' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              {lang === 'en' ? 'Sell Timing Guidance' : 'అమ్మకం సమయ మార్గదర్శనం'}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              {lang === 'en' ? 'Should You Sell Today or Wait?' : 'ఈరోజు అమ్మాలా లేక ఆగాలా?'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'en'
                ? 'Guidance weighs arrival volumes, 7-day price momentum, and perishable crop shelf-life.'
                : 'మార్కెట్ రాక పరిమాణం, 7 రోజుల ధర వేగం మరియు పంట నిల్వ సామర్థ్యం ఆధారంగా సలహా.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`p-4 rounded-xl border transition-all ${
                adviceLevel === 'sell_now'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/40'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-65'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{lang === 'en' ? 'Sell Now' : 'ఇప్పుడే అమ్మండి'}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                {lang === 'en'
                  ? 'Supply arrivals are surging and prices are likely to soften in the coming days.'
                  : 'మార్కెట్లోకి సరుకు రాక ఎక్కువగా ఉంది; ధరలు తగ్గే అవకాశం ఉంది.'}
              </p>
              {adviceLevel === 'sell_now' && (
                <span className="inline-block mt-2.5 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded">
                  {lang === 'en' ? 'RECOMMENDED' : 'సిఫార్సు'}
                </span>
              )}
            </div>

            <div
              className={`p-4 rounded-xl border transition-all ${
                adviceLevel === 'wait_moderate'
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 ring-2 ring-amber-500/40'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-65'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm text-amber-700 dark:text-amber-300">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{lang === 'en' ? 'Wait 2–3 Days' : '2–3 రోజులు ఆగండి'}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                {lang === 'en'
                  ? 'Moderate upward movement expected. Stagger harvest batches to capture higher rates.'
                  : 'ధరలు కొద్దిగా పెరిగే అవకాశం ఉంది. వీలైతే విడతల వారీగా విక్రయించండి.'}
              </p>
              {adviceLevel === 'wait_moderate' && (
                <span className="inline-block mt-2.5 px-2 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded">
                  {lang === 'en' ? 'RECOMMENDED' : 'సిఫార్సు'}
                </span>
              )}
            </div>

            <div
              className={`p-4 rounded-xl border transition-all ${
                adviceLevel === 'wait_store'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/40'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-65'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{lang === 'en' ? 'Store Safely & Hold' : 'నిల్వ చేసి తర్వాత అమ్మండి'}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                {lang === 'en'
                  ? 'Strong upward rally projected. Hold stock only if produce is fresh and dry storage is ready.'
                  : 'ధరలు బలంగా పెరిగే అవకాశం ఉంది. పంట నాణ్యత బాగుంటేనే నిల్వ చేయండి.'}
              </p>
              {adviceLevel === 'wait_store' && (
                <span className="inline-block mt-2.5 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded">
                  {lang === 'en' ? 'RECOMMENDED' : 'సిఫార్సు'}
                </span>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
              {lang === 'en' ? 'Why This Advice?' : 'ఈ సలహాకు కారణం'}
            </span>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{adviceReason}</p>
          </div>
        </div>
      )}

      {/* SECTION C: NEARBY MANDIS COMPARISON */}
      {activeSection === 'best_market' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                {lang === 'en' ? 'Mandi Comparison & Transport' : 'మార్కెట్ పోలిక & రవాణా ఖర్చు'}
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                {lang === 'en' ? 'Best Net Realization Near You' : 'మీకు సమీపంలో ఉత్తమ మార్కెట్'}
              </h2>
            </div>

            <div className="w-full sm:w-64">
              <label
                htmlFor="farmer-district-select"
                className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"
              >
                {t.districtLabel}
              </label>
              <select
                id="farmer-district-select"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value as DistrictName)}
                className="w-full text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
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

          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-start gap-4">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                {lang === 'en' ? 'Recommended Dispatch Mandi' : 'సిఫార్సు చేసిన మార్కెట్'}
              </span>
              <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                {lang === 'en'
                  ? `${bestNearbyMarket} is expected to yield ₹${bestNearbyPrice}/kg (+₹${bestNearbyDiff}/kg above ${selectedMarket}) tomorrow.`
                  : `రేపు ${selectedMarket} కంటే ${bestNearbyMarket} మార్కెట్‌లో కిలోకి ₹${bestNearbyDiff} ఎక్కువగా ₹${bestNearbyPrice}/కిలో లభించే అవకాశం ఉంది.`}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {lang === 'en'
                  ? 'Net realization below deducts estimated per-kg road transport cost from tomorrow’s predicted mandi price.'
                  : 'దిగువ పట్టికలో రవాణా ఖర్చు తీసివేసిన తర్వాత మిగిలే నికర ధర చూపబడింది.'}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">{lang === 'en' ? 'Mandi' : 'మార్కెట్'}</th>
                  <th className="py-3 px-3">{lang === 'en' ? 'District' : 'జిల్లా'}</th>
                  <th className="py-3 px-3 text-right">{lang === 'en' ? 'Today' : 'నేడు'}</th>
                  <th className="py-3 px-3 text-right">{lang === 'en' ? 'Tomorrow (Est.)' : 'రేపు (అంచనా)'}</th>
                  <th className="py-3 px-3 text-right">{lang === 'en' ? 'Transport' : 'రవాణా'}</th>
                  <th className="py-3 px-4 text-right">{lang === 'en' ? 'Net Return' : 'నికర ధర'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                {nearbyRows.map((m) => {
                  const isBest = m.market === bestNearbyMarket;
                  return (
                    <tr
                      key={m.market}
                      className={isBest ? 'bg-emerald-50/60 dark:bg-emerald-950/20 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}
                    >
                      <td className="py-3.5 px-4 text-slate-900 dark:text-slate-100 font-bold flex items-center gap-2">
                        <span>{m.market} APMC</span>
                        {isBest && (
                          <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                            {lang === 'en' ? 'BEST' : 'ఉత్తమం'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">{m.district}</td>
                      <td className="py-3.5 px-3 text-right text-slate-700 dark:text-slate-300">₹{m.todayPrice}/kg</td>
                      <td className="py-3.5 px-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">
                        ₹{m.tomorrowPrice}/kg
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-500">
                        {m.distanceKm} km (₹{m.transportCostKg}/kg)
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-slate-100">
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

      {/* SECTION D: PRICE TREND */}
      {activeSection === 'price_trend' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                {lang === 'en' ? 'Historical & 7-Day Trend' : 'గత మరియు 7 రోజుల ధర ట్రెండ్'}
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                {lang === 'en'
                  ? `${selectedCrop} Price Trend in ${selectedMarket}`
                  : `${selectedMarket} లో ${data.cropTe} ధరల కదలిక`}
              </h2>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
              {(['30', '90', '365'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTrendTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    trendTimeframe === tf
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {lang === 'en' ? `${tf} Days` : `${tf} రోజులు`}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-56"
              role="img"
              aria-label="Detailed farmer historical and forecast chart"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
                const y = padT + plotH * (1 - frac);
                const val = Math.round(minChart + spanChart * frac);
                return (
                  <g key={idx}>
                    <line x1={padL} y1={y} x2={svgW - padR} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeDasharray="3 3" />
                    <text x={padL - 6} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px] font-mono">
                      ₹{val}
                    </text>
                  </g>
                );
              })}
              <line x1={splitX} y1={padT} x2={splitX} y2={svgH - padB} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="1.5" />
              <path d={actualPath} fill="none" stroke="#334155" strokeWidth="2.5" strokeLinejoin="round" />
              <path d={forecastPath} fill="none" stroke="#059669" strokeWidth="3" strokeDasharray="5 3" strokeLinejoin="round" />
              {combinedSeries.map((pt, idx) => (
                <circle
                  key={idx}
                  cx={toX(idx)}
                  cy={toY(pt.val)}
                  r={pt.isForecast ? 4 : 3}
                  className={pt.isForecast ? 'fill-emerald-600' : 'fill-slate-700 dark:fill-slate-200'}
                >
                  <title>{`${pt.label}: ₹${pt.val}/kg`}</title>
                </circle>
              ))}
            </svg>
            <div className="flex justify-between text-[11px] tabular-nums text-slate-500 border-t border-slate-200 dark:border-slate-700 pt-2">
              <span>{t.actualSeries}</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {lang === 'en' ? `Today: ₹${currentModalPrice}/kg` : `నేడు: ₹${currentModalPrice}/కిలో`}
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {lang === 'en' ? `7D Mean: ₹${next7DayAvg}/kg` : `7 రోజుల సగటు: ₹${next7DayAvg}/కిలో`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                {lang === 'en' ? 'Seasonal High Month' : 'అత్యధిక ధర నెల'}
              </span>
              <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {lang === 'en' ? data.highMonthEn : data.highMonthTe} — ₹{data.highPrice}/kg
              </div>
            </div>
            <div className="p-4 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800 space-y-1">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
                {lang === 'en' ? 'Seasonal Low Month' : 'తక్కువ ధర నెల'}
              </span>
              <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {lang === 'en' ? data.lowMonthEn : data.lowMonthTe} — ₹{data.lowPrice}/kg
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {lang === 'en' ? '12-Month Seasonal Benchmark (₹/kg)' : '12 నెలల సగటు ధరలు (₹/కిలో)'}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2 text-center text-xs tabular-nums">
              {data.history365Monthly.map((m) => (
                <div
                  key={m.month}
                  className={`p-2.5 rounded-xl border ${
                    m.avg === data.highPrice
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 font-bold'
                      : m.avg === data.lowPrice
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="text-slate-500 block text-[10px] uppercase">{m.month}</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">₹{m.avg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION E: WEATHER & PRICE ALERTS */}
      {activeSection === 'weather_alerts' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              {lang === 'en' ? 'Weather & Market Alerts' : 'వాతావరణం & ధర హెచ్చరికలు'}
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              {lang === 'en'
                ? `Harvest Weather & Price Alerts (${selectedMarket})`
                : `${selectedMarket} వాతావరణ & మార్కెట్ సూచనలు`}
            </h2>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Sun className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">
                  {lang === 'en' ? `Local Conditions (${selectedMarket})` : `ప్రస్తుత వాతావరణం (${selectedMarket})`}
                </span>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                  {data.weather.tempC}°C · {lang === 'en' ? data.weather.conditionEn : data.weather.conditionTe}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs tabular-nums text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-sky-600" />
                <span>
                  {lang === 'en' ? 'Humidity' : 'తేమ'}: {data.weather.humidityPct}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-slate-500" />
                <span>{lang === 'en' ? 'Wind: 14 km/h' : 'గాలి: 14 కిమీ/గం'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-1.5">
              <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold text-xs uppercase">
                <CloudRain className="w-4 h-4 text-sky-600" />
                <span>{lang === 'en' ? 'Rainfall Advisory' : 'వర్షపాత హెచ్చరిక'}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {lang === 'en' ? data.weather.rainfallAlertEn : data.weather.rainfallAlertTe}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase">
                <Thermometer className="w-4 h-4 text-amber-600" />
                <span>{lang === 'en' ? 'Storage Temperature Note' : 'నిల్వ ఉష్ణోగ్రత సూచన'}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {lang === 'en' ? data.weather.tempAlertEn : data.weather.tempAlertTe}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'en' ? 'Price Outlook' : 'ధర అంచనా'}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {lang === 'en'
                  ? `${selectedCrop} in ${selectedMarket} shows ${expectedChangePct >= 0 ? `+${expectedChangePct}%` : `${expectedChangePct}%`} 7-day movement.`
                  : `${selectedMarket}లో ${data.cropTe} ధర 7 రోజుల్లో ${expectedChangePct >= 0 ? `+${expectedChangePct}%` : `${expectedChangePct}%`} మారే సూచన ఉంది.`}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-1.5">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs uppercase">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>{lang === 'en' ? 'Daily Arrival Watch' : 'మార్కెట్ రాక గమనిక'}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {lang === 'en'
                  ? `Daily arrivals around ${data.arrivalTonnes.toLocaleString()} tonnes. If inflows surge above 2,000 tonnes, spot prices can soften 3–5%.`
                  : `ప్రస్తుత రాక సుమారు ${data.arrivalTonnes.toLocaleString()} టన్నులు. రాక 2,000 టన్నులు దాటితే ధరలు 3–5% తగ్గే అవకాశం ఉంది.`}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-xs">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                {lang === 'en' ? 'Best Auction Window' : 'ఉత్తమ వేలం రోజులు'}
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                {lang === 'en'
                  ? `Thursday and Friday morning sessions typically see active wholesale buyer competition in ${selectedMarket}.`
                  : `${selectedMarket} మార్కెట్‌లో గురువారం మరియు శుక్రవారం ఉదయం వేళల్లో కొనుగోలుదారుల పోటీ ఎక్కువగా ఉంటుంది.`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION F: INTEGRATED CULTIVATION COST & ESTIMATED PROFIT CALCULATOR */}
      {activeSection === 'profit_calc' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                {lang === 'en' ? 'Cultivation Cost & Profit Estimator' : 'సాగు ఖర్చు & నికర లాభ లెక్క'}
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                {lang === 'en'
                  ? `Net Profit Calculator (${selectedCrop} · ${selectedMarket})`
                  : `${data.cropTe} సాగు ఖర్చు మరియు లాభ అంచనా (${selectedMarket})`}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              {(
                [
                  { id: 'today', label: lang === 'en' ? `Today (₹${currentModalPrice})` : `నేడు (₹${currentModalPrice})` },
                  { id: 'tomorrow', label: lang === 'en' ? `Tomorrow (₹${tomorrowPrice})` : `రేపు (₹${tomorrowPrice})` },
                  { id: 'week7', label: lang === 'en' ? `7D Avg (₹${next7DayAvg})` : `7రో సగటు (₹${next7DayAvg})` },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSellingPriceBasis(opt.id)}
                  className={`px-3 py-1.5 rounded-lg transition-colors tabular-nums ${
                    sellingPriceBasis === opt.id
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Inputs Column */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="calc-harvest-qty"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  {lang === 'en' ? 'Expected Harvest Volume (Quintals, 1 qtl = 100 kg)' : 'ఆశించే దిగుబడి (క్వింటాళ్లు, 1 క్వింటాల్ = 100 కిలోలు)'}
                </label>
                <input
                  id="calc-harvest-qty"
                  type="number"
                  min={1}
                  max={1000}
                  value={harvestQtyQtl}
                  onChange={(e) => setHarvestQtyQtl(Math.max(0, Number(e.target.value)))}
                  className="w-full text-sm font-bold tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="calc-seed-cost"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  {lang === 'en' ? 'Seeds / Nursery Cost (₹)' : 'విత్తనాలు / నారు ఖర్చు (₹)'}
                </label>
                <input
                  id="calc-seed-cost"
                  type="number"
                  min={0}
                  value={seedCost}
                  onChange={(e) => setSeedCost(Math.max(0, Number(e.target.value)))}
                  className="w-full text-sm font-bold tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="calc-fert-cost"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  {lang === 'en' ? 'Fertilizers & Crop Care (₹)' : 'ఎరువులు & సస్యరక్షణ (₹)'}
                </label>
                <input
                  id="calc-fert-cost"
                  type="number"
                  min={0}
                  value={fertilizerCost}
                  onChange={(e) => setFertilizerCost(Math.max(0, Number(e.target.value)))}
                  className="w-full text-sm font-bold tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="calc-labor-cost"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  {lang === 'en' ? 'Harvesting & Farm Labor (₹)' : 'కూలీ & కోత ఖర్చు (₹)'}
                </label>
                <input
                  id="calc-labor-cost"
                  type="number"
                  min={0}
                  value={laborCost}
                  onChange={(e) => setLaborCost(Math.max(0, Number(e.target.value)))}
                  className="w-full text-sm font-bold tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="calc-transport-cost"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  {lang === 'en' ? 'Mandi Transport & Bags (₹)' : 'రవాణా & బస్తాల ఖర్చు (₹)'}
                </label>
                <input
                  id="calc-transport-cost"
                  type="number"
                  min={0}
                  value={transportCost}
                  onChange={(e) => setTransportCost(Math.max(0, Number(e.target.value)))}
                  className="w-full text-sm font-bold tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Summary Column */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                {lang === 'en' ? 'Estimated Financial Summary' : 'అంచనా ఆదాయ & లాభ సారాంశం'}
              </span>

              <div className="space-y-2.5 text-xs sm:text-sm tabular-nums">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">
                    {lang === 'en' ? 'Total Cultivation Expense' : 'మొత్తం సాగు ఖర్చు'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    ₹{totalCultivationCost.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">
                    {lang === 'en'
                      ? `Expected Revenue (${harvestQtyQtl * 100} kg × ₹${activeSellRateKg})`
                      : `అంచనా రాబడి (${harvestQtyQtl * 100} కిలోలు × ₹${activeSellRateKg})`}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    ₹{expectedGrossRevenue.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">
                    {lang === 'en' ? 'Break-Even Selling Price' : 'నష్టం లేని కనీస ధర'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    ₹{breakEvenPriceKg.toFixed(2)}/kg
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">
                    {lang === 'en' ? 'Estimated Net Profit' : 'అంచనా నికర లాభం'}
                  </span>
                  <div className="text-right">
                    <span
                      className={`text-2xl font-extrabold block ${
                        estimatedNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {estimatedNetProfit >= 0 ? '+' : ''}₹{estimatedNetProfit.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {lang === 'en' ? `Return on Cost: ${roiPct.toFixed(1)}%` : `రాబడి శాతం: ${roiPct.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
