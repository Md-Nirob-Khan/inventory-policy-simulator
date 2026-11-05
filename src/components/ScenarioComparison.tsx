import React, { useState } from 'react';
import { SavedScenario, PolicyResult, SimulationInputs } from '../types/inventory';
import {
  BookmarkPlus,
  Trash2,
  RotateCcw,
  Sparkles,
  Layers,
  Award,
  ArrowRight,
  Check,
  AlertTriangle,
  Flame,
  Plus,
} from 'lucide-react';

interface ScenarioComparisonProps {
  savedScenarios: SavedScenario[];
  onSaveCurrentRun: (scenarioName: string) => void;
  onDeleteScenario: (id: string) => void;
  onLoadScenarioIntoSimulator: (scenario: SavedScenario) => void;
  onLoadExampleScenarios: () => void;
  onClearAllScenarios: () => void;
  currentInputs: SimulationInputs;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  savedScenarios,
  onSaveCurrentRun,
  onDeleteScenario,
  onLoadScenarioIntoSimulator,
  onLoadExampleScenarios,
  onClearAllScenarios,
  currentInputs,
}) => {
  const [newScenarioName, setNewScenarioName] = useState('');
  const [isNamingOpen, setIsNamingOpen] = useState(false);

  const canSave = savedScenarios.length < 3;

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newScenarioName.trim() || `Run ${savedScenarios.length + 1} (${currentInputs.annualDemand.toLocaleString()} D, σd=${currentInputs.dailyStdDev})`;
    onSaveCurrentRun(name);
    setNewScenarioName('');
    setIsNamingOpen(false);
  };

  const policyOrder: { id: string; name: string; short: string; color: string }[] = [
    { id: 'eoq', name: 'Economic Order Quantity (EOQ)', short: 'EOQ', color: 'text-amber-600 dark:text-amber-400' },
    { id: 'reorder_point', name: 'Reorder Point (s, Q)', short: 'ROP (s, Q)', color: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'periodic_review', name: 'Periodic Review (T, S)', short: 'Periodic (T, S)', color: 'text-blue-600 dark:text-blue-400' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 md:p-6 shadow-sm">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Scenario Comparison Matrix
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold">
              {savedScenarios.length} / 3 Runs Saved
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compare up to 3 saved operational scenarios side by side (e.g. Low Demand, High Demand, High Variability)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {savedScenarios.length === 0 && (
            <button
              onClick={onLoadExampleScenarios}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Example 3 Scenarios
            </button>
          )}

          {canSave ? (
            !isNamingOpen ? (
              <button
                onClick={() => {
                  setNewScenarioName(`Run ${savedScenarios.length + 1}: ${currentInputs.annualDemand > 15000 ? 'High Demand' : currentInputs.dailyStdDev > 15 ? 'High Volatility' : 'Base Case'}`);
                  setIsNamingOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                Save Current Run as Scenario
              </button>
            ) : (
              <form onSubmit={handleSaveSubmit} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  placeholder="Scenario name..."
                  autoFocus
                  className="px-2.5 py-1 text-xs rounded-lg border border-indigo-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsNamingOpen(false)}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
              </form>
            )
          ) : (
            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 font-medium">
              3 slots full (delete a run to save current)
            </span>
          )}

          {savedScenarios.length > 0 && (
            <button
              onClick={onClearAllScenarios}
              title="Clear all saved scenarios"
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors rounded-lg cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Scenarios Table */}
      {savedScenarios.length === 0 ? (
        <div className="py-10 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
            No Scenarios Saved Yet
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
            Save up to 3 runs under different market conditions (e.g., Low Demand, High Demand, High Volatility) to compare total cost, fill rate, and stockouts side by side.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onLoadExampleScenarios}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Example 3 Scenarios
            </button>
            <button
              onClick={() => onSaveCurrentRun('Scenario 1: Current Run')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              Save Current Simulator State
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Side by side comparison table */}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-3 w-48 font-bold text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/40 rounded-tl-xl">
                  Policy Metric
                </th>
                {savedScenarios.map((scenario) => (
                  <th
                    key={scenario.id}
                    className="py-3 px-4 min-w-[240px] bg-slate-50/70 dark:bg-slate-800/40 border-l border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {scenario.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          D = {scenario.inputs.annualDemand.toLocaleString()} | σd = {scenario.inputs.dailyStdDev} | L = {scenario.inputs.leadTime}d | SL = {scenario.inputs.serviceLevel}%
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onLoadScenarioIntoSimulator(scenario)}
                          title="Restore these parameters into simulator"
                          className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-md transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteScenario(scenario.id)}
                          title="Delete scenario"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {/* Winner badge */}
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                      <Award className="w-3 h-3 text-amber-500" />
                      Best: {scenario.bestPolicyName}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {policyOrder.map((pol) => (
                <React.Fragment key={pol.id}>
                  {/* Policy Category Header Row */}
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <td
                      colSpan={savedScenarios.length + 1}
                      className="py-2 px-3 font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300"
                    >
                      <span className={pol.color}>{pol.name}</span>
                    </td>
                  </tr>

                  {/* Total Cost Row */}
                  <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                    <td className="py-2 px-3 pl-5 text-slate-500 dark:text-slate-400 font-medium">
                      Total Cost
                    </td>
                    {savedScenarios.map((sc) => {
                      const res = sc.results.find((r) => r.id === pol.id);
                      if (!res) return <td key={sc.id} className="py-2 px-4 border-l border-slate-200 dark:border-slate-800 font-mono">-</td>;
                      return (
                        <td
                          key={sc.id}
                          className="py-2 px-4 border-l border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100"
                        >
                          ${res.totalCost.toFixed(2)}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Ord: ${res.totalOrderingCost.toFixed(0)} | Hold: ${res.totalHoldingCost.toFixed(0)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Fill Rate Row */}
                  <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                    <td className="py-2 px-3 pl-5 text-slate-500 dark:text-slate-400 font-medium">
                      Fill Rate (%)
                    </td>
                    {savedScenarios.map((sc) => {
                      const res = sc.results.find((r) => r.id === pol.id);
                      if (!res) return <td key={sc.id} className="py-2 px-4 border-l border-slate-200 dark:border-slate-800 font-mono">-</td>;
                      const meets = res.fillRate >= sc.inputs.serviceLevel;
                      return (
                        <td
                          key={sc.id}
                          className="py-2 px-4 border-l border-slate-200 dark:border-slate-800 font-mono"
                        >
                          <span
                            className={`font-bold ${
                              meets ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {res.fillRate.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">
                            (Target: {sc.inputs.serviceLevel}%)
                          </span>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Stockouts Row */}
                  <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                    <td className="py-2 px-3 pl-5 text-slate-500 dark:text-slate-400 font-medium">
                      Stockout Days
                    </td>
                    {savedScenarios.map((sc) => {
                      const res = sc.results.find((r) => r.id === pol.id);
                      if (!res) return <td key={sc.id} className="py-2 px-4 border-l border-slate-200 dark:border-slate-800 font-mono">-</td>;
                      return (
                        <td
                          key={sc.id}
                          className="py-2 px-4 border-l border-slate-200 dark:border-slate-800 font-mono"
                        >
                          <span
                            className={`font-bold ${
                              res.stockoutDays > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {res.stockoutDays} days
                          </span>
                          {res.totalStockoutUnits > 0 && (
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({res.totalStockoutUnits} lost units)
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Quick Summary Insights Bar */}
          <div className="mt-4 p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-purple-900 dark:text-purple-200 font-medium">
              💡 <strong>Scenario Takeaway:</strong> Notice how basic EOQ stockouts escalate significantly when daily demand volatility (σd) increases, whereas Reorder Point (s, Q) expands safety stock buffer to maintain high fill rates.
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Click the reload icon next to any run to restore its parameters into the live simulator.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
