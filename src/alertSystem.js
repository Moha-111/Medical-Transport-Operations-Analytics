/**
 * alertSystem.js — Intelligent Alert Management System
 * 
 * Manages alert generation, deduplication, escalation, and delivery.
 * Prevents alert fatigue through intelligent filtering and grouping.
 * 
 * Features:
 * 1. Smart Alert Generation — Only actionable alerts
 * 2. Deduplication — Prevent duplicate alerts
 * 3. Alert Grouping — Combine related alerts
 * 4. Priority Escalation — Increase priority if unresolved
 * 5. User Preferences — Learn from user behavior
 */

'use strict';

// ──────────────────────────────────────────────────────────────────────────────
// 1. ALERT GENERATION
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Generate alerts from anomalies and crisis predictions.
 * Only high-impact alerts are generated to prevent alert fatigue.
 * 
 * @param {Object[]} anomalies - Detected anomalies
 * @param {Object} crisisPrediction - Crisis prediction result
 * @param {Object} kpis - Current KPIs
 * @param {Object} previousAlerts - Previously sent alerts (for dedup)
 * @returns {Object[]} Array of alert objects
 */
function generateAlerts(anomalies = [], crisisPrediction, kpis, previousAlerts = {}) {
  const alerts = [];
  const now = Date.now();
  
  // Only generate alerts for significant anomalies
  const significantAnomalies = anomalies.filter(a => 
    a.severity === 'critical' || a.severity === 'high'
  );
  
  for (const anomaly of significantAnomalies) {
    const alertId = `alert_${hashAnomaly(anomaly)}`;
    
    // Skip if identical alert was sent recently (< 15 minutes)
    if (previousAlerts[alertId] && (now - previousAlerts[alertId]) < 15 * 60 * 1000) {
      continue;
    }
    
    alerts.push({
      id: alertId,
      timestamp: now,
      type: anomaly.type,
      severity: anomaly.severity,
      title: generateAlertTitle(anomaly),
      message: anomaly.message,
      detail: anomaly.detail || anomaly.message,
      actionableData: extractActionableData(anomaly),
      recommendedActions: generateAlertActions(anomaly, kpis),
      ttl: 60 * 60 * 1000, // 1 hour time-to-live
      channels: selectDeliveryChannels(anomaly.severity),
      status: 'new' // new, acknowledged, resolved, expired
    });
  }
  
  // Crisis likelihood alert
  if (crisisPrediction && crisisPrediction.likelihood > 50) {
    const crisisAlertId = `alert_crisis_${Math.floor(crisisPrediction.likelihood / 10) * 10}`;
    
    if (!previousAlerts[crisisAlertId] || (now - previousAlerts[crisisAlertId]) > 30 * 60 * 1000) {
      alerts.push({
        id: crisisAlertId,
        timestamp: now,
        type: 'crisis_likelihood',
        severity: crisisPrediction.likelihood > 75 ? 'critical' : 'high',
        title: '⚠️ تحذير من أزمة محتملة',
        message: crisisPrediction.message,
        detail: `احتمالية الأزمة: ${crisisPrediction.likelihood.toFixed(1)}%\nالعوامل الرئيسية: ${
          crisisPrediction.factors.slice(0, 2).map(f => f.name).join(', ')
        }`,
        actionableData: crisisPrediction,
        recommendedActions: [
          { action: 'عرض خطة الاستجابة', priority: 'high' },
          { action: 'تنسيق مع المراكز', priority: 'medium' }
        ],
        ttl: 2 * 60 * 60 * 1000, // 2 hours
        channels: selectDeliveryChannels('critical'),
        status: 'new'
      });
    }
  }
  
  // KPI threshold alert
  if (kpis.avgResp > 20) {
    const respAlertId = `alert_resp_${Math.floor(kpis.avgResp)}`;
    
    if (!previousAlerts[respAlertId]) {
      alerts.push({
        id: respAlertId,
        timestamp: now,
        type: 'threshold_breach',
        severity: kpis.avgResp > 25 ? 'critical' : 'high',
        title: '⏱️ تجاوز وقت الاستجابة الحد المسموح',
        message: `وقت الاستجابة المتوسط: ${kpis.avgResp.toFixed(1)} د (الحد الأقصى: 15 د)`,
        detail: `التزايد: ${((kpis.avgResp - 15) / 15 * 100).toFixed(0)}% أعلى من الهدف`,
        actionableData: { avgResp: kpis.avgResp, target: 15 },
        recommendedActions: [
          { action: 'زيادة عدد الفريق', priority: 'high' },
          { action: 'إعادة توزيع المهام', priority: 'high' }
        ],
        ttl: 60 * 60 * 1000,
        channels: ['web', 'email'],
        status: 'new'
      });
    }
  }
  
  return alerts.sort((a, b) => {
    const severityRank = { critical: 0, high: 1, medium: 2 };
    return (severityRank[a.severity] || 3) - (severityRank[b.severity] || 3);
  });
}

/**
 * Generate human-readable alert title.
 * 
 * @param {Object} anomaly - Anomaly object
 * @returns {string} Alert title
 */
function generateAlertTitle(anomaly) {
  const titles = {
    'response_time_spike': '⏱️ ارتفاع غير عادي في وقت الاستجابة',
    'high_load_alert': '📊 حمل عمل غير عادي',
    'high_late_rate': '📉 معدل تأخير مرتفع',
    'performance_drop': '📉 انخفاض أداء المركز',
    'resource_shortage': '⚠️ نقص في الموارد'
  };
  
  return titles[anomaly.type] || '⚠️ تحذير نظام';
}

/**
 * Extract actionable data from anomaly for quick actions.
 * 
 * @param {Object} anomaly - Anomaly object
 * @returns {Object} Actionable data
 */
function extractActionableData(anomaly) {
  const data = {
    type: anomaly.type,
    severity: anomaly.severity,
    value: anomaly.value,
    threshold: anomaly.threshold
  };
  
  if (anomaly.center) data.center = anomaly.center;
  if (anomaly.zScore) data.deviation = anomaly.zScore;
  if (anomaly.record) data.affectedRecord = anomaly.record;
  
  return data;
}

/**
 * Generate recommended actions for an alert.
 * 
 * @param {Object} anomaly - Anomaly object
 * @param {Object} kpis - Current KPIs
 * @returns {Object[]} Array of action recommendations
 */
function generateAlertActions(anomaly, kpis) {
  const actions = [];
  
  if (anomaly.type === 'response_time_spike') {
    actions.push({ action: 'زيادة عدد الفريق', priority: 'high', impact: '20-30% تحسن' });
    actions.push({ action: 'مراجعة الطرق', priority: 'medium', impact: 'كفاءة أفضل' });
  } else if (anomaly.type === 'high_load_alert') {
    actions.push({ action: 'طلب دعم من مركز آخر', priority: 'high', impact: 'توازن الحمل' });
    actions.push({ action: 'تفعيل الفريق الاحتياطي', priority: 'high', impact: 'قوة عاملة إضافية' });
  } else if (anomaly.type === 'high_late_rate') {
    actions.push({ action: 'إعادة تنظيم الجداول', priority: 'high', impact: 'توزيع أفضل' });
    actions.push({ action: 'وقف الطلبات الجديدة مؤقتاً', priority: 'medium', impact: 'إنهاء المهام الحالية' });
  }
  
  return actions;
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. ALERT DEDUPLICATION
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Simple hash function for anomaly deduplication.
 * 
 * @param {Object} anomaly - Anomaly object
 * @returns {string} Hash string
 */
function hashAnomaly(anomaly) {
  const str = `${anomaly.type}_${anomaly.severity}${anomaly.center || ''}${Math.floor(anomaly.value || 0)}`;
  return btoa(str).substring(0, 12); // Simple base64 hash
}

/**
 * Deduplicate alerts within same time window.
 * Merges identical alerts from different sources.
 * 
 * @param {Object[]} alerts - New alerts to send
 * @param {Object[]} recentAlerts - Recently sent alerts
 * @param {number} deduplicationWindow - Time window in ms (default 15 min)
 * @returns {Object[]} Deduplicated alerts
 */
function deduplicateAlerts(alerts, recentAlerts = [], deduplicationWindow = 15 * 60 * 1000) {
  const now = Date.now();
  const recent = recentAlerts.filter(a => (now - a.timestamp) < deduplicationWindow);
  const recentIds = new Set(recent.map(a => a.id));
  
  return alerts.filter(alert => !recentIds.has(alert.id));
}

/**
 * Group related alerts to reduce clutter.
 * 
 * @param {Object[]} alerts - Alerts to group
 * @returns {Object[]} Grouped alerts
 */
function groupAlerts(alerts) {
  const grouped = {};
  
  for (const alert of alerts) {
    const category = alert.type.split('_')[0]; // Extract main type
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(alert);
  }
  
  return Object.entries(grouped).map(([category, items]) => {
    if (items.length === 1) return items[0];
    
    // Create grouped alert
    return {
      id: `grouped_${category}_${Date.now()}`,
      timestamp: Math.min(...items.map(a => a.timestamp)),
      type: 'grouped_alert',
      severity: items.some(a => a.severity === 'critical') ? 'critical' : 'high',
      title: `📦 ${items.length} تنبيهات مرتبطة — ${category}`,
      message: `${items.length} تنبيهات عن مشاكل متعلقة بـ ${category}`,
      detail: items.map(a => `• ${a.message}`).join('\n'),
      alerts: items,
      channels: ['web', 'email']
    };
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. ALERT ESCALATION
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Escalate alert priority if no action taken within time limit.
 * 
 * @param {Object} alert - Alert to check
 * @param {number} escalationTime - Time before escalation (ms, default 30 min)
 * @returns {Object} Updated alert with escalated priority
 */
function escalateAlert(alert, escalationTime = 30 * 60 * 1000) {
  const now = Date.now();
  const elapsed = now - alert.timestamp;
  
  if (alert.status === 'new' && elapsed > escalationTime) {
    return {
      ...alert,
      severity: alert.severity === 'critical' ? 'critical' : 'critical',
      escalatedAt: now,
      escalationLevel: Math.floor(elapsed / escalationTime),
      channels: ['web', 'email', 'sms', 'push']
    };
  }
  
  return alert;
}

/**
 * Check if alert has expired.
 * 
 * @param {Object} alert - Alert to check
 * @returns {boolean} True if expired
 */
function isAlertExpired(alert) {
  return (Date.now() - alert.timestamp) > (alert.ttl || 60 * 60 * 1000);
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. DELIVERY CHANNEL SELECTION
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Select appropriate delivery channels based on severity.
 * 
 * @param {string} severity - 'critical', 'high', 'medium', 'low'
 * @returns {string[]} Array of channel names
 */
function selectDeliveryChannels(severity) {
  const channels = {
    critical: ['web', 'email', 'sms', 'push', 'webhook'],
    high:     ['web', 'email', 'push'],
    medium:   ['web', 'email'],
    low:      ['web']
  };
  
  return channels[severity] || ['web'];
}

/**
 * Format alert for specific delivery channel.
 * 
 * @param {Object} alert - Alert to format
 * @param {string} channel - Delivery channel
 * @returns {string} Formatted message for channel
 */
function formatAlertForChannel(alert, channel) {
  switch (channel) {
    case 'sms':
      return `⚠️ ${alert.title.substring(0, 100)}... ${alert.severity === 'critical' ? '🔴 عاجل' : '🟠 مهم'}`;
    
    case 'email':
      return `
<div style="direction: rtl; font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
  <h2 style="color: ${alert.severity === 'critical' ? '#FF5252' : '#F6A623'}; margin: 0;">
    ${alert.title}
  </h2>
  <p style="color: #666; margin: 10px 0;">
    ${alert.detail}
  </p>
  ${alert.recommendedActions?.length > 0 ? `
  <h4 style="color: #333;">الإجراءات الموصى بها:</h4>
  <ul>
    ${alert.recommendedActions.map(a => `<li>${a.action}</li>`).join('')}
  </ul>
  ` : ''}
  <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
  <small style="color: #999;">
    الوقت: ${new Date(alert.timestamp).toLocaleString('ar-SA')}
  </small>
</div>`;
    
    case 'push':
      return {
        title: alert.title,
        body: alert.message,
        icon: alert.severity === 'critical' ? '🔴' : '🟠',
        badge: 'unread'
      };
    
    case 'webhook':
      return JSON.stringify({
        alert: alert,
        timestamp: alert.timestamp,
        action_url: `/actions/${alert.id}`
      });
    
    default: // web
      return alert;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 5. ALERT HISTORY & LEARNING
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Track alert acknowledgment and resolution for learning.
 * 
 * @param {Object} alert - Alert that was acknowledged
 * @param {string} action - Action taken ('acknowledged', 'resolved', 'ignored')
 * @param {Object} actionData - Data about the action taken
 * @returns {Object} Updated alert with tracking
 */
function trackAlertAction(alert, action = 'acknowledged', actionData = {}) {
  return {
    ...alert,
    status: action === 'acknowledged' ? 'acknowledged' : action,
    acknowledgedAt: Date.now(),
    acknowledgedBy: actionData.user || 'system',
    actionTaken: actionData.action || 'none',
    feedback: actionData.feedback || null
  };
}

/**
 * Learn from alert effectiveness — track if recommendations were helpful.
 * 
 * @param {Object[]} alerts - List of past alerts with tracking data
 * @returns {Object} Learning metrics
 */
function analyzeAlertEffectiveness(alerts = []) {
  if (alerts.length === 0) return { avgResolutionTime: 0, actionRate: 0, effective: 0 };
  
  let totalResolutionTime = 0;
  let actionCount = 0;
  let resolvedCount = 0;
  
  for (const alert of alerts) {
    if (alert.acknowledgedAt && alert.timestamp) {
      totalResolutionTime += (alert.acknowledgedAt - alert.timestamp);
      actionCount++;
    }
    if (alert.status === 'resolved') {
      resolvedCount++;
    }
  }
  
  return {
    totalAlerts: alerts.length,
    avgResolutionTime: Math.round(totalResolutionTime / Math.max(1, actionCount) / 1000 / 60), // minutes
    actionRate: +(actionCount / alerts.length * 100).toFixed(1) + '%',
    resolutionRate: +(resolvedCount / alerts.length * 100).toFixed(1) + '%',
    effectiveness: actionCount > 0 ? 'good' : actionCount > alerts.length / 2 ? 'average' : 'needs_improvement'
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ──────────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateAlerts,
    generateAlertTitle,
    extractActionableData,
    generateAlertActions,
    hashAnomaly,
    deduplicateAlerts,
    groupAlerts,
    escalateAlert,
    isAlertExpired,
    selectDeliveryChannels,
    formatAlertForChannel,
    trackAlertAction,
    analyzeAlertEffectiveness
  };
}
