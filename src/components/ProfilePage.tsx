/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Globe,
  Bell,
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
  // 1. Personal Info
  const [name, setName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '+91 98480 22334');

  // 2. Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 3. Preferred Commodities (Multi-select)
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

  // 4. Regional Preferences (State, District, Market)
  const [state, setState] = useState<IndianState>(currentUser?.preferredState || 'Andhra Pradesh');
  const [district, setDistrict] = useState(currentUser?.preferredDistrict || 'Guntur');
  const [market, setMarket] = useState(currentUser?.preferredMarket || 'Guntur APMC Mandi');

  // 5. Language Choice
  const [language, setLanguage] = useState<'en' | 'te' | 'hi'>(currentUser?.language || 'en');

  // 6. Alerts Toggles
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(currentUser?.alertsEnabled ?? true);
  const [priceAlerts, setPriceAlerts] = useState<boolean>(true);
  const [weatherAlerts, setWeatherAlerts] = useState<boolean>(true);

  // 7. Alert Delivery Channels (Dashboard, Email, SMS, WhatsApp)
  const [alertChannels, setAlertChannels] = useState<string[]>(
    currentUser?.alertChannels || ['dashboard', 'whatsapp']
  );

  // 8. Delete Account Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // Success Feedback
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const updated: UserProfile = {
      ...currentUser,
      displayName: name,
      email,
      phone,
      preferredState: state,
      preferredDistrict: district,
      preferredMarket: market,
      preferredCommodities: selectedCommodities,
      language,
      alertsEnabled,
      alertChannels: alertChannels as any,
    };

    onUpdateProfile(updated);
    setProfileSuccessMsg('Profile and preferences updated successfully!');
    setTimeout(() => setProfileSuccessMsg(null), 3500);
  };

  const handleChangePassword = (e: React.FormEvent) => {
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

    setPasswordSuccess('Password changed successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(null), 3500);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmationText.trim().toLowerCase() !== 'delete') {
      alert('Please type "DELETE" into the confirmation field to proceed.');
      return;
    }
    setShowDeleteModal(false);
    onDeleteAccount();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
            <User className="w-4 h-4 text-amber-600" />
            <span>Role-Based Identity & System Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
            Profile & Settings
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-0.5">
            Manage your personal credentials, operating mandis, multi-channel notification rules, and security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-xl border border-amber-200 dark:border-amber-800 uppercase tracking-wider">
            Role: {currentUser?.role}
          </span>
        </div>
      </div>

      {profileSuccessMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{profileSuccessMsg}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Section 1: Personal Details */}
        <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
            <User className="w-4 h-4 text-amber-600" />
            <span>Personal Information</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs font-semibold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs font-semibold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Mobile Number (Verified)
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs font-semibold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Preferred Commodities (Multi-Select) */}
        <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-600" />
                <span>Preferred Commodities (Multi-Select)</span>
              </h3>
              <p className="text-xs text-stone-500">
                Select crops to pin to your home dashboard, notifications, and price alerts.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-600">
              {selectedCommodities.length} Selected
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {availableCommodities.map((crop) => {
              const isSelected = selectedCommodities.includes(crop);
              return (
                <button
                  type="button"
                  key={crop}
                  onClick={() => toggleCommodity(crop)}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-800 dark:text-amber-200 ring-1 ring-amber-400'
                      : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-stone-400'
                  }`}
                >
                  <span>{crop}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Operating Mandis & Regional Scope */}
        <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span>Preferred State, District & Markets</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Preferred State
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value as IndianState)}
                className="w-full text-xs font-semibold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
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
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Preferred District
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Guntur, NTR, Kurnool"
                className="w-full text-xs font-semibold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Preferred Mandi / Market Yard
              </label>
              <input
                type="text"
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                placeholder="e.g. Guntur APMC Mandi"
                className="w-full text-xs font-semibold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Language & Notifications Setup */}
        <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
            <Globe className="w-4 h-4 text-amber-600" />
            <span>Language & Notification Methods</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Language Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Interface Language
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: 'en', label: 'English', sub: 'Default' },
                  { code: 'te', label: 'తెలుగు', sub: 'Telugu' },
                  { code: 'hi', label: 'हिन्दी', sub: 'Hindi' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLanguage(item.code as any)}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      language === item.code
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span className="block text-sm">{item.label}</span>
                    <span className="text-[10px] opacity-80 block">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Alert Channel Checkboxes */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Select Alert Delivery Channels
              </label>
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
                      onClick={() => toggleChannel(ch.id)}
                      className={`p-2.5 rounded-xl border font-semibold flex items-center justify-between transition-colors ${
                        isChecked
                          ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" /> {ch.label}
                      </span>
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Alert Toggles */}
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                  Enable Master Notifications
                </span>
                <span className="text-[11px] text-stone-500">
                  Allow KisanMandi to dispatch operational market price updates.
                </span>
              </div>
              <input
                type="checkbox"
                checked={alertsEnabled}
                onChange={(e) => setAlertsEnabled(e.target.checked)}
                className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                  Price-Rise & Drop Warnings
                </span>
                <span className="text-[11px] text-stone-500">
                  Notify when crop price is projected to fluctuate by &gt;10%.
                </span>
              </div>
              <input
                type="checkbox"
                checked={priceAlerts}
                onChange={(e) => setPriceAlerts(e.target.checked)}
                className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">
                  Extreme Weather & Monsoon Alerts
                </span>
                <span className="text-[11px] text-stone-500">
                  Receive rainfall and heat stress warnings affecting transport logistics.
                </span>
              </div>
              <input
                type="checkbox"
                checked={weatherAlerts}
                onChange={(e) => setWeatherAlerts(e.target.checked)}
                className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Profile Changes */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Save Preferences & Update Profile</span>
          </button>
        </div>
      </form>

      {/* Section 5: Change Password Card */}
      <div className="bg-white dark:bg-stone-900 p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
          <Lock className="w-4 h-4 text-amber-600" />
          <span>Security & Change Password</span>
        </h3>

        {passwordSuccess && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter existing password"
              className="w-full text-xs font-semibold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full text-xs font-semibold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full text-xs font-semibold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold rounded-xl transition-colors hover:bg-black dark:hover:bg-white"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Section 6: Danger Zone - Delete Account */}
      <div className="bg-rose-50/50 dark:bg-rose-950/20 p-6 sm:p-8 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
          <Trash2 className="w-4 h-4" />
          <span>Danger Zone: Permanent Account Deletion</span>
        </div>
        <p className="text-xs text-rose-800 dark:text-rose-300">
          Once you delete your account, your profile, personalized price alerts, procurement plans, and market watchlists will be permanently wiped. This action is irreversible.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Confirm Account Deletion</span>
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400">
              Are you sure? This will permanently delete your account, saved preferences, and alert triggers. To confirm, please type <span className="font-mono font-bold text-stone-900 dark:text-stone-100">DELETE</span> below:
            </p>

            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder='Type "DELETE"'
              className="w-full text-xs font-bold font-mono bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
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
