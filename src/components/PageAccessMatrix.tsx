/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, X, Shield } from 'lucide-react';
import { UserProfile } from '../types/mandi';

interface PageAccessMatrixProps {
  currentUser?: UserProfile | null;
  onNavigateToPage?: (pageId: string) => void;
  onSelectRole?: (role: 'guest' | 'farmer' | 'trader' | 'analyst' | 'admin') => void;
}

interface MatrixRow {
  pageName: string;
  pageId: string;
  guest: boolean | 'limited';
  farmer: boolean;
  trader: boolean;
  analyst: boolean;
  admin: boolean;
}

export const MATRIX_DATA: MatrixRow[] = [
  { pageName: 'Home / Landing', pageId: 'landing', guest: true, farmer: true, trader: true, analyst: true, admin: true },
  { pageName: 'About Project', pageId: 'about', guest: true, farmer: true, trader: true, analyst: true, admin: true },
  { pageName: 'Commodity Price Explorer', pageId: 'explorer', guest: 'limited', farmer: true, trader: true, analyst: true, admin: true },
  { pageName: 'Register', pageId: 'register', guest: true, farmer: true, trader: true, analyst: true, admin: true },
  { pageName: 'Login', pageId: 'login', guest: true, farmer: true, trader: true, analyst: true, admin: true },
  { pageName: 'Farmer Dashboard', pageId: 'farmer', guest: false, farmer: true, trader: false, analyst: false, admin: true },
  { pageName: 'Trader Dashboard', pageId: 'markets', guest: false, farmer: false, trader: true, analyst: false, admin: true },
  { pageName: 'Market Analyst Dashboard', pageId: 'analytics', guest: false, farmer: false, trader: false, analyst: true, admin: true },
  { pageName: 'Alerts & Notifications', pageId: 'alerts', guest: false, farmer: true, trader: true, analyst: true, admin: true },
  { pageName: 'Profile / Settings', pageId: 'profile', guest: false, farmer: true, trader: true, analyst: true, admin: true },
  { pageName: 'Model Performance', pageId: 'models', guest: false, farmer: false, trader: false, analyst: true, admin: true },
  { pageName: 'Data Management', pageId: 'data_management', guest: false, farmer: false, trader: false, analyst: false, admin: true },
  { pageName: 'User Management', pageId: 'user_management', guest: false, farmer: false, trader: false, analyst: false, admin: true },
  { pageName: 'System Logs', pageId: 'system_logs', guest: false, farmer: false, trader: false, analyst: false, admin: true },
];

export const PageAccessMatrix: React.FC<PageAccessMatrixProps> = ({
  currentUser,
  onNavigateToPage,
  onSelectRole,
}) => {
  const currentRole = currentUser?.role || 'guest';

  const renderBadge = (val: boolean | 'limited', roleKey: string, pageId: string, pageName: string) => {
    const isCurrentRole = currentRole === roleKey;

    if (val === true) {
      return (
        <button
          type="button"
          onClick={() => onNavigateToPage?.(pageId)}
          aria-label={`Open ${pageName} as ${roleKey}`}
          title={`Navigate to ${pageName} (${roleKey})`}
          className={`inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors ${
            isCurrentRole ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      );
    }

    if (val === 'limited') {
      return (
        <button
          type="button"
          onClick={() => onNavigateToPage?.(pageId)}
          aria-label={`Open limited ${pageName} as ${roleKey}`}
          title={`Limited public access for ${roleKey}`}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:border-emerald-400 transition-colors ${
            isCurrentRole ? 'ring-2 ring-emerald-500' : ''
          }`}
        >
          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Limited</span>
        </button>
      );
    }

    return (
      <span
        aria-label={`No access to ${pageName} for ${roleKey}`}
        className="inline-flex items-center justify-center w-6 h-6 text-slate-300 dark:text-slate-600"
      >
        <X className="w-4 h-4" />
      </span>
    );
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-5 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            14-Page Role-Based Access Matrix
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Least-privilege RBAC enforced across both client routes and Express backend APIs.
          </p>
        </div>

        {onSelectRole && (
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2 uppercase">
              Active Role:
            </span>
            {(['guest', 'farmer', 'trader', 'analyst', 'admin'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onSelectRole(r)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  currentRole === r
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider">
              <th className="py-3 px-4">Application Page</th>
              <th className="py-3 px-3 text-center">Guest</th>
              <th className="py-3 px-3 text-center">Farmer</th>
              <th className="py-3 px-3 text-center">Trader</th>
              <th className="py-3 px-3 text-center">Analyst</th>
              <th className="py-3 px-3 text-center">Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {MATRIX_DATA.map((row) => (
              <tr
                key={row.pageName}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                  {row.pageName}
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="flex justify-center">{renderBadge(row.guest, 'guest', row.pageId, row.pageName)}</div>
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="flex justify-center">{renderBadge(row.farmer, 'farmer', row.pageId, row.pageName)}</div>
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="flex justify-center">{renderBadge(row.trader, 'trader', row.pageId, row.pageName)}</div>
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="flex justify-center">{renderBadge(row.analyst, 'analyst', row.pageId, row.pageName)}</div>
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="flex justify-center">{renderBadge(row.admin, 'admin', row.pageId, row.pageName)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Current Session: <strong className="text-slate-900 dark:text-white capitalize">{currentRole}</strong>
          </span>
        </div>
        <span>Click any permitted checkmark under your active role to test navigation.</span>
      </div>
    </div>
  );
};
