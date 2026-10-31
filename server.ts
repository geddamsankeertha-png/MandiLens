import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Security: Request size limit & allowlisted methods
app.use(express.json({ limit: '100kb' }));

import {
  allowlistedMethods,
  rateLimiter,
  requireAuth,
  generateToken,
  consumeRefreshToken,
  verifyToken,
} from './server/securityMiddleware.ts';
import { auditLogger } from './server/auditLog.ts';
import { secretManager } from './server/secretManager.ts';

app.use(allowlistedMethods);
app.use(rateLimiter(false));

import {
  COMMODITIES,
  MARKETS,
  generateRealMLPrediction,
  generateForecastSequence,
  generatePriceHistory,
  generateFarmerRecommendation,
  generateTraderRecommendation,
  generateSystemAlerts,
  getModelPerformanceMetrics,
} from './server/mlEngine.ts';
import { pipelineEngine } from './server/dataPipeline.ts';
import { monitoringEngine } from './server/modelMonitoring.ts';

// Initialize Gemini API client if key is present
const geminiApiKey = secretManager.getSecret('GEMINI_API_KEY');
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  try {
    ai = new GoogleGenAI({ apiKey: geminiApiKey });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI:', err);
  }
}

/**
 * Endpoint 1: POST /api/auth/login
 * Disabled until trusted server-side identity verification is configured.
 */
app.post('/api/auth/login', rateLimiter(true), (_req: Request, res: Response) => {
  // No server-side credential verifier is configured. Never mint tokens from client supplied roles.
  return res.status(501).json({ success: false, error: 'Credential login is not configured. Connect a trusted identity provider.' });
});

/**
 * Endpoint: POST /api/auth/refresh
 * Refresh token rotation endpoint
 */
app.post('/api/auth/refresh', rateLimiter(true), (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(400).json({ success: false, error: 'Missing refresh token' });
  }

  const payload = verifyToken(refresh_token);
  if (!payload || payload.type !== 'refresh' || !consumeRefreshToken(refresh_token, payload)) {
    auditLogger.log({
      ipAddress: req.ip || 'unknown',
      method: req.method,
      path: req.path,
      action: 'AUTH_FAILURE',
      details: 'Invalid or expired refresh token',
    });
    return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
  }

  const user = {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  const newAccessToken = generateToken(user, 'access');
  const newRefreshToken = generateToken(user, 'refresh'); // Rotation

  return res.json({
    success: true,
    token: newAccessToken,
    refresh_token: newRefreshToken,
    expires_in: 1800,
    user,
  });
});

/**
 * Endpoint: GET /api/admin/audit-logs
 * Admin only audit logs
 */
app.get('/api/admin/audit-logs', requireAuth(['admin']), (req: Request, res: Response) => {
  auditLogger.log({
    userId: (req as any).user?.userId,
    userEmail: (req as any).user?.email,
    role: (req as any).user?.role,
    ipAddress: req.ip || 'unknown',
    method: req.method,
    path: req.path,
    action: 'ADMIN_ACTION',
    details: 'Admin retrieved audit security logs',
  });

  return res.json({
    success: true,
    count: auditLogger.getLogs(100).length,
    logs: auditLogger.getLogs(100),
  });
});

/**
 * Endpoint 2: GET /api/commodities
 * Returns master list of monitored agricultural commodities
 */
app.get('/api/commodities', (_req: Request, res: Response) => {
  const list = Object.values(COMMODITIES);
  return res.json({
    success: true,
    count: list.length,
    commodities: list,
  });
});

/**
 * Endpoint 3: GET /api/markets
 * Returns APMC principal markets and regulated mandis
 */
app.get('/api/markets', (_req: Request, res: Response) => {
  const list = Object.values(MARKETS);
  return res.json({
    success: true,
    count: list.length,
    markets: list,
  });
});

/**
 * Endpoint 4: GET /api/prices/history
 * Query params: commodity, market, days (default 30)
 */
app.get('/api/prices/history', (req: Request, res: Response) => {
  const commodity = (req.query.commodity as string) || 'Tomato';
  const market = (req.query.market as string) || 'Guntur';
  const days = parseInt((req.query.days as string) || '30', 10);

  const history = generatePriceHistory(commodity, market, days);

  return res.json({
    success: true,
    commodity,
    market,
    days,
    history,
  });
});

/**
 * Endpoint 5: GET /api/predict/next-day
 * Core Next-Day ML Prediction matching strict benchmark schema
 */
app.get('/api/predict/next-day', (req: Request, res: Response) => {
  const commodity = (req.query.commodity as string) || 'Tomato';
  const market = (req.query.market as string) || 'Guntur';
  const modelName = ((req.query.model as string) || 'XGBoost') as any;

  const prediction = generateRealMLPrediction(commodity, market, modelName);
  return res.json(prediction);
});

/**
 * Endpoint 6: GET /api/predict/7-day
 * 7-Day ML Forecast with daily trend array + strict benchmark schema
 */
app.get('/api/predict/7-day', (req: Request, res: Response) => {
  const commodity = (req.query.commodity as string) || 'Tomato';
  const market = (req.query.market as string) || 'Guntur';
  const modelName = ((req.query.model as string) || 'XGBoost') as any;

  const basePrediction = generateRealMLPrediction(commodity, market, modelName);
  const dailyForecasts = generateForecastSequence(basePrediction, 7);

  return res.json({
    ...basePrediction,
    forecast_horizon_days: 7,
    daily_forecasts: dailyForecasts,
  });
});

/**
 * Endpoint 7: GET /api/predict/30-day
 * 30-Day Long-Horizon Forecast with daily trend array + strict benchmark schema
 */
app.get('/api/predict/30-day', (req: Request, res: Response) => {
  const commodity = (req.query.commodity as string) || 'Tomato';
  const market = (req.query.market as string) || 'Guntur';
  const modelName = ((req.query.model as string) || 'XGBoost') as any;

  const basePrediction = generateRealMLPrediction(commodity, market, modelName);
  const dailyForecasts = generateForecastSequence(basePrediction, 30);
  const sumPrice = dailyForecasts.reduce((acc, cur) => acc + cur.predicted_price, 0);
  const predicted30DayAvg = Math.round((sumPrice / dailyForecasts.length) * 10) / 10;

  return res.json({
    ...basePrediction,
    forecast_horizon_days: 30,
    predicted_30day_avg: predicted30DayAvg,
    daily_forecasts: dailyForecasts,
  });
});

/**
 * Endpoint 8: GET /api/recommendation/farmer
 * Farmer Sell/Hold decision advisory + Best Nearby Mandi
 */
app.get('/api/recommendation/farmer', (req: Request, res: Response) => {
  const commodity = (req.query.commodity as string) || 'Tomato';
  const market = (req.query.market as string) || 'Guntur';
  const district = (req.query.district as string) || 'Guntur';

  const recommendation = generateFarmerRecommendation(commodity, market, district);
  return res.json(recommendation);
});

/**
 * Endpoint 9: GET /api/recommendation/trader
 * Trader Buy/Sell/Hold signals, Confidence level & Arbitrage spreads
 */
app.get('/api/recommendation/trader', (req: Request, res: Response) => {
  const commodity = (req.query.commodity as string) || 'Tomato';
  const market = (req.query.market as string) || 'Guntur';
  const targetMarket = req.query.target_market as string;

  const recommendation = generateTraderRecommendation(commodity, market, targetMarket);
  return res.json(recommendation);
});

/**
 * Endpoint 10: GET /api/alerts
 * Real-time personalized risk alerts across roles
 */
app.get('/api/alerts', (req: Request, res: Response) => {
  const role = req.query.role as string;
  const commodity = req.query.commodity as string;
  const market = req.query.market as string;

  const alerts = generateSystemAlerts(role, commodity, market);
  return res.json({
    success: true,
    generated_at: new Date().toISOString(),
    count: alerts.length,
    alerts,
  });
});

/**
 * Endpoint 11: GET /api/model-performance
 * Model evaluation metrics (MAE, RMSE, MAPE, RÂ², Directional Accuracy, Backtesting)
 */
app.get('/api/model-performance', (req: Request, res: Response) => {
  const commodity = (req.query.commodity as string) || 'Tomato';
  const market = (req.query.market as string) || 'Guntur';

  const metrics = getModelPerformanceMetrics(commodity, market);
  return res.json(metrics);
});


/**
 * Endpoint: POST /api/commodities/live
 * Fetches real-time live APMC mandi spot prices and arrival rates
 */
app.post('/api/commodities/live', async (req: Request, res: Response) => {
  const { state = 'Maharashtra', market = 'Satara', group = 'All' } = req.body;

  // If Gemini API is available, query real-time live commodity prices with grounding
  if (ai) {
    try {
      const prompt = `You are the National Agricultural Market (e-NAM / Agmarknet) real-time data engine for India.
Provide current live spot mandi prices and market arrivals for the following location:
State: "${state}"
Market: "${market}"
Focus Category / Group: "${group}"

Return a valid JSON array of commodity records covering major agricultural commodities in this market (e.g. Wheat, Rice/Paddy, Onion, Potato, Tomato, Cotton, Gram/Chana, Soybean, Mustard, Turmeric, Chilli, Maize, Groundnut).

For each item, strictly include:
- "commodity": string (e.g., "Onion (Nashik Red)", "Wheat (Sharbati)")
- "group": string (one of: Cereals, Vegetables, Oil Seeds, Pulses, Spices, Fruits, Fibre Crops, Dry Fruits, Other)
- "modalPriceQuintal": number (spot price per quintal in INR, e.g. 1850)
- "minPriceQuintal": number
- "maxPriceQuintal": number
- "arrivalQuantityTonne": number (today's arrival in metric tonnes)
- "momChangePercent": number (month-over-month percentage change, e.g. 2.4 or -1.8)
- "trend": "up" | "down" | "flat"
- "mandiStatus": "Active Trading" | "Peak Arrival" | "Steady"

Do not wrap in markdown or backticks, only valid JSON array.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'You are an official Indian Agricultural Mandi Data API. You provide strictly accurate, real-world APMC mandi price and arrival figures formatted as pure JSON.',
        },
      });

      const responseText = (response.text ?? '[]').trim();
      const liveData = JSON.parse(responseText);

      return res.json({
        success: true,
        is_live: false,
        source: 'AI-generated estimate (unverified; not an official market feed)',
        disclaimer: 'Values are not verified AGMARKNET observations and should not be used as current market quotes.',
        timestamp: new Date().toISOString(),
        state,
        market,
        data: liveData,
      });
    } catch (apiError) {
      console.error('Gemini API live fetch error, falling back to calibrated rates:', apiError);
    }
  }

  // Graceful calibrated fallback if API key is pending or network is restricted
  const sampleCommodities = [
    { commodity: 'Wheat (Mill Quality)', group: 'Cereals', modalPriceQuintal: 2420, minPriceQuintal: 2280, maxPriceQuintal: 2550, arrivalQuantityTonne: 340, momChangePercent: 1.8, trend: 'up', mandiStatus: 'Peak Arrival' },
    { commodity: 'Rice (Paddy Common)', group: 'Cereals', modalPriceQuintal: 2250, minPriceQuintal: 2100, maxPriceQuintal: 2380, arrivalQuantityTonne: 420, momChangePercent: -0.6, trend: 'down', mandiStatus: 'Steady' },
    { commodity: 'Onion (Red)', group: 'Vegetables', modalPriceQuintal: 1950, minPriceQuintal: 1600, maxPriceQuintal: 2300, arrivalQuantityTonne: 580, momChangePercent: 4.2, trend: 'up', mandiStatus: 'Active Trading' },
    { commodity: 'Potato (Jyoti)', group: 'Vegetables', modalPriceQuintal: 1450, minPriceQuintal: 1250, maxPriceQuintal: 1650, arrivalQuantityTonne: 310, momChangePercent: -2.1, trend: 'down', mandiStatus: 'Steady' },
    { commodity: 'Tomato (Hybrid)', group: 'Vegetables', modalPriceQuintal: 1800, minPriceQuintal: 1400, maxPriceQuintal: 2200, arrivalQuantityTonne: 190, momChangePercent: 6.5, trend: 'up', mandiStatus: 'Active Trading' },
    { commodity: 'Soybean (Yellow)', group: 'Oil Seeds', modalPriceQuintal: 4650, minPriceQuintal: 4400, maxPriceQuintal: 4850, arrivalQuantityTonne: 280, momChangePercent: 2.3, trend: 'up', mandiStatus: 'Steady' },
    { commodity: 'Mustard (Seed)', group: 'Oil Seeds', modalPriceQuintal: 5400, minPriceQuintal: 5150, maxPriceQuintal: 5650, arrivalQuantityTonne: 210, momChangePercent: 3.1, trend: 'up', mandiStatus: 'Peak Arrival' },
    { commodity: 'Gram (Chana Desi)', group: 'Pulses', modalPriceQuintal: 6200, minPriceQuintal: 5900, maxPriceQuintal: 6450, arrivalQuantityTonne: 160, momChangePercent: 1.4, trend: 'up', mandiStatus: 'Steady' },
    { commodity: 'Tur (Arhar)', group: 'Pulses', modalPriceQuintal: 9800, minPriceQuintal: 9200, maxPriceQuintal: 10400, arrivalQuantityTonne: 120, momChangePercent: 5.2, trend: 'up', mandiStatus: 'Active Trading' },
    { commodity: 'Cotton (Medium Staple)', group: 'Fibre Crops', modalPriceQuintal: 7100, minPriceQuintal: 6800, maxPriceQuintal: 7400, arrivalQuantityTonne: 390, momChangePercent: -1.2, trend: 'down', mandiStatus: 'Steady' },
    { commodity: 'Turmeric (Finger)', group: 'Spices', modalPriceQuintal: 13500, minPriceQuintal: 12400, maxPriceQuintal: 14600, arrivalQuantityTonne: 95, momChangePercent: 8.4, trend: 'up', mandiStatus: 'Peak Arrival' },
    { commodity: 'Chilli (Dry Red)', group: 'Spices', modalPriceQuintal: 18200, minPriceQuintal: 16500, maxPriceQuintal: 19800, arrivalQuantityTonne: 140, momChangePercent: 4.8, trend: 'up', mandiStatus: 'Active Trading' },
  ];

  return res.json({
    success: true,
    is_live: false,
    source: 'Sample data (not a live market feed)',
    disclaimer: 'These fixed sample values are not current market quotes.',
    timestamp: new Date().toISOString(),
    state,
    market,
    data: sampleCommodities,
  });
});

/**
 * Endpoint: POST /api/commodities/pan-india
 * Fetches national benchmark commodities across major states
 */
app.post('/api/commodities/pan-india', async (_req: Request, res: Response) => {
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Provide current live benchmark APMC prices for top 8 agricultural commodities across India:
1. Wheat (Punjab / Haryana)
2. Rice/Paddy (West Bengal / Andhra Pradesh)
3. Onion (Maharashtra / Gujarat)
4. Cotton (Gujarat / Maharashtra)
5. Soybean (Madhya Pradesh / Maharashtra)
6. Mustard (Rajasthan / Haryana)
7. Turmeric (Telangana / Tamil Nadu)
8. Chilli (Andhra Pradesh / Karnataka)

Return a JSON array with:
- "commodity": string
- "state": string
- "market": string
- "modalPriceQuintal": number
- "trend": "up" | "down" | "flat"
- "changePercent": number`,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = (response.text ?? '[]').trim();
      const benchmarks = JSON.parse(responseText);
      return res.json({ success: true, is_live: false, source: 'AI-generated estimates (unverified)', disclaimer: 'These values are not verified market observations.', data: benchmarks });
    } catch (err) {
      console.error('Pan-India live fetch error:', err);
    }
  }

  // Fallback benchmarks
  return res.json({
    success: true,
    is_live: false,
    source: 'Sample benchmark values (not a live market feed)',
    disclaimer: 'These fixed sample values are not current market quotes.',
    data: [
      { commodity: 'Wheat', state: 'Punjab', market: 'Khanna', modalPriceQuintal: 2420, trend: 'up', changePercent: 1.8 },
      { commodity: 'Rice (Paddy)', state: 'West Bengal', market: 'Burdwan', modalPriceQuintal: 2280, trend: 'flat', changePercent: 0.2 },
      { commodity: 'Onion (Red)', state: 'Maharashtra', market: 'Lasalgaon', modalPriceQuintal: 1950, trend: 'up', changePercent: 4.2 },
      { commodity: 'Cotton', state: 'Gujarat', market: 'Rajkot', modalPriceQuintal: 7200, trend: 'down', changePercent: -1.1 },
      { commodity: 'Soybean', state: 'Madhya Pradesh', market: 'Indore', modalPriceQuintal: 4680, trend: 'up', changePercent: 2.5 },
      { commodity: 'Mustard', state: 'Rajasthan', market: 'Sri Ganganagar', modalPriceQuintal: 5450, trend: 'up', changePercent: 3.0 },
      { commodity: 'Turmeric', state: 'Telangana', market: 'Nizamabad', modalPriceQuintal: 13800, trend: 'up', changePercent: 7.9 },
      { commodity: 'Dry Chilli', state: 'Andhra Pradesh', market: 'Guntur', modalPriceQuintal: 18400, trend: 'up', changePercent: 4.5 },
    ],
  });
});

/**
 * LIVE DATA PIPELINE & MODEL RETRAINING ENDPOINTS
 */
app.get('/api/pipeline/status', requireAuth(['admin']), (_req: Request, res: Response) => {
  return res.json({ success: true, ...pipelineEngine.getStatus() });
});

app.post('/api/pipeline/api-key', requireAuth(['admin']), (req: Request, res: Response) => {
  const { apiKey } = req.body;
  const status = pipelineEngine.setApiKey(apiKey || '');
  return res.json({ success: true, message: 'API key updated successfully', ...status });
});

app.post('/api/pipeline/trigger-fetch', requireAuth(['admin']), async (req: Request, res: Response) => {
  const { source = 'AGMARKNET' } = req.body;
  const result = await pipelineEngine.triggerIngestion(source);
  return res.json(result);
});

app.get('/api/pipeline/missing-report', requireAuth(['admin']), (_req: Request, res: Response) => {
  return res.json({ success: true, ...pipelineEngine.getMissingValueReport() });
});

app.get('/api/pipeline/outliers', requireAuth(['admin']), (_req: Request, res: Response) => {
  return res.json({ success: true, ...pipelineEngine.getOutliersReport() });
});

app.get('/api/pipeline/validate-retrain', requireAuth(['admin']), (_req: Request, res: Response) => {
  return res.json({ success: true, ...pipelineEngine.validateDataQualityForRetraining() });
});

app.post('/api/pipeline/retrain', requireAuth(['admin']), (req: Request, res: Response) => {
  return res.status(501).json({
    success: false,
    data_status: 'unavailable',
    error: 'Model retraining is not connected to a training dataset or deployment pipeline.',
  });
});

app.get('/api/pipeline/models', requireAuth(['admin']), (_req: Request, res: Response) => {
  return res.json({ success: true, models: pipelineEngine.getModelRegistry() });
});

app.post('/api/pipeline/rollback', requireAuth(['admin']), (req: Request, res: Response) => {
  return res.status(501).json({
    success: false,
    data_status: 'unavailable',
    error: 'Model rollback is not connected to a model registry or deployment pipeline.',
  });
});

/**
 * MODEL MONITORING & DRIFT ENDPOINTS
 */
app.get('/api/monitoring/metrics', requireAuth(['admin']), (_req: Request, res: Response) => {
  return res.json(monitoringEngine.getDashboardMetrics());
});

app.post('/api/monitoring/resolve-alert', requireAuth(['admin']), (req: Request, res: Response) => {
  const { alertId } = req.body;
  const result = monitoringEngine.acknowledgeAlert(alertId);
  return res.json(result);
});

app.post('/api/monitoring/investigate', requireAuth(['admin']), (req: Request, res: Response) => {
  const { commodity = 'Onion', market = 'Lasalgaon' } = req.body;
  const result = monitoringEngine.runDriftInvestigation(commodity, market);
  return res.json(result);
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
    console.log(`Mandi Price Predictor full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
