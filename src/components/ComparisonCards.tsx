import React from 'react';
import { PolicyResult, SimulationInputs } from '../types/inventory';
import { Award, Package, Clock, ShieldAlert, ArrowDownRight, ArrowUpRight, Check, X, Layers } from 'lucide-react';

interface ComparisonCardsProps {
  results: PolicyResult[];
  inputs: SimulationInputs;
  bestPolicyId: string;
}

export const ComparisonCards: React.FC<ComparisonCardsProps> = ({
  results,
  inputs,
  bestPolicyId,
}) => {
  // Policy style configurations
  const styleConfig: Record<
    string,
    {
      borderColor: string;
      accentBg: string;
      accentText: string;
      tagBg: string;
      headerBg: string;
    }
  > = {
    eoq: {
      borderColor: 'border-amber-300 dark:border-amber-800',
      accentBg: 'bg-amber-500',
      accentText: 'text-amber-600 dark:text-amber-400',
      tagBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      headerBg: 'from-amber-500/10 to-transparent',
    },
    reorder_point: {
      borderColor: 'border-emerald-300 dark:border-emerald-800',
      accentBg: 'bg-emerald-500',
      accentText: 'text-emerald-600 dark:text-emerald-400',
      tagBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      headerBg: 'from-emerald-500/10 to-transparent',
    },
    periodic_review: {
      borderColor: 'border-blue-300 dark:border-blue-800',
      accentBg: 'bg-blue-500',
      accentText: 'text-blue-600 dark:text-blue-400',
      tagBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      headerBg: 'from-blue-500/10 to-transparent',
    },
  };

  // Find lowest cost among the 3 for comparison tagging
  const minCost = Math.min(...results.map((r) => r.totalCost));
  const maxFillRate = Math.max(...results.map((r) => r.fillRate));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Side-by-Side Policy Comparison
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare total inventory costs, fulfillment rates, and stockout vulnerability under stochastic demand
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {results.map((policy) => {
          const isBest = policy.id === bestPolicyId;
          const styles = styleConfig[policy.id];
          const meetsTarget = policy.fillRate >= inputs.serviceLevel;
          const holdingPercent =
            policy.totalCost > 0
              ? (policy.totalHoldingCost / policy.totalCost) * 100
              : 0;
          const orderingPercent =
            policy.totalCost > 0
              ? (policy.totalOrderingCost / policy.totalCost) * 100
              : 0;

          return (
            <div
              key={policy.id}
              className={`relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md ${
                isBest
                  ? 'border-indigo-600 dark:border-indigo-500 shadow-indigo-100 dark:shadow-none ring-2 ring-indigo-500/20'
                  : styles.borderColor
              }`}
            >
              {/* Winner Floating Badge */}
              {isBest && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5" /> Best Choice
                </div>
              )}

              {/* Card Header */}
              <div
                className={`p-5 rounded-t-2xl bg-gradient-to-b ${styles.headerBg} border-b border-slate-100 dark:border-slate-800`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Policy #{results.indexOf(policy) + 1}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {policy.name}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${styles.tagBg}`}
                  >
                    {policy.shortName}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {policy.tagline}
                </p>

                {/* Formula / Policy Parameters Box */}
                <div className="mt-3 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
                  <div className="font-mono text-slate-700 dark:text-slate-300 space-y-1">
                    {policy.id === 'eoq' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Order Quantity Q*:</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {policy.parameters.orderQuantity} units
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Reorder Point:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {policy.parameters.reorderPoint} units (0 SS)
                          </span>
                        </div>
                      </>
                    )}

                    {policy.id === 'reorder_point' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Order Quantity Q*:</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {policy.parameters.orderQuantity} units
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Safety Stock (SS):</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            +{policy.parameters.safetyStock} units
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Reorder Point s:</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {policy.parameters.reorderPoint} units
                          </span>
                        </div>
                      </>
                    )}

                    {policy.id === 'periodic_review' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Review Cadence (T):</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            Every {policy.parameters.reviewPeriod} days
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target Base Stock (S):</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {policy.parameters.targetLevel} units
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Protection Window:</span>
                          <span className="text-slate-600 dark:text-slate-300">
                            {(policy.parameters.reviewPeriod || 0) + inputs.leadTime} days (T+L)
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body Metrics */}
              <div className="p-5 space-y-4 flex-1">
                {/* Total Cost Highlight */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/40">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Total Cost
                    </span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                      ${policy.totalCost.toFixed(2)}
                    </span>
                  </div>

                  {/* Ordering vs Holding cost breakdown bar */}
                  <div className="space-y-1.5 mt-2">
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 flex overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full transition-all"
                        style={{ width: `${orderingPercent}%` }}
                        title={`Ordering Cost: $${policy.totalOrderingCost.toFixed(2)} (${orderingPercent.toFixed(0)}%)`}
                      />
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${holdingPercent}%` }}
                        title={`Holding Cost: $${policy.totalHoldingCost.toFixed(2)} (${holdingPercent.toFixed(0)}%)`}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        Ord: ${policy.totalOrderingCost.toFixed(0)} ({policy.orderCount} ords)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Hold: ${policy.totalHoldingCost.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stockout Days & Fill Rate (Core Deliverable) */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`p-3 rounded-xl border ${
                      policy.stockoutDays > 0
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                        : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50'
                    }`}
                  >
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                      Stockout Days
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span
                        className={`text-xl font-bold ${
                          policy.stockoutDays > 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {policy.stockoutDays}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        / {inputs.simulationDays}d
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {policy.totalStockoutUnits} lost units
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/40">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                      Fill Rate
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span
                        className={`text-xl font-bold ${
                          meetsTarget
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {policy.fillRate.toFixed(1)}%
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-medium ${
                        meetsTarget ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {meetsTarget
                        ? `✓ ≥ ${inputs.serviceLevel}% Target`
                        : `✗ Below ${inputs.serviceLevel}% Target`}
                    </span>
                  </div>
                </div>

                {/* Inventory Profile Sub-metrics */}
                <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Average On-Hand:</span>
                    <span className="font-mono font-medium">
                      {policy.averageInventory.toFixed(1)} units
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Min / Max Stock:</span>
                    <span className="font-mono font-medium">
                      {policy.minInventory} / {policy.maxInventory} units
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cycle Service Level:</span>
                    <span className="font-mono font-medium">
                      {policy.cycleServiceLevel.toFixed(1)}% of days stockout-free
                    </span>
                  </div>
                </div>

                {/* Pros and Cons Summary */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-start gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{policy.pros[0]}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-rose-700 dark:text-rose-400">
                      <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{policy.cons[0]}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
