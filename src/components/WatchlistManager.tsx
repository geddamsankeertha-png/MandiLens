import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Radio,
  MapPin,
} from 'lucide-react';
import { WatchlistItem, IndianState } from '../types/mandi';
import { MANDI_MARKETS, INDIAN_STATES, CROP_GROUPS } from '../data/mandiData';
import {
  subscribeToWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from '../services/marketSyncService';
import { auth } from '../lib/firebase';
import { predictMlrPrice } from '../services/predictiveEngine';

interface WatchlistManagerProps {
  onNavigateToMandi?: (state: IndianState, market: string) => void;
  onOpenAuth: () => void;
}

export const WatchlistManager: React.FC<WatchlistManagerProps> = ({
  onNavigateToMandi,
  onOpenAuth,
}) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addState, setAddState] = useState<IndianState>('Maharashtra');
  const [addMarket, setAddMarket] = useState<string>('Satara');
  const [addTargetPrice, setAddTargetPrice] = useState<number>(180);
  const [addCondition, setAddCondition] = useState<'above' | 'below'>('above');

  // Simulated live market ticks across pan-India 28 states
  const [liveTicks, setLiveTicks] = useState<
    { id: string; mandi: string; state: IndianState; group: string; price: number; change: number; time: string }[]
  >([
    { id: '1', mandi: 'Guntur (Mirchi Yard)', state: 'Andhra Pradesh', group: 'Spices', price: 288.40, change: +4.20, time: '10:04 AM' },
    { id: '2', mandi: 'Lasalgaon (Asia Onion Capital)', state: 'Maharashtra', group: 'Vegetables', price: 63.80, change: -1.15, time: '10:03 AM' },
    { id: '3', mandi: 'Khanna (Asia Largest Grain Mandi)', state: 'Punjab', group: 'Cereals', price: 85.90, change: +0.65, time: '10:02 AM' },
    { id: '4', mandi: 'Unjha (Asia Cumin Capital)', state: 'Gujarat', group: 'Spices', price: 294.50, change: +3.80, time: '10:01 AM' },
    { id: '5', mandi: 'Gulabbagh (Purnea Maize Hub)', state: 'Bihar', group: 'Cereals', price: 81.20, change: -0.40, time: '10:00 AM' },
    { id: '6', mandi: 'Warangal (Enamamula)', state: 'Telangana', group: 'Oil Seeds', price: 145.20, change: +1.90, time: '09:58 AM' },
    { id: '7', mandi: 'Koyambedu', state: 'Tamil Nadu', group: 'Fruits', price: 156.40, change: +2.10, time: '09:55 AM' },
  ]);

  // Subscribe to real-time watchlist in Firestore
  useEffect(() => {
    const unsub = subscribeToWatchlist(auth.currentUser?.uid || null, (items) => {
      setWatchlist(items);
    });
    return () => unsub();
  }, [auth.currentUser]);

  // Simulated live market ticker interval
  useEffect(() => {
    const interval = setInterval(() => {
      const sampleMarket = MANDI_MARKETS[Math.floor(Math.random() * MANDI_MARKETS.length)];
      const sampleGroup = CROP_GROUPS[Math.floor(Math.random() * 5)];
      const delta = (Math.random() - 0.48) * 2.5;
      const basePrice = sampleGroup.defaultPriceQuintal;
      const newPrice = parseFloat((basePrice + delta).toFixed(2));

      setLiveTicks((prev) => [
        {
          id: Math.random().toString(),
          mandi: sampleMarket.name,
          state: sampleMarket.state,
          group: sampleGroup.group,
          price: newPrice,
          change: parseFloat(delta.toFixed(2)),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
        ...prev.slice(0, 7),
      ]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handleAddWatchlist = async () => {
    await addToWatchlist({
      userId: auth.currentUser?.uid || 'guest',
      state: addState,
      market: addMarket,
      targetPrice: addTargetPrice,
      alertCondition: addCondition,
    });
    setShowAddModal(false);
  };

  const handleRemove = async (id: string) => {
    await removeFromWatchlist(id);
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>Real-Time Cloud Synchronization</span>
            <span aria-hidden="true">·</span>
            <span>Firestore Active Listeners</span>
            <span aria-hidden="true">·</span>
            <span>Price Threshold Alerts</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Real-Time Mandi Watchlists & Trade Feed
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Monitored Mandi</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Watchlist on Left, Live Ticker Feed on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Monitored Mandis Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <span>Active Monitored Mandis ({watchlist.length})</span>
            </h3>
            {!auth.currentUser && (
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Local preview mode ·{' '}
                <button onClick={onOpenAuth} className="text-amber-600 underline">
                  Sign in
                </button>{' '}
                to sync cross-device
              </span>
            )}
          </div>

          {watchlist.length === 0 ? (
            <div className="p-8 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-center space-y-2">
              <Bell className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
              <p className="text-xs text-stone-500">Your watchlist is currently empty.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
              >
                Bookmark Your First Mandi
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {watchlist.map((item) => {
                // Compute current model price for Cereals in this mandi
                const currentPred = predictMlrPrice({}, 'Cereals');
                const isAlertTriggered =
                  item.alertCondition === 'above'
                    ? currentPred.pricePerQuintal >= item.targetPrice
                    : currentPred.pricePerQuintal <= item.targetPrice;

                return (
                  <div
                    key={item.id}
                    className="p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm hover:border-amber-400 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-600" />
                        <span className="text-base font-bold text-stone-900 dark:text-stone-100">
                          {item.market} Mandi
                        </span>
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                          ({item.state})
                        </span>
                        {isAlertTriggered && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Target Alert</span>
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-stone-600 dark:text-stone-400 flex items-center gap-3">
                        <span>
                          Target: {item.alertCondition === 'above' ? '≥' : '≤'} ₹{item.targetPrice}/Qtl
                        </span>
                        <span>·</span>
                        <span>
                          Cereals Fit: <strong className="font-mono text-stone-900 dark:text-stone-100">₹{currentPred.pricePerQuintal.toFixed(2)}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => onNavigateToMandi?.(item.state, item.market)}
                        className="px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 rounded-lg border border-amber-200 dark:border-amber-800 transition-colors"
                      >
                        Inspect Rates
                      </button>

                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Remove from Watchlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Live APMC Trade Influx Feed */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-700">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Simulated Live APMC Trade Feed
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Live Broadcast
              </span>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400">
              Continuous live arrival and price ticks across Maharashtra, Karnataka, Gujarat, and Punjab trading hubs.
            </p>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {liveTicks.map((tick) => (
                <div
                  key={tick.id}
                  className="p-2.5 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-100 dark:border-stone-700/60 flex items-center justify-between font-mono text-xs"
                >
                  <div>
                    <div className="font-sans font-bold text-stone-900 dark:text-stone-100">
                      {tick.mandi} · <span className="text-stone-500 font-normal">{tick.group}</span>
                    </div>
                    <div className="text-[10px] text-stone-400">{tick.state} · {tick.time}</div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                      ₹{tick.price.toFixed(2)}
                    </div>
                    <div
                      className={`text-[10px] font-bold flex items-center justify-end gap-0.5 tabular-nums ${
                        tick.change >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {tick.change >= 0 ? '+' : ''}
                      {tick.change.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Monitored Mandi Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 max-w-md w-full rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Add Mandi to Monitored Watchlist
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-stone-600 dark:text-stone-400 block mb-1">State</label>
                <select
                  value={addState}
                  onChange={(e) => {
                    const s = e.target.value as IndianState;
                    setAddState(s);
                    const first = MANDI_MARKETS.find((m) => m.state === s);
                    if (first) setAddMarket(first.name);
                  }}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-stone-600 dark:text-stone-400 block mb-1">Mandi Market</label>
                <select
                  value={addMarket}
                  onChange={(e) => setAddMarket(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2"
                >
                  {MANDI_MARKETS.filter((m) => m.state === addState).map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-600 dark:text-stone-400 block mb-1">Alert Condition</label>
                  <select
                    value={addCondition}
                    onChange={(e) => setAddCondition(e.target.value as 'above' | 'below')}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2"
                  >
                    <option value="above">Price rises above (≥)</option>
                    <option value="below">Price falls below (≤)</option>
                  </select>
                </div>

                <div>
                  <label className="text-stone-600 dark:text-stone-400 block mb-1">Target Price (₹/Qtl)</label>
                  <input
                    type="number"
                    value={addTargetPrice}
                    onChange={(e) => setAddTargetPrice(parseFloat(e.target.value))}
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddWatchlist}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors"
              >
                Add to Watchlist
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
