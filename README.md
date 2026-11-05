# Inventory Policy Simulator

An interactive supply chain operations research simulator comparing inventory control policies under stochastic daily customer demand.

[![Live Demo](https://img.shields.io/badge/Demo-Live%20Preview-blue)](https://ais-pre-23gjoq6o3rxbtmtzgtgvdn-502422407315.us-east5.run.app)

> **Live Demo**: [https://ais-pre-23gjoq6o3rxbtmtzgtgvdn-502422407315.us-east5.run.app](https://ais-pre-23gjoq6o3rxbtmtzgtgvdn-502422407315.us-east5.run.app)

---

## 🎯 Project Purpose

In inventory management, deciding **when** and **how much** to reorder is a fundamental trade-off between ordering costs, holding costs, and stockout risk. 

The **Inventory Policy Simulator** simulates daily operations across a user-defined horizon (e.g., 365 days) subject to stochastic demand drawn from a Gaussian distribution $\mathcal{N}(\mu, \sigma_d^2)$. It subjects three classic replenishment policies to the **exact same daily demand sequence** and lead-time delays to deliver an apples-to-apples performance comparison of total cost, stockout days, and customer fill rate.

---

## 📦 The 3 Inventory Policies

1. **Economic Order Quantity (EOQ)**
   - *Type*: Continuous review, deterministic baseline.
   - *Mechanism*: Orders fixed batch size $Q^* = \sqrt{\frac{2 D S}{H}}$ whenever inventory position drops to $ROP = d \times L$.
   - *Characteristics*: Assumes zero safety stock ($SS = 0$). Highly vulnerable to stockouts when demand variability ($\sigma_d$) is elevated.

2. **Reorder Point $(s, Q)$ with Safety Stock**
   - *Type*: Continuous review, stochastic protection.
   - *Mechanism*: Monitors inventory position continuously. Places an order of size $Q$ as soon as inventory position falls to or below $ROP = d \times L + z \times \sigma_L$.
   - *Characteristics*: Dynamically buffers against demand volatility during replenishment lead times based on the target service level (90%, 95%, or 99%).

3. **Periodic Review $(T, S)$ Order-Up-To**
   - *Type*: Periodic review, review interval $T$.
   - *Mechanism*: Inspects inventory every $T = \max(1, \text{round}(Q_{EOQ}/d))$ days and places an order to replenish inventory position up to target level $S = d \times (T + L) + z \times \sigma_{T+L}$.
   - *Characteristics*: Simplifies ordering logistics by adhering to a fixed review schedule, but requires a higher safety buffer to cover risk over both interval $T$ and lead time $L$.

---

## ✨ Features

- **Fair Stochastic Simulation**: Box-Muller Gaussian daily demand generator shared across all 3 policies with reproducible seeds.
- **Realistic Lead-Time Dynamics**: Orders placed on day $t$ with lead time $L$ arrive at the start of day $t + L$, testing lead-time exposure.
- **Sidebar Tab Layout**: Clean 8-tab navigation with mobile hamburger drawer:
  1. **Parameters**: Input annual demand, daily $\sigma_d$, order cost, holding cost, lead time, and service level, plus sample presets.
  2. **Overview**: Executive recommendation card and 4 high-level KPI tiles.
  3. **Policy Comparison**: Side-by-side cards detailing parameters, cost splits, stockout counts, and fill rates.
  4. **Inventory Chart**: Interactive SVG trajectory graph with safety stock and ROP threshold lines, stockout markers, and zoom views.
  5. **Cost Breakdown**: Proportional cost bars comparing ordering vs holding spend.
  6. **Scenarios**: Save up to 3 runs to compare policies across Low Demand, High Demand, or Volatile environments with local storage persistence.
  7. **Daily Log**: Day-by-day table of realized demands, stock levels, stockout flags, search filter, and CSV download.
  8. **Formulas**: Quick mathematical reference for EOQ, safety stock, ROP, and Order-Up-To levels.
- **AI Explain (Gemini)**: Instant plain-language breakdown of simulation trade-offs powered by Gemini via server-side proxy.

---

## 🚀 How to Run Locally

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### 2. Clone and Install Dependencies
```bash
git clone <repository-url>
cd inventory-policy-simulator
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Open `.env` and configure your Gemini API Key:
```env
GEMINI_API_KEY="your_gemini_api_key_here"
PORT=3000
```
> *Note: If `GEMINI_API_KEY` is omitted, the simulator runs normally and the "AI Explain" feature will return a friendly fallback configuration message.*

### 4. Start the Development Server
```bash
npm run dev
```

The app will start on [http://localhost:3000](http://localhost:3000).

---

## 🏗️ Production Build
```bash
npm run build
npm start
```
