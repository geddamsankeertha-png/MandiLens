/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Filter,
  Check,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { UserProfile } from '../types/mandi';
import { predictionApi } from '../services/predictionApi';

interface AlertsPageProps {
  currentUser: UserProfile | null;
}

export interface PersonalizedAlert {
  id: string;
  roleTarget: 'farmer' | 'trader' | 'analyst' | 'admin' | 'all';
  alertType: 'Price-Rise Alert' | 'Price-Drop Alert' | 'High-Arrival Alert' | 'Volatility Spike' | 'System Health Alert';
  commodity: string;
  marketState: string;
  alertDate: string;
  currentPrice: string;
  predictedPrice: string;
  expectedChange: string;
  riskLevel: 'High' | 'Moderate' | 'Low';
  recommendedAction: string;
  message: string;
  read: boolean;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ currentUser }) => {
  const [alerts, setAlerts] = useState<PersonalizedAlert[]>([
    // Farmer Alerts
    {
      id: 'alt_farmer_1',
      roleTarget: 'farmer',
      alertType: 'Price-Rise Alert',
      commodity: 'Tomato',
      marketState: 'Guntur, Andhra Pradesh',
      alertDate: '2026-10-31',
      currentPrice: '₹38/kg (₹3,800/qtl)',
      predictedPrice: '₹45/kg (₹4,500/qtl)',
      expectedChange: '+18% in 7 days',
      riskLevel: 'Moderate',
      recommendedAction: '🔴 Wait 2–3 days if storage/quality permits to capture peak farmgate realizations.',
      message: 'Tomato price in Guntur may rise 18% in 7 days.',
      read: false,
    },
    {
      id: 'alt_farmer_2',
      roleTarget: 'farmer',
      alertType: 'Price-Drop Alert',
      commodity: 'Onion',
      marketState: 'Kurnool, Andhra Pradesh',
      alertDate: '2026-10-30',
      currentPrice: '₹22/kg (₹2,200/qtl)',
      predictedPrice: '₹17/kg (₹1,700/qtl)',
      expectedChange: '-22% in 5 days',
      riskLevel: 'High',
      recommendedAction: '🟢 Sell now immediately before fresh incoming truckloads cause deeper local price collapse.',
      message: 'Onion price in Kurnool is expected to fall; consider selling soon.',
      read: false,
    },
    // Trader Alerts
    {
      id: 'alt_trader_1',
      roleTarget: 'trader',
      alertType: 'Price-Rise Alert',
      commodity: 'Potato',
      marketState: 'Agra, Uttar Pradesh',
      alertDate: '2026-10-31',
      currentPrice: '₹14.50/kg (₹1,450/qtl)',
      predictedPrice: '₹18.50/kg (₹1,850/qtl)',
      expectedChange: '+27.5% next week',
      riskLevel: 'Low',
      recommendedAction: '🟢 Buy signal: Accumulate inventory in cold storage; forward arbitrage spread to Delhi/Kanpur estimated at +₹280/qtl.',
      message: 'Potato price in Agra is low and expected to rise next week.',
      read: false,
    },
    {
      id: 'alt_trader_2',
      roleTarget: 'trader',
      alertType: 'High-Arrival Alert',
      commodity: 'Tomato',
      marketState: 'Vijayawada, Andhra Pradesh',
      alertDate: '2026-10-29',
      currentPrice: '₹42/kg (₹4,200/qtl)',
      predictedPrice: '₹36/kg (₹3,600/qtl)',
      expectedChange: '-14.3% in 48 hours',
      riskLevel: 'Moderate',
      recommendedAction: '🟡 Defer spot purchases: High daily arrivals (1,420 tonnes) will soften wholesale prices by tomorrow morning.',
      message: 'High tomato arrivals in Vijayawada may reduce prices.',
      read: true,
    },
    // Market Analyst Alerts
    {
      id: 'alt_analyst_1',
      roleTarget: 'analyst',
      alertType: 'Volatility Spike',
      commodity: 'Onion (Nasik Red)',
      marketState: 'Lasalgaon, Maharashtra',
      alertDate: '2026-10-31',
      currentPrice: '₹32/kg (₹3,200/qtl)',
      predictedPrice: '₹46/kg (₹4,600/qtl)',
      expectedChange: '+43.7% spike anomaly',
      riskLevel: 'High',
      recommendedAction: 'Inspect residual variances against SARIMA/LSTM baseline; 3-sigma deviation triggered by delayed Kharif arrivals.',
      message: 'Unusual onion price spike detected in Lasalgaon market.',
      read: false,
    },
    // Admin Alerts
    {
      id: 'alt_admin_1',
      roleTarget: 'admin',
      alertType: 'System Health Alert',
      commodity: 'Multi-Commodity Feed',
      marketState: 'Bhimavaram, Rajahmundry & Kadapa (AP)',
      alertDate: '2026-10-30',
      currentPrice: 'N/A (Feed Stale)',
      predictedPrice: 'N/A',
      expectedChange: 'Data Pipeline Stalled',
      riskLevel: 'High',
      recommendedAction: 'Rerun AGMARKNET ETL scraper daemon and verify portal API token status.',
      message: 'Price data for 3 markets has not updated for 2 days.',
      read: false,
    },
  ]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'price' | 'arrival' | 'risk'>('all');
  const userRole = currentUser?.role || 'farmer';

  // Fetch real alerts from backend endpoint GET /api/alerts
  useEffect(() => {
    let isMounted = true;
    predictionApi.getAlerts(userRole).then((apiAlerts) => {
      if (isMounted && apiAlerts && apiAlerts.length > 0) {
        const mapped: PersonalizedAlert[] = apiAlerts.map((a) => ({
          id: a.id,
          roleTarget: (a.target_role.toLowerCase().includes('farmer')
            ? 'farmer'
            : a.target_role.toLowerCase().includes('trader')
            ? 'trader'
            : a.target_role.toLowerCase().includes('analyst')
            ? 'analyst'
            : 'admin') as any,
          alertType: a.alert_type as any,
          commodity: a.commodity,
          marketState: `${a.market}, ${a.state}`,
          alertDate: a.alert_date,
          currentPrice: a.current_price > 0 ? `₹${a.current_price}/kg` : 'N/A',
          predictedPrice: a.predicted_price > 0 ? `₹${a.predicted_price}/kg` : 'N/A',
          expectedChange: a.expected_change,
          riskLevel: a.risk_level === 'HIGH' ? 'High' : a.risk_level === 'MEDIUM' ? 'Moderate' : 'Low',
          recommendedAction: a.recommended_action,
          message: a.message,
          read: false,
        }));
        setAlerts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const additions = mapped.filter((m) => !existingIds.has(m.id));
          return [...additions, ...prev];
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [userRole]);

  // Role filtering
  const visibleAlerts = alerts.filter((alert) => {
    // Admin can inspect all alerts across all roles
    if (userRole !== 'admin' && alert.roleTarget !== userRole && alert.roleTarget !== 'all') {
      return false;
    }

    if (activeFilter === 'unread') return !alert.read;
    if (activeFilter === 'price') return alert.alertType.includes('Price');
    if (activeFilter === 'arrival') return alert.alertType.includes('Arrival');
    if (activeFilter === 'risk') return alert.riskLevel === 'High';
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((alt) => (alt.id === id ? { ...alt, read: true } : alt))
    );
  };

  const handleMarkAllAsRead = () => {
    setAlerts((prev) => prev.map((alt) => ({ ...alt, read: true })));
  };

  const unreadCount = visibleAlerts.filter((a) => !a.read).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4 text-amber-600" />
            <span>Personalized Market Alerts & Risk Notifications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
            Alerts & Notifications
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-0.5">
            Personalized price spikes, market crashes, arrival anomalies, and operational recommendations tailored for {userRole.toUpperCase()}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{unreadCount} Unread Alerts</span>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark All as Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
        {[
          { id: 'all', label: `All Alerts (${visibleAlerts.length})` },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'price', label: 'Price-Rise & Drop' },
          { id: 'arrival', label: 'Arrival Shocks' },
          { id: 'risk', label: 'High Risk Only' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
            className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
              activeFilter === tab.id
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts Grid / Cards */}
      <div className="space-y-4">
        {visibleAlerts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">All caught up!</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              There are no pending alerts matching your selected filter. New alerts will arrive automatically as market conditions shift.
            </p>
          </div>
        ) : (
          visibleAlerts.map((alert) => {
            const isUnread = !alert.read;
            const riskBg =
              alert.riskLevel === 'High'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                : alert.riskLevel === 'Moderate'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800';

            return (
              <div
                key={alert.id}
                className={`p-6 rounded-2xl border transition-all ${
                  isUnread
                    ? 'bg-white dark:bg-stone-900 border-amber-300 dark:border-amber-700/60 shadow-md ring-1 ring-amber-400/20'
                    : 'bg-stone-50/60 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 opacity-90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {alert.alertType}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                        {alert.commodity}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${riskBg}`}>
                        {alert.riskLevel} Risk
                      </span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {alert.marketState}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {alert.alertDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isUnread ? (
                      <button
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark as read</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Read
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Alert Highlight Quote */}
                <div className="py-3 text-sm font-semibold text-stone-900 dark:text-stone-100">
                  &ldquo;{alert.message}&rdquo;
                </div>

                {/* Metrics Grid: Current Price, Predicted Price, Expected Change */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xl border border-stone-200 dark:border-stone-700 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase font-bold block">Current Price</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{alert.currentPrice}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase font-bold block">Predicted Price</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{alert.predictedPrice}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 uppercase font-bold block">Expected Change</span>
                    <span
                      className={`font-mono font-bold ${
                        alert.expectedChange.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {alert.expectedChange}
                    </span>
                  </div>
                </div>

                {/* Recommended Action Card */}
                <div className="mt-3 p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 font-medium flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block uppercase text-[10px] text-amber-700 dark:text-amber-400">
                      Recommended Action:
                    </span>
                    <span>{alert.recommendedAction}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
