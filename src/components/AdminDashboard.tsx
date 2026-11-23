/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Users,
  Database,
  Cpu,
  Bell,
  Terminal,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Upload,
  Trash2,
  Activity,
  Shield,
  Key,
  Check,
  X,
  RotateCcw,
  Send,
  Sliders,
  AlertTriangle,
  Globe,
  ToggleLeft,
  ToggleRight,
  Radio,
} from 'lucide-react';
import { PageAccessMatrix } from './PageAccessMatrix';
import { predictionApi, RealMLAlert } from '../services/predictionApi';
import type { UserProfile, UserRole } from '../types/mandi';

interface AdminDashboardProps {
  initialTab?: 'home' | 'users' | 'data' | 'models' | 'alerts' | 'logs' | 'matrix';
}

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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

interface ModelRegistryItem {
  id: string;
  version: string;
  commodity: string;
  market: string;
  algorithm: string;
  feature_set_version: string;
  dataset_snapshot: string;
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
  directional_accuracy: number;
  approval_status: string;
  status: string;
  training_dataset_size: number;
  data_origin: string;
  trained_at: string;
}

interface AuditLogRow {
  id: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  role?: string;
  ipAddress: string;
  method: string;
  path: string;
  action: string;
  details: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ initialTab = 'home' }) => {
  const [adminSubTab, setAdminSubTab] = useState<
    'home' | 'users' | 'data' | 'models' | 'monitoring' | 'alerts' | 'logs' | 'matrix'
  >(initialTab);

  useEffect(() => {
    if (initialTab) setAdminSubTab(initialTab);
  }, [initialTab]);

  const [actionFeedback, setActionFeedback] = useState<{ text: string; isError?: boolean } | null>(null);
  const showFeedback = (text: string, isError = false) => {
    setActionFeedback({ text, isError });
    setTimeout(() => setActionFeedback(null), 5000);
  };

  // Users state
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRoleValue, setEditRoleValue] = useState<UserRole>('farmer');
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<AdminUserRow | null>(null);

  useEffect(() => {
    if (!confirmDeleteUser) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmDeleteUser(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmDeleteUser]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await predictionApi.getAdminUsers();
      const mapped: AdminUserRow[] = (res.users || []).map(
        (u: UserProfile & { status?: 'Active' | 'Deactivated'; lastLogin?: string }) => ({
          id: u.id,
          name: u.displayName || 'User',
          email: u.email,
          role: u.role,
          state: u.preferredState || 'Andhra Pradesh',
          status: u.status === 'Deactivated' ? 'Deactivated' : 'Active',
          lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never',
        })
      );
      setUsers(mapped);
    } catch (err: any) {
      showFeedback(err?.message || 'Unable to load users (Admin authorization required).', true);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: AdminUserRow) => {
    const nextStatus = user.status === 'Active' ? 'Deactivated' : 'Active';
    try {
      await predictionApi.updateAdminUserStatus(user.id, nextStatus);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)));
      showFeedback(`User ${user.name} updated to ${nextStatus}.`);
    } catch (err: any) {
      showFeedback(err?.message || 'Failed to update user status.', true);
    }
  };

  const handleSaveRoleChange = async (id: string) => {
    try {
      await predictionApi.updateAdminUserRole(id, editRoleValue);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: editRoleValue } : u)));
      setEditingUserId(null);
      showFeedback(`Role updated to ${editRoleValue.toUpperCase()} in SQLite.`);
    } catch (err: any) {
      showFeedback(err?.message || 'Failed to update role.', true);
    }
  };

  const handleResetPassword = async (user: AdminUserRow) => {
    try {
      const res = await predictionApi.resetAdminUserPassword(user.id);
      showFeedback(`Password reset for ${res.email}. Temporary password: ${res.temporaryPassword} (Copy now; single display).`);
    } catch (err: any) {
      showFeedback(err?.message || 'Failed to reset user password.', true);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    try {
      await predictionApi.deleteAdminUser(confirmDeleteUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== confirmDeleteUser.id));
      showFeedback(`User ${confirmDeleteUser.name} deleted permanently.`);
    } catch (err: any) {
      showFeedback(err?.message || 'Failed to delete user.', true);
    } finally {
      setConfirmDeleteUser(null);
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

  // Data Management State
  const [pipelineStatus, setPipelineStatus] = useState<any>(null);
  const [missingReport, setMissingReport] = useState<any>(null);
  const [outlierReport, setOutlierReport] = useState<any>(null);
  const [agmarknetKeyInput, setAgmarknetKeyInput] = useState('');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDataSyncRunning, setIsDataSyncRunning] = useState(false);
  const [datasets, setDatasets] = useState<CleanedDatasetItem[]>([]);

  const loadDataPipeline = async () => {
    try {
      const [statusRes, dsRes, missRes, outRes] = await Promise.all([
        predictionApi.getPipelineStatus(),
        predictionApi.getDatasetsQueue(),
        predictionApi.getMissingReport(),
        predictionApi.getOutliersReport(),
      ]);
      setPipelineStatus(statusRes);
      setDatasets(dsRes.datasets || []);
      setMissingReport(missRes);
      setOutlierReport(outRes);
    } catch (err: any) {
      showFeedback(err?.message || 'Unable to load pipeline diagnostics.', true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus(`Reading and ingesting ${file.name} into SQLite...`);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const csvContent = String(reader.result || '');
        const res = await predictionApi.uploadCsv(file.name, csvContent);
        if (res.dataset) {
          setDatasets((prev) => [res.dataset, ...prev]);
        }
        setUploadStatus(`Ingested ${res.dataset?.rows ?? 0} rows from ${file.name} into SQLite staging queue.`);
        showFeedback(`Uploaded ${file.name} (${res.dataset?.rows ?? 0} rows).`);
        setTimeout(() => setUploadStatus(null), 4500);
      } catch (err: any) {
        setUploadStatus(null);
        showFeedback(err?.message || 'CSV upload failed.', true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveAgmarknetKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await predictionApi.setAgmarknetKey(agmarknetKeyInput.trim());
      setPipelineStatus(res);
      setAgmarknetKeyInput('');
      showFeedback(res.apiKeyConfigured ? 'Optional AGMARKNET key saved.' : 'Cleared AGMARKNET key (Offline sample mode active).');
    } catch (err: any) {
      showFeedback(err?.message || 'Failed to update AGMARKNET API key.', true);
    }
  };

  const handleTriggerDataUpdate = async () => {
    setIsDataSyncRunning(true);
    try {
      const res = await predictionApi.triggerFetch('AGMARKNET / data.gov.in');
      showFeedback(res.message || 'Data sync completed.');
      await loadDataPipeline();
    } catch (err: any) {
      showFeedback(err?.message || 'Pipeline fetch failed.', true);
    } finally {
      setIsDataSyncRunning(false);
    }
  };

  const [isV2SyncRunning, setIsV2SyncRunning] = useState(false);
  const [v2CommodityId, setV2CommodityId] = useState(1);

  const handleTriggerV2DataUpdate = async () => {
    setIsV2SyncRunning(true);
    try {
      const res = await predictionApi.triggerAgmarknetV2Fetch({ commodityId: v2CommodityId });
      showFeedback(res.message || 'AGMARKNET 2.0 sync completed.');
      await loadDataPipeline();
    } catch (err: any) {
      showFeedback(err?.message || 'AGMARKNET 2.0 sync failed.', true);
    } finally {
      setIsV2SyncRunning(false);
    }
  };

  const handleToggleV2 = async () => {
    try {
      const current = pipelineStatus?.agmarknetV2?.enabled ?? true;
      const res = await predictionApi.toggleAgmarknetV2(!current);
      showFeedback(`AGMARKNET 2.0 provider ${res.enabled ? 'enabled' : 'disabled'}.`);
      await loadDataPipeline();
    } catch (err: any) {
      showFeedback(err?.message || 'Failed to toggle AGMARKNET 2.0.', true);
    }
  };

  const handleDatasetDecision = async (id: string, decision: 'Approved' | 'Rejected') => {
    try {
      await predictionApi.updateDatasetStatus(id, decision);
      setDatasets((prev) => prev.map((d) => (d.id === id ? { ...d, status: decision } : d)));
      showFeedback(`Dataset ${decision.toLowerCase()} in SQLite queue.`);
    } catch (err: any) {
      showFeedback(err?.message || 'Failed to update dataset status.', true);
    }
  };

  const [masterCommodities, setMasterCommodities] = useState([
    'Tomato', 'Onion', 'Potato', 'Rice', 'Wheat', 'Toor Dal', 'Cotton', 'Dry Red Chilli', 'Maize', 'Garlic', 'Banana', 'Apple',
  ]);
  const [newCommodityInput, setNewCommodityInput] = useState('');
  const handleAddCommodity = () => {
    if (newCommodityInput.trim() && !masterCommodities.includes(newCommodityInput.trim())) {
      setMasterCommodities([...masterCommodities, newCommodityInput.trim()]);
      setNewCommodityInput('');
      showFeedback('Commodity added to session monitor list.');
    }
  };

  // Models & Retraining State
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainCommodity, setRetrainCommodity] = useState('Tomato');
  const [retrainMarket, setRetrainMarket] = useState('Guntur');
  const [retrainAlgorithm, setRetrainAlgorithm] = useState('Random Forest');
  const [modelRegistry, setModelRegistry] = useState<ModelRegistryItem[]>([]);

  const loadModelsRegistry = async () => {
    try {
      const res = await predictionApi.getModelsRegistry();
      setModelRegistry(res.models || []);
    } catch (err: any) {
      showFeedback(err?.message || 'Failed to fetch model registry.', true);
    }
  };

  const handleRetrainModels = async () => {
    setIsRetraining(true);
    try {
      const valData = await predictionApi.getValidateRetrain();
      if (!valData.passed) {
        showFeedback(`Retraining blocked by quality gate: ${valData.recommendation}`, true);
        setIsRetraining(false);
        return;
      }
      const res = await predictionApi.retrainModel(retrainCommodity, retrainMarket, retrainAlgorithm);
      showFeedback(res.message || 'Retraining complete.');
      await loadModelsRegistry();
    } catch (err: any) {
      showFeedback(err?.message || 'Model retraining failed.', true);
    } finally {
      setIsRetraining(false);
    }
  };

  const handleRollbackModel = async (version: string, commodity: string, market: string) => {
    try {
      const res = await predictionApi.rollbackModel(version, commodity, market);
      showFeedback(res.message || 'Model rolled back.');
      await loadModelsRegistry();
    } catch (err: any) {
      showFeedback(err?.message || 'Model rollback failed.', true);
    }
  };

  // Monitoring & Drift State
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [isMonitoringLoading, setIsMonitoringLoading] = useState(false);

  const fetchMonitoringMetrics = async () => {
    setIsMonitoringLoading(true);
    try {
      const data = await predictionApi.getMonitoringMetrics();
      setMonitoringData(data);
    } catch (err: any) {
      showFeedback(err?.message || 'Unable to load monitoring metrics.', true);
    } finally {
      setIsMonitoringLoading(false);
    }
  };

  // Alert Management State
  const [manualAlertTarget, setManualAlertTarget] = useState<'all' | 'farmer' | 'trader' | 'analyst'>('all');
  const [manualCommodity, setManualCommodity] = useState('Tomato');
  const [manualMarket, setManualMarket] = useState('Guntur');
  const [manualState, setManualState] = useState('Andhra Pradesh');
  const [manualMessage, setManualMessage] = useState('');
  const [manualRisk, setManualRisk] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [riseThreshold, setRiseThreshold] = useState(15);
  const [dropThreshold, setDropThreshold] = useState(10);
  const [arrivalSurgeThreshold, setArrivalSurgeThreshold] = useState(100);
  const [activeSystemAlerts, setActiveSystemAlerts] = useState<RealMLAlert[]>([]);

  const loadAlerts = async () => {
    const items = await predictionApi.getAlerts();
    setActiveSystemAlerts(items);
  };

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualMessage.trim().length < 5) {
      showFeedback('Alert message must be at least 5 characters.', true);
      return;
    }
    try {
      await predictionApi.createAdminAlert({
        roleTarget: manualAlertTarget === 'all' ? 'All' : manualAlertTarget,
        alertType: 'Admin Advisory',
        commodity: manualCommodity,
        market: manualMarket,
        state: manualState,
        riskLevel: manualRisk,
        recommendedAction: 'Check nearest APMC rates before dispatch.',
        message: manualMessage.trim(),
      });
      setManualMessage('');
      showFeedback(`Advisory alert saved in SQLite and dispatched to ${manualAlertTarget.toUpperCase()} feeds.`);
      await loadAlerts();
    } catch (err: any) {
      showFeedback(err?.message || 'Failed to broadcast alert.', true);
    }
  };

  const handleDisableAlert = async (id: string) => {
    try {
      await predictionApi.disableAdminAlert(id);
      setActiveSystemAlerts((prev) => prev.filter((a) => a.id !== id));
      showFeedback('Alert suppressed from active feeds.');
    } catch (err: any) {
      showFeedback(err?.message || 'Failed to suppress alert.', true);
    }
  };

  // Audit Logs State
  const [logTypeFilter, setLogTypeFilter] = useState<string>('all');
  const [logSearch, setLogSearch] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);

  const loadAuditLogs = async (filter: string = logTypeFilter) => {
    try {
      const res = await predictionApi.getAuditLogs(100, filter);
      setAuditLogs(res.logs || []);
    } catch (err: any) {
      showFeedback(err?.message || 'Failed to load SQLite audit logs.', true);
    }
  };

  useEffect(() => {
    if (adminSubTab === 'home') {
      loadUsers();
      loadDataPipeline();
      loadModelsRegistry();
      loadAlerts();
    } else if (adminSubTab === 'users') {
      loadUsers();
    } else if (adminSubTab === 'data') {
      loadDataPipeline();
    } else if (adminSubTab === 'models') {
      loadModelsRegistry();
    } else if (adminSubTab === 'monitoring') {
      fetchMonitoringMetrics();
    } else if (adminSubTab === 'alerts') {
      loadAlerts();
    } else if (adminSubTab === 'logs') {
      loadAuditLogs(logTypeFilter);
    }
  }, [adminSubTab]);

  useEffect(() => {
    if (adminSubTab === 'logs') {
      loadAuditLogs(logTypeFilter);
    }
  }, [logTypeFilter]);

  const filteredLogs = auditLogs.filter((log) => {
    const q = logSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      log.details.toLowerCase().includes(q) ||
      (log.userEmail || '').toLowerCase().includes(q) ||
      log.path.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q)
    );
  });

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});
  const activeModelCount = modelRegistry.filter((m) => m.status === 'Active').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Delete User Confirmation Dialog */}
      {confirmDeleteUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-modal-title"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm" id="delete-user-modal-title">
              <AlertTriangle className="w-5 h-5" />
              <span>Confirm User Deletion</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Permanently remove user <strong>{confirmDeleteUser.name}</strong> ({confirmDeleteUser.email}) and revoke active tokens? This action is recorded in SQLite audit logs.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteUser(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Header & Governance Navigation */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Administrator Workspace · SQLite & Local ML Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Admin Dashboard & Control Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Manage users, ingest CSV or optional AGMARKNET datasets, retrain or roll back ML models, broadcast alerts, and inspect audit trails.
            </p>
          </div>

          <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs rounded-xl flex items-center gap-1.5 self-start lg:self-auto">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin RBAC Verified</span>
          </span>
        </div>

        {actionFeedback && (
          <div
            role="status"
            aria-live="polite"
            className={`p-3 border text-xs font-bold rounded-xl flex items-center gap-2 ${
              actionFeedback.isError
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
            }`}
          >
            {actionFeedback.isError ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{actionFeedback.text}</span>
          </div>
        )}

        <div
          role="tablist"
          aria-label="Admin sections"
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1"
        >
          {[
            { id: 'home', label: 'A. Overview', icon: Activity },
            { id: 'users', label: 'B. Users', icon: Users },
            { id: 'data', label: 'C. Data Pipeline', icon: Database },
            { id: 'models', label: 'D. Model Registry', icon: Cpu },
            { id: 'monitoring', label: 'Drift Monitoring', icon: Sliders },
            { id: 'alerts', label: 'E. Alerts', icon: Bell },
            { id: 'logs', label: 'F. Audit Logs', icon: Terminal },
            { id: 'matrix', label: 'Access Matrix', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = adminSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setAdminSubTab(tab.id as typeof adminSubTab)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION A: OVERVIEW */}
      {adminSubTab === 'home' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 tabular-nums">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>SQLite Registered Users</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {users.length} <span className="text-xs font-normal text-slate-500">Accounts</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
              <div><span className="text-slate-500 block text-[10px]">Farmers</span><span className="font-bold">{roleCounts.farmer || 0}</span></div>
              <div><span className="text-slate-500 block text-[10px]">Traders</span><span className="font-bold">{roleCounts.trader || 0}</span></div>
              <div><span className="text-slate-500 block text-[10px]">Analysts</span><span className="font-bold">{roleCounts.analyst || 0}</span></div>
              <div><span className="text-slate-500 block text-[10px]">Admins</span><span className="font-bold text-rose-600">{roleCounts.admin || 0}</span></div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>SQLite Historical Price Rows</span>
              <Database className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-600">
              {(pipelineStatus?.totalHistoricalRows ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span>Commodities Tracked:</span>
                <span className="font-bold">{masterCommodities.length}</span>
              </div>
              <div className="flex justify-between">
                <span>AGMARKNET Mode:</span>
                <span className="font-bold">{pipelineStatus?.apiKeyConfigured ? 'Optional Live Key' : 'Offline Sample'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>ML Model Registry</span>
              <Cpu className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {activeModelCount} <span className="text-xs font-normal text-slate-500">Active Pairs</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <div className="flex justify-between"><span>Total Registry Versions:</span><span className="font-bold">{modelRegistry.length}</span></div>
              <div className="flex justify-between"><span>Active Broadcast Alerts:</span><span className="font-bold text-rose-600">{activeSystemAlerts.length}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: USERS */}
      {adminSubTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>SQLite User Directory & RBAC Controls</span>
              </h2>
              <p className="text-xs text-slate-500">Manage roles, activate/deactivate accounts, reset passwords, or delete users.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <label htmlFor="admin-user-search" className="sr-only">Search users</label>
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-user-search"
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search name, email, role, state..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label htmlFor="admin-role-filter" className="sr-only">Filter by role</label>
                <select
                  id="admin-role-filter"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="all">All Roles</option>
                  <option value="farmer">Farmers</option>
                  <option value="trader">Traders</option>
                  <option value="analyst">Market Analysts</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">State</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Last Login</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {usersLoading ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">Loading users from SQLite...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">No users match the current filter.</td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isEditingRole = editingUserId === u.id;
                    const roleBadgeClass =
                      u.role === 'admin'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                        : u.role === 'analyst'
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200'
                        : u.role === 'trader'
                        ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{u.name}</td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">{u.email}</td>
                        <td className="py-3 px-3">
                          {isEditingRole ? (
                            <div className="flex items-center gap-1">
                              <select
                                aria-label={`Edit role for ${u.name}`}
                                value={editRoleValue}
                                onChange={(e) => setEditRoleValue(e.target.value as UserRole)}
                                className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-1"
                              >
                                <option value="farmer">farmer</option>
                                <option value="trader">trader</option>
                                <option value="analyst">analyst</option>
                                <option value="admin">admin</option>
                              </select>
                              <button type="button" onClick={() => handleSaveRoleChange(u.id)} aria-label="Save role" className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button type="button" onClick={() => setEditingUserId(null)} aria-label="Cancel role edit" className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${roleBadgeClass}`}>
                              {u.role}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{u.state}</td>
                        <td className="py-3 px-3">
                          <span className={`text-xs font-bold inline-flex items-center gap-1 ${u.status === 'Active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {u.status === 'Active' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500">{u.lastLogin}</td>
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUserId(u.id);
                              setEditRoleValue(u.role);
                            }}
                            className="px-2 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-300"
                          >
                            Change Role
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-2 py-1 text-[11px] font-semibold rounded-lg ${
                              u.status === 'Active' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetPassword(u)}
                            className="px-2 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-300"
                          >
                            Reset Pass
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteUser(u)}
                            className="px-2 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION C: DATA MANAGEMENT */}
      {adminSubTab === 'data' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>Offline SQLite & Optional AGMARKNET Data Pipeline</span>
                </h2>
                <p className="text-xs text-slate-500">Upload local CSV datasets into SQLite or configure an optional data.gov.in key for live sync.</p>
              </div>
              <button
                type="button"
                onClick={handleTriggerDataUpdate}
                disabled={isDataSyncRunning}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDataSyncRunning ? 'animate-spin' : ''}`} />
                <span>{isDataSyncRunning ? 'Running Sync...' : 'Run Pipeline Sync'}</span>
              </button>
            </div>

            <form onSubmit={handleSaveAgmarknetKey} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <label htmlFor="admin-agmarknet-key" className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                <Key className="w-4 h-4 text-emerald-600" />
                <span>Optional AGMARKNET Key:</span>
              </label>
              <input
                id="admin-agmarknet-key"
                type="password"
                value={agmarknetKeyInput}
                onChange={(e) => setAgmarknetKeyInput(e.target.value)}
                placeholder={pipelineStatus?.maskedApiKey || 'Leave blank for 100% offline sample dataset'}
                className="flex-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl shrink-0"
              >
                {agmarknetKeyInput.trim() ? 'Save Key' : 'Use Offline Mode'}
              </button>
            </form>

            <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/20">
              <Upload className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Upload Mandi CSV into SQLite (columns: arrival_date, commodity, market, modal_price)
                </span>
                <span className="text-[11px] text-slate-500">Accepted format: .csv</span>
              </div>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
              <label
                htmlFor="csv-upload"
                className="inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors"
              >
                Select CSV Dataset
              </label>
            </div>

            {uploadStatus && (
              <div role="status" aria-live="polite" className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>{uploadStatus}</span>
              </div>
            )}
          </div>

          {/* AGMARKNET 2.0 SECOND DATA PROVIDER */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    AGMARKNET 2.0 Official API (Second Data Provider)
                  </h2>
                  <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${
                    pipelineStatus?.agmarknetV2?.enabled
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {pipelineStatus?.agmarknetV2?.enabled ? 'Active / Enabled' : 'Disabled by Admin'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Government base: <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">https://api.agmarknet.gov.in/v1/</code> · Public REST API (zero mandatory API keys or cost).
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleToggleV2}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  {pipelineStatus?.agmarknetV2?.enabled ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-600" />
                      <span>Disable Provider</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-slate-400" />
                      <span>Enable Provider</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Provider Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 block">Ingested V2 Records</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {(pipelineStatus?.agmarknetV2?.totalRecords ?? 0).toLocaleString()} rows
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 block">Authentication</span>
                <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                  Public (No Key)
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 block">Consecutive Failures</span>
                <span className={`text-sm font-extrabold ${
                  (pipelineStatus?.agmarknetV2?.consecutiveFailures ?? 0) >= 3 ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'
                }`}>
                  {pipelineStatus?.agmarknetV2?.consecutiveFailures ?? 0}
                  {(pipelineStatus?.agmarknetV2?.consecutiveFailures ?? 0) >= 3 && ' (Warning)'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 block">Last Successful Sync</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block">
                  {pipelineStatus?.agmarknetV2?.lastSuccessfulSync
                    ? new Date(pipelineStatus.agmarknetV2.lastSuccessfulSync).toLocaleDateString()
                    : 'Not yet synced'}
                </span>
              </div>
            </div>

            {/* Sync Controls */}
            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Sync Target Commodity:</span>
                <select
                  value={v2CommodityId}
                  onChange={(e) => setV2CommodityId(Number(e.target.value))}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Commodity ID 1 (Tomato / Staples)</option>
                  <option value={2}>Commodity ID 2 (Potato)</option>
                  <option value={3}>Commodity ID 3 (Onion)</option>
                  <option value={4}>Commodity ID 4 (Wheat)</option>
                  <option value={5}>Commodity ID 5 (Rice)</option>
                </select>
                <span className="text-slate-500 text-[11px]">
                  (Unit conversion: Rs./Quintal / 100 = Rs./kg)
                </span>
              </div>

              <button
                type="button"
                onClick={handleTriggerV2DataUpdate}
                disabled={isV2SyncRunning || !pipelineStatus?.agmarknetV2?.enabled}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isV2SyncRunning ? 'animate-spin' : ''}`} />
                <span>{isV2SyncRunning ? 'Syncing AGMARKNET 2.0...' : 'Fetch Live AGMARKNET 2.0 Data'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 tabular-nums">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Missing-Data Audit</span>
                <span className="text-xs font-bold text-emerald-600">{missingReport?.overallDataCompleteness ?? '—'} Complete</span>
              </div>
              <p className="text-xs text-slate-500">
                Records inspected: {(missingReport?.totalRecordsAnalyzed ?? 0).toLocaleString()} · Modal missing: {missingReport?.missingFieldsSummary?.modalPrice?.missingCount ?? 0}
              </p>
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">
                {missingReport?.status || 'Verified by Python preprocessor'}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 tabular-nums">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Outlier Audit (Z-Score & IQR)</span>
                <span className="text-xs font-bold text-amber-600">{outlierReport?.outliersDetected ?? 0} Flagged</span>
              </div>
              <p className="text-xs text-slate-500">
                Winsorized during training ({outlierReport?.methodsUsed?.join(' · ') || 'Z-Score & IQR'}).
              </p>
              <span className="text-[11px] font-semibold text-slate-500 block">
                Provenance: {outlierReport?.dataOrigin || 'sample_dataset_demonstration'}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              SQLite Dataset Staging Queue ({datasets.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left tabular-nums">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {datasets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500">No uploaded datasets in staging queue yet.</td>
                    </tr>
                  ) : (
                    datasets.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">{d.filename}</td>
                        <td className="py-3 px-3 text-slate-500">{d.source}</td>
                        <td className="py-3 px-3 text-right">{Number(d.rows).toLocaleString()}</td>
                        <td className="py-3 px-3 text-right">{d.missingPct}</td>
                        <td className="py-3 px-3 text-right">{d.duplicateRows}</td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              d.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : d.status === 'Rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          {d.status === 'Pending Review' ? (
                            <>
                              <button type="button" onClick={() => handleDatasetDecision(d.id, 'Approved')} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold">
                                Approve
                              </button>
                              <button type="button" onClick={() => handleDatasetDecision(d.id, 'Rejected')} className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold">
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Monitored Commodities ({masterCommodities.length})
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {masterCommodities.map((c) => (
                <span key={c} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <span>{c}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${c}`}
                    onClick={() => setMasterCommodities(masterCommodities.filter((item) => item !== c))}
                    className="hover:text-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 max-w-sm pt-1">
              <label htmlFor="admin-add-commodity" className="sr-only">Add commodity name</label>
              <input
                id="admin-add-commodity"
                type="text"
                value={newCommodityInput}
                onChange={(e) => setNewCommodityInput(e.target.value)}
                placeholder="Add commodity name..."
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2"
              />
              <button
                type="button"
                onClick={handleAddCommodity}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl shrink-0"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION D: MODEL REGISTRY */}
      {adminSubTab === 'models' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span>Python ML Model Registry, Retraining & Rollback</span>
              </h2>
              <p className="text-xs text-slate-500">Retrain commodity-market models on SQLite series or execute one-step rollback.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Select commodity to retrain"
                value={retrainCommodity}
                onChange={(e) => setRetrainCommodity(e.target.value)}
                className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2"
              >
                <option value="Tomato">Tomato</option>
                <option value="Onion">Onion</option>
                <option value="Potato">Potato</option>
                <option value="Rice">Rice</option>
                <option value="Wheat">Wheat</option>
                <option value="Toor Dal">Toor Dal</option>
              </select>
              <select
                aria-label="Select market to retrain"
                value={retrainMarket}
                onChange={(e) => setRetrainMarket(e.target.value)}
                className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2"
              >
                <option value="Guntur">Guntur</option>
                <option value="Vijayawada">Vijayawada</option>
                <option value="Kurnool">Kurnool</option>
                <option value="Lasalgaon">Lasalgaon</option>
                <option value="Agra">Agra</option>
              </select>
              <select
                aria-label="Select training algorithm"
                value={retrainAlgorithm}
                onChange={(e) => setRetrainAlgorithm(e.target.value)}
                className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2"
              >
                <option value="Random Forest">Random Forest</option>
                <option value="Multiple Linear Regression">Multiple Linear Regression</option>
              </select>
              <button
                type="button"
                onClick={handleRetrainModels}
                disabled={isRetraining}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
                <span>{isRetraining ? 'Training...' : 'Retrain Selected Pair'}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left tabular-nums">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Commodity — Market</th>
                  <th className="py-2.5 px-3">Algorithm & Version</th>
                  <th className="py-2.5 px-3">Feature Set</th>
                  <th className="py-2.5 px-3 text-right">MAE / RMSE</th>
                  <th className="py-2.5 px-3 text-right">R²</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {modelRegistry.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{m.commodity} — {m.market}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold">{m.algorithm}</span>{' '}
                      <span className="font-mono text-emerald-700 dark:text-emerald-400">{m.version}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{m.feature_set_version}</td>
                    <td className="py-3 px-3 text-right">₹{m.mae} / ₹{m.rmse}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">{m.r2}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          m.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {m.status !== 'Active' ? (
                        <button
                          type="button"
                          onClick={() => handleRollbackModel(m.version, m.commodity, m.market)}
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Activate Version
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRollbackModel('', m.commodity, m.market)}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Step Rollback
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MONITORING & DRIFT */}
      {adminSubTab === 'monitoring' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Continuous Model Monitoring & PSI Drift</span>
              </h2>
              <p className="text-xs text-slate-500">Holdout MAE, RMSE, MAPE, R², and Population Stability Index checks.</p>
            </div>

            <button
              type="button"
              onClick={fetchMonitoringMetrics}
              disabled={isMonitoringLoading}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isMonitoringLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {monitoringData?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 tabular-nums">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Monitored Pairs</span>
                <div className="text-2xl font-extrabold">{monitoringData.summary.totalMonitoredPairs}</div>
                <span className="text-[11px] text-emerald-600 font-semibold">{monitoringData.summary.stableCount} Stable</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Drift Warnings (PSI)</span>
                <div className="text-2xl font-extrabold text-amber-600">{monitoringData.summary.driftWarningCount}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Stale Markets</span>
                <div className="text-2xl font-extrabold text-rose-600">{monitoringData.summary.staleMarketsCount}</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Average R²</span>
                <div className="text-2xl font-extrabold text-emerald-600">{monitoringData.summary.averageR2}</div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left tabular-nums">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Commodity / Market</th>
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3 text-right">MAE / RMSE</th>
                  <th className="py-2.5 px-3 text-right">MAPE / R²</th>
                  <th className="py-2.5 px-3 text-right">PSI Drift</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {monitoringData?.metrics?.map((m: any) => (
                  <tr key={`${m.commodity}-${m.market}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold">{m.commodity} — {m.market}</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">{m.modelVersion}</td>
                    <td className="py-3 px-3 text-right">₹{m.mae} / ₹{m.rmse}</td>
                    <td className="py-3 px-3 text-right">
                      {m.mape}% / <span className="font-bold text-emerald-600">{m.r2}</span>
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${m.psi > 0.25 ? 'text-rose-600' : ''}`}>{m.psi}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                        {m.driftStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await predictionApi.investigateDrift(m.commodity, m.market);
                            showFeedback(`PSI Audit for ${m.commodity} (${m.market}): PSI ${res.investigationResult?.psiScore} — ${res.investigationResult?.recommendation}`);
                          } catch (err: any) {
                            showFeedback(err?.message || 'Drift investigation failed.', true);
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold rounded-lg"
                      >
                        Investigate Drift
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {monitoringData?.alerts?.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-600" />
                <span>Active Drift Threshold Alerts</span>
              </h3>
              {monitoringData.alerts.map((alt: any) => (
                <div key={alt.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-rose-600">{alt.level} — {alt.metric}</span>
                    <p className="font-semibold">{alt.message}</p>
                    <p className="text-slate-500">{alt.recommendedAction}</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await predictionApi.resolveMonitoringAlert(alt.id);
                        showFeedback(res.message || 'Alert resolved.');
                        fetchMonitoringMetrics();
                      } catch (err: any) {
                        showFeedback(err?.message || 'Failed to resolve alert.', true);
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shrink-0"
                  >
                    Resolve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION E: ALERT MANAGEMENT */}
      {adminSubTab === 'alerts' && (
        <div className="space-y-6">
          <form onSubmit={handleBroadcastAlert} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Send className="w-4 h-4 text-emerald-600" />
              <span>Create & Broadcast Market Advisory Alert</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <label htmlFor="alert-target" className="block text-slate-500 font-bold mb-1">Target Role</label>
                <select
                  id="alert-target"
                  value={manualAlertTarget}
                  onChange={(e) => setManualAlertTarget(e.target.value as 'all' | 'farmer' | 'trader' | 'analyst')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-semibold"
                >
                  <option value="all">All Users</option>
                  <option value="farmer">Farmers</option>
                  <option value="trader">Traders</option>
                  <option value="analyst">Analysts</option>
                </select>
              </div>
              <div>
                <label htmlFor="alert-commodity" className="block text-slate-500 font-bold mb-1">Commodity</label>
                <input id="alert-commodity" type="text" value={manualCommodity} onChange={(e) => setManualCommodity(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-semibold" />
              </div>
              <div>
                <label htmlFor="alert-market" className="block text-slate-500 font-bold mb-1">Market</label>
                <input id="alert-market" type="text" value={manualMarket} onChange={(e) => setManualMarket(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-semibold" />
              </div>
              <div>
                <label htmlFor="alert-state" className="block text-slate-500 font-bold mb-1">State</label>
                <input id="alert-state" type="text" value={manualState} onChange={(e) => setManualState(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-semibold" />
              </div>
              <div>
                <label htmlFor="alert-severity" className="block text-slate-500 font-bold mb-1">Severity</label>
                <select
                  id="alert-severity"
                  value={manualRisk}
                  onChange={(e) => setManualRisk(e.target.value as 'HIGH' | 'MEDIUM' | 'LOW')}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-semibold"
                >
                  <option value="HIGH">High Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="LOW">Low Risk</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="alert-message" className="block text-xs text-slate-500 font-bold mb-1">Alert Message</label>
              <textarea
                id="alert-message"
                required
                rows={2}
                value={manualMessage}
                onChange={(e) => setManualMessage(e.target.value)}
                placeholder="Enter advisory notice for growers and mandi traders..."
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3"
              />
            </div>

            <div className="flex justify-end">
              <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2">
                <Send className="w-3.5 h-3.5" />
                <span>Publish Alert</span>
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <span>Automated Alert Trigger Reference</span>
              </h3>
              <div className="space-y-3 text-xs tabular-nums">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="thresh-rise" className="text-slate-600 dark:text-slate-400">Price-Rise Trigger (% in 7d):</label>
                  <input id="thresh-rise" type="number" value={riseThreshold} onChange={(e) => setRiseThreshold(Number(e.target.value))} className="w-20 p-1.5 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="thresh-drop" className="text-slate-600 dark:text-slate-400">Price-Drop Trigger (% in 5d):</label>
                  <input id="thresh-drop" type="number" value={dropThreshold} onChange={(e) => setDropThreshold(Number(e.target.value))} className="w-20 p-1.5 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="thresh-arrival" className="text-slate-600 dark:text-slate-400">Arrival Shock Trigger (%):</label>
                  <input id="thresh-arrival" type="number" value={arrivalSurgeThreshold} onChange={(e) => setArrivalSurgeThreshold(Number(e.target.value))} className="w-20 p-1.5 text-right bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg" />
                </div>
                <button
                  type="button"
                  onClick={() => showFeedback('Threshold parameters saved in local session.')}
                  className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-lg"
                >
                  Save Thresholds
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-600" />
                <span>Active Alerts ({activeSystemAlerts.length})</span>
              </h3>
              <div className="space-y-2 text-xs max-h-64 overflow-y-auto">
                {activeSystemAlerts.map((alt) => (
                  <div key={alt.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold block">{alt.commodity} ({alt.market}) · {alt.risk_level}</span>
                      <span className="text-[11px] text-slate-500">{alt.message}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDisableAlert(alt.id)}
                      className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 shrink-0"
                    >
                      Suppress
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION F: AUDIT LOGS */}
      {adminSubTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-600" />
                <span>SQLite Security & Admin Audit Logs</span>
              </h2>
              <p className="text-xs text-slate-500">Authentication events, RBAC denials, CSV uploads, and model lifecycle logs.</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="audit-log-search" className="sr-only">Filter logs</label>
              <input
                id="audit-log-search"
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Filter email, path, details..."
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5"
              />
              <button
                type="button"
                onClick={() => loadAuditLogs(logTypeFilter)}
                className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-xl"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-semibold">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'USER_AUTH', label: 'Auth & Logins' },
              { id: 'ADMIN_ACTION', label: 'Admin Actions' },
              { id: 'DATA_INGESTION', label: 'Data Ingestion' },
              { id: 'MODEL_ACTION', label: 'Model Actions' },
              { id: 'AUTH_FAILURE', label: 'Auth Failures' },
              { id: 'DENIED', label: 'RBAC Denied' },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setLogTypeFilter(pill.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
                  logTypeFilter === pill.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="bg-slate-950 text-slate-200 p-5 rounded-2xl border border-slate-800 font-mono text-xs space-y-2 max-h-[480px] overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-500">No audit entries matching current filter.</div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="py-1 hover:bg-slate-900/60 rounded px-1 flex flex-wrap sm:flex-nowrap items-start gap-2">
                  <span className="text-slate-500 shrink-0">[{new Date(log.timestamp).toLocaleString()}]</span>
                  <span className="text-emerald-400 font-bold shrink-0">[{log.action}]</span>
                  <span className="text-sky-400 shrink-0">{log.method} {log.path}</span>
                  <span className="text-slate-300">{log.userEmail ? `(${log.userEmail}) ` : ''}{log.details}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {adminSubTab === 'matrix' && <PageAccessMatrix />}
    </div>
  );
};
