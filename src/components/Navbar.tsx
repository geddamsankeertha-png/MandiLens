/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  LogIn,
  Sprout,
  Bell,
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
  Menu,
  X,
  Moon,
  Sun,
  ChevronDown,
} from 'lucide-react';
import { UserProfile } from '../types/mandi';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'public' | 'workspace' | 'admin' | 'account';
}

export function getNavItemsForUser(currentUser: UserProfile | null): NavItem[] {
  const role = currentUser?.role;

  if (!currentUser) {
    return [
      { id: 'landing', label: 'Home', icon: Home, group: 'public' },
      { id: 'about', label: 'About Project', icon: BookOpen, group: 'public' },
      { id: 'explorer', label: 'Price Explorer', icon: Search, group: 'public' },
    ];
  }

  if (role === 'farmer') {
    return [
      { id: 'farmer', label: 'Farmer Dashboard', icon: Sprout, group: 'workspace' },
      { id: 'explorer', label: 'Price Explorer', icon: Search, group: 'public' },
      { id: 'landing', label: 'Portal Home', icon: Home, group: 'public' },
      { id: 'about', label: 'About Project', icon: BookOpen, group: 'public' },
      { id: 'alerts', label: 'Alerts & Advisories', icon: Bell, group: 'account' },
      { id: 'profile', label: 'Profile / Settings', icon: User, group: 'account' },
    ];
  }

  if (role === 'trader') {
    return [
      { id: 'markets', label: 'Trader Dashboard', icon: TrendingUp, group: 'workspace' },
      { id: 'explorer', label: 'Price Explorer', icon: Search, group: 'public' },
      { id: 'landing', label: 'Portal Home', icon: Home, group: 'public' },
      { id: 'about', label: 'About Project', icon: BookOpen, group: 'public' },
      { id: 'alerts', label: 'Alerts & Advisories', icon: Bell, group: 'account' },
      { id: 'profile', label: 'Profile / Settings', icon: User, group: 'account' },
    ];
  }

  if (role === 'analyst') {
    return [
      { id: 'analytics', label: 'Analyst Dashboard', icon: LineChart, group: 'workspace' },
      { id: 'models', label: 'Model Performance', icon: Cpu, group: 'workspace' },
      { id: 'explorer', label: 'Price Explorer', icon: Search, group: 'public' },
      { id: 'landing', label: 'Portal Home', icon: Home, group: 'public' },
      { id: 'about', label: 'About Project', icon: BookOpen, group: 'public' },
      { id: 'alerts', label: 'Alerts & Advisories', icon: Bell, group: 'account' },
      { id: 'profile', label: 'Profile / Settings', icon: User, group: 'account' },
    ];
  }

  if (role === 'admin') {
    return [
      { id: 'admin', label: 'Admin Control Hub', icon: ShieldAlert, group: 'admin' },
      { id: 'user_management', label: 'User Management', icon: Users, group: 'admin' },
      { id: 'data_management', label: 'Data Management', icon: Database, group: 'admin' },
      { id: 'system_logs', label: 'System Logs', icon: Terminal, group: 'admin' },
      { id: 'farmer', label: 'Farmer Workspace', icon: Sprout, group: 'workspace' },
      { id: 'markets', label: 'Trader Workspace', icon: TrendingUp, group: 'workspace' },
      { id: 'analytics', label: 'Analyst Workspace', icon: LineChart, group: 'workspace' },
      { id: 'models', label: 'Model Performance', icon: Cpu, group: 'workspace' },
      { id: 'explorer', label: 'Price Explorer', icon: Search, group: 'public' },
      { id: 'landing', label: 'Portal Home', icon: Home, group: 'public' },
      { id: 'about', label: 'About Project', icon: BookOpen, group: 'public' },
      { id: 'alerts', label: 'Alerts & Advisories', icon: Bell, group: 'account' },
      { id: 'profile', label: 'Profile / Settings', icon: User, group: 'account' },
    ];
  }

  return [];
}

const ROUTE_TITLES: Record<string, string> = {
  landing: 'Overview',
  about: 'About Project',
  explorer: 'Commodity Price Explorer',
  register: 'Create Account',
  login: 'Sign In',
  farmer: 'Farmer Decision Hub',
  markets: 'Trader Terminal',
  analytics: 'Market Analyst Workspace',
  models: 'ML Model Performance',
  alerts: 'Alerts & Advisories',
  profile: 'Profile & Preferences',
  admin: 'Administrator Control Center',
  data_management: 'Data Pipeline & CSV Management',
  user_management: 'User Directory & Access Control',
  system_logs: 'Security & Audit Logs',
};

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  watchlistCount: number;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  watchlistCount,
  isDarkMode = false,
  onToggleDarkMode,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navItems = getNavItemsForUser(currentUser);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProfileMenu(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setMobileMenuOpen]);

  const navigate = (id: string) => {
    setActiveTab(id);
    setShowProfileMenu(false);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-[1600px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Drawer Button (mobile/tablet or signed-in) + Clean Brand Wordmark */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className={`p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              currentUser ? 'lg:hidden' : 'md:hidden'
            }`}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => navigate('landing')}
            className="flex items-center gap-2.5 text-left group shrink-0"
          >
            <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:bg-emerald-700 transition-colors">
              <Sprout className="w-4 h-4" />
            </span>
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              KisanMandi
            </span>
          </button>

          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 pl-3 ml-1 border-l border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="capitalize font-medium">{currentUser.role}</span>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {ROUTE_TITLES[activeTab] || 'Workspace'}
              </span>
            </div>
          )}
        </div>

        {/* Center Navigation for Guest Desktop View */}
        {!currentUser && (
          <nav aria-label="Public navigation" className="hidden md:flex items-center gap-1 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Right: Theme Toggle & User Account / Auth Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {onToggleDarkMode && (
            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Light mode' : 'Dark mode'}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-expanded={showProfileMenu}
                aria-haspopup="menu"
                aria-label="Open account menu"
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-800"
              >
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold uppercase shrink-0">
                  {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                </span>
                <span className="max-w-[110px] truncate hidden sm:inline">
                  {currentUser.displayName || currentUser.role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showProfileMenu && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-4 z-50 space-y-3 text-slate-900 dark:text-slate-100"
                >
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold truncate">{currentUser.displayName}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 capitalize">
                        <CheckCircle2 className="w-3 h-3" />
                        {currentUser.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email}
                    </p>
                    {watchlistCount > 0 && (
                      <p className="text-[11px] text-slate-500 pt-1 tabular-nums">
                        Saved watchlist crops: <strong className="text-slate-700 dark:text-slate-300">{watchlistCount}</strong>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => navigate('profile')}
                    className="w-full py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left flex items-center gap-2 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Profile &amp; Settings</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-2"
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
                type="button"
                onClick={() => navigate('login')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 border ${
                  activeTab === 'login'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('register')}
                className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compact Mobile Drawer for Guests (only when open) */}
      {!currentUser && mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-lg z-40 px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};

interface WorkspaceSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  mobileOpen,
  setMobileOpen,
}) => {
  const navItems = getNavItemsForUser(currentUser);
  const groups: Array<{ key: NavItem['group']; label: string }> = [
    { key: 'admin', label: 'Administration' },
    { key: 'workspace', label: 'Role Workspace' },
    { key: 'public', label: 'Market Portal' },
    { key: 'account', label: 'Account' },
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sidebarContent = (
    <nav aria-label="Workspace navigation" className="p-4 space-y-5 overflow-y-auto h-full">
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
          Signed in as
        </span>
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
          {currentUser.displayName}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
          {currentUser.role} · {currentUser.preferredState || 'India'}
        </p>
      </div>

      {groups.map((grp) => {
        const items = navItems.filter((item) => item.group === grp.key);
        if (items.length === 0) return null;
        return (
          <div key={grp.key} className="space-y-1">
            <span className="px-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              {grp.label}
            </span>
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-[13px] transition-colors text-left ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/80'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white font-medium border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Persistent Desktop Sidebar (lg+) */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 sticky top-16 h-[calc(100vh-4rem)]">
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Slide-Over Sidebar Drawer (< lg) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 h-full z-10 flex flex-col shadow-xl">
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Sprout className="w-4 h-4" />
                </span>
                <span className="font-extrabold text-slate-900 dark:text-white">KisanMandi</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close workspace navigation"
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
          </aside>
        </div>
      )}
    </>
  );
};
