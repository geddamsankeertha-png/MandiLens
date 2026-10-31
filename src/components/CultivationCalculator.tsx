import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Save,
  RotateCcw,
  Sparkles,
  BookmarkCheck,
  Trash2,
  TrendingUp,
  Layers,
  CloudRain,
  Tractor,
  Coins,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { CropGroup, IndianState, CultivationInputs, SavedScenario, PredictionResult } from '../types/mandi';
import { BASELINE_CULTIVATION_INPUTS, CROP_GROUPS, INDIAN_STATES, MANDI_MARKETS, MLR_MODEL_1 } from '../data/mandiData';
import { predictMlrPrice } from '../services/predictiveEngine';
import { saveCultivationScenario, deleteCultivationScenario, subscribeToScenarios } from '../services/marketSyncService';
import { auth } from '../lib/firebase';

interface CultivationCalculatorProps {
  initialGroup?: CropGroup;
  initialState?: IndianState;
  initialMarket?: string;
  onOpenAuth: () => void;
}

export const CultivationCalculator: React.FC<CultivationCalculatorProps> = ({
  initialGroup = 'Cereals',
  initialState = 'Maharashtra',
  initialMarket = 'Satara',
  onOpenAuth,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<CropGroup>(initialGroup);
  const [selectedState, setSelectedState] = useState<IndianState>(initialState);
  const [selectedMarket, setSelectedMarket] = useState<string>(initialMarket);
  const [cropName, setCropName] = useState<string>('Wheat / Paddy');

  const [inputs, setInputs] = useState<CultivationInputs>({ ...BASELINE_CULTIVATION_INPUTS });
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Subscribe to real-time scenarios
  useEffect(() => {
    const unsub = subscribeToScenarios(auth.currentUser?.uid || null, (scenarios) => {
      setSavedScenarios(scenarios);
    });
    return () => unsub();
  }, [auth.currentUser]);

  // Recalculate prediction on input change
  useEffect(() => {
    const res = predictMlrPrice(inputs, selectedGroup);
    setPrediction(res);
  }, [inputs, selectedGroup]);

  const handleInputChange = (key: keyof CultivationInputs, value: number) => {
    setInputs((prev) => ({
      ...prev,
      [key]: isNaN(value) ? 0 : Math.max(0, value),
    }));
  };

  // Presets
  const applyPreset = (presetType: 'baseline' | 'intensive' | 'organic' | 'drought') => {
    if (presetType === 'baseline') {
      setInputs({ ...BASELINE_CULTIVATION_INPUTS });
    } else if (presetType === 'intensive') {
      setInputs({
        ...BASELINE_CULTIVATION_INPUTS,
        fertilizerQuantityKg: 180,
        fertilizerCost: 1850,
        machineryHours: 14,
        machineryCost: 1900,
        insecticideCost: 1200,
        totalCapitalCost: 165000,
        mainProductTonne: 1250,
      });
    } else if (presetType === 'organic') {
      setInputs({
        ...BASELINE_CULTIVATION_INPUTS,
        fertilizerQuantityKg: 0,
        fertilizerCost: 0,
        manureTonne: 220,
        manureCost: 6500,
        insecticideCost: 150,
        farmLabourHours: 280,
        farmLabourCost: 3100,
      });
    } else if (presetType === 'drought') {
      setInputs({
        ...BASELINE_CULTIVATION_INPUTS,
        rainfallMm: 18.5,
        arrivalQuantityTonne: 85,
        mainProductTonne: 420,
      });
    }
  };

  // Save current scenario to Firestore / Local
  const handleSaveScenario = async () => {
    if (!prediction) return;
    setIsSaving(true);
    try {
      await saveCultivationScenario({
        userId: auth.currentUser?.uid || 'guest',
        cropGroup: selectedGroup,
        cropName,
        state: selectedState,
        market: selectedMarket,
        inputs,
        predictedPriceQuintal: prediction.pricePerQuintal,
        predictedPriceTonne: prediction.pricePerTonne,
      });
      setSaveSuccessMsg('Scenario saved to cloud successfully!');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteScenario = async (id: string) => {
    await deleteCultivationScenario(id);
  };

  const handleLoadScenario = (s: SavedScenario) => {
    setSelectedGroup(s.cropGroup);
    setSelectedState(s.state);
    setSelectedMarket(s.market);
    setCropName(s.cropName);
    if (s.inputs) {
      setInputs((prev) => ({
        ...prev,
        ...s.inputs,
      }));
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>Multiple Linear Regression Model 1</span>
            <span aria-hidden="true">·</span>
            <span>R² = 0.5706</span>
            <span aria-hidden="true">·</span>
            <span>RMSE = 0.2069</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Interactive Cultivation Cost & Price Simulator
          </h1>
        </div>

        {/* Preset Selectors */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-stone-500 dark:text-stone-400 mr-1">Presets:</span>
          <button
            onClick={() => applyPreset('baseline')}
            className="px-2.5 py-1 text-xs font-medium rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300"
          >
            Baseline Mean
          </button>
          <button
            onClick={() => applyPreset('intensive')}
            className="px-2.5 py-1 text-xs font-medium rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300"
          >
            High Input/Capital
          </button>
          <button
            onClick={() => applyPreset('organic')}
            className="px-2.5 py-1 text-xs font-medium rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300"
          >
            Organic Low-Chemical
          </button>
          <button
            onClick={() => applyPreset('drought')}
            className="px-2.5 py-1 text-xs font-medium rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300"
          >
            Monsoon Deficit
          </button>
        </div>
      </div>

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Sliders & Number Fields */}
        <div className="lg:col-span-7 space-y-6">
          {/* Metadata Card */}
          <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Target Crop & Geography</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-600 dark:text-stone-400 block mb-1">
                  Crop Group
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value as CropGroup)}
                  className="w-full text-xs font-medium bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                >
                  {CROP_GROUPS.map((g) => (
                    <option key={g.group} value={g.group}>
                      {g.group} (β={MLR_MODEL_1.groupCoefficients[g.group] >= 0 ? '+' : ''}{MLR_MODEL_1.groupCoefficients[g.group].toFixed(3)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-600 dark:text-stone-400 block mb-1">
                  State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    const st = e.target.value as IndianState;
                    setSelectedState(st);
                    const firstMkt = MANDI_MARKETS.find((m) => m.state === st);
                    if (firstMkt) setSelectedMarket(firstMkt.name);
                  }}
                  className="w-full text-xs font-medium bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-600 dark:text-stone-400 block mb-1">
                  Mandi Market
                </label>
                <select
                  value={selectedMarket}
                  onChange={(e) => setSelectedMarket(e.target.value)}
                  className="w-full text-xs font-medium bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-600 rounded-lg p-2 focus:ring-1 focus:ring-amber-500"
                >
                  {MANDI_MARKETS.filter((m) => m.state === selectedState).map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 1: Labor & Machinery Inputs */}
          <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Tractor className="w-4 h-4 text-amber-600" />
              <span>Labor & Mechanization Dynamics</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-600 dark:text-stone-300">Farm Labor Cost (₹)</span>
                  <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">
                    ₹{inputs.farmLabourCost.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="50"
                  value={inputs.farmLabourCost}
                  onChange={(e) => handleInputChange('farmLabourCost', parseFloat(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-600 dark:text-stone-300">Farm Labor Hours</span>
                  <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">
                    {inputs.farmLabourHours} hrs
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="800"
                  step="5"
                  value={inputs.farmLabourHours}
                  onChange={(e) => handleInputChange('farmLabourHours', parseFloat(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-600 dark:text-stone-300">Machinery Cost (₹)</span>
                  <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">
                    ₹{inputs.machineryCost.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="25"
                  value={inputs.machineryCost}
                  onChange={(e) => handleInputChange('machineryCost', parseFloat(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-600 dark:text-stone-300">Machinery Hours</span>
                  <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">
                    {inputs.machineryHours} hrs
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="0.5"
                  value={inputs.machineryHours}
                  onChange={(e) => handleInputChange('machineryHours', parseFloat(e.target.value))}
                  className="w-full accent-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Fertilizers, Seeds & Manure */}
          <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-600" />
              <span>Nutrient & Input Expenditures</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-600 dark:text-stone-300">Fertilizer Quantity (Kg)</span>
                  <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">
                    {inputs.fertilizerQuantityKg} kg
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="5"
                  value={inputs.fertilizerQuantityKg}
                  onChange={(e) => handleInputChange('fertilizerQuantityKg', parseFloat(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-600 dark:text-stone-300">Fertilizer Cost (₹)</span>
                  <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">
                    ₹{inputs.fertilizerCost.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="25"
                  value={inputs.fertilizerCost}
                  onChange={(e) => handleInputChange('fertilizerCost', parseFloat(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-600 dark:text-stone-300">Seed Cost (₹)</span>
                  <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">
                    ₹{inputs.seedCost.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8000"
                  step="50"
                  value={inputs.seedCost}
                  onChange={(e) => handleInputChange('seedCost', parseFloat(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-600 dark:text-stone-300">Insecticide Cost (₹)</span>
                  <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">
                    ₹{inputs.insecticideCost.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3000"
                  step="25"
                  value={inputs.insecticideCost}
                  onChange={(e) => handleInputChange('insecticideCost', parseFloat(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Weather & Market Dynamics */}
          <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-blue-600" />
              <span>Rainfall & Arrival Influx</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-600 dark:text-stone-300">Monthly Rainfall (mm)</span>
                  <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">
                    {inputs.rainfallMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="5"
                  value={inputs.rainfallMm}
                  onChange={(e) => handleInputChange('rainfallMm', parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-stone-600 dark:text-stone-300">Arrival Quantity (Tonnes)</span>
                  <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">
                    {inputs.arrivalQuantityTonne} T
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="1000"
                  step="10"
                  value={inputs.arrivalQuantityTonne}
                  onChange={(e) => handleInputChange('arrivalQuantityTonne', parseFloat(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Predictive Results & Cloud Saved Scenarios */}
        <div className="lg:col-span-5 space-y-6">
          {/* Real-Time Prediction Outcome Card */}
          {prediction && (
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-stone-800 dark:to-stone-900 rounded-2xl p-6 border-2 border-amber-300 dark:border-amber-800 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-amber-200 dark:border-amber-800/60">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Model 1 Predicted Price Output
                </span>
                <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                  95% Confidence
                </span>
              </div>

              <div className="py-5 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-stone-600 dark:text-stone-400">Price per Quintal (100 kg):</span>
                  <span className="text-3xl font-extrabold font-mono text-stone-900 dark:text-stone-100 tabular-nums">
                    ₹{prediction.pricePerQuintal.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs text-stone-500 dark:text-stone-400 font-mono">
                  <span>Price per Tonne (1,000 kg):</span>
                  <span className="font-semibold text-stone-800 dark:text-stone-200 tabular-nums">
                    ₹{prediction.pricePerTonne.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs text-stone-500 dark:text-stone-400 font-mono">
                  <span>Transformed Log10 Price:</span>
                  <span className="font-semibold tabular-nums">{prediction.logPrice}</span>
                </div>
              </div>

              {/* Confidence Interval Bracket */}
              <div className="p-3.5 bg-white/80 dark:bg-stone-800/80 rounded-xl border border-amber-200/60 dark:border-stone-700 text-xs space-y-2 mb-4">
                <div className="flex justify-between font-medium">
                  <span className="text-stone-600 dark:text-stone-400">Lower Bound (lwr)</span>
                  <span className="text-stone-600 dark:text-stone-400">Fitted Value</span>
                  <span className="text-stone-600 dark:text-stone-400">Upper Bound (upr)</span>
                </div>
                <div className="flex justify-between font-mono font-bold text-stone-800 dark:text-stone-100 tabular-nums">
                  <span className="text-rose-600 dark:text-rose-400">₹{prediction.lowerBoundQuintal.toFixed(1)}</span>
                  <span className="text-amber-600 dark:text-amber-400">₹{prediction.pricePerQuintal.toFixed(1)}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">₹{prediction.upperBoundQuintal.toFixed(1)}</span>
                </div>
                <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden flex">
                  <div className="w-1/3 bg-rose-400/60"></div>
                  <div className="w-1/3 bg-amber-500"></div>
                  <div className="w-1/3 bg-emerald-400/60"></div>
                </div>
              </div>

              {/* Save Scenario Button */}
              <button
                onClick={handleSaveScenario}
                disabled={isSaving}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Syncing to Cloud...' : 'Save Cultivation Scenario'}</span>
              </button>

              {saveSuccessMsg && (
                <div className="mt-2 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Cloud Synchronized Scenarios List */}
          <div className="bg-white dark:bg-stone-800 rounded-xl p-5 border border-stone-200 dark:border-stone-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-700">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                Saved Scenarios ({savedScenarios.length})
              </h4>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">Real-Time Sync</span>
            </div>

            {savedScenarios.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400 space-y-1">
                <Calculator className="w-6 h-6 mx-auto stroke-1 text-stone-400 mb-1" />
                <p>No saved cultivation scenarios yet.</p>
                <p>Configure inputs on the left and click "Save Scenario".</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {savedScenarios.map((sc) => (
                  <div
                    key={sc.id}
                    className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-amber-400 transition-colors flex items-center justify-between gap-2"
                  >
                    <button
                      onClick={() => handleLoadScenario(sc)}
                      className="text-left flex-1 min-w-0"
                    >
                      <div className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                        {sc.cropGroup} ({sc.market}, {sc.state})
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                        Predicted: ₹{sc.predictedPriceQuintal.toFixed(2)}/Qtl · {new Date(sc.createdAt).toLocaleDateString()}
                      </div>
                    </button>

                    <button
                      onClick={() => handleDeleteScenario(sc.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors"
                      title="Delete Scenario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
