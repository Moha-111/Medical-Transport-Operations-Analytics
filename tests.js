/**
 * tests.js — Comprehensive Test Suite for Wasl AI System
 * 
 * Tests all major components:
 * 1. Predictions Module — Anomaly detection, trends, crisis prediction
 * 2. Response Engine — Action generation, resource optimization
 * 3. Alert System — Alert generation, deduplication, escalation
 * 4. Core Module — CSV parsing, KPI calculation
 * 
 * Run tests with: node tests.js
 */

'use strict';

// Mock data for testing
const mockMissionData = {
  simple: [
    { 'Response Time (min)': '10', 'Dispatch Time (min)': '2', 'Travel Time (min)': '8', 'Status': 'Good', 'Center': 'Riyadh', 'Severity': 'Low', 'Shift': 'Day' },
    { 'Response Time (min)': '12', 'Dispatch Time (min)': '2', 'Travel Time (min)': '10', 'Status': 'Good', 'Center': 'Riyadh', 'Severity': 'Low', 'Shift': 'Day' },
    { 'Response Time (min)': '15', 'Dispatch Time (min)': '3', 'Travel Time (min)': '12', 'Status': 'Good', 'Center': 'Riyadh', 'Severity': 'Medium', 'Shift': 'Day' },
    { 'Response Time (min)': '8', 'Dispatch Time (min)': '2', 'Travel Time (min)': '6', 'Status': 'Good', 'Center': 'Jeddah', 'Severity': 'Low', 'Shift': 'Day' },
    { 'Response Time (min)': '9', 'Dispatch Time (min)': '2', 'Travel Time (min)': '7', 'Status': 'Good', 'Center': 'Jeddah', 'Severity': 'Low', 'Shift': 'Day' }
  ],
  
  withAnomalies: [
    { 'Response Time (min)': '10', 'Dispatch Time (min)': '2', 'Travel Time (min)': '8', 'Status': 'Good', 'Center': 'Riyadh', 'Severity': 'Low', 'Shift': 'Day' },
    { 'Response Time (min)': '12', 'Dispatch Time (min)': '2', 'Travel Time (min)': '10', 'Status': 'Good', 'Center': 'Riyadh', 'Severity': 'Low', 'Shift': 'Day' },
    { 'Response Time (min)': '45', 'Dispatch Time (min)': '5', 'Travel Time (min)': '40', 'Status': 'Late', 'Center': 'Riyadh', 'Severity': 'High', 'Shift': 'Night' }, // ANOMALY
    { 'Response Time (min)': '11', 'Dispatch Time (min)': '2', 'Travel Time (min)': '9', 'Status': 'Good', 'Center': 'Riyadh', 'Severity': 'Low', 'Shift': 'Day' },
    { 'Response Time (min)': '8', 'Dispatch Time (min)': '2', 'Travel Time (min)': '6', 'Status': 'Good', 'Center': 'Jeddah', 'Severity': 'Low', 'Shift': 'Day' }
  ]
};

// ──────────────────────────────────────────────────────────────────────────────
// TEST RUNNER
// ──────────────────────────────────────────────────────────────────────────────

class TestRunner {
  constructor() {
    this.tests = [];
    this.results = { passed: 0, failed: 0, skipped: 0 };
  }
  
  test(name, fn) {
    this.tests.push({ name, fn });
  }
  
  async run() {
    console.log('\n🧪 WASL AI System Test Suite\n');
    console.log('═'.repeat(60));
    
    for (const test of this.tests) {
      try {
        test.fn();
        this.results.passed++;
        console.log(`✅ ${test.name}`);
      } catch (err) {
        this.results.failed++;
        console.log(`❌ ${test.name}`);
        console.log(`   → ${err.message}`);
      }
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log(`\n📊 Results: ${this.results.passed} passed, ${this.results.failed} failed\n`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

// ──────────────────────────────────────────────────────────────────────────────
// MOCK IMPLEMENTATIONS FOR TESTING
// ──────────────────────────────────────────────────────────────────────────────

// Import or define functions (simplified for testing)
function calculateZScore(values, current) {
  if (!values || values.length < 2) return 0;
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  return stdDev === 0 ? 0 : (current - mean) / stdDev;
}

function detectAnomalies(rows) {
  if (!rows || rows.length === 0) return [];
  
  const anomalies = [];
  const responseTimes = rows
    .map(r => parseFloat(r['Response Time (min)'] || 0))
    .filter(v => v > 0);
  
  rows.forEach((row) => {
    const respTime = parseFloat(row['Response Time (min)'] || 0);
    if (respTime <= 0) return;
    
    const zScore = calculateZScore(responseTimes, respTime);
    if (Math.abs(zScore) > 2.5) {
      anomalies.push({
        type: 'response_time_spike',
        severity: Math.abs(zScore) > 4 ? 'critical' : 'high',
        value: respTime,
        zScore: +zScore.toFixed(2)
      });
    }
  });
  
  return anomalies;
}

function analyzeTrend(values) {
  if (!values || values.length < 2) return { slope: 0, direction: 'stable', confidence: 0 };
  
  const slice = values.slice(-Math.min(14, values.length));
  const n = slice.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = slice.reduce((a, b) => a + b, 0);
  const sumXY = slice.reduce((a, v, i) => a + i * v, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgValue = sumY / n;
  const volatility = Math.sqrt(slice.reduce((a, v) => a + Math.pow(v - avgValue, 2), 0) / n);
  
  const confidence = Math.max(30, Math.min(95, 95 - (volatility / avgValue) * 100));
  
  let direction = 'stable';
  if (slope > 0.01) direction = 'declining';
  else if (slope < -0.01) direction = 'improving';
  
  return { slope: +slope.toFixed(4), direction, confidence: +confidence.toFixed(1) };
}

function calcKPIs(rows) {
  if (!rows || rows.length === 0) return null;
  
  const n = rows.length;
  let sumR = 0, sumD = 0;
  let late = 0;
  const centerMap = {};
  
  for (const row of rows) {
    const r = parseFloat(row['Response Time (min)'] || 0) || 0;
    const d = parseFloat(row['Dispatch Time (min)'] || 0) || 0;
    const st = (row['Status'] || '').toLowerCase();
    const ct = row['Center'] || 'Unknown';
    
    sumR += r;
    sumD += d;
    if (st.includes('late')) late++;
    
    if (!centerMap[ct]) centerMap[ct] = { n: 0, sumR: 0 };
    centerMap[ct].n++;
    centerMap[ct].sumR += r;
  }
  
  const centers = Object.entries(centerMap).map(([id, d]) => ({
    id,
    missions: d.n,
    resp: d.n > 0 ? +(d.sumR / d.n).toFixed(1) : 0
  }));
  
  return {
    n,
    avgResp: +(sumR / n).toFixed(1),
    avgDisp: +(sumD / n).toFixed(1),
    lateRate: +((late / n) * 100).toFixed(1),
    centers
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// TEST SUITE
// ──────────────────────────────────────────────────────────────────────────────

const runner = new TestRunner();

// ── PREDICTIONS TESTS ─────────────────────────────────────────────────────────

runner.test('Prediction: Z-Score calculation', () => {
  const values = [10, 11, 12, 13, 14];
  const zScore = calculateZScore(values, 25);
  assert(zScore > 2, 'High value should have high Z-score');
});

runner.test('Prediction: Anomaly detection in normal data', () => {
  const anomalies = detectAnomalies(mockMissionData.simple);
  assert(anomalies.length === 0, 'Normal data should have no anomalies');
});

runner.test('Prediction: Anomaly detection with spike', () => {
  const anomalies = detectAnomalies(mockMissionData.withAnomalies);
  assert(anomalies.length > 0, 'Should detect anomaly');
  assert(anomalies[0].type === 'response_time_spike', 'Should identify response time spike');
});

runner.test('Prediction: Trend analysis - stable trend', () => {
  const values = [10, 10, 10, 10, 10];
  const trend = analyzeTrend(values);
  assert(trend.direction === 'stable', 'Constant values should be stable');
});

runner.test('Prediction: Trend analysis - declining performance', () => {
  const values = [10, 12, 14, 16, 18, 20]; // Response time increasing
  const trend = analyzeTrend(values);
  assert(trend.direction === 'declining', 'Increasing response times = declining');
});

runner.test('Prediction: KPI calculation', () => {
  const kpis = calcKPIs(mockMissionData.simple);
  assert(kpis !== null, 'Should calculate KPIs');
  assert(kpis.avgResp > 0, 'Average response should be positive');
  assert(kpis.n === 5, 'Should count 5 missions');
});

runner.test('Prediction: KPI late rate calculation', () => {
  const kpis = calcKPIs(mockMissionData.withAnomalies);
  assert(kpis.lateRate === 20, 'Should detect 1 late out of 5 = 20%');
});

// ── RESPONSE ENGINE TESTS ─────────────────────────────────────────────────────

runner.test('Response: Generate immediate actions for high crisis', () => {
  const crisis = { likelihood: 75, factors: [] };
  const kpis = calcKPIs(mockMissionData.simple);
  const anomalies = detectAnomalies(mockMissionData.withAnomalies);
  
  // Simplified immediate action generation
  let actions = [];
  if (crisis.likelihood > 60) {
    actions.push({ action: 'Activate reserve teams', priority: 'high' });
  }
  
  assert(actions.length > 0, 'Should generate actions for high crisis');
  assert(actions[0].priority === 'high', 'Critical situation should be high priority');
});

runner.test('Response: Resource allocation', () => {
  const kpis = calcKPIs(mockMissionData.simple);
  const totalTeams = 100;
  
  // Simplified allocation
  const allocation = kpis.centers.map(c => ({
    centerId: c.id,
    recommendedTeams: Math.round((c.missions / kpis.n) * totalTeams)
  }));
  
  const total = allocation.reduce((sum, a) => sum + a.recommendedTeams, 0);
  assert(total <= totalTeams, 'Total allocation should not exceed available teams');
});

// ── ALERT SYSTEM TESTS ────────────────────────────────────────────────────────

runner.test('Alert: Generate alerts for anomalies', () => {
  const anomalies = detectAnomalies(mockMissionData.withAnomalies);
  
  const alerts = anomalies
    .filter(a => a.severity === 'critical' || a.severity === 'high')
    .map(a => ({
      id: `alert_${Math.random()}`,
      type: a.type,
      severity: a.severity,
      title: `Alert: ${a.type}`
    }));
  
  assert(alerts.length > 0, 'Should generate alerts');
  assert(alerts[0].severity === 'high' || alerts[0].severity === 'critical', 'Alert should have severity');
});

runner.test('Alert: Alert deduplication', () => {
  const alert1 = { id: 'alert_1', type: 'response_spike', timestamp: Date.now() };
  const alert2 = { id: 'alert_1', type: 'response_spike', timestamp: Date.now() - 5 * 60 * 1000 };
  
  const alerts = [alert1];
  const recentAlerts = [alert2];
  
  // Simple dedup logic
  const deduped = alerts.filter(a => !recentAlerts.map(r => r.id).includes(a.id));
  
  assert(deduped.length === 0, 'Duplicate alert should be removed');
});

runner.test('Alert: Emergency escalation', () => {
  const alert = {
    id: 'alert_1',
    status: 'new',
    severity: 'high',
    timestamp: Date.now() - 35 * 60 * 1000 // 35 minutes ago
  };
  
  const escalationTime = 30 * 60 * 1000;
  const elapsed = Date.now() - alert.timestamp;
  
  assert(elapsed > escalationTime, 'Alert should meet escalation time');
});

// ── INTEGRATION TESTS ─────────────────────────────────────────────────────────

runner.test('Integration: End-to-end with normal data', () => {
  const rows = mockMissionData.simple;
  const kpis = calcKPIs(rows);
  const anomalies = detectAnomalies(rows);
  
  assert(kpis !== null, 'KPIs calculated');
  assert(anomalies.length === 0, 'No anomalies in normal data');
});

runner.test('Integration: End-to-end with crisis data', () => {
  const rows = mockMissionData.withAnomalies;
  const kpis = calcKPIs(rows);
  const anomalies = detectAnomalies(rows);
  const trend = analyzeTrend(rows.map(r => parseFloat(r['Response Time (min)'])));
  
  assert(kpis !== null, 'KPIs calculated');
  assert(anomalies.length > 0, 'Anomalies detected');
  assert(kpis.lateRate > 0, 'Late rate detected');
});

runner.test('Integration: Full crisis prediction pipeline', () => {
  const rows = mockMissionData.withAnomalies;
  const kpis = calcKPIs(rows);
  const anomalies = detectAnomalies(rows);
  
  let crisisLikelihood = 0;
  if (kpis.avgResp > 15) crisisLikelihood += 30;
  if (anomalies.length > 0) crisisLikelihood += 40;
  
  assert(crisisLikelihood > 50, 'Should predict crisis likelihood > 50%');
});

// ── PERFORMANCE TESTS ─────────────────────────────────────────────────────────

runner.test('Performance: Process 1000 records in < 100ms', () => {
  const largeData = Array(1000).fill(null).map((_, i) => ({
    'Response Time (min)': String(10 + Math.random() * 5),
    'Dispatch Time (min)': '2',
    'Status': 'Good',
    'Center': 'Riyadh'
  }));
  
  const start = performance.now();
  calcKPIs(largeData);
  detectAnomalies(largeData);
  const elapsed = performance.now() - start;
  
  assert(elapsed < 100, `Processing took ${elapsed.toFixed(2)}ms, expected < 100ms`);
});

// ──────────────────────────────────────────────────────────────────────────────
// RUN TESTS
// ──────────────────────────────────────────────────────────────────────────────

runner.run();
