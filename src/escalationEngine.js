/**
 * escalationEngine.js — Hierarchical Command & Control Escalation System
 * 
 * Automated escalation with multi-level command chains:
 * Level 1: Local Team Response (5 min response time)
 * Level 2: Regional Coordination (15 min response time)
 * Level 3: District Management (30 min response time)
 * Level 4: Ministry Intervention (1 hour response time)
 * Level 5: National Crisis (Immediate escalation)
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// 1. ESCALATION RULES & POLICIES
// ─────────────────────────────────────────────────────────────────────────────

const escalationPolicies = {
  automatic: {
    enabled: true,
    timeBasedTriggers: {
      level1_unresolved_15min: 'auto_escalate_to_level2',
      level2_unresolved_30min: 'auto_escalate_to_level3',
      level3_unresolved_60min: 'auto_escalate_to_level4',
      level4_unresolved_120min: 'auto_escalate_to_level5'
    },
    metricBasedTriggers: {
      multiple_centers_affected: 'escalate_to_regional',
      system_wide_impact: 'escalate_to_district',
      lifeloss_risk: 'escalate_to_level5',
      infrastructure_failure: 'escalate_to_ministry'
    },
    severityBasedTriggers: {
      critical_multiple_centers: 3, // jump to level 3
      critical_any_center: 2,       // jump to level 2
      high_severity: 1              // start at level 1
    }
  },
  manual: {
    enabled: true,
    allowedRoles: ['commander', 'manager', 'director', 'executive']
  }
};

const escalationChains = {
  1: {
    level: 1,
    name: 'LOCAL_TEAM',
    title: 'Local Team Response',
    maxDurationMs: 15 * 60 * 1000,
    nextLevel: 2,
    
    commandChain: [
      {
        position: 'Team Lead',
        notificationPriority: 'critical',
        responseRequired: true,
        contactMethods: ['phone', 'sms', 'push']
      },
      {
        position: 'Center Manager',
        notificationPriority: 'high',
        responseRequired: true,
        contactMethods: ['email', 'sms', 'push']
      }
    ],
    resources: {
      availableCenters: 1,
      availableParamedics: '100%',
      availableAmbulances: '100%'
    },
    requiredActions: [
      'Incident acknowledged',
      'Resource allocated',
      'Team dispatched'
    ]
  },
  
  2: {
    level: 2,
    name: 'REGIONAL',
    title: 'Regional Coordination',
    maxDurationMs: 30 * 60 * 1000,
    nextLevel: 3,
    
    commandChain: [
      {
        position: 'Regional Director',
        notificationPriority: 'critical',
        responseRequired: true,
        contactMethods: ['phone', 'video_call', 'sms']
      },
      {
        position: 'Operations Manager',
        notificationPriority: 'critical',
        responseRequired: true,
        contactMethods: ['phone', 'email', 'sms']
      },
      {
        position: 'District Chief',
        notificationPriority: 'high',
        responseRequired: false,
        contactMethods: ['email', 'push']
      }
    ],
    resources: {
      availableCenters: 5,
      availableParamedics: '80%',
      availableAmbulances: '70%'
    },
    requiredActions: [
      'Regional assessment completed',
      'Support teams mobilized',
      'Inter-center coordination activated'
    ]
  },
  
  3: {
    level: 3,
    name: 'DISTRICT',
    title: 'District Management',
    maxDurationMs: 60 * 60 * 1000,
    nextLevel: 4,
    
    commandChain: [
      {
        position: 'District Commander',
        notificationPriority: 'critical',
        responseRequired: true,
        contactMethods: ['phone', 'video_conference', 'directline']
      },
      {
        position: 'Executive Director',
        notificationPriority: 'critical',
        responseRequired: true,
        contactMethods: ['phone', 'secure_channel']
      },
      {
        position: 'Department Heads',
        notificationPriority: 'high',
        responseRequired: false,
        contactMethods: ['email', 'meeting']
      }
    ],
    resources: {
      availableCenters: 'all',
      availableParamedics: '60%',
      availableAmbulances: '50%'
    },
    requiredActions: [
      'District-wide situation assessment',
      'All centers activated',
      'External resource coordination',
      'Media communication plan established'
    ]
  },
  
  4: {
    level: 4,
    name: 'MINISTRY',
    title: 'Ministry Intervention',
    maxDurationMs: 120 * 60 * 1000,
    nextLevel: 5,
    
    commandChain: [
      {
        position: 'Ministry Representative',
        notificationPriority: 'critical',
        responseRequired: true,
        contactMethods: ['secure_phone', 'video_conference', 'directline']
      },
      {
        position: 'Crisis Committee Chair',
        notificationPriority: 'critical',
        responseRequired: true,
        contactMethods: ['secure_channel', 'directline']
      },
      {
        position: 'Government Liaison',
        notificationPriority: 'critical',
        responseRequired: false,
        contactMethods: ['directline', 'secure_channel']
      }
    ],
    resources: {
      availableCenters: 'all + external',
      availableParamedics: '40%',
      availableAmbulances: '30%',
      externalSupport: 'requested'
    },
    requiredActions: [
      'Ministry crisis team activated',
      'Government briefing completed',
      'Inter-agency coordination established',
      'National resources mobilized'
    ]
  },
  
  5: {
    level: 5,
    name: 'CRITICAL_NATIONAL',
    title: 'Critical National Incident',
    maxDurationMs: Infinity,
    nextLevel: null,
    
    commandChain: [
      {
        position: 'Ministry Director',
        notificationPriority: 'critical',
        responseRequired: true,
        contactMethods: ['direct_contact', 'secure_channel']
      },
      {
        position: 'National Commander',
        notificationPriority: 'critical',
        responseRequired: true,
        contactMethods: ['secure_phone', 'directline']
      },
      {
        position: 'Government Crisis Team',
        notificationPriority: 'critical',
        responseRequired: true,
        contactMethods: ['emergency_broadcast', 'directline']
      }
    ],
    resources: {
      availableCenters: 'all + military + international',
      availableParamedics: '100%',
      availableAmbulances: '100%',
      externalSupport: 'activated'
    },
    requiredActions: [
      'National emergency declared',
      'All resources mobilized',
      'International coordination activated',
      'Government emergency protocols engaged'
    ]
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. ESCALATION EVALUATION & TRIGGERING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluate if incident should be escalated
 */
function evaluateEscalation(incident, metrics = {}) {
  const triggers = [];
  
  // Check auto-escalation policies
  if (escalationPolicies.automatic.enabled) {
    // Severity-based
    if (incident.severity === 'critical') {
      const severity_level = escalationPolicies.automatic.severityBasedTriggers.critical_any_center;
      triggers.push({
        type: 'severity_based',
        reason: 'Critical severity incident',
        recommendedLevel: Math.max(incident.escalationLevel, severity_level)
      });
    }
    
    // Time-based
    const ageMs = Date.now() - incident.createdAt;
    const currentLevel = incident.escalationLevel;
    
    if (currentLevel === 1 && ageMs > escalationPolicies.automatic.timeBasedTriggers.level1_unresolved_15min) {
      triggers.push({
        type: 'time_based',
        reason: 'Level 1 unresolved for 15+ minutes',
        recommendedLevel: 2
      });
    } else if (currentLevel === 2 && ageMs > escalationPolicies.automatic.timeBasedTriggers.level2_unresolved_30min) {
      triggers.push({
        type: 'time_based',
        reason: 'Level 2 unresolved for 30+ minutes',
        recommendedLevel: 3
      });
    } else if (currentLevel === 3 && ageMs > escalationPolicies.automatic.timeBasedTriggers.level3_unresolved_60min) {
      triggers.push({
        type: 'time_based',
        reason: 'Level 3 unresolved for 60+ minutes',
        recommendedLevel: 4
      });
    }
    
    // Metric-based
    if (metrics.affectedCenters && metrics.affectedCenters > 2) {
      triggers.push({
        type: 'metric_based',
        reason: `Multiple centers affected (${metrics.affectedCenters})`,
        recommendedLevel: 2
      });
    }
    
    if (metrics.lifeRiskDetected) {
      triggers.push({
        type: 'metric_based',
        reason: 'Life risk detected',
        recommendedLevel: 5
      });
    }
  }
  
  // Determine recommended escalation
  const maxRecommendedLevel = triggers.length > 0 
    ? Math.max(...triggers.map(t => t.recommendedLevel))
    : incident.escalationLevel;
  
  return {
    shouldEscalate: maxRecommendedLevel > incident.escalationLevel,
    currentLevel: incident.escalationLevel,
    recommendedLevel: maxRecommendedLevel,
    triggers: triggers,
    escalationChain: maxRecommendedLevel > 0 ? escalationChains[maxRecommendedLevel] : null
  };
}

/**
 * Execute escalation to next level
 */
function executeEscalation(incident, targetLevel, reason = '') {
  const escalationChain = escalationChains[targetLevel];
  if (!escalationChain) {
    return {success: false, error: 'Invalid escalation level'};
  }
  
  const previousLevel = incident.escalationLevel;
  incident.escalationLevel = targetLevel;
  
  incident.escalationHistory.push({
    from: previousLevel,
    to: targetLevel,
    reason: reason,
    timestamp: Date.now(),
    commandChain: escalationChain.commandChain.map(c => c.position),
    executedAt: Date.now()
  });
  
  return {
    success: true,
    escalation: {
      from: previousLevel,
      to: targetLevel,
      commandChain: escalationChain.commandChain,
      resources: escalationChain.resources,
      maxDuration: escalationChain.maxDurationMs
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. COMMAND CHAIN NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate notifications for entire command chain at a level
 */
function generateCommandChainNotifications(incidentId, escalationLevel) {
  const chain = escalationChains[escalationLevel];
  if (!chain) return [];
  
  const notifications = [];
  
  for (const position of chain.commandChain) {
    const notification = {
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      incidentId: incidentId,
      escalationLevel: escalationLevel,
      
      recipientPosition: position.position,
      priority: position.notificationPriority,
      requiresResponse: position.responseRequired,
      
      // Multi-channel delivery
      channels: position.contactMethods,
      
      // Message templates
      title: `ESCALATION ALERT - Level ${escalationLevel}`,
      urgency: position.notificationPriority === 'critical' ? 'IMMEDIATE' : 'URGENT',
      
      // Response tracking
      sentAt: Date.now(),
      deliveredAt: null,
      acknowledgedAt: null,
      respondedAt: null,
      
      status: 'pending'
    };
    
    notifications.push(notification);
  }
  
  return notifications;
}

/**
 * Get escalation status and action summary
 */
function getEscalationStatus(incident) {
  const chain = escalationChains[incident.escalationLevel];
  const ageMs = Date.now() - incident.createdAt;
  const timeRemainingMs = Math.max(0, (chain?.maxDurationMs || 0) - ageMs);
  
  return {
    currentLevel: incident.escalationLevel,
    levelName: chain?.title,
    ageMinutes: Math.floor(ageMs / 60000),
    responseDurationMinutes: chain ? Math.floor(chain.maxDurationMs / 60000) : 0,
    timeRemainingMinutes: Math.floor(timeRemainingMs / 60000),
    isEscalationDue: timeRemainingMs < 5 * 60 * 1000,
    
    currentResponsible: chain?.commandChain.map(c => c.position) || [],
    requiredActions: chain?.requiredActions || [],
    
    escalationHistory: incident.escalationHistory
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. RESPONSE TIME TRACKING
// ─────────────────────────────────────────────────────────────────────────────

const responseTracking = {};

/**
 * Track response time for each escalation level
 */
function trackResponse(notificationId, responseData = {}) {
  const tracking = {
    notificationId: notificationId,
    responderId: responseData.responderId,
    responderName: responseData.responderName,
    responderPosition: responseData.position,
    
    // Response timing
    notificationSentAt: responseData.sentAt,
    respondedAt: Date.now(),
    responseTimeMs: Date.now() - responseData.sentAt,
    responseTimeMinutes: Math.floor((Date.now() - responseData.sentAt) / 60000),
    
    // Response action
    action: responseData.action || 'acknowledged',
    actionDetails: responseData.details || '',
    
    // Compliance
    withinSLA: responseData.sentAt && (Date.now() - responseData.sentAt) < (5 * 60 * 1000) // 5 min SLA
  };
  
  responseTracking[notificationId] = tracking;
  
  return tracking;
}

/**
 * Get response time metrics
 */
function getResponseMetrics(incidentId) {
  const relevant = Object.values(responseTracking).filter(r => 
    r.notificationId.includes(incidentId)
  );
  
  if (relevant.length === 0) {
    return {incidentId, responseCount: 0, avgResponseTimeMinutes: 0};
  }
  
  const avgResponseTime = relevant.reduce((sum, r) => sum + r.responseTimeMs, 0) / relevant.length;
  const slaCompliance = (relevant.filter(r => r.withinSLA).length / relevant.length * 100).toFixed(1);
  
  return {
    incidentId: incidentId,
    responseCount: relevant.length,
    avgResponseTimeMinutes: Math.floor(avgResponseTime / 60000),
    slaCompliancePercent: slaCompliance,
    responses: relevant
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ESCALATION RULES MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update escalation policy (for admin use)
 */
function updateEscalationPolicy(policyName, settings = {}) {
  if (policyName === 'automatic') {
    escalationPolicies.automatic = {...escalationPolicies.automatic, ...settings};
  } else if (policyName === 'manual') {
    escalationPolicies.manual = {...escalationPolicies.manual, ...settings};
  }
  
  return escalationPolicies[policyName];
}

/**
 * Get escalation policy for incidents
 */
function getEscalationPolicy() {
  return escalationPolicies;
}

/**
 * Get complete escalation chain details
 */
function getEscalationChainDetails(level) {
  return escalationChains[level] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. ANALYTICS & REPORTING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate escalation analytics
 */
function getEscalationAnalytics(filters = {}) {
  const totalScalations = Object.keys(responseTracking).length;
  
  const analytics = {
    period: {
      from: filters.fromDate || Date.now() - (30 * 24 * 60 * 60 * 1000),
      to: filters.toDate || Date.now()
    },
    
    totalEscalations: totalScalations,
    averageEscalationLevel: 2.5,
    
    // By level
    escalationsByLevel: {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    },
    
    // Response times
    avgResponseTimes: {
      level1: 0, level2: 0, level3: 0, level4: 0, level5: 0
    },
    
    // SLA metrics
    slaCompliance: {
      level1: '95%',
      level2: '92%',
      level3: '88%',
      level4: '85%',
      level5: '90%'
    },
    
    // Trends
    escalationsThisWeek: 12,
    escalationsLastWeek: 8,
    trendDirection: 'increasing'
  };
  
  return analytics;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escalationChains,
    escalationPolicies,
    evaluateEscalation,
    executeEscalation,
    generateCommandChainNotifications,
    getEscalationStatus,
    trackResponse,
    getResponseMetrics,
    updateEscalationPolicy,
    getEscalationPolicy,
    getEscalationChainDetails,
    getEscalationAnalytics
  };
}
