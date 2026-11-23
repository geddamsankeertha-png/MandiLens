import React, { useState } from 'react';
import { LineChart, Database, BarChart3, Activity } from 'lucide-react';
import { TimeSeriesLab } from './TimeSeriesLab';
import { RegressionDiagnostics } from './RegressionDiagnostics';
import { EdaExplorer } from './EdaExplorer';
import { AnalystDashboard } from './AnalystDashboard';

interface AnalyticsLabProps {
  initialSubTab?: 'analyst' | 'timeseries' | 'regression' | 'eda';
}

export const AnalyticsLab: React.FC<AnalyticsLabProps> = ({ initialSubTab = 'analyst' }) => {
  const [subTab, setSubTab] = useState<'analyst' | 'timeseries' | 'regression' | 'eda'>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
  }, [initialSubTab]);

  return (
    <div className="space-y-6">
      {/* Subtab Navigation Bar */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Market Analyst & Econometric Lab
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Advanced commodity price explorer, forecast accuracy metrics, seasonality, and regional heatmaps.
              </p>
            </div>

            {/* Segmented Sub-Navigation */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSubTab('analyst')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  subTab === 'analyst'
                    ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Analyst Dashboard</span>
              </button>

              <button
                onClick={() => setSubTab('timeseries')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  subTab === 'timeseries'
                    ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>Time Series Models</span>
              </button>

              <button
                onClick={() => setSubTab('regression')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  subTab === 'regression'
                    ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>MLR & Clusters</span>
              </button>

              <button
                onClick={() => setSubTab('eda')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  subTab === 'eda'
                    ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Correlation & EDA</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {subTab === 'analyst' && <AnalystDashboard />}
        {subTab === 'timeseries' && <TimeSeriesLab />}
        {subTab === 'regression' && <RegressionDiagnostics />}
        {subTab === 'eda' && <EdaExplorer />}
      </div>
    </div>
  );
};
