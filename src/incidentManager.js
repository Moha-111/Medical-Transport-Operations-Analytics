/**
 * incidentManager.js — Comprehensive Incident Lifecycle Management
 * 
 * Tracks incidents from detection through resolution with full audit trail,
 * automatic escalation, timeline tracking, and root cause analysis capabilities.
 * 
 * Incident Lifecycle:
 * 1. DETECTED — Alert triggered
 * 2. ASSESSED — Crisis level determined
 * 3. ACTIVATED — Response plan initiated
 * 4. ACTIVE — Crisis management in progress
 * 5. MITIGATING — Improvement actions underway
 * 6. RESOLVED — Issue corrected
 * 7. CLOSED — Post-incident review completed
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// 1. INCIDENT CREATION & TRACKING
// ─────────────────────────────────────────────────────────────────────────────

const incidentRegistry = {};
const incidentTimeline = {};
const incidentMetrics = {};

/**
 * Create new incident from alert
 */
function createIncident(alert, metadata = {}) {
  const incidentId = `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  const incident = {
    id: incidentId,
    alertId: alert.id,
    title: alert.title,
    description: alert.message,
    severity: alert.severity,
    status: 'DETECTED',
    createdAt: Date.now(),
    detectedAt: Date.now(),
    assessedAt: null,
    activatedAt: null,
    resolvedAt: null,
    closedAt: null,
    
    // Incident context
    center: alert.center,
    metric: alert.metric,
    initialValue: alert.value,
    threshold: alert.threshold,
    trend: metadata.trend || null,
    
    // Response tracking
    assignedTo: [],
    primaryResponder: null,
    commandCenter: null,
    
    // Escalation
    escalationLevel: 1,
    escalationHistory: [],
    autoEscalationEnabled: true,
    
    // Resolution tracking
    rootCause: null,
    correctionActions: [],
    preventiveMeasures: [],
    
    // Communication
    notifiedRecipients: [],
    broadcastIds: [],
    
    // Attachments
    documents: [],
    notes: [],
    
    // Custom fields
    custom: metadata.custom || {}
  };
  
  incidentRegistry[incidentId] = incident;
  incidentTimeline[incidentId] = {
    events: [{
      timestamp: Date.now(),
      type: 'CREATED',
      actor: 'system',
      details: 'Incident created from alert',
      metadata: {alertId: alert.id}
    }]
  };
  
  return incident;
}

/**
 * Get incident by ID
 */
function getIncident(incidentId) {
  return incidentRegistry[incidentId] || null;
}

/**
 * List incidents with filters
 */
function listIncidents(filters = {}) {
  let results = Object.values(incidentRegistry);
  
  if (filters.status) {
    results = results.filter(i => i.status === filters.status);
  }
  
  if (filters.severity) {
    const severityOrder = {critical: 1, high: 2, medium: 3, low: 4};
    const targetLevel = severityOrder[filters.severity] || 999;
    results = results.filter(i => severityOrder[i.severity] <= targetLevel);
  }
  
  if (filters.center) {
    results = results.filter(i => i.center === filters.center);
  }
  
  if (filters.assignedTo) {
    results = results.filter(i => i.assignedTo.includes(filters.assignedTo));
  }
  
  if (filters.fromDate && filters.toDate) {
    results = results.filter(i => i.createdAt >= filters.fromDate && i.createdAt <= filters.toDate);
  }
  
  return results.sort((a, b) => b.createdAt - a.createdAt);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. STATUS TRANSITIONS & WORKFLOW
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valid status transitions
 */
const statusTransitions = {
  'DETECTED': ['ASSESSED', 'ACKNOWLEDGED'],
  'ACKNOWLEDGED': ['ASSESSED'],
  'ASSESSED': ['ACTIVATED', 'IGNORED'],
  'ACTIVATED': ['ACTIVE'],
  'ACTIVE': ['MITIGATING', 'ESCALATED'],
  'MITIGATING': ['MONITORING', 'RESOLVED', 'ESCALATED'],
  'MONITORING': ['RESOLVED', 'ESCALATED'],
  'ESCALATED': ['ACTIVE', 'CRITICAL'],
  'CRITICAL': ['ACTIVE', 'MITIGATING'],
  'RESOLVED': ['CLOSED'],
  'IGNORED': ['CLOSED'],
  'CLOSED': []
};

/**
 * Update incident status with validation
 */
function updateIncidentStatus(incidentId, newStatus, actor = 'system', reason = '') {
  const incident = getIncident(incidentId);
  if (!incident) return {success: false, error: 'Incident not found'};
  
  const validTransitions = statusTransitions[incident.status] || [];
  if (!validTransitions.includes(newStatus)) {
    return {
      success: false,
      error: `Cannot transition from ${incident.status} to ${newStatus}`
    };
  }
  
  const oldStatus = incident.status;
  incident.status = newStatus;
  
  // Update timestamps
  const timestamp = Date.now();
  if (newStatus === 'ASSESSED') incident.assessedAt = timestamp;
  if (newStatus === 'ACTIVATED') incident.activatedAt = timestamp;
  if (newStatus === 'RESOLVED') incident.resolvedAt = timestamp;
  if (newStatus === 'CLOSED') incident.closedAt = timestamp;
  
  // Log transition
  addTimelineEvent(incidentId, {
    type: 'STATUS_CHANGE',
    actor: actor,
    details: `Status changed from ${oldStatus} to ${newStatus}`,
    reason: reason,
    metadata: {oldStatus, newStatus}
  });
  
  return {success: true, previousStatus: oldStatus, newStatus: newStatus};
}

/**
 * Acknowledge incident (first responder action)
 */
function acknowledgeIncident(incidentId, responder = {}) {
  const incident = getIncident(incidentId);
  if (!incident) return {success: false};
  
  if (incident.status !== 'DETECTED') {
    return {success: false, error: 'Incident already acknowledged'};
  }
  
  incident.primaryResponder = responder.id || 'unknown';
  updateIncidentStatus(incidentId, 'ACKNOWLEDGED', responder.id || 'system', 'Acknowledged by responder');
  
  addTimelineEvent(incidentId, {
    type: 'ACKNOWLEDGED',
    actor: responder.id,
    details: `Acknowledged by ${responder.name}`,
    metadata: {responderId: responder.id, responderName: responder.name}
  });
  
  return {success: true, acknowledgedAt: Date.now(), responder: responder.name};
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ASSIGNMENT & COMMAND STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assign incident to responder/team
 */
function assignIncident(incidentId, assignees = []) {
  const incident = getIncident(incidentId);
  if (!incident) return {success: false};
  
  incident.assignedTo = assignees.map(a => a.id);
  
  addTimelineEvent(incidentId, {
    type: 'ASSIGNED',
    actor: 'system',
    details: `Assigned to ${assignees.map(a => a.name).join(', ')}`,
    metadata: {assignees: assignees}
  });
  
  return {success: true, assignedCount: assignees.length};
}

/**
 * Set command center (incident commander)
 */
function setCommandCenter(incidentId, commander = {}) {
  const incident = getIncident(incidentId);
  if (!incident) return {success: false};
  
  incident.commandCenter = {
    id: commander.id,
    name: commander.name,
    role: commander.role || 'Incident Commander',
    since: Date.now()
  };
  
  addTimelineEvent(incidentId, {
    type: 'COMMAND_ASSIGNED',
    actor: 'system',
    details: `${commander.name} assigned as Incident Commander`,
    metadata: {commanderId: commander.id}
  });
  
  return {success: true, commander: commander.name};
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TIMELINE & AUDIT TRAIL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add event to incident timeline
 */
function addTimelineEvent(incidentId, event = {}) {
  if (!incidentTimeline[incidentId]) {
    incidentTimeline[incidentId] = {events: []};
  }
  
  const timelineEvent = {
    id: `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: event.timestamp || Date.now(),
    type: event.type || 'NOTE',
    actor: event.actor || 'system',
    details: event.details || '',
    reason: event.reason || '',
    metadata: event.metadata || {}
  };
  
  incidentTimeline[incidentId].events.push(timelineEvent);
  
  return timelineEvent.id;
}

/**
 * Get full incident timeline
 */
function getIncidentTimeline(incidentId) {
  return incidentTimeline[incidentId]?.events || [];
}

/**
 * Add note to incident
 */
function addIncidentNote(incidentId, note = '') {
  const incident = getIncident(incidentId);
  if (!incident) return {success: false};
  
  const noteEntry = {
    id: `NOTE-${Date.now()}`,
    timestamp: Date.now(),
    content: note,
    author: 'system'
  };
  
  incident.notes.push(noteEntry);
  addTimelineEvent(incidentId, {
    type: 'NOTE_ADDED',
    actor: 'system',
    details: `Note added: ${note.substring(0, 100)}...`
  });
  
  return noteEntry.id;
}

/**
 * Attach document to incident
 */
function attachDocument(incidentId, document = {}) {
  const incident = getIncident(incidentId);
  if (!incident) return {success: false};
  
  const docEntry = {
    id: `DOC-${Date.now()}`,
    name: document.name,
    type: document.type || 'attachment',
    url: document.url,
    uploadedAt: Date.now(),
    uploadedBy: document.uploadedBy || 'system'
  };
  
  incident.documents.push(docEntry);
  addTimelineEvent(incidentId, {
    type: 'DOCUMENT_ATTACHED',
    actor: document.uploadedBy || 'system',
    details: `Document attached: ${document.name}`
  });
  
  return docEntry.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. RESOLUTION & ROOT CAUSE ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Record resolution details
 */
function recordResolution(incidentId, resolution = {}) {
  const incident = getIncident(incidentId);
  if (!incident) return {success: false};
  
  incident.rootCause = resolution.rootCause || '';
  incident.correctionActions = resolution.correctionActions || [];
  incident.preventiveMeasures = resolution.preventiveMeasures || [];
  
  // Log transition to RESOLVED
  const statusResult = updateIncidentStatus(incidentId, 'RESOLVED', 'system', 'Resolution recorded');
  
  addTimelineEvent(incidentId, {
    type: 'RESOLUTION_RECORDED',
    actor: resolution.actor || 'system',
    details: `Root cause: ${resolution.rootCause}`,
    metadata: {
      rootCause: resolution.rootCause,
      actionCount: resolution.correctionActions.length,
      measures: resolution.preventiveMeasures.length
    }
  });
  
  return {success: true, resolutionId: `RES-${Date.now()}`};
}

/**
 * Close incident with post-incident review
 */
function closeIncident(incidentId, review = {}) {
  const incident = getIncident(incidentId);
  if (!incident) return {success: false};
  
  if (incident.status !== 'RESOLVED') {
    return {success: false, error: 'Incident must be resolved before closing'};
  }
  
  const postIncidentReview = {
    id: `PIR-${Date.now()}`,
    timestamp: Date.now(),
    duration: {
      detectedToResolved: incident.resolvedAt ? incident.resolvedAt - incident.detectedAt : 0,
      totalLifetime: Date.now() - incident.detectedAt
    },
    lessonsLearned: review.lessonsLearned || [],
    effectiveness: review.effectiveness || 'pending',
    recommendations: review.recommendations || [],
    reviewer: review.reviewer || 'system'
  };
  
  incident.postIncidentReview = postIncidentReview;
  updateIncidentStatus(incidentId, 'CLOSED', review.reviewer || 'system', 'Post-incident review completed');
  
  addTimelineEvent(incidentId, {
    type: 'CLOSED',
    actor: review.reviewer || 'system',
    details: 'Incident closed after post-incident review',
    metadata: { pirId: postIncidentReview.id }
  });
  
  return {success: true, pir: postIncidentReview};
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. ESCALATION MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Auto-escalate incident if unresolved
 */
function evaluateAndEscalate(incidentId) {
  const incident = getIncident(incidentId);
  if (!incident) return {escalated: false};
  
  if (!incident.autoEscalationEnabled) return {escalated: false};
  
  const age = Date.now() - incident.createdAt;
  const escalationThresholds = {
    1: 15 * 60 * 1000,      // 15 minutes to level 2
    2: 30 * 60 * 1000,      // 30 minutes to level 3
    3: 60 * 60 * 1000,      // 1 hour to level 4
    4: 2 * 60 * 60 * 1000   // 2 hours to level 5
  };
  
  const nextLevel = incident.escalationLevel + 1;
  const threshold = escalationThresholds[incident.escalationLevel];
  
  if (age >= threshold && nextLevel <= 5) {
    const previousLevel = incident.escalationLevel;
    incident.escalationLevel = nextLevel;
    
    incident.escalationHistory.push({
      from: previousLevel,
      to: nextLevel,
      reason: `Auto-escalated after ${Math.floor(age / 60000)} minutes without resolution`,
      timestamp: Date.now()
    });
    
    addTimelineEvent(incidentId, {
      type: 'ESCALATED',
      actor: 'system',
      details: `Auto-escalated from level ${previousLevel} to ${nextLevel}`,
      metadata: {previousLevel, newLevel: nextLevel, ageMinutes: Math.floor(age / 60000)}
    });
    
    return {escalated: true, previousLevel, newLevel: nextLevel};
  }
  
  return {escalated: false, currentLevel: incident.escalationLevel};
}

/**
 * Get escalation level details
 */
function getEscalationLevel(level) {
  const levels = {
    1: {
      name: 'LOCAL',
      description: 'Local team response',
      commandChain: ['Center Manager', 'Team Lead'],
      responseTime: '5 minutes',
      resources: 'In-house staff'
    },
    2: {
      name: 'REGIONAL',
      description: 'Regional coordination',
      commandChain: ['Regional Director', 'Operation Manager'],
      responseTime: '15 minutes',
      resources: 'Multi-center support'
    },
    3: {
      name: 'DISTRICT',
      description: 'District-wide coordination',
      commandChain: ['District Commander', 'Executive Director'],
      responseTime: '30 minutes',
      resources: 'All centers in district'
    },
    4: {
      name: 'MINISTRY',
      description: 'Ministry-level intervention',
      commandChain: ['Ministry Representative', 'Crisis Committee'],
      responseTime: '1 hour',
      resources: 'Ministry resources + external support'
    },
    5: {
      name: 'CRITICAL',
      description: 'Critical national incident',
      commandChain: ['Ministry Director', 'National Commander', 'Government'],
      responseTime: 'Immediate',
      resources: 'All available resources'
    }
  };
  
  return levels[level] || levels[1];
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. METRICS & REPORTING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate incident metrics for reporting
 */
function calculateIncidentMetrics(filters = {}) {
  const incidents = listIncidents(filters);
  
  const metrics = {
    totalIncidents: incidents.length,
    bySeverity: {critical: 0, high: 0, medium: 0, low: 0},
    byStatus: {
      active: 0,
      resolved: 0,
      closed: 0
    },
    avgResolutionTime: 0,
    avgTimeToEscalation: 0,
    maxEscalationLevel: 0,
    centerBreakdown: {}
  };
  
  let totalResolutionTime = 0;
  let resolvedCount = 0;
  
  for (const incident of incidents) {
    metrics.bySeverity[incident.severity]++;
    
    if (['ACTIVE', 'ESCALATED', 'CRITICAL'].includes(incident.status)) {
      metrics.byStatus.active++;
    } else if (incident.status === 'RESOLVED') {
      metrics.byStatus.resolved++;
      if (incident.resolvedAt) {
        totalResolutionTime += incident.resolvedAt - incident.detectedAt;
        resolvedCount++;
      }
    } else if (incident.status === 'CLOSED') {
      metrics.byStatus.closed++;
    }
    
    metrics.maxEscalationLevel = Math.max(metrics.maxEscalationLevel, incident.escalationLevel);
    
    if (incident.center) {
      if (!metrics.centerBreakdown[incident.center]) {
        metrics.centerBreakdown[incident.center] = {count: 0, resolved: 0};
      }
      metrics.centerBreakdown[incident.center].count++;
      if (incident.status === 'RESOLVED' || incident.status === 'CLOSED') {
        metrics.centerBreakdown[incident.center].resolved++;
      }
    }
  }
  
  metrics.avgResolutionTime = resolvedCount > 0 ? Math.round(totalResolutionTime / resolvedCount / 60000) : 0; // in minutes
  
  return metrics;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createIncident,
    getIncident,
    listIncidents,
    updateIncidentStatus,
    acknowledgeIncident,
    assignIncident,
    setCommandCenter,
    addTimelineEvent,
    getIncidentTimeline,
    addIncidentNote,
    attachDocument,
    recordResolution,
    closeIncident,
    evaluateAndEscalate,
    getEscalationLevel,
    calculateIncidentMetrics
  };
}
