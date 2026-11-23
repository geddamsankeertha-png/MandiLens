/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sprout,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Search,
  Briefcase,
  GraduationCap,
  Database,
  CheckCircle2,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { UserProfile } from '../types/mandi';

interface LandingPageProps {
  onNavigateToRegister: () => void;
  onNavigateToLogin: () => void;
  onNavigateToExplorer: () => void;
  currentUser?: UserProfile | null;
  onSelectRole?: (role: 'guest' | 'farmer' | 'trader' | 'analyst' | 'admin') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToRegister,
  onNavigateToLogin,
  onNavigateToExplorer,
  currentUser,
  onSelectRole,
}) => {
  const commodities = [
    { name: 'Tomato', te: 'టొమాటో', unit: '₹/kg & ₹/qtl' },
    { name: 'Onion', te: 'ఉల్లిపాయ', unit: '₹/kg & ₹/qtl' },
    { name: 'Potato', te: 'బంగాళాదుంప', unit: '₹/kg & ₹/qtl' },
    { name: 'Rice / Paddy', te: 'బియ్యం / వరి', unit: '₹/kg & ₹/qtl' },
    { name: 'Wheat', te: 'గోధుమలు', unit: '₹/kg & ₹/qtl' },
    { name: 'Toor Dal', te: 'కందిపప్పు', unit: '₹/kg & ₹/qtl' },
    { name: 'Cotton', te: 'పత్తి', unit: '₹/qtl' },
    { name: 'Chilli', te: 'మిరప', unit: '₹/qtl' },
    { name: 'Maize', te: 'మొక్కజొన్న', unit: '₹/qtl' },
    { name: 'Mustard Oil', te: 'ఆవనూనె', unit: '₹/L' },
    { name: 'Sugar', te: 'చక్కెర', unit: '₹/kg' },
    { name: 'Milk', te: 'పాలు', unit: '₹/L' },
  ];

  const tickerItems = [
    { name: 'Tomato (Local)', market: 'Guntur, AP', price: '₹38.00/kg', change: '+9.0%' },
    { name: 'Onion (Red)', market: 'Lasalgaon, MH', price: '₹26.00/kg', change: '-2.5%' },
    { name: 'Potato (Jyoti)', market: 'Agra, UP', price: '₹18.00/kg', change: '+4.2%' },
    { name: 'Wheat (Sharbati)', market: 'Khanna, PB', price: '₹24.80/kg', change: '+1.8%' },
    { name: 'Rice (Basmati)', market: 'Karnal, HR', price: '₹39.00/kg', change: '+3.1%' },
    { name: 'Toor Dal', market: 'Gulbarga, KA', price: '₹105.00/kg', change: '+6.4%' },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sample Dataset Snapshot Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 shrink-0 font-semibold text-emerald-700 dark:text-emerald-400">
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>Sample AGMARKNET Dataset Snapshot (Offline Ready)</span>
          </div>
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar font-mono text-[11px] tabular-nums">
            {tickerItems.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-slate-700 dark:text-slate-300 font-sans font-medium">{item.name}</span>
                <span className="font-bold text-slate-900 dark:text-white">{item.price}</span>
                <span
                  className={
                    item.change.startsWith('+')
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-rose-600 dark:text-rose-400 font-bold'
                  }
                >
                  {item.change}
                </span>
                <span className="text-slate-400 font-sans">({item.market})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-4xl space-y-6">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Agricultural Price Intelligence · SQLite &amp; Local Python ML
            </p>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Know When and Where to Sell Across Indian APMC Mandis
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
              KisanMandi delivers transparent next-day, 7-day, and 30-day commodity price forecasts, nearby mandi transport net-profit comparisons, and econometric backtesting built on local SQLite storage and offline Python machine learning.
            </p>

            {/* Primary & Secondary Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onNavigateToExplorer}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Explore Mandi Prices</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {!currentUser && (
                <>
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4 text-emerald-600" />
                    <span>Sign In</span>
                  </button>

                  <button
                    type="button"
                    onClick={onNavigateToRegister}
                    className="px-5 py-3 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-xl border border-slate-300 dark:border-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <span>Create Account</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Grounded System Scope Summary Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Sample Dataset
              </span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums mt-1 block">
                8,800+
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">SQLite mandi price observations</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Regional Coverage
              </span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums mt-1 block">
                28 States
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Major APMC market yards</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Forecast Horizons
              </span>
              <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums mt-1 block">
                1D · 7D · 30D
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Random Forest &amp; Linear Regression</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Operating Mode
              </span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-1 block">
                Zero Cost
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">100% offline-capable, bilingual EN/TE</span>
            </div>
          </div>
        </div>
      </section>

      {/* Role Workspaces Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Role-Based Decision Workspaces
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                Tailored Intelligence for Every Stakeholder
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Click a workspace card below to test with a demo session
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <button
              type="button"
              onClick={() => onSelectRole?.('farmer')}
              className="text-left p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors space-y-3 group shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  Farmer Portal · English &amp; తెలుగు
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors mt-0.5">
                  Sell Timing, Nearby Mandis &amp; Profit Estimator
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Clear Sell Now or Wait guidance, transport-adjusted nearby mandi realization comparison, cultivation cost profit estimator, and weather risk alerts.
              </p>
              <div className="pt-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <span>Launch Farmer Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectRole?.('trader')}
              className="text-left p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors space-y-3 group shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                  Trader Terminal
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors mt-0.5">
                  Procurement Planning &amp; Spatial Arbitrage
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Rank sourcing vs. destination mandis in ₹/quintal, model transit wastage and freight break-even thresholds, and monitor buy/sell arrival signals.
              </p>
              <div className="pt-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <span>Launch Trader Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectRole?.('analyst')}
              className="text-left p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors space-y-3 group shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-700 dark:text-sky-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider block">
                  Market Analyst Lab
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors mt-0.5">
                  Backtesting, Seasonality &amp; Model Diagnostics
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Evaluate out-of-sample MAE, RMSE, MAPE, and R², compare 1D/7D/30D ML trajectories, inspect supply elasticity, and export clean CSV data.
              </p>
              <div className="pt-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <span>Launch Analyst Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </div>

        {/* Key Commodities Structured Index */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                12 Monitored Essential Commodities
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Standardized English and Telugu crop labels aligned with AGMARKNET reporting formats.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToExplorer}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Inspect Historical Series</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {commodities.map((c) => (
              <div
                key={c.name}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800"
              >
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">{c.name}</span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block">{c.te}</span>
                <span className="text-[10px] font-mono text-slate-400 block mt-1">{c.unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Persona Switcher & Admin Entry */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Interactive Role Testing (Least-Privilege RBAC)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Explore Farmer, Trader, or Analyst views via 1-click demo login, or open the Administrator Sign-In / First-Run Setup.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectRole?.('farmer')}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Sprout className="w-3.5 h-3.5" />
                <span>Demo Farmer</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectRole?.('trader')}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Demo Trader</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectRole?.('analyst')}
                className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Demo Analyst</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectRole?.('admin')}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Sign-In / Setup</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
