import React, { useState, useEffect } from 'react';
import {
  Radio,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  Download,
} from 'lucide-react';
import { IndianState, IndianRegion } from '../types/mandi';
import { INDIAN_STATES, MANDI_MARKETS, STATE_METADATA } from '../data/mandiData';
import {
  fetchLiveCommodities,
  fetchPanIndiaBenchmarks,
  LiveCommodityRecord,
  PanIndiaBenchmark,
} from '../services/liveCommoditiesService';

interface LiveCommoditiesHubProps {
  initialState?: IndianState;
  initialMarket?: string;
  onNavigateToMandi?: (state: IndianState, market: string) => void;
}

export const LiveCommoditiesHub: React.FC<LiveCommoditiesHubProps> = ({
  initialState = 'Maharashtra',
  initialMarket = 'Lasalgaon (Asia Onion Capital)',
  onNavigateToMandi,
}) => {
  const [selectedState, setSelectedState] = useState<IndianState>(initialState);
  const [selectedMarket, setSelectedMarket] = useState<string>(initialMarket);
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceUnit, setPriceUnit] = useState<'quintal' | 'tonne'>('quintal');

  const [loading, setLoading] = useState<boolean>(false);
  const [liveData, setLiveData] = useState<LiveCommodityRecord[]>([]);
  const [dataSource, setDataSource] = useState<string>('Live Intelligence API');
  const [isLiveFeed, setIsLiveFeed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [benchmarks, setBenchmarks] = useState<PanIndiaBenchmark[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<IndianRegion | 'All'>('All');

  // Filtered states by region
  const filteredStates = selectedRegion === 'All'
    ? INDIAN_STATES
    : INDIAN_STATES.filter((s) => STATE_METADATA[s]?.region === selectedRegion);

  const availableMarkets = MANDI_MARKETS.filter((m) => m.state === selectedState);

  // Load pan-India benchmarks on mount
  useEffect(() => {
    fetchPanIndiaBenchmarks().then((data) => setBenchmarks(data));
  }, []);

  // Fetch live commodities when state or market changes
  const loadData = async (st: string, mkt: string, grp: string) => {
    setLoading(true);
    try {
      const res = await fetchLiveCommodities(st, mkt, grp);
      setLiveData(res.data);
      setDataSource(res.source);
      setIsLiveFeed(res.is_live === true);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedState, selectedMarket, selectedGroup);
  }, [selectedState, selectedMarket, selectedGroup]);

  const handleStateChange = (st: IndianState) => {
    setSelectedState(st);
    const firstMkt = MANDI_MARKETS.find((m) => m.state === st);
    if (firstMkt) {
      setSelectedMarket(firstMkt.name);
    }
  };

  // Filter live commodities by search query
  const filteredCommodities = liveData.filter((item) => {
    const matchesSearch = item.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.group.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === 'All' || item.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const handleExportCsv = () => {
    const header = ['Commodity', 'Category', 'Modal Price (₹/Qtl)', 'Min Price', 'Max Price', 'Arrivals (Tonnes)', 'MoM % Change', 'Trend'];
    const rows = filteredCommodities.map((c) => [
      c.commodity,
      c.group,
      c.modalPriceQuintal,
      c.minPriceQuintal,
      c.maxPriceQuintal,
      c.arrivalQuantityTonne,
      `${c.momChangePercent}%`,
      c.trend,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mandi_live_prices_${selectedMarket}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Real-Time API Integration
            </span>
            <span aria-hidden="true">·</span>
            <span>All 28 Indian States</span>
            <span aria-hidden="true">·</span>
            <span>Gemini Grounded Market Feeds</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Live Mandi Commodity Prices & Arrivals
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center p-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setPriceUnit('quintal')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                priceUnit === 'quintal'
                  ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-sm font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              ₹ / Quintal
            </button>
            <button
              onClick={() => setPriceUnit('tonne')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                priceUnit === 'tonne'
                  ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-sm font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
              }`}
            >
              ₹ / Tonne
            </button>
          </div>

          <button
            onClick={() => loadData(selectedState, selectedMarket, selectedGroup)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Fetching API...' : 'Refresh Live Rates'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg border border-stone-200 dark:border-stone-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Pan-India National Commodity Benchmark Strip */}
      {benchmarks.length > 0 && (
        <div className="bg-white dark:bg-stone-800 rounded-xl p-3.5 border border-stone-200 dark:border-stone-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between text-xs pb-2 mb-2 border-b border-stone-100 dark:border-stone-700">
            <span className="font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Pan-India National Benchmark Spot Rates
            </span>
            <span className="text-[11px] font-mono text-stone-400">Live Across Key Producing States</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            {benchmarks.map((b) => (
              <div
                key={`${b.commodity}-${b.market}`}
                className="p-2.5 bg-stone-50 dark:bg-stone-900/60 rounded-lg border border-stone-100 dark:border-stone-700/60 flex-shrink-0 min-w-[155px]"
              >
                <div className="text-[11px] font-semibold text-stone-900 dark:text-stone-100 truncate">
                  {b.commodity}
                </div>
                <div className="text-[10px] text-stone-400">{b.market}, {b.state}</div>
                <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-stone-200/50 dark:border-stone-800">
                  <span className="font-mono font-bold text-xs tabular-nums text-stone-900 dark:text-stone-100">
                    ₹{priceUnit === 'quintal' ? b.modalPriceQuintal : b.modalPriceQuintal * 10}
                  </span>
                  <span
                    className={`text-[10px] font-bold flex items-center font-mono ${
                      b.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {b.changePercent >= 0 ? '+' : ''}{b.changePercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* State & Market Selection Bar across 28 States */}
      <div className="bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-200 dark:border-stone-700 shadow-sm space-y-3">
        {/* Region Filter Strip */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
            Select State & Mandi (28 States)
          </span>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[11px] font-medium">
            {(['All', 'North', 'South', 'West', 'East', 'Central', 'North-East'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRegion(r)}
                className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                  selectedRegion === r
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-stone-600 dark:text-stone-400 block mb-1">
              State ({filteredStates.length} Available)
            </label>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value as IndianState)}
              className="w-full text-xs font-medium bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
            >
              {filteredStates.map((st) => (
                <option key={st} value={st}>
                  {st} ({STATE_METADATA[st]?.region} Zone)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-stone-600 dark:text-stone-400 block mb-1">
              APMC Mandi Market
            </label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="w-full text-xs font-medium bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
            >
              {availableMarkets.map((m) => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-stone-600 dark:text-stone-400 block mb-1">
              Commodity Category Filter
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full text-xs font-medium bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
            >
              <option value="All">All Commodity Groups</option>
              <option value="Cereals">Cereals (Wheat, Rice, Maize)</option>
              <option value="Vegetables">Vegetables (Onion, Potato, Tomato)</option>
              <option value="Oil Seeds">Oil Seeds (Soybean, Mustard, Groundnut)</option>
              <option value="Pulses">Pulses (Chana, Tur, Moong)</option>
              <option value="Spices">Spices (Chilli, Turmeric, Cumin)</option>
              <option value="Fruits">Fruits (Banana, Mango, Apple)</option>
              <option value="Fibre Crops">Fibre Crops (Cotton, Jute)</option>
            </select>
          </div>
        </div>

        {/* Search Bar & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-700/60 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search commodity (e.g. Onion, Wheat, Chilli)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Retrieved: {lastUpdated || 'Connecting...'}</span>
            </span>
            <span>·</span>
            <span className={`${isLiveFeed ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'} font-semibold text-[11px] flex items-center gap-1`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="truncate max-w-[200px]">{dataSource}</span>
            </span>
          </div>
        </div>
      </div>

      {!isLiveFeed && (
        <p role="status" className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          These are unverified demo estimates, not current mandi quotes. Do not use them to make selling or buying decisions.
        </p>
      )}

      {/* Live Commodity Data Table */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-100/70 dark:bg-stone-900/40 text-stone-700 dark:text-stone-300 border-b border-stone-200 dark:border-stone-700">
              <tr>
                <th className="py-3 px-4 font-semibold">Commodity & Grade</th>
                <th className="py-3 px-3 font-semibold">Category</th>
                <th className="py-3 px-3 text-right font-semibold">
                  Modal Spot Price ({priceUnit === 'quintal' ? '₹/Qtl' : '₹/Tonne'})
                </th>
                <th className="py-3 px-3 text-right font-semibold">Min – Max Range</th>
                <th className="py-3 px-3 text-right font-semibold">Today's Arrivals</th>
                <th className="py-3 px-3 text-right font-semibold">MoM %</th>
                <th className="py-3 px-4 text-center font-semibold">Trading Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-700/60 font-mono">
              {filteredCommodities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-stone-400 font-sans">
                    {loading ? 'Fetching real-time commodity data from API...' : 'No matching commodities found for this market.'}
                  </td>
                </tr>
              ) : (
                filteredCommodities.map((row) => {
                  const modalPrice = priceUnit === 'quintal' ? row.modalPriceQuintal : row.modalPriceQuintal * 10;
                  const minPrice = priceUnit === 'quintal' ? row.minPriceQuintal : row.minPriceQuintal * 10;
                  const maxPrice = priceUnit === 'quintal' ? row.maxPriceQuintal : row.maxPriceQuintal * 10;
                  const isUp = row.momChangePercent > 0;

                  return (
                    <tr
                      key={row.commodity}
                      className="hover:bg-amber-50/40 dark:hover:bg-stone-700/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-sans font-bold text-stone-900 dark:text-stone-100">
                        {row.commodity}
                      </td>
                      <td className="py-3 px-3 font-sans text-stone-600 dark:text-stone-400">
                        {row.group}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-stone-900 dark:text-stone-100 font-bold text-sm">
                        ₹{modalPrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-stone-500 dark:text-stone-400 text-[11px]">
                        ₹{minPrice.toLocaleString()} – ₹{maxPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums font-semibold text-stone-800 dark:text-stone-200">
                        {row.arrivalQuantityTonne} T
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        <span
                          className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-bold ${
                            isUp
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {row.momChangePercent > 0 ? '+' : ''}
                          {row.momChangePercent}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                          {row.mandiStatus || 'Active Trading'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
