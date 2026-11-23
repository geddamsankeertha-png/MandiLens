/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, IndianState, CropGroup } from './types/mandi';
import { subscribeToWatchlist } from './services/marketSyncService';
import { predictionApi } from './services/predictionApi';
import { Navbar, WorkspaceSidebar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AboutPage } from './components/AboutPage';
import { PriceExplorerPage } from './components/PriceExplorerPage';
import { FarmerDashboard } from './components/FarmerDashboard';
import { TraderDashboard } from './components/TraderDashboard';
import { AnalystDashboard } from './components/AnalystDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AlertsPage } from './components/AlertsPage';
import { ProfilePage } from './components/ProfilePage';
import { RegisterPage } from './components/RegisterPage';
import { LoginPage } from './components/LoginPage';
import { Sprout, Moon, Sun, ShieldAlert } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [, setSelectedGroupForCalc] = useState<CropGroup>('Cereals');
  const [, setTargetStateForSim] = useState<IndianState>('Andhra Pradesh');
  const [, setTargetMarketForSim] = useState<string>('Guntur');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [capabilities, setCapabilities] = useState<{
    database?: string;
    mlEngine?: string;
    geminiConfigured?: boolean;
    agmarknetConfigured?: boolean;
    offlineReady?: boolean;
  } | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Verification emails link to the app root with ?token=...; render the
  // registration screen so it can submit the token and sign the user in.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('token')) {
      setActiveTab('register');
    }
  }, []);

  // Initialize theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Fetch system capabilities (SQLite + Python ML offline-ready status)
  useEffect(() => {
    predictionApi
      .getSystemCapabilities()
      .then((res) => {
        if (res) setCapabilities(res.capabilities || res);
      })
      .catch(() => {
        // Offline fallback notice handled cleanly
      });
  }, []);

  // Subscribe to SQLite-backed watchlist (or in-memory guest list)
  useEffect(() => {
    const unsub = subscribeToWatchlist(currentUser?.id || null, (items) => {
      setWatchlistIds(items.map((i) => i.id));
    });
    return () => unsub();
  }, [currentUser]);

  // Auth success handler (stores user in React state; JWT remains in memory in predictionApi)
  const handleAuthSuccess = (user: UserProfile) => {
    setAuthNotice(null);
    setCurrentUser(user);
    setMobileMenuOpen(false);
    if (user.preferredState) setTargetStateForSim(user.preferredState);
    if (user.preferredMarket) setTargetMarketForSim(user.preferredMarket);

    if (user.role === 'farmer') setActiveTab('farmer');
    else if (user.role === 'trader') setActiveTab('markets');
    else if (user.role === 'analyst') setActiveTab('analytics');
    else if (user.role === 'admin') setActiveTab('admin');
    else setActiveTab('farmer');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await predictionApi.logout();
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    setCurrentUser(null);
    setMobileMenuOpen(false);
    setActiveTab('landing');
  };

  // RBAC Permission Check Guard strictly aligned with the 14-Page Access Matrix
  const canAccess = (tab: string): boolean => {
    if (['landing', 'about', 'explorer', 'register', 'login'].includes(tab)) return true;
    if (!currentUser) return false;

    const role = currentUser.role;

    if (role === 'admin') return true;
    if (tab === 'farmer' && role === 'farmer') return true;
    if (tab === 'markets' && role === 'trader') return true;
    if (['analytics', 'models'].includes(tab) && role === 'analyst') return true;
    if (['alerts', 'profile'].includes(tab)) return true;

    return false;
  };

  // 1-Click Demo Role Switcher (calls backend POST /api/auth/demo-login for non-admin roles)
  const handleRoleSelect = async (role: 'guest' | 'farmer' | 'trader' | 'analyst' | 'admin') => {
    setAuthNotice(null);
    if (role === 'guest') {
      await handleLogout();
      return;
    }

    if (role === 'admin') {
      setActiveTab('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      const res = await predictionApi.demoLogin(role);
      if (res?.user) {
        handleAuthSuccess(res.user);
      }
    } catch (err: any) {
      setAuthNotice(err?.message || 'Unable to start demo session. Please use Sign In.');
      setActiveTab('login');
    }
  };

  const handleNavigateToPage = (pageId: string) => {
    if (canAccess(pageId)) {
      setActiveTab(pageId);
      setMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Render Access Denied Guard component
  const renderAccessDenied = (requiredRole: string) => (
    <div className="max-w-xl mx-auto my-12 px-4">
      <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            OWASP Least Privilege RBAC Enforcement
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Access Restricted
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Your current role (
            <span className="font-mono font-bold capitalize text-emerald-700 dark:text-emerald-400">
              {currentUser?.role || 'Guest'}
            </span>
            ) does not have authorization to view this resource.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Required Permission: <strong className="text-slate-700 dark:text-slate-300">{requiredRole}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {currentUser ? (
            <button
              type="button"
              onClick={() => {
                if (currentUser.role === 'farmer') setActiveTab('farmer');
                else if (currentUser.role === 'trader') setActiveTab('markets');
                else if (currentUser.role === 'analyst') setActiveTab('analytics');
                else setActiveTab('admin');
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Go to My Dashboard
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Sign In to Continue
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('landing')}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        watchlistCount={watchlistIds.length}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Workspace Body: Responsive Sidebar + Main Content */}
      <div className="flex-1 flex min-w-0">
        {currentUser && (
          <WorkspaceSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            mobileOpen={mobileMenuOpen}
            setMobileOpen={setMobileMenuOpen}
          />
        )}

        <main className="flex-1 min-w-0">
          {/* 1. Home / Landing Page */}
          {activeTab === 'landing' && (
            <LandingPage
              onNavigateToRegister={() => {
                setActiveTab('register');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateToLogin={() => {
                setActiveTab('login');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateToExplorer={() => {
                setActiveTab('explorer');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              currentUser={currentUser}
              onSelectRole={handleRoleSelect}
            />
          )}

          {/* 2. About Project Page */}
          {activeTab === 'about' && (
            <AboutPage
              onNavigateHome={() => setActiveTab('landing')}
              onNavigateRegister={() => setActiveTab('register')}
            />
          )}

          {/* 3. Commodity Price Explorer Page */}
          {activeTab === 'explorer' && (
            <PriceExplorerPage
              isLoggedIn={!!currentUser}
              onNavigateRegister={() => setActiveTab('register')}
            />
          )}

          {/* 4. Register Page */}
          {activeTab === 'register' && (
            <RegisterPage
              onRegisterSuccess={handleAuthSuccess}
              onNavigateToLogin={() => setActiveTab('login')}
              onNavigateToHome={() => setActiveTab('landing')}
            />
          )}

          {/* 5. Login Page */}
          {activeTab === 'login' && (
            <LoginPage
              onLoginSuccess={handleAuthSuccess}
              onNavigateToRegister={() => setActiveTab('register')}
              onNavigateToHome={() => setActiveTab('landing')}
            />
          )}

          {/* 6. Farmer Dashboard */}
          {activeTab === 'farmer' && (currentUser?.role === 'farmer' || currentUser?.role === 'admin') ? (
            <FarmerDashboard
              onNavigateToCalculator={(crop) => {
                setSelectedGroupForCalc(crop as CropGroup);
                setActiveTab('explorer');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateToMarkets={() => {
                setActiveTab('explorer');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : activeTab === 'farmer' ? (
            renderAccessDenied('Farmer or System Administrator')
          ) : null}

          {/* 7. Trader Dashboard */}
          {activeTab === 'markets' && (currentUser?.role === 'trader' || currentUser?.role === 'admin') ? (
            <TraderDashboard
              onNavigateToAnalytics={() => setActiveTab('analytics')}
              onNavigateToWatchlist={() => setActiveTab('alerts')}
            />
          ) : activeTab === 'markets' ? (
            renderAccessDenied('Trader or System Administrator')
          ) : null}

          {/* 8. Market Analyst Dashboard */}
          {activeTab === 'analytics' && (currentUser?.role === 'analyst' || currentUser?.role === 'admin') ? (
            <AnalystDashboard initialSection="home" />
          ) : activeTab === 'analytics' ? (
            renderAccessDenied('Market Analyst or System Administrator')
          ) : null}

          {/* 9. Model Performance Page */}
          {activeTab === 'models' && (currentUser?.role === 'analyst' || currentUser?.role === 'admin') ? (
            <AnalystDashboard initialSection="models" />
          ) : activeTab === 'models' ? (
            renderAccessDenied('Market Analyst or System Administrator')
          ) : null}

          {/* 10. Alerts & Notifications Page */}
          {activeTab === 'alerts' && currentUser ? (
            <AlertsPage currentUser={currentUser} />
          ) : activeTab === 'alerts' && !currentUser ? (
            renderAccessDenied('Authenticated User (Farmer, Trader, Analyst, Admin)')
          ) : null}

          {/* 11. Profile / Settings Page */}
          {activeTab === 'profile' && currentUser ? (
            <ProfilePage
              currentUser={currentUser}
              onUpdateProfile={(updated) => setCurrentUser(updated)}
              onDeleteAccount={handleLogout}
            />
          ) : activeTab === 'profile' && !currentUser ? (
            renderAccessDenied('Authenticated User')
          ) : null}

          {/* 12. Data Management (Admin only) */}
          {activeTab === 'data_management' && currentUser?.role === 'admin' ? (
            <AdminDashboard initialTab="data" />
          ) : activeTab === 'data_management' ? (
            renderAccessDenied('System Administrator')
          ) : null}

          {/* 13. User Management (Admin only) */}
          {activeTab === 'user_management' && currentUser?.role === 'admin' ? (
            <AdminDashboard initialTab="users" />
          ) : activeTab === 'user_management' ? (
            renderAccessDenied('System Administrator')
          ) : null}

          {/* 14. System Logs (Admin only) */}
          {activeTab === 'system_logs' && currentUser?.role === 'admin' ? (
            <AdminDashboard initialTab="logs" />
          ) : activeTab === 'system_logs' ? (
            renderAccessDenied('System Administrator')
          ) : null}

          {/* General Admin Control Center */}
          {activeTab === 'admin' && currentUser?.role === 'admin' ? (
            <AdminDashboard initialTab="home" />
          ) : activeTab === 'admin' ? (
            renderAccessDenied('System Administrator')
          ) : null}

          {/* Inline Auth Notice Banner (accessible live region) */}
          {authNotice && (
            <div role="status" aria-live="polite" className="max-w-4xl mx-auto mt-4 px-4 pb-6">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
                <span>{authNotice}</span>
                <button type="button" onClick={() => setAuthNotice(null)} className="underline text-xs shrink-0">
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
            <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              KisanMandi Agricultural Intelligence
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {capabilities?.offlineReady
                ? 'Local SQLite + Python ML (Zero Paid API Mode)'
                : 'Sources: Sample AGMARKNET Dataset & Optional data.gov.in'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition-colors"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
