/**
 * waslAI.js — Wasl AI Integration Module
 * 
 * Main integration file that combines all AI modules (predictions, responses, alerts)
 * into a unified real-time crisis management system.
 * 
 * Usage:
 * const wasl = new WaslAI(missionData);
 * const assessment = wasl.assessCrisis();
 * const plan = wasl.getResponsePlan();
 * const alerts = wasl.getAlerts();
 */

'use strict';

/**
 * Main WaslAI class — Unified AI Crisis Management System
 */
class WaslAI {
  /**
   * @param {Object[]} missionRecords - Array of mission records
   * @param {Object} options - Configuration options
   */
  constructor(missionRecords = [], options = {}) {
    this.records = missionRecords;
    this.options = {
      responsiveThreshold: options.responsiveThreshold || 15, // minutes
      lateRateThreshold: options.lateRateThreshold || 10, // percent
      zScoreThreshold: options.zScoreThreshold || 2.5,
      trendWindow: options.trendWindow || 14, // days
      ...options
    };
    
    // Cache results to avoid recalculation
    this.cache = {
      kpis: null,
      anomalies: null,
      crisisPrediction: null,
      responsePlan: null,
      alerts: null,
      lastUpdate: 0
    };
    
    // Performance timing
    this.metrics = {
      analysisTime: 0,
      alertCount: 0,
      anomaliesDetected: 0,
      crisisLevel: 'low'
    };
  }
  
  /**
   * Perform complete crisis assessment.
   * This is the main entry point for the AI system.
   * 
   * @returns {Object} Complete crisis assessment
   */
  assessCrisis() {
    const startTime = performance.now();
    
    // Step 1: Calculate KPIs
    const kpis = this.calculateKPIs();
    if (!kpis) return null;
    
    // Step 2: Detect anomalies
    const anomalies = this.detectAnomalies();
    
    // Step 3: Predict crisis
    const crisisPrediction = this.predictCrisis(kpis, anomalies);
    
    // Step 4: Score center risks
    const centerRisks = this.scoreCenterRisks(kpis);
    
    // Step 5: Update metrics
    const analysisTime = performance.now() - startTime;
    this.metrics.analysisTime = Math.round(analysisTime);
    this.metrics.anomaliesDetected = anomalies.length;
    this.metrics.crisisLevel = crisisPrediction?.likelihood > 75 ? 'critical' :
                               crisisPrediction?.likelihood > 50 ? 'high' :
                               crisisPrediction?.likelihood > 30 ? 'medium' : 'low';
    
    // Cache results
    this.cache.kpis = kpis;
    this.cache.anomalies = anomalies;
    this.cache.crisisPrediction = crisisPrediction;
    this.cache.lastUpdate = Date.now();
    
    return {
      timestamp: Date.now(),
      kpis,
      anomalies,
      crisisPrediction,
      centerRisks,
      analysisTime: analysisTime.toFixed(2) + 'ms'
    };
  }
  
  /**
   * Get comprehensive response plan.
   * 
   * @returns {Object} Response plan with immediate, short-term, and medium-term actions
   */
  getResponsePlan() {
    if (!this.cache.crisisPrediction) {
      this.assessCrisis();
    }
    
    const { kpis, anomalies, crisisPrediction } = this.cache;
    const centerRisks = this.scoreCenterRisks(kpis);
    
    // Generate phase-specific actions
    const immediateActions = this.generateImmediateActions(crisisPrediction, kpis, centerRisks);
    const shortTermActions = this.generateShortTermActions(crisisPrediction, anomalies, kpis);
    const mediumTermActions = this.generateMediumTermActions(crisisPrediction, anomalies, kpis);
    
    // Optimize resource allocation
    const resourcePlan = this.optimizeResourceAllocation(kpis);
    
    return {
      summary: {
        crisisLevel: this.metrics.crisisLevel,
        likelihood: crisisPrediction.likelihood,
        priority: crisisPrediction.recommendation,
        generatedAt: Date.now()
      },
      phases: {
        immediate: { duration: '0-5 دقائق', actions: immediateActions },
        shortTerm: { duration: '5-30 دقيقة', actions: shortTermActions },
        mediumTerm: { duration: '30 دقيقة - 2 ساعة', actions: mediumTermActions }
      },
      resourceAllocation: resourcePlan,
      successMetrics: {
        targetResponseTime: '≤ 12 دقيقة',
        targetLateRate: '≤ 8%',
        estimatedRecoveryTime: '30-120 دقيقة'
      }
    };
  }
  
  /**
   * Get active alerts.
   * 
   * @returns {Object[]} Array of alerts
   */
  getAlerts() {
    if (!this.cache.crisisPrediction) {
      this.assessCrisis();
    }
    
    const alerts = this.generateAlerts(
      this.cache.anomalies,
      this.cache.crisisPrediction,
      this.cache.kpis
    );
    
    this.metrics.alertCount = alerts.length;
    this.cache.alerts = alerts;
    
    return alerts;
  }
  
  /**
   * Get dashboard summary.
   * Suitable for real-time display.
   * 
   * @returns {Object} Dashboard summary
   */
  getDashboardSummary() {
    if (!this.cache.crisisPrediction) {
      this.assessCrisis();
    }
    
    const { kpis, crisisPrediction } = this.cache;
    
    return {
      healthMeter: {
        score: Math.round(100 - crisisPrediction.likelihood),
        level: this.metrics.crisisLevel,
        trend: this.calculateHealthTrend()
      },
      
      keyMetrics: {
        totalMissions: kpis.n,
        avgResponse: kpis.avgResp,
        lateRate: kpis.lateRate,
        lifeSavingRate: kpis.lifeSavePct,
        activeCenters: kpis.centers.length
      },
      
      alerts: {
        count: this.metrics.alertCount,
        critical: (this.cache.alerts || []).filter(a => a.severity === 'critical').length,
        high: (this.cache.alerts || []).filter(a => a.severity === 'high').length
      },
      
      anomalies: {
        count: this.metrics.anomaliesDetected,
        breakdown: this.getAnomalyBreakdown()
      },
      
      topRisks: this.cache.kpis?.centers
        ?.sort((a, b) => b.resp - a.resp)
        .slice(0, 3)
        .map(c => ({ center: c.id, response: c.resp + ' د', status: c.resp > 15 ? '🔴' : '🟢' })),
      
      nextActions: (this.getResponsePlan()?.phases?.immediate?.actions || []).slice(0, 3)
    };
  }
  
  // ── Internal Methods ──────────────────────────────────────────────────────
  
  calculateKPIs() {
    if (!this.records || this.records.length === 0) return null;
    
    const n = this.records.length;
    let sumResp = 0, sumDisp = 0, sumTravel = 0, sumDur = 0;
    let late = 0, lifeSave = 0;
    const centerMap = {};
    
    for (const row of this.records) {
      const resp = parseFloat(row['Response Time (min)'] || row.respondmin || 0) || 0;
      const disp = parseFloat(row['Dispatch Time (min)'] || row.dispmin || 0) || 0;
      const travel = parseFloat(row['Travel Time (min)'] || row.travmin || 0) || 0;
      const dur = resp; // Duration = Response time
      const status = (row.Status || '').toLowerCase();
      const center = row.Center || row.centre || 'Unknown';
      const severity = (row.Severity || '').toLowerCase();
      
      sumResp += resp;
      sumDisp += disp;
      sumTravel += travel;
      sumDur += dur;
      if (status.includes('late')) late++;
      if (severity.includes('life') || severity.includes('saving')) lifeSave++;
      
      if (!centerMap[center]) {
        centerMap[center] = { n: 0, sumResp: 0, late: 0, disp: 0 };
      }
      centerMap[center].n++;
      centerMap[center].sumResp += resp;
      centerMap[center].disp += disp;
      if (status.includes('late')) centerMap[center].late++;
    }
    
    const centers = Object.entries(centerMap).map(([id, d]) => ({
      id,
      missions: d.n,
      resp: d.n > 0 ? +(d.sumResp / d.n).toFixed(1) : 0,
      disp: d.n > 0 ? +(d.disp / d.n).toFixed(1) : 0,
      late: d.n > 0 ? +((d.late / d.n) * 100).toFixed(1) : 0
    }));
    
    return {
      n,
      avgResp: +(sumResp / n).toFixed(1),
      avgDisp: +(sumDisp / n).toFixed(1),
      avgTravel: +(sumTravel / n).toFixed(1),
      avgDur: +(sumDur / n).toFixed(1),
      lateRate: +((late / n) * 100).toFixed(1),
      lifeSavePct: +((lifeSave / n) * 100).toFixed(1),
      centers: centers.sort((a, b) => b.missions - a.missions)
    };
  }
  
  detectAnomalies() {
    if (!this.records) return [];
    
    const anomalies = [];
    const responseTimes = this.records
      .map(r => parseFloat(r['Response Time (min)'] || 0))
      .filter(v => v > 0);
    
    if (responseTimes.length < 2) return [];
    
    // Z-Score based anomaly detection
    const mean = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
    const variance = responseTimes.reduce((a, v) => a + Math.pow(v - mean, 2)) / responseTimes.length;
    const stdDev = Math.sqrt(variance);
    
    this.records.forEach(row => {
      const respTime = parseFloat(row['Response Time (min)'] || 0);
      if (respTime <= 0) return;
      
      const zScore = stdDev === 0 ? 0 : (respTime - mean) / stdDev;
      if (Math.abs(zScore) > this.options.zScoreThreshold) {
        anomalies.push({
          type: 'response_time_spike',
          severity: Math.abs(zScore) > 4 ? 'critical' : 'high',
          value: respTime,
          zScore: +zScore.toFixed(2),
          message: `وقت استجابة غير عادي: ${respTime} د`
        });
      }
    });
    
    return anomalies;
  }
  
  predictCrisis(kpis, anomalies) {
    if (!kpis) return { likelihood: 0, factors: [], message: '✅ لا توجد أزمة محتملة' };
    
    let likelihood = 0;
    const factors = [];
    
    // Factor 1: Response time
    if (kpis.avgResp > 20) {
      const points = Math.min(30, (kpis.avgResp - 15) * 2);
      factors.push({ name: 'وقت استجابة طويل', points });
      likelihood += points;
    }
    
    // Factor 2: Late rate
    if (kpis.lateRate > 10) {
      const points = Math.min(25, (kpis.lateRate - 5) * 1.5);
      factors.push({ name: 'معدل تأخير مرتفع', points });
      likelihood += points;
    }
    
    // Factor 3: Anomalies
    const anomalyScore = anomalies.filter(a => a.severity === 'critical').length * 10 +
                         anomalies.filter(a => a.severity === 'high').length * 3;
    if (anomalyScore > 0) {
      factors.push({ name: 'شذوذ كبير مكتشف', points: Math.min(20, anomalyScore) });
      likelihood += Math.min(20, anomalyScore);
    }
    
    likelihood = Math.min(100, likelihood);
    
    const recommendation = likelihood > 75 ? 'critical_intervention' :
                          likelihood > 50 ? 'immediate_action' :
                          likelihood > 30 ? 'active_monitoring' : 'none';
    
    const message = generateCrisisMessage(likelihood, factors);
    
    return {
      likelihood: +likelihood.toFixed(1),
      factors: factors.sort((a, b) => b.points - a.points),
      recommendation,
      message
    };
  }
  
  // Stub methods for extended functionality
  scoreCenterRisks(kpis) {
    return kpis.centers.map(c => ({
      center: c.id,
      riskScore: c.resp > 15 ? 70 : 30,
      status: c.resp > 15 ? 'high' : 'normal'
    }));
  }
  
  generateImmediateActions(crisis, kpis, risks) {
    const actions = [];
    if (crisis.likelihood > 60) {
      actions.push({
        priority: 'critical',
        action: 'انشر الفرق الاحتياطية',
        expectedImpact: 'إضافة 15-20 فريق'
      });
    }
    return actions;
  }
  
  generateShortTermActions(crisis, anomalies, kpis) {
    return [];
  }
  
  generateMediumTermActions(crisis, anomalies, kpis) {
    return [];
  }
  
  optimizeResourceAllocation(kpis) {
    const totalTeams = 100;
    return kpis.centers.slice(0, 5).map(c => ({
      center: c.id,
      recommendedTeams: Math.ceil((c.missions / kpis.n) * totalTeams)
    }));
  }
  
  generateAlerts(anomalies, crisis, kpis) {
    const alerts = [];
    
    if (crisis?.likelihood > 50) {
      alerts.push({
        id: `alert_crisis_${Date.now()}`,
        type: 'crisis_warning',
        severity: crisis.likelihood > 75 ? 'critical' : 'high',
        title: '⚠️ تحذير أزمة',
        message: crisis.message
      });
    }
    
    return alerts;
  }
  
  calculateHealthTrend() {
    return this.metrics.crisisLevel === 'critical' ? 'declining' :
           this.metrics.crisisLevel === 'low' ? 'improving' : 'stable';
  }
  
  getAnomalyBreakdown() {
    return (this.cache.anomalies || []).reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {});
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────────────────────────────────────

function generateCrisisMessage(likelihood, factors) {
  if (likelihood > 75) {
    return `⚠️ خطر أزمة عالي جداً! — تدخل فوري مطلوب`;
  } else if (likelihood > 50) {
    return `⚠️ احتمالية أزمة مرتفعة — تدخل سريع مطلوب`;
  } else if (likelihood > 30) {
    return `⚠️ احتمالية أزمة متوسطة — مراقبة نشطة`;
  }
  return '✅ الأوضاع تحت السيطرة';
}

// ──────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ──────────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = WaslAI;
}

if (typeof window !== 'undefined') {
  window.WaslAI = WaslAI;
}
