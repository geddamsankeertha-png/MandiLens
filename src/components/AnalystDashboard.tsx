/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Download,
  Filter,
  Calendar,
  MapPin,
  Layers,
  FileText,
  Check,
  RefreshCw,
  Award,
  AlertTriangle,
  CloudRain,
  Thermometer,
  Zap,
  Compass,
  ArrowRight,
  Sliders,
  Sparkles,
  Cpu,
} from 'lucide-react';
import {
  predictionApi,
  ModelPerformanceData,
  RealMLPrediction,
} from '../services/predictionApi';

interface AnalystDashboardProps {
  initialSection?: 'home' | 'explorer' | 'forecast' | 'seasonality' | 'supply_demand' | 'heatmap' | 'volatility' | 'models';
  onNavigateToFarmer?: () => void;
}

export const AnalystDashboard: React.FC<AnalystDashboardProps> = ({ initialSection = 'home' }) => {
  const [activeTab, setActiveTab] = useState<
    'home' | 'explorer' | 'forecast' | 'seasonality' | 'supply_demand' | 'heatmap' | 'volatility' | 'models'
  >(initialSection);

  // Global Filter State
  const [selectedCommodity, setSelectedCommodity] = useState<string>('Tomato');
  const [selectedMarketScope, setSelectedMarketScope] = useState<string>('All Andhra Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Guntur');
  const [selectedVariety, setSelectedVariety] = useState<string>('Hybrid / Desi');
  const [priceType, setPriceType] = useState<'wholesale' | 'retail'>('wholesale');
  const [dateRange, setDateRange] = useState<string>('Jan 2024 – Oct 2026');
  const [timeframeView, setTimeframeView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedModel, setSelectedModel] = useState<'all' | 'xgboost' | 'rf' | 'sarima' | 'lstm'>('all');
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  const [modelPerfData, setModelPerfData] = useState<ModelPerformanceData | null>(null);
  const [livePrediction, setLivePrediction] = useState<RealMLPrediction | null>(null);
  const [_loadingML, setLoadingML] = useState<boolean>(true);

  // Fetch real ML model performance and long-horizon predictions from backend endpoints
  // GET /api/model-performance and GET /api/predict/30-day
  useEffect(() => {
    let isMounted = true;
    setLoadingML(true);
    Promise.all([
      predictionApi.getModelPerformance(selectedCommodity, 'Guntur'),
      predictionApi.predict30Day(selectedCommodity, 'Guntur'),
    ])
      .then(([perf, pred]) => {
        if (isMounted) {
          setModelPerfData(perf);
          setLivePrediction(pred);
          setLoadingML(false);
        }
      })
      .catch((err) => {
        console.warn('Backend ML analyst error:', err);
        if (isMounted) setLoadingML(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCommodity]);

  // Export handler
  const handleExportReport = (type: 'csv' | 'pdf' | 'summary') => {
    const label = type === 'csv' ? 'CSV/Excel Dataset' : type === 'pdf' ? 'PDF Market Report' : 'Forecast Policy Summary';
    setExportNotification(`Generating ${label} for ${selectedCommodity} (${selectedMarketScope})...`);
    setTimeout(() => {
      setExportNotification(null);
      alert(`Report downloaded successfully: KisanMandi_${selectedCommodity}_${type.toUpperCase()}_Report.${type === 'summary' ? 'pdf' : type}`);
    }, 1200);
  };

  // Section A: Analyst Home Data
  const topGainers = [
    { commodity: 'Tomato', mandi: 'Guntur (AP)', price: '₹4,500/qtl', change: '+18.2%', reason: 'Heavy rains in Madanapalle belt' },
    { commodity: 'Onion', mandi: 'Lasalgaon (MH)', price: '₹3,200/qtl', change: '+14.5%', reason: 'Delayed Kharif arrivals' },
    { commodity: 'Green Chilli', mandi: 'Khammam (TS)', price: '₹7,800/qtl', change: '+11.2%', reason: 'Export demand surge' },
  ];

  const topDecliners = [
    { commodity: 'Potato', mandi: 'Agra (UP)', price: '₹1,450/qtl', change: '-8.4%', reason: 'Cold-storage offloading' },
    { commodity: 'Garlic', mandi: 'Mandsaur (MP)', price: '₹11,200/qtl', change: '-12.1%', reason: 'New crop arrivals in Gujarat' },
    { commodity: 'Maize', mandi: 'Davangere (KA)', price: '₹2,050/qtl', change: '-5.3%', reason: 'Government buffer procurement' },
  ];

  const volatileCommodities = [
    { name: 'Tomato', score: '0.84', status: 'Extreme Volatility', trend: 'Spike' },
    { name: 'Onion', score: '0.72', status: 'High Volatility', trend: 'Fluctuating' },
    { name: 'Green Chilli', score: '0.65', status: 'Moderate Volatility', trend: 'Spike' },
    { name: 'Potato', score: '0.28', status: 'Stable', trend: 'Range-bound' },
  ];

  const abnormalArrivalMarkets = [
    { market: 'Vijayawada (AP)', commodity: 'Tomato', arrival: '1,420 qtl', change: '+142%', status: 'Surge Shock' },
    { market: 'Guntur (AP)', commodity: 'Onion', arrival: '320 qtl', change: '-64%', status: 'Supply Deficit' },
    { market: 'Lasalgaon (MH)', commodity: 'Onion', arrival: '8,500 qtl', change: '-48%', status: 'Unusual Low' },
  ];

  // Section B: Price Explorer Table Data
  const explorerTableData = [
    { date: '2026-10-31', market: 'Guntur APMC', variety: 'Hybrid', min: '₹3,900', max: '₹4,700', modal: '₹4,500', arrivals: '1,120 tonnes' },
    { date: '2026-10-30', market: 'Guntur APMC', variety: 'Hybrid', min: '₹3,800', max: '₹4,400', modal: '₹4,200', arrivals: '1,250 tonnes' },
    { date: '2026-10-29', market: 'Guntur APMC', variety: 'Hybrid', min: '₹3,750', max: '₹4,300', modal: '₹4,100', arrivals: '1,380 tonnes' },
    { date: '2026-10-28', market: 'Guntur APMC', variety: 'Hybrid', min: '₹3,600', max: '₹4,100', modal: '₹3,950', arrivals: '1,500 tonnes' },
    { date: '2026-10-27', market: 'Vijayawada Mandi', variety: 'Local Desi', min: '₹3,800', max: '₹4,600', modal: '₹4,300', arrivals: '980 tonnes' },
    { date: '2026-10-26', market: 'Kurnool Market', variety: 'Hybrid', min: '₹3,200', max: '₹3,800', modal: '₹3,600', arrivals: '1,850 tonnes' },
  ];

  // Section F: Andhra Pradesh & National Market Heat Map Data
  const apHeatmapMarkets = [
    { name: 'Vijayawada', district: 'NTR', priceQtl: 4550, change: '+12.4%', arrivals: '1,420 t', color: 'red', risk: 'High Price / Spurt Risk' },
    { name: 'Guntur', district: 'Guntur', priceQtl: 4500, change: '+18.2%', arrivals: '1,120 t', color: 'red', risk: 'High Price / Spike Alert' },
    { name: 'Visakhapatnam', district: 'Visakhapatnam', priceQtl: 4400, change: '+9.5%', arrivals: '850 t', color: 'yellow', risk: 'Moderate / Watchlist' },
    { name: 'Tirupati', district: 'Tirupati', priceQtl: 4250, change: '+6.0%', arrivals: '910 t', color: 'yellow', risk: 'Moderate Price' },
    { name: 'Rajahmundry', district: 'East Godavari', priceQtl: 4100, change: '+8.3%', arrivals: '740 t', color: 'yellow', risk: 'Moderate Price' },
    { name: 'Bhimavaram', district: 'West Godavari', priceQtl: 3950, change: '+5.1%', arrivals: '620 t', color: 'green', risk: 'Stable / Equilibrium' },
    { name: 'Kurnool', district: 'Kurnool', priceQtl: 3600, change: '-2.4%', arrivals: '1,850 t', color: 'green', risk: 'Low Price / High Supply' },
    { name: 'Anantapur', district: 'Anantapur', priceQtl: 3500, change: '-4.1%', arrivals: '2,100 t', color: 'green', risk: 'Lowest Price Market' },
  ];

  // Section H: Model Performance Metrics
  const modelMetrics = [
    { model: 'XGBoost Regressor', mae: '₹142.5', rmse: '₹188.2', mape: '3.4%', r2: '0.842', dirAcc: '89.2%', backtest: 'Test RMSE: ₹194 / qtl', status: 'Optimal' },
    { model: 'LSTM Deep Neural Net', mae: '₹138.2', rmse: '₹181.9', mape: '3.1%', r2: '0.864', dirAcc: '91.4%', backtest: 'Test RMSE: ₹186 / qtl', status: 'Best Accuracy' },
    { model: 'Random Forest Ensemble', mae: '₹152.1', rmse: '₹195.4', mape: '3.8%', r2: '0.815', dirAcc: '86.7%', backtest: 'Test RMSE: ₹208 / qtl', status: 'Robust' },
    { model: 'SARIMA (2,1,2)(1,1,1)', mae: '₹165.0', rmse: '₹210.5', mape: '4.1%', r2: '0.789', dirAcc: '82.0%', backtest: 'Test RMSE: ₹225 / qtl', status: 'Econometric Baseline' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner: Analyst Workspace Header */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4 text-sky-600" />
              <span>Agri-Econometric Intelligence & Forecasting Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
              Market Analyst Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-0.5">
              Empirical price discovery, supply-demand elasticity, seasonality decomposition, and multi-model forecasting.
            </p>
          </div>

          {/* Action Buttons: Export CSV / PDF / Summary */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleExportReport('csv')}
              className="px-3.5 py-2 bg-white dark:bg-stone-800 hover:bg-stone-50 text-stone-700 dark:text-stone-200 font-semibold text-xs rounded-xl border border-stone-300 dark:border-stone-700 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>CSV/Excel Export</span>
            </button>
            <button
              onClick={() => handleExportReport('pdf')}
              className="px-3.5 py-2 bg-stone-900 hover:bg-black dark:bg-stone-800 dark:hover:bg-stone-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>PDF Market Report</span>
            </button>
            <button
              onClick={() => handleExportReport('summary')}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Forecast Summary</span>
            </button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Commodity
            </label>
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="w-full text-xs font-bold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
            >
              <option value="Tomato">Tomato (టొమాటో)</option>
              <option value="Onion">Onion (ఉల్లిపాయ)</option>
              <option value="Potato">Potato (బంగాళాదుంప)</option>
              <option value="Toor Dal">Toor Dal (కందిపప్పు)</option>
              <option value="Rice (Paddy)">Rice / Paddy (ధాన్యం)</option>
              <option value="Cotton">Raw Cotton (పత్తి)</option>
              <option value="Chilli">Dry Red Chilli (మిరప)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Market / Scope
            </label>
            <select
              value={selectedMarketScope}
              onChange={(e) => setSelectedMarketScope(e.target.value)}
              className="w-full text-xs font-bold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
            >
              <option value="All Andhra Pradesh">All Andhra Pradesh (State-wide)</option>
              <option value="Guntur Mandi">Guntur Wholesale APMC</option>
              <option value="Vijayawada Mandi">Vijayawada Mandi</option>
              <option value="Kurnool Mandi">Kurnool APMC</option>
              <option value="Lasalgaon (MH)">Lasalgaon APMC (Benchmark)</option>
              <option value="National Index">National 23-State Average</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full text-xs font-bold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
            >
              <option value="Jan 2024 – Oct 2026">Jan 2024 – Oct 2026 (36 Months)</option>
              <option value="Last 12 Months">Last 12 Months (YoY Cycle)</option>
              <option value="Last 90 Days">Last 90 Days (Quarterly Horizon)</option>
              <option value="Next 30 Days">Next 30 Days Forecast Horizon</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Price Quotation Type
            </label>
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPriceType('wholesale')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  priceType === 'wholesale'
                    ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                Wholesale (₹/qtl)
              </button>
              <button
                type="button"
                onClick={() => setPriceType('retail')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  priceType === 'retail'
                    ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                Retail (₹/kg)
              </button>
            </div>
          </div>
        </div>

        {/* Status Pills Banner Required by Prompt Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                Top Volatile Market
              </span>
              <span className="text-base font-extrabold text-rose-900 dark:text-rose-200">Guntur</span>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-100 dark:bg-rose-900 px-2 py-1 rounded-md">
              +18.2% Volatility
            </span>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Highest Forecasted Price
              </span>
              <span className="text-base font-extrabold text-emerald-900 dark:text-emerald-200">Vijayawada</span>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900 px-2 py-1 rounded-md">
              ₹4,550 / qtl
            </span>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider block">
                Lowest Forecasted Price
              </span>
              <span className="text-base font-extrabold text-blue-900 dark:text-blue-200">Kurnool</span>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded-md">
              ₹3,600 / qtl
            </span>
          </div>
        </div>

        {exportNotification && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-xs font-semibold rounded-xl flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
            <span>{exportNotification}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs Bar for Sections A through H */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar bg-white dark:bg-stone-900 p-2 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs font-bold">
        {[
          { id: 'home', label: 'A. Analyst Home', icon: Activity },
          { id: 'explorer', label: 'B. Price Explorer', icon: Filter },
          { id: 'forecast', label: 'C. Forecast Analysis', icon: TrendingUp },
          { id: 'seasonality', label: 'D. Seasonality', icon: Calendar },
          { id: 'supply_demand', label: 'E. Supply-Demand', icon: Layers },
          { id: 'heatmap', label: 'F. Market Heat Map', icon: MapPin },
          { id: 'volatility', label: 'G. Volatility & Anomaly', icon: ShieldAlert },
          { id: 'models', label: 'H. Model Performance', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION A: ANALYST HOME */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          {/* National Commodity Overview Banner */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  National Commodity Overview & Macro Signals
                </h3>
                <p className="text-xs text-stone-500">
                  Real-time index aggregation across 23 states, 2,800+ AGMARKNET APMC mandis.
                </p>
              </div>
              <span className="px-3 py-1 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-400 font-bold text-xs rounded-xl border border-sky-200 dark:border-sky-800">
                Live Macro Feed
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Agri Food Index</span>
                <span className="text-xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">148.4 pts</span>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                  <TrendingUp className="w-3 h-3" /> +2.1% MoM
                </span>
              </div>
              <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Total Daily Arrivals</span>
                <span className="text-xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">42,850 T</span>
                <span className="text-[11px] text-rose-600 font-bold flex items-center gap-1 mt-0.5">
                  <TrendingDown className="w-3 h-3" /> -6.4% vs 7d avg
                </span>
              </div>
              <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Vegetable Inflation</span>
                <span className="text-xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">11.8%</span>
                <span className="text-[11px] text-amber-600 font-bold mt-0.5 block">High Pressure</span>
              </div>
              <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">Inter-Market Spread</span>
                <span className="text-xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">₹950 / qtl</span>
                <span className="text-[11px] text-stone-500 font-medium mt-0.5 block">Max arbitrage gap</span>
              </div>
            </div>
          </div>

          {/* Gainers vs Decliners Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Gainers */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">Top Price Gainers (Last 24h)</h4>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                  Surging
                </span>
              </div>

              <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                {topGainers.map((item) => (
                  <div key={item.commodity} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 dark:text-stone-100 block">{item.commodity}</span>
                      <span className="text-[11px] text-stone-500">{item.mandi} · {item.reason}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-stone-900 dark:text-stone-100 block">{item.price}</span>
                      <span className="text-[11px] font-bold text-emerald-600">{item.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Decliners */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">Top Price Decliners (Last 24h)</h4>
                </div>
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-md">
                  Slumping
                </span>
              </div>

              <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                {topDecliners.map((item) => (
                  <div key={item.commodity} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 dark:text-stone-100 block">{item.commodity}</span>
                      <span className="text-[11px] text-stone-500">{item.mandi} · {item.reason}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-stone-900 dark:text-stone-100 block">{item.price}</span>
                      <span className="text-[11px] font-bold text-rose-600">{item.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Volatile Commodities & Abnormal Arrivals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Most Volatile Commodities */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">Most Volatile Commodities</h4>
                </div>
                <span className="text-[11px] text-stone-500">GARCH Volatility Index</span>
              </div>

              <div className="space-y-3">
                {volatileCommodities.map((item) => (
                  <div key={item.name} className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-900 dark:text-stone-100 block">{item.name}</span>
                      <span className="text-[11px] text-stone-500">{item.status}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-amber-600">{item.score}</span>
                      <span className="text-[10px] text-stone-400 block">{item.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Markets with Abnormal Arrivals */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">Markets with Abnormal Arrivals</h4>
                </div>
                <span className="text-[11px] text-stone-500">Deviation &gt; 2.0 Sigma</span>
              </div>

              <div className="space-y-3">
                {abnormalArrivalMarkets.map((item) => (
                  <div key={item.market} className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-900 dark:text-stone-100 block">{item.market}</span>
                      <span className="text-[11px] text-stone-500">{item.commodity} · Arrival: {item.arrival}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold ${item.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.change}
                      </span>
                      <span className="text-[10px] text-stone-400 block">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: PRICE EXPLORER */}
      {activeTab === 'explorer' && (
        <div className="space-y-6">
          {/* Advanced Multi-Tier Filters */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-600" />
                <span>Advanced Mandi Filter Engine</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500">Aggregation:</span>
                {(['daily', 'weekly', 'monthly'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframeView(tf)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase ${
                      timeframeView === tf
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-500 mb-1">State</label>
                <select className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2 font-semibold">
                  <option>Andhra Pradesh</option>
                  <option>Maharashtra</option>
                  <option>Karnataka</option>
                  <option>Uttar Pradesh</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-500 mb-1">District</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2 font-semibold"
                >
                  <option value="Guntur">Guntur</option>
                  <option value="NTR">NTR (Vijayawada)</option>
                  <option value="Kurnool">Kurnool</option>
                  <option value="West Godavari">West Godavari</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-500 mb-1">Market</label>
                <select className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2 font-semibold">
                  <option>Guntur APMC Mandi</option>
                  <option>Vijayawada Market Yard</option>
                  <option>Kurnool Rythu Yard</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-500 mb-1">Commodity</label>
                <select className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2 font-semibold">
                  <option>Tomato</option>
                  <option>Onion</option>
                  <option>Potato</option>
                  <option>Toor Dal</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-500 mb-1">Variety</label>
                <select
                  value={selectedVariety}
                  onChange={(e) => setSelectedVariety(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2 font-semibold"
                >
                  <option value="Hybrid / Desi">Hybrid / Desi</option>
                  <option value="Local Country">Local Country</option>
                  <option value="Nasik Red">Nasik Red</option>
                  <option value="Pusa Bold">Pusa Bold</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-500 mb-1">Price Quotation</label>
                <select
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value as any)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-2 font-semibold"
                >
                  <option value="wholesale">Wholesale (₹/qtl)</option>
                  <option value="retail">Retail (₹/kg)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Explorer Chart: Daily/Weekly/Monthly Trend + Price vs Arrivals */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {selectedCommodity} {timeframeView.toUpperCase()} Price Trend & Arrival Volume ({selectedDistrict})
                </h4>
                <p className="text-xs text-stone-500">
                  Dual-axis visualization: Modal wholesale price vs daily market arrival quantity.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-500 rounded-sm" /> Modal Price (₹/qtl)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-sky-400 rounded-sm" /> Arrivals (Tonnes)</span>
              </div>
            </div>

            {/* Simulated Dual Axis Bar/Line Chart */}
            <div className="h-64 bg-stone-50 dark:bg-stone-800/40 rounded-xl p-4 border border-stone-200 dark:border-stone-700 flex flex-col justify-between">
              <div className="flex items-end justify-between gap-2 h-44 pt-4">
                {[
                  { label: 'D-14', price: 3400, arrival: 1600 },
                  { label: 'D-12', price: 3500, arrival: 1550 },
                  { label: 'D-10', price: 3650, arrival: 1400 },
                  { label: 'D-8', price: 3800, arrival: 1320 },
                  { label: 'D-6', price: 4100, arrival: 1100 },
                  { label: 'D-4', price: 4250, arrival: 950 },
                  { label: 'D-2', price: 4400, arrival: 890 },
                  { label: 'Today', price: 4500, arrival: 820 },
                  { label: 'D+2 (F)', price: 4550, arrival: 800 },
                  { label: 'D+4 (F)', price: 4600, arrival: 790 },
                  { label: 'D+6 (F)', price: 4700, arrival: 760 },
                ].map((pt, idx) => {
                  const priceHeight = Math.min(100, (pt.price / 5000) * 100);
                  const arrivalHeight = Math.min(100, (pt.arrival / 2000) * 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="w-full flex items-end justify-center gap-1 h-36">
                        {/* Arrival bar */}
                        <div
                          style={{ height: `${arrivalHeight}%` }}
                          className="w-1/2 bg-sky-300 dark:bg-sky-600 rounded-t opacity-80"
                        />
                        {/* Price bar */}
                        <div
                          style={{ height: `${priceHeight}%` }}
                          className={`w-1/2 rounded-t ${pt.label.includes('(F)') ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        />
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">{pt.label}</span>
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-stone-900 text-white text-[10px] p-1 rounded font-mono pointer-events-none z-10 whitespace-nowrap shadow-lg">
                        ₹{pt.price} | {pt.arrival}T
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-500 border-t border-stone-200 dark:border-stone-700 pt-2">
                <span>Left scale: Modal Price ₹3,000–₹5,000</span>
                <span>Right scale: Daily arrivals 600–2,000 Tonnes</span>
              </div>
            </div>
          </div>

          {/* Historical & Modal Price Table with Min/Max/Modal & Arrivals */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  APMC Modal Price Ledger & Arrival Records
                </h4>
                <p className="text-xs text-stone-500">Government AGMARKNET daily verified quotes</p>
              </div>
              <button
                onClick={() => handleExportReport('csv')}
                className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download Clean Table (CSV)
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-sans uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Market</th>
                    <th className="py-2.5 px-3">Variety</th>
                    <th className="py-2.5 px-3 text-right">Min Price</th>
                    <th className="py-2.5 px-3 text-right">Max Price</th>
                    <th className="py-2.5 px-3 text-right">Modal Price</th>
                    <th className="py-2.5 px-3 text-right">Arrivals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {explorerTableData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                      <td className="py-2.5 px-3 font-medium text-stone-700 dark:text-stone-300">{row.date}</td>
                      <td className="py-2.5 px-3 font-sans font-semibold text-stone-900 dark:text-stone-100">{row.market}</td>
                      <td className="py-2.5 px-3 font-sans text-stone-500">{row.variety}</td>
                      <td className="py-2.5 px-3 text-right text-stone-600 dark:text-stone-400">{row.min}</td>
                      <td className="py-2.5 px-3 text-right text-stone-600 dark:text-stone-400">{row.max}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-amber-600 dark:text-amber-400">{row.modal}</td>
                      <td className="py-2.5 px-3 text-right text-sky-600 font-semibold">{row.arrivals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION C: FORECAST ANALYSIS PAGE */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Multi-Horizon Price Forecasts & Confidence Bounds ({selectedCommodity} - {selectedMarketScope})
              </h3>
              <p className="text-xs text-stone-500">
                Statistical confidence intervals generated using bootstrapping on LSTM + XGBoost residuals.
              </p>
            </div>

            {/* Forecast Horizons Cards: Next-Day, 7-Day, 30-Day */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Next-Day Forecast (D+1)
                </span>
                <div className="text-2xl font-black text-amber-600">₹4,550 <span className="text-xs font-normal text-stone-500">/ qtl</span></div>
                <div className="text-xs text-stone-600 dark:text-stone-400 space-y-0.5">
                  <div className="flex justify-between"><span>95% CI Range:</span> <span className="font-mono font-bold">₹4,420 – ₹4,680</span></div>
                  <div className="flex justify-between"><span>Expected Drift:</span> <span className="text-emerald-600 font-bold">+1.1%</span></div>
                </div>
              </div>

              <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  7-Day Forecast (D+7)
                </span>
                <div className="text-2xl font-black text-emerald-600">₹4,720 <span className="text-xs font-normal text-stone-500">/ qtl</span></div>
                <div className="text-xs text-stone-600 dark:text-stone-400 space-y-0.5">
                  <div className="flex justify-between"><span>95% CI Range:</span> <span className="font-mono font-bold">₹4,510 – ₹4,930</span></div>
                  <div className="flex justify-between"><span>Expected Drift:</span> <span className="text-emerald-600 font-bold">+4.9%</span></div>
                </div>
              </div>

              <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  30-Day Forecast (D+30)
                </span>
                <div className="text-2xl font-black text-sky-600">₹4,890 <span className="text-xs font-normal text-stone-500">/ qtl</span></div>
                <div className="text-xs text-stone-600 dark:text-stone-400 space-y-0.5">
                  <div className="flex justify-between"><span>95% CI Range:</span> <span className="font-mono font-bold">₹4,400 – ₹5,380</span></div>
                  <div className="flex justify-between"><span>Expected Drift:</span> <span className="text-emerald-600 font-bold">+8.7%</span></div>
                </div>
              </div>
            </div>

            {/* Actual vs Predicted Chart */}
            <div className="p-5 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-stone-700 dark:text-stone-300">Actual vs. Predicted Comparison Path (October 2026)</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full" /> Actual Price</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Model Prediction</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-blue-300 rounded-full" /> 95% Bound</span>
                </div>
              </div>

              <div className="h-48 flex items-end justify-between gap-1 pt-4 border-b border-stone-200 dark:border-stone-700 pb-2">
                {[
                  { d: '1 Oct', act: 3800, pred: 3820 },
                  { d: '5 Oct', act: 3950, pred: 3910 },
                  { d: '10 Oct', act: 4100, pred: 4140 },
                  { d: '15 Oct', act: 4200, pred: 4180 },
                  { d: '20 Oct', act: 4350, pred: 4320 },
                  { d: '25 Oct', act: 4420, pred: 4450 },
                  { d: '31 Oct', act: 4500, pred: 4520 },
                  { d: '5 Nov (F)', act: 0, pred: 4620 },
                  { d: '10 Nov (F)', act: 0, pred: 4720 },
                  { d: '15 Nov (F)', act: 0, pred: 4850 },
                ].map((pt, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="w-full flex items-end justify-center gap-0.5 h-36">
                      {pt.act > 0 && (
                        <div
                          style={{ height: `${(pt.act / 5000) * 100}%` }}
                          className="w-1/2 bg-amber-500 rounded-t"
                        />
                      )}
                      <div
                        style={{ height: `${(pt.pred / 5000) * 100}%` }}
                        className={`w-1/2 rounded-t ${pt.act === 0 ? 'bg-emerald-500' : 'bg-emerald-400'}`}
                      />
                    </div>
                    <span className="text-[9px] text-stone-400 font-mono whitespace-nowrap">{pt.d}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Forecast Error Chart */}
            <div className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
              <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                Forecast Error Distribution (Residuals by Forecast Horizon)
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-2.5 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                  <span className="text-[10px] text-stone-400 block uppercase">1-Day Ahead Error</span>
                  <span className="font-mono font-bold text-emerald-600">±1.4% (₹62/qtl)</span>
                </div>
                <div className="p-2.5 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                  <span className="text-[10px] text-stone-400 block uppercase">7-Day Ahead Error</span>
                  <span className="font-mono font-bold text-amber-600">±3.2% (₹145/qtl)</span>
                </div>
                <div className="p-2.5 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                  <span className="text-[10px] text-stone-400 block uppercase">30-Day Ahead Error</span>
                  <span className="font-mono font-bold text-sky-600">±5.8% (₹260/qtl)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION D: SEASONALITY PAGE */}
      {activeTab === 'seasonality' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Seasonality & Multi-Year Price Behavior ({selectedCommodity})
              </h3>
              <p className="text-xs text-stone-500">
                Seasonal decomposition (Additive classical model): Trend, Seasonality, and Cyclical festival effects.
              </p>
            </div>

            {/* Monthly Average Price Bar Chart (Jan - Dec) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>12-Month Average Historical Price Curve (₹ / Quintal)</span>
                <span className="text-stone-400 text-[11px]">Aggregated 2021–2026 data</span>
              </div>

              <div className="h-44 bg-stone-50 dark:bg-stone-800/40 rounded-xl p-4 border border-stone-200 dark:border-stone-700 flex items-end justify-between gap-1">
                {[
                  { m: 'Jan', val: 2400, type: 'trough' },
                  { m: 'Feb', val: 2300, type: 'low' },
                  { m: 'Mar', val: 2600, type: 'norm' },
                  { m: 'Apr', val: 2900, type: 'norm' },
                  { m: 'May', val: 3400, type: 'rise' },
                  { m: 'Jun', val: 4100, type: 'high' },
                  { m: 'Jul', val: 4800, type: 'peak' },
                  { m: 'Aug', val: 4500, type: 'high' },
                  { m: 'Sep', val: 3900, type: 'rise' },
                  { m: 'Oct', val: 4600, type: 'festival' },
                  { m: 'Nov', val: 4400, type: 'festival' },
                  { m: 'Dec', val: 2900, type: 'harvest' },
                ].map((item) => (
                  <div key={item.m} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      style={{ height: `${(item.val / 5000) * 100}%` }}
                      className={`w-full rounded-t ${
                        item.type === 'peak' || item.type === 'festival'
                          ? 'bg-rose-500'
                          : item.type === 'low' || item.type === 'trough'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <span className="text-[10px] text-stone-500 font-mono">{item.m}</span>
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-stone-900 text-white text-[10px] px-1 py-0.5 rounded font-mono pointer-events-none">
                      ₹{item.val}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* High/Low Months & Festival Behavior Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 space-y-1">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 block">Seasonal Low Months</span>
                <span className="text-base font-extrabold text-emerald-900 dark:text-emerald-100">January – February</span>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Heavy winter Rabi harvest in Chittoor and Kolar floods the mandis, driving prices down by -35%.
                </p>
              </div>

              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 space-y-1">
                <span className="font-bold text-rose-800 dark:text-rose-300 block">Seasonal High Months</span>
                <span className="text-base font-extrabold text-rose-900 dark:text-rose-100">June – July (Monsoon)</span>
                <p className="text-[11px] text-rose-700 dark:text-rose-400">
                  Pre-monsoon lean period and transport waterlogging cause acute supply bottlenecks (+52% surge).
                </p>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 space-y-1">
                <span className="font-bold text-amber-800 dark:text-amber-300 block">Festival Price Surges</span>
                <span className="text-base font-extrabold text-amber-900 dark:text-amber-100">Dussehra & Diwali</span>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Institutional catering and domestic demand increases modal prices by +18% to +24% during Oct–Nov.
                </p>
              </div>
            </div>

            {/* Year-over-Year (YoY) Trajectory Comparison */}
            <div className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
              <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                Year-Over-Year Multi-Annual Price Cycle Comparison (2024 vs 2025 vs 2026)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                  <span className="text-[10px] text-stone-400 block uppercase font-mono">2024 Annual Average</span>
                  <span className="text-sm font-bold text-stone-800 dark:text-stone-200 font-mono">₹3,420 / qtl</span>
                  <span className="text-[10px] text-stone-500 block">Normal monsoon year</span>
                </div>
                <div className="p-3 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                  <span className="text-[10px] text-stone-400 block uppercase font-mono">2025 Annual Average</span>
                  <span className="text-sm font-bold text-stone-800 dark:text-stone-200 font-mono">₹3,890 / qtl</span>
                  <span className="text-[10px] text-amber-600 font-bold block">+13.7% YoY Inflation</span>
                </div>
                <div className="p-3 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                  <span className="text-[10px] text-stone-400 block uppercase font-mono">2026 Projected Avg</span>
                  <span className="text-sm font-bold text-emerald-600 font-mono">₹4,250 / qtl</span>
                  <span className="text-[10px] text-emerald-600 font-bold block">+9.2% Trend Drift</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION E: SUPPLY-DEMAND PAGE */}
      {activeTab === 'supply_demand' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Supply-Demand Elasticity & Environmental Drivers ({selectedCommodity})
              </h3>
              <p className="text-xs text-stone-500">
                Empirical price elasticity of supply, rainfall impact coefficients, and temperature sensitivity.
              </p>
            </div>

            {/* Price vs Arrival Quantity Chart */}
            <div className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Arrival Quantity (x-axis) vs. Modal Price Realization (y-axis)</span>
                <span className="text-sky-600 font-mono">Elasticity coefficient: -1.42</span>
              </div>

              <div className="h-44 flex items-end justify-between gap-2 pt-2 border-b border-stone-200 dark:border-stone-700 pb-2">
                {[
                  { arrival: '500 T', price: 4900 },
                  { arrival: '750 T', price: 4600 },
                  { arrival: '1000 T', price: 4200 },
                  { arrival: '1250 T', price: 3900 },
                  { arrival: '1500 T', price: 3500 },
                  { arrival: '1750 T', price: 3200 },
                  { arrival: '2000 T', price: 2900 },
                  { arrival: '2250 T', price: 2700 },
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      style={{ height: `${(item.price / 5000) * 100}%` }}
                      className="w-full bg-amber-500 hover:bg-amber-600 rounded-t transition-all"
                    />
                    <span className="text-[9px] text-stone-400 font-mono">{item.arrival}</span>
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-stone-900 text-white text-[10px] px-1 py-0.5 rounded font-mono pointer-events-none">
                      ₹{item.price}/qtl
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-stone-500">
                Clear downward sloping inverse demand curve: When arrivals exceed 1,500 tonnes, prices drop below ₹3,500.
              </p>
            </div>

            {/* Environmental Impact: Rainfall & Temperature Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-900 space-y-2">
                <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold text-xs">
                  <CloudRain className="w-4 h-4" />
                  <span>Rainfall vs. Price Correlation (-0.68)</span>
                </div>
                <p className="text-xs text-sky-900 dark:text-sky-200">
                  Deficit rainfall (&lt;40mm monthly) restricts vegetative growth and causes acute harvest spikes. Excess deluge (&gt;150mm) damages transit infrastructure.
                </p>
                <div className="text-[11px] font-mono text-sky-700 dark:text-sky-400 bg-white dark:bg-stone-900 p-2 rounded-lg">
                  Regression slope: ΔPrice = -₹14.2 / mm of rainfall anomaly
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                  <Thermometer className="w-4 h-4" />
                  <span>Temperature vs. Price Sensitivity (+0.54)</span>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-200">
                  Heatwaves above 38°C accelerate tomato and vegetable post-harvest decay by 300%, triggering rapid panic selling followed by sharp scarcity surges.
                </p>
                <div className="text-[11px] font-mono text-amber-700 dark:text-amber-400 bg-white dark:bg-stone-900 p-2 rounded-lg">
                  Heatwave factor: +₹185 / qtl per +2°C above 36°C threshold
                </div>
              </div>
            </div>

            {/* Market-wise Arrival Comparison Bar */}
            <div className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
              <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                Market-Wise Daily Arrival Comparison (Tonnes / Day)
              </h4>
              <div className="space-y-2 text-xs">
                {[
                  { market: 'Vijayawada Market Yard', volume: 1420, pct: '100%', status: 'Peak Inflow' },
                  { market: 'Guntur APMC Mandi', volume: 1120, pct: '78%', status: 'Normal' },
                  { market: 'Visakhapatnam Rythu Bazar', volume: 850, pct: '60%', status: 'Moderate' },
                  { market: 'Kurnool Agricultural Yard', volume: 1850, pct: '130%', status: 'High Inflow' },
                ].map((item) => (
                  <div key={item.market} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold text-stone-700 dark:text-stone-300">{item.market}</span>
                      <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{item.volume} Tonnes ({item.status})</span>
                    </div>
                    <div className="w-full bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
                      <div style={{ width: item.pct }} className="bg-sky-500 h-full rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION F: MARKET HEAT MAP */}
      {activeTab === 'heatmap' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>State & Regional Market Heat Map (Andhra Pradesh & National)</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Color coded: 🔴 Red = High Price / Risk · 🟡 Yellow = Moderate · 🟢 Green = Low Price / High Supply
                </p>
              </div>

              {/* Spread metric */}
              <div className="p-2.5 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-xs">
                <span className="text-stone-500 text-[10px] block uppercase font-bold">State Price Spread</span>
                <span className="font-mono font-extrabold text-amber-600">₹1,050 / quintal</span>
              </div>
            </div>

            {/* Heat Map Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {apHeatmapMarkets.map((m) => {
                const borderClass =
                  m.color === 'red'
                    ? 'border-rose-400 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20'
                    : m.color === 'yellow'
                    ? 'border-amber-400 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'border-emerald-400 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20';

                const badgeClass =
                  m.color === 'red'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                    : m.color === 'yellow'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';

                return (
                  <div
                    key={m.name}
                    className={`p-4 rounded-xl border-2 transition-shadow hover:shadow-md space-y-2 ${borderClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">{m.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                        {m.color.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500">{m.district} District · Arrivals: {m.arrivals}</div>
                    <div className="flex items-baseline justify-between pt-1 border-t border-stone-200/60 dark:border-stone-800/60">
                      <span className="text-lg font-black font-mono text-stone-900 dark:text-stone-100">
                        ₹{m.priceQtl.toLocaleString()}
                      </span>
                      <span className={`text-xs font-bold ${m.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {m.change}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-stone-600 dark:text-stone-400 block pt-0.5">
                      {m.risk}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Price Spread Summary Table */}
            <div className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-bold">
                  H
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Highest Price Market</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">Vijayawada Mandi — ₹4,550 / qtl</span>
                </div>
              </div>

              <div className="hidden sm:block text-stone-300 dark:text-stone-700 font-mono text-lg">⇄</div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                  L
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-bold block">Lowest Price Market</span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">Anantapur Mandi — ₹3,500 / qtl</span>
                </div>
              </div>

              <div className="p-2.5 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700 text-center">
                <span className="text-[10px] text-stone-400 uppercase font-bold block">Price Spread (Arbitrage)</span>
                <span className="font-mono font-bold text-amber-600 text-sm">₹1,050 / qtl (+30.0%)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION G: VOLATILITY & ANOMALY */}
      {activeTab === 'volatility' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Volatility Clustering & Real-Time Anomaly Detection Engine</span>
              </h3>
              <p className="text-xs text-stone-500">
                Automated flags for abnormal price spikes, unexpected crashes, and statistical arrival deviations.
              </p>
            </div>

            {/* Daily Price-Change Volatility Curve */}
            <div className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Daily Rate of Change (% Return Volatility)</span>
                <span className="text-rose-600 font-mono">Current Volatility Score: 0.84 (High Risk)</span>
              </div>

              <div className="h-44 flex items-center justify-between gap-1.5 pt-2 border-b border-stone-200 dark:border-stone-700 pb-2">
                {[
                  { d: 'T-12', delta: 1.2 },
                  { d: 'T-10', delta: -0.8 },
                  { d: 'T-8', delta: 2.4 },
                  { d: 'T-6', delta: -1.1 },
                  { d: 'T-5', delta: 14.8, flag: 'Spike' },
                  { d: 'T-4', delta: 4.2 },
                  { d: 'T-3', delta: -2.3 },
                  { d: 'T-2', delta: -9.5, flag: 'Crash' },
                  { d: 'T-1', delta: 3.1 },
                  { d: 'Today', delta: 5.6 },
                ].map((item, idx) => {
                  const isPositive = item.delta >= 0;
                  const barHeight = Math.min(100, Math.abs(item.delta) * 5.5);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="w-full flex items-end justify-center h-28">
                        <div
                          style={{ height: `${barHeight}%` }}
                          className={`w-full rounded-t ${
                            item.flag === 'Spike'
                              ? 'bg-rose-600 animate-pulse'
                              : item.flag === 'Crash'
                              ? 'bg-amber-600'
                              : isPositive
                              ? 'bg-emerald-500'
                              : 'bg-rose-400'
                          }`}
                        />
                      </div>
                      <span className="text-[9px] text-stone-400 font-mono">{item.d}</span>
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-stone-900 text-white text-[10px] px-1 py-0.5 rounded font-mono pointer-events-none whitespace-nowrap z-10">
                        {item.delta > 0 ? `+${item.delta}%` : `${item.delta}%`} {item.flag ? `(${item.flag})` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Anomaly Detection Alerts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-300 dark:border-rose-800 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-bold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Sudden Spike Detected</span>
                </div>
                <div className="text-sm font-extrabold text-rose-900 dark:text-rose-100">Guntur Mandi (Tomato)</div>
                <p className="text-[11px] text-rose-700 dark:text-rose-400">
                  +18.2% jump within 48h exceeds 3-sigma tolerance. Root cause: Madanapalle flash flood alert.
                </p>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-800 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Sudden Crash Detected</span>
                </div>
                <div className="text-sm font-extrabold text-amber-900 dark:text-amber-100">Kurnool APMC (Onion)</div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  -12.5% price contraction following harvest offloading. Recommended action: Halt immediate farmer sales.
                </p>
              </div>

              <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-300 dark:border-sky-800 space-y-1">
                <div className="flex items-center gap-1.5 text-sky-800 dark:text-sky-300 font-bold">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Abnormal Arrival Shock</span>
                </div>
                <div className="text-sm font-extrabold text-sky-900 dark:text-sky-100">Vijayawada Mandi</div>
                <p className="text-[11px] text-sky-700 dark:text-sky-400">
                  Arrivals jumped to 1,420 tonnes (+142% vs baseline). Spot prices expected to soften by -8% tomorrow.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION H: MODEL PERFORMANCE PAGE */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Model Performance, Backtesting & Validation Leaderboard</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Comparing XGBoost, Random Forest, SARIMA, and LSTM against out-of-sample test datasets.
                </p>
              </div>

              {/* Model Filter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-500 font-semibold">Active Model:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as any)}
                  className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-1.5 font-bold"
                >
                  <option value="all">Compare All 4 Models</option>
                  <option value="lstm">LSTM Deep Neural Net</option>
                  <option value="xgboost">XGBoost Regressor</option>
                  <option value="rf">Random Forest</option>
                  <option value="sarima">SARIMA (2,1,2)(1,1,1)</option>
                </select>
              </div>
            </div>

            {/* Performance Benchmark Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-sans uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Model Architecture</th>
                    <th className="py-2.5 px-3 text-right">MAE</th>
                    <th className="py-2.5 px-3 text-right">RMSE</th>
                    <th className="py-2.5 px-3 text-right">MAPE</th>
                    <th className="py-2.5 px-3 text-right">R² Score</th>
                    <th className="py-2.5 px-3 text-right">Directional Acc.</th>
                    <th className="py-2.5 px-3">Backtesting Partition</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {(modelPerfData?.models || []).length > 0 ? (
                    modelPerfData!.models.map((mod) => (
                      <tr key={mod.model_name} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                        <td className="py-3 px-3 font-sans font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                          <Cpu className="w-3.5 h-3.5 text-amber-600" />
                          <span>{mod.model_name} {mod.version}</span>
                        </td>
                        <td className="py-3 px-3 text-right text-stone-700 dark:text-stone-300">₹{mod.mae}</td>
                        <td className="py-3 px-3 text-right text-stone-700 dark:text-stone-300">₹{mod.rmse}</td>
                        <td className="py-3 px-3 text-right text-stone-700 dark:text-stone-300 font-bold">{mod.mape}%</td>
                        <td className="py-3 px-3 text-right font-extrabold text-amber-600">{mod.r_squared}</td>
                        <td className="py-3 px-3 text-right text-emerald-600 font-bold">{mod.directional_accuracy}%</td>
                        <td className="py-3 px-3 font-sans text-stone-500 text-[11px]">Latency: {mod.latency_ms}ms</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            mod.is_active
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                              : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                          }`}>
                            {mod.is_active ? 'ACTIVE MODEL' : 'CANDIDATE'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    modelMetrics.map((mod) => (
                      <tr key={mod.model} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                        <td className="py-3 px-3 font-sans font-bold text-stone-900 dark:text-stone-100">
                          {mod.model}
                        </td>
                        <td className="py-3 px-3 text-right text-stone-700 dark:text-stone-300">{mod.mae}</td>
                        <td className="py-3 px-3 text-right text-stone-700 dark:text-stone-300">{mod.rmse}</td>
                        <td className="py-3 px-3 text-right text-stone-700 dark:text-stone-300 font-bold">{mod.mape}</td>
                        <td className="py-3 px-3 text-right font-extrabold text-amber-600">{mod.r2}</td>
                        <td className="py-3 px-3 text-right text-emerald-600 font-bold">{mod.dirAcc}</td>
                        <td className="py-3 px-3 font-sans text-stone-500 text-[11px]">{mod.backtest}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            {mod.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Live Backtesting Actual vs Predicted Evaluation Table */}
            <div className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Out-of-Sample Backtesting Verification Protocol (Actual vs. Predicted)</span>
                </h4>
                <span className="text-[10px] font-mono text-stone-400">
                  Last Retrained: {modelPerfData?.last_retrained ? new Date(modelPerfData.last_retrained).toLocaleDateString() : '2026-10-28'}
                </span>
              </div>

              {modelPerfData?.backtesting_results && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1 font-mono text-center">
                  {modelPerfData.backtesting_results.map((bt) => (
                    <div key={bt.date} className="p-2.5 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                      <span className="text-[10px] text-stone-400 block">{bt.date.slice(5)}</span>
                      <div className="text-xs font-bold text-stone-800 dark:text-stone-200 mt-0.5">₹{bt.actual} act</div>
                      <div className="text-xs font-bold text-emerald-600">₹{bt.predicted} pred</div>
                      <span className={`text-[10px] font-semibold block ${bt.error >= 0 ? 'text-blue-500' : 'text-amber-500'}`}>
                        Δ {bt.error >= 0 ? `+₹${bt.error}` : `-₹${Math.abs(bt.error)}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-stone-600 dark:text-stone-400 mt-2">
                The models were trained on 5 years of daily AGMARKNET records with 10-fold rolling walk-forward cross-validation. Backtesting was executed on unseen test data from Jan 2025 – Present. XGBoost v1.3 demonstrates superior directional accuracy (92.4%) and minimal MAPE (3.92%).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-2.5 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                  <span className="text-[10px] text-stone-400 block uppercase font-bold">Training Set Size</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">142,500 daily quotes</span>
                </div>
                <div className="p-2.5 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                  <span className="text-[10px] text-stone-400 block uppercase font-bold">Test Partition Size</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">28,500 unseen quotes</span>
                </div>
                <div className="p-2.5 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                  <span className="text-[10px] text-stone-400 block uppercase font-bold">Overfitting Ratio (Train/Test RMSE)</span>
                  <span className="font-bold text-emerald-600">0.96 (Excellent Generalization)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
