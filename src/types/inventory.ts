export interface SimulationInputs {
  productName: string;
  annualDemand: number; // D
  dailyStdDev: number; // sigma_d
  orderingCost: number; // S (per order)
  holdingCost: number; // H (per unit per year)
  leadTime: number; // L (in days)
  serviceLevel: number; // 90, 95, 99 (in %)
  simulationDays: number; // N days (e.g. 90, 180, 250, 365)
  initialInventoryRatio?: number; // Starting stock ratio (e.g. 1.0 = starts at target/ROP)
  reviewPeriodOverride?: number; // Optional user override for Periodic Review T
}

export type PolicyType = 'eoq' | 'reorder_point' | 'periodic_review';

export interface DailyRecord {
  day: number;
  startingInventory: number;
  arrivals: number;
  availableStock: number;
  demand: number;
  fulfilledDemand: number;
  stockoutUnits: number;
  endingInventory: number;
  inventoryPosition: number;
  orderPlaced: boolean;
  orderQuantity: number;
  dailyOrderingCost: number;
  dailyHoldingCost: number;
  cumulativeTotalCost: number;
}

export interface PolicyResult {
  id: PolicyType;
  name: string;
  shortName: string;
  tagline: string;
  policyDetails: string;
  parameters: {
    orderQuantity: number;
    reorderPoint?: number;
    safetyStock?: number;
    reviewPeriod?: number; // T
    targetLevel?: number; // S
  };
  totalOrderingCost: number;
  totalHoldingCost: number;
  totalCost: number;
  stockoutDays: number;
  totalStockoutUnits: number;
  totalDemand: number;
  totalFulfilled: number;
  fillRate: number; // in %
  cycleServiceLevel: number; // in % of days with no stockout
  orderCount: number;
  averageInventory: number;
  minInventory: number;
  maxInventory: number;
  dailyRecords: DailyRecord[];
  isWinner?: boolean;
  winnerScore?: number;
  pros: string[];
  cons: string[];
}

export interface SimulationPreset {
  id: string;
  name: string;
  category: string;
  inputs: SimulationInputs;
  description: string;
}

export interface BestPolicyEvaluation {
  winnerId: PolicyType;
  winnerName: string;
  headlineReason: string;
  detailedAnalysis: string[];
  recommendation: string;
}

export interface SavedScenario {
  id: string;
  name: string;
  savedAt: string;
  inputs: SimulationInputs;
  results: {
    id: PolicyType;
    name: string;
    shortName: string;
    totalCost: number;
    totalOrderingCost: number;
    totalHoldingCost: number;
    stockoutDays: number;
    totalStockoutUnits: number;
    fillRate: number;
    orderCount: number;
    averageInventory: number;
    orderQuantity: number;
    reorderPoint?: number;
    safetyStock?: number;
    targetLevel?: number;
    reviewPeriod?: number;
    isWinner?: boolean;
  }[];
  bestPolicyName: string;
  bestPolicyId: PolicyType;
}

