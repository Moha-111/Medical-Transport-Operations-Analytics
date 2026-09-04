/**
 * predictions.js — AI-Powered Crisis Prediction Engine
 * 
 * Analyzes historical performance data to predict potential crises
 * and operational issues before they escalate.
 * 
 * Key Components:
 * 1. Anomaly Detection — Detect unusual patterns and deviations
 * 2. Trend Analysis — Identify upward/downward trends
 * 3. Crisis Prediction — Predict likelihood of operational crisis
 * 4. Risk Scoring — Calculate risk scores across metrics
 */

'use strict';

// ──────────────────────────────────────────────────────────────────────────────
// 1. ANOMALY DETECTION
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Calculate Z-Score for detecting statistical outliers.
 * Z-Score > 2.5 indicates significant deviation from normal (99.4% confidence)
 * 
 * @param {number[]} values - Array of numerical values
 * @param {number} current - Current value to test
 * @returns {number} Z-Score (positive/negative deviation)
 */
function calculateZScore(values, current) {
  if (!values || values.length < 2) return 0;
  
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  return stdDev === 0 ? 0 : (current - mean) / stdDev;
}

/**
 * Detect anomalies in a dataset using Z-Score method.
 * Returns objects with severity levels: critical, high, medium
 * 
 * @param {Object[]} rows - Mission records with response times, delays, etc.
 * @param {number} threshold - Z-Score threshold (default 2.5 = 99.4% CI)
 * @returns {Object[]} Array of anomaly objects
 */
function detectAnomalies(rows, threshold = 2.5) {
  if (!rows || rows.length === 0) return [];
  
  const anomalies = [];
  
  // 1. Response Time Anomalies
  const responseTimes = rows
    .map(r => parseFloat(r['Response Time (min)'] || r['ResponseMin'] || 0))
    .filter(v => v > 0);
  
  rows.forEach((row, idx) => {
    const respTime = parseFloat(row['Response Time (min)'] || row['ResponseMin'] || 0);
    if (respTime <= 0) return;
    
    const zScore = calculateZScore(responseTimes, respTime);
    if (Math.abs(zScore) > threshold) {
      anomalies.push({
        type: 'response_time_spike',
        severity: Math.abs(zScore) > 4 ? 'critical' : 'high',
        value: respTime,
        expectedRange: [
          responseTimes.reduce((a, b) => a + b) / responseTimes.length - 5,
          responseTimes.reduce((a, b) => a + b) / responseTimes.length + 5
        ],
        zScore: +zScore.toFixed(2),
        record: row,
        message: `زيادة غير عادية في وقت الاستجابة (${respTime} د)`
      });
    }
  });
  
  // 2. High Load Detection
  const center = row => row['Center'] || row['Centre'] || 'Unknown';
  const centerLoads = {};
  rows.forEach(row => {
    const c = center(row);
    centerLoads[c] = (centerLoads[c] || 0) + 1;
  });
  
  const avgLoad = Object.values(centerLoads).reduce((a, b) => a + b, 0) / Object.keys(centerLoads).length;
  const loadStdDev = Math.sqrt(
    Object.values(centerLoads).reduce((a, load) => a + Math.pow(load - avgLoad, 2), 0) / Object.keys(centerLoads).length
  );
  
  Object.entries(centerLoads).forEach(([centerName, load]) => {
    const zScore = loadStdDev === 0 ? 0 : (load - avgLoad) / loadStdDev;
    if (zScore > 2) {
      anomalies.push({
        type: 'high_load_alert',
        severity: zScore > 3 ? 'critical' : 'high',
        center: centerName,
        currentLoad: load,
        expectedLoad: Math.round(avgLoad),
        zScore: +zScore.toFixed(2),
        message: `حمل عمل غير عادي في ${centerName} (${load} مهمة)`
      });
    }
  });
  
  // 3. Late Mission Rate Anomalies
  const lateCount = rows.filter(r => 
    (r['Status'] || '').toLowerCase().includes('late')
  ).length;
  const lateRate = (lateCount / rows.length) * 100;
  const historicalLateRates = rows
    .map(r => (r['Status'] || '').toLowerCase().includes('late') ? 1 : 0);
  
  if (lateRate > 15) {
    anomalies.push({
      type: 'high_late_rate',
      severity: lateRate > 25 ? 'critical' : 'high',
      value: +lateRate.toFixed(1),
      threshold: 10,
      message: `معدل التأخير مرتفع: ${lateRate.toFixed(1)}%`
    });
  }
  
  return anomalies.sort((a, b) => {
    const severityRank = { critical: 0, high: 1, medium: 2 };
    return (severityRank[a.severity] || 3) - (severityRank[b.severity] || 3);
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. TREND ANALYSIS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Calculate linear regression slope and trend direction.
 * Used to detect improving/declining performance.
 * 
 * @param {number[]} values - Historical values (in chronological order)
 * @param {number} window - Number of latest points to analyze (default 14 for 2 weeks)
 * @returns {Object} Trend analysis result
 */
function analyzeTrend(values, window = 14) {
  if (!values || values.length < 2) return { slope: 0, direction: 'stable', confidence: 0 };
  
  const slice = values.slice(-Math.min(window, values.length));
  const n = slice.length;
  
  // Linear regression
  const sumX = (n * (n - 1)) / 2;
  const sumY = slice.reduce((a, b) => a + b, 0);
  const sumXY = slice.reduce((a, v, i) => a + i * v, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const avgValue = sumY / n;
  const volatility = Math.sqrt(slice.reduce((a, v) => a + Math.pow(v - avgValue, 2), 0) / n);
  
  // Confidence based on volatility (lower volatility = higher confidence)
  const confidence = Math.max(30, Math.min(95, 95 - (volatility / avgValue) * 100));
  
  let direction = 'stable';
  if (Math.abs(slope) < 0.01) direction = 'stable';
  else if (slope > 0.01) direction = 'declining'; // higher response time = bad
  else direction = 'improving'; // lower response time = good
  
  return {
    slope: +slope.toFixed(4),
    direction,
    confidence: +confidence.toFixed(1),
    volatility: +volatility.toFixed(2),
    recentAvg: +avgValue.toFixed(2),
    trend: slice
  };
}

/**
 * Detect if metric is approaching a critical threshold.
 * 
 * @param {number[]} historicalValues - Past measurements
 * @param {number} criticalThreshold - Critical limit
 * @param {number} daysAhead - How many days to predict ahead
 * @returns {Object} Threshold breach prediction
 */
function predictThresholdBreach(historicalValues, criticalThreshold, daysAhead = 3) {
  if (!historicalValues || historicalValues.length < 2) {
    return { willBreak: false, daysUntilBreach: Infinity, confidence: 0 };
  }
  
  const trend = analyzeTrend(historicalValues);
  const current = historicalValues[historicalValues.length - 1];
  const projected = current + (trend.slope * daysAhead);
  
  const willBreak = projected > criticalThreshold;
  let daysUntilBreach = Infinity;
  
  if (trend.slope > 0) {
    daysUntilBreach = Math.ceil((criticalThreshold - current) / trend.slope);
  }
  
  return {
    willBreak,
    daysUntilBreach: Math.max(0, daysUntilBreach),
    currentValue: current,
    projectedValue: +projected.toFixed(2),
    threshold: criticalThreshold,
    confidence: trend.confidence
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. CRISIS PREDICTION
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Calculate overall crisis likelihood based on multiple factors.
 * Range: 0-100 (0 = no crisis, 100 = imminent crisis)
 * 
 * @param {Object[]|null} rows - Current mission records
 * @param {Object} kpis - Current KPI snapshot
 * @param {Object} anomalies - Detected anomalies
 * @param {Object[]} historicalKPIs - Past KPI snapshots (for trends)
 * @returns {Object} Crisis prediction result
 */
function predictCrisisLikelihood(rows, kpis, anomalies = [], historicalKPIs = []) {
  if (!rows || !kpis) return { likelihood: 0, factors: [], recommendation: 'none' };
  
  const factors = [];
  let totalScore = 0;
  
  // Factor 1: Response Time (0-30 points)
  if (kpis.avgResp > 20) {
    const points = Math.min(30, (kpis.avgResp - 15) * 2);
    factors.push({ name: 'وقت الاستجابة الطويل', weight: 'high', points, detail: `${kpis.avgResp} د` });
    totalScore += points;
  }
  
  // Factor 2: Late Rate (0-25 points)
  if (kpis.lateRate > 10) {
    const points = Math.min(25, (kpis.lateRate - 5) * 1.5);
    factors.push({ name: 'معدل التأخير المرتفع', weight: 'high', points, detail: `${kpis.lateRate.toFixed(1)}%` });
    totalScore += points;
  }
  
  // Factor 3: Anomaly Count (0-20 points)
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical').length;
  const highAnomalies = anomalies.filter(a => a.severity === 'high').length;
  const anomalyScore = (criticalAnomalies * 10) + (highAnomalies * 3);
  if (anomalyScore > 0) {
    factors.push({ name: 'اكتشاف شذوذ كبير', weight: 'critical', points: Math.min(20, anomalyScore), detail: `${anomalies.length} شذوذ` });
    totalScore += Math.min(20, anomalyScore);
  }
  
  // Factor 4: Load Analysis (0-15 points)
  const overloadedCenters = anomalies.filter(a => a.type === 'high_load_alert').length;
  if (overloadedCenters > 0) {
    const points = Math.min(15, overloadedCenters * 7);
    factors.push({ name: 'مراكز مثقلة بالعمل', weight: 'high', points, detail: `${overloadedCenters} مركز` });
    totalScore += points;
  }
  
  // Factor 5: Trend Analysis (0-10 points)
  if (historicalKPIs && historicalKPIs.length > 0) {
    const responseTrend = analyzeTrend(historicalKPIs.map(k => k.avgResp || 0));
    if (responseTrend.direction === 'declining' && responseTrend.confidence > 70) {
      const points = Math.min(10, (responseTrend.slope * 3));
      factors.push({ name: 'تدهور الأداء التاريخي', weight: 'medium', points, detail: responseTrend.direction });
      totalScore += points;
    }
  }
  
  const likelihood = Math.min(100, totalScore);
  
  // Generate recommendation based on likelihood
  let recommendation = 'none';
  if (likelihood > 75) recommendation = 'critical_intervention';
  else if (likelihood > 50) recommendation = 'immediate_action';
  else if (likelihood > 30) recommendation = 'active_monitoring';
  else if (likelihood > 10) recommendation = 'standard_monitoring';
  
  return {
    likelihood: +(likelihood).toFixed(1),
    factors: factors.sort((a, b) => b.points - a.points),
    totalFactors: factors.length,
    recommendation,
    timestamp: Date.now(),
    message: generateCrisisMessage(likelihood, factors)
  };
}

/**
 * Generate human-readable crisis message based on prediction.
 * 
 * @param {number} likelihood - Crisis likelihood (0-100)
 * @param {Object[]} factors - Contributing factors
 * @returns {string} Arabic message
 */
function generateCrisisMessage(likelihood, factors) {
  if (likelihood > 75) {
    return `⚠️ خطر أزمة عالي جداً! ${factors[0]?.name || 'عوامل حرجة'} — تدخل فوري مطلوب`;
  } else if (likelihood > 50) {
    return `⚠️ احتمالية أزمة مرتفعة — ${factors[0]?.name || 'عوامل متعددة'} — تدخل سريع مطلوب`;
  } else if (likelihood > 30) {
    return `⚠️ احتمالية أزمة متوسطة — مراقبة نشطة مطلوبة`;
  }
  return '✅ الأوضاع تحت السيطرة';
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. RISK SCORING
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Calculate detailed risk profile for each operational center.
 * 
 * @param {Object[]} rows - Mission records
 * @param {Object} kpis - Current KPIs
 * @returns {Object[]} Array of center risk assessments
 */
function scoreCenter Risks(rows, kpis) {
  if (!kpis || !kpis.centers) return [];
  
  return kpis.centers.map(center => {
    let riskScore = 0;
    const riskFactors = [];
    
    // Response time risk
    if (center.resp > 15) {
      const risk = Math.min(40, (center.resp - 15) * 2);
      riskScore += risk;
      riskFactors.push({ factor: 'وقت الاستجابة', risk });
    }
    
    // Late rate risk
    if (center.late > 10) {
      const risk = Math.min(30, (center.late - 5) * 2);
      riskScore += risk;
      riskFactors.push({ factor: 'معدل التأخير', risk });
    }
    
    // Load risk
    if (center.missions > kpis.n / kpis.centers.length * 1.3) {
      riskScore += 20;
      riskFactors.push({ factor: 'جهد زائد', risk: 20 });
    }
    
    const riskLevel = riskScore > 60 ? 'critical' : riskScore > 40 ? 'high' : riskScore > 20 ? 'medium' : 'low';
    
    return {
      centerId: center.id,
      riskScore: +riskScore.toFixed(1),
      riskLevel,
      factors: riskFactors,
      color: riskLevel === 'critical' ? '#FF5252' : riskLevel === 'high' ? '#F6A623' : riskLevel === 'medium' ? '#FFC107' : '#4CAF50'
    };
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ──────────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateZScore,
    detectAnomalies,
    analyzeTrend,
    predictThresholdBreach,
    predictCrisisLikelihood,
    generateCrisisMessage,
    scoreCenterRisks
  };
}
