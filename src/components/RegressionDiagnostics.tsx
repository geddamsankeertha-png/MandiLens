import React, { useState } from 'react';
import {
  Database,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Info,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { KMEANS_CLUSTER_DATA, MLR_MODEL_1, DIAGNOSTIC_INFLUENTIAL_POINTS } from '../data/mandiData';
import { generateDiagnosticPlotData } from '../services/predictiveEngine';

export const RegressionDiagnostics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'regression' | 'diagnostics' | 'clusters'>('regression');

  const diagnosticPoints = generateDiagnosticPlotData();

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>Research Paper Sections 5 & 6</span>
            <span aria-hidden="true">·</span>
            <span>R Studio Modeling Outputs</span>
            <span aria-hidden="true">·</span>
            <span>Pages 17–23</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Regression Diagnostics & K-Means Clusters
          </h1>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('regression')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'regression'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Model 1 Summary & Coeffs
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'diagnostics'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Cook's Distance & Q-Q Plot
          </button>
          <button
            onClick={() => setActiveTab('clusters')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'clusters'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            K-Means Clustering (K=3)
          </button>
        </div>
      </div>

      {/* Tab 1: Model 1 Regression Summary */}
      {activeTab === 'regression' && (
        <div className="space-y-6">
          {/* Key Regression Performance Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm">
              <span className="text-xs text-stone-500 dark:text-stone-400 block mb-1">Multiple R²</span>
              <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">0.5706</span>
              <span className="text-[11px] text-stone-400 block mt-0.5">57.06% variance explained</span>
            </div>
            <div className="p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm">
              <span className="text-xs text-stone-500 dark:text-stone-400 block mb-1">Adjusted R²</span>
              <span className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100 tabular-nums">0.5705</span>
              <span className="text-[11px] text-stone-400 block mt-0.5">Penalized for 29 predictors</span>
            </div>
            <div className="p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm">
              <span className="text-xs text-stone-500 dark:text-stone-400 block mb-1">Residual Std Error</span>
              <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">0.2070</span>
              <span className="text-[11px] text-stone-400 block mt-0.5">77,047 degrees of freedom</span>
            </div>
            <div className="p-4 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm">
              <span className="text-xs text-stone-500 dark:text-stone-400 block mb-1">F-Statistic</span>
              <span className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100 tabular-nums">3,531</span>
              <span className="text-[11px] text-stone-400 block mt-0.5">p-value &lt; 2.2e-16 (***)</span>
            </div>
          </div>

          {/* Model Formula & Interpretation Card */}
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/80 text-xs text-stone-700 dark:text-stone-300 space-y-2">
            <h4 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 text-sm">
              <Info className="w-4 h-4 text-amber-600" />
              <span>Model 1 Mathematical Specification & Log Transformation (Pages 18–20):</span>
            </h4>
            <div className="p-2.5 bg-white dark:bg-stone-900 rounded font-mono text-[11px] text-stone-900 dark:text-stone-100 overflow-x-auto border border-amber-200 dark:border-amber-900">
              Price of Crop = β0 + β1*Group + β2*Quantity + β3*Rainfall + β4*MainProduct + β5*FarmLabour_Hours + β6*FarmLabour_Cost + β7*AnimalOwned_Hours + β8*AnimalOwned_Cost + β9*Machinery_Hours + β10*Machinery_Cost + β11*Fertilizer_Kg + β12*Fertilizer_Cost + β13*Manure_Tonne + β14*Manure_Cost + β15*Insecticide_Cost + β16*TotalCapital_Cost + ε
            </div>
            <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
              <strong>Intercept (β0): 1.0268 (t = 22.007, p &lt; 2e-16).</strong> All numeric variables transformed with <code className="px-1 py-0.5 bg-stone-100 dark:bg-stone-800 rounded font-mono">log10(X + 1)</code> to stabilize variance, equalize units between ₹/Quintal and ₹/Tonne, and eliminate log(0) undefined singularities.
            </p>
          </div>

          {/* Selected Regression Coefficients Table */}
          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-stone-50/80 dark:bg-stone-900/60 border-b border-stone-200 dark:border-stone-700 flex justify-between items-center">
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Key Predictor Coefficients from R Studio lm() Output
              </h4>
              <span className="text-xs font-mono text-stone-400">Signif. codes: *** p &lt; 0.001</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-100/60 dark:bg-stone-900/40 text-stone-700 dark:text-stone-300 border-b border-stone-200 dark:border-stone-700">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Explanatory Variable</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Estimate (β)</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Elasticity Direction</th>
                    <th className="py-2.5 px-4 font-semibold">Agricultural Significance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-700 font-mono">
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">(Intercept) β0</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-amber-600 font-bold">+1.026148</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 font-sans font-medium">Positive Base</td>
                    <td className="py-2.5 px-4 font-sans text-stone-600 dark:text-stone-300">Baseline log price floor</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">FarmLabour_Cost</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-emerald-600 font-bold">+0.358683</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 font-sans font-medium">+0.358%</td>
                    <td className="py-2.5 px-4 font-sans text-stone-600 dark:text-stone-300">Highest cost-push pricing driver (t = 27.19)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">FarmLabour_Hours</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-rose-600 font-bold">-0.259642</td>
                    <td className="py-2.5 px-3 text-right text-rose-600 font-sans font-medium">-0.259%</td>
                    <td className="py-2.5 px-4 font-sans text-stone-600 dark:text-stone-300">Labor-intensive crops experience yield discount (t = -15.96)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">Fertilizer_Cost</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-emerald-600 font-bold">+0.174325</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 font-sans font-medium">+0.174%</td>
                    <td className="py-2.5 px-4 font-sans text-stone-600 dark:text-stone-300">Direct input cost pass-through (t = 7.15)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">FertilizerQuantity_Kg</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-rose-600 font-bold">-0.283519</td>
                    <td className="py-2.5 px-3 text-right text-rose-600 font-sans font-medium">-0.283%</td>
                    <td className="py-2.5 px-4 font-sans text-stone-600 dark:text-stone-300">Higher usage correlates with bulk commodities (t = -9.29)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">Seed_Cost</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-emerald-600 font-bold">+0.090301</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 font-sans font-medium">+0.090%</td>
                    <td className="py-2.5 px-4 font-sans text-stone-600 dark:text-stone-300">High-yield hybrid seeds demand market premium (t = 16.20)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">RAINFALL</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-emerald-600 font-bold">+0.006500</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 font-sans font-medium">+0.006%</td>
                    <td className="py-2.5 px-4 font-sans text-stone-600 dark:text-stone-300">Significant positive coefficient (t = 7.65)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-bold text-stone-900 dark:text-stone-100">QUANTITY</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-emerald-600 font-bold">+0.022530</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 font-sans font-medium">+0.022%</td>
                    <td className="py-2.5 px-4 font-sans text-stone-600 dark:text-stone-300">High arrival volume mandis attract premium buyers (t = 22.43)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cook's Distance & Residual Diagnostics */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cook's Distance Plot Card */}
            <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                  Cook's Distance (Influential Observations)
                </h4>
                <span className="text-xs font-mono text-stone-400">Page 22</span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Identifies extreme leverage records in the 77k regression set that disproportionately pull the fitted coefficients.
              </p>

              {/* Cook's Distance SVG */}
              <div className="border border-stone-200 dark:border-stone-700 rounded-lg p-3 bg-stone-50/50 dark:bg-stone-900/40">
                <svg viewBox="0 0 400 180" className="w-full h-auto font-mono text-[9px]">
                  {/* Axes */}
                  <line x1="40" y1="150" x2="380" y2="150" stroke="#78716c" strokeWidth="1" />
                  <line x1="40" y1="20" x2="40" y2="150" stroke="#78716c" strokeWidth="1" />

                  {/* Y-axis Ticks */}
                  <text x="32" y="153" textAnchor="end" fill="#78716c">0.0</text>
                  <text x="32" y="90" textAnchor="end" fill="#78716c">0.5</text>
                  <text x="32" y="30" textAnchor="end" fill="#78716c">1.0</text>
                  <line x1="38" y1="90" x2="42" y2="90" stroke="#78716c" />
                  <line x1="38" y1="30" x2="42" y2="30" stroke="#78716c" />

                  {/* Normal low points baseline */}
                  {diagnosticPoints.filter((p) => !p.isInfluential).map((p, i) => (
                    <line
                      key={i}
                      x1={40 + (p.index / 100000) * 330}
                      y1="150"
                      x2={40 + (p.index / 100000) * 330}
                      y2={150 - Math.min(25, p.cooksDistance * 120)}
                      stroke="#a8a29e"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Outlier 1: #53858 (Cook's distance > 1.0) */}
                  <line x1="217" y1="150" x2="217" y2="28" stroke="#ef4444" strokeWidth="2.5" />
                  <circle cx="217" cy="28" r="3" fill="#ef4444" />
                  <text x="222" y="26" fill="#ef4444" className="font-bold">#53858 (D &gt; 1.0)</text>

                  {/* Outlier 2: #44595 */}
                  <line x1="187" y1="150" x2="187" y2="116" stroke="#f59e0b" strokeWidth="2" />
                  <circle cx="187" cy="116" r="2.5" fill="#f59e0b" />
                  <text x="160" y="112" fill="#f59e0b">#44595</text>

                  {/* Outlier 3: #60011 */}
                  <line x1="238" y1="150" x2="238" y2="132" stroke="#f59e0b" strokeWidth="2" />
                  <circle cx="238" cy="132" r="2.5" fill="#f59e0b" />
                  <text x="242" y="130" fill="#f59e0b">#60011</text>
                </svg>
              </div>

              {/* Identified Outlier Details */}
              <div className="space-y-1.5 pt-1">
                {DIAGNOSTIC_INFLUENTIAL_POINTS.map((pt) => (
                  <div
                    key={pt.obsNumber}
                    className="p-2 bg-stone-50 dark:bg-stone-900 rounded text-xs flex justify-between items-center border border-stone-200 dark:border-stone-700"
                  >
                    <span className="font-mono font-bold text-stone-800 dark:text-stone-200">{pt.label}</span>
                    <span className="font-mono text-stone-500">Cook's D = {pt.cooksDistance}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Normal Q-Q Plot Card */}
            <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
                  Normal Q-Q Plot of Residuals
                </h4>
                <span className="text-xs font-mono text-stone-400">Page 22</span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Compares standardized model residuals to theoretical normal distribution quantiles. Heavy right tail denotes asymmetric price spikes.
              </p>

              {/* Q-Q Plot SVG */}
              <div className="border border-stone-200 dark:border-stone-700 rounded-lg p-3 bg-stone-50/50 dark:bg-stone-900/40">
                <svg viewBox="0 0 400 180" className="w-full h-auto font-mono text-[9px]">
                  {/* Axes */}
                  <line x1="40" y1="100" x2="380" y2="100" stroke="#78716c" strokeDasharray="2 2" />
                  <line x1="210" y1="20" x2="210" y2="160" stroke="#78716c" strokeDasharray="2 2" />

                  {/* 45-degree Reference Line */}
                  <line x1="60" y1="145" x2="360" y2="55" stroke="#a8a29e" strokeWidth="1.5" />

                  {/* Points */}
                  {diagnosticPoints.slice(0, 70).map((p, idx) => {
                    const cx = 210 + p.theoreticalQuantile * 45;
                    const cy = 100 - p.standardizedResidual * 20;
                    return (
                      <circle
                        key={idx}
                        cx={Math.max(45, Math.min(375, cx))}
                        cy={Math.max(25, Math.min(155, cy))}
                        r="1.8"
                        fill="currentColor"
                        className="text-stone-700 dark:text-stone-300"
                        opacity="0.7"
                      />
                    );
                  })}

                  {/* Extreme upper curve */}
                  <circle cx="345" cy="40" r="3" fill="#ef4444" />
                  <text x="315" y="32" fill="#ef4444">Obs #53858</text>
                  <circle cx="335" cy="48" r="2.5" fill="#ef4444" />
                  <text x="290" y="55" fill="#ef4444">Obs #87806</text>
                </svg>
              </div>

              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg text-xs text-stone-600 dark:text-stone-400 space-y-1">
                <p>• <strong>Central Linearity:</strong> Between quantiles -2.0 and +2.0, residuals fit Gaussian distribution closely.</p>
                <p>• <strong>Positive Tail Curvature:</strong> At quantiles &gt; +2.5, prices show upward kurtosis driven by sudden post-harvest scarcity in perishable vegetables and oil seeds.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: K-Means Clustering */}
      {activeTab === 'clusters' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-700">
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  K-Means Clustering Distribution Table (K = 3)
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Reproduced from Page 17 of the paper; achieves 77% classification accuracy across all crop groups
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded">
                Overall Accuracy: 77%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-100/60 dark:bg-stone-900/40 text-stone-700 dark:text-stone-300 border-b border-stone-200 dark:border-stone-700">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Crop Group</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Cluster 1 (Mainstream)</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Cluster 2 (Perishable)</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Cluster 3 (High-Input)</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Cluster Fidelity</th>
                    <th className="py-2.5 px-4 font-semibold">Paper Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-700 font-mono">
                  {KMEANS_CLUSTER_DATA.map((row) => (
                    <tr key={row.group} className="hover:bg-amber-50/40 dark:hover:bg-stone-700/30 transition-colors">
                      <td className="py-2.5 px-4 font-sans font-bold text-stone-900 dark:text-stone-100">
                        {row.group}
                      </td>
                      <td className={`py-2.5 px-3 text-right tabular-nums ${row.dominantCluster === 1 ? 'font-bold text-amber-600' : 'text-stone-500'}`}>
                        {row.cluster1.toLocaleString()}
                      </td>
                      <td className={`py-2.5 px-3 text-right tabular-nums ${row.dominantCluster === 2 ? 'font-bold text-amber-600' : 'text-stone-500'}`}>
                        {row.cluster2.toLocaleString()}
                      </td>
                      <td className={`py-2.5 px-3 text-right tabular-nums ${row.dominantCluster === 3 ? 'font-bold text-amber-600' : 'text-stone-500'}`}>
                        {row.cluster3.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                        {row.percentageInDominant}%
                      </td>
                      <td className="py-2.5 px-4 font-sans text-stone-600 dark:text-stone-400 text-[11px]">
                        {row.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Interpretation notes from Page 17 */}
            <div className="p-4 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 space-y-2">
              <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Author's Clustering Interpretation (Page 17):</span>
              </h4>
              <p className="leading-relaxed text-stone-600 dark:text-stone-400">
                <em>
                  "The K-means cluster analysis with K set to 3 does a decent job in most of the cases apart from Vegetables and Cereals where the clusters overlap each other due to shared monsoon planting cycles. However, clustering in terms of Dry Fruits, Flowers, Pulses etc. did a remarkably clean job separating high-margin commodities from staple crops."
                </em>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
