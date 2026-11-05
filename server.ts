import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '2mb' }));

// Healthcheck endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Explanation endpoint using Gemini API
app.post('/api/explain', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check the Secrets panel.',
      });
    }

    const {
      productName,
      inputs,
      results,
      bestPolicyName,
    } = req.body;

    if (!inputs || !results) {
      return res.status(400).json({ error: 'Missing simulation inputs or results.' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are a world-class Supply Chain Operations and Inventory Optimization Expert.
Explain the results of an inventory policy simulation to an inventory manager or business executive in crisp, plain, engaging language.

### Simulation Parameters:
- Product: ${productName || 'General Product'}
- Annual Demand: ${inputs.annualDemand.toLocaleString()} units
- Daily Demand Std Dev: ${inputs.dailyStdDev} units/day
- Ordering Cost: $${inputs.orderingCost} per order
- Annual Holding Cost: $${inputs.holdingCost} per unit/year
- Lead Time: ${inputs.leadTime} days
- Service Level Target: ${inputs.serviceLevel}%
- Simulation Horizon: ${inputs.simulationDays} days

### Policy Comparison Results:
${results.map((r: any) => `
1. **${r.name}**:
   - Order Quantity / Policy Spec: ${r.policyDetails}
   - Total Cost: $${r.totalCost.toFixed(2)} (Ordering: $${r.totalOrderingCost.toFixed(2)}, Holding: $${r.totalHoldingCost.toFixed(2)})
   - Stockout Days: ${r.stockoutDays} days out of ${inputs.simulationDays} (${((r.stockoutDays / inputs.simulationDays) * 100).toFixed(1)}% of days)
   - Fill Rate: ${r.fillRate.toFixed(2)}% (Target: ${inputs.serviceLevel}%)
   - Orders Placed: ${r.orderCount}
   - Average Ending Inventory: ${r.averageInventory.toFixed(1)} units
   - Min / Max Stock: ${r.minInventory} / ${r.maxInventory} units
`).join('')}

Identified Winner based on cost & service balance: **${bestPolicyName}**

### Your Instructions:
Provide a structured, executive-ready explanation with:
1. **Executive Verdict**: In 2-3 sentences, state which policy performed best and the primary reason why (e.g., cost-efficiency vs. resilience to lead-time demand spikes).
2. **Key Trade-offs Explained Simply**: Contrast the three policies (EOQ vs. Reorder Point with Safety Stock vs. Periodic Review). Explain in intuitive terms why EOQ without safety stock behaves the way it does under stochastic demand, and what price is paid for periodic convenience.
3. **Operational Risks & Nuances**: Highlight stockout risks, safety stock buffers, and holding capital traps.
4. **Actionable Recommendations**: 3 concise bullet points with practical actions the manager can take (e.g., vendor lead-time negotiation, review cadence adjustment, or batch size tweaking).

Keep the tone professional, insightful, and accessible without dense academic jargon. Use markdown formatting with bolding and bullet points.`;

    // Robust retry logic for transient 503/429 spikes
    let responseText = '';
    let lastError: any = null;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Wait 1.2s before retry
          await new Promise((resolve) => setTimeout(resolve, 1200 * attempt));
        }
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'You are an elite inventory optimization and supply chain analytics consultant. Provide clear, direct, and actionable insights based strictly on simulated empirical data.',
          },
        });
        responseText = response.text || '';
        if (responseText) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini API attempt ${attempt + 1} failed:`, err?.message || err);
      }
    }

    if (!responseText && lastError) {
      let cleanMessage = lastError?.message || 'Failed to generate AI explanation.';
      try {
        // Parse if message is JSON string
        const parsed = JSON.parse(cleanMessage);
        if (parsed?.error?.message) {
          cleanMessage = parsed.error.message;
        }
      } catch (_) {
        // Not JSON string, keep cleanMessage
      }
      return res.status(500).json({ error: cleanMessage });
    }

    return res.json({ explanation: responseText || 'Unable to generate analysis at this time.' });
  } catch (error: any) {
    console.error('Error in /api/explain:', error);
    let msg = error?.message || 'Server error generating explanation.';
    try {
      const parsed = JSON.parse(msg);
      if (parsed?.error?.message) msg = parsed.error.message;
    } catch (_) {}
    return res.status(500).json({ error: msg });
  }
});

// Vite middleware in dev or static files in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: {
      middlewareMode: true,
      host: '0.0.0.0',
      port: PORT,
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Inventory Policy Simulator running at http://0.0.0.0:${PORT}`);
});
