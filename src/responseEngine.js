/**
 * responseEngine.js — Smart Crisis Response Recommendation Engine
 * 
 * Generates intelligent, actionable recommendations to address operational crises
 * in real-time. Recommends immediate, short-term, and medium-term actions.
 * 
 * Key Features:
 * 1. Real-time Action Generation — Immediate recommendations (0-5 min)
 * 2. Resource Optimization — Smart allocation across centers
 * 3. Priority Ranking — Orders actions by impact and urgency
 * 4. Historical Tracking — Learns from past response effectiveness
 */

'use strict';

// ──────────────────────────────────────────────────────────────────────────────
// 1. IMMEDIATE ACTION GENERATION
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Generate immediate actions (0-5 minutes) to address the current crisis.
 * Focus on reducing response time and managing load.
 * 
 * @param {Object} crisisPrediction - Output from predictCrisisLikelihood
 * @param {Object} kpis - Current KPIs
 * @param {Object} centerRisks - Output from scoreCenterRisks
 * @returns {Object[]} Array of immediate action recommendations
 */
function generateImmediateActions(crisisPrediction, kpis, centerRisks = []) {
  const actions = [];
  
  if (!crisisPrediction || crisisPrediction.likelihood < 10) {
    return actions; // No crisis, no immediate actions needed
  }
  
  // Action 1: Increase Team Size for Overloaded Centers
  const criticalCenters = centerRisks.filter(c => c.riskLevel === 'critical');
  if (criticalCenters.length > 0) {
    for (const center of criticalCenters.slice(0, 2)) {
      actions.push({
        priority: 'critical',
        timeWindow: '0-2 دقائق',
        action: 'زيادة عدد الفريق',
        target: `مركز ${center.centerId}`,
        detail: `أضف 2-3 فريق فوراً إلى ${center.centerId} (خطر: ${center.riskScore.toFixed(1)})`,
        impact: 'تقليل وقت الاستجابة 20-30%',
        assignedTo: 'supervisor',
        status: 'pending', // pending, in_progress, completed
        createdAt: Date.now(),
        expectedCompletion: Date.now() + 2 * 60 * 1000
      });
    }
  }
  
  // Action 2: Task Redistribution
  if (kpis.lateRate > 15) {
    actions.push({
      priority: 'high',
      timeWindow: '2-5 دقائق',
      action: 'إعادة توزيع المهام',
      target: 'النظام',
      detail: `أعد توزيع المهام المعلقة من المراكز المثقلة إلى المراكز الأخرى`,
      impact: 'توازن الحمل وتقليل معدل التأخير 30%',
      assignedTo: 'dispatcher',
      status: 'pending',
      createdAt: Date.now(),
      expectedCompletion: Date.now() + 5 * 60 * 1000
    });
  }
  
  // Action 3: Activate Reserve Teams
  if (crisisPrediction.likelihood > 60) {
    actions.push({
      priority: 'high',
      timeWindow: '3-5 دقائق',
      action: 'تفعيل الفرق الاحتياطية',
      target: 'الفرق الاحتياطية',
      detail: `فعّل فرق الطوارئ الاحتياطية على الفور`,
      impact: 'إضافة 15-20 فريق إضافي',
      assignedTo: 'operations-lead',
      status: 'pending',
      createdAt: Date.now(),
      expectedCompletion: Date.now() + 5 * 60 * 1000
    });
  }
  
  return actions.sort((a, b) => {
    const priorityMap = { critical: 0, high: 1, medium: 2 };
    return priorityMap[a.priority] - priorityMap[b.priority];
  });
}

/**
 * Generate short-term actions (5-30 minutes) to stabilize operations.
 * 
 * @param {Object} crisisPrediction - Crisis prediction result
 * @param {Object[]} anomalies - Detected anomalies
 * @param {Object} kpis - Current KPIs
 * @returns {Object[]} Array of short-term recommendations
 */
function generateShortTermActions(crisisPrediction, anomalies = [], kpis) {
  const actions = [];
  
  if (crisisPrediction.likelihood < 30) {
    return actions;
  }
  
  // Action 1: Coordinate with Neighboring Centers
  const nearbyIssues = anomalies.filter(a => 
    a.type === 'high_load_alert' || a.type === 'response_time_spike'
  );
  
  if (nearbyIssues.length > 0) {
    actions.push({
      priority: 'high',
      timeWindow: '5-15 دقائق',
      action: 'تنسيق مع المراكز المجاورة',
      target: 'المراكز الأخرى',
      detail: `تواصل مع المراكز المجاورة للحصول على دعم فوري`,
      impact: 'إمكانية نقل 10-15 مهمة لتفريغ الضغط',
      assignedTo: 'coordinator',
      status: 'pending',
      createdAt: Date.now(),
      expectedCompletion: Date.now() + 15 * 60 * 1000
    });
  }
  
  // Action 2: Optimize Paramedic Shifts
  if (kpis.lateRate > 12) {
    actions.push({
      priority: 'medium',
      timeWindow: '10-20 دقائق',
      action: 'تحسين جداول الموظفين',
      target: 'جدولة الموظفين',
      detail: `أعد تنظيم جداول الموظفين لتوزيع أفضل للجهد`,
      impact: 'تحسن 15% في كفاءة الاستجابة',
      assignedTo: 'hr-coordinator',
      status: 'pending',
      createdAt: Date.now(),
      expectedCompletion: Date.now() + 20 * 60 * 1000
    });
  }
  
  // Action 3: Alert Hospital Network
  if (kpis.lifeSavePct > 30) {
    actions.push({
      priority: 'high',
      timeWindow: '5-10 دقائق',
      action: 'تنبيه شبكة المستشفيات',
      target: 'المستشفيات',
      detail: `أخطر المستشفيات بالزيادة المتوقعة في التحويلات (${kpis.lifeSavePct.toFixed(0)}%)`,
      impact: 'تحضر المستشفيات للاستقبال الأفضل',
      assignedTo: 'hospital-liaison',
      status: 'pending',
      createdAt: Date.now(),
      expectedCompletion: Date.now() + 10 * 60 * 1000
    });
  }
  
  return actions;
}

/**
 * Generate medium-term actions (30 minutes - 2 hours) for systematic improvement.
 * 
 * @param {Object} crisisPrediction - Crisis prediction
 * @param {Object[]} anomalies - Anomalies
 * @param {Object} kpis - Current KPIs
 * @returns {Object[]} Array of medium-term recommendations
 */
function generateMediumTermActions(crisisPrediction, anomalies = [], kpis) {
  const actions = [];
  
  // Action 1: Emergency Training Session
  const highAnomalies = anomalies.filter(a => a.severity === 'high' || a.severity === 'critical');
  if (highAnomalies.length > 3) {
    actions.push({
      priority: 'medium',
      timeWindow: '30-45 دقائق',
      action: 'جلسة تدريب سريعة',
      target: 'الأفراد',
      detail: `عقد جلسة تدريب سريعة على أفضل الممارسات الحالية`,
      impact: 'تحسن 10-15% في الكفاءة',
      assignedTo: 'training-coordinator',
      status: 'pending',
      createdAt: Date.now(),
      expectedCompletion: Date.now() + 45 * 60 * 1000
    });
  }
  
  // Action 2: Bring Additional Resources
  if (crisisPrediction.likelihood > 50) {
    actions.push({
      priority: 'high',
      timeWindow: '30-60 دقائق',
      action: 'جلب موارد احتياطية',
      target: 'المراكز المثقلة',
      detail: `جلب مركبات وموظفين احتياطيين من المحافظات الأخرى`,
      impact: 'إضافة 30-40% سعة إضافية',
      assignedTo: 'logistics-manager',
      status: 'pending',
      createdAt: Date.now(),
      expectedCompletion: Date.now() + 60 * 60 * 1000
    });
  }
  
  // Action 3: Emergency Operations Center Meeting
  if (crisisPrediction.likelihood > 75) {
    actions.push({
      priority: 'critical',
      timeWindow: '10-30 دقائق',
      action: 'اجتماع غرفة العمليات',
      target: 'الإدارة العليا',
      detail: `اجتماع طوارئ مع الإدارة العليا لتنسيق الاستجابة`,
      impact: 'توليد متعددة المستويات للمنسقة الفعالة',
      assignedTo: 'director',
      status: 'pending',
      createdAt: Date.now(),
      expectedCompletion: Date.now() + 30 * 60 * 1000
    });
  }
  
  return actions;
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. RESOURCE OPTIMIZATION
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Calculate optimal resource distribution across centers.
 * Minimizes response time while maintaining safety reserves.
 * 
 * @param {Object} kpis - Current KPIs with centers array
 * @param {number} totalTeams - Total teams available
 * @param {number} reservePercent - Percentage to hold in reserve (default 20%)
 * @returns {Object[]} Recommended distribution
 */
function optimizeResourceAllocation(kpis, totalTeams = 100, reservePercent = 20) {
  if (!kpis || !kpis.centers) return [];
  
  const reserve = Math.ceil(totalTeams * (reservePercent / 100));
  const available = totalTeams - reserve;
  
  // Calculate allocation based on risk and current load
  const allocations = kpis.centers.map(center => {
    // Weighted score: 60% current missions, 40% response time
    const loadScore = (center.missions / kpis.n) * 60;
    const respScore = Math.min(40, (center.resp / 20) * 40); // normalized to 20 min target
    const totalScore = loadScore + respScore;
    
    return {
      centerId: center.id,
      currentMissions: center.missions,
      currentResp: center.resp,
      score: +totalScore.toFixed(2),
      originalAllocation: center.missions
    };
  });
  
  const totalScore = allocations.reduce((a, b) => a + b.score, 0);
  
  const result = allocations.map(alloc => {
    const share = (alloc.score / totalScore) * available;
    const recommended = Math.max(2, Math.round(share));
    
    return {
      centerId: alloc.centerId,
      currentLoad: alloc.currentMissions,
      currentResp: alloc.currentResp,
      recommendedTeams: recommended,
      allocation: +((recommended / available) * 100).toFixed(1) + '%',
      expectedImpact: `${Math.round((recommended / alloc.originalAllocation) * 100 - 100)}% تحسن متوقع`
    };
  });
  
  result.push({
    centerId: 'RESERVE',
    currentLoad: 0,
    currentResp: 0,
    recommendedTeams: reserve,
    allocation: +((reserve / totalTeams) * 100).toFixed(1) + '%',
    expectedImpact: 'احتياطي للطوارئ'
  });
  
  return result.sort((a, b) => b.recommendedTeams - a.recommendedTeams);
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. PRIORITY RANKING & IMPACT ANALYSIS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Calculate impact score for each action.
 * Higher score = more effective action.
 * 
 * @param {Object} action - Action object
 * @param {number} crisisLikelihood - Current crisis likelihood (0-100)
 * @returns {number} Impact score (0-100)
 */
function calculateActionImpact(action, crisisLikelihood = 50) {
  let impact = 0;
  
  // Priority multiplier
  const priorityImpact = {
    critical: 40,
    high: 30,
    medium: 20,
    low: 10
  };
  impact += priorityImpact[action.priority] || 0;
  
  // Time window multiplier (faster = more impact)
  const timeMatch = action.timeWindow.match(/(\d+)-(\d+)/);
  if (timeMatch) {
    const maxTime = parseInt(timeMatch[2]);
    const timeScore = Math.max(0, 30 - maxTime);
    impact += Math.max(0, timeScore);
  }
  
  // Crisis relevance
  impact += Math.min(30, crisisLikelihood / 2);
  
  return Math.min(100, impact);
}

/**
 * Rank all recommendations by effectiveness and urgency.
 * 
 * @param {Object[]} allActions - All generated actions
 * @param {number} crisisLikelihood - Crisis likelihood
 * @returns {Object[]} Sorted actions with impact scores
 */
function rankRecommendations(allActions = [], crisisLikelihood = 50) {
  return allActions
    .map(action => ({
      ...action,
      impactScore: calculateActionImpact(action, crisisLikelihood)
    }))
    .sort((a, b) => b.impactScore - a.impactScore);
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. COMPREHENSIVE RESPONSE PLAN
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Generate a complete response plan for the current situation.
 * Combines all phases of recommendations into a coherent strategy.
 * 
 * @param {Object} crisisPrediction - Crisis prediction
 * @param {Object[]} anomalies - Detected anomalies
 * @param {Object} kpis - Current KPIs
 * @param {Object[]} centerRisks - Center risk assessments
 * @returns {Object} Comprehensive response plan
 */
function generateComprehensiveResponsePlan(crisisPrediction, anomalies, kpis, centerRisks) {
  const immediateActions = generateImmediateActions(crisisPrediction, kpis, centerRisks);
  const shortTermActions = generateShortTermActions(crisisPrediction, anomalies, kpis);
  const mediumTermActions = generateMediumTermActions(crisisPrediction, anomalies, kpis);
  
  const allActions = [
    ...immediateActions,
    ...shortTermActions,
    ...mediumTermActions
  ];
  
  const rankedActions = rankRecommendations(allActions, crisisPrediction.likelihood);
  const resourcePlan = optimizeResourceAllocation(kpis);
  
  return {
    timestamp: Date.now(),
    crisisLevel: crisisPrediction.likelihood > 75 ? 'critical' : 
                 crisisPrediction.likelihood > 50 ? 'high' :
                 crisisPrediction.likelihood > 30 ? 'medium' : 'low',
    
    summary: {
      totalActions: allActions.length,
      criticalActions: allActions.filter(a => a.priority === 'critical').length,
      estimatedDuration: mediumTermActions.length > 0 ? '60-120 دقيقة' : '5-30 دقيقة',
      expectedOutcome: crisisPrediction.likelihood > 60 ? 'تقليل الأزمة بـ 40-60%' : 'منع تطور الأزمة'
    },
    
    phases: {
      immediate: {
        duration: '0-5 دقائق',
        actions: immediateActions.slice(0, 3),
        priority: 'تنفيذ فوري'
      },
      shortTerm: {
        duration: '5-30 دقيقة',
        actions: shortTermActions.slice(0, 3),
        priority: 'متابعة نشطة'
      },
      mediumTerm: {
        duration: '30 دقيقة - 2 ساعة',
        actions: mediumTermActions.slice(0, 3),
        priority: 'استقرار العمليات'
      }
    },
    
    resourceAllocation: resourcePlan,
    
    allRecommendations: rankedActions.slice(0, 15), // Top 15 actions
    
    successMetrics: {
      targetResponseTime: '≤ 12 دقيقة',
      targetLateRate: '≤ 8%',
      estimatedTimeToRecovery: '30-90 دقيقة',
      confidenceLevel: +(crisisPrediction.likelihood < 30 ? 95 : crisisPrediction.likelihood < 60 ? 80 : 70).toFixed(0) + '%'
    }
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ──────────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateImmediateActions,
    generateShortTermActions,
    generateMediumTermActions,
    optimizeResourceAllocation,
    calculateActionImpact,
    rankRecommendations,
    generateComprehensiveResponsePlan
  };
}
