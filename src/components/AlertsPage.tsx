/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Calendar,
  MapPin,
  Check,
  Clock,
  Sparkles,
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
      recommendedAction: 'Wait 2–3 days if storage and crop quality permit to capture stronger mandi realization.',
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
      recommendedAction: 'Sell now before heavy incoming truckloads trigger deeper local spot discounts.',
      message: 'Onion price in Kurnool is expected to fall; consider selling soon.',
      read: false,
    },
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
      recommendedAction: 'Buy signal: Accumulate inventory in cold storage; forward spread estimated at +₹280/qtl.',
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
      recommendedAction: 'Defer spot purchases: High daily arrivals (1,420 tonnes) will soften wholesale quotes.',
      message: 'High tomato arrivals in Vijayawada may reduce prices.',
      read: true,
    },
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
      recommendedAction: 'Inspect residual variance against holdout baseline; 3-sigma deviation triggered by delayed Kharif arrivals.',
      message: 'Unusual onion price spike detected in Lasalgaon market.',
      read: false,
    },
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
      recommendedAction: 'Verify CSV ingestion queue or trigger AGMARKNET ETL sync from Data Management.',
      message: 'Price data for 3 markets has not updated for 2 days.',
      read: false,
    },
  ]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'price' | 'arrival' | 'risk'>('all');
  const userRole = currentUser?.role || 'farmer';

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
          read: Boolean((a as any).read),
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

  const roleAlerts = alerts.filter(
    (alert) => userRole === 'admin' || alert.roleTarget === userRole || alert.roleTarget === 'all'
  );

  const visibleAlerts = roleAlerts.filter((alert) => {
    if (activeFilter === 'unread') return !alert.read;
    if (activeFilter === 'price') return alert.alertType.includes('Price');
    if (activeFilter === 'arrival') return alert.alertType.includes('Arrival');
    if (activeFilter === 'risk') return alert.riskLevel === 'High';
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    setAlerts((prev) => prev.map((alt) => (alt.id === id ? { ...alt, read: true } : alt)));
    if (predictionApi.hasToken()) {
      predictionApi.markAlertRead(id).catch(() => {});
    }
  };

  const handleMarkAllAsRead = () => {
    const ids = roleAlerts.filter((a) => !a.read).map((a) => a.id);
    setAlerts((prev) => prev.map((alt) => ({ ...alt, read: true })));
    if (predictionApi.hasToken()) {
      ids.forEach((id) => predictionApi.markAlertRead(id).catch(() => {}));
    }
  };

  const unreadCount = roleAlerts.filter((a) => !a.read).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" />
            <span>Personalized Market Alerts &amp; Risk Advisories</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Alerts &amp; Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Price shifts, arrival shocks, and operational recommendations tailored for{' '}
            <strong className="uppercase">{userRole}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{unreadCount} Unread</span>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        role="tablist"
        aria-label="Filter alerts"
        className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold"
      >
        {[
          { id: 'all', label: `All Alerts (${roleAlerts.length})` },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'price', label: 'Price-Rise & Drop' },
          { id: 'arrival', label: 'Arrival Shocks' },
          { id: 'risk', label: 'High Risk Only' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeFilter === tab.id}
            onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
            className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0 ${
              activeFilter === tab.id
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {visibleAlerts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">No pending alerts</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no alerts matching your selected filter. New advisories appear as mandi conditions change.
            </p>
          </div>
        ) : (
          visibleAlerts.map((alert) => {
            const isUnread = !alert.read;
            const riskStyle =
              alert.riskLevel === 'High'
                ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                : alert.riskLevel === 'Moderate'
                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800';

            return (
              <div
                key={alert.id}
                className={`p-5 sm:p-6 rounded-2xl border transition-colors ${
                  isUnread
                    ? 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-700 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{alert.alertType}</span>
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {alert.commodity}
                      </span>
                      <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${riskStyle}`}>
                        {alert.riskLevel} Risk
                      </span>
                      {isUnread && (
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                          · Unread
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5" />
                        {alert.marketState}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 font-mono tabular-nums">
                        <Calendar className="w-3.5 h-3.5" />
                        {alert.alertDate}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isUnread ? (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(alert.id)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark as read</span>
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Read
                      </span>
                    )}
                  </div>
                </div>

                <p className="py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {alert.message}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs tabular-nums">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Current Price</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{alert.currentPrice}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Predicted Price</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{alert.predictedPrice}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Expected Change</span>
                    <span
                      className={`font-mono font-bold ${
                        alert.expectedChange.startsWith('+')
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {alert.expectedChange}
                    </span>
                  </div>
                </div>

                <div className="mt-3 p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block uppercase text-[10px] text-emerald-800 dark:text-emerald-400">
                      Recommended Action
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
