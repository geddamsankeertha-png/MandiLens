/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  Sprout,
  Briefcase,
  GraduationCap,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  User,
} from 'lucide-react';
import { UserProfile } from '../types/mandi';
import { predictionApi } from '../services/predictionApi';

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
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // First-run initial Admin bootstrap state (strictly when SQLite has 0 admins)
  const [hasAdmin, setHasAdmin] = useState<boolean>(true);
  const [showAdminSetup, setShowAdminSetup] = useState<boolean>(false);
  const [adminName, setAdminName] = useState('System Administrator');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    predictionApi
      .getAdminStatus()
      .then((res) => {
        setHasAdmin(res.hasAdmin);
      })
      .catch(() => {
        // Ignore if server offline
      });
  }, []);

  // Real SQLite credential login (strict JWT + scrypt verification)
  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const authRes = await predictionApi.login(identifier.trim(), undefined, password);
      if (authRes?.user) {
        onLoginSuccess(authRes.user);
      } else {
        setErrorMsg('Invalid email or password.');
      }
    } catch (apiErr: any) {
      setErrorMsg(apiErr?.message || 'Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // First-run Admin Setup (strictly disabled once an admin exists in SQLite)
  const handleAdminSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!adminName.trim() || !adminEmail.trim() || adminPassword.length < 8) {
      setErrorMsg('Enter admin name, valid email, and a password of at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await predictionApi.setupAdmin(adminName.trim(), adminEmail.trim(), adminPassword);
      if (res?.user) {
        setHasAdmin(true);
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to create initial administrator.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Sign-In for the 3 standard non-admin roles via POST /api/auth/demo-login
  const handlePersonaSignIn = async (selectedRole: 'farmer' | 'trader' | 'analyst') => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const authRes = await predictionApi.demoLogin(selectedRole);
      if (authRes?.user) {
        onLoginSuccess(authRes.user);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to start demo session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <button
            type="button"
            onClick={onNavigateToHome}
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline mb-2.5"
          >
            <Sprout className="w-4 h-4" />
            <span>KisanMandi Agricultural Intelligence</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {showAdminSetup ? 'Initialize Local Administrator' : 'Sign In to KisanMandi'}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {showAdminSetup
              ? 'First-run setup: create the primary administrator account in local SQLite.'
              : 'Sign in with your account credentials or explore a standard demo role.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">{errorMsg}</p>
            </div>
          )}

          {/* First-Run Admin Setup Notice */}
          {!hasAdmin && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-2 text-xs">
              <span className="text-amber-900 dark:text-amber-200 font-semibold">
                No admin account configured yet.
              </span>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setShowAdminSetup(!showAdminSetup);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shrink-0"
              >
                {showAdminSetup ? 'Back to Login' : 'Setup Admin'}
              </button>
            </div>
          )}

          {showAdminSetup && !hasAdmin ? (
            <form onSubmit={handleAdminSetup} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Admin Display Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-name"
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Admin Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@kisanmandi.local"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Admin Password (min 8 chars) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Creating Admin...' : 'Create Administrator Account'}</span>
              </button>
            </form>
          ) : (
            <>
              {/* 1-Click Sample Testing Personas */}
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    1-Click Demo Access (Non-Admin)
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handlePersonaSignIn('farmer')}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:border-emerald-500 border border-slate-200 dark:border-slate-700 text-center transition-colors group"
                  >
                    <Sprout className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                    <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">Farmer</span>
                    <span className="block text-[10px] text-slate-500">EN / తెలుగు</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handlePersonaSignIn('trader')}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:border-emerald-500 border border-slate-200 dark:border-slate-700 text-center transition-colors group"
                  >
                    <Briefcase className="w-4 h-4 mx-auto text-amber-600 mb-1" />
                    <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">Trader</span>
                    <span className="block text-[10px] text-slate-500">Arbitrage</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handlePersonaSignIn('analyst')}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 hover:border-emerald-500 border border-slate-200 dark:border-slate-700 text-center transition-colors group"
                  >
                    <GraduationCap className="w-4 h-4 mx-auto text-sky-600 mb-1" />
                    <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">Analyst</span>
                    <span className="block text-[10px] text-slate-500">ML Metrics</span>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                <span className="flex-shrink mx-3 text-xs text-slate-400 font-medium">
                  or sign in with credentials
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              </div>

              {/* Credentials Form */}
              <form onSubmit={handleCredentialLogin} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                  >
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. farmer@kisanmandi.local"
                      className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                  >
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Footer Callout */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              New to KisanMandi?{' '}
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Create Local Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
