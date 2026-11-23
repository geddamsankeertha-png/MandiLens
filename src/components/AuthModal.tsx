import React, { useState } from 'react';
import {
  User,
  LogOut,
  X,
  Sprout,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import { UserProfile, IndianState } from '../types/mandi';
import { INDIAN_STATES, MANDI_MARKETS } from '../data/mandiData';
import { syncUserProfile } from '../services/marketSyncService';
import { predictionApi } from '../services/predictionApi';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  setCurrentUser,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Switch to one of the 3 standard non-admin agricultural personas via backend demo-login
  const handleSelectPersona = async (role: 'farmer' | 'trader' | 'analyst') => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await predictionApi.demoLogin(role);
      if (res?.user) {
        setCurrentUser(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to sign in with demo role.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await predictionApi.logout();
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 max-w-md w-full rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-600" />
            <span>Mandi User Profile & Authentication</span>
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Sign in with a local role session to synchronize watchlists and cultivation scenarios in SQLite.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-800 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        {currentUser ? (
          <div className="space-y-4">
            <div className="p-4 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  {currentUser.displayName}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  {currentUser.role}
                </span>
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                {currentUser.email}
              </div>
              <div className="text-xs text-stone-600 dark:text-stone-300 pt-2 space-y-2 border-t border-stone-200 dark:border-stone-700">
                <div className="font-semibold text-stone-700 dark:text-stone-300">Set Default APMC Mandi (28 States):</div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={currentUser.preferredState}
                    onChange={async (e) => {
                      const st = e.target.value as IndianState;
                      const firstMkt = MANDI_MARKETS.find((m) => m.state === st)?.name || '';
                      const updated = { ...currentUser, preferredState: st, preferredMarket: firstMkt };
                      setCurrentUser(updated);
                      await syncUserProfile(updated);
                    }}
                    className="p-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <select
                    value={currentUser.preferredMarket}
                    onChange={async (e) => {
                      const mkt = e.target.value;
                      const updated = { ...currentUser, preferredMarket: mkt };
                      setCurrentUser(updated);
                      await syncUserProfile(updated);
                    }}
                    className="p-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg"
                  >
                    {MANDI_MARKETS.filter((m) => m.state === currentUser.preferredState).map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-[11px] text-stone-500 font-medium">
              Select a Demo Role Persona (Local Offline SQLite Session):
            </div>

            {/* Quick 1-Click Persona Cards */}
            <div className="space-y-2">
              <button
                disabled={loading}
                onClick={() => handleSelectPersona('farmer')}
                className="w-full p-3 text-left rounded-xl border border-stone-200 dark:border-stone-700 hover:border-amber-500 dark:hover:border-amber-500 bg-stone-50 dark:bg-stone-800/60 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      Smallholder Farmer
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Fast prices, bilingual advisory &amp; best market tips
                    </div>
                  </div>
                </div>
              </button>

              <button
                disabled={loading}
                onClick={() => handleSelectPersona('trader')}
                className="w-full p-3 text-left rounded-xl border border-stone-200 dark:border-stone-700 hover:border-amber-500 dark:hover:border-amber-500 bg-stone-50 dark:bg-stone-800/60 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      APMC Trader / Commission Agent
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Volume elasticity, multi-mandi spread &amp; profit tools
                    </div>
                  </div>
                </div>
              </button>

              <button
                disabled={loading}
                onClick={() => handleSelectPersona('analyst')}
                className="w-full p-3 text-left rounded-xl border border-stone-200 dark:border-stone-700 hover:border-amber-500 dark:hover:border-amber-500 bg-stone-50 dark:bg-stone-800/60 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      Policy Analyst &amp; Researcher
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Access to R² metrics, residuals &amp; backtesting benchmarks
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
