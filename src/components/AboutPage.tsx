/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sprout, Layers, ShieldCheck, Cpu, Database, ArrowLeft, UserPlus } from 'lucide-react';

interface AboutPageProps {
  onNavigateHome: () => void;
  onNavigateRegister: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onNavigateHome,
  onNavigateRegister,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Top Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <button
          type="button"
          onClick={onNavigateRegister}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Create Free Account</span>
        </button>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
          <Sprout className="w-4 h-4" />
          <span>About KisanMandi Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Bridging Information Asymmetry in Indian Agriculture
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
          KisanMandi is an agricultural price prediction and market intelligence platform covering essential commodities across 28 Indian states—combining local SQLite persistence, offline Python machine learning, and role-based workflows for farmers, traders, analysts, and administrators.
        </p>
      </div>

      {/* Problem Statement & Objectives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Problem Statement</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Smallholder farmers frequently face distress selling due to limited visibility into upcoming mandi price shifts and nearby market transport economics. Traders lack unified arrival monitoring, while analysts require reproducible backtesting over structured wholesale data.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Core Objectives</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Deliver bilingual (English &amp; Telugu) sell-or-wait advisories and cultivation profit estimates for farmers, freight-aware procurement planning for traders, and out-of-sample MAE/RMSE/MAPE/R² evaluation for analysts with zero mandatory paid APIs.
          </p>
        </div>
      </div>

      {/* Data Architecture & Sources */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Essential Commodities &amp; Data Sources
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bundled offline AGMARKNET-format SQLite dataset (8,800+ rows) with CSV ingestion and optional data.gov.in live sync.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">AGMARKNET Format</span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Structured daily wholesale minimum, maximum, and modal prices paired with arrival tonnage across regional APMC mandis.
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">Optional data.gov.in</span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Admins can optionally configure a free data.gov.in API key or upload local CSV files directly into the SQLite staging queue.
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block">SQLite Local Store</span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              All users, watchlists, cultivation scenarios, alert rules, model registry versions, and security audit logs persist locally.
            </p>
          </div>
        </div>
      </div>

      {/* Local Python ML Models */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Local Python Machine Learning &amp; Forecast Horizons
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
            <span className="font-bold text-emerald-900 dark:text-emerald-200 block text-sm">Random Forest Regressor</span>
            <span className="text-xs text-slate-600 dark:text-slate-400 block">
              Captures non-linear lag, rolling window, and seasonal price interactions via scikit-learn.
            </span>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block text-sm">Multiple Linear Regression</span>
            <span className="text-xs text-slate-600 dark:text-slate-400 block">
              Interpretable regression over lag features, arrival shocks, and cultivation input costs.
            </span>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="font-bold text-slate-900 dark:text-white block text-sm">7-Day Moving Average</span>
            <span className="text-xs text-slate-600 dark:text-slate-400 block">
              Chronological naive baseline benchmark used to verify predictive skill in out-of-sample tests.
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <p>
            <strong className="text-slate-800 dark:text-slate-200">Prediction Horizons:</strong> Next-day (24h), 7-day average, and 30-day multi-step forward projections with 95% residual confidence intervals.
          </p>
          <p className="text-slate-500">
            <strong className="text-slate-700 dark:text-slate-300">Disclaimer:</strong> Forecasts generated on bundled sample or user-uploaded datasets act as academic and operational decision-support tools and do not guarantee market execution prices.
          </p>
        </div>
      </div>
    </div>
  );
};
