import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calculator, HelpCircle } from 'lucide-react';

export const FormulaReference: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Formulas Reference & Mathematical Definitions
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                Plain Text
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Core inventory operations research formulas for EOQ, Safety Stock, Reorder Point, and Order-Up-To Level
            </p>
          </div>
        </div>

        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs bg-slate-50/60 dark:bg-slate-800/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. EOQ Formula */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">
                  1. Economic Order Quantity (EOQ)
                </span>
                <span className="text-[10px] font-mono text-slate-400">Fixed Batch Size</span>
              </div>
              <div className="p-2.5 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                EOQ = √((2 × D × S) / H)
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div>• <strong className="text-slate-800 dark:text-slate-200">D</strong> = Annual Demand (units/year)</div>
                <div>• <strong className="text-slate-800 dark:text-slate-200">S</strong> = Ordering Cost per Order ($)</div>
                <div>• <strong className="text-slate-800 dark:text-slate-200">H</strong> = Holding Cost per Unit per Year ($/unit/year)</div>
                <div>• <strong className="text-slate-800 dark:text-slate-200">EOQ Reorder Point</strong> = d × L (0 safety stock, where d = D / 365)</div>
              </div>
            </div>

            {/* 2. Safety Stock Formula */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                  2. Safety Stock (SS)
                </span>
                <span className="text-[10px] font-mono text-slate-400">Statistical Buffer</span>
              </div>
              <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-lg font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                Safety Stock = Z × σL = Z × σd × √L
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div>• <strong className="text-slate-800 dark:text-slate-200">Z</strong> = Service Level quantile (90% = 1.282, 95% = 1.645, 99% = 2.326)</div>
                <div>• <strong className="text-slate-800 dark:text-slate-200">σd</strong> = Daily Demand Standard Deviation (units/day)</div>
                <div>• <strong className="text-slate-800 dark:text-slate-200">L</strong> = Supplier Lead Time (days)</div>
                <div>• <strong className="text-slate-800 dark:text-slate-200">σL</strong> = Demand Standard Deviation over Lead Time (σd × √L)</div>
              </div>
            </div>

            {/* 3. Reorder Point Formula */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                  3. Reorder Point (s, Q)
                </span>
                <span className="text-[10px] font-mono text-slate-400">Continuous Review</span>
              </div>
              <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 rounded-lg font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                Reorder Point (s) = (d × L) + (Z × σd × √L)
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div>• <strong className="text-slate-800 dark:text-slate-200">Expected Lead Time Demand</strong> = d × L</div>
                <div>• <strong className="text-slate-800 dark:text-slate-200">Order Quantity</strong> = Q = EOQ</div>
                <div>• <strong className="text-slate-800 dark:text-slate-200">Trigger Rule</strong>: If (On-Hand + In-Transit) ≤ s, order batch size Q.</div>
              </div>
            </div>

            {/* 4. Order-Up-To Level Formula */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-600 dark:text-blue-400 text-xs">
                  4. Periodic Review Order-Up-To Level (T, S)
                </span>
                <span className="text-[10px] font-mono text-slate-400">Periodic Review</span>
              </div>
              <div className="p-2.5 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-lg font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                Order-Up-To Level (S) = d × (T + L) + Z × σd × √(T + L)
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div>• <strong className="text-slate-800 dark:text-slate-200">Review Cadence (T)</strong> = round((EOQ / D) × 365) days</div>
                <div>• <strong className="text-slate-800 dark:text-slate-200">Protection Period</strong> = T + L days (risk window)</div>
                <div>• <strong className="text-slate-800 dark:text-slate-200">Trigger Rule</strong>: Every T days, order Q = max(0, S - Inventory Position).</div>
              </div>
            </div>
          </div>

          {/* Performance & Cost Formulas */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block mb-2">
              Cost & Fulfillment Performance Equations
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-[11px]">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-slate-400 text-[10px] uppercase font-sans">Total Cost</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Total Cost = Total Ordering Cost + Total Holding Cost
                </div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-slate-400 text-[10px] uppercase font-sans">Holding Cost Rate</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Daily Holding Cost = Ending Stock × (H / 365)
                </div>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-slate-400 text-[10px] uppercase font-sans">Fill Rate %</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Fill Rate = (Fulfilled Units / Total Demand Units) × 100%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
