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
  Users,
  Search,
  Radio,
  Briefcase,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../types/mandi';

interface LandingPageProps {
  onNavigateToRegister: () => void;
  onNavigateToLogin: () => void;
  onNavigateToExplorer: () => void;
  currentUser?: UserProfile | null;
  onNavigateToPage?: (pageId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToRegister,
  onNavigateToLogin,
  onNavigateToExplorer,
  currentUser,
  onNavigateToPage,
}) => {
  // Key commodities covered
  const commodities = [
    'Onion',
    'Tomato',
    'Potato',
    'Rice',
    'Wheat',
    'Pulses',
    'Edible Oils',
    'Sugar',
    'Milk',
    'Salt',
  ];

  // National live price ticker
  const tickerItems = [
    { name: 'Tomato (Local)', market: 'Guntur, AP', price: 'â‚¹38/kg', mom: '+9.0%' },
    { name: 'Onion (Red)', market: 'Lasalgaon, MH', price: 'â‚¹26/kg', mom: '-2.5%' },
    { name: 'Potato (Jyoti)', market: 'Agra, UP', price: 'â‚¹18/kg', mom: '+4.2%' },
    { name: 'Wheat (Sharbati)', market: 'Khanna, PB', price: 'â‚¹24.8/kg', mom: '+1.8%' },
    { name: 'Rice (Basmati)', market: 'Karnal, HR', price: 'â‚¹39/kg', mom: '+3.1%' },
    { name: 'Toor Dal (Pigeon Pea)', market: 'Gulbarga, KA', price: 'â‚¹105/kg', mom: '+6.4%' },
    { name: 'Mustard Oil', market: 'Jaipur, RJ', price: 'â‚¹135/L', mom: '+0.8%' },
    { name: 'Sugar (M-30)', market: 'Kolhapur, MH', price: 'â‚¹38.5/kg', mom: '-1.2%' },
  ];

  return (
    <div className="relative min-h-screen bg-stone-950 text-white flex flex-col items-center justify-start overflow-hidden px-4 sm:px-6">
      {/* Background Animated Video/Canvas Effect */}
      <div className="absolute inset-0 z-0 opacity-30 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent z-10" />
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/40 via-stone-950 to-stone-950 animate-pulse duration-1000" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-ping" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Top Live National Price Ticker */}
      <div className="relative z-20 w-full max-w-7xl mx-auto pt-3 pb-2 border-b border-stone-800/80 text-xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0 font-bold text-amber-400 uppercase tracking-wider text-[11px]">
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>National AGMARKNET Live Ticker</span>
          </div>
          <div className="flex items-center gap-8 overflow-x-auto no-scrollbar font-mono text-[11px]">
            {tickerItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-stone-300 font-sans">{item.name}</span>
                <span className="text-amber-400 font-bold">{item.price}</span>
                <span className={item.mom.startsWith('+') ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {item.mom}
                </span>
                <span className="text-stone-500 text-[10px]">({item.market})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative z-20 max-w-5xl mx-auto text-center space-y-6 pt-12 pb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
          <Sprout className="w-4 h-4 text-emerald-400" />
          <span>KisanMandi Agricultural Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
          KisanMandi Price Predictor & Market Intelligence
        </h1>

        <p className="text-base sm:text-lg text-stone-300 max-w-3xl mx-auto leading-relaxed">
          AI-based essential commodities price prediction and market intelligence system for India. Fusing 33.7M AGMARKNET transaction records, IMD weather indicators, and machine learning models (XGBoost, Random Forest, SARIMA, LSTM).
        </p>

        {/* Key Commodities Covered Badges */}
        <div className="pt-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
            Key Commodities Covered:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {commodities.map((crop) => (
              <span
                key={crop}
                className="px-3 py-1 bg-stone-900/80 border border-stone-800 rounded-full text-xs font-semibold text-stone-200"
              >
                {crop}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons: Explore Prices, Login, Register */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onNavigateToExplorer}
            className="w-full sm:w-auto px-7 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 transform active:scale-95"
          >
            <Search className="w-4 h-4" />
            <span>Explore Prices</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onNavigateToLogin}
            className="w-full sm:w-auto px-7 py-3.5 bg-stone-900 hover:bg-stone-800 text-stone-200 font-semibold text-sm rounded-xl border border-stone-700 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Login</span>
          </button>

          <button
            onClick={onNavigateToRegister}
            className="w-full sm:w-auto px-7 py-3.5 bg-stone-900 hover:bg-stone-800 text-stone-200 font-semibold text-sm rounded-xl border border-stone-700 transition-all flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4 text-amber-500" />
            <span>Register</span>
          </button>
        </div>
      </div>

      {/* Three Role Cards */}
      <div className="relative z-20 w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 pb-14">
        {/* Farmer Role Card */}
        <div
          className="p-6 rounded-2xl bg-stone-900/70 border border-stone-800 hover:border-emerald-500/50 transition-all space-y-3 group backdrop-blur-md"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Farmer Persona</span>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
              â€œKnow when and where to sellâ€
            </h3>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            Simple, visual dashboard in English & Telugu. Next 7-day price forecasts, ðŸŸ¢/ðŸŸ¡/ðŸ”´ sell or wait advice, and best nearby market recommendations.
          </p>
        </div>

        {/* Trader Role Card */}
        <div
          className="p-6 rounded-2xl bg-stone-900/70 border border-stone-800 hover:border-amber-500/50 transition-all space-y-3 group backdrop-blur-md"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Trader Persona</span>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
              â€œPlan procurement and maximize marginâ€
            </h3>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            Multi-market price comparison, procurement planner, break-even profit calculator, and AGMARKNET arrival risk signals.
          </p>
        </div>

        {/* Market Analyst Role Card */}
        <div
          className="p-6 rounded-2xl bg-stone-900/70 border border-stone-800 hover:border-sky-500/50 transition-all space-y-3 group backdrop-blur-md"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">Analyst Persona</span>
            <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
              â€œAnalyze trends, forecasts, and riskâ€
            </h3>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed">
            Advanced econometric lab, MAE/RMSE/MAPE/$R^2$ model diagnostics, seasonality trends, regional heat maps, and CSV/PDF reports.
          </p>
        </div>
      </div>

        {/* Footer */}
      <footer className="relative z-20 w-full border-t border-stone-800/80 py-6 text-center text-xs text-stone-500 space-y-1">
        <p className="font-semibold text-stone-400">
          KisanMandi â€” Agricultural Commodities Market Intelligence
        </p>
        <p className="text-[11px] text-stone-600">
          Live government market feeds are not connected in this demo build.
        </p>
      </footer>
    </div>
  );
};
