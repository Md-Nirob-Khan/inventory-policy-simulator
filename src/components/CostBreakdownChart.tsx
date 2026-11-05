import React from 'react';
import { PolicyResult } from '../types/inventory';
import { DollarSign, PieChart, ShieldAlert } from 'lucide-react';

interface CostBreakdownChartProps {
  results: PolicyResult[];
}

export const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({ results }) => {
  const maxTotalCost = Math.max(...results.map((r) => r.totalCost), 1);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            Cost Composition & Capital Allocation
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare how each policy splits spend between ordering transaction overhead and holding capital
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {results.map((policy) => {
          const ordWidth = (policy.totalOrderingCost / maxTotalCost) * 100;
          const holdWidth = (policy.totalHoldingCost / maxTotalCost) * 100;

          return (
            <div key={policy.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {policy.shortName}
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  ${policy.totalCost.toFixed(2)}
                </span>
              </div>

              {/* Stacked Proportional Bar */}
              <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex shadow-2xs">
                <div
                  style={{ width: `${ordWidth}%` }}
                  className="bg-indigo-500 hover:bg-indigo-600 transition-all flex items-center justify-center text-[10px] text-white font-mono font-medium truncate px-1"
                  title={`Ordering Cost: $${policy.totalOrderingCost.toFixed(2)}`}
                >
                  {ordWidth > 15 && `$${policy.totalOrderingCost.toFixed(0)}`}
                </div>
                <div
                  style={{ width: `${holdWidth}%` }}
                  className="bg-emerald-500 hover:bg-emerald-600 transition-all flex items-center justify-center text-[10px] text-white font-mono font-medium truncate px-1"
                  title={`Holding Cost: $${policy.totalHoldingCost.toFixed(2)}`}
                >
                  {holdWidth > 15 && `$${policy.totalHoldingCost.toFixed(0)}`}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>
                  Ordering: ${policy.totalOrderingCost.toFixed(2)} ({policy.orderCount} orders)
                </span>
                <span>
                  Holding: ${policy.totalHoldingCost.toFixed(2)} (Avg stock: {policy.averageInventory.toFixed(0)} units)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-indigo-500" />
          <span className="text-slate-600 dark:text-slate-400">Ordering Cost (S × Orders)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-emerald-500" />
          <span className="text-slate-600 dark:text-slate-400">Holding Cost (Inventory × H/365)</span>
        </div>
      </div>
    </div>
  );
};
