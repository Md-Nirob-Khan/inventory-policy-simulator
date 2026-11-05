import React, { useState, useMemo, useEffect } from 'react';
import {
  SimulationInputs,
  PolicyResult,
  BestPolicyEvaluation,
  SimulationPreset,
  SavedScenario,
} from './types/inventory';
import {
  generateDailyDemandSequence,
  runSimulationForPolicy,
  evaluateBestPolicy,
  SIMULATION_PRESETS,
} from './utils/simulation';
import { Header } from './components/Header';
import { Sidebar, TabId, TABS } from './components/Sidebar';
import { InputForm } from './components/InputForm';
import { PolicySummaryCard } from './components/PolicySummaryCard';
import { ComparisonCards } from './components/ComparisonCards';
import { InventoryChart } from './components/InventoryChart';
import { CostBreakdownChart } from './components/CostBreakdownChart';
import { ScenarioComparison } from './components/ScenarioComparison';
import { DailyLogTable } from './components/DailyLogTable';
import { FormulaReference } from './components/FormulaReference';
import { AIExplanationModal } from './components/AIExplanationModal';
import { ArrowRight } from 'lucide-react';

export default function App() {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Primary simulation input state
  const [inputs, setInputs] = useState<SimulationInputs>({
    productName: 'Precision Ball Bearings 6204-2RS',
    annualDemand: 12000,
    dailyStdDev: 8,
    orderingCost: 50,
    holdingCost: 4.5,
    leadTime: 6,
    serviceLevel: 95,
    simulationDays: 180,
  });

  // Seed for randomized daily demand draws
  const [demandSeed, setDemandSeed] = useState<number>(() => Math.floor(Math.random() * 900000) + 100000);

  // Single Synchronous Simulation Source of Truth:
  // Derived via useMemo so EVERY tab reads from ONE SINGLE identical simulation result.
  const { results, evaluation, dailyDemands } = useMemo(() => {
    const meanDailyDemand = inputs.annualDemand / 365;
    const demands = generateDailyDemandSequence(
      inputs.simulationDays,
      meanDailyDemand,
      inputs.dailyStdDev,
      demandSeed
    );

    const eoqResult = runSimulationForPolicy('eoq', inputs, demands);
    const ropResult = runSimulationForPolicy('reorder_point', inputs, demands);
    const periodicResult = runSimulationForPolicy('periodic_review', inputs, demands);

    const allResults = [eoqResult, ropResult, periodicResult];
    const evalResult = evaluateBestPolicy(allResults, inputs);

    allResults.forEach((r) => {
      r.isWinner = r.id === evalResult.winnerId;
    });

    return {
      results: allResults,
      evaluation: evalResult,
      dailyDemands: demands,
    };
  }, [inputs, demandSeed]);

  // Saved Scenarios State (persisted to localStorage)
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() => {
    try {
      const stored = localStorage.getItem('inventory_scenarios_v3');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (_) {}
    return [];
  });

  // Save scenarios to localStorage when updated
  useEffect(() => {
    try {
      localStorage.setItem('inventory_scenarios_v3', JSON.stringify(savedScenarios));
    } catch (_) {}
  }, [savedScenarios]);

  // AI Explain State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Handle Preset Loading
  const handleLoadPreset = (preset: SimulationPreset) => {
    setInputs(preset.inputs);
    setDemandSeed(Math.floor(Math.random() * 900000) + 100000);
    setAiExplanation(null);
    setActiveTab('overview');
  };

  // Generate a brand new random demand draw
  const handleReseed = () => {
    setDemandSeed(Math.floor(Math.random() * 900000) + 100000);
    setAiExplanation(null);
  };

  // Recalculate & Simulate action (Rule: automatically switch to Overview tab)
  const handleRunSimulation = () => {
    handleReseed();
    setActiveTab('overview');
  };

  // Scenario Comparison Handlers
  const handleSaveCurrentRun = (scenarioName: string) => {
    if (savedScenarios.length >= 3) return;

    const newScenario: SavedScenario = {
      id: `sc_${Date.now()}`,
      name: scenarioName,
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      inputs: { ...inputs },
      results: results.map((r) => ({
        id: r.id,
        name: r.name,
        shortName: r.shortName,
        totalCost: r.totalCost,
        totalOrderingCost: r.totalOrderingCost,
        totalHoldingCost: r.totalHoldingCost,
        stockoutDays: r.stockoutDays,
        totalStockoutUnits: r.totalStockoutUnits,
        fillRate: r.fillRate,
        orderCount: r.orderCount,
        averageInventory: r.averageInventory,
        orderQuantity: r.parameters.orderQuantity,
        reorderPoint: r.parameters.reorderPoint,
        safetyStock: r.parameters.safetyStock,
        targetLevel: r.parameters.targetLevel,
        reviewPeriod: r.parameters.reviewPeriod,
        isWinner: r.isWinner,
      })),
      bestPolicyName: evaluation.winnerName,
      bestPolicyId: evaluation.winnerId,
    };

    setSavedScenarios((prev) => [...prev, newScenario]);
  };

  const handleDeleteScenario = (id: string) => {
    setSavedScenarios((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearAllScenarios = () => {
    setSavedScenarios([]);
  };

  const handleLoadScenarioIntoSimulator = (scenario: SavedScenario) => {
    setInputs({ ...scenario.inputs });
    setDemandSeed(Math.floor(Math.random() * 900000) + 100000);
    setAiExplanation(null);
    setActiveTab('overview');
  };

  // Load Example 3 Scenarios
  const handleLoadExampleScenarios = () => {
    const exampleConfigs: { name: string; inputs: SimulationInputs }[] = [
      {
        name: 'Scenario 1: Low Demand',
        inputs: {
          productName: inputs.productName || 'Precision Ball Bearings',
          annualDemand: 5000,
          dailyStdDev: 4,
          orderingCost: 50,
          holdingCost: 4.5,
          leadTime: 6,
          serviceLevel: 95,
          simulationDays: 180,
        },
      },
      {
        name: 'Scenario 2: High Demand',
        inputs: {
          productName: inputs.productName || 'Precision Ball Bearings',
          annualDemand: 24000,
          dailyStdDev: 10,
          orderingCost: 50,
          holdingCost: 4.5,
          leadTime: 6,
          serviceLevel: 95,
          simulationDays: 180,
        },
      },
      {
        name: 'Scenario 3: High Volatility',
        inputs: {
          productName: inputs.productName || 'Precision Ball Bearings',
          annualDemand: 12000,
          dailyStdDev: 20,
          orderingCost: 50,
          holdingCost: 4.5,
          leadTime: 6,
          serviceLevel: 95,
          simulationDays: 180,
        },
      },
    ];

    const generatedScenarios: SavedScenario[] = exampleConfigs.map((cfg, idx) => {
      const meanDemand = cfg.inputs.annualDemand / 365;
      const demands = generateDailyDemandSequence(
        cfg.inputs.simulationDays,
        meanDemand,
        cfg.inputs.dailyStdDev,
        2000 + idx * 888
      );

      const rEoq = runSimulationForPolicy('eoq', cfg.inputs, demands);
      const rRop = runSimulationForPolicy('reorder_point', cfg.inputs, demands);
      const rPer = runSimulationForPolicy('periodic_review', cfg.inputs, demands);

      const evalRes = evaluateBestPolicy([rEoq, rRop, rPer], cfg.inputs);

      return {
        id: `example_sc_${idx + 1}`,
        name: cfg.name,
        savedAt: 'Preset',
        inputs: cfg.inputs,
        results: [rEoq, rRop, rPer].map((r) => ({
          id: r.id,
          name: r.name,
          shortName: r.shortName,
          totalCost: r.totalCost,
          totalOrderingCost: r.totalOrderingCost,
          totalHoldingCost: r.totalHoldingCost,
          stockoutDays: r.stockoutDays,
          totalStockoutUnits: r.totalStockoutUnits,
          fillRate: r.fillRate,
          orderCount: r.orderCount,
          averageInventory: r.averageInventory,
          orderQuantity: r.parameters.orderQuantity,
          reorderPoint: r.parameters.reorderPoint,
          safetyStock: r.parameters.safetyStock,
          targetLevel: r.parameters.targetLevel,
          reviewPeriod: r.parameters.reviewPeriod,
          isWinner: r.id === evalRes.winnerId,
        })),
        bestPolicyName: evalRes.winnerName,
        bestPolicyId: evalRes.winnerId,
      };
    });

    setSavedScenarios(generatedScenarios);
  };

  // Call Gemini AI Explanation Endpoint
  const handleFetchAIExplanation = async () => {
    if (!evaluation || results.length === 0) return;

    setIsAIModalOpen(true);
    if (aiExplanation && !aiError) return;

    setIsAILoading(true);
    setAiError(null);

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: inputs.productName,
          inputs,
          results: results.map((r) => ({
            name: r.name,
            policyDetails: r.policyDetails,
            totalCost: r.totalCost,
            totalOrderingCost: r.totalOrderingCost,
            totalHoldingCost: r.totalHoldingCost,
            stockoutDays: r.stockoutDays,
            fillRate: r.fillRate,
            orderCount: r.orderCount,
            averageInventory: r.averageInventory,
            minInventory: r.minInventory,
            maxInventory: r.maxInventory,
          })),
          bestPolicyName: evaluation.winnerName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server returned an error generating explanation.');
      }

      setAiExplanation(data.explanation);
    } catch (err: any) {
      console.warn('AI Explanation call encountered an issue:', err);
      setAiError(err.message || 'Unable to contact AI explanation service.');

      const fallbackText = `### Executive Summary
The simulation recommends **${evaluation.winnerName}** as the most cost-effective and dependable policy for **${inputs.productName}**.

### Policy Comparison Breakdown:
1. **${results[0]?.name}**:
   - Total Cost: $${results[0]?.totalCost.toFixed(2)} | Fill Rate: ${results[0]?.fillRate.toFixed(1)}% | Stockouts: ${results[0]?.stockoutDays} days
   - Behavior: Uses deterministic EOQ batching (${results[0]?.parameters.orderQuantity} units). Under stochastic daily demand, zero safety buffer leads to stockouts when demand spikes during replenishment lead time.

2. **${results[1]?.name}**:
   - Total Cost: $${results[1]?.totalCost.toFixed(2)} | Fill Rate: ${results[1]?.fillRate.toFixed(1)}% | Stockouts: ${results[1]?.stockoutDays} days
   - Behavior: Introduces ${results[1]?.parameters.safetyStock} units of safety stock. Consistently achieves target service level (${inputs.serviceLevel}%) by ordering whenever inventory position drops to ${results[1]?.parameters.reorderPoint} units.

3. **${results[2]?.name}**:
   - Total Cost: $${results[2]?.totalCost.toFixed(2)} | Fill Rate: ${results[2]?.fillRate.toFixed(1)}% | Stockouts: ${results[2]?.stockoutDays} days
   - Behavior: Reviews stock every ${results[2]?.parameters.reviewPeriod} days. Simplifies ordering routines but requires higher safety inventory to cover both the review cycle and lead time.

### Key Manager Recommendations:
- Monitor daily demand variance: if standard deviation climbs above ${Math.round(inputs.dailyStdDev * 1.4)} units, recompute safety stock.
- Negotiate supplier lead times: shaving lead time from ${inputs.leadTime} to ${Math.max(1, inputs.leadTime - 2)} days reduces required safety capital significantly.
- For multi-item consolidated shipments, evaluate Periodic Review against supplier order minimums.`;

      setAiExplanation(fallbackText);
    } finally {
      setIsAILoading(false);
    }
  };

  const currentTabItem = TABS.find((t) => t.id === activeTab);

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Top Fixed Header */}
      <Header
        onLoadPreset={handleLoadPreset}
        onOpenAIExplain={handleFetchAIExplanation}
        isLoadingAI={isAILoading}
        onReseed={handleReseed}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
        activeTabLabel={currentTabItem?.label}
      />

      {/* Main Layout: Fixed/Sticky Sidebar on Left + Active Tab Content on Right */}
      <div className="flex-1 flex flex-row overflow-hidden relative min-h-0">
        {/* Left Fixed Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Right Content Area: Displays ONLY the active tab's content, scrolls independently */}
        <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center min-h-0">
          <div className="max-w-6xl w-full space-y-6">
            {/* 1. Parameters Tab */}
            {activeTab === 'parameters' && (
              <div className="max-w-3xl mx-auto">
                <InputForm
                  inputs={inputs}
                  onInputChange={(newInputs) => {
                    setInputs(newInputs);
                    setAiExplanation(null);
                  }}
                  onRunSimulation={handleRunSimulation}
                  onLoadPreset={handleLoadPreset}
                  onReseed={handleReseed}
                  currentSeed={demandSeed}
                />
              </div>
            )}

            {/* 2. Overview Tab */}
            {activeTab === 'overview' && evaluation && (
              <div className="space-y-6">
                <PolicySummaryCard
                  evaluation={evaluation}
                  results={results}
                  inputs={inputs}
                  onOpenAIExplain={handleFetchAIExplanation}
                  isLoadingAI={isAILoading}
                />

                {/* Quick Shortcuts to other sections */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('policies')}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-indigo-500 transition-all cursor-pointer shadow-xs group"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Explore Full Metrics
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 flex items-center justify-between">
                      Side-by-Side Policy Cards
                      <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('chart')}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-indigo-500 transition-all cursor-pointer shadow-xs group"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      View Visual Curves
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 flex items-center justify-between">
                      Inventory Trajectory Chart
                      <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('parameters')}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left hover:border-indigo-500 transition-all cursor-pointer shadow-xs group"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Modify Assumptions
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 flex items-center justify-between">
                      Simulation Parameters
                      <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* 3. Policy Comparison Tab */}
            {activeTab === 'policies' && results.length > 0 && evaluation && (
              <ComparisonCards
                results={results}
                inputs={inputs}
                bestPolicyId={evaluation.winnerId}
              />
            )}

            {/* 4. Inventory Chart Tab */}
            {activeTab === 'chart' && results.length > 0 && (
              <InventoryChart
                results={results}
                simulationDays={inputs.simulationDays}
              />
            )}

            {/* 5. Cost Breakdown Tab */}
            {activeTab === 'costs' && results.length > 0 && (
              <div className="max-w-3xl mx-auto space-y-4">
                <CostBreakdownChart results={results} />
              </div>
            )}

            {/* 6. Scenarios Tab */}
            {activeTab === 'scenarios' && (
              <ScenarioComparison
                savedScenarios={savedScenarios}
                onSaveCurrentRun={handleSaveCurrentRun}
                onDeleteScenario={handleDeleteScenario}
                onLoadScenarioIntoSimulator={handleLoadScenarioIntoSimulator}
                onLoadExampleScenarios={handleLoadExampleScenarios}
                onClearAllScenarios={handleClearAllScenarios}
                currentInputs={inputs}
              />
            )}

            {/* 7. Daily Log Tab */}
            {activeTab === 'dailylog' && results.length > 0 && (
              <DailyLogTable
                results={results}
                inputs={inputs}
                dailyDemands={dailyDemands}
              />
            )}

            {/* 8. Formulas Tab */}
            {activeTab === 'formulas' && (
              <div className="max-w-3xl mx-auto">
                <FormulaReference />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* AI Explanation Modal */}
      <AIExplanationModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        explanation={aiExplanation}
        isLoading={isAILoading}
        error={aiError}
        onRegenerate={handleFetchAIExplanation}
        productName={inputs.productName}
        bestPolicyName={evaluation?.winnerName || 'Best Policy'}
      />
    </div>
  );
}
