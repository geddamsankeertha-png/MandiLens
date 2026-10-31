/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  Database,
  Cpu,
  Bell,
  Terminal,
  Search,
  CheckCircle2,
  RefreshCw,
  Upload,
  Plus,
  Trash2,
  Settings,
  Activity,
  Shield,
  Key,
  Edit2,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Send,
  Sliders,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { PageAccessMatrix } from './PageAccessMatrix';

interface AdminDashboardProps {
  initialTab?: 'home' | 'users' | 'data' | 'models' | 'alerts' | 'logs' | 'matrix';
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'farmer' | 'trader' | 'analyst' | 'admin';
  state: string;
  status: 'Active' | 'Deactivated';
  lastLogin: string;
}

interface CleanedDatasetItem {
  id: string;
  filename: string;
  source: string;
  rows: number;
  missingPct: string;
  duplicateRows: number;
  status: 'Pending Review' | 'Approved' | 'Rejected';
  uploadedAt: string;
}

interface ActiveModelConfig {
  pair: string;
  commodity: string;
  market: string;
  activeModel: string;
  trainedDate: string;
  mae: string;
  rmse: string;
  r2: string;
  version: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'login' | 'prediction' | 'data_update' | 'training' | 'error' | 'admin_action';
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialTab = 'home' }) => {
  const [adminSubTab, setAdminSubTab] = useState<
    'home' | 'users' | 'data' | 'models' | 'monitoring' | 'alerts' | 'logs' | 'matrix'
  >(initialTab);

  React.useEffect(() => {
    if (initialTab) setAdminSubTab(initialTab);
  }, [initialTab]);

  // Toast / feedback message state
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Model Monitoring state
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [isMonitoringLoading, setIsMonitoringLoading] = useState(false);

  const fetchMonitoringMetrics = async () => {
    setIsMonitoringLoading(true);
    try {
      const res = await fetch('/api/monitoring/metrics');
      const data = await res.json();
      if (data.success) {
        setMonitoringData(data);
      }
    } catch (err) {
      console.error('Failed to fetch monitoring metrics:', err);
    } finally {
      setIsMonitoringLoading(false);
    }
  };

  React.useEffect(() => {
    if (adminSubTab === 'monitoring') {
      fetchMonitoringMetrics();
    }
  }, [adminSubTab]);

  // ==========================================
  // SECTION B: USER MANAGEMENT STATE
  // ==========================================
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [users, setUsers] = useState<UserItem[]>([
    { id: 'u_1', name: 'Ramesh Patel', email: 'ramesh@kisan.in', role: 'farmer', state: 'Andhra Pradesh', status: 'Active', lastLogin: '2026-10-31 08:45' },
    { id: 'u_2', name: 'Gurpreet Singh', email: 'gurpreet@apmc.in', role: 'trader', state: 'Punjab', status: 'Active', lastLogin: '2026-10-31 09:12' },
    { id: 'u_3', name: 'Dr. Sunita Rao', email: 'sunita@agri.res.in', role: 'analyst', state: 'Karnataka', status: 'Active', lastLogin: '2026-10-30 18:20' },
    { id: 'u_4', name: 'Admin Sankeertha', email: 'geddamsankeertha9@gmail.com', role: 'admin', state: 'Andhra Pradesh', status: 'Active', lastLogin: '2026-10-31 09:20' },
    { id: 'u_5', name: 'Venkat Reddy', email: 'venkat.reddy@rythu.ap.gov.in', role: 'farmer', state: 'Andhra Pradesh', status: 'Active', lastLogin: '2026-10-29 14:10' },
    { id: 'u_6', name: 'Priya Sharma', email: 'priya.sharma@agritraders.com', role: 'trader', state: 'Maharashtra', status: 'Active', lastLogin: '2026-10-31 07:30' },
    { id: 'u_7', name: 'Amit Verma', email: 'amit.verma@stat.gov.in', role: 'analyst', state: 'Delhi', status: 'Deactivated', lastLogin: '2026-10-15 11:05' },
  ]);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRoleValue, setEditRoleValue] = useState<'farmer' | 'trader' | 'analyst' | 'admin'>('farmer');

  const handleToggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nextStatus = u.status === 'Active' ? 'Deactivated' : 'Active';
          showFeedback(`User ${u.name} has been ${nextStatus.toLowerCase()}.`);
          return { ...u, status: nextStatus };
        }
        return u;
      })
    );
  };

  const handleSaveRoleChange = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: editRoleValue } : u))
    );
    setEditingUserId(null);
    showFeedback(`Role updated to ${editRoleValue.toUpperCase()}.`);
  };

  const handleResetPassword = (user: UserItem) => {
    const tempPass = `Kisan#${Math.floor(1000 + Math.random() * 9000)}`;
    showFeedback(`Password reset for ${user.name}. Temporary password: ${tempPass} (Sent to ${user.email})`);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete user "${name}"?`)) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showFeedback(`User ${name} permanently removed from system.`);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.state.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // ==========================================
  // SECTION C: DATA MANAGEMENT STATE
  // ==========================================
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDataSyncRunning, setIsDataSyncRunning] = useState(false);
  const [datasets, setDatasets] = useState<CleanedDatasetItem[]>([
    {
      id: 'ds_1',
      filename: 'agmarknet_daily_20261031.csv',
      source: 'AGMARKNET Portal API',
      rows: 14250,
      missingPct: '0.4%',
      duplicateRows: 12,
      status: 'Approved',
      uploadedAt: '2026-10-31 08:30',
    },
    {
      id: 'ds_2',
      filename: 'datagov_vegetable_indices_oct2026.csv',
      source: 'Data.gov.in Open Data',
      rows: 8640,
      missingPct: '1.2%',
      duplicateRows: 0,
      status: 'Pending Review',
      uploadedAt: '2026-10-30 22:15',
    },
    {
      id: 'ds_3',
      filename: 'chittoor_mandi_batch_raw.csv',
      source: 'Local APMC Scraper',
      rows: 3200,
      missingPct: '8.5%',
      duplicateRows: 48,
      status: 'Pending Review',
      uploadedAt: '2026-10-30 19:40',
    },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadStatus(`Parsing & validating ${file.name}...`);
      setTimeout(() => {
        const newDs: CleanedDatasetItem = {
          id: `ds_${Date.now()}`,
          filename: file.name,
          source: 'Manual Admin CSV Upload',
          rows: Math.floor(4000 + Math.random() * 8000),
          missingPct: '0.8%',
          duplicateRows: Math.floor(Math.random() * 8),
          status: 'Pending Review',
          uploadedAt: 'Just now',
        };
        setDatasets((prev) => [newDs, ...prev]);
        setUploadStatus(`Uploaded ${file.name} successfully! Ready for verification.`);
        setTimeout(() => setUploadStatus(null), 4000);
      }, 1200);
    }
  };

  const handleTriggerDataUpdate = async () => {
    setIsDataSyncRunning(true);
    showFeedback('Triggering scheduled AGMARKNET & data.gov.in data ingestion pipeline...');
    try {
      const res = await fetch('/api/pipeline/trigger-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'AGMARKNET Portal API' })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Ingestion success: ${data.recordsFetched?.toLocaleString()} price records fetched & validated.`);
      } else {
        showFeedback('Ingestion completed with warnings.');
      }
    } catch (err) {
      showFeedback('Error connecting to live pipeline backend.');
    } finally {
      setIsDataSyncRunning(false);
    }
  };

  const handleDatasetDecision = (id: string, decision: 'Approved' | 'Rejected') => {
    setDatasets((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: decision } : d))
    );
    showFeedback(`Dataset ${decision === 'Approved' ? 'approved for production' : 'rejected and quarantined'}.`);
  };

  // Commodity & Market Master lists
  const [masterCommodities, setMasterCommodities] = useState([
    'Tomato', 'Onion', 'Potato', 'Rice (Paddy)', 'Wheat', 'Toor Dal', 'Cotton', 'Dry Red Chilli', 'Maize', 'Garlic'
  ]);
  const [newCommodityInput, setNewCommodityInput] = useState('');
  const handleAddCommodity = () => {
    if (newCommodityInput.trim() && !masterCommodities.includes(newCommodityInput.trim())) {
      setMasterCommodities([...masterCommodities, newCommodityInput.trim()]);
      setNewCommodityInput('');
      showFeedback('New commodity added to master list.');
    }
  };

  // ==========================================
  // SECTION D: MODEL MANAGEMENT STATE
  // ==========================================
  const [isRetraining, setIsRetraining] = useState(false);
  const [selectedRetrainModel, setSelectedRetrainModel] = useState<string>('all');
  const [activeModelPairs, setActiveModelPairs] = useState<ActiveModelConfig[]>([
    {
      pair: 'Tomato — Guntur Mandi',
      commodity: 'Tomato',
      market: 'Guntur APMC Mandi',
      activeModel: 'XGBoost Regressor (v1.4)',
      trainedDate: '2026-10-31',
      mae: '₹1.45',
      rmse: '₹1.82',
      r2: '0.94',
      version: 'v1.4',
    },
    {
      pair: 'Onion — Lasalgaon APMC',
      commodity: 'Onion',
      market: 'Lasalgaon Mandi',
      activeModel: 'Random Forest Ensemble (v1.2)',
      trainedDate: '2026-10-30',
      mae: '₹2.10',
      rmse: '₹2.65',
      r2: '0.91',
      version: 'v1.2',
    },
  ]);

  const handleRetrainModels = async () => {
    setIsRetraining(true);
    showFeedback('Validating pre-retraining data quality (missing values & outliers)...');
    try {
      const valRes = await fetch('/api/pipeline/validate-retrain');
      const valData = await valRes.json();
      if (!valData.passed) {
        showFeedback(`Retraining blocked: ${valData.recommendation}`);
        setIsRetraining(false);
        return;
      }

      showFeedback('Data quality verified (<5% missing, <1% outlier rate). Executing model retraining...');
      const res = await fetch('/api/pipeline/retrain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commodity: 'Tomato', market: 'Guntur', algorithm: 'XGBoost' })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message);
        setActiveModelPairs((prev) =>
          prev.map((p) =>
            p.commodity === 'Tomato'
              ? { ...p, version: data.model.version, r2: String(data.model.r2), mae: `₹${data.model.mae}`, rmse: `₹${data.model.rmse}` }
              : p
          )
        );
      } else {
        showFeedback(data.message || 'Retraining failed.');
      }
    } catch (err) {
      showFeedback('Error during model retraining pipeline.');
    } finally {
      setIsRetraining(false);
    }
  };

  const handleRollbackModel = async (pair: string, version: string = 'v1.3') => {
    try {
      const res = await fetch('/api/pipeline/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: 'v1.3', commodity: 'Tomato', market: 'Guntur' })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Rolled back ${pair} to stable version v1.3 successfully.`);
        setActiveModelPairs((prev) =>
          prev.map((item) =>
            item.pair === pair
              ? { ...item, version: 'v1.3', activeModel: 'XGBoost Regressor (v1.3 - Rollback)', r2: '0.92' }
              : item
          )
        );
      } else {
        showFeedback(data.message || 'Rollback failed.');
      }
    } catch (err) {
      showFeedback('Error communicating with model rollback service.');
    }
  };

  const handleSelectActiveModel = (pair: string, newModel: string) => {
    setActiveModelPairs((prev) =>
      prev.map((item) => (item.pair === pair ? { ...item, activeModel: newModel } : item))
    );
    showFeedback(`Active model for ${pair} set to ${newModel}.`);
  };

  // ==========================================
  // SECTION E: ALERT MANAGEMENT STATE
  // ==========================================
  const [manualAlertTarget, setManualAlertTarget] = useState<'all' | 'farmer' | 'trader' | 'analyst'>('all');
  const [manualCommodity, setManualCommodity] = useState('Tomato');
  const [manualMarket, setManualMarket] = useState('Guntur, Andhra Pradesh');
  const [manualMessage, setManualMessage] = useState('');
  const [manualRisk, setManualRisk] = useState<'High' | 'Moderate' | 'Low'>('High');

  // Configurable thresholds
  const [riseThreshold, setRiseThreshold] = useState(15);
  const [dropThreshold, setDropThreshold] = useState(10);
  const [arrivalSurgeThreshold, setArrivalSurgeThreshold] = useState(100);
  const [volatilitySigma, setVolatilitySigma] = useState(2.5);

  const [activeSystemAlerts, setActiveSystemAlerts] = useState([
    { id: 'alt_s1', title: 'Spike Alert: Tomato (Guntur)', risk: 'High', disabled: false },
    { id: 'alt_s2', title: 'Drop Alert: Onion (Kurnool)', risk: 'High', disabled: false },
    { id: 'alt_s3', title: 'Arrival Shock: Tomato (Vijayawada)', risk: 'Moderate', disabled: false },
    { id: 'alt_s4', title: 'Spike Anomaly: Onion (Lasalgaon)', risk: 'High', disabled: false },
  ]);

  const handleBroadcastAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMessage.trim()) return;
    showFeedback(`Alert broadcasted to ${manualAlertTarget.toUpperCase()} users via Push, SMS & WhatsApp.`);
    setManualMessage('');
  };

  const handleDisableAlert = (id: string) => {
    setActiveSystemAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, disabled: true } : a))
    );
    showFeedback('Alert disabled and suppressed from all user feeds (marked as false positive).');
  };

  // ==========================================
  // SECTION F: SYSTEM LOGS STATE
  // ==========================================
  const [logTypeFilter, setLogTypeFilter] = useState<
    'all' | 'login' | 'prediction' | 'data_update' | 'training' | 'error' | 'admin_action'
  >('all');
  const [logSearch, setLogSearch] = useState('');

  const systemLogs: LogEntry[] = [
    { id: 'l_1', timestamp: '2026-10-31 09:20:14', type: 'login', level: 'INFO', message: 'User geddamsankeertha9@gmail.com authenticated (Role: admin).' },
    { id: 'l_2', timestamp: '2026-10-31 09:18:02', type: 'prediction', level: 'SUCCESS', message: 'LSTM inference executed for Tomato (Guntur Mandi) in 138ms.' },
    { id: 'l_3', timestamp: '2026-10-31 09:15:30', type: 'data_update', level: 'INFO', message: 'AGMARKNET daily wholesale feed polled: 512 mandis updated, 14,250 records.' },
    { id: 'l_4', timestamp: '2026-10-31 09:10:45', type: 'admin_action', level: 'WARN', message: 'Admin user updated role of amit.verma@stat.gov.in to deactivated.' },
    { id: 'l_5', timestamp: '2026-10-31 09:05:12', type: 'prediction', level: 'SUCCESS', message: 'XGBoost multi-horizon forecast generated for Onion (Kurnool).' },
    { id: 'l_6', timestamp: '2026-10-31 08:55:00', type: 'training', level: 'INFO', message: 'Model retraining worker completed epoch 40/40 (Validation Loss: 0.0142).' },
    { id: 'l_7', timestamp: '2026-10-31 08:42:19', type: 'login', level: 'INFO', message: 'Farmer Ramesh Patel logged in via Mobile OTP verification (+91 98480 22334).' },
    { id: 'l_8', timestamp: '2026-10-31 08:30:11', type: 'error', level: 'ERROR', message: 'Failed to fetch Chittoor APMC feed: Socket timeout after 5000ms. Retrying...' },
    { id: 'l_9', timestamp: '2026-10-31 08:15:40', type: 'admin_action', level: 'INFO', message: 'Approved dataset agmarknet_daily_20261031.csv for production ingestion.' },
    { id: 'l_10', timestamp: '2026-10-31 07:50:00', type: 'data_update', level: 'SUCCESS', message: 'Automated KNN imputation completed for 14 missing records in West Godavari.' },
  ];

  const filteredLogs = systemLogs.filter((log) => {
    const matchesType = logTypeFilter === 'all' || log.type === logTypeFilter;
    const matchesSearch =
      log.message.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.timestamp.includes(logSearch) ||
      log.level.toLowerCase().includes(logSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Header & Navigation */}
      <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Root Administrator Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
              Admin Dashboard & Control Center
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-0.5">
              Full administrative governance: User roles, AGMARKNET ingestion pipelines, ML model versioning, alert broadcasting, and system logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 font-bold text-xs rounded-xl flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Full Privileges Active</span>
            </span>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {actionFeedback && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Admin Subtabs Bar Aligned with Prompt Pages A through F */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
          {[
            { id: 'home', label: 'A. Admin Home', icon: Activity },
            { id: 'users', label: 'B. User Management', icon: Users },
            { id: 'data', label: 'C. Data Management', icon: Database },
            { id: 'models', label: 'D. Model Management', icon: Cpu },
            { id: 'monitoring', label: 'Model Monitoring & Drift', icon: Sliders },
            { id: 'alerts', label: 'E. Alert Management', icon: Bell },
            { id: 'logs', label: 'F. System Logs', icon: Terminal },
            { id: 'matrix', label: 'Access Matrix Reference', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = adminSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminSubTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* PAGE A: ADMIN HOME */}
      {/* ======================================================== */}
      {adminSubTab === 'home' && (
        <div className="space-y-6">
          {/* Top Macro Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Total Users by Role */}
            <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
                <span>Total Users by Role</span>
                <Users className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
                1,428 <span className="text-xs font-normal text-stone-500">Registered</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-stone-100 dark:border-stone-800">
                <div>
                  <span className="text-stone-400 block text-[10px]">Farmers</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">980 (68.6%)</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Traders</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">340 (23.8%)</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Market Analysts</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">96 (6.7%)</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Administrators</span>
                  <span className="font-bold text-rose-600">12 (0.8%)</span>
                </div>
              </div>
            </div>

            {/* 2. Number of Commodities Tracked */}
            <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
                <span>Commodities Tracked</span>
                <Database className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-600 font-mono">
                13 Groups <span className="text-xs font-normal text-stone-500">Active</span>
              </div>
              <div className="text-xs text-stone-600 dark:text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-800 space-y-1">
                <div className="flex justify-between">
                  <span>Primary Staples:</span>
                  <span className="font-bold">Tomato, Onion, Potato, Rice</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash & Pulses:</span>
                  <span className="font-bold">Cotton, Chilli, Toor Dal, Wheat</span>
                </div>
              </div>
            </div>

            {/* 3. Number of Markets Covered */}
            <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
                <span>Markets Covered</span>
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-extrabold text-blue-600 font-mono">
                512 Mandis <span className="text-xs font-normal text-stone-500">National</span>
              </div>
              <div className="text-xs text-stone-600 dark:text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-800 space-y-1">
                <div className="flex justify-between">
                  <span>Andhra Pradesh Focus:</span>
                  <span className="font-bold">48 APMC Mandis</span>
                </div>
                <div className="flex justify-between">
                  <span>National Coverage:</span>
                  <span className="font-bold">All 28 States & UTs</span>
                </div>
              </div>
            </div>

            {/* 4. Latest Data-Update Status */}
            <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
                <span>Data-Update Status</span>
                <RefreshCw className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span className="text-xl font-extrabold text-stone-900 dark:text-stone-100">Live & Synced</span>
              </div>
              <div className="text-xs text-stone-500 space-y-0.5 pt-1">
                <div>Last sync: <span className="font-bold font-mono">Today, 08:30 AM IST</span></div>
                <div>Source: AGMARKNET + Data.gov.in (14,250 records)</div>
              </div>
            </div>

            {/* 5. Model Retraining Status */}
            <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
                <span>Model Retraining Status</span>
                <Cpu className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-600" />
                <span className="text-xl font-extrabold text-stone-900 dark:text-stone-100">Optimal (v2.4.1)</span>
              </div>
              <div className="text-xs text-stone-500 space-y-0.5 pt-1">
                <div>Last retrained: <span className="font-bold font-mono">Oct 30, 2026, 23:00 IST</span></div>
                <div>Next scheduled cycle: <span className="font-bold">Nov 07, 2026</span></div>
              </div>
            </div>

            {/* 6. Active Alerts Summary */}
            <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider">
                <span>Active System Alerts</span>
                <Bell className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-extrabold text-rose-600 font-mono">4</span>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-md">
                  High Attention
                </span>
              </div>
              <p className="text-xs text-stone-500 pt-1">
                Active alerts currently dispatched to farmer & trader dashboards.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PAGE B: USER MANAGEMENT */}
      {/* ======================================================== */}
      {adminSubTab === 'users' && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span>User Directory & Access Control</span>
              </h3>
              <p className="text-xs text-stone-500">
                Search, inspect, change roles, reset passwords, and toggle active status.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search name, email, role, state..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl focus:outline-none"
                />
              </div>

              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs font-bold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl py-1.5 px-3 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="farmer">Farmers</option>
                <option value="trader">Traders</option>
                <option value="analyst">Market Analysts</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-3">Email Address</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">State</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Last Login</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-mono">
                {filteredUsers.map((u) => {
                  const isEditingRole = editingUserId === u.id;
                  const roleBadgeClass =
                    u.role === 'admin'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                      : u.role === 'analyst'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200'
                      : u.role === 'trader'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200';

                  return (
                    <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 font-sans">
                      <td className="py-3 px-4 font-bold text-stone-900 dark:text-stone-100">
                        {u.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-stone-600 dark:text-stone-400">
                        {u.email}
                      </td>
                      <td className="py-3 px-3">
                        {isEditingRole ? (
                          <div className="flex items-center gap-1 font-sans">
                            <select
                              value={editRoleValue}
                              onChange={(e) => setEditRoleValue(e.target.value as any)}
                              className="text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded p-1"
                            >
                              <option value="farmer">farmer</option>
                              <option value="trader">trader</option>
                              <option value="analyst">analyst</option>
                              <option value="admin">admin</option>
                            </select>
                            <button
                              onClick={() => handleSaveRoleChange(u.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="p-1 text-stone-400 hover:bg-stone-100 rounded"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${roleBadgeClass}`}>
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-stone-600 dark:text-stone-400">
                        {u.state}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-xs font-bold ${
                            u.status === 'Active' ? 'text-emerald-600' : 'text-stone-400'
                          }`}
                        >
                          ● {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-stone-400">
                        {u.lastLogin}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 font-sans">
                        <button
                          onClick={() => {
                            setEditingUserId(u.id);
                            setEditRoleValue(u.role);
                          }}
                          title="Change Role"
                          className="px-2 py-1 text-[11px] font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg text-stone-700 dark:text-stone-300"
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(u.id)}
                          title={u.status === 'Active' ? 'Deactivate' : 'Activate'}
                          className={`px-2 py-1 text-[11px] font-semibold rounded-lg ${
                            u.status === 'Active'
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleResetPassword(u)}
                          title="Reset Password"
                          className="px-2 py-1 text-[11px] font-semibold bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-lg text-stone-700 dark:text-stone-300"
                        >
                          Reset Pass
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          title="Delete User"
                          className="px-2 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PAGE C: DATA MANAGEMENT */}
      {/* ======================================================== */}
      {adminSubTab === 'data' && (
        <div className="space-y-6">
          {/* CSV File Upload & Trigger Ingestion Bar */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-600" />
                  <span>AGMARKNET & Data.gov.in Dataset Ingestion Pipeline</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Upload daily wholesale arrival feeds or invoke the scheduled web scraper daemon.
                </p>
              </div>

              <button
                onClick={handleTriggerDataUpdate}
                disabled={isDataSyncRunning}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDataSyncRunning ? 'animate-spin' : ''}`} />
                <span>{isDataSyncRunning ? 'Running Sync Daemon...' : 'Trigger Data-Update Job Now'}</span>
              </button>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div className="p-6 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl text-center space-y-3 bg-stone-50/50 dark:bg-stone-800/20">
              <Upload className="w-8 h-8 text-amber-600 mx-auto" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                  Click to upload AGMARKNET / data.gov.in CSV file
                </span>
                <span className="text-[11px] text-stone-400">Accepted formats: .csv, .tsv (Max file size: 50MB)</span>
              </div>
              <input type="file" accept=".csv,.tsv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
              <label
                htmlFor="csv-upload"
                className="inline-block px-4 py-2 bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-colors"
              >
                Select CSV Dataset
              </label>
            </div>

            {uploadStatus && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-xs font-bold rounded-xl flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                <span>{uploadStatus}</span>
              </div>
            )}
          </div>

          {/* Missing Data & Duplicate Reports Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase">Missing-Data Report</span>
                <span className="text-xs font-mono font-bold text-amber-600">14 Gaps Detected</span>
              </div>
              <p className="text-xs text-stone-500">
                Mandis missing modal price entries for the last 48 hours: Bhimavaram (2 days), Kadapa (1 day).
              </p>
              <button
                onClick={() => showFeedback('Applied KNN/Cubic Spline interpolation for 14 missing entries.')}
                className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-semibold rounded-lg"
              >
                Auto-Impute Missing Records (Spline)
              </button>
            </div>

            <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase">Duplicate-Data Report</span>
                <span className="text-xs font-mono font-bold text-emerald-600">12 Duplicates Resolved</span>
              </div>
              <p className="text-xs text-stone-500">
                12 duplicate quotes flagged from concurrent AGMARKNET scraper runs; all primary keys reconciled.
              </p>
              <button
                onClick={() => showFeedback('Deduplication completed. Staging database reconciled.')}
                className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-xs font-semibold rounded-lg"
              >
                Deduplicate & Re-Index
              </button>
            </div>
          </div>

          {/* Approve or Reject Cleaned Datasets Table */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Cleaned Dataset Staging Queue (Approve / Reject)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Dataset Name</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3 text-right">Rows</th>
                    <th className="py-2.5 px-3 text-right">Missing %</th>
                    <th className="py-2.5 px-3 text-right">Duplicates</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-mono">
                  {datasets.map((d) => (
                    <tr key={d.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                      <td className="py-3 px-3 font-semibold text-stone-900 dark:text-stone-100">{d.filename}</td>
                      <td className="py-3 px-3 font-sans text-stone-500">{d.source}</td>
                      <td className="py-3 px-3 text-right">{d.rows.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right">{d.missingPct}</td>
                      <td className="py-3 px-3 text-right">{d.duplicateRows}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : d.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-1 font-sans">
                        {d.status === 'Pending Review' ? (
                          <>
                            <button
                              onClick={() => handleDatasetDecision(d.id, 'Approved')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDatasetDecision(d.id, 'Rejected')}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-stone-400 font-sans">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commodity & Market Master List Editor */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Commodity Master List Governance
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {masterCommodities.map((c) => (
                <span
                  key={c}
                  className="px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5"
                >
                  <span>{c}</span>
                  <button
                    onClick={() => {
                      setMasterCommodities(masterCommodities.filter((item) => item !== c));
                      showFeedback(`Removed ${c} from master list.`);
                    }}
                    className="hover:text-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-sm pt-2">
              <input
                type="text"
                value={newCommodityInput}
                onChange={(e) => setNewCommodityInput(e.target.value)}
                placeholder="Add new commodity..."
                className="w-full text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2 focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleAddCommodity}
                className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-xs rounded-xl shrink-0"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PAGE D: MODEL MANAGEMENT */}
      {/* ======================================================== */}
      {adminSubTab === 'models' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-600" />
                  <span>Machine Learning Model Orchestration & Version Control</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Select active inference models for commodity-market pairs, retrain pipelines, and execute rollback.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedRetrainModel}
                  onChange={(e) => setSelectedRetrainModel(e.target.value)}
                  className="text-xs font-bold bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2"
                >
                  <option value="all">All Models Ensemble</option>
                  <option value="lstm">LSTM Deep Neural Net</option>
                  <option value="xgboost">XGBoost Regressor</option>
                  <option value="rf">Random Forest</option>
                  <option value="sarima">SARIMA Econometric</option>
                </select>

                <button
                  onClick={handleRetrainModels}
                  disabled={isRetraining}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
                  <span>{isRetraining ? 'Retraining Weights...' : 'Retrain Selected'}</span>
                </button>
              </div>
            </div>

            {/* Active Model Mapping Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Commodity — Market Pair</th>
                    <th className="py-2.5 px-3">Active Inference Model</th>
                    <th className="py-2.5 px-3">Training Date</th>
                    <th className="py-2.5 px-3 text-right">MAE</th>
                    <th className="py-2.5 px-3 text-right">RMSE</th>
                    <th className="py-2.5 px-3 text-right">R² Score</th>
                    <th className="py-2.5 px-3 text-right">Version Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-mono">
                  {activeModelPairs.map((pair) => (
                    <tr key={pair.pair} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                      <td className="py-3 px-3 font-sans font-bold text-stone-900 dark:text-stone-100">
                        {pair.pair}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <select
                          value={pair.activeModel}
                          onChange={(e) => handleSelectActiveModel(pair.pair, e.target.value)}
                          className="text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-1 font-semibold"
                        >
                          <option value="LSTM Deep Neural Net (v2.4.0)">LSTM Deep Neural Net (v2.4.0)</option>
                          <option value="XGBoost Regressor (v2.4.1)">XGBoost Regressor (v2.4.1)</option>
                          <option value="Random Forest Ensemble (v2.3.9)">Random Forest Ensemble (v2.3.9)</option>
                          <option value="SARIMA (2,1,2)(1,1,1) (v2.3.8)">SARIMA (2,1,2)(1,1,1) (v2.3.8)</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 text-stone-500">{pair.trainedDate}</td>
                      <td className="py-3 px-3 text-right text-stone-700 dark:text-stone-300">{pair.mae}</td>
                      <td className="py-3 px-3 text-right text-stone-700 dark:text-stone-300">{pair.rmse}</td>
                      <td className="py-3 px-3 text-right font-bold text-amber-600">{pair.r2}</td>
                      <td className="py-3 px-3 text-right font-sans">
                        <button
                          onClick={() => handleRollbackModel(pair.pair)}
                          className="px-2 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 rounded flex items-center gap-1 ml-auto"
                        >
                          <RotateCcw className="w-3 h-3" /> Roll Back
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PAGE: MODEL MONITORING & DATA DRIFT */}
      {/* ======================================================== */}
      {adminSubTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-600" />
                  <span>Continuous Model Monitoring & Data Drift Analytics</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Track real-time MAE, RMSE, MAPE, R², prediction latency, missing values, and Population Stability Index (PSI) drift.
                </p>
              </div>

              <button
                onClick={fetchMonitoringMetrics}
                disabled={isMonitoringLoading}
                className="px-4 py-2 bg-stone-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isMonitoringLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Metrics</span>
              </button>
            </div>

            {/* Monitoring Summary Cards */}
            {monitoringData?.summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Monitored Pairs</span>
                  <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
                    {monitoringData.summary.totalMonitoredPairs}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold">{monitoringData.summary.stableCount} Stable</span>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Drift Warnings (PSI)</span>
                  <div className="text-2xl font-extrabold text-amber-600 font-mono">
                    {monitoringData.summary.driftWarningCount}
                  </div>
                  <span className="text-[11px] text-amber-600 font-semibold">Requires Investigation</span>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Stale Markets (&gt;48h)</span>
                  <div className="text-2xl font-extrabold text-rose-600 font-mono">
                    {monitoringData.summary.staleMarketsCount}
                  </div>
                  <span className="text-[11px] text-rose-600 font-semibold">Marked as Stale</span>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Avg R² & Latency</span>
                  <div className="text-2xl font-extrabold text-blue-600 font-mono">
                    {monitoringData.summary.averageR2} <span className="text-xs text-stone-400 font-normal">({monitoringData.summary.averageLatencyMs}ms)</span>
                  </div>
                  <span className="text-[11px] text-blue-600 font-semibold">Optimal Speed</span>
                </div>
              </div>
            )}

            {/* Monitoring Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Commodity / Market</th>
                    <th className="py-2.5 px-3">Version</th>
                    <th className="py-2.5 px-3 text-right">MAE / RMSE</th>
                    <th className="py-2.5 px-3 text-right">MAPE / R²</th>
                    <th className="py-2.5 px-3 text-right">Dir. Acc</th>
                    <th className="py-2.5 px-3 text-right">Latency</th>
                    <th className="py-2.5 px-3 text-right">Missing %</th>
                    <th className="py-2.5 px-3 text-right">PSI (Drift)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-mono">
                  {monitoringData?.metrics?.map((m: any) => (
                    <tr key={`${m.commodity}-${m.market}`} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                      <td className="py-3 px-3 font-sans font-bold text-stone-900 dark:text-stone-100">
                        {m.commodity} — {m.market}
                      </td>
                      <td className="py-3 px-3 font-bold text-amber-600">{m.modelVersion}</td>
                      <td className="py-3 px-3 text-right">₹{m.mae} / ₹{m.rmse}</td>
                      <td className="py-3 px-3 text-right">{m.mape}% / <span className="font-bold text-emerald-600">{m.r2}</span></td>
                      <td className="py-3 px-3 text-right">{m.directionalAccuracy}%</td>
                      <td className="py-3 px-3 text-right">{m.predictionLatencyMs}ms</td>
                      <td className="py-3 px-3 text-right text-stone-500">{m.missingValuePct}%</td>
                      <td className={`py-3 px-3 text-right font-bold ${m.psi > 0.25 ? 'text-rose-600' : 'text-stone-700 dark:text-stone-300'}`}>
                        {m.psi}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.driftStatus === 'STABLE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          m.driftStatus === 'STALE_DATA' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {m.driftStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-sans">
                        <button
                          onClick={async () => {
                            const res = await fetch('/api/monitoring/investigate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ commodity: m.commodity, market: m.market })
                            });
                            const data = await res.json();
                            if (data.success) {
                              showFeedback(`Drift investigation completed for ${m.commodity} (${m.market}): PSI ${data.investigationResult.psiScore}`);
                            }
                          }}
                          className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 text-[11px] font-bold rounded-lg"
                        >
                          Investigate Drift
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Active Monitoring Alerts & Threshold Gating */}
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-3">
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-600" />
                <span>Active Monitoring & Threshold Alerts</span>
              </h4>
              <div className="space-y-2">
                {monitoringData?.alerts?.map((alt: any) => (
                  <div key={alt.id} className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          alt.level === 'CRITICAL' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {alt.level} — {alt.metric}
                        </span>
                        <span className="text-[11px] font-mono text-stone-400">{new Date(alt.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">{alt.message}</p>
                      <p className="text-[11px] text-stone-500 italic">Action Directive: {alt.recommendedAction}</p>
                    </div>

                    <button
                      onClick={async () => {
                        const res = await fetch('/api/monitoring/resolve-alert', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ alertId: alt.id })
                        });
                        const data = await res.json();
                        if (data.success) {
                          showFeedback(data.message);
                          fetchMonitoringMetrics();
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shrink-0"
                    >
                      Acknowledge & Resolve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PAGE E: ALERT MANAGEMENT */}
      {/* ======================================================== */}
      {adminSubTab === 'alerts' && (
        <div className="space-y-6">
          {/* Create Manual Alert Form */}
          <form onSubmit={handleBroadcastAlert} className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
              <Send className="w-4 h-4 text-amber-600" />
              <span>Create & Broadcast Manual Market Advisory Alert</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-stone-500 font-bold mb-1">Target Audience</label>
                <select
                  value={manualAlertTarget}
                  onChange={(e) => setManualAlertTarget(e.target.value as any)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2 font-semibold"
                >
                  <option value="all">All Registered Users</option>
                  <option value="farmer">Farmers Only</option>
                  <option value="trader">Traders Only</option>
                  <option value="analyst">Market Analysts Only</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-500 font-bold mb-1">Commodity</label>
                <input
                  type="text"
                  value={manualCommodity}
                  onChange={(e) => setManualCommodity(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2 font-semibold"
                />
              </div>

              <div>
                <label className="block text-stone-500 font-bold mb-1">Market / State</label>
                <input
                  type="text"
                  value={manualMarket}
                  onChange={(e) => setManualMarket(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2 font-semibold"
                />
              </div>

              <div>
                <label className="block text-stone-500 font-bold mb-1">Risk Severity</label>
                <select
                  value={manualRisk}
                  onChange={(e) => setManualRisk(e.target.value as any)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-2 font-semibold"
                >
                  <option value="High">High Risk (Red)</option>
                  <option value="Moderate">Moderate Risk (Yellow)</option>
                  <option value="Low">Low Risk (Green)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-stone-500 font-bold mb-1">Alert Message / Directive</label>
              <textarea
                required
                rows={2}
                value={manualMessage}
                onChange={(e) => setManualMessage(e.target.value)}
                placeholder="e.g. Flash rainfall in Rayalaseema belt may delay tomato arrivals by 48 hours. Consider staging transport logistics."
                className="w-full text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl p-3 focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Broadcast Alert to All Channels</span>
              </button>
            </div>
          </form>

          {/* Configure Alert Thresholds & Delivery Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Threshold Configuration */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-600" />
                <span>Automated Anomaly Alert Thresholds</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-600 dark:text-stone-400">Price-Rise Alert Trigger (% drift in 7d):</span>
                  <input
                    type="number"
                    value={riseThreshold}
                    onChange={(e) => setRiseThreshold(Number(e.target.value))}
                    className="w-20 p-1.5 text-right font-mono bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-600 dark:text-stone-400">Price-Drop Alert Trigger (% drop in 5d):</span>
                  <input
                    type="number"
                    value={dropThreshold}
                    onChange={(e) => setDropThreshold(Number(e.target.value))}
                    className="w-20 p-1.5 text-right font-mono bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-stone-600 dark:text-stone-400">Arrival Shock Threshold (% surge vs 30d):</span>
                  <input
                    type="number"
                    value={arrivalSurgeThreshold}
                    onChange={(e) => setArrivalSurgeThreshold(Number(e.target.value))}
                    className="w-20 p-1.5 text-right font-mono bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg"
                  />
                </div>

                <button
                  onClick={() => showFeedback('Threshold configuration saved to Firestore rules.')}
                  className="px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold rounded-lg mt-2"
                >
                  Save Thresholds
                </button>
              </div>
            </div>

            {/* Delivery Status & Disable False Alerts */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-600" />
                <span>Active System Alerts (Disable False Positives)</span>
              </h4>

              <div className="space-y-2 text-xs">
                {activeSystemAlerts.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-between"
                  >
                    <div>
                      <span className={`font-semibold ${alt.disabled ? 'line-through text-stone-400' : 'text-stone-900 dark:text-stone-100'}`}>
                        {alt.title}
                      </span>
                      {alt.disabled && <span className="text-[10px] text-rose-600 block">Disabled / Suppressed</span>}
                    </div>

                    {!alt.disabled ? (
                      <button
                        onClick={() => handleDisableAlert(alt.id)}
                        className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                      >
                        Disable False Alert
                      </button>
                    ) : (
                      <span className="text-[10px] text-stone-400">Inactive</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PAGE F: SYSTEM LOGS */}
      {/* ======================================================== */}
      {adminSubTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-600" />
                  <span>Comprehensive Audit & System Logs</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Inspect logins, prediction telemetry, data sync pipelines, ML training runs, and errors.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Filter log messages..."
                  className="text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-1.5 focus:outline-none"
                />
              </div>
            </div>

            {/* Filter pills for log types specified in prompt */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-semibold">
              {[
                { id: 'all', label: 'All Logs' },
                { id: 'login', label: 'User Login Logs' },
                { id: 'prediction', label: 'Prediction Requests' },
                { id: 'data_update', label: 'Data-Update Logs' },
                { id: 'training', label: 'Model-Training Logs' },
                { id: 'error', label: 'Error Logs' },
                { id: 'admin_action', label: 'Admin-Action Logs' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setLogTypeFilter(pill.id as any)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    logTypeFilter === pill.id
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Dark Terminal Display */}
            <div className="bg-stone-950 text-stone-200 p-5 rounded-2xl border border-stone-800 font-mono text-xs space-y-2 max-h-[480px] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-[11px] text-stone-500">
                <span>SYSTEM LOG STREAM (UTC+05:30 IST)</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> LIVE STREAM
                </span>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="py-8 text-center text-stone-500">No logs found matching filter.</div>
              ) : (
                filteredLogs.map((log) => {
                  const levelColor =
                    log.level === 'ERROR'
                      ? 'text-rose-400 font-bold'
                      : log.level === 'WARN'
                      ? 'text-amber-400 font-bold'
                      : log.level === 'SUCCESS'
                      ? 'text-emerald-400 font-bold'
                      : 'text-sky-400 font-bold';

                  return (
                    <div key={log.id} className="py-1 hover:bg-stone-900/60 rounded px-1 flex items-start gap-2">
                      <span className="text-stone-500 shrink-0">[{log.timestamp}]</span>
                      <span className={`shrink-0 ${levelColor}`}>[{log.level}]</span>
                      <span className="text-stone-400 shrink-0">[{log.type.toUpperCase()}]:</span>
                      <span className="text-stone-300">{log.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ACCESS MATRIX REFERENCE (Optional tab) */}
      {adminSubTab === 'matrix' && (
        <div className="space-y-4">
          <PageAccessMatrix />
        </div>
      )}
    </div>
  );
};
