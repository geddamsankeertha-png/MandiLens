import React, { useState } from 'react';
import {
  BarChart3,
  Table as TableIcon,
  CloudRain,
  Coins,
  TrendingDown,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  CORRELATION_MATRIX,
  MONTHLY_SEASONAL_BENCHMARKS,
  BASELINE_CULTIVATION_INPUTS,
} from '../data/mandiData';

export const EdaExplorer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'correlation' | 'seasonal' | 'summary'>('correlation');
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number; val: number } | null>(null);

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>Research Paper Section 4</span>
            <span aria-hidden="true">·</span>
            <span>Exploratory Data Analysis</span>
            <span aria-hidden="true">·</span>
            <span>Pages 9–17</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Exploratory Data Analysis & Empirical Matrices
          </h1>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('correlation')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeSubTab === 'correlation'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Correlation & Covariance
          </button>
          <button
            onClick={() => setActiveSubTab('seasonal')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeSubTab === 'seasonal'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Monthly Seasonal Boxplots
          </button>
          <button
            onClick={() => setActiveSubTab('summary')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeSubTab === 'summary'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Summary Statistics (14 Vars)
          </button>
        </div>
      </div>

      {/* Subtab 1: Correlation & Covariance Matrix */}
      {activeSubTab === 'correlation' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-700">
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  R Studio Correlation Matrix Heatmap
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Pairwise Pearson correlation coefficients across primary modeling variables (Page 16)
                </p>
              </div>

              {selectedCell && (
                <div className="text-xs font-mono bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 px-3 py-1 rounded border border-amber-200 dark:border-amber-800">
                  {CORRELATION_MATRIX.variables[selectedCell.row]} ↔ {CORRELATION_MATRIX.variables[selectedCell.col]}:{' '}
                  <span className="font-bold">{selectedCell.val >= 0 ? `+${selectedCell.val.toFixed(3)}` : selectedCell.val.toFixed(3)}</span>
                </div>
              )}
            </div>

            {/* Matrix Heatmap Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-center border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-left font-sans text-stone-500 font-semibold bg-stone-50 dark:bg-stone-900">
                      Variable
                    </th>
                    {CORRELATION_MATRIX.variables.map((v) => (
                      <th
                        key={v}
                        className="p-2 text-[11px] font-semibold text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-900 whitespace-nowrap"
                      >
                        {v}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CORRELATION_MATRIX.data.map((row, rIdx) => (
                    <tr key={CORRELATION_MATRIX.variables[rIdx]} className="border-t border-stone-100 dark:border-stone-700">
                      <td className="p-2 text-left font-sans font-medium text-stone-900 dark:text-stone-100 bg-stone-50/50 dark:bg-stone-900/50 whitespace-nowrap">
                        {CORRELATION_MATRIX.variables[rIdx]}
                      </td>
                      {row.map((val, cIdx) => {
                        // Color scale: positive green/amber, negative red/rose
                        const isDiag = rIdx === cIdx;
                        let bgClass = 'bg-stone-50 dark:bg-stone-900/40 text-stone-600 dark:text-stone-400';
                        if (!isDiag) {
                          if (val > 0.6) bgClass = 'bg-emerald-600 text-white font-bold';
                          else if (val > 0.3) bgClass = 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold';
                          else if (val > 0.05) bgClass = 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400';
                          else if (val < -0.05) bgClass = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400';
                        }

                        return (
                          <td
                            key={cIdx}
                            onMouseEnter={() => setSelectedCell({ row: rIdx, col: cIdx, val })}
                            className={`p-2 tabular-nums cursor-pointer transition-colors ${bgClass}`}
                          >
                            {val.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paper Interpretation Card */}
            <div className="p-4 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 space-y-2">
              <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Empirical Deductions from the Correlation & Covariance Matrix (Page 16):</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-stone-600 dark:text-stone-400 pl-1">
                <li>
                  <strong>Strong Mechanization Link:</strong> High correlation between Machinery Cost and Machinery Hours (<span className="font-mono text-emerald-600 font-bold">+0.884</span>) and Total Capital Cost (<span className="font-mono text-emerald-600 font-bold">+0.853</span>).
                </li>
                <li>
                  <strong>Agricultural Inputs Coupling:</strong> Strong positive correlation between Fertilizer Quantity and Fertilizer Cost (<span className="font-mono text-emerald-600 font-bold">+0.673</span>), Seed Quantity and Seed Cost (<span className="font-mono text-emerald-600 font-bold">+0.640</span>).
                </li>
                <li>
                  <strong>Negative Covariance with Rainfall:</strong> Rainfall has an inverse direction with Quantity of Arrival and Farm Labor Cost due to monsoon disruption of transportation and open-air labor.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Monthly Seasonal Boxplots */}
      {activeSubTab === 'seasonal' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Monthly Seasonal Variations across Cultivation Factors
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Visualization corresponding to the Box-and-Whiskers plots on Pages 13–15 of the research paper
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Seasonal Rainfall Bar Chart */}
              <div className="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <CloudRain className="w-4 h-4 text-blue-500" />
                    Monthly Rainfall Distribution (mm)
                  </span>
                  <span className="text-[11px] font-mono text-blue-600 font-semibold">Peak: July (265.8 mm)</span>
                </div>
                <div className="h-44 flex items-end gap-1.5 pt-4">
                  {MONTHLY_SEASONAL_BENCHMARKS.map((m) => {
                    const heightPercent = Math.min(100, (m.rainfall / 270) * 100);
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-blue-500 hover:bg-blue-600 rounded-t transition-all relative"
                        >
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] font-mono py-0.5 px-1 rounded whitespace-nowrap z-20 pointer-events-none">
                            {m.rainfall} mm
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-stone-400">{m.month.substring(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seasonal Fertilizer & Chemical Costs */}
              <div className="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-500" />
                    Average Fertilizer Cost per Month (₹)
                  </span>
                  <span className="text-[11px] font-mono text-emerald-600 font-semibold">Peak: May (₹980)</span>
                </div>
                <div className="h-44 flex items-end gap-1.5 pt-4">
                  {MONTHLY_SEASONAL_BENCHMARKS.map((m) => {
                    const heightPercent = Math.min(100, ((m.fertilizerCost - 750) / 250) * 100);
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          style={{ height: `${Math.max(15, heightPercent)}%` }}
                          className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all relative"
                        >
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] font-mono py-0.5 px-1 rounded whitespace-nowrap z-20 pointer-events-none">
                            ₹{m.fertilizerCost}
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-stone-400">{m.month.substring(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Summary Statistics Table */}
      {activeSubTab === 'summary' && (
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm overflow-hidden">
          <div className="p-4 bg-stone-50/80 dark:bg-stone-900/60 border-b border-stone-200 dark:border-stone-700">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Selected Modeling Variables & Summary Statistics
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Direct transcription of the R dataset distribution summary from Pages 10–11
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100/60 dark:bg-stone-900/40 text-stone-700 dark:text-stone-300 border-b border-stone-200 dark:border-stone-700">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Variable Name</th>
                  <th className="py-2.5 px-3 font-semibold">Description</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Distinct Count</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Dataset Mean</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-700 font-mono">
                <tr>
                  <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">PRICE</td>
                  <td className="py-2.5 px-3 font-sans text-stone-600 dark:text-stone-300">Price of the crop (₹/Tonne)</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">63,083</td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-bold text-amber-600">181.51</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">QUANTITY</td>
                  <td className="py-2.5 px-3 font-sans text-stone-600 dark:text-stone-300">Arrival Quantity in market (Tonne)</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">57,716</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">171.35</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">RAINFALL</td>
                  <td className="py-2.5 px-3 font-sans text-stone-600 dark:text-stone-300">Monthly Rainfall amount (mm)</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">1,739</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">71.99</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">MainProduct_Tonne</td>
                  <td className="py-2.5 px-3 font-sans text-stone-600 dark:text-stone-300">Main product harvested in Tonne</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">788</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">841.12</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">CropArea_Hectare</td>
                  <td className="py-2.5 px-3 font-sans text-stone-600 dark:text-stone-300">Crop cultivation area in Hectare</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">749</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">1.026</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">FarmLabour_Hours</td>
                  <td className="py-2.5 px-3 font-sans text-stone-600 dark:text-stone-300">Total farm labor hours</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">791</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">196.32</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">FarmLabour_Cost</td>
                  <td className="py-2.5 px-3 font-sans text-stone-600 dark:text-stone-300">Total farm labor compensation (₹)</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">792</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">2,185.80</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">Machinery_Cost</td>
                  <td className="py-2.5 px-3 font-sans text-stone-600 dark:text-stone-300">Hired & owned machinery cost (₹)</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">481</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">816.09</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">Fertilizer_Cost</td>
                  <td className="py-2.5 px-3 font-sans text-stone-600 dark:text-stone-300">Chemical fertilizer inputs cost (₹)</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">785</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">996.49</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">TotalCapital_Cost</td>
                  <td className="py-2.5 px-3 font-sans text-stone-600 dark:text-stone-300">Total fixed & working capital (₹)</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">790</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">101,638.55</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
