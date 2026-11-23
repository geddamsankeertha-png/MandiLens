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
  RefreshCw,
  Award,
  AlertTriangle,
  CloudRain,
  Thermometer,
  Zap,
  Sparkles,
  Cpu,
  Database,
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

  useEffect(() => {
    setActiveTab(initialSection);
  }, [initialSection]);

  const [selectedCommodity, setSelectedCommodity] = useState<string>('Tomato');
  const [selectedMarketScope, setSelectedMarketScope] = useState<string>('All Andhra Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Guntur');
  const [selectedVariety, setSelectedVariety] = useState<string>('Hybrid / Desi');
  const [priceType, setPriceType] = useState<'wholesale' | 'retail'>('wholesale');
  const [dateRange, setDateRange] = useState<string>('Jan 2024 – Oct 2026');
  const [timeframeView, setTimeframeView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  const [modelPerfData, setModelPerfData] = useState<ModelPerformanceData | null>(null);
  const [livePrediction, setLivePrediction] = useState<RealMLPrediction | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      predictionApi.getModelPerformance(selectedCommodity, 'Guntur'),
      predictionApi.predict30Day(selectedCommodity, 'Guntur'),
    ])
      .then(([perf, pred]) => {
        if (isMounted) {
          setModelPerfData(perf);
          setLivePrediction(pred);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [selectedCommodity]);

  const handleExportReport = async (type: 'csv' | 'pdf' | 'summary') => {
    const label = type === 'csv' ? 'CSV Dataset' : type === 'pdf' ? 'Print / Save Report' : 'Forecast Summary (.txt)';
    setExportNotification(`Preparing ${label} for ${selectedCommodity} (${selectedDistrict})...`);
    try {
      if (type === 'csv') {
        const params = new URLSearchParams({
          commodity: selectedCommodity,
          market: selectedDistrict || 'Guntur',
          days: '90',
        });
        const res = await fetch(`/api/prices/export?${params.toString()}`);
        const csvText = await res.text();
        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `KisanMandi_${selectedCommodity.replace(/\s+/g, '_')}_${selectedDistrict}_90d.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setExportNotification(`Downloaded CSV: KisanMandi_${selectedCommodity}_${selectedDistrict}_90d.csv`);
      } else if (type === 'pdf') {
        window.print();
        setExportNotification(`Opened print dialog for ${selectedCommodity} Market Report.`);
      } else {
        const lines = [
          `KisanMandi Econometric Forecast Summary`,
          `Generated: ${new Date().toISOString()}`,
          `Commodity: ${selectedCommodity} | District: ${selectedDistrict}`,
          `Data Origin: ${livePrediction?.data_origin || 'sample_dataset_demonstration'}`,
          `Active Model: ${modelPerfData?.active_model || 'Random Forest Regressor'} (${modelPerfData?.active_version || 'v1.0.0'})`,
          `Current Modal Price: ₹${livePrediction?.current_modal_price ?? '—'}/kg`,
          `Next-Day Predicted: ₹${livePrediction?.predicted_next_day_price ?? '—'}/kg`,
          `7-Day Average: ₹${livePrediction?.predicted_7day_avg ?? '—'}/kg`,
          `30-Day Average: ₹${livePrediction?.predicted_30day_avg ?? '—'}/kg`,
          `Note: ${modelPerfData?.disclaimer || 'Demonstration metrics computed on offline sample agricultural price data.'}`,
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `KisanMandi_${selectedCommodity.replace(/\s+/g, '_')}_Summary.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setExportNotification(`Downloaded summary: KisanMandi_${selectedCommodity}_Summary.txt`);
      }
    } catch {
      setExportNotification(`Export failed for ${selectedCommodity}. Please retry.`);
    }
    setTimeout(() => setExportNotification(null), 4000);
  };

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
    { name: 'Tomato', score: '0.84', status: 'High Volatility', trend: 'Spike' },
    { name: 'Onion', score: '0.72', status: 'Elevated Volatility', trend: 'Fluctuating' },
    { name: 'Green Chilli', score: '0.65', status: 'Moderate Volatility', trend: 'Spike' },
    { name: 'Potato', score: '0.28', status: 'Stable', trend: 'Range-bound' },
  ];

  const abnormalArrivalMarkets = [
    { market: 'Vijayawada (AP)', commodity: 'Tomato', arrival: '1,420 qtl', change: '+142%', status: 'Surge Shock' },
    { market: 'Guntur (AP)', commodity: 'Onion', arrival: '320 qtl', change: '-64%', status: 'Supply Deficit' },
    { market: 'Lasalgaon (MH)', commodity: 'Onion', arrival: '8,500 qtl', change: '-48%', status: 'Unusual Low' },
  ];

  const explorerTableData = [
    { date: '2026-10-31', market: 'Guntur APMC', variety: 'Hybrid', min: '₹3,900', max: '₹4,700', modal: '₹4,500', arrivals: '1,120 t' },
    { date: '2026-10-30', market: 'Guntur APMC', variety: 'Hybrid', min: '₹3,800', max: '₹4,400', modal: '₹4,200', arrivals: '1,250 t' },
    { date: '2026-10-29', market: 'Guntur APMC', variety: 'Hybrid', min: '₹3,750', max: '₹4,300', modal: '₹4,100', arrivals: '1,380 t' },
    { date: '2026-10-28', market: 'Guntur APMC', variety: 'Hybrid', min: '₹3,600', max: '₹4,100', modal: '₹3,950', arrivals: '1,500 t' },
    { date: '2026-10-27', market: 'Vijayawada Mandi', variety: 'Local Desi', min: '₹3,800', max: '₹4,600', modal: '₹4,300', arrivals: '980 t' },
    { date: '2026-10-26', market: 'Kurnool Market', variety: 'Hybrid', min: '₹3,200', max: '₹3,800', modal: '₹3,600', arrivals: '1,850 t' },
  ];

  const apHeatmapMarkets = [
    { name: 'Vijayawada', district: 'NTR', priceQtl: 4550, change: '+12.4%', arrivals: '1,420 t', tier: 'HIGH', risk: 'High Price / Spurt Risk' },
    { name: 'Guntur', district: 'Guntur', priceQtl: 4500, change: '+18.2%', arrivals: '1,120 t', tier: 'HIGH', risk: 'High Price / Spike Alert' },
    { name: 'Visakhapatnam', district: 'Visakhapatnam', priceQtl: 4400, change: '+9.5%', arrivals: '850 t', tier: 'MODERATE', risk: 'Moderate / Watchlist' },
    { name: 'Tirupati', district: 'Tirupati', priceQtl: 4250, change: '+6.0%', arrivals: '910 t', tier: 'MODERATE', risk: 'Moderate Price' },
    { name: 'Rajahmundry', district: 'East Godavari', priceQtl: 4100, change: '+8.3%', arrivals: '740 t', tier: 'MODERATE', risk: 'Moderate Price' },
    { name: 'Bhimavaram', district: 'West Godavari', priceQtl: 3950, change: '+5.1%', arrivals: '620 t', tier: 'STABLE', risk: 'Stable / Equilibrium' },
    { name: 'Kurnool', district: 'Kurnool', priceQtl: 3600, change: '-2.4%', arrivals: '1,850 t', tier: 'STABLE', risk: 'Low Price / High Supply' },
    { name: 'Anantapur', district: 'Anantapur', priceQtl: 3500, change: '-4.1%', arrivals: '2,100 t', tier: 'STABLE', risk: 'Lowest Price Market' },
  ];

  const explorerSeries = [
    { label: 'D-14', price: 3400, arrival: 1600 },
    { label: 'D-12', price: 3500, arrival: 1550 },
    { label: 'D-10', price: 3650, arrival: 1400 },
    { label: 'D-8', price: 3800, arrival: 1320 },
    { label: 'D-6', price: 4100, arrival: 1100 },
    { label: 'D-4', price: 4250, arrival: 950 },
    { label: 'D-2', price: 4400, arrival: 890 },
    { label: 'Today', price: 4500, arrival: 820 },
    { label: 'D+2', price: 4550, arrival: 800 },
    { label: 'D+4', price: 4600, arrival: 790 },
    { label: 'D+6', price: 4700, arrival: 760 },
  ];

  const seasonalitySeries = [
    { m: 'Jan', val: 2400 },
    { m: 'Feb', val: 2300 },
    { m: 'Mar', val: 2600 },
    { m: 'Apr', val: 2900 },
    { m: 'May', val: 3400 },
    { m: 'Jun', val: 4100 },
    { m: 'Jul', val: 4800 },
    { m: 'Aug', val: 4500 },
    { m: 'Sep', val: 3900 },
    { m: 'Oct', val: 4600 },
    { m: 'Nov', val: 4400 },
    { m: 'Dec', val: 2900 },
  ];

  const supplyDemandSeries = [
    { arrival: '500T', price: 4900 },
    { arrival: '750T', price: 4600 },
    { arrival: '1000T', price: 4200 },
    { arrival: '1250T', price: 3900 },
    { arrival: '1500T', price: 3500 },
    { arrival: '1750T', price: 3200 },
    { arrival: '2000T', price: 2900 },
    { arrival: '2250T', price: 2700 },
  ];

  const volatilitySeries = [
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
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Global Filters */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Agri-Econometric Intelligence & Model Validation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Market Analyst Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Time-split forecasting, seasonality decomposition, supply elasticity, and holdout backtesting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleExportReport('csv')}
              className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV Export</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportReport('pdf')}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
            <button
              type="button"
              onClick={() => handleExportReport('summary')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Forecast Summary</span>
            </button>
          </div>
        </div>

        {/* Global Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div>
            <label htmlFor="analyst-commodity" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Commodity
            </label>
            <select
              id="analyst-commodity"
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-emerald-600 text-slate-900 dark:text-slate-100"
            >
              <option value="Tomato">Tomato (టొమాటో)</option>
              <option value="Onion">Onion (ఉల్లిపాయ)</option>
              <option value="Potato">Potato (బంగాళాదుంప)</option>
              <option value="Toor Dal">Toor Dal (కందిపప్పు)</option>
              <option value="Rice">Rice (బియ్యం)</option>
              <option value="Cotton">Raw Cotton (పత్తి)</option>
              <option value="Chilli">Dry Red Chilli (మిరప)</option>
            </select>
          </div>

          <div>
            <label htmlFor="analyst-scope" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Market / Scope
            </label>
            <select
              id="analyst-scope"
              value={selectedMarketScope}
              onChange={(e) => setSelectedMarketScope(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-emerald-600 text-slate-900 dark:text-slate-100"
            >
              <option value="All Andhra Pradesh">All Andhra Pradesh (State-wide)</option>
              <option value="Guntur Mandi">Guntur Wholesale APMC</option>
              <option value="Vijayawada Mandi">Vijayawada Mandi</option>
              <option value="Kurnool Mandi">Kurnool APMC</option>
              <option value="Lasalgaon (MH)">Lasalgaon APMC</option>
              <option value="National Index">National 28-State Index</option>
            </select>
          </div>

          <div>
            <label htmlFor="analyst-range" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Horizon Window
            </label>
            <select
              id="analyst-range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-emerald-600 text-slate-900 dark:text-slate-100"
            >
              <option value="Jan 2024 – Oct 2026">Jan 2024 – Oct 2026 (36 Months)</option>
              <option value="Last 12 Months">Last 12 Months (YoY Cycle)</option>
              <option value="Last 90 Days">Last 90 Days (Quarterly)</option>
              <option value="Next 30 Days">Next 30 Days Forecast</option>
            </select>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Price Basis
            </span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setPriceType('wholesale')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  priceType === 'wholesale'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Wholesale (₹/qtl)
              </button>
              <button
                type="button"
                onClick={() => setPriceType('retail')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  priceType === 'retail'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Retail (₹/kg)
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 tabular-nums">
          <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200 dark:border-rose-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                Top Volatile Market
              </span>
              <span className="text-base font-extrabold text-rose-900 dark:text-rose-200">Guntur</span>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-100 dark:bg-rose-900/80 px-2 py-1 rounded-md">
              +18.2% Swing
            </span>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Highest Forecast Rate
              </span>
              <span className="text-base font-extrabold text-emerald-900 dark:text-emerald-200">Vijayawada</span>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/80 px-2 py-1 rounded-md">
              ₹4,550 / qtl
            </span>
          </div>

          <div className="bg-sky-50 dark:bg-sky-950/30 p-3 rounded-xl border border-sky-200 dark:border-sky-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider block">
                Lowest Forecast Rate
              </span>
              <span className="text-base font-extrabold text-sky-900 dark:text-sky-200">Kurnool</span>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-100 dark:bg-sky-900/80 px-2 py-1 rounded-md">
              ₹3,600 / qtl
            </span>
          </div>
        </div>

        {exportNotification && (
          <div
            role="status"
            aria-live="polite"
            className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-xl flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportNotification}</span>
          </div>
        )}
      </div>

      {/* Section Tabs */}
      <div
        role="tablist"
        aria-label="Analyst views"
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-xs"
      >
        {[
          { id: 'home', label: 'A. Overview', icon: Activity },
          { id: 'explorer', label: 'B. Explorer', icon: Filter },
          { id: 'forecast', label: 'C. 30D Forecast', icon: TrendingUp },
          { id: 'seasonality', label: 'D. Seasonality', icon: Calendar },
          { id: 'supply_demand', label: 'E. Elasticity', icon: Layers },
          { id: 'heatmap', label: 'F. Heat Map', icon: MapPin },
          { id: 'volatility', label: 'G. Volatility', icon: ShieldAlert },
          { id: 'models', label: 'H. Models', icon: Award },
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION A: OVERVIEW */}
      {activeTab === 'home' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  National Commodity Overview & Macro Signals
                </h2>
                <p className="text-xs text-slate-500">
                  Aggregated indicators across 28 states & 12 core agricultural commodities.
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                {livePrediction?.is_demonstration_data === false ? 'Live SQLite Data' : 'Offline Benchmark Snapshot'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 tabular-nums">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Agri Food Index</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">148.4 pts</span>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                  <TrendingUp className="w-3 h-3" /> +2.1% MoM
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Daily Arrivals</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">42,850 T</span>
                <span className="text-[11px] text-rose-600 font-bold flex items-center gap-1 mt-0.5">
                  <TrendingDown className="w-3 h-3" /> -6.4% vs 7d avg
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Horticulture Inflation</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">11.8%</span>
                <span className="text-[11px] text-amber-600 font-bold mt-0.5 block">Elevated</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Inter-Market Spread</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">₹950 / qtl</span>
                <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">Max AP spread</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Top Price Gainers</h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                  Upward
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {topGainers.map((item) => (
                  <div key={item.commodity} className="py-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{item.commodity}</span>
                      <span className="text-[11px] text-slate-500">
                        {item.mandi} · {item.reason}
                      </span>
                    </div>
                    <div className="text-right tabular-nums shrink-0">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{item.price}</span>
                      <span className="text-[11px] font-bold text-emerald-600">{item.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Top Price Decliners</h3>
                </div>
                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-md">
                  Softening
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {topDecliners.map((item) => (
                  <div key={item.commodity} className="py-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{item.commodity}</span>
                      <span className="text-[11px] text-slate-500">
                        {item.mandi} · {item.reason}
                      </span>
                    </div>
                    <div className="text-right tabular-nums shrink-0">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{item.price}</span>
                      <span className="text-[11px] font-bold text-rose-600">{item.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Volatile Commodities</h3>
                </div>
                <span className="text-[11px] text-slate-500">GARCH Index</span>
              </div>
              <div className="space-y-2.5">
                {volatileCommodities.map((item) => (
                  <div key={item.name} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{item.name}</span>
                      <span className="text-[11px] text-slate-500">{item.status}</span>
                    </div>
                    <div className="text-right tabular-nums">
                      <span className="font-bold text-amber-600">{item.score}</span>
                      <span className="text-[10px] text-slate-500 block">{item.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Abnormal Arrivals</h3>
                </div>
                <span className="text-[11px] text-slate-500">Deviation &gt; 2.0σ</span>
              </div>
              <div className="space-y-2.5">
                {abnormalArrivalMarkets.map((item) => (
                  <div key={item.market} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">{item.market}</span>
                      <span className="text-[11px] text-slate-500">
                        {item.commodity} · Arrival: {item.arrival}
                      </span>
                    </div>
                    <div className="text-right tabular-nums">
                      <span className={`font-bold ${item.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.change}
                      </span>
                      <span className="text-[10px] text-slate-500 block">{item.status}</span>
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
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span>Mandi Filter Engine</span>
              </h2>
              <div className="flex items-center gap-1.5">
                {(['daily', 'weekly', 'monthly'] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframeView(tf)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase ${
                      timeframeView === tf
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label htmlFor="exp-state" className="block text-[11px] font-bold text-slate-500 mb-1">State</label>
                <select id="exp-state" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-semibold">
                  <option>Andhra Pradesh</option>
                  <option>Maharashtra</option>
                  <option>Karnataka</option>
                  <option>Uttar Pradesh</option>
                </select>
              </div>
              <div>
                <label htmlFor="exp-dist" className="block text-[11px] font-bold text-slate-500 mb-1">District</label>
                <select
                  id="exp-dist"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-semibold"
                >
                  <option value="Guntur">Guntur</option>
                  <option value="NTR">NTR (Vijayawada)</option>
                  <option value="Kurnool">Kurnool</option>
                  <option value="West Godavari">West Godavari</option>
                </select>
              </div>
              <div>
                <label htmlFor="exp-mkt" className="block text-[11px] font-bold text-slate-500 mb-1">Market</label>
                <select id="exp-mkt" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-semibold">
                  <option>Guntur APMC Mandi</option>
                  <option>Vijayawada Market Yard</option>
                  <option>Kurnool Rythu Yard</option>
                </select>
              </div>
              <div>
                <label htmlFor="exp-comm" className="block text-[11px] font-bold text-slate-500 mb-1">Commodity</label>
                <select id="exp-comm" value={selectedCommodity} onChange={(e) => setSelectedCommodity(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-semibold">
                  <option>Tomato</option>
                  <option>Onion</option>
                  <option>Potato</option>
                  <option>Toor Dal</option>
                </select>
              </div>
              <div>
                <label htmlFor="exp-var" className="block text-[11px] font-bold text-slate-500 mb-1">Variety</label>
                <select
                  id="exp-var"
                  value={selectedVariety}
                  onChange={(e) => setSelectedVariety(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-semibold"
                >
                  <option value="Hybrid / Desi">Hybrid / Desi</option>
                  <option value="Local Country">Local Country</option>
                  <option value="Nasik Red">Nasik Red</option>
                </select>
              </div>
              <div>
                <label htmlFor="exp-basis" className="block text-[11px] font-bold text-slate-500 mb-1">Quotation</label>
                <select
                  id="exp-basis"
                  value={priceType}
                  onChange={(e) => setPriceType(e.target.value as 'wholesale' | 'retail')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 font-semibold"
                >
                  <option value="wholesale">Wholesale (₹/qtl)</option>
                  <option value="retail">Retail (₹/kg)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {selectedCommodity} {timeframeView.toUpperCase()} Price vs Arrivals ({selectedDistrict})
                </h3>
                <p className="text-xs text-slate-500">Modal wholesale rate (₹/qtl) alongside daily arrival volume (Tonnes).</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-emerald-600 rounded-xs" /> Modal Price (₹/qtl)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-sky-400 rounded-xs" /> Arrivals (Tonnes)
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <svg viewBox="0 0 680 210" className="w-full h-52" role="img" aria-label="Dual metric modal price and arrivals chart">
                {[0, 0.5, 1].map((frac, idx) => {
                  const y = 20 + 150 * (1 - frac);
                  const val = Math.round(5000 * frac);
                  return (
                    <g key={idx}>
                      <line x1={48} y1={y} x2={660} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeDasharray="3 3" />
                      <text x={42} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px] font-mono">
                        ₹{val}
                      </text>
                    </g>
                  );
                })}
                {explorerSeries.map((pt, i) => {
                  const groupX = 64 + i * 54;
                  const pH = (pt.price / 5000) * 150;
                  const aH = (pt.arrival / 2000) * 150;
                  return (
                    <g key={pt.label}>
                      <rect x={groupX} y={170 - aH} width={16} height={aH} rx={3} className="fill-sky-400/80">
                        <title>{`${pt.label} Arrivals: ${pt.arrival} T`}</title>
                      </rect>
                      <rect x={groupX + 18} y={170 - pH} width={16} height={pH} rx={3} className={pt.label.startsWith('D+') ? 'fill-emerald-500' : 'fill-emerald-700'}>
                        <title>{`${pt.label} Price: ₹${pt.price}/qtl`}</title>
                      </rect>
                      <text x={groupX + 17} y={192} textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
                        {pt.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                APMC Modal Price Ledger & Arrival Records
              </h3>
              <button
                type="button"
                onClick={() => handleExportReport('csv')}
                className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs tabular-nums">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Market</th>
                    <th className="py-2.5 px-3">Variety</th>
                    <th className="py-2.5 px-3 text-right">Min</th>
                    <th className="py-2.5 px-3 text-right">Max</th>
                    <th className="py-2.5 px-3 text-right">Modal</th>
                    <th className="py-2.5 px-3 text-right">Arrivals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {explorerTableData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">{row.date}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{row.market}</td>
                      <td className="py-2.5 px-3 text-slate-500">{row.variety}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">{row.min}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">{row.max}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">{row.modal}</td>
                      <td className="py-2.5 px-3 text-right text-sky-700 dark:text-sky-400 font-semibold">{row.arrivals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION C: 30D FORECAST ANALYSIS */}
      {activeTab === 'forecast' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Multi-Horizon Price Forecasts & Confidence Bounds ({selectedCommodity} — {selectedMarketScope})
            </h2>
            <p className="text-xs text-slate-500">
              1-day, 7-day, and 30-day iterative forecasts generated by local Python ML pipeline.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2 flex-wrap">
            <span>
              <strong>Data Origin:</strong>{' '}
              {livePrediction?.is_demonstration_data === false
                ? 'Live / Uploaded Agricultural Records'
                : 'Offline Sample Dataset (Academic Demonstration Benchmark)'}
            </span>
            <span className="font-mono text-[11px]">
              Engine: {livePrediction?.model_name || 'Random Forest Regressor'} ({livePrediction?.model_version || 'v1.0.0'})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 tabular-nums">
            {(() => {
              const curQtl = Math.round((livePrediction?.current_modal_price ?? 40) * 100);
              const nextQtl = Math.round((livePrediction?.predicted_next_day_price ?? 41) * 100);
              const avg7Qtl = Math.round((livePrediction?.predicted_7day_avg ?? 42) * 100);
              const avg30Qtl = Math.round((livePrediction?.predicted_30day_avg ?? avg7Qtl / 100) * 100);
              const ciLowQtl = Math.round((livePrediction?.confidence_interval?.[0] ?? 38) * 100);
              const ciHighQtl = Math.round((livePrediction?.confidence_interval?.[1] ?? 44) * 100);
              const drift1 = curQtl > 0 ? (((nextQtl - curQtl) / curQtl) * 100).toFixed(1) : '0.0';
              const drift7 = curQtl > 0 ? (((avg7Qtl - curQtl) / curQtl) * 100).toFixed(1) : '0.0';
              const drift30 = curQtl > 0 ? (((avg30Qtl - curQtl) / curQtl) * 100).toFixed(1) : '0.0';

              return (
                <>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Next-Day Forecast (D+1)
                    </span>
                    <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                      ₹{nextQtl.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ qtl</span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                      <div className="flex justify-between">
                        <span>95% CI Range:</span>
                        <span className="font-bold">₹{ciLowQtl.toLocaleString()} – ₹{ciHighQtl.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expected Drift:</span>
                        <span className={`font-bold ${Number(drift1) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {Number(drift1) >= 0 ? `+${drift1}%` : `${drift1}%`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      7-Day Mean Forecast (D+1..7)
                    </span>
                    <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                      ₹{avg7Qtl.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ qtl</span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Current Modal:</span>
                        <span className="font-bold">₹{curQtl.toLocaleString()}/qtl</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expected Drift:</span>
                        <span className={`font-bold ${Number(drift7) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {Number(drift7) >= 0 ? `+${drift7}%` : `${drift7}%`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      30-Day Mean Forecast (D+1..30)
                    </span>
                    <div className="text-2xl font-extrabold text-sky-700 dark:text-sky-400">
                      ₹{avg30Qtl.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ qtl</span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Horizon Points:</span>
                        <span className="font-bold">{livePrediction?.daily_forecasts?.length ?? 30} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expected Drift:</span>
                        <span className={`font-bold ${Number(drift30) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {Number(drift30) >= 0 ? `+${drift30}%` : `${drift30}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold flex-wrap gap-2">
              <span className="text-slate-700 dark:text-slate-300">
                Backtest (Actual vs Predicted) & Multi-Day Forecast — {selectedCommodity} (₹/qtl)
              </span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-slate-600 rounded-xs" /> Actual Holdout
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 bg-emerald-600 rounded-xs" /> Predicted
                </span>
              </div>
            </div>

            {(() => {
              const bt = (modelPerfData?.backtesting_results || []).slice(-6).map((b) => ({
                d: b.date.slice(5),
                act: Math.round(b.actual * 100),
                pred: Math.round(b.predicted * 100),
              }));
              const fc = (livePrediction?.daily_forecasts || []).filter((_, i) => i % 5 === 0).slice(0, 6).map((f) => ({
                d: `+${f.day}d`,
                act: 0,
                pred: Math.round(f.predicted_price * 100),
              }));
              const pts = [...bt, ...fc];
              const maxVal = Math.max(1000, ...pts.map((p) => Math.max(p.act, p.pred))) * 1.1;

              return (
                <svg viewBox="0 0 680 190" className="w-full h-48" role="img" aria-label="Backtest and 30-day forecast bar comparison">
                  {[0, 0.5, 1].map((frac, idx) => {
                    const y = 16 + 136 * (1 - frac);
                    return (
                      <g key={idx}>
                        <line x1={48} y1={y} x2={664} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeDasharray="3 3" />
                        <text x={42} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px] font-mono">
                          ₹{Math.round(maxVal * frac)}
                        </text>
                      </g>
                    );
                  })}
                  {pts.map((pt, i) => {
                    const step = 600 / Math.max(1, pts.length);
                    const gx = 58 + i * step;
                    const actH = pt.act > 0 ? (pt.act / maxVal) * 136 : 0;
                    const predH = (pt.pred / maxVal) * 136;
                    return (
                      <g key={i}>
                        {pt.act > 0 && (
                          <rect x={gx} y={152 - actH} width={14} height={actH} rx={2} className="fill-slate-600">
                            <title>{`${pt.d} Actual: ₹${pt.act}/qtl`}</title>
                          </rect>
                        )}
                        <rect x={pt.act > 0 ? gx + 16 : gx + 8} y={152 - predH} width={14} height={predH} rx={2} className="fill-emerald-600">
                          <title>{`${pt.d} Predicted: ₹${pt.pred}/qtl`}</title>
                        </rect>
                        <text x={gx + 15} y={174} textAnchor="middle" className="fill-slate-500 text-[9px] font-mono">
                          {pt.d}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Empirical Holdout Error Summary ({modelPerfData?.active_model || 'Random Forest Regressor'})
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center text-xs tabular-nums">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block uppercase">Holdout MAE</span>
                <span className="font-bold text-emerald-600">
                  ₹{modelPerfData?.models?.find((m) => m.is_active)?.mae ?? '—'}/kg
                </span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block uppercase">Holdout RMSE</span>
                <span className="font-bold text-amber-600">
                  ₹{modelPerfData?.models?.find((m) => m.is_active)?.rmse ?? '—'}/kg
                </span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block uppercase">Holdout MAPE</span>
                <span className="font-bold text-sky-600">
                  {modelPerfData?.models?.find((m) => m.is_active)?.mape ?? '—'}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION D: SEASONALITY */}
      {activeTab === 'seasonality' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Seasonality & Multi-Year Price Behavior ({selectedCommodity})
            </h2>
            <p className="text-xs text-slate-500">Monthly price cycles across winter harvests, monsoon supply lean months, and festivals.</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <svg viewBox="0 0 680 190" className="w-full h-48" role="img" aria-label="12-month seasonality price chart">
              {[0, 0.5, 1].map((frac, idx) => {
                const y = 16 + 136 * (1 - frac);
                return (
                  <g key={idx}>
                    <line x1={48} y1={y} x2={664} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeDasharray="3 3" />
                    <text x={42} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px] font-mono">
                      ₹{Math.round(5000 * frac)}
                    </text>
                  </g>
                );
              })}
              {seasonalitySeries.map((item, i) => {
                const x = 62 + i * 50;
                const h = (item.val / 5000) * 136;
                const cls = item.val >= 4400 ? 'fill-rose-500' : item.val <= 2500 ? 'fill-emerald-600' : 'fill-amber-500';
                return (
                  <g key={item.m}>
                    <rect x={x} y={152 - h} width={28} height={h} rx={4} className={cls}>
                      <title>{`${item.m}: ₹${item.val}/qtl`}</title>
                    </rect>
                    <text x={x + 14} y={174} textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
                      {item.m}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900 space-y-1">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block">Seasonal Low Months</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">January – February</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">Peak winter Rabi harvest arrivals expand mandi supplies.</p>
            </div>
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900 space-y-1">
              <span className="font-bold text-rose-800 dark:text-rose-300 block">Seasonal High Months</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">June – July (Monsoon)</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">Lean pre-monsoon supply and transport disruptions tighten stock.</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 space-y-1">
              <span className="font-bold text-amber-800 dark:text-amber-300 block">Festival Surges</span>
              <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">October – November</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">Institutional and household festive demand lifts modal bids.</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION E: SUPPLY-DEMAND */}
      {activeTab === 'supply_demand' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Supply-Demand Elasticity & Environmental Drivers ({selectedCommodity})
            </h2>
            <p className="text-xs text-slate-500">Inverse relationship between daily mandi arrival tonnage and auction price discovery.</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Arrival Volume (Tonnes) vs Modal Price (₹/qtl)</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-mono">Elasticity: -1.42</span>
            </div>

            <svg viewBox="0 0 680 185" className="w-full h-44" role="img" aria-label="Supply-demand inverse price curve">
              {[0, 0.5, 1].map((frac, idx) => {
                const y = 16 + 130 * (1 - frac);
                return (
                  <g key={idx}>
                    <line x1={48} y1={y} x2={664} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeDasharray="3 3" />
                    <text x={42} y={y + 4} textAnchor="end" className="fill-slate-500 text-[10px] font-mono">
                      ₹{Math.round(5000 * frac)}
                    </text>
                  </g>
                );
              })}
              {supplyDemandSeries.map((item, i) => {
                const x = 70 + i * 74;
                const h = (item.price / 5000) * 130;
                return (
                  <g key={item.arrival}>
                    <rect x={x} y={146 - h} width={36} height={h} rx={4} className="fill-emerald-600">
                      <title>{`${item.arrival}: ₹${item.price}/qtl`}</title>
                    </rect>
                    <text x={x + 18} y={168} textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
                      {item.arrival}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-900 space-y-2">
              <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold text-xs">
                <CloudRain className="w-4 h-4" />
                <span>Rainfall Correlation (-0.68)</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Extreme rain events delay harvest transport while drought spells curb irrigated acreage yield.
              </p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <Thermometer className="w-4 h-4" />
                <span>Temperature Sensitivity (+0.54)</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Sustained heat above 36°C accelerates perishability and tightens marketable grade-A stock.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION F: MARKET HEAT MAP */}
      {activeTab === 'heatmap' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Regional Market Price Heat Map</span>
              </h2>
              <p className="text-xs text-slate-500">Tier classification: High Price Pressure, Moderate Watchlist, Stable Supply.</p>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs tabular-nums">
              <span className="text-slate-500 text-[10px] block uppercase font-bold">State Price Spread</span>
              <span className="font-extrabold text-emerald-700 dark:text-emerald-400">₹1,050 / qtl</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 tabular-nums">
            {apHeatmapMarkets.map((m) => {
              const borderClass =
                m.tier === 'HIGH'
                  ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'
                  : m.tier === 'MODERATE'
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20'
                  : 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20';

              const badgeClass =
                m.tier === 'HIGH'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                  : m.tier === 'MODERATE'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';

              return (
                <div key={m.name} className={`p-4 rounded-xl border space-y-2 ${borderClass}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{m.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeClass}`}>
                      {m.tier}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{m.district} · Arrivals: {m.arrivals}</div>
                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-200/70 dark:border-slate-800">
                    <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                      ₹{m.priceQtl.toLocaleString()}
                    </span>
                    <span className={`text-xs font-bold ${m.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {m.change}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">{m.risk}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION G: VOLATILITY & ANOMALIES */}
      {activeTab === 'volatility' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Volatility Clustering & Anomaly Detection</span>
            </h2>
            <p className="text-xs text-slate-500">Daily return swings flagging abnormal spikes and arrival shocks.</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Daily % Rate of Change</span>
              <span className="text-rose-600 font-mono">Volatility Score: 0.84 (Elevated)</span>
            </div>

            <svg viewBox="0 0 680 185" className="w-full h-44" role="img" aria-label="Daily percentage price change volatility chart">
              <line x1={48} y1={85} x2={664} y2={85} stroke="#94a3b8" strokeWidth="1" />
              {volatilitySeries.map((item, i) => {
                const x = 62 + i * 60;
                const h = Math.min(72, Math.abs(item.delta) * 4.6);
                const y = item.delta >= 0 ? 85 - h : 85;
                const cls = item.flag === 'Spike' ? 'fill-rose-600' : item.flag === 'Crash' ? 'fill-amber-600' : item.delta >= 0 ? 'fill-emerald-600' : 'fill-rose-400';
                return (
                  <g key={item.d}>
                    <rect x={x} y={y} width={28} height={Math.max(4, h)} rx={3} className={cls}>
                      <title>{`${item.d}: ${item.delta > 0 ? `+${item.delta}%` : `${item.delta}%`}`}</title>
                    </rect>
                    <text x={x + 14} y={172} textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
                      {item.d}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-bold">
                <Zap className="w-3.5 h-3.5" />
                <span>Spike Detected</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Guntur Mandi (Tomato)</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">+18.2% move exceeding 2σ seasonal band.</p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Downside Pressure</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Kurnool APMC (Onion)</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">-12.5% pullback following heavy arrival cluster.</p>
            </div>
            <div className="p-4 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-800 space-y-1">
              <div className="flex items-center gap-1.5 text-sky-800 dark:text-sky-300 font-bold">
                <Activity className="w-3.5 h-3.5" />
                <span>Arrival Deviation</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Vijayawada Mandi</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">Daily arrival 1,420 T (+142% vs rolling baseline).</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION H: MODEL PERFORMANCE */}
      {activeTab === 'models' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Model Performance, Backtesting & Leaderboard</span>
              </h2>
              <p className="text-xs text-slate-500">
                Chronological time-split evaluation across Random Forest Regressor, Multiple Linear Regression, and 7-Day SMA Baseline.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Feature Set:</span>
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono font-bold">
                {modelPerfData?.feature_set_version || 'v2.2.0'}
              </span>
            </div>
          </div>

          {modelPerfData?.disclaimer && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
              <strong>Academic Transparency Note:</strong> {modelPerfData.disclaimer}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs tabular-nums text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3">Model Architecture</th>
                  <th className="py-3 px-3 text-right">MAE (₹/kg)</th>
                  <th className="py-3 px-3 text-right">RMSE (₹/kg)</th>
                  <th className="py-3 px-3 text-right">MAPE</th>
                  <th className="py-3 px-3 text-right">R² Score</th>
                  <th className="py-3 px-3 text-right">Directional Acc.</th>
                  <th className="py-3 px-3">Latency</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(modelPerfData?.models || []).length > 0 ? (
                  modelPerfData!.models.map((mod) => (
                    <tr key={mod.model_name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {mod.model_name} ({mod.version})
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">₹{mod.mae}</td>
                      <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300">₹{mod.rmse}</td>
                      <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 font-bold">{mod.mape}%</td>
                      <td className="py-3 px-3 text-right font-extrabold text-emerald-700 dark:text-emerald-400">{mod.r_squared}</td>
                      <td className="py-3 px-3 text-right text-emerald-600 font-bold">{mod.directional_accuracy}%</td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">{mod.latency_ms}ms</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            mod.is_active
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                              : mod.is_baseline
                              ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {mod.is_active ? 'ACTIVE MODEL' : mod.is_baseline ? 'BASELINE' : 'CANDIDATE'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">
                      Loading holdout metrics from local Python ML engine...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Out-of-Sample Time-Split Backtesting Verification</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Last Trained: {modelPerfData?.last_retrained ? new Date(modelPerfData.last_retrained).toLocaleDateString() : 'Local cache'}
              </span>
            </div>

            {modelPerfData?.backtesting_results && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1 tabular-nums text-center">
                {modelPerfData.backtesting_results.map((bt) => (
                  <div key={bt.date} className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 block">{bt.date.slice(5)}</span>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">₹{bt.actual} act</div>
                    <div className="text-xs font-bold text-emerald-600">₹{bt.predicted} pred</div>
                    <span className={`text-[10px] font-semibold block ${bt.error >= 0 ? 'text-sky-600' : 'text-amber-600'}`}>
                      Δ {bt.error >= 0 ? `+₹${bt.error}` : `-₹${Math.abs(bt.error)}`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Training Period (70%)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {modelPerfData?.experimental_periods?.training_period || 'First 70% window'}
                </span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Validation Period (15%)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {modelPerfData?.experimental_periods?.validation_period || 'Middle 15% window'}
                </span>
              </div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Test Holdout Period (15%)</span>
                <span className="font-mono font-bold text-emerald-600">
                  {modelPerfData?.experimental_periods?.test_period || 'Final 15% holdout'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
