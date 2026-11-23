import React, { useState, useMemo } from 'react';
import {
  LineChart as LineChartIcon,
  Activity,
  Sliders,
  TrendingUp,
  AlertCircle,
  BarChart,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { generateTimeSeriesData } from '../services/predictiveEngine';

export const TimeSeriesLab: React.FC = () => {
  const [horizonDays, setHorizonDays] = useState<number>(20);
  const [alpha, setAlpha] = useState<number>(0.2);
  const [beta, setBeta] = useState<number>(0.1);
  const [activeModel, setActiveModel] = useState<'all' | 'mean' | 'naive' | 'drift' | 'hw' | 'arima'>('all');
  const [showConfidenceIntervals, setShowConfidenceIntervals] = useState<boolean>(true);

  // Generate data based on state
  const timeSeriesData = useMemo(() => {
    return generateTimeSeriesData(horizonDays, alpha, beta);
  }, [horizonDays, alpha, beta]);

  // Split history and forecast
  const history = timeSeriesData.filter((d) => d.actualPrice !== undefined);
  const forecast = timeSeriesData.filter((d) => d.actualPrice === undefined);

  // SVG Chart Dimensions & Scaling
  const width = 840;
  const height = 340;
  const padding = { top: 20, right: 30, bottom: 40, left: 55 };

  const minPrice = 400;
  const maxPrice = 1400;

  const xScale = (index: number) => {
    const minIdx = timeSeriesData[0].index;
    const maxIdx = timeSeriesData[timeSeriesData.length - 1].index;
    return padding.left + ((index - minIdx) / (maxIdx - minIdx)) * (width - padding.left - padding.right);
  };

  const yScale = (price: number) => {
    return height - padding.bottom - ((price - minPrice) / (maxPrice - minPrice)) * (height - padding.top - padding.bottom);
  };

  // Generate Path Strings
  const historyPath = history.reduce((acc, curr, idx) => {
    const x = xScale(curr.index);
    const y = yScale(curr.actualPrice || 0);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const meanPath = forecast.reduce((acc, curr, idx) => {
    const x = xScale(curr.index);
    const y = yScale(curr.meanForecast || 0);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const naivePath = forecast.reduce((acc, curr, idx) => {
    const x = xScale(curr.index);
    const y = yScale(curr.naiveForecast || 0);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const driftPath = forecast.reduce((acc, curr, idx) => {
    const x = xScale(curr.index);
    const y = yScale(curr.driftForecast || 0);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const hwLevelPath = forecast.reduce((acc, curr, idx) => {
    const x = xScale(curr.index);
    const y = yScale(curr.hwLevelForecast || 0);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const hwTrendPath = forecast.reduce((acc, curr, idx) => {
    const x = xScale(curr.index);
    const y = yScale(curr.hwTrendForecast || 0);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const arimaPath = forecast.reduce((acc, curr, idx) => {
    const x = xScale(curr.index);
    const y = yScale(curr.arimaForecast || 0);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Confidence Interval Area
  const upper80Path = forecast.map((p) => `${xScale(p.index)},${yScale(p.upper80 || 0)}`).join(' ');
  const lower80Path = [...forecast].reverse().map((p) => `${xScale(p.index)},${yScale(p.lower80 || 0)}`).join(' ');
  const ciPolygon = `${upper80Path} ${lower80Path}`;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>Research Paper Section 6</span>
            <span aria-hidden="true">·</span>
            <span>Daily Grain Mandi Prices (2004–2010)</span>
            <span aria-hidden="true">·</span>
            <span>Pages 23–30</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Time Series Forecasting Laboratory
          </h1>
        </div>

        {/* Model Filter Buttons */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveModel('all')}
            className={`px-2.5 py-1.5 rounded-md transition-colors ${
              activeModel === 'all'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            All Models
          </button>
          <button
            onClick={() => setActiveModel('mean')}
            className={`px-2.5 py-1.5 rounded-md transition-colors ${
              activeModel === 'mean'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Mean
          </button>
          <button
            onClick={() => setActiveModel('drift')}
            className={`px-2.5 py-1.5 rounded-md transition-colors ${
              activeModel === 'drift'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Naïve & Drift
          </button>
          <button
            onClick={() => setActiveModel('hw')}
            className={`px-2.5 py-1.5 rounded-md transition-colors ${
              activeModel === 'hw'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Holt-Winters
          </button>
          <button
            onClick={() => setActiveModel('arima')}
            className={`px-2.5 py-1.5 rounded-md transition-colors ${
              activeModel === 'arima'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            ARIMA(4,0,2)
          </button>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="bg-white dark:bg-stone-800 rounded-xl p-4 border border-stone-200 dark:border-stone-700 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-stone-600 dark:text-stone-400">Forecast Horizon (Days)</span>
            <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{horizonDays} days</span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={horizonDays}
            onChange={(e) => setHorizonDays(parseInt(e.target.value))}
            className="w-full accent-amber-600"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-stone-600 dark:text-stone-400">Holt-Winters Alpha (Level)</span>
            <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{alpha.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.9"
            step="0.05"
            value={alpha}
            onChange={(e) => setAlpha(parseFloat(e.target.value))}
            className="w-full accent-emerald-600"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-stone-600 dark:text-stone-400">Holt-Winters Beta (Trend)</span>
            <span className="font-mono font-bold text-stone-900 dark:text-stone-100">{beta.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="0.5"
            step="0.02"
            value={beta}
            onChange={(e) => setBeta(parseFloat(e.target.value))}
            className="w-full accent-purple-600"
          />
        </div>

        <div className="flex items-center justify-end sm:justify-start pt-3 sm:pt-0">
          <label className="flex items-center gap-2 text-xs font-medium text-stone-700 dark:text-stone-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showConfidenceIntervals}
              onChange={(e) => setShowConfidenceIntervals(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Show 80% & 95% Confidence Bounds</span>
          </label>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-700">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Mandi Crop Price Historical Trajectory & Forecast Comparison
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Recreation of R Time Series Output (Pages 23–27). Grain: Daily Price in ₹ / Quintal
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium flex-wrap">
            <span className="flex items-center gap-1.5 text-stone-800 dark:text-stone-200">
              <span className="w-3 h-0.5 bg-stone-900 dark:bg-stone-100 inline-block"></span> Historical
            </span>
            {(activeModel === 'all' || activeModel === 'mean') && (
              <span className="flex items-center gap-1.5 text-rose-600">
                <span className="w-3 h-0.5 bg-rose-500 inline-block"></span> Mean Method (₹787.2)
              </span>
            )}
            {(activeModel === 'all' || activeModel === 'drift') && (
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-3 h-0.5 bg-blue-500 inline-block"></span> Drift Method (₹981→₹985)
              </span>
            )}
            {(activeModel === 'all' || activeModel === 'hw') && (
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-3 h-0.5 bg-emerald-500 inline-block"></span> HW Trend (Upward)
              </span>
            )}
            {(activeModel === 'all' || activeModel === 'arima') && (
              <span className="flex items-center gap-1.5 text-purple-600">
                <span className="w-3 h-0.5 bg-purple-500 inline-block"></span> ARIMA(4,0,2)
              </span>
            )}
          </div>
        </div>

        {/* SVG Chart */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto min-w-[700px] select-none font-mono text-[10px]"
          >
            {/* Grid Lines */}
            {[500, 700, 900, 1100, 1300].map((price) => {
              const y = yScale(price);
              return (
                <g key={price}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="currentColor"
                    className="text-stone-100 dark:text-stone-700/60"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 3}
                    textAnchor="end"
                    fill="currentColor"
                    className="text-stone-400 dark:text-stone-500 text-[10px]"
                  >
                    ₹{price}
                  </text>
                </g>
              );
            })}

            {/* Forecast Split Divider Line */}
            {history.length > 0 && (
              <line
                x1={xScale(history[history.length - 1].index)}
                y1={padding.top}
                x2={xScale(history[history.length - 1].index)}
                y2={height - padding.bottom}
                stroke="#d97706"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            )}

            {/* Confidence Interval Polygon */}
            {showConfidenceIntervals && (
              <polygon points={ciPolygon} fill="#f59e0b" fillOpacity="0.12" />
            )}

            {/* Historical Series Path */}
            <path
              d={historyPath}
              fill="none"
              stroke="currentColor"
              className="text-stone-800 dark:text-stone-200"
              strokeWidth="1.8"
            />

            {/* Model Paths */}
            {(activeModel === 'all' || activeModel === 'mean') && (
              <path d={meanPath} fill="none" stroke="#ef4444" strokeWidth="2.2" strokeDasharray="3 3" />
            )}

            {(activeModel === 'all' || activeModel === 'drift') && (
              <>
                <path d={naivePath} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="2 2" />
                <path d={driftPath} fill="none" stroke="#3b82f6" strokeWidth="2.4" />
              </>
            )}

            {(activeModel === 'all' || activeModel === 'hw') && (
              <>
                <path d={hwLevelPath} fill="none" stroke="#10b981" strokeWidth="1.8" strokeDasharray="4 2" />
                <path d={hwTrendPath} fill="none" stroke="#059669" strokeWidth="2.5" />
              </>
            )}

            {(activeModel === 'all' || activeModel === 'arima') && (
              <path d={arimaPath} fill="none" stroke="#9333ea" strokeWidth="2.2" />
            )}

            {/* Forecast Horizon Marker */}
            <text
              x={xScale(history[history.length - 1].index) + 8}
              y={padding.top + 16}
              fill="#d97706"
              className="font-bold text-[10px]"
            >
              Forecast Horizon (T+1 to T+{horizonDays}) →
            </text>
          </svg>
        </div>
      </div>

      {/* Model Diagnostic Evaluation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Mean & Naïve Method */}
        <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              Models 1 & 2: Baseline & Drift
            </h4>
            <span className="text-xs text-stone-400 font-mono">Pages 24–25</span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300">
            Historical Average Mean is constant at <strong>₹787.20</strong>. Naïve simply mirrors the last observation (₹980.93), while Drift introduces positive momentum up to ₹984.70.
          </p>
          <div className="pt-2 border-t border-stone-100 dark:border-stone-700 text-xs font-mono space-y-1">
            <div className="flex justify-between">
              <span className="text-stone-500">Historical Mean:</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200">787.2035 ₹/Qtl</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Last Observation:</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200">980.9267 ₹/Qtl</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Drift Horizon (20):</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">984.6967 ₹/Qtl</span>
            </div>
          </div>
        </div>

        {/* Card 2: Exponential Smoothing */}
        <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Model 3: Holt-Winters (HW)
            </h4>
            <span className="text-xs text-stone-400 font-mono">Pages 26–27</span>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-300">
            Level smoothing ($\alpha=0.2$) estimates local equilibrium at <strong>₹871.03</strong>. Setting trend parameter ($\beta=0.1$) captures strong upward post-monsoon rally toward <strong>₹1,069.39</strong>.
          </p>
          <div className="pt-2 border-t border-stone-100 dark:border-stone-700 text-xs font-mono space-y-1">
            <div className="flex justify-between">
              <span className="text-stone-500">HW Level Only:</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200">871.03 ₹/Qtl</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">HW with Trend:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">902.87 → 1,069.39</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Upper Bound (upr):</span>
              <span className="font-semibold text-stone-800 dark:text-stone-200">1,306.49 ₹/Qtl</span>
            </div>
          </div>
        </div>

        {/* Card 3: ARIMA & Diagnostic Test */}
        <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Model 4: AUTO.ARIMA(4,0,2)
            </h4>
            <span className="text-xs text-stone-400 font-mono">Pages 28–29</span>
          </div>
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Ljung-Box Diagnostic Result:</span>
            </div>
            <p className="font-mono text-[11px]">
              X² = 58.832, df = 10, p-value = 6.024e-09
            </p>
            <p className="text-[11px] leading-tight text-rose-800 dark:text-rose-300">
              "Since the p-value is extremely low, residuals exhibit residual autocorrelation; hence the ARIMA model is less optimal than Holt-Winters for practical Mandi price forecasting."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
