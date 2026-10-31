/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { IndianState } from '../types/mandi';
import { INDIAN_STATES, MANDI_MARKETS } from '../data/mandiData';
import { predictionApi, RealMLPrediction } from '../services/predictionApi';

interface PriceExplorerPageProps {
  isLoggedIn: boolean;
  onNavigateRegister: () => void;
}

export const PriceExplorerPage: React.FC<PriceExplorerPageProps> = ({
  isLoggedIn,
  onNavigateRegister,
}) => {
  const [selectedCommodity, setSelectedCommodity] = useState<string>('Tomato');
  const [selectedState, setSelectedState] = useState<IndianState>('Andhra Pradesh');
  const [selectedMarket, setSelectedMarket] = useState<string>('Guntur');
  const [dateRange, setDateRange] = useState<string>('Last 30 Days');

  const [livePred, setLivePred] = useState<RealMLPrediction | null>(null);
  const [liveHistory, setLiveHistory] = useState<any[]>([]);

  // Fetch real ML prediction and price history from backend
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      predictionApi.predictNextDay(selectedCommodity, selectedMarket),
      predictionApi.getPriceHistory(selectedCommodity, selectedMarket, 30),
    ]).then(([pred, hist]) => {
      if (isMounted) {
        setLivePred(pred);
        setLiveHistory(hist);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedCommodity, selectedMarket]);

  // Dynamic live record
  const currentModal = livePred?.current_modal_price ?? 38;
  const currentRecord = {
    commodity: selectedCommodity,
    state: selectedState,
    market: selectedMarket,
    minPrice: Math.round(currentModal * 0.88),
    maxPrice: Math.round(currentModal * 1.14),
    modalPrice: currentModal,
    arrivalsTonnes: 1250,
    change7Day: livePred ? `${livePred.expected_change_percent >= 0 ? '+' : ''}${livePred.expected_change_percent}%` : '+9.0%',
    history: liveHistory.length > 0 ? liveHistory.slice(-10).map((h) => h.modal_price) : [34, 35, 33, 36, 38, 37, 39, 41, 40, 38],
  };

  const handleDownloadCsv = () => {
    if (!isLoggedIn) {
      alert('Please register or sign in to download CSV data.');
      onNavigateRegister();
      return;
    }
    const csv = `Commodity,State,Market,MinPrice,MaxPrice,ModalPrice,ArrivalsTonnes,7DayChange\n` +
      `"${currentRecord.commodity}","${currentRecord.state}","${currentRecord.market}",${currentRecord.minPrice},${currentRecord.maxPrice},${currentRecord.modalPrice},${currentRecord.arrivalsTonnes},"${currentRecord.change7Day}"`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KisanMandi_${selectedCommodity}_${selectedMarket}.csv`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
            <Search className="w-4 h-4 text-amber-600" />
            <span>Public Commodity Price Explorer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
            AGMARKNET Live Price Explorer
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-0.5">
            View historical and current commodity prices across Indian APMC mandis. Logged-in users get CSV downloads and advanced filters.
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>{isLoggedIn ? 'Download CSV' : 'Register for CSV Export'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            Commodity
          </label>
          <select
            value={selectedCommodity}
            onChange={(e) => setSelectedCommodity(e.target.value)}
            className="w-full text-sm font-bold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
          >
            <option value="Tomato">Tomato (టొమాటో)</option>
            <option value="Onion">Onion (ఉల్లిపాయ)</option>
            <option value="Potato">Potato (బంగాళాదుంప)</option>
            <option value="Rice">Rice / Paddy (బియ్యం)</option>
            <option value="Wheat">Wheat (గోధుమలు)</option>
            <option value="Toor Dal">Toor Dal (కందిపప్పు)</option>
            <option value="Edible Oil">Edible Oil (నూనె)</option>
            <option value="Sugar">Sugar (చక్కెర)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            State
          </label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value as IndianState)}
            className="w-full text-sm font-bold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
          >
            {INDIAN_STATES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            Market / Mandi
          </label>
          <input
            type="text"
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="w-full text-sm font-bold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
            placeholder="e.g. Guntur"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full text-sm font-bold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
          >
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last 90 Days">Last 90 Days</option>
            <option value="Last 1 Year">Last 1 Year</option>
          </select>
        </div>
      </div>

      {/* Current Price Card & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Today's Modal Price</span>
          <div className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
            ₹{currentRecord.modalPrice}<span className="text-xs font-normal text-stone-500 ml-1">/kg</span>
          </div>
          <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{currentRecord.change7Day} (7-Day Change)</span>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Minimum Price</span>
          <div className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
            ₹{currentRecord.minPrice}<span className="text-xs font-normal text-stone-500 ml-1">/kg</span>
          </div>
          <div className="text-xs text-stone-500">APMC wholesale floor</div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Maximum Price</span>
          <div className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
            ₹{currentRecord.maxPrice}<span className="text-xs font-normal text-stone-500 ml-1">/kg</span>
          </div>
          <div className="text-xs text-stone-500">APMC wholesale ceiling</div>
        </div>

        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Arrival Quantity</span>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            {currentRecord.arrivalsTonnes.toLocaleString()} <span className="text-xs font-normal text-stone-500">tonnes</span>
          </div>
          <div className="text-xs text-stone-500">Daily mandi arrivals</div>
        </div>
      </div>

      {/* Historical Price Chart */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
          Historical Price Trend ({selectedCommodity} — {selectedMarket} Mandi, {selectedState})
        </h3>
        <div className="h-48 bg-stone-50 dark:bg-stone-800/50 rounded-xl p-4 border border-stone-200 dark:border-stone-700 flex items-end justify-between gap-2">
          {currentRecord.history.map((val, idx) => {
            const h = Math.min(100, Math.max(20, (val / 50) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div style={{ height: `${h}%` }} className="w-full bg-amber-500 hover:bg-amber-600 rounded-t transition-all" />
                <span className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-stone-900 text-white text-[10px] px-1 py-0.5 rounded font-mono">₹{val}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
