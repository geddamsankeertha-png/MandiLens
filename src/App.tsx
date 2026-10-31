/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, testConnection } from './lib/firebase';
import { UserProfile, IndianState, CropGroup } from './types/mandi';
import { subscribeToWatchlist } from './services/marketSyncService';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AboutPage } from './components/AboutPage';
import { PriceExplorerPage } from './components/PriceExplorerPage';
import { FarmerDashboard } from './components/FarmerDashboard';
import { TraderDashboard } from './components/TraderDashboard';
import { AnalyticsLab } from './components/AnalyticsLab';
import { AnalystDashboard } from './components/AnalystDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AlertsPage } from './components/AlertsPage';
import { ProfilePage } from './components/ProfilePage';
import { RegisterPage } from './components/RegisterPage';
import { LoginPage } from './components/LoginPage';
import { Sprout, FileText, Moon, Sun, ShieldAlert } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [selectedGroupForCalc, setSelectedGroupForCalc] = useState<CropGroup>('Cereals');
  const [targetStateForSim, setTargetStateForSim] = useState<IndianState>('Andhra Pradesh');
  const [targetMarketForSim, setTargetMarketForSim] = useState<string>('Guntur');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Initialize theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Test Firebase connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !currentUser) {
        const profile: UserProfile = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Mandi User',
          phone: user.phoneNumber || '+91 98765 43210',
          emailVerified: user.emailVerified ?? true,
          phoneVerified: Boolean(user.phoneNumber),
          role: 'farmer',
          preferredState: 'Andhra Pradesh',
          preferredMarket: 'Guntur',
          createdAt: new Date().toISOString(),
        };
        setCurrentUser(profile);
        setActiveTab('farmer');
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Subscribe to real-time watchlist
  useEffect(() => {
    const unsub = subscribeToWatchlist(currentUser?.id || null, (items) => {
      setWatchlistIds(items.map((i) => i.id));
    });
    return () => unsub();
  }, [currentUser]);

  // Auth success handler
  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
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
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setCurrentUser(null);
    setActiveTab('landing');
  };

  // RBAC Permission Check Guard strictly aligned with the 14-Page Access Matrix
  const canAccess = (tab: string): boolean => {
    // Public Pages (accessible to Everyone: Guest, Farmer, Trader, Analyst, Admin)
    if (['landing', 'about', 'explorer', 'register', 'login'].includes(tab)) return true;
    if (!currentUser) return false;

    const role = currentUser.role;

    // Admin has access to all 14 pages
    if (role === 'admin') return true;

    // Farmer-only access
    if (tab === 'farmer' && role === 'farmer') return true;

    // Trader-only access
    if (tab === 'markets' && role === 'trader') return true;

    // Market Analyst access (Analyst Dashboard + Model Performance)
    if (['analytics', 'models'].includes(tab) && role === 'analyst') return true;

    // Alerts & Notifications, Profile / Settings (Shared across logged-in roles: Farmer, Trader, Analyst, Admin)
    if (['alerts', 'profile'].includes(tab)) return true;

    // Other pages (data_management, user_management, system_logs, admin) are restricted to admin (already checked)
    return false;
  };

  const handleNavigateToPage = (pageId: string) => {
    if (canAccess(pageId)) {
      setActiveTab(pageId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Render Access Denied Guard component
  const renderAccessDenied = (requiredRole: string) => (
    <div className="max-w-2xl mx-auto my-12 p-8 bg-white dark:bg-stone-900 rounded-2xl border border-rose-300 dark:border-rose-900/60 shadow-lg text-center space-y-4">
      <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <div>
        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
          OWASP Least Privilege RBAC Enforcement
        </span>
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
          Access Restricted
        </h2>
        <p className="text-sm text-stone-600 dark:text-stone-400 mt-2">
          Your current role (<span className="font-mono font-bold capitalize text-amber-600">{currentUser?.role || 'Guest'}</span>) does not have authorization to view this resource.
        </p>
        <p className="text-xs text-stone-500 mt-1">
          Required Permission: <span className="font-bold text-stone-700 dark:text-stone-300">{requiredRole}</span>
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pt-3">
        {currentUser ? (
          <button
            onClick={() => {
              if (currentUser.role === 'farmer') setActiveTab('farmer');
              else if (currentUser.role === 'trader') setActiveTab('markets');
              else if (currentUser.role === 'analyst') setActiveTab('analytics');
              else setActiveTab('admin');
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Go to My Role Dashboard
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('login')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Login with Authorized Credentials
          </button>
        )}
        <button
          onClick={() => setActiveTab('landing')}
          className="px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        watchlistCount={watchlistIds.length}
      />

      {/* Main Viewport Content with RBAC Enforcement */}
      <main className="flex-1">
        <div role="status" className="mx-auto mt-3 max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Demo platform: prices, forecasts, model metrics, and pipeline reports are simulated or unverified. Do not use them as current market data or trading advice.
          </p>
        </div>
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
            onNavigateToPage={handleNavigateToPage}
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
              setActiveTab('markets');
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
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-6 px-4 sm:px-6 lg:px-8 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-amber-600" />
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              KisanMandi Agricultural Intelligence System
            </span>
            <span aria-hidden="true">Â·</span>
            <span>Data Sources: AGMARKNET, data.gov.in, Dept of Consumer Affairs</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center gap-1.5 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
