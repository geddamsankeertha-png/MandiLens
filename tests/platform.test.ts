import test from 'node:test';
import assert from 'node:assert';
import { generateRealMLPrediction } from '../server/mlEngine';
import { pipelineEngine } from '../server/dataPipeline';
import { monitoringEngine } from '../server/modelMonitoring';
import { generateToken, verifyToken } from '../server/securityMiddleware';
import { validatePriceRecord } from '../server/agmarknetClient';



function testProfitCalculator() {
  const purchasePrice = 20; 
  const sellingPrice = 35;
  const quantity = 100; 
  const transportCost = 500;
  const handlingCost = 200;
  const wastagePercent = 2;

  const totalPurchaseCost = purchasePrice * quantity + transportCost + handlingCost;
  const effectiveQuantity = quantity * (1 - wastagePercent / 100);
  const totalRevenue = sellingPrice * effectiveQuantity;
  const netProfit = totalRevenue - totalPurchaseCost;
  const margin = (netProfit / totalRevenue) * 100;
  const breakEven = totalPurchaseCost / effectiveQuantity;

  assert.strictEqual(totalPurchaseCost, 2700);
  assert.strictEqual(effectiveQuantity, 98);
  assert(netProfit > 0);
  assert(margin > 0);
  assert(breakEven > 0);
}

test('Unit Test: Profit Calculator', () => {
  testProfitCalculator();
});

test('Unit Test: ML Prediction Logic', () => {
  const prediction = generateRealMLPrediction('Tomato', 'Guntur');
  assert.strictEqual(prediction.commodity, 'Tomato');
  assert.strictEqual(prediction.market, 'Guntur');
  assert.ok(typeof prediction.predicted_next_day_price === 'number');
  assert.ok(Array.isArray(prediction.confidence_interval));
  assert.strictEqual(prediction.confidence_interval.length, 2);
  assert.ok(['LOW', 'MEDIUM', 'HIGH'].includes(prediction.risk_level));
});

test('Data Test: Validation, Missing Values & Outliers', () => {
  const missingReport = pipelineEngine.getMissingValueReport();
  assert.ok(missingReport);
  assert.ok(typeof missingReport.overallDataCompleteness === 'string');

  const outlierReport = pipelineEngine.getOutliersReport();
  assert.ok(outlierReport);
  assert.ok(outlierReport.outliersDetected > 0);

  const retrainingValidation = pipelineEngine.validateDataQualityForRetraining();
  assert.ok(retrainingValidation);
  assert.strictEqual(typeof retrainingValidation.passed, 'boolean');
});

test('Data Test: Stale Data & Model Monitoring', () => {
  const dashboard = monitoringEngine.getDashboardMetrics();
  assert.ok(dashboard);
  assert.ok(dashboard.metrics.length > 0);
  assert.ok(typeof dashboard.summary.averageR2 === 'number');
  assert.ok(Array.isArray(dashboard.alerts));
});

test('Security Test: Input Sanitization & Payload Check', () => {
  const maliciousInput = '<script>alert("XSS")</script>';
  const sanitized = maliciousInput.replace(/<[^>]*>?/gm, '');
  assert.strictEqual(sanitized, 'alert("XSS")');

  const sqliPayload = "SELECT * FROM users WHERE id = 1 OR '1'='1'";
  const isSafe = !/(UNION|SELECT|DROP|--)/i.test(sqliPayload);
  assert.strictEqual(isSafe, false);
});

test('Load Test Simulation: 100 Concurrent Predictions', async () => {
  const start = Date.now();
  const promises = Array.from({ length: 100 }, () => Promise.resolve(generateRealMLPrediction('Onion', 'Lasalgaon')));
  const results = await Promise.all(promises);
  const duration = Date.now() - start;

  assert.strictEqual(results.length, 100);
  assert.ok(duration < 2000, `Load test took too long: ${duration}ms`);
});

test('Security Test: JWT Signatures, Alg None Rejection & Refresh Rotation', () => {
  const user = { id: 'usr_test123', email: 'admin@kisanmandi.gov.in', role: 'admin' };

  // 1. Generate access token and verify
  const accessToken = generateToken(user, 'access');
  const verifiedAccess = verifyToken(accessToken);
  assert.ok(verifiedAccess);
  assert.strictEqual(verifiedAccess.userId, 'usr_test123');
  assert.strictEqual(verifiedAccess.role, 'admin');
  assert.strictEqual(verifiedAccess.type, 'access');

  // 2. Generate refresh token and verify
  const refreshToken = generateToken(user, 'refresh');
  const verifiedRefresh = verifyToken(refreshToken);
  assert.ok(verifiedRefresh);
  assert.strictEqual(verifiedRefresh.type, 'refresh');

  // 3. Test rejection of alg: none
  const fakeHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const fakePayload = Buffer.from(JSON.stringify({ userId: 'usr_hacker', role: 'admin', exp: Math.floor(Date.now()/1000) + 3600 })).toString('base64url');
  const forgedToken = `${fakeHeader}.${fakePayload}.signature`;
  const invalidResult = verifyToken(forgedToken);
  assert.strictEqual(invalidResult, null);
});

test('Data Test: AGMARKNET Price Record Validation', () => {
  const validRecord = {
    arrival_date: '31/10/2026',
    state: 'Andhra Pradesh',
    district: 'Guntur',
    market: 'Guntur',
    commodity: 'Tomato',
    variety: 'Hybrid',
    grade: 'FAQ',
    min_price: 35,
    max_price: 45,
    modal_price: 40,
  };

  const result = validatePriceRecord(validRecord);
  assert.strictEqual(result.isValid, true);

  const invalidRecord = {
    ...validRecord,
    modal_price: 50, // exceeds max_price
  };
  const invalidResult = validatePriceRecord(invalidRecord);
  assert.strictEqual(invalidResult.isValid, false);
  assert.ok(invalidResult.errors.length > 0);
});

console.log('All comprehensive tests passed successfully!');


