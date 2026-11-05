import React, { useState } from 'react';
import { SimulationInputs, SimulationPreset } from '../types/inventory';
import { SIMULATION_PRESETS } from '../utils/simulation';
import {
  RotateCcw,
  Sparkles,
  Sliders,
  DollarSign,
  Calendar,
  Clock,
  Layers,
  Info,
  ChevronDown,
  RefreshCw,
  Box,
} from 'lucide-react';

interface InputFormProps {
  inputs: SimulationInputs;
  onInputChange: (inputs: SimulationInputs) => void;
  onRunSimulation: () => void;
  onLoadPreset: (preset: SimulationPreset) => void;
  onReseed: () => void;
  currentSeed: number;
}

export const InputForm: React.FC<InputFormProps> = ({
  inputs,
  onInputChange,
  onRunSimulation,
  onLoadPreset,
  onReseed,
  currentSeed,
}) => {
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFieldChange = (field: keyof SimulationInputs, value: any) => {
    onInputChange({
      ...inputs,
      [field]: value,
    });
  };

  const handleNumericChange = (field: keyof SimulationInputs, rawValue: string) => {
    const parsed = parseFloat(rawValue);
    handleFieldChange(field, isNaN(parsed) ? 0 : parsed);
  };

  const serviceLevels = [90, 95, 99];
  const simulationLengths = [90, 180, 250, 365];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 shadow-sm">
      {/* Form Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Simulation Parameters
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure demand, replenishment costs, lead time, and service targets
          </p>
        </div>

        {/* Load Sample Data & Reseed Actions */}
        <div className="flex items-center gap-2 relative">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <Box className="w-3.5 h-3.5 text-indigo-500" />
              Load Sample Data
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Presets Dropdown */}
            {showPresetsDropdown && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowPresetsDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-40 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    Industry Presets
                  </div>
                  {SIMULATION_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        onLoadPreset(preset);
                        setShowPresetsDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors flex flex-col gap-0.5"
                    >
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {preset.name}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {preset.description}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Re-roll random demand seed */}
          <button
            type="button"
            onClick={onReseed}
            title="Generate a new randomized daily demand sequence"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-medium transition-all cursor-pointer border border-indigo-200 dark:border-indigo-800"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            New Demand Draw
          </button>
        </div>
      </div>

      {/* Form Fields Grid */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onRunSimulation();
        }}
        className="space-y-4"
      >
        {/* Product Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Product Name / SKU
          </label>
          <input
            type="text"
            value={inputs.productName}
            onChange={(e) => handleFieldChange('productName', e.target.value)}
            placeholder="e.g. Industrial Ball Bearings 6204-2RS"
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Demand Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Annual Demand (D)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={inputs.annualDemand}
                onChange={(e) => handleNumericChange('annualDemand', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400">units/year</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Avg daily demand: ~{(inputs.annualDemand / 365).toFixed(1)} units/day
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Daily Demand Std Dev (σd)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={inputs.dailyStdDev}
                onChange={(e) => handleNumericChange('dailyStdDev', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400">units/day</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Coefficient of variation: {inputs.annualDemand > 0 ? ((inputs.dailyStdDev / (inputs.annualDemand / 365)) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>

        {/* Cost Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ordering Cost (S per order)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-medium text-slate-400">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={inputs.orderingCost}
                onChange={(e) => handleNumericChange('orderingCost', e.target.value)}
                className="w-full pl-7 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400">/ order</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Fixed purchase order processing & freight fee
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Holding Cost (H per unit / year)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-medium text-slate-400">$</span>
              <input
                type="number"
                min="0"
                step="any"
                value={inputs.holdingCost}
                onChange={(e) => handleNumericChange('holdingCost', e.target.value)}
                className="w-full pl-7 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400">/ unit / yr</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Storage, insurance, obsolescence & capital cost
            </p>
          </div>
        </div>

        {/* Lead Time & Service Level */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supplier Lead Time (L)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="any"
                value={inputs.leadTime}
                onChange={(e) => handleNumericChange('leadTime', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400">days</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Order placement to warehouse arrival
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Service Level (Cycle Availability)
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {serviceLevels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleFieldChange('serviceLevel', lvl)}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    inputs.serviceLevel === lvl
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {lvl}%
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Z-score: {inputs.serviceLevel === 90 ? '1.282' : inputs.serviceLevel === 95 ? '1.645' : '2.326'}
            </p>
          </div>
        </div>

        {/* Simulation Length */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Simulation Horizon (Days)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {simulationLengths.map((len) => (
              <button
                key={len}
                type="button"
                onClick={() => handleFieldChange('simulationDays', len)}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  inputs.simulationDays === len
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {len} Days
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Recalculate & Simulate Policies
          </button>
        </div>
      </form>
    </div>
  );
};
