import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
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
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { IndianState, UserProfile } from '../types/mandi';
import { INDIAN_STATES, STATE_METADATA } from '../data/mandiData';

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
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'farmer' | 'trader' | 'analyst'>('farmer');
  const [selectedState, setSelectedState] = useState<IndianState>('Maharashtra');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email verification state
  const [emailVerified, setEmailVerified] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailVerificationToken, setEmailVerificationToken] = useState<string | null>(null);
  const [emailVerifyModal, setEmailVerifyModal] = useState(false);

  // Phone OTP verification state
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [showOtpNotification, setShowOtpNotification] = useState(false);

  // General error / loading
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle email "Verify Me" trigger
  const handleTriggerEmailVerification = () => {
    setFormError(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setFormError('Please enter a valid email address before verification.');
      return;
    }

    setIsVerifyingEmail(true);
    // Generate verification session
    const token = `verify_${Math.random().toString(36).substring(2, 9)}`;
    setEmailVerificationToken(token);

    setTimeout(() => {
      setIsVerifyingEmail(false);
      setEmailVerifyModal(true);
    }, 400);
  };

  // Confirm email verification
  const handleConfirmEmailVerification = () => {
    setEmailVerified(true);
    setEmailVerifyModal(false);
    setEmailVerificationToken(null);
  };

  // Handle Send OTP
  const handleSendOtp = () => {
    setFormError(null);
    setOtpError(null);
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSendingOtp(true);
    // Generate a 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    setTimeout(() => {
      setIsSendingOtp(false);
      setOtpSent(true);
      setShowOtpNotification(true);
      setOtpTimer(60);

      // Countdown
      const interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 600);
  };

  // Handle OTP box input
  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...enteredOtp];
    newOtp[index] = val.slice(-1);
    setEnteredOtp(newOtp);

    // Auto advance
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle backspace in OTP
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !enteredOtp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Auto-fill OTP helper
  const handleAutoFillOtp = () => {
    if (generatedOtp) {
      const digits = generatedOtp.split('');
      setEnteredOtp(digits);
      setOtpError(null);
    }
  };

  // Verify OTP submission
  const handleVerifyOtp = () => {
    setOtpError(null);
    const codeEntered = enteredOtp.join('');
    if (codeEntered.length !== 6) {
      setOtpError('Please enter all 6 digits of the OTP.');
      return;
    }

    if (codeEntered === generatedOtp) {
      setPhoneVerified(true);
      setOtpSent(false);
      setShowOtpNotification(false);
    } else {
      setOtpError('Invalid OTP code. Please check the SMS notification or click Resend.');
    }
  };

  // Submit complete registration
  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormError('Registration is not configured. The email and SMS verification screens here are demos and do not verify ownership. Use Google sign-in or connect real Firebase verification first.');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-50 dark:bg-stone-950 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Header Breadcrumb / Brand */}
        <div className="text-center mb-8">
          <button
            onClick={onNavigateToHome}
            className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline mb-3"
          >
            <Sprout className="w-4 h-4" />
            <span>KisanMandi Agricultural Platform</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Registration Preview
          </h1>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            Registration is not active yet. The email and SMS verification controls below are demonstration UI only.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8">
          {formError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 font-medium">
                {formError}
              </p>
            </div>
          )}

          {/* Simulated SMS Alert Banner */}
          {showOtpNotification && generatedOtp && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 text-stone-800 dark:text-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                  <Phone className="w-3.5 h-3.5" />
                  <span>SMS Gateway Dispatch</span>
                </div>
                <p className="text-xs text-stone-700 dark:text-stone-300">
                  Your verification code for KisanMandi is{' '}
                  <strong className="text-amber-700 dark:text-amber-300 font-mono text-sm tracking-wider">
                    {generatedOtp}
                  </strong>
                  . (Valid for 10 min)
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoFillOtp}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
              >
                Auto-fill OTP
              </button>
            </div>
          )}

          <form onSubmit={handleSubmitRegistration} className="space-y-6">
            {/* 1. Full Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            {/* 2. Role Selector (Agricultural Persona) */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
                Select Your Role *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'farmer',
                    label: 'Farmer / FPO',
                    desc: 'Sell crops at fair APMC rates',
                    icon: Sprout,
                  },
                  {
                    id: 'trader',
                    label: 'Mandi Trader',
                    desc: 'Track arrivals & spot margins',
                    icon: Briefcase,
                  },
                  {
                    id: 'analyst',
                    label: 'Market Analyst',
                    desc: 'Econometric & policy research',
                    icon: GraduationCap,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = role === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setRole(item.id as 'farmer' | 'trader' | 'analyst')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm'
                          : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-stone-500'}`} />
                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-900 dark:text-amber-200' : 'text-stone-800 dark:text-stone-200'}`}>
                          {item.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Primary State Selection */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Primary Operating State (28 States) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value as IndianState)}
                  className="w-full pl-9 pr-8 py-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-stone-900 dark:text-stone-100"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st} ({STATE_METADATA[st]?.region} Zone)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Email Address with Mandatory "Verify Me" Button */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Email Address *
                </label>
                {emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                ) : (
                  <span className="text-[11px] text-stone-400 dark:text-stone-500">
                    Verification required
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    disabled={emailVerified}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailVerified(false);
                    }}
                    placeholder="farmer@example.com"
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border focus:outline-none ${
                      emailVerified
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700 text-stone-700 dark:text-stone-300'
                        : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 focus:ring-2 focus:ring-amber-500'
                    }`}
                  />
                </div>

                {!emailVerified ? (
                  <button
                    type="button"
                    onClick={handleTriggerEmailVerification}
                    disabled={isVerifyingEmail || !email}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {isVerifyingEmail ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>Verify Me</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEmailVerified(false)}
                    className="px-3 py-2 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                  >
                    Change
                  </button>
                )}
              </div>
            </div>

            {/* 5. Phone Number with Mandatory OTP Verification */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Mobile Phone Number *
                </label>
                {phoneVerified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Phone Verified
                  </span>
                ) : (
                  <span className="text-[11px] text-stone-400 dark:text-stone-500">
                    OTP verification required
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500 font-semibold text-xs">
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    disabled={phoneVerified}
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setPhoneVerified(false);
                      setOtpSent(false);
                    }}
                    placeholder="98765 43210"
                    maxLength={10}
                    className={`w-full pl-11 pr-3 py-2 text-sm rounded-lg border focus:outline-none ${
                      phoneVerified
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700 text-stone-700 dark:text-stone-300'
                        : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 focus:ring-2 focus:ring-amber-500'
                    }`}
                  />
                </div>

                {!phoneVerified ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || phoneNumber.length < 10}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {isSendingOtp ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Phone className="w-3.5 h-3.5" />
                    )}
                    <span>{otpSent ? 'Resend OTP' : 'Send OTP'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneVerified(false);
                      setOtpSent(false);
                    }}
                    className="px-3 py-2 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* OTP Entry Grid when OTP is sent */}
              {otpSent && !phoneVerified && (
                <div className="pt-3 border-t border-stone-200 dark:border-stone-700 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      Enter 6-Digit OTP:
                    </span>
                    {otpTimer > 0 ? (
                      <span className="text-stone-500">Resend in {otpTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 justify-between max-w-xs mx-auto">
                    {enteredOtp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-10 h-11 text-center font-mono font-bold text-base bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-600 rounded-lg focus:border-amber-500 focus:outline-none"
                      />
                    ))}
                  </div>

                  {otpError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 text-center font-medium">
                      {otpError}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify OTP</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-stone-900 dark:text-stone-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-stone-900 dark:text-stone-100"
                  />
                </div>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="p-3 bg-stone-100/60 dark:bg-stone-800/40 rounded-xl text-xs space-y-1.5 border border-stone-200 dark:border-stone-700">
              <span className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                Account Verification Status:
              </span>
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
                {emailVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-stone-400 shrink-0" />
                )}
                <span>Email address verified via "Verify Me" button</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400">
                {phoneVerified ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-stone-400 shrink-0" />
                )}
                <span>Phone number verified via 6-digit SMS OTP</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !emailVerified || !phoneVerified}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 transform active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating Verified Profile...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 pt-6 border-t border-stone-100 dark:border-stone-800 text-center">
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-bold text-amber-700 dark:text-amber-400 hover:underline"
              >
                Sign In here
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Email Verification Modal */}
      {emailVerifyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 max-w-md w-full rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 mx-auto">
              <Mail className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Confirm Email Verification
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                A verification request was initiated for:
              </p>
              <p className="text-sm font-bold font-mono text-amber-700 dark:text-amber-400">
                {email}
              </p>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl text-xs text-stone-600 dark:text-stone-300 space-y-1.5 border border-stone-200 dark:border-stone-700">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Verification Link Simulation</span>
              </div>
              <p>
                Click <strong>"Verify Me"</strong> below to confirm that you own this email address and authorize agricultural market alerts.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmEmailVerification}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify Me Now</span>
              </button>
              <button
                type="button"
                onClick={() => setEmailVerifyModal(false)}
                className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium text-xs rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
