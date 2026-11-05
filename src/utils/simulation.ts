import { DailyRecord, PolicyResult, SimulationInputs, SimulationPreset, BestPolicyEvaluation } from '../types/inventory';

// Z-scores for standard service levels
export function getZScore(serviceLevel: number): number {
  if (serviceLevel >= 99.5) return 2.576;
  if (serviceLevel >= 99) return 2.326;
  if (serviceLevel >= 98) return 2.054;
  if (serviceLevel >= 95) return 1.645;
  if (serviceLevel >= 90) return 1.282;
  if (serviceLevel >= 85) return 1.036;
  if (serviceLevel >= 80) return 0.842;
  // Approximation for other values
  const p = Math.min(0.999, Math.max(0.5, serviceLevel / 100));
  // Abramowitz and Stegun formula approximation
  const t = Math.sqrt(-2 * Math.log(1 - p));
  const c0 = 2.515517;
  const c1 = 0.802853;
  const c2 = 0.010328;
  const d1 = 1.432788;
  const d2 = 0.189269;
  const d3 = 0.001308;
  return t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
}

// Seeded PRNG (Mulberry32) for deterministic & reproducible runs or Math.random
export function createRNG(seed?: number) {
  if (seed === undefined || seed === null || isNaN(seed) || seed === 0) {
    return Math.random;
  }
  let s = seed >>> 0;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform for normal distribution
export function generateNormalDemand(
  mean: number,
  stdDev: number,
  rng: () => number
): number {
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  const val = mean + z0 * stdDev;
  return Math.max(0, Math.round(val));
}

// Generate daily demand vector shared across all 3 policies
export function generateDailyDemandSequence(
  simulationDays: number,
  meanDailyDemand: number,
  dailyStdDev: number,
  seed: number = Date.now()
): number[] {
  const rng = createRNG(seed);
  const sequence: number[] = [];
  for (let i = 0; i < simulationDays; i++) {
    sequence.push(generateNormalDemand(meanDailyDemand, dailyStdDev, rng));
  }
  return sequence;
}

// Industry Presets
export const SIMULATION_PRESETS: SimulationPreset[] = [
  {
    id: 'fmcg-beverage',
    name: 'FMCG: Beverage & Grocery',
    category: 'Fast Moving Consumer Goods',
    description: 'High daily volume, low holding cost, fast supplier turnaround (3 days).',
    inputs: {
      productName: 'Organic Oat Milk (1L Packs)',
      annualDemand: 36500,
      dailyStdDev: 22,
      orderingCost: 45,
      holdingCost: 2.2,
      leadTime: 3,
      serviceLevel: 95,
      simulationDays: 180,
    },
  },
  {
    id: 'electronics-chips',
    name: 'Electronics: Server Accelerators',
    category: 'High-Tech Hardware',
    description: 'High unit value, expensive holding capital, long overseas lead time (12 days).',
    inputs: {
      productName: 'Enterprise AI Compute Modules',
      annualDemand: 2920,
      dailyStdDev: 3.5,
      orderingCost: 300,
      holdingCost: 160.0,
      leadTime: 12,
      serviceLevel: 99,
      simulationDays: 180,
    },
  },
  {
    id: 'industrial-parts',
    name: 'Manufacturing: Hydraulic Valves',
    category: 'Industrial Spares',
    description: 'Moderate volume, moderate lead time (7 days), steady replacement demand.',
    inputs: {
      productName: 'Heavy Machinery Valve Assembly',
      annualDemand: 7300,
      dailyStdDev: 7,
      orderingCost: 80,
      holdingCost: 15.0,
      leadTime: 7,
      serviceLevel: 95,
      simulationDays: 200,
    },
  },
  {
    id: 'pharma-supplies',
    name: 'Healthcare: Surgical PPE Kits',
    category: 'Critical Medical Supplies',
    description: 'Zero tolerance for stockouts (99% target), strict regulation, critical availability.',
    inputs: {
      productName: 'Sterile Surgical Tray Set',
      annualDemand: 10950,
      dailyStdDev: 12,
      orderingCost: 95,
      holdingCost: 28.0,
      leadTime: 5,
      serviceLevel: 99,
      simulationDays: 180,
    },
  },
  {
    id: 'fashion-apparel',
    name: 'Retail: Premium Outerwear',
    category: 'Seasonal Apparel',
    description: 'High demand volatility, seasonal reorders, holding cost penalty.',
    inputs: {
      productName: 'Waterproof Alpine Jackets',
      annualDemand: 14600,
      dailyStdDev: 24,
      orderingCost: 65,
      holdingCost: 9.0,
      leadTime: 8,
      serviceLevel: 90,
      simulationDays: 180,
    },
  },
];

// Helper to simulate a specific policy given inputs and daily demand sequence
export function runSimulationForPolicy(
  policyType: 'eoq' | 'reorder_point' | 'periodic_review',
  inputs: SimulationInputs,
  dailyDemands: number[]
): PolicyResult {
  const {
    annualDemand,
    dailyStdDev,
    orderingCost,
    holdingCost,
    leadTime,
    serviceLevel,
    simulationDays,
  } = inputs;

  const daysInYear = 365;
  const meanDailyDemand = annualDemand / daysInYear;
  const zScore = getZScore(serviceLevel);

  // 1. Economic Order Quantity (EOQ): sqrt(2 * D * S / H)
  const theoreticalEOQ = Math.max(1, Math.round(Math.sqrt((2 * annualDemand * orderingCost) / holdingCost)));

  // 2. Safety Stock & Reorder Point calculations
  const leadTimeStdDev = dailyStdDev * Math.sqrt(leadTime);
  const safetyStock = Math.max(0, Math.round(zScore * leadTimeStdDev));
  const expectedLeadTimeDemand = Math.round(meanDailyDemand * leadTime);

  // Continuous Review Reorder Point (s, Q):
  // EOQ policy uses deterministic ROP = expected lead time demand (0 safety stock)
  const eoqROP = expectedLeadTimeDemand;
  // Reorder Point policy uses s = expected lead time demand + Safety Stock
  const ssROP = expectedLeadTimeDemand + safetyStock;

  // 3. Periodic Review parameters (T, S)
  // Optimal review cycle T derived from EOQ: T = (Q* / D) * 365 days
  const defaultReviewPeriod = Math.max(1, Math.round((theoreticalEOQ / annualDemand) * daysInYear));
  const reviewPeriodT = inputs.reviewPeriodOverride && inputs.reviewPeriodOverride > 0
    ? inputs.reviewPeriodOverride
    : defaultReviewPeriod;
  
  const protectionPeriod = reviewPeriodT + leadTime;
  const protectionPeriodStdDev = dailyStdDev * Math.sqrt(protectionPeriod);
  const periodicSafetyStock = Math.round(zScore * protectionPeriodStdDev);
  const targetStockLevelS = Math.round(meanDailyDemand * protectionPeriod + periodicSafetyStock);

  // Policy parameter setup
  let policyName = '';
  let shortName = '';
  let tagline = '';
  let policyDetails = '';
  let parameters: PolicyResult['parameters'] = { orderQuantity: theoreticalEOQ };
  let pros: string[] = [];
  let cons: string[] = [];

  // Initial inventory setup
  // Start with a healthy working stock to avoid artificial day 1 stockouts
  let initialStock = 0;

  if (policyType === 'eoq') {
    policyName = 'Economic Order Quantity (EOQ)';
    shortName = 'EOQ (Fixed Q)';
    tagline = 'Deterministic benchmark with zero safety stock buffer';
    policyDetails = `Fixed Order Q = ${theoreticalEOQ} units, Reorder Point = ${eoqROP} units (no safety stock)`;
    parameters = {
      orderQuantity: theoreticalEOQ,
      reorderPoint: eoqROP,
      safetyStock: 0,
    };
    initialStock = theoreticalEOQ;
    pros = [
      'Minimizes classical holding & ordering costs under steady demand',
      'Simple fixed batch size easy for suppliers to produce',
      'No excess buffer stock tie-up under perfectly uniform conditions',
    ];
    cons = [
      'Highly vulnerable to demand surges during lead time',
      'Frequent stockouts in real-world stochastic environments',
      'Fails to hit high service level targets (95-99%) with volatile demand',
    ];
  } else if (policyType === 'reorder_point') {
    policyName = 'Reorder Point (s, Q) with Safety Stock';
    shortName = 'ROP (s, Q)';
    tagline = 'Continuous review with statistical safety stock';
    policyDetails = `Order Q = ${theoreticalEOQ} units, ROP s = ${ssROP} units (Safety Stock = ${safetyStock} units)`;
    parameters = {
      orderQuantity: theoreticalEOQ,
      reorderPoint: ssROP,
      safetyStock: safetyStock,
    };
    initialStock = ssROP + Math.round(theoreticalEOQ / 2);
    pros = [
      'Balances economic batch size with statistical demand buffer',
      'Consistently achieves or exceeds target service level',
      'Orders placed exactly when stock crosses reorder threshold',
    ];
    cons = [
      'Requires continuous inventory tracking / ERP sensor systems',
      'Carries persistent safety stock holding cost',
      'Ordering dates are irregular and unpredictable for shipping schedules',
    ];
  } else {
    policyName = 'Periodic Review (T, Target S)';
    shortName = 'Periodic (T, S)';
    tagline = 'Fixed review interval with variable order-up-to target';
    policyDetails = `Review every T = ${reviewPeriodT} days up to Target S = ${targetStockLevelS} units`;
    parameters = {
      orderQuantity: theoreticalEOQ,
      reviewPeriod: reviewPeriodT,
      targetLevel: targetStockLevelS,
      safetyStock: periodicSafetyStock,
    };
    initialStock = targetStockLevelS;
    pros = [
      'Predictable fixed order schedule (every ' + reviewPeriodT + ' days)',
      'Easy to coordinate multi-item shipments from the same supplier',
      'Eliminates the need for real-time continuous warehouse tracking',
    ];
    cons = [
      'Requires larger safety stock to cover longer risk window (T + L days)',
      'Higher average inventory and holding cost',
      'Order quantities vary from cycle to cycle depending on demand realized',
    ];
  }

  // Simulation state variables
  let currentOnHand = initialStock;
  // Track orders in transit: { arrivalDay: number, quantity: number }
  const inTransitOrders: { arrivalDay: number; quantity: number }[] = [];

  let totalOrderingCost = 0;
  let totalHoldingCost = 0;
  let stockoutDays = 0;
  let totalStockoutUnits = 0;
  let totalDemand = 0;
  let totalFulfilled = 0;
  let orderCount = 0;

  let minInventory = currentOnHand;
  let maxInventory = currentOnHand;
  let sumInventory = 0;

  const dailyRecords: DailyRecord[] = [];
  const dailyHoldingRate = holdingCost / daysInYear;

  for (let day = 1; day <= simulationDays; day++) {
    const startOnHand = currentOnHand;

    // 1. Process order arrivals for today
    let todayArrivals = 0;
    for (let i = inTransitOrders.length - 1; i >= 0; i--) {
      if (inTransitOrders[i].arrivalDay === day) {
        todayArrivals += inTransitOrders[i].quantity;
        inTransitOrders.splice(i, 1);
      }
    }
    const availableStock = startOnHand + todayArrivals;

    // 2. Realize demand
    const demand = dailyDemands[day - 1] ?? Math.round(meanDailyDemand);
    totalDemand += demand;

    const fulfilledDemand = Math.min(availableStock, demand);
    const stockoutUnits = Math.max(0, demand - availableStock);
    const endingInventory = Math.max(0, availableStock - demand);

    totalFulfilled += fulfilledDemand;
    if (stockoutUnits > 0) {
      stockoutDays++;
      totalStockoutUnits += stockoutUnits;
    }

    // 3. Update inventory tracking
    currentOnHand = endingInventory;
    minInventory = Math.min(minInventory, endingInventory);
    maxInventory = Math.max(maxInventory, endingInventory);
    sumInventory += endingInventory;

    // 4. Calculate Inventory Position (On Hand + In Transit)
    const pendingInTransitQuantity = inTransitOrders.reduce((sum, ord) => sum + ord.quantity, 0);
    const inventoryPosition = currentOnHand + pendingInTransitQuantity;

    // 5. Evaluate policy ordering trigger
    let orderPlaced = false;
    let orderQuantity = 0;

    if (policyType === 'eoq') {
      // Reorder if inventory position <= eoqROP
      if (inventoryPosition <= eoqROP) {
        orderPlaced = true;
        orderQuantity = theoreticalEOQ;
      }
    } else if (policyType === 'reorder_point') {
      // Reorder if inventory position <= ssROP
      if (inventoryPosition <= ssROP) {
        orderPlaced = true;
        orderQuantity = theoreticalEOQ;
      }
    } else {
      // Periodic Review: order every T days
      const isReviewDay = ((day - 1) % reviewPeriodT === 0);
      if (isReviewDay) {
        const requiredToTarget = targetStockLevelS - inventoryPosition;
        if (requiredToTarget > 0) {
          orderPlaced = true;
          orderQuantity = Math.max(1, requiredToTarget);
        }
      }
    }

    let dailyOrderingCost = 0;
    if (orderPlaced && orderQuantity > 0) {
      // An order placed on day t with lead time L is available at the start of day t + L
      inTransitOrders.push({
        arrivalDay: day + leadTime,
        quantity: orderQuantity,
      });
      dailyOrderingCost = orderingCost;
      totalOrderingCost += orderingCost;
      orderCount++;
    }

    const dailyHoldingCost = endingInventory * dailyHoldingRate;
    totalHoldingCost += dailyHoldingCost;

    const cumulativeTotalCost = totalOrderingCost + totalHoldingCost;

    dailyRecords.push({
      day,
      startingInventory: startOnHand,
      arrivals: todayArrivals,
      availableStock,
      demand,
      fulfilledDemand,
      stockoutUnits,
      endingInventory,
      inventoryPosition,
      orderPlaced,
      orderQuantity,
      dailyOrderingCost,
      dailyHoldingCost,
      cumulativeTotalCost,
    });
  }

  const fillRate = totalDemand > 0 ? (totalFulfilled / totalDemand) * 100 : 100;
  const cycleServiceLevel = simulationDays > 0 ? ((simulationDays - stockoutDays) / simulationDays) * 100 : 100;
  const totalCost = totalOrderingCost + totalHoldingCost;
  const averageInventory = simulationDays > 0 ? sumInventory / simulationDays : 0;

  return {
    id: policyType,
    name: policyName,
    shortName,
    tagline,
    policyDetails,
    parameters,
    totalOrderingCost,
    totalHoldingCost,
    totalCost,
    stockoutDays,
    totalStockoutUnits,
    totalDemand,
    totalFulfilled,
    fillRate,
    cycleServiceLevel,
    orderCount,
    averageInventory,
    minInventory,
    maxInventory,
    dailyRecords,
    pros,
    cons,
  };
}

// Evaluate which policy is best and why
export function evaluateBestPolicy(
  results: PolicyResult[],
  inputs: SimulationInputs
): BestPolicyEvaluation {
  const targetSL = inputs.serviceLevel;

  // Score each policy:
  // Balances cost efficiency with stockout penalties
  // A policy with fill rate far below target gets penalized heavily
  const scored = results.map((res) => {
    let penalty = 0;
    // If fill rate is below target, penalize based on lost sales / stockout severity
    if (res.fillRate < targetSL) {
      const deficit = targetSL - res.fillRate;
      // High penalty per percentage point deficit to reflect customer dissatisfaction / lost revenue
      penalty += deficit * (inputs.orderingCost * 15 + res.totalStockoutUnits * (inputs.holdingCost * 0.5));
    }
    // Moderate penalty for stockout days
    penalty += res.stockoutDays * (inputs.orderingCost * 2);

    const compositeScore = res.totalCost + penalty;
    return {
      result: res,
      score: compositeScore,
    };
  });

  scored.sort((a, b) => a.score - b.score);
  const winner = scored[0].result;
  const runnerUp = scored[1].result;
  const eoq = results.find((r) => r.id === 'eoq')!;
  const rop = results.find((r) => r.id === 'reorder_point')!;
  const periodic = results.find((r) => r.id === 'periodic_review')!;

  let headlineReason = '';
  const detailedAnalysis: string[] = [];
  let recommendation = '';

  if (winner.id === 'reorder_point') {
    headlineReason = `Reorder Point (s, Q) delivers the superior balance, achieving a ${winner.fillRate.toFixed(1)}% fill rate while keeping total inventory cost to $${winner.totalCost.toFixed(2)}.`;
    detailedAnalysis.push(
      `Safety Stock Cushion: Incorporating ${rop.parameters.safetyStock} units of safety stock effectively shielded operations against stochastic daily demand during the ${inputs.leadTime}-day supplier lead time.`
    );
    detailedAnalysis.push(
      `Cost Comparison: While pure EOQ had a lower raw carrying cost, it suffered ${eoq.stockoutDays} stockout days (${eoq.totalStockoutUnits} unfulfilled units) due to zero lead-time safety buffer, failing the ${targetSL}% service target.`
    );
    detailedAnalysis.push(
      `Efficiency vs Periodic: Periodic Review incurred $${(periodic.totalCost - rop.totalCost).toFixed(2)} higher total cost because it must buffer across the entire protection period (T + L = ${(periodic.parameters.reviewPeriod || 0) + inputs.leadTime} days) instead of just lead time.`
    );
    recommendation = `Adopt Continuous Reorder Point (s=${rop.parameters.reorderPoint}, Q=${rop.parameters.orderQuantity}). Connect automated inventory sensors or ERP reorder triggers to capture real-time inventory positions.`;
  } else if (winner.id === 'periodic_review') {
    headlineReason = `Periodic Review (T, S) wins by delivering dependable order cadences every ${periodic.parameters.reviewPeriod} days with a robust ${winner.fillRate.toFixed(1)}% fill rate.`;
    detailedAnalysis.push(
      `Cadence & Supplier Synergy: By batching reorders on a fixed ${periodic.parameters.reviewPeriod}-day cycle, this policy dramatically simplifies warehouse logistics and freight scheduling.`
    );
    detailedAnalysis.push(
      `High Availability: Target inventory level of ${periodic.parameters.targetLevel} units successfully absorbed demand shocks without continuous monitoring overhead.`
    );
    detailedAnalysis.push(
      `Service vs EOQ: Outperformed basic EOQ, which failed to protect against lead time variability and logged ${eoq.stockoutDays} stockout days.`
    );
    recommendation = `Implement Periodic Review on a strict ${periodic.parameters.reviewPeriod}-day schedule up to target level ${periodic.parameters.targetLevel}. Consolidate this product's orders with other SKUs from the same vendor to reduce freight fees.`;
  } else {
    headlineReason = `EOQ achieved the lowest total operating cost ($${winner.totalCost.toFixed(2)}) with acceptable fulfillment given current low demand volatility.`;
    detailedAnalysis.push(
      `Low Volatility Advantage: Daily standard deviation of ${inputs.dailyStdDev} was sufficiently low that expected lead-time demand covered daily fluctuations with minimal stockout disruption.`
    );
    detailedAnalysis.push(
      `Zero Safety Stock Tie-up: Holding costs were minimized by avoiding capital lockup in dedicated buffer stocks.`
    );
    detailedAnalysis.push(
      `Risk Note: If demand volatility or supplier lead time increases even slightly, EOQ will experience rapid stockout spikes.`
    );
    recommendation = `Basic EOQ is acceptable only while demand remains exceptionally predictable. Prepare to switch to (s, Q) safety stock if demand variance exceeds ${Math.round(inputs.dailyStdDev * 1.5)} units/day.`;
  }

  return {
    winnerId: winner.id,
    winnerName: winner.name,
    headlineReason,
    detailedAnalysis,
    recommendation,
  };
}
