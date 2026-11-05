import React, { useState } from 'react';
import { BestPolicyEvaluation, PolicyResult, SimulationInputs } from '../types/inventory';
import {
  Sparkles,
  X,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface AIExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: string | null;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
  productName: string;
  bestPolicyName: string;
}

export const AIExplanationModal: React.FC<AIExplanationModalProps> = ({
  isOpen,
  onClose,
  explanation,
  isLoading,
  error,
  onRegenerate,
  productName,
  bestPolicyName,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!explanation) return;
    navigator.clipboard.writeText(explanation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert markdown to clean HTML or structured blocks
  const renderFormattedExplanation = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
        return (
          <h4
            key={idx}
            className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2 flex items-center gap-1.5"
          >
            {trimmed.replace(/^#+\s*/, '')}
          </h4>
        );
      }
      if (trimmed.startsWith('1. ') || trimmed.startsWith('2. ') || trimmed.startsWith('3. ') || trimmed.startsWith('4. ')) {
        return (
          <div key={idx} className="font-semibold text-slate-800 dark:text-slate-200 mt-3 mb-1">
            {trimmed}
          </div>
        );
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed.substring(2);
        // highlight bold segments
        const parts = content.split(/\*\*(.*?)\*\*/g);
        return (
          <div key={idx} className="flex items-start gap-2 text-xs md:text-sm text-slate-600 dark:text-slate-300 ml-3 my-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
            <span>
              {parts.map((p, pIdx) =>
                pIdx % 2 === 1 ? (
                  <strong key={pIdx} className="text-slate-900 dark:text-slate-100 font-semibold">
                    {p}
                  </strong>
                ) : (
                  p
                )
              )}
            </span>
          </div>
        );
      }
      if (trimmed === '') {
        return <div key={idx} className="h-2" />;
      }
      // Standard paragraph with bold parsing
      const parts = trimmed.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={idx} className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
          {parts.map((p, pIdx) =>
            pIdx % 2 === 1 ? (
              <strong key={pIdx} className="text-slate-900 dark:text-slate-100 font-semibold">
                {p}
              </strong>
            ) : (
              p
            )
          )}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 md:p-6 bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-900 text-white flex items-center justify-between border-b border-indigo-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">AI Supply Chain Analysis</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-200 border border-indigo-400/30 font-semibold">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                Plain-language executive breakdown for {productName || 'Your Product'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Gemini is synthesizing simulation results...
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                Analyzing inventory trajectories, stockout probabilities, and holding cost trade-offs
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                    AI Service Notice
                  </h4>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                    {error}
                  </p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-2">
                    Tip: If your Gemini API Key is not yet configured, configure it in the Secrets panel.
                  </p>
                </div>
              </div>

              {explanation && (
                <div className="mt-4 pt-4 border-t border-rose-200 dark:border-rose-900/50">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Offline Rule-Based Analysis:
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    {renderFormattedExplanation(explanation)}
                  </div>
                </div>
              )}
            </div>
          ) : explanation ? (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              {renderFormattedExplanation(explanation)}
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Winner: <strong className="text-slate-800 dark:text-slate-200">{bestPolicyName}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            {explanation && (
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Text
                  </>
                )}
              </button>
            )}

            <button
              onClick={onRegenerate}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Re-analyze
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
