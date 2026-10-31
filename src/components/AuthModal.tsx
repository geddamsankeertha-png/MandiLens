import React, { useState } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  User,
  LogIn,
  LogOut,
  X,
  Sprout,
  Briefcase,
  GraduationCap,
  Check,
  Shield,
  Layers,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { UserProfile, IndianState } from '../types/mandi';
import { INDIAN_STATES, MANDI_MARKETS } from '../data/mandiData';
import { syncUserProfile } from '../services/marketSyncService';

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

  // Real Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const profile: UserProfile = {
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Agricultural User',
        role: 'farmer',
        preferredState: 'Maharashtra',
        preferredMarket: 'Satara',
        createdAt: new Date().toISOString(),
      };

      await syncUserProfile(profile);
      setCurrentUser(profile);
      onClose();
    } catch (err) {
      console.warn('Popup sign in error, enabling demo fallback', err);
      setErrorMsg('Google Sign-In was cancelled or popup blocked. Try selecting a demo persona below.');
    } finally {
      setLoading(false);
    }
  };

  // Switch to one of the 3 specified agricultural personas
  const handleSelectPersona = async (role: 'farmer' | 'trader' | 'analyst') => {
    const personaNames = {
      farmer: 'Ramesh Patel (Smallholder Farmer)',
      trader: 'Vijay Deshmukh (APMC Commission Agent)',
      analyst: 'Dr. Sudhansu Taparia (Agricultural Policy Analyst)',
    };

    const preferredStates: Record<string, IndianState> = {
      farmer: 'Maharashtra',
      trader: 'Karnataka',
      analyst: 'Punjab',
    };

    const preferredMarkets = {
      farmer: 'Satara',
      trader: 'Shimoga',
      analyst: 'Khanna',
    };

    const profile: UserProfile = {
      id: `demo_${role}`,
      email: `${role}@mandi-predictor.gov.in`,
      displayName: personaNames[role],
      role,
      preferredState: preferredStates[role],
      preferredMarket: preferredMarkets[role],
      createdAt: new Date().toISOString(),
    };

    setCurrentUser(profile);
    await syncUserProfile(profile);
    onClose();
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
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
            Sign in to synchronize watchlists and cultivation scenarios across your mobile and desktop devices.
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
            {/* Real Firebase Google Login Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Connecting...' : 'Sign in with Google (Firebase)'}</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
              <span className="flex-shrink mx-3 text-[11px] text-stone-400 font-medium">
                Or Select Role Persona
              </span>
              <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
            </div>

            {/* Quick 1-Click Persona Cards */}
            <div className="space-y-2">
              <button
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
                      Fast mobile prices, SMS advisory & cost-saving tips
                    </div>
                  </div>
                </div>
              </button>

              <button
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
                      Volume elasticity, multi-mandi spread & price alerts
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSelectPersona('analyst')}
                className="w-full p-3 text-left rounded-xl border border-stone-200 dark:border-stone-700 hover:border-amber-500 dark:hover:border-amber-500 bg-stone-50 dark:bg-stone-800/60 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      Policy Analyst & Researcher
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Access to Cook's distance, R2 metrics & ARIMA benchmarks
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
