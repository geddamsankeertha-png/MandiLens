import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Share2,
  Mail,
  MessageSquare,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Radio,
  Download,
  Filter,
  Check,
  Calculator,
  RefreshCw,
  Search,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { IndianState, PredictionResult, IndianRegion, CropGroup } from '../types/mandi';
import { INDIAN_STATES, MANDI_MARKETS, STATE_METADATA } from '../data/mandiData';
import { predictAllGroupsForMarket } from '../services/predictiveEngine';
import { addToWatchlist, removeFromWatchlist } from '../services/marketSyncService';

interface MandiMarketViewProps {
  initialState?: IndianState;
  initialMarket?: string;
  watchlistIds: string[];
  onWatchlistChange: () => void;
  onNavigateToCalculator?: (group: string) => void;
  onNavigateToLive?: () => void;
}

export const MandiMarketView: React.FC<MandiMarketViewProps> = ({
  initialState = 'Maharashtra',
  initialMarket = 'Satara',
  watchlistIds,
  onWatchlistChange,
  onNavigateToCalculator,
  onNavigateToLive,
}) => {
  const [selectedState, setSelectedState] = useState<IndianState>(initialState);
  const [selectedMarket, setSelectedMarket] = useState<string>(initialMarket);
  const [selectedRegion, setSelectedRegion] = useState<IndianRegion | 'All'>('All');
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [priceUnit, setPriceUnit] = useState<'quintal' | 'tonne'>('quintal');
  const [activeModal, setActiveModal] = useState<'sms' | 'email' | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Filtered states by region
  const filteredStates = selectedRegion === 'All'
    ? INDIAN_STATES
    : INDIAN_STATES.filter((s) => STATE_METADATA[s]?.region === selectedRegion);

  // Available markets for current state
  const availableMarkets = MANDI_MARKETS.filter((m) => m.state === selectedState);

  // Handle state change
  const handleStateChange = (newState: IndianState) => {
    setSelectedState(newState);
    const newMarkets = MANDI_MARKETS.filter((m) => m.state === newState);
    if (newMarkets.length > 0) {
      setSelectedMarket(newMarkets[0].name);
    }
  };

  // Re-run predictions whenever state or market changes
  useEffect(() => {
    const marketObj = availableMarkets.find((m) => m.name === selectedMarket) || availableMarkets[0];
    if (marketObj) {
      const pred = predictAllGroupsForMarket(selectedState, marketObj.name);
      setResults(pred);
    }
  }, [selectedState, selectedMarket]);

  // Is bookmarked in watchlist?
  const watchlistKey = `wl_${selectedState.toLowerCase().replace(/\s+/g, '_')}_${selectedMarket.toLowerCase().replace(/\s+/g, '_')}`;
  const isBookmarked = watchlistIds.includes(watchlistKey);

  const handleToggleBookmark = async () => {
    if (isBookmarked) {
      await removeFromWatchlist(watchlistKey);
    } else {
      await addToWatchlist({
        state: selectedState,
        market: selectedMarket,
        targetPrice: 200,
        alertCondition: 'above',
      });
    }
    onWatchlistChange();
  };

  // Share text advisory for SMS / Email
  const shareText = `[KisanMandi Advisory]\nMarket: ${selectedMarket} Mandi, ${selectedState}\n` +
    results
      .slice(0, 5)
      .map(
        (r) =>
          `• ${r.group}: ₹${(priceUnit === 'quintal' ? r.pricePerQuintal : r.pricePerTonne).toFixed(0)} (${r.momChangePercent > 0 ? '+' : ''}${r.momChangePercent}%)`
      )
      .join('\n') +
    `\nUnit: ${priceUnit === 'quintal' ? '₹/Quintal' : '₹/Tonne'}\nVerified via KisanMandi APMC Intelligence.`;

  const handleCopyAdvisory = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  // Export CSV of predictions
  const handleExportCSV = () => {
    const headers = ['Crop Group', 'State', 'Market', `Predicted Price (${priceUnit})`, 'Lower 95% Bound', 'Upper 95% Bound', 'MoM % Change'];
    const rows = results.map((r) => [
      `"${r.group}"`,
      `"${selectedState}"`,
      `"${selectedMarket}"`,
      priceUnit === 'quintal' ? r.pricePerQuintal.toFixed(2) : r.pricePerTonne.toFixed(2),
      priceUnit === 'quintal' ? r.lowerBoundQuintal.toFixed(2) : (r.lowerBoundQuintal * 10).toFixed(2),
      priceUnit === 'quintal' ? r.upperBoundQuintal.toFixed(2) : (r.upperBoundQuintal * 10).toFixed(2),
      r.momChangePercent.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `KisanMandi_${selectedState}_${selectedMarket}_Rates.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered rows by search term
  const displayedResults = searchFilter.trim()
    ? results.filter((r) => r.group.toLowerCase().includes(searchFilter.toLowerCase()))
    : results;

  const currentMarketMeta = availableMarkets.find((m) => m.name === selectedMarket) || availableMarkets[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Unit Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Pan-India APMC Market Intelligence</span>
            <span className="text-stone-400">·</span>
            <span>All 28 Indian States</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 mt-1">
            {selectedMarket} Mandi Rate Benchmarks
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-0.5">
            Logarithmic Multiple Linear Regression predictions across 13 primary crop groups with 95% confidence intervals.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Unit Toggle */}
          <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-medium">
            <button
              onClick={() => setPriceUnit('quintal')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                priceUnit === 'quintal'
                  ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              ₹ / Quintal (100 kg)
            </button>
            <button
              onClick={() => setPriceUnit('tonne')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                priceUnit === 'tonne'
                  ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              ₹ / Tonne (1,000 kg)
            </button>
          </div>

          {/* Bookmark Button */}
          <button
            onClick={handleToggleBookmark}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              isBookmarked
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50'
            }`}
          >
            {isBookmarked ? (
              <>
                <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                <span>Tracked in Watchlist</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 text-stone-400" />
                <span>Track Mandi</span>
              </>
            )}
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Live Commodities API Link */}
          {onNavigateToLive && (
            <button
              onClick={onNavigateToLive}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl border border-emerald-300 dark:border-emerald-700 transition-colors shadow-xs"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Live Spot Rates (API)</span>
            </button>
          )}
        </div>
      </div>

      {/* 28 States Selector & Regional Filter */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
              Filter by Indian Region & Select State:
            </span>
          </div>

          {/* Regional Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs font-medium no-scrollbar">
            {(['All', 'North', 'South', 'West', 'East', 'Central', 'North-East'] as const).map((reg) => (
              <button
                key={reg}
                onClick={() => {
                  setSelectedRegion(reg);
                  const firstMatching = reg === 'All' ? INDIAN_STATES[0] : INDIAN_STATES.find((s) => STATE_METADATA[s]?.region === reg);
                  if (firstMatching) handleStateChange(firstMatching);
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap shrink-0 text-xs ${
                  selectedRegion === reg
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900'
                }`}
              >
                {reg === 'All' ? 'All 28 States' : `${reg} India`}
              </button>
            ))}
          </div>
        </div>

        {/* 28 State Buttons Scroller */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {filteredStates.map((st) => (
            <button
              key={st}
              onClick={() => handleStateChange(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 border transition-all ${
                selectedState === st
                  ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-sm'
                  : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Mandi APMC Market Selector & Agro-Climatic Profile */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t border-stone-100 dark:border-stone-800 items-center">
          <div className="md:col-span-5 flex items-center gap-3">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider shrink-0">
              Select APMC Mandi:
            </label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="flex-1 text-sm font-semibold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2 px-3 focus:ring-2 focus:ring-amber-500 focus:outline-none text-stone-900 dark:text-stone-100"
            >
              {availableMarkets.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name} Mandi ({m.state})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-7 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/40 p-2.5 rounded-xl border border-stone-200 dark:border-stone-700">
            <div>
              <span className="text-stone-400">Zone:</span>{' '}
              <strong className="text-stone-800 dark:text-stone-200">{STATE_METADATA[selectedState]?.region} India</strong>
            </div>
            <div>
              <span className="text-stone-400">Annual Trade:</span>{' '}
              <strong className="text-stone-800 dark:text-stone-200 font-mono">
                {currentMarketMeta?.totalArrivalsAnnualTonne.toLocaleString()} T
              </strong>
            </div>
            <div>
              <span className="text-stone-400">Rainfall:</span>{' '}
              <strong className="text-stone-800 dark:text-stone-200 font-mono">
                {currentMarketMeta?.averageRainfallMm} mm
              </strong>
            </div>
            <div className="truncate">
              <span className="text-stone-400">Major Crops:</span>{' '}
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                {STATE_METADATA[selectedState]?.majorCrops.slice(0, 3).join(', ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Results Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        {/* Table Filter & Advisory Controls Header */}
        <div className="p-4 bg-stone-50/70 dark:bg-stone-800/40 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search 13 crop groups (e.g. Cereals, Onion)..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModal('sms')}
              className="px-3 py-1.5 text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg border border-stone-200 dark:border-stone-700 transition-colors flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>SMS Advisory</span>
            </button>
            <button
              onClick={() => setActiveModal('email')}
              className="px-3 py-1.5 text-xs font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg border border-stone-200 dark:border-stone-700 transition-colors flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Email Dispatch</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-100/70 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800">
              <tr>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Crop Group</th>
                <th className="py-3 px-3 text-right font-semibold uppercase tracking-wider text-[11px]">
                  Predicted Rate ({priceUnit === 'quintal' ? '₹/Qtl' : '₹/Tonne'})
                </th>
                <th className="py-3 px-3 text-right font-semibold uppercase tracking-wider text-[11px]">
                  95% Confidence Interval
                </th>
                <th className="py-3 px-3 text-right font-semibold uppercase tracking-wider text-[11px]">
                  MoM %
                </th>
                <th className="py-3 px-4 text-center font-semibold uppercase tracking-wider text-[11px]">
                  Simulation Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-mono">
              {displayedResults.map((row) => {
                const price = priceUnit === 'quintal' ? row.pricePerQuintal : row.pricePerTonne;
                const lower = priceUnit === 'quintal' ? row.lowerBoundQuintal : row.lowerBoundQuintal * 10;
                const upper = priceUnit === 'quintal' ? row.upperBoundQuintal : row.upperBoundQuintal * 10;
                const isUp = row.momChangePercent > 0;

                return (
                  <tr key={row.group} className="hover:bg-amber-50/40 dark:hover:bg-stone-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-sans font-medium text-stone-900 dark:text-stone-100">
                      <div className="font-semibold text-sm">{row.group}</div>
                      <div className="text-[11px] text-stone-400 font-normal">
                        Empirical standard error: ±0.207 log
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-stone-900 dark:text-stone-100 font-bold text-sm">
                      ₹{price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums text-stone-500 dark:text-stone-400 text-xs">
                      [₹{lower.toFixed(1)} – ₹{upper.toFixed(1)}]
                    </td>
                    <td className="py-3.5 px-3 text-right tabular-nums">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-bold ${
                          isUp
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {row.momChangePercent > 0 ? '+' : ''}
                        {row.momChangePercent}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => onNavigateToCalculator?.(row.group)}
                        className="px-3 py-1.5 text-xs font-sans font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg border border-amber-300 dark:border-amber-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Simulate Costs</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share / SMS Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 max-w-md w-full rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              {activeModal === 'sms' ? 'SMS Mandi Advisory Dispatch' : 'Email Market Dispatch'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Instant summary formatted for basic mobile phones or wholesale APMC trading channels.
            </p>
            <textarea
              readOnly
              value={shareText}
              rows={7}
              className="w-full p-3 text-xs font-mono bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCopyAdvisory}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>{copiedNotification ? 'Advisory Copied!' : 'Copy to Clipboard'}</span>
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium text-xs rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
