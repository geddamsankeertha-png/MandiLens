/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sprout,
  AlertCircle,
} from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types/mandi';
import { syncUserProfile } from '../services/marketSyncService';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onNavigateToRegister: () => void;
  onNavigateToHome: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateToHome,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Google Sign-In with Firebase popup
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      const profile: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || 'Google User',
        phone: fbUser.phoneNumber || '+91 98765 43210',
        emailVerified: fbUser.emailVerified ?? true,
        phoneVerified: Boolean(fbUser.phoneNumber),
        // Roles are provisioned by a trusted administrator; client selection is not authorization.
        role: 'farmer',
        preferredState: 'Andhra Pradesh',
        preferredMarket: 'Guntur',
        createdAt: new Date().toISOString(),
      };

      await syncUserProfile(profile);
      onLoginSuccess(profile);
    } catch (err) {
      console.warn('Google sign-in popup error:', err);
      setErrorMsg('Google Sign-In was cancelled or popup blocked. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-50 dark:bg-stone-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <button
            onClick={onNavigateToHome}
            className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline mb-3"
          >
            <Sprout className="w-4 h-4" />
            <span>KisanMandi Agricultural Intelligence</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Sign In to Dashboard
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            Sign in using your verified Google account.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">
                {errorMsg}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-50 text-stone-800 dark:text-stone-100 font-semibold text-sm rounded-xl transition-all shadow-sm"
          >
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>
          {/* Footer Callout */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 text-center">
            <p className="text-xs text-stone-600 dark:text-stone-400">
              New to KisanMandi?{' '}
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="font-bold text-amber-700 dark:text-amber-400 hover:underline"
              >
                Registration Preview
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
