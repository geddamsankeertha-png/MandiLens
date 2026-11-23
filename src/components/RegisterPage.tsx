/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Mail,
  Lock,
  User,
  MapPin,
  ArrowRight,
  Eye,
  EyeOff,
  Sprout,
  Briefcase,
  GraduationCap,
  AlertCircle,
  RefreshCw,
  Phone,
} from 'lucide-react';
import { IndianState, UserProfile } from '../types/mandi';
import { INDIAN_STATES, STATE_METADATA } from '../data/mandiData';
import { predictionApi } from '../services/predictionApi';

interface RegisterPageProps {
  onRegisterSuccess: (user: UserProfile) => void;
  onNavigateToLogin: () => void;
  onNavigateToHome: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
  onNavigateToHome,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'farmer' | 'trader' | 'analyst'>('farmer');
  const [selectedState, setSelectedState] = useState<IndianState>('Maharashtra');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [pendingVerification, setPendingVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [devToken, setDevToken] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Check URL query for verification token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      handleVerifyTokenSubmit(urlToken);
    }
  }, []);

  const handleVerifyTokenSubmit = async (tokenToVerify: string) => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await predictionApi.verifyEmail(tokenToVerify);
      if (res.user) {
        onRegisterSuccess(res.user);
      } else {
        setVerifyMessage(res.message || 'Email verified successfully! You may now sign in.');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Invalid or expired verification token.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);

    try {
      const preferredMarket = STATE_METADATA[selectedState]?.capital || 'Central Mandi';
      const authRes = await predictionApi.register({
        displayName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        preferredState: selectedState,
        preferredDistrict: preferredMarket,
        preferredMarket,
        preferredCommodities: ['Tomato', 'Onion'],
        phone: phoneNumber.trim() || undefined,
        language: 'en',
      });

      setRegisteredEmail(email.trim().toLowerCase());
      if (authRes?.dev_token) {
        setDevToken(authRes.dev_token);
      }
      setPendingVerification(true);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setFormError(err?.message || 'Unable to complete registration. Please check inputs and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setFormError(null);
    setIsResending(true);
    try {
      const res = await predictionApi.resendVerification(registeredEmail);
      if (res.dev_token) {
        setDevToken(res.dev_token);
      }
      setVerifyMessage(res.message || 'Verification email resent.');
    } catch (err: any) {
      setFormError(err?.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  if (pendingVerification) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 mx-auto">
            <Mail className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Check Your Email</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              We have sent a verification link to <strong className="text-emerald-700 dark:text-emerald-400">{registeredEmail}</strong>. Please check your inbox and click the link to activate your account.
            </p>
          </div>

          {formError && (
            <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-700 dark:text-rose-300">
              {formError}
            </div>
          )}

          {verifyMessage && (
            <div role="status" className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-700 dark:text-emerald-300">
              {verifyMessage}
            </div>
          )}

          {devToken && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-left space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Development / SMTP Unconfigured Mode</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">
                SMTP credentials are not configured in environment variables. For testing and demonstration, use the verification token below:
              </p>
              <div className="p-2 bg-white dark:bg-slate-900 rounded border border-amber-300 dark:border-amber-700 font-mono text-[10px] break-all text-slate-800 dark:text-slate-200">
                {devToken}
              </div>
              <button
                type="button"
                onClick={() => handleVerifyTokenSubmit(devToken)}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verify Instantly with Dev Token</span>
              </button>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Or paste verification token..."
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
              <button
                type="button"
                disabled={!manualToken.trim() || isSubmitting}
                onClick={() => handleVerifyTokenSubmit(manualToken.trim())}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl disabled:opacity-50"
              >
                Verify
              </button>
            </div>

            <button
              type="button"
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isResending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              <span>Resend Verification Email</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToLogin}
              className="w-full text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline pt-2"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <button
            type="button"
            onClick={onNavigateToHome}
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline mb-2.5"
          >
            <Sprout className="w-4 h-4" />
            <span>KisanMandi Agricultural Platform</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Create Verified Account
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            Access APMC mandi forecasts, arbitrage tools, and backtested analytics across all 28 Indian states.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
          {formError && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-medium">{formError}</p>
            </div>
          )}

          <form onSubmit={handleSubmitRegistration} className="space-y-6">
            {/* 1. Full Name */}
            <div>
              <label
                htmlFor="reg-fullname"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="reg-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* 2. Role Selector */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Select Your Role *
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Account role">
                {[
                  { id: 'farmer', label: 'Farmer / FPO', desc: 'Sell crops at fair APMC rates', icon: Sprout },
                  { id: 'trader', label: 'Mandi Trader', desc: 'Track arrivals & spot margins', icon: Briefcase },
                  { id: 'analyst', label: 'Market Analyst', desc: 'Econometric & ML diagnostics', icon: GraduationCap },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = role === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setRole(item.id as 'farmer' | 'trader' | 'analyst')}
                      className={`p-3.5 rounded-xl border text-left transition-colors ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`} />
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Primary State */}
            <div>
              <label
                htmlFor="reg-state"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Primary Operating State (28 States) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <select
                  id="reg-state"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value as IndianState)}
                  className="w-full pl-9 pr-8 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st} ({STATE_METADATA[st]?.region} Zone)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Email Address */}
            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Email Address * (Real Verification Email Sent)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* 5. Optional Phone Number */}
            <div>
              <label
                htmlFor="reg-phone"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Phone Number (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="reg-phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Optional contact number"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* 6. Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
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

              <div>
                <label
                  htmlFor="reg-confirm-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registering & Sending Email...</span>
                </>
              ) : (
                <>
                  <span>Register & Verify Email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Sign In here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
