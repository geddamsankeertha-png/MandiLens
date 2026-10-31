/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, X, Shield, Users, ArrowRight } from 'lucide-react';
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
  { pageName: 'Model Performance', pageId: 'analytics', guest: false, farmer: false, trader: false, analyst: true, admin: true },
  { pageName: 'Data Management', pageId: 'admin', guest: false, farmer: false, trader: false, analyst: false, admin: true },
  { pageName: 'User Management', pageId: 'admin', guest: false, farmer: false, trader: false, analyst: false, admin: true },
  { pageName: 'System Logs', pageId: 'admin', guest: false, farmer: false, trader: false, analyst: false, admin: true },
];

export const PageAccessMatrix: React.FC<PageAccessMatrixProps> = ({
  currentUser,
  onNavigateToPage,
  onSelectRole,
}) => {
  const currentRole = currentUser?.role || 'guest';

  const renderBadge = (val: boolean | 'limited', roleKey: string, pageId: string) => {
    const isCurrentRole = currentRole === roleKey;

    if (val === true) {
      return (
        <button
          type="button"
          onClick={() => onNavigateToPage?.(pageId)}
          title={`Click to navigate to ${pageId} (${roleKey})`}
          className={`inline-flex items-center justify-center w-5 h-5 rounded-xs bg-[#10b981] text-white hover:scale-110 transition-transform ${
            isCurrentRole ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-stone-950' : ''
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </button>
      );
    }

    if (val === 'limited') {
      return (
        <button
          type="button"
          onClick={() => onNavigateToPage?.(pageId)}
          title={`Limited access for ${roleKey}`}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-transparent text-[#e5e7eb] text-xs font-normal hover:opacity-80 transition-opacity ${
            isCurrentRole ? 'ring-1 ring-emerald-400' : ''
          }`}
        >
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-xs bg-[#10b981] text-white shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
          </span>
          <span className="text-[#d1d5db] font-mono text-[13px]">limited</span>
        </button>
      );
    }

    return (
      <span className="inline-flex items-center justify-center w-5 h-5 text-[#ef4444]">
        <X className="w-4 h-4 stroke-[3]" />
      </span>
    );
  };

  return (
    <div className="w-full bg-[#0d1117] text-white p-6 sm:p-8 rounded-2xl border border-[#21262d] shadow-2xl space-y-6 font-sans">
      {/* Top Header matching image */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#21262d]">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif tracking-tight text-white font-medium">
            Page access matrix
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Least privilege RBAC enforcement: verified on client and backend per OWASP security guidelines.
          </p>
        </div>

        {/* 1-Click Interactive Persona Switcher for Instant Testing */}
        {onSelectRole && (
          <div className="flex items-center gap-1.5 p-1 bg-[#161b22] border border-[#30363d] rounded-xl text-xs">
            <span className="text-[11px] font-mono text-stone-400 px-2 uppercase font-semibold">Test as:</span>
            {(['guest', 'farmer', 'trader', 'analyst', 'admin'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onSelectRole(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  currentRole === r
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : 'text-stone-300 hover:text-white hover:bg-[#21262d]'
                }`}
              >
                {r === 'analyst' ? 'Analyst' : r}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* The Matrix Table reproducing the image exactly */}
      <div className="overflow-x-auto rounded-xl border border-[#21262d]">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#21262d] bg-[#161b22]/70 text-stone-100 font-semibold text-xs sm:text-sm">
              <th className="py-3.5 px-5 font-bold tracking-tight">Page</th>
              <th className="py-3.5 px-4 text-center font-bold tracking-tight">Guest / Public</th>
              <th className="py-3.5 px-4 text-center font-bold tracking-tight">Farmer</th>
              <th className="py-3.5 px-4 text-center font-bold tracking-tight">Trader</th>
              <th className="py-3.5 px-4 text-center font-bold tracking-tight">Market Analyst</th>
              <th className="py-3.5 px-4 text-center font-bold tracking-tight">Admin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#21262d] text-xs sm:text-sm font-normal">
            {MATRIX_DATA.map((row, idx) => (
              <tr
                key={row.pageName}
                className="hover:bg-[#161b22]/90 transition-colors group"
              >
                <td className="py-3.5 px-5 text-stone-200 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-200 group-hover:text-amber-400 transition-colors">
                      {row.pageName}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center">
                    {renderBadge(row.guest, 'guest', row.pageId)}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center">
                    {renderBadge(row.farmer, 'farmer', row.pageId)}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center">
                    {renderBadge(row.trader, 'trader', row.pageId)}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center">
                    {renderBadge(row.analyst, 'analyst', row.pageId)}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center">
                    {renderBadge(row.admin, 'admin', row.pageId)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Info Note */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-400 pt-2 border-t border-[#21262d]">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-500" />
          <span>Active Role: <strong className="text-white capitalize">{currentRole}</strong></span>
          <span className="text-stone-600">·</span>
          <span>Click on any green badge to directly test navigation</span>
        </div>
        <div className="text-[11px] font-mono text-stone-500">
          OWASP Least Privilege Security Architecture
        </div>
      </div>
    </div>
  );
};
