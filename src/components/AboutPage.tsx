/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sprout, BookOpen, Layers, ShieldCheck, Cpu, Database } from 'lucide-react';

interface AboutPageProps {
  onNavigateHome: () => void;
  onNavigateRegister: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onNavigateHome,
  onNavigateRegister,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Sprout className="w-4 h-4" />
          <span>About KisanMandi Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
          Bridging Information Asymmetry in Indian Agriculture
        </h1>
        <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
          An AI-based essential commodities price prediction and market intelligence system for India, empowering farmers, traders, and policymakers with rigorous econometric forecasting.
        </p>
      </div>

      {/* Problem Statement & Objectives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Problem Statement</h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            Smallholder farmers often suffer from distress selling due to a lack of advance price visibility across regional APMC mandis. Traders lack real-time arrival synchronization, while researchers require transparent econometric validation.
          </p>
        </div>

        <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <Layers className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Core Objectives</h2>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            Provide transparent, actionable sell/hold advisories for farmers, optimal procurement routes for traders, and backtested Multiple Linear Regression and LSTM forecasts for market analysts.
          </p>
        </div>
      </div>

      {/* Commodities & Data Sources */}
      <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Essential Commodities & Data Sources
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Covering 10 essential commodities: Onion, Tomato, Potato, Rice, Wheat, Pulses, Edible Oils, Sugar, Milk, and Salt.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1">
            <span className="font-bold text-stone-900 dark:text-stone-100 block">AGMARKNET Portal</span>
            <p className="text-stone-500">Real-time daily transaction records, arrivals, and modal prices across 500+ mandis.</p>
          </div>
          <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1">
            <span className="font-bold text-stone-900 dark:text-stone-100 block">Data.gov.in</span>
            <p className="text-stone-500">Historical wholesale price archives, IMD rainfall indices, and agricultural census datasets.</p>
          </div>
          <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-1">
            <span className="font-bold text-stone-900 dark:text-stone-100 block">Consumer Affairs Dept</span>
            <p className="text-stone-500">Retail and wholesale price monitoring for inflation tracking and policy advisories.</p>
          </div>
        </div>
      </div>

      {/* ML Models & Prediction Types */}
      <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Machine Learning Models & Forecast Horizons
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
            <span className="font-bold text-amber-900 dark:text-amber-200 block text-sm">XGBoost</span>
            <span className="text-[11px] text-stone-500">Ensemble Gradient Boosting</span>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
            <span className="font-bold text-amber-900 dark:text-amber-200 block text-sm">Random Forest</span>
            <span className="text-[11px] text-stone-500">Non-linear feature bagging</span>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
            <span className="font-bold text-amber-900 dark:text-amber-200 block text-sm">SARIMA</span>
            <span className="text-[11px] text-stone-500">Seasonal Autoregressive</span>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
            <span className="font-bold text-amber-900 dark:text-amber-200 block text-sm">LSTM</span>
            <span className="text-[11px] text-stone-500">Deep Neural Networks</span>
          </div>
        </div>

        <div className="text-xs text-stone-600 dark:text-stone-400 space-y-1">
          <p><strong>Prediction Horizons:</strong> Next-day (24h), 7-day, and 30-day forward price forecasts with 95% confidence intervals.</p>
          <p className="text-stone-500"><strong>Disclaimer:</strong> Predictions generated by KisanMandi serve as decision-support intelligence and do not constitute guaranteed financial or trading advice.</p>
        </div>
      </div>
    </div>
  );
};
