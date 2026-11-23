/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Globe,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Tag,
  AlertTriangle,
  X,
  Smartphone,
  MessageSquare,
  LayoutDashboard,
} from 'lucide-react';
import { UserProfile, IndianState } from '../types/mandi';
import { predictionApi } from '../services/predictionApi';

interface ProfilePageProps {
  currentUser: UserProfile | null;
  onUpdateProfile: (updated: UserProfile) => void;
  onDeleteAccount: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  onUpdateProfile,
  onDeleteAccount,
}) => {
  const [name, setName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const availableCommodities = [
    'Tomato (టొమాటో)',
    'Onion (ఉల్లిపాయ)',
    'Potato (బంగాళాదుంప)',
    'Rice / Paddy (వరి/ధాన్యం)',
    'Wheat (గోధుమ)',
    'Toor Dal / Pulses (కందిపప్పు)',
    'Cotton (పత్తి)',
    'Dry Red Chilli (మిరప)',
  ];
  const [selectedCommodities, setSelectedCommodities] = useState<string[]>(
    currentUser?.preferredCommodities || ['Tomato (టొమాటో)', 'Onion (ఉల్లిపాయ)']
  );

  const [state, setState] = useState<IndianState>(currentUser?.preferredState || 'Andhra Pradesh');
  const [district, setDistrict] = useState(currentUser?.preferredDistrict || 'Guntur');
  const [market, setMarket] = useState(currentUser?.preferredMarket || 'Guntur APMC Mandi');
  const [language, setLanguage] = useState<'en' | 'te' | 'hi'>(currentUser?.language || 'en');

  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(currentUser?.alertsEnabled ?? true);
  const [priceAlerts, setPriceAlerts] = useState<boolean>(true);
  const [weatherAlerts, setWeatherAlerts] = useState<boolean>(true);

  const [alertChannels, setAlertChannels] = useState<string[]>(
    currentUser?.alertChannels || ['dashboard', 'whatsapp']
  );

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDeleteModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleCommodity = (crop: string) => {
    setSelectedCommodities((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const toggleChannel = (channel: string) => {
    setAlertChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setProfileErrorMsg(null);

    const updated: UserProfile = {
      ...currentUser,
      displayName: name,
      email,
      phone: phone.trim() || undefined,
      preferredState: state,
      preferredDistrict: district,
      preferredMarket: market,
      preferredCommodities: selectedCommodities,
      language,
      alertsEnabled,
      alertChannels: alertChannels as any,
    };

    try {
      const res = await predictionApi.updateProfile(updated);
      onUpdateProfile(res.user || updated);
      setProfileSuccessMsg('Profile and preferences saved to SQLite database.');
      setTimeout(() => setProfileSuccessMsg(null), 3500);
    } catch (err: any) {
      setProfileErrorMsg(err?.message || 'Unable to save profile changes.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    try {
      const res = await predictionApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess(res.message || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 3500);
    } catch (err: any) {
      setPasswordError(err?.message || 'Could not update password.');
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteError(null);
    if (deleteConfirmationText.trim().toLowerCase() !== 'delete') {
      setDeleteError('Please type "DELETE" into the confirmation field to proceed.');
      return;
    }
    try {
      await predictionApi.deleteAccount();
      setShowDeleteModal(false);
      onDeleteAccount();
    } catch (err: any) {
      setDeleteError(err?.message || 'Unable to delete account.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <User className="w-4 h-4" />
            <span>Identity &amp; System Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Profile &amp; Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Manage personal credentials, preferred mandis, notification rules, and account security.
          </p>
        </div>

        <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider self-start sm:self-auto">
          Role: {currentUser?.role}
        </span>
      </div>

      {profileSuccessMsg && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{profileSuccessMsg}</span>
        </div>
      )}

      {profileErrorMsg && (
        <div
          role="alert"
          className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 text-xs font-bold rounded-xl flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{profileErrorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Section 1: Personal Details */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <User className="w-4 h-4 text-emerald-600" />
            <span>Personal Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="prof-email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                id="prof-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="prof-phone" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Phone Number (Optional)
              </label>
              <input
                id="prof-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional contact number"
                className="w-full text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Preferred Commodities */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>Preferred Commodities</span>
              </h2>
              <p className="text-xs text-slate-500">Select crops to track in price alerts and dashboards.</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {selectedCommodities.length} Selected
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {availableCommodities.map((crop) => {
              const isSelected = selectedCommodities.includes(crop);
              return (
                <button
                  type="button"
                  key={crop}
                  aria-pressed={isSelected}
                  onClick={() => toggleCommodity(crop)}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                  }`}
                >
                  <span>{crop}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Operating Mandis */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Preferred State, District &amp; Market Yard</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="prof-state" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Preferred State
              </label>
              <select
                id="prof-state"
                value={state}
                onChange={(e) => setState(e.target.value as IndianState)}
                className="w-full text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100"
              >
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Telangana">Telangana</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
              </select>
            </div>

            <div>
              <label htmlFor="prof-district" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Preferred District
              </label>
              <input
                id="prof-district"
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Guntur, Kurnool"
                className="w-full text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="prof-market" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Preferred Mandi
              </label>
              <input
                id="prof-market"
                type="text"
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                placeholder="e.g. Guntur APMC Mandi"
                className="w-full text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Language & Notifications */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>Language &amp; Alert Preferences</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Interface Language
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: 'en', label: 'English', sub: 'Default' },
                  { code: 'te', label: 'తెలుగు', sub: 'Telugu' },
                  { code: 'hi', label: 'हिन्दी', sub: 'Hindi' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    aria-pressed={language === item.code}
                    onClick={() => setLanguage(item.code as any)}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-colors ${
                      language === item.code
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="block text-sm">{item.label}</span>
                    <span className="text-[10px] opacity-80 block">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Alert Delivery Channels
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'email', label: 'Email', icon: Mail },
                  { id: 'sms', label: 'SMS', icon: Smartphone },
                  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                ].map((ch) => {
                  const Icon = ch.icon;
                  const isChecked = alertChannels.includes(ch.id);
                  return (
                    <button
                      type="button"
                      key={ch.id}
                      aria-pressed={isChecked}
                      onClick={() => toggleChannel(ch.id)}
                      className={`p-2.5 rounded-xl border font-semibold flex items-center justify-between transition-colors ${
                        isChecked
                          ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white border-slate-900 dark:border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" /> {ch.label}
                      </span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  Enable Master Notifications
                </span>
                <span className="text-[11px] text-slate-500">
                  Allow KisanMandi to record operational market price advisories in your feed.
                </span>
              </div>
              <input
                type="checkbox"
                checked={alertsEnabled}
                onChange={(e) => setAlertsEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  Price-Rise &amp; Drop Warnings
                </span>
                <span className="text-[11px] text-slate-500">
                  Notify when crop prices are projected to shift by more than 10%.
                </span>
              </div>
              <input
                type="checkbox"
                checked={priceAlerts}
                onChange={(e) => setPriceAlerts(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  Weather &amp; Transit Advisories
                </span>
                <span className="text-[11px] text-slate-500">
                  Receive rainfall and heat stress guidance affecting perishable crops.
                </span>
              </div>
              <input
                type="checkbox"
                checked={weatherAlerts}
                onChange={(e) => setWeatherAlerts(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Save Preferences &amp; Update Profile</span>
          </button>
        </div>
      </form>

      {/* Section 5: Change Password */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>Security &amp; Change Password</span>
        </h2>

        {passwordSuccess && (
          <div
            role="status"
            aria-live="polite"
            className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div
            role="alert"
            className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 text-xs font-bold rounded-xl flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label htmlFor="curr-pw" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Current Password
            </label>
            <input
              id="curr-pw"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter existing password"
              className="w-full text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="new-pw" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                id="new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="conf-pw" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                id="conf-pw"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full text-xs sm:text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2.5 px-3 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl transition-colors"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Section 6: Danger Zone */}
      <div className="bg-rose-50/60 dark:bg-rose-950/20 p-6 rounded-2xl border border-rose-200 dark:border-rose-900/60 space-y-3">
        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
          <Trash2 className="w-4 h-4" />
          <span>Permanent Account Deletion</span>
        </div>
        <p className="text-xs text-rose-800 dark:text-rose-300">
          Deleting your account permanently removes your saved profile, watchlists, and alert preferences from local SQLite.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-acct-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <h2 id="delete-acct-title">Confirm Account Deletion</h2>
              </div>
              <button
                type="button"
                aria-label="Close modal"
                onClick={() => setShowDeleteModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Type <span className="font-mono font-bold text-slate-900 dark:text-white">DELETE</span> below to permanently delete your account:
            </p>

            <input
              type="text"
              aria-label="Type DELETE to confirm"
              value={deleteConfirmationText}
              onChange={(e) => {
                setDeleteConfirmationText(e.target.value);
                setDeleteError(null);
              }}
              placeholder='Type "DELETE"'
              className="w-full text-xs font-bold font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
            />

            {deleteError && (
              <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
