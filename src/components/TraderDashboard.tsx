/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  Calculator,
  ShieldAlert,
  Truck,
  Layers,
  Bell,
  Scale,
  AlertTriangle,
  ArrowRight,
  Star,
  Cpu,
  Clock,
  CheckCircle2,
  Database,
} from 'lucide-react';
import {
  predictionApi,
  TraderRecommendationResponse,
} from '../services/predictionApi';

interface TraderDashboardProps {
  onNavigateToAnalytics?: () => void;
  onNavigateToWatchlist?: () => void;
}

export type Commodity = 'Onion' | 'Tomato' | 'Potato' | 'Rice' | 'Toor Dal' | 'Cotton' | 'Chilli';
export type APCCMarket =
  | 'Kurnool'
  | 'Vijayawada'
  | 'Guntur'
  | 'Visakhapatnam'
  | 'Rajahmundry'
  | 'Tirupati'
  | 'Anantapur'
  | 'Nellore'
  | 'Madanapalle';

interface MarketDataPoint {
  market: APCCMarket;
  district: string;
  currentPriceQtl: number;
  predicted7DayQtl: number;
  predicted30DayQtl: number;
  arrivalTonnes: number;
  trendPct: number;
  volatility: 'Low' | 'Medium' | 'High';
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidencePct: number;
  reason: string;
}

const TRADER_COMMODITY_DATA: Record<Commodity, MarketDataPoint[]> = {
  Onion: [
    { market: 'Kurnool', district: 'Kurnool', currentPriceQtl: 2400, predicted7DayQtl: 2750, predicted30DayQtl: 2920, arrivalTonnes: 1200, trendPct: 14.6, volatility: 'Medium', signal: 'BUY', confidencePct: 91, reason: 'Kharif harvesting in Kurnool nearing completion; arrivals tightening next week.' },
    { market: 'Vijayawada', district: 'NTR', currentPriceQtl: 2600, predicted7DayQtl: 3050, predicted30DayQtl: 3150, arrivalTonnes: 2150, trendPct: 17.3, volatility: 'Low', signal: 'BUY', confidencePct: 94, reason: 'Sustained wholesale and retail distribution demand across coastal Andhra.' },
    { market: 'Guntur', district: 'Guntur', currentPriceQtl: 2500, predicted7DayQtl: 2820, predicted30DayQtl: 2980, arrivalTonnes: 1400, trendPct: 12.8, volatility: 'Medium', signal: 'BUY', confidencePct: 89, reason: 'Inter-district procurement from Rayalaseema creating steady upward bid support.' },
    { market: 'Rajahmundry', district: 'East Godavari', currentPriceQtl: 2650, predicted7DayQtl: 2900, predicted30DayQtl: 3020, arrivalTonnes: 850, trendPct: 9.4, volatility: 'Low', signal: 'HOLD', confidencePct: 86, reason: 'Moderate price equilibrium with steady daily consumer arrivals.' },
    { market: 'Anantapur', district: 'Anantapur', currentPriceQtl: 2250, predicted7DayQtl: 2100, predicted30DayQtl: 2050, arrivalTonnes: 3200, trendPct: -6.7, volatility: 'High', signal: 'SELL', confidencePct: 88, reason: 'High arrival volume; secondary grade consignments causing price softening.' },
  ],
  Tomato: [
    { market: 'Madanapalle', district: 'Annamayya', currentPriceQtl: 3200, predicted7DayQtl: 3850, predicted30DayQtl: 3600, arrivalTonnes: 4200, trendPct: 20.3, volatility: 'High', signal: 'BUY', confidencePct: 93, reason: 'Strong inter-state procurement demand across southern corridors.' },
    { market: 'Guntur', district: 'Guntur', currentPriceQtl: 3600, predicted7DayQtl: 4100, predicted30DayQtl: 3900, arrivalTonnes: 1900, trendPct: 13.9, volatility: 'Medium', signal: 'BUY', confidencePct: 90, reason: 'Local arrivals down 18% due to warm dry field conditions.' },
    { market: 'Vijayawada', district: 'NTR', currentPriceQtl: 3800, predicted7DayQtl: 4250, predicted30DayQtl: 4000, arrivalTonnes: 2800, trendPct: 11.8, volatility: 'Medium', signal: 'BUY', confidencePct: 92, reason: 'Active regional retail and banquet demand sustaining firm bids.' },
    { market: 'Visakhapatnam', district: 'Visakhapatnam', currentPriceQtl: 4200, predicted7DayQtl: 4300, predicted30DayQtl: 4100, arrivalTonnes: 950, trendPct: 2.4, volatility: 'Low', signal: 'HOLD', confidencePct: 85, reason: 'Prices near seasonal resistance; limited short-term spread room.' },
  ],
  Potato: [
    { market: 'Rajahmundry', district: 'East Godavari', currentPriceQtl: 2100, predicted7DayQtl: 2350, predicted30DayQtl: 2450, arrivalTonnes: 980, trendPct: 11.9, volatility: 'Low', signal: 'BUY', confidencePct: 92, reason: 'Cold chain dispatch delays along eastern corridor.' },
    { market: 'Guntur', district: 'Guntur', currentPriceQtl: 2150, predicted7DayQtl: 2380, predicted30DayQtl: 2480, arrivalTonnes: 1120, trendPct: 10.7, volatility: 'Medium', signal: 'BUY', confidencePct: 90, reason: 'Steady wholesale intake with firm northern dispatch quotes.' },
    { market: 'Vijayawada', district: 'NTR', currentPriceQtl: 2200, predicted7DayQtl: 2400, predicted30DayQtl: 2500, arrivalTonnes: 1450, trendPct: 9.1, volatility: 'Low', signal: 'HOLD', confidencePct: 88, reason: 'Balanced supply-demand throughput across urban buyers.' },
  ],
  Rice: [
    { market: 'Vijayawada', district: 'NTR', currentPriceQtl: 4100, predicted7DayQtl: 4250, predicted30DayQtl: 4350, arrivalTonnes: 5400, trendPct: 3.7, volatility: 'Low', signal: 'HOLD', confidencePct: 95, reason: 'Government MSP support and buffer procurement maintain tight band.' },
    { market: 'Rajahmundry', district: 'East Godavari', currentPriceQtl: 4050, predicted7DayQtl: 4200, predicted30DayQtl: 4300, arrivalTonnes: 6100, trendPct: 3.7, volatility: 'Low', signal: 'HOLD', confidencePct: 94, reason: 'Godavari delta paddy arrivals stabilizing mill realization.' },
    { market: 'Guntur', district: 'Guntur', currentPriceQtl: 4150, predicted7DayQtl: 4300, predicted30DayQtl: 4400, arrivalTonnes: 4800, trendPct: 3.6, volatility: 'Low', signal: 'HOLD', confidencePct: 93, reason: 'Consistent institutional tender procurements.' },
  ],
  'Toor Dal': [
    { market: 'Kurnool', district: 'Kurnool', currentPriceQtl: 10000, predicted7DayQtl: 10800, predicted30DayQtl: 11300, arrivalTonnes: 890, trendPct: 8.0, volatility: 'Medium', signal: 'BUY', confidencePct: 91, reason: 'Mill restocking ahead of festival season with tight spot arrivals.' },
    { market: 'Guntur', district: 'Guntur', currentPriceQtl: 10200, predicted7DayQtl: 11000, predicted30DayQtl: 11500, arrivalTonnes: 620, trendPct: 7.8, volatility: 'High', signal: 'BUY', confidencePct: 89, reason: 'Dal mills actively bidding on A-grade pulses.' },
    { market: 'Vijayawada', district: 'NTR', currentPriceQtl: 10400, predicted7DayQtl: 11150, predicted30DayQtl: 11600, arrivalTonnes: 510, trendPct: 7.2, volatility: 'Medium', signal: 'BUY', confidencePct: 90, reason: 'Low arrivals driving distributor re-order frequency.' },
  ],
  Cotton: [
    { market: 'Kurnool', district: 'Kurnool', currentPriceQtl: 6950, predicted7DayQtl: 7350, predicted30DayQtl: 7600, arrivalTonnes: 3100, trendPct: 5.8, volatility: 'High', signal: 'BUY', confidencePct: 87, reason: 'Ginners increasing intake ahead of textile export schedules.' },
    { market: 'Guntur', district: 'Guntur', currentPriceQtl: 7100, predicted7DayQtl: 7500, predicted30DayQtl: 7750, arrivalTonnes: 2300, trendPct: 5.6, volatility: 'Medium', signal: 'BUY', confidencePct: 89, reason: 'Spinning mills competing for long-staple bales.' },
  ],
  Chilli: [
    { market: 'Guntur', district: 'Guntur', currentPriceQtl: 18500, predicted7DayQtl: 20200, predicted30DayQtl: 21500, arrivalTonnes: 1100, trendPct: 9.2, volatility: 'High', signal: 'BUY', confidencePct: 92, reason: 'Active export bidding on Teja & 334 chilli grades.' },
    { market: 'Kurnool', district: 'Kurnool', currentPriceQtl: 17900, predicted7DayQtl: 19400, predicted30DayQtl: 20600, arrivalTonnes: 1400, trendPct: 8.4, volatility: 'Medium', signal: 'BUY', confidencePct: 90, reason: 'Oleoresin processors sourcing bulk raw stock.' },
  ],
};

export const TraderDashboard: React.FC<TraderDashboardProps> = ({
  onNavigateToAnalytics,
  onNavigateToWatchlist,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'comparison' | 'planner' | 'recommendations' | 'calculator' | 'alerts'>('home');
  const [selectedCommodity, setSelectedCommodity] = useState<Commodity>('Onion');
  const [watchlist, setWatchlist] = useState<Commodity[]>(['Onion', 'Tomato', 'Toor Dal']);

  // Procurement Planner Inputs
  const [plannerPurMarket, setPlannerPurMarket] = useState<APCCMarket>('Kurnool');
  const [plannerSellMarket, setPlannerSellMarket] = useState<APCCMarket>('Vijayawada');
  const [plannerPurDate, setPlannerPurDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [plannerSellDate, setPlannerSellDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [plannerQtyQtl, setPlannerQtyQtl] = useState<number>(200);
  const [plannerTransportHandlingQtl, setPlannerTransportHandlingQtl] = useState<number>(85);

  // Profit Calculator Inputs
  const [calcCommodity, setCalcCommodity] = useState<Commodity>('Tomato');
  const [calcPurMarket, setCalcPurMarket] = useState<APCCMarket>('Madanapalle');
  const [calcSellMarket, setCalcSellMarket] = useState<APCCMarket>('Vijayawada');
  const [calcQtyQtl, setCalcQtyQtl] = useState<number>(250);
  const [calcPurDate, setCalcPurDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [calcSellDate, setCalcSellDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [calcTransportCostQtl, setCalcTransportCostQtl] = useState<number>(110);
  const [calcLoadingUnloadingQtl, setCalcLoadingUnloadingQtl] = useState<number>(25);
  const [calcWastagePct, setCalcWastagePct] = useState<number>(2.5);

  const [traderRec, setTraderRec] = useState<TraderRecommendationResponse | null>(null);

  useEffect(() => {
    let isMounted = true;
    predictionApi
      .getTraderRecommendation(selectedCommodity, plannerPurMarket, plannerSellMarket)
      .then((res) => {
        if (isMounted) setTraderRec(res);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [selectedCommodity, plannerPurMarket, plannerSellMarket]);

  const currentMarkets = TRADER_COMMODITY_DATA[selectedCommodity] || TRADER_COMMODITY_DATA['Onion'];
  const rankedByBuyPrice = [...currentMarkets].sort((a, b) => a.currentPriceQtl - b.currentPriceQtl);
  const rankedBySellPrice = [...currentMarkets].sort((a, b) => b.predicted7DayQtl - a.predicted7DayQtl);
  const cheapestBuy = rankedByBuyPrice[0];
  const highestSell = rankedBySellPrice[0];
  const maxArbitrageSpread = highestSell.predicted7DayQtl - cheapestBuy.currentPriceQtl;

  // Planner calculations
  const purPoint = currentMarkets.find((m) => m.market === plannerPurMarket) || currentMarkets[0];
  const sellPoint = currentMarkets.find((m) => m.market === plannerSellMarket) || currentMarkets[1] || currentMarkets[0];
  const plannerPurCost = purPoint.currentPriceQtl * plannerQtyQtl;
  const plannerRevenue = sellPoint.predicted7DayQtl * plannerQtyQtl;
  const plannerTransportTotal = plannerTransportHandlingQtl * plannerQtyQtl;
  const plannerGrossProfit = plannerRevenue - plannerPurCost - plannerTransportTotal;
  const plannerMarginPct = plannerPurCost > 0 ? (plannerGrossProfit / plannerPurCost) * 100 : 0;
  const plannerRisk: 'Low' | 'Medium' | 'High' =
    plannerMarginPct > 15 ? 'Low' : plannerMarginPct > 7 ? 'Medium' : 'High';

  // Profit calculator calculations
  const calcDataList = TRADER_COMMODITY_DATA[calcCommodity] || TRADER_COMMODITY_DATA['Tomato'];
  const calcPurPoint = calcDataList.find((m) => m.market === calcPurMarket) || calcDataList[0];
  const calcSellPoint = calcDataList.find((m) => m.market === calcSellMarket) || calcDataList[1] || calcDataList[0];
  const calcBasePurchaseCost = calcPurPoint.currentPriceQtl * calcQtyQtl;
  const calcTotalTransport = calcTransportCostQtl * calcQtyQtl;
  const calcTotalLoading = calcLoadingUnloadingQtl * calcQtyQtl;
  const calcTotalProcurementCost = calcBasePurchaseCost + calcTotalTransport + calcTotalLoading;
  const calcSaleableQtyQtl = calcQtyQtl * (1 - calcWastagePct / 100);
  const calcExpectedRevenue = calcSaleableQtyQtl * calcSellPoint.predicted7DayQtl;
  const calcNetProfit = calcExpectedRevenue - calcTotalProcurementCost;
  const calcProfitMargin = calcTotalProcurementCost > 0 ? (calcNetProfit / calcTotalProcurementCost) * 100 : 0;
  const calcBreakEvenPriceQtl = calcSaleableQtyQtl > 0 ? calcTotalProcurementCost / calcSaleableQtyQtl : 0;

  const purchaseSharePct = calcTotalProcurementCost > 0 ? (calcBasePurchaseCost / calcTotalProcurementCost) * 100 : 0;
  const logisticsSharePct = calcTotalProcurementCost > 0 ? ((calcTotalTransport + calcTotalLoading) / calcTotalProcurementCost) * 100 : 0;

  const toggleWatchlist = (commodity: Commodity) => {
    setWatchlist((prev) =>
      prev.includes(commodity) ? prev.filter((c) => c !== commodity) : [...prev, commodity]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span>APMC Commercial Trader Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Trader Terminal & Procurement Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Plan mandi sourcing, arbitrage spreads, freight logistics, and break-even profit margins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToWatchlist && (
            <button
              type="button"
              onClick={onNavigateToWatchlist}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saved Watchlist</span>
            </button>
          )}
          {onNavigateToAnalytics && (
            <button
              type="button"
              onClick={onNavigateToAnalytics}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Analytics Lab
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Calculator className="w-4 h-4" />
            <span>Profit Calculator</span>
          </button>
        </div>
      </div>

      {/* Six Section Tabs */}
      <div
        role="tablist"
        aria-label="Trader sections"
        className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto no-scrollbar"
      >
        {[
          { id: 'home', label: 'A. Trader Home', icon: Briefcase },
          { id: 'comparison', label: 'B. Market Comparison', icon: Scale },
          { id: 'planner', label: 'C. Procurement Planner', icon: Layers },
          { id: 'recommendations', label: 'D. Buy/Sell Signals', icon: TrendingUp },
          { id: 'calculator', label: 'E. Profit Calculator', icon: Calculator },
          { id: 'alerts', label: 'F. Alerts & Risk', icon: Bell },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
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

      {/* SECTION A: TRADER HOME */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
            <div className="p-2 bg-amber-600 text-white rounded-xl shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                Priority Commercial Spreads
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Tomato (Madanapalle):</strong> Positive 7D outlook (+20.3%). Spread to Vijayawada ₹1,050/qtl.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>
                    <strong>Onion (Anantapur):</strong> Arrival surge (3,200 T). Softening rate (-6.7% projected).
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Local Python ML Metadata Bar */}
          <div className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-900 dark:text-slate-100">Local Python ML Engine:</span>
              <span className="text-slate-600 dark:text-slate-300 font-mono">
                {traderRec?.prediction?.model_name || 'Random Forest / MLR'} ({traderRec?.prediction?.model_version || 'v1.0.0'})
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold inline-flex items-center gap-1">
                <Database className="w-3 h-3" />
                {traderRec?.is_demonstration_data === false ? 'Live / Uploaded Series' : 'Sample Dataset (Offline Demo)'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 text-[11px] tabular-nums">
              <span>Signal Confidence: {traderRec?.confidence_pct ?? '—'}%</span>
              <span>Backtest MAPE: {traderRec?.model_error_rate_mape ?? '—'}%</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Risk: {traderRec?.prediction?.risk_level || 'MEDIUM'}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Commodity Watchlist & Trade Signals
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Benchmark spot rate, 7-day forecast, and procurement consensus across Andhra Pradesh mandis.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                Tracking {watchlist.length} Starred Commodities
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.keys(TRADER_COMMODITY_DATA) as Commodity[]).map((comm) => {
                const isWatch = watchlist.includes(comm);
                const list = TRADER_COMMODITY_DATA[comm];
                const leadMandi = list[0];
                const avgToday = Math.round(list.reduce((acc, c) => acc + c.currentPriceQtl, 0) / list.length);
                const avgPred7 = Math.round(list.reduce((acc, c) => acc + c.predicted7DayQtl, 0) / list.length);
                const avgPct = Math.round(((avgPred7 - avgToday) / avgToday) * 100);

                return (
                  <div
                    key={comm}
                    className={`p-5 rounded-2xl border transition-all space-y-3 ${
                      isWatch
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900 dark:text-slate-100">{comm}</span>
                        <span className="text-[11px] text-slate-500 font-mono">({list.length} Mandis)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleWatchlist(comm)}
                        aria-label={isWatch ? `Remove ${comm} from watchlist` : `Add ${comm} to watchlist`}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isWatch ? 'text-amber-500 hover:text-amber-600' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${isWatch ? 'fill-amber-500' : ''}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs tabular-nums">
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-0.5">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Today’s Price</span>
                        <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                          ₹{avgToday.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 block">State avg/qtl</span>
                      </div>

                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-0.5">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">7-Day Forecast</span>
                        <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                          ₹{avgPred7.toLocaleString()}
                        </span>
                        <span className={`text-[10px] font-bold block ${avgPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {avgPct >= 0 ? '+' : ''}
                          {avgPct}% projected
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1.5 border ${
                          leadMandi.signal === 'BUY'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : leadMandi.signal === 'SELL'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {leadMandi.signal === 'BUY' ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : leadMandi.signal === 'SELL' ? (
                          <TrendingDown className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        <span>{leadMandi.signal} SIGNAL</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCommodity(comm);
                          setActiveTab('comparison');
                        }}
                        className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <span>Analyze</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: MARKET COMPARISON */}
      {activeTab === 'comparison' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Multi-Market Benchmarking
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                Market Comparison & Arbitrage Ranking
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="trader-comp-commodity" className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Commodity:
              </label>
              <select
                id="trader-comp-commodity"
                value={selectedCommodity}
                onChange={(e) => setSelectedCommodity(e.target.value as Commodity)}
                className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 dark:text-slate-100"
              >
                {Object.keys(TRADER_COMMODITY_DATA).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 tabular-nums">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block">
                Lowest Sourcing Market
              </span>
              <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                ₹{cheapestBuy.currentPriceQtl.toLocaleString()}/qtl
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {cheapestBuy.market} ({cheapestBuy.district})
              </p>
            </div>

            <div className="p-4 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-800 space-y-1">
              <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 uppercase block">
                Highest 7-Day Selling Target
              </span>
              <div className="text-2xl font-extrabold text-sky-700 dark:text-sky-300">
                ₹{highestSell.predicted7DayQtl.toLocaleString()}/qtl
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {highestSell.market} (7-day projection)
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase block">
                Max Gross Spread
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                +₹{maxArbitrageSpread.toLocaleString()}/qtl
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {cheapestBuy.market} → {highestSell.market}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[11px] font-bold">
                <tr>
                  <th className="py-3 px-4">Mandi</th>
                  <th className="py-3 px-3">District</th>
                  <th className="py-3 px-3 text-right">Current (₹/Qtl)</th>
                  <th className="py-3 px-3 text-right">7-Day Pred (₹/Qtl)</th>
                  <th className="py-3 px-3 text-right">Arrivals (T)</th>
                  <th className="py-3 px-3 text-right">Trend</th>
                  <th className="py-3 px-3 text-center">Volatility</th>
                  <th className="py-3 px-4 text-center">Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                {currentMarkets.map((m) => {
                  const isLowest = m.market === cheapestBuy.market;
                  const isHighest = m.market === highestSell.market;
                  return (
                    <tr key={m.market} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{m.market} APMC</span>
                        {isLowest && (
                          <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                            LOW BUY
                          </span>
                        )}
                        {isHighest && (
                          <span className="px-1.5 py-0.5 bg-sky-600 text-white rounded text-[10px] font-bold">
                            HIGH SELL
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">{m.district}</td>
                      <td className="py-3.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                        ₹{m.currentPriceQtl.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                        ₹{m.predicted7DayQtl.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-600 dark:text-slate-400">
                        {m.arrivalTonnes.toLocaleString()} T
                      </td>
                      <td className={`py-3.5 px-3 text-right font-bold ${m.trendPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {m.trendPct >= 0 ? '+' : ''}
                        {m.trendPct}%
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.volatility === 'Low'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : m.volatility === 'Medium'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {m.volatility}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            m.signal === 'BUY'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : m.signal === 'SELL'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {m.signal}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION C: PROCUREMENT PLANNER */}
      {activeTab === 'planner' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              Logistics & Arbitrage Modeling
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              Procurement Planner
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="planner-commodity" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Commodity
              </label>
              <select
                id="planner-commodity"
                value={selectedCommodity}
                onChange={(e) => setSelectedCommodity(e.target.value as Commodity)}
                className="w-full text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {Object.keys(TRADER_COMMODITY_DATA).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="planner-pur-market" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Purchase Market (Source)
              </label>
              <select
                id="planner-pur-market"
                value={plannerPurMarket}
                onChange={(e) => setPlannerPurMarket(e.target.value as APCCMarket)}
                className="w-full text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {currentMarkets.map((m) => (
                  <option key={m.market} value={m.market}>
                    {m.market} (₹{m.currentPriceQtl}/qtl)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="planner-sell-market" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Selling Market (Destination)
              </label>
              <select
                id="planner-sell-market"
                value={plannerSellMarket}
                onChange={(e) => setPlannerSellMarket(e.target.value as APCCMarket)}
                className="w-full text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {currentMarkets.map((m) => (
                  <option key={m.market} value={m.market}>
                    {m.market} (Exp: ₹{m.predicted7DayQtl}/qtl)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="planner-pur-date" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Purchase Date
              </label>
              <input
                id="planner-pur-date"
                type="date"
                value={plannerPurDate}
                onChange={(e) => setPlannerPurDate(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label htmlFor="planner-sell-date" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Selling Date
              </label>
              <input
                id="planner-sell-date"
                type="date"
                value={plannerSellDate}
                onChange={(e) => setPlannerSellDate(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label htmlFor="planner-qty" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Quantity (Quintals)
              </label>
              <input
                id="planner-qty"
                type="number"
                min={10}
                max={5000}
                value={plannerQtyQtl}
                onChange={(e) => setPlannerQtyQtl(Math.max(1, Number(e.target.value)))}
                className="w-full text-xs sm:text-sm font-bold tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label htmlFor="planner-freight" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Transport & Handling Cost (₹ per Quintal)
              </label>
              <input
                id="planner-freight"
                type="number"
                min={0}
                max={500}
                value={plannerTransportHandlingQtl}
                onChange={(e) => setPlannerTransportHandlingQtl(Math.max(0, Number(e.target.value)))}
                className="w-full text-xs sm:text-sm font-bold tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>Planner Forecast Output</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 tabular-nums">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Purchase Cost</span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  ₹{plannerPurCost.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  ₹{purPoint.currentPriceQtl}/qtl × {plannerQtyQtl}
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Expected Revenue</span>
                <span className="text-lg font-extrabold text-sky-700 dark:text-sky-400">
                  ₹{plannerRevenue.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">Exp ₹{sellPoint.predicted7DayQtl}/qtl</span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Est. Net Profit</span>
                <span className={`text-lg font-extrabold ${plannerGrossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                  ₹{plannerGrossProfit.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 block">Freight: ₹{plannerTransportTotal.toLocaleString()}</span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Margin %</span>
                <span className={`text-lg font-extrabold ${plannerMarginPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {plannerMarginPct.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500 block">Return on purchase</span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-0.5">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Risk Rating</span>
                <span
                  className={`text-lg font-extrabold uppercase ${
                    plannerRisk === 'Low' ? 'text-emerald-600' : plannerRisk === 'Medium' ? 'text-amber-600' : 'text-rose-600'
                  }`}
                >
                  {plannerRisk}
                </span>
                <span className="text-[10px] text-slate-500 block">Spread cushion</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION D: BUY/SELL RECOMMENDATIONS */}
      {activeTab === 'recommendations' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              Signal Generation Engine
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              Buy / Sell / Hold Trade Signals
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 dark:text-emerald-300">
                <TrendingUp className="w-4 h-4" />
                <span>Buy Signal</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Spot rate is favorable and 7-day projection shows &gt;5% appreciation potential.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-800 dark:text-rose-300">
                <TrendingDown className="w-4 h-4" />
                <span>Sell Signal</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                High arrival inflows expected to soften rates. Liquidate inventory or pause sourcing.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
                <Clock className="w-4 h-4" />
                <span>Hold Signal</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Range-bound forecast within ±3%. Monitor daily arrival volume before scaling positions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentMarkets.map((m) => (
              <div
                key={m.market}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {m.market} Mandi ({m.district})
                    </h3>
                    <span className="text-xs font-mono text-slate-500 tabular-nums">
                      Today: ₹{m.currentPriceQtl}/qtl → 7D Exp: ₹{m.predicted7DayQtl}/qtl
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                      m.signal === 'BUY'
                        ? 'bg-emerald-600 text-white'
                        : m.signal === 'SELL'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {m.signal}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{m.reason}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs tabular-nums">
                  <span className="text-slate-500">
                    Confidence: <strong className="text-emerald-600">{m.confidencePct}%</strong>
                  </span>
                  <span className="text-slate-500">
                    Volatility: <strong className="text-slate-800 dark:text-slate-200">{m.volatility}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION E: PROFIT CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              Financial Modeling
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              Trade Profit & Break-Even Calculator
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="calc-commodity" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Commodity
              </label>
              <select
                id="calc-commodity"
                value={calcCommodity}
                onChange={(e) => setCalcCommodity(e.target.value as Commodity)}
                className="w-full text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {Object.keys(TRADER_COMMODITY_DATA).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="calc-pur-market" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Purchase Market
              </label>
              <select
                id="calc-pur-market"
                value={calcPurMarket}
                onChange={(e) => setCalcPurMarket(e.target.value as APCCMarket)}
                className="w-full text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {calcDataList.map((m) => (
                  <option key={m.market} value={m.market}>
                    {m.market} (₹{m.currentPriceQtl}/qtl)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="calc-sell-market" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Selling Market
              </label>
              <select
                id="calc-sell-market"
                value={calcSellMarket}
                onChange={(e) => setCalcSellMarket(e.target.value as APCCMarket)}
                className="w-full text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {calcDataList.map((m) => (
                  <option key={m.market} value={m.market}>
                    {m.market} (Exp: ₹{m.predicted7DayQtl}/qtl)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="calc-qty" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Quantity (Quintals)
              </label>
              <input
                id="calc-qty"
                type="number"
                min={1}
                value={calcQtyQtl}
                onChange={(e) => setCalcQtyQtl(Math.max(1, Number(e.target.value)))}
                className="w-full text-xs sm:text-sm font-bold tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label htmlFor="calc-pur-date" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Purchase Date
              </label>
              <input
                id="calc-pur-date"
                type="date"
                value={calcPurDate}
                onChange={(e) => setCalcPurDate(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label htmlFor="calc-sell-date" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Selling Date
              </label>
              <input
                id="calc-sell-date"
                type="date"
                value={calcSellDate}
                onChange={(e) => setCalcSellDate(e.target.value)}
                className="w-full text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label htmlFor="calc-transport" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Transport Cost (₹/Qtl)
              </label>
              <input
                id="calc-transport"
                type="number"
                min={0}
                value={calcTransportCostQtl}
                onChange={(e) => setCalcTransportCostQtl(Math.max(0, Number(e.target.value)))}
                className="w-full text-xs sm:text-sm font-bold tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label htmlFor="calc-loading" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Loading / Labor (₹/Qtl)
              </label>
              <input
                id="calc-loading"
                type="number"
                min={0}
                value={calcLoadingUnloadingQtl}
                onChange={(e) => setCalcLoadingUnloadingQtl(Math.max(0, Number(e.target.value)))}
                className="w-full text-xs sm:text-sm font-bold tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label htmlFor="calc-wastage" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Transit Shrinkage (%)
              </label>
              <input
                id="calc-wastage"
                type="number"
                step="0.5"
                min={0}
                max={25}
                value={calcWastagePct}
                onChange={(e) => setCalcWastagePct(Math.max(0, Math.min(25, Number(e.target.value))))}
                className="w-full text-xs sm:text-sm font-bold tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Financial Output & Break-Even Summary</span>
              </span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 tabular-nums">
                Saleable Volume after shrinkage: {calcSaleableQtyQtl.toFixed(1)} Qtl
              </span>
            </div>

            {/* Cost Structure Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                <span>Stock Purchase ({purchaseSharePct.toFixed(1)}%)</span>
                <span>Freight & Handling ({logisticsSharePct.toFixed(1)}%)</span>
              </div>
              <div className="h-2.5 w-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex">
                <div style={{ width: `${purchaseSharePct}%` }} className="bg-emerald-600 h-full" />
                <div style={{ width: `${logisticsSharePct}%` }} className="bg-amber-500 h-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 tabular-nums">
              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Cost</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  ₹{calcTotalProcurementCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Expected Revenue</span>
                <span className="text-xl font-extrabold text-sky-700 dark:text-sky-400">
                  ₹{calcExpectedRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Est. Net Profit</span>
                <span className={`text-xl font-extrabold ${calcNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                  ₹{calcNetProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Profit Margin</span>
                <span className={`text-xl font-extrabold ${calcProfitMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {calcProfitMargin.toFixed(1)}%
                </span>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold block">Break-Even Rate</span>
                <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  ₹{calcBreakEvenPriceQtl.toFixed(0)}/qtl
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION F: ALERTS */}
      {activeTab === 'alerts' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              Risk & Arbitrage Broadcasts
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              Trader Alerts Summary
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Price-Rise Opportunities</span>
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                <li><strong>Madanapalle Tomato:</strong> Forecast ₹3,200 → ₹3,850/qtl (+20.3%) in 7 days.</li>
                <li><strong>Vijayawada Onion:</strong> Expected +17.3% strength on inter-state orders.</li>
                <li><strong>Guntur Chilli:</strong> Export demand supporting +9.2% weekly movement.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300 uppercase">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span>Price-Drop Warnings</span>
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                <li><strong>Anantapur Onion:</strong> High arrivals (3,200 T) driving -6.7% downside pressure.</li>
                <li><strong>Kurnool Potato:</strong> Cold-storage offloading softening spot rates (-3.2%).</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Volatility Alerts</span>
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                <li><strong>Tomato & Chilli:</strong> Daily swing &gt;6%. Maintain conservative stop margins.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-800 dark:text-sky-300 uppercase">
                <Truck className="w-4 h-4 text-sky-600" />
                <span>Top Sourcing Hubs</span>
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                <li><strong>Onion:</strong> Kurnool (₹2,400/qtl) vs Coastal AP.</li>
                <li><strong>Tomato:</strong> Madanapalle (₹3,200/qtl) vs Vijayawada.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
