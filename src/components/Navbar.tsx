/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LogIn,
  Sprout,
  Bell,
  Calculator,
  LineChart,
  LogOut,
  CheckCircle2,
  TrendingUp,
  UserPlus,
  Home,
  BookOpen,
  Search,
  User,
  Users,
  ShieldAlert,
  Database,
  Terminal,
  Cpu,
} from 'lucide-react';
import { UserProfile } from '../types/mandi';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  watchlistCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  watchlistCount,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Strict Role-Based Access Control Menu items per prompt
  const getNavItems = () => {
    const role = currentUser?.role;

    if (!currentUser) {
      return [
        { id: 'landing', label: 'Home', icon: Home },
        { id: 'about', label: 'About Project', icon: BookOpen },
        { id: 'explorer', label: 'Price Explorer', icon: Search },
      ];
    }

    if (role === 'farmer') {
      return [
        { id: 'landing', label: 'Home', icon: Home },
        { id: 'about', label: 'About Project', icon: BookOpen },
        { id: 'explorer', label: 'Price Explorer', icon: Search },
        { id: 'farmer', label: 'Farmer Dashboard', icon: Sprout },
        { id: 'alerts', label: 'Alerts', icon: Bell },
        { id: 'profile', label: 'Profile / Settings', icon: User },
      ];
    }

    if (role === 'trader') {
      return [
        { id: 'landing', label: 'Home', icon: Home },
        { id: 'about', label: 'About Project', icon: BookOpen },
        { id: 'explorer', label: 'Price Explorer', icon: Search },
        { id: 'markets', label: 'Trader Dashboard', icon: TrendingUp },
        { id: 'alerts', label: 'Alerts', icon: Bell },
        { id: 'profile', label: 'Profile / Settings', icon: User },
      ];
    }

    if (role === 'analyst') {
      return [
        { id: 'landing', label: 'Home', icon: Home },
        { id: 'about', label: 'About Project', icon: BookOpen },
        { id: 'explorer', label: 'Price Explorer', icon: Search },
        { id: 'analytics', label: 'Analyst Dashboard', icon: LineChart },
        { id: 'models', label: 'Model Performance', icon: Cpu },
        { id: 'alerts', label: 'Alerts', icon: Bell },
        { id: 'profile', label: 'Profile / Settings', icon: User },
      ];
    }

    if (role === 'admin') {
      return [
        { id: 'landing', label: 'Home', icon: Home },
        { id: 'admin', label: 'Admin Hub', icon: ShieldAlert },
        { id: 'about', label: 'About Project', icon: BookOpen },
        { id: 'explorer', label: 'Price Explorer', icon: Search },
        { id: 'farmer', label: 'Farmer Dash', icon: Sprout },
        { id: 'markets', label: 'Trader Dash', icon: TrendingUp },
        { id: 'analytics', label: 'Analyst Dash', icon: LineChart },
        { id: 'models', label: 'Model Performance', icon: Cpu },
        { id: 'user_management', label: 'User Management', icon: Users },
        { id: 'data_management', label: 'Data Management', icon: Database },
        { id: 'system_logs', label: 'System Logs', icon: Terminal },
        { id: 'alerts', label: 'Alerts', icon: Bell },
        { id: 'profile', label: 'Profile / Settings', icon: User },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  return (
    <header className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur-md border-b border-stone-800 text-white transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Brand Wordmark */}
          <button
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold shadow-sm group-hover:bg-amber-700 transition-colors">
              <Sprout className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap block leading-none">
                KisanMandi
              </span>
              <span className="text-[10px] text-amber-400 block mt-0.5 font-mono">
                {currentUser ? `${currentUser.role.toUpperCase()} ACCESS` : 'Public Portal'}
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-stone-300">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    isActive
                      ? 'text-amber-400 border-amber-400 font-bold'
                      : 'border-transparent hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-amber-500" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Auth Zone */}
          <div className="flex items-center gap-2.5 shrink-0">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-stone-200 bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors border border-stone-800"
                >
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold uppercase">
                    {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                  </div>
                  <span className="max-w-[100px] truncate hidden sm:inline">
                    {currentUser.displayName || currentUser.role}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-stone-900 rounded-2xl shadow-2xl border border-stone-800 p-4 z-50 space-y-3 text-stone-100">
                    <div className="border-b border-stone-800 pb-3">
                      <p className="text-xs font-bold text-white">
                        {currentUser.displayName}
                      </p>
                      <p className="text-[11px] text-stone-400 truncate">
                        {currentUser.email}
                      </p>
                      <p className="text-[11px] font-mono text-amber-400 capitalize">
                        Role: {currentUser.role}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('profile');
                      }}
                      className="w-full py-1.5 px-3 text-xs font-semibold text-stone-300 hover:bg-stone-800 rounded-lg text-left"
                    >
                      Profile & Settings
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="w-full py-2 px-3 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('login')}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-300 hover:text-white rounded-xl transition-colors flex items-center gap-1.5 border border-stone-800"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>

                <button
                  onClick={() => setActiveTab('register')}
                  className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile secondary navigation */}
        {navItems.length > 0 && (
          <div className="lg:hidden flex items-center gap-2 overflow-x-auto py-2 border-t border-stone-800 no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'bg-stone-900 text-stone-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
