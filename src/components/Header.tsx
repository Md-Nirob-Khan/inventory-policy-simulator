import React from 'react';
import { Package, Sparkles, Menu, X } from 'lucide-react';
import { SimulationPreset } from '../types/inventory';

interface HeaderProps {
  onLoadPreset: (preset: SimulationPreset) => void;
  onOpenAIExplain: () => void;
  isLoadingAI: boolean;
  onReseed: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
  activeTabLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadPreset,
  onOpenAIExplain,
  isLoadingAI,
  onToggleMobileMenu,
  isMobileMenuOpen,
  activeTabLabel,
}) => {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
      <div className="w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Left: Hamburger (mobile) + Brand/Logo */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-700 dark:text-slate-200" />
              ) : (
                <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />
              )}
            </button>
          )}

          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Package className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                Inventory Policy Simulator
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                Stochastic Engine
              </span>
            </div>
            {activeTabLabel ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Current Tab: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{activeTabLabel}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                EOQ vs. Reorder Point (s,Q) vs. Periodic Review (T,S)
              </p>
            )}
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* AI Explain Button */}
          <button
            onClick={onOpenAIExplain}
            disabled={isLoadingAI}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isLoadingAI ? 'Analyzing...' : 'AI Explain'}
          </button>
        </div>
      </div>
    </header>
  );
};
