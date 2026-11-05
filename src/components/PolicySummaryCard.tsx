import React from 'react';
import { BestPolicyEvaluation, PolicyResult, SimulationInputs } from '../types/inventory';
import { Award, Sparkles, TrendingUp, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface PolicySummaryCardProps {
  evaluation: BestPolicyEvaluation;
  results: PolicyResult[];
  inputs: SimulationInputs;
  onOpenAIExplain: () => void;
  isLoadingAI: boolean;
}

export const PolicySummaryCard: React.FC<PolicySummaryCardProps> = ({
  evaluation,
  results,
  inputs,
  onOpenAIExplain,
  isLoadingAI,
}) => {
  const winner = results.find((r) => r.id === evaluation.winnerId) || results[0];
  const eoq = results.find((r) => r.id === 'eoq');
  const rop = results.find((r) => r.id === 'reorder_point');
  const periodic = results.find((r) => r.id === 'periodic_review');

  // Compute key comparison delta
  const isWinnerServiceTargetMet = winner.fillRate >= inputs.serviceLevel;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-xl p-6 md:p-7">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-10 w-60 h-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Top Header Tag */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Recommended Policy
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                Simulation Horizon: {inputs.simulationDays} Days
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              {winner.name}
            </h2>
          </div>
        </div>

        {/* AI Explain Call-To-Action Button */}
        <button
          onClick={onOpenAIExplain}
          disabled={isLoadingAI}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold text-xs shadow-md transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 animate-spin-slow" />
          {isLoadingAI ? 'Generating AI Insights...' : 'AI Explain (Gemini)'}
        </button>
      </div>

      {/* Main Verdict Headline */}
      <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xs">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm md:text-base font-medium text-slate-100 leading-relaxed">
              {evaluation.headlineReason}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Evaluated against stochastic lead time demand (L = {inputs.leadTime} days, σd = {inputs.dailyStdDev} units/day) and target service level of {inputs.serviceLevel}%.
            </p>
          </div>
        </div>
      </div>

      {/* Key Winner Metrics Quick Grid: 1 col on mobile, 2x2 grid on medium, 4 cols on wide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/50 flex flex-col justify-between min-w-0 overflow-hidden">
          <span className="text-[11px] text-slate-400 uppercase font-medium tracking-wide">Total Cost</span>
          <div className="text-lg md:text-xl font-bold text-white mt-1">
            ${winner.totalCost.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 truncate">
            Ord: ${winner.totalOrderingCost.toFixed(0)} | Hold: ${winner.totalHoldingCost.toFixed(0)}
          </span>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/50 flex flex-col justify-between min-w-0 overflow-hidden">
          <span className="text-[11px] text-slate-400 uppercase font-medium tracking-wide">Achieved Fill Rate</span>
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 mt-1">
            <span
              className={`text-lg md:text-xl font-bold ${
                isWinnerServiceTargetMet ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {winner.fillRate.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400 shrink-0">
              (Target: {inputs.serviceLevel}%)
            </span>
          </div>
          <span className="text-[10px] text-emerald-300 mt-1 flex items-center gap-1">
            {isWinnerServiceTargetMet ? '✓ Met Service Target' : '⚠ Below Target'}
          </span>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/50 flex flex-col justify-between min-w-0 overflow-hidden">
          <span className="text-[11px] text-slate-400 uppercase font-medium tracking-wide">Stockout Incidents</span>
          <div className="text-lg md:text-xl font-bold text-white mt-1 flex items-baseline gap-1">
            <span>{winner.stockoutDays}</span>
            <span className="text-xs font-normal text-slate-400">days</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">
            {winner.totalStockoutUnits} lost units
          </span>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/50 flex flex-col justify-between min-w-0 overflow-hidden">
          <span className="text-[11px] text-slate-400 uppercase font-medium tracking-wide">Average Stock</span>
          <div className="text-lg md:text-xl font-bold text-white mt-1 flex items-baseline gap-1">
            <span>{winner.averageInventory.toFixed(0)}</span>
            <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 truncate">
            {winner.orderCount} replenishment orders
          </span>
        </div>
      </div>

      {/* Detailed Supply Chain Rationale */}
      <div className="border-t border-slate-800 pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          Why This Policy Is Best For {inputs.productName || 'Your Product'}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {evaluation.detailedAnalysis.map((point, idx) => (
            <div
              key={idx}
              className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40 text-xs text-slate-300 leading-relaxed"
            >
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span>{point}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Action Footer */}
      <div className="mt-5 p-3 rounded-xl bg-indigo-950/60 border border-indigo-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-indigo-200">
            <strong className="text-white">Manager Action:</strong> {evaluation.recommendation}
          </span>
        </div>
      </div>
    </div>
  );
};
