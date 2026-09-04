/**
 * communicationOrchestrator.js — Multi-Channel Emergency Communication Engine
 * 
 * Orchestrates real-time communication across 8+ channels with intelligent routing,
 * delivery verification, and compliance-aware message formatting.
 * 
 * Channels Supported:
 * - Web Dashboard (in-app notifications)
 * - Email (batch & real-time)
 * - SMS (critical alerts only)
 * - Push Notifications (mobile)
 * - Webhook (Make.com, Zapier, custom integrations)
 * - Voice Calls (Twilio integration ready)
 * - Chat Groups (Teams, Slack integration ready)
 * - Video Conference (Jitsi, Zoom integration ready)
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// 1. CHANNEL MANAGER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine optimal delivery channels based on alert severity and user preferences.
 * Uses intelligent routing to avoid alert fatigue while ensuring critical alerts reach recipients.
 */
function selectOptimalChannels(alert, userPreferences = {}, centerConfig = {}) {
  const channels = [];
  const severity = alert.severity || 'medium';
  const alertType = alert.alertType || 'anomaly';
  
  // Severity-based routing matrix
  const routingMatrix = {
    critical: ['web', 'email', 'sms', 'push', 'webhook', 'voice'],
    high: ['web', 'email', 'push', 'webhook'],
    medium: ['web', 'email', 'webhook'],
    low: ['web', 'webhook']
  };
  
  // Get base channels for severity level
  const baseChannels = routingMatrix[severity] || routingMatrix.medium;
  
  // Apply user preference filters
  const enabledChannels = userPreferences.enabledChannels || [];
  const disabledChannels = userPreferences.disabledChannels || [];
  
  for (const channel of baseChannels) {
    if (enabledChannels.length > 0 && !enabledChannels.includes(channel)) continue;
    if (disabledChannels.includes(channel)) continue;
    
    channels.push({
      name: channel,
      priority: getPriorityForChannel(channel, severity),
      deliveryMode: getDeliveryMode(channel, severity),
      retryPolicy: getRetryPolicy(channel, severity)
    });
  }
  
  return channels.sort((a, b) => b.priority - a.priority);
}

/**
 * Get priority score for a channel (higher = more important to deliver)
 */
function getPriorityForChannel(channel, severity) {
  const priorityMap = {
    voice: 100,      // Voice calls have highest priority in crisis
    sms: 95,
    push: 90,
    email: 80,
    web: 70,
    webhook: 60,
    chat: 50,
    video: 40
  };
  
  const basePriority = priorityMap[channel] || 50;
  const severityMultiplier = {critical: 1.0, high: 0.9, medium: 0.8, low: 0.7};
  
  return basePriority * (severityMultiplier[severity] || 0.7);
}

/**
 * Get delivery mode (immediate, batch, scheduled)
 */
function getDeliveryMode(channel, severity) {
  if (severity === 'critical') return 'immediate';
  if (channel === 'email' && severity === 'high') return 'batch'; // Batch emails to avoid spam
  if (channel === 'webhook') return 'immediate';
  return 'queued';
}

/**
 * Get retry policy for channel (max retries, backoff strategy)
 */
function getRetryPolicy(channel, severity) {
  const basePolicy = {
    maxRetries: severity === 'critical' ? 5 : 3,
    initialDelayMs: 1000,
    backoffMultiplier: 2,
    maxDelayMs: 30000
  };
  
  // Voice calls have more aggressive retry
  if (channel === 'voice' && severity === 'critical') {
    return { ...basePolicy, maxRetries: 7, maxDelayMs: 60000 };
  }
  
  return basePolicy;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MESSAGE FORMATTER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format alert message for specific channel with context-aware content.
 * Ensures compliance with channel limitations (SMS 160 chars, etc.)
 */
function formatMessageForChannel(alert, channel, recipientInfo = {}) {
  const timestamp = new Date(alert.timestamp).toLocaleTimeString('ar-SA');
  const severity = alert.severity.toUpperCase();
  
  const formats = {
    web: formatWebMessage(alert, recipientInfo),
    email: formatEmailMessage(alert, recipientInfo, timestamp),
    sms: formatSmsMessage(alert, severity, timestamp),
    push: formatPushMessage(alert, severity),
    webhook: formatWebhookMessage(alert, recipientInfo),
    voice: formatVoiceMessage(alert, recipientInfo),
    chat: formatChatMessage(alert, severity, timestamp),
    video: formatVideoMessage(alert, recipientInfo)
  };
  
  return formats[channel] || formats.web;
}

function formatWebMessage(alert, recipientInfo) {
  const severityColor = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#3b82f6'
  };
  
  return {
    type: 'web-notification',
    title: alert.title || 'تنبيه نظام',
    message: alert.message,
    description: alert.description,
    severity: alert.severity,
    color: severityColor[alert.severity],
    actionUrl: alert.actionUrl || null,
    icon: getIconForSeverity(alert.severity),
    soundEnabled: alert.severity !== 'low',
    requiresAck: alert.severity === 'critical'
  };
}

function formatEmailMessage(alert, recipientInfo, timestamp) {
  const htmlBody = `
    <div style="font-family: 'Cairo', sans-serif; direction: rtl; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1B3A6B, #0D7377); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 10px 0;">🚨 تنبيه حرج — نظام وصل</h2>
        <p style="margin: 0; opacity: 0.9;">التاريخ: ${timestamp}</p>
      </div>
      <div style="background: #f5f5f5; padding: 15px; border-right: 4px solid #ef4444; margin-bottom: 20px; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #1B3A6B;">${alert.title}</h3>
        <p style="margin: 0; color: #374151; line-height: 1.6;">${alert.message}</p>
        ${alert.details ? `<p style="margin: 10px 0 0 0; font-size: 13px; color: #6b7280;"><strong>التفاصيل:</strong> ${alert.details}</p>` : ''}
      </div>
      <div style="background: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 4px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 10px 0; color: #1B3A6B;">📊 البيانات الأساسية</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px; color: #6b7280;"><strong>المركز:</strong></td>
            <td style="padding: 8px; color: #1B3A6B;">${alert.center || 'N/A'}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px; color: #6b7280;"><strong>المؤشر:</strong></td>
            <td style="padding: 8px; color: #1B3A6B;">${alert.metric || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; color: #6b7280;"><strong>القيمة:</strong></td>
            <td style="padding: 8px; color: #1B3A6B;">${alert.value || 'N/A'}</td>
          </tr>
        </table>
      </div>
      ${alert.recommendedActions ? `
        <div style="background: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; border-radius: 4px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #1e40af;">💡 الإجراءات الموصى بها</h4>
          <ul style="margin: 0; padding-right: 20px; color: #1e40af;">
            ${alert.recommendedActions.map(action => `<li style="margin: 5px 0;">${action}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p>هذا البريد الإلكتروني من نظام وصل التلقائي — لا تردّ عليه مباشرة</p>
        <p><a href="#" style="color: #3b82f6; text-decoration: none;">عرض التفاصيل الكاملة</a></p>
      </div>
    </div>
  `;
  
  return {
    type: 'email',
    to: recipientInfo.email,
    subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
    htmlBody: htmlBody,
    textBody: `${alert.title}\n${alert.message}\nالمركز: ${alert.center}\nالمؤشر: ${alert.metric}`,
    replyTo: 'alerts-no-reply@wasl.system',
    priority: alert.severity === 'critical' ? 'high' : 'normal'
  };
}

function formatSmsMessage(alert, severity, timestamp) {
  // SMS limited to 160 chars, so be concise
  const severityPrefix = {
    critical: '🚨',
    high: '⚠️',
    medium: 'ℹ️',
    low: '📌'
  };
  
  const smsBody = `${severityPrefix[alert.severity.toLowerCase()]} وصل: ${alert.title.substring(0, 80)}`;
  
  return {
    type: 'sms',
    to: recipientInfo.phone,
    body: smsBody,
    priority: 'high'
  };
}

function formatPushMessage(alert, severity) {
  return {
    type: 'push-notification',
    title: alert.title.substring(0, 65),
    body: alert.message.substring(0, 240),
    badge: 1,
    sound: alert.severity !== 'low' ? 'default' : null,
    priority: alert.severity === 'critical' ? 'high' : 'default',
    data: {
      alertId: alert.id,
      severity: alert.severity,
      actionUrl: alert.actionUrl
    }
  };
}

function formatWebhookMessage(alert, recipientInfo) {
  return {
    type: 'webhook',
    timestamp: alert.timestamp,
    event: 'crisis.alert',
    severity: alert.severity,
    data: {
      id: alert.id,
      title: alert.title,
      message: alert.message,
      center: alert.center,
      metric: alert.metric,
      value: alert.value,
      threshold: alert.threshold,
      recommendedActions: alert.recommendedActions || []
    },
    source: 'wasl-ai',
    version: '2.0'
  };
}

function formatVoiceMessage(alert, recipientInfo) {
  // Text-to-speech conversion will handle Arabic
  return {
    type: 'voice-call',
    to: recipientInfo.phone,
    ttsText: `تنبيه حرج من نظام وصل. ${alert.title}. ${alert.message}.`,
    language: 'ar-SA',
    priority: 'high',
    maxDuration: 180, // 3 minutes max
    retryOnMissed: true
  };
}

function formatChatMessage(alert, severity, timestamp) {
  const severityEmoji = {critical: '🚨', high: '⚠️', medium: '⏱️', low: '📌'};
  
  return {
    type: 'chat',
    format: 'slack', // Also supports: teams, telegram
    text: `${severityEmoji[severity]} *${alert.title}*\n${alert.message}\n_${timestamp}_`,
    blocks: [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${severityEmoji[severity]} *${alert.title}*\n${alert.message}`
      }
    }],
    thread: alert.incidentId || null
  };
}

function formatVideoMessage(alert, recipientInfo) {
  return {
    type: 'video-conference',
    conferenceType: 'jitsi', // or 'zoom'
    roomName: `crisis-${alert.id.substring(0, 8)}`,
    title: alert.title,
    description: alert.message,
    participants: [recipientInfo.email],
    startImmediately: alert.severity === 'critical',
    recordSession: true
  };
}

function getIconForSeverity(severity) {
  const icons = {
    critical: '🚨',
    high: '⚠️',
    medium: '⏱️',
    low: '📌'
  };
  return icons[severity] || '📌';
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. DELIVERY MANAGER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Enhanced delivery system with tracking and verification
 */
const deliveryQueue = [];
const deliveryLog = {};

function deliverAlert(alert, channel, recipientInfo = {}) {
  const deliveryId = `${alert.id}_${channel}_${Date.now()}`;
  
  const delivery = {
    id: deliveryId,
    alertId: alert.id,
    channel: channel,
    recipient: recipientInfo,
    status: 'pending',
    message: formatMessageForChannel(alert, channel, recipientInfo),
    timestamp: Date.now(),
    attempts: 0,
    lastAttemptTime: null,
    retryCount: 0,
    maxRetries: getRetryPolicy(channel, alert.severity).maxRetries
  };
  
  deliveryQueue.push(delivery);
  deliveryLog[deliveryId] = delivery;
  
  // Attempt immediate delivery
  attemptDelivery(delivery);
  
  return deliveryId;
}

function attemptDelivery(delivery) {
  delivery.attempts++;
  delivery.lastAttemptTime = Date.now();
  
  // Simulate delivery based on channel
  // In production, this would use actual channel APIs
  
  switch(delivery.channel) {
    case 'web':
      delivery.status = 'delivered';
      break;
    case 'email':
      delivery.status = Math.random() > 0.05 ? 'delivered' : 'failed';
      break;
    case 'sms':
      delivery.status = Math.random() > 0.03 ? 'delivered' : 'failed';
      break;
    case 'push':
      delivery.status = Math.random() > 0.08 ? 'delivered' : 'failed';
      break;
    case 'webhook':
      delivery.status = Math.random() > 0.02 ? 'delivered' : 'failed';
      break;
    default:
      delivery.status = 'delivered';
  }
  
  // Schedule retry if failed
  if (delivery.status === 'failed' && delivery.retryCount < delivery.maxRetries) {
    delivery.retryCount++;
    const retryPolicy = getRetryPolicy(delivery.channel, 'high');
    const delayMs = Math.min(
      retryPolicy.initialDelayMs * Math.pow(retryPolicy.backoffMultiplier, delivery.retryCount - 1),
      retryPolicy.maxDelayMs
    );
    
    setTimeout(() => attemptDelivery(delivery), delayMs);
  }
  
  return delivery.status;
}

function getDeliveryStatus(deliveryId) {
  return deliveryLog[deliveryId] || null;
}

function getChannelStats(channel) {
  const relevant = Object.values(deliveryLog).filter(d => d.channel === channel);
  const delivered = relevant.filter(d => d.status === 'delivered').length;
  const failed = relevant.filter(d => d.status === 'failed').length;
  const pending = relevant.filter(d => d.status === 'pending').length;
  
  return {
    channel: channel,
    total: relevant.length,
    delivered: delivered,
    failed: failed,
    pending: pending,
    successRate: relevant.length > 0 ? ((delivered / relevant.length) * 100).toFixed(1) + '%' : 'N/A'
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. BROADCAST ORCHESTRATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send alert to multiple recipients via optimal channels
 * Returns delivery tracking IDs for monitoring
 */
function broadcastAlert(alert, recipients = [], priorityRecipients = []) {
  const deliveryIds = [];
  
  // Priority recipients get all channels
  for (const recipient of priorityRecipients) {
    const channels = selectOptimalChannels(alert, recipient.preferences, {});
    for (const channel of channels) {
      const deliveryId = deliverAlert(alert, channel.name, recipient);
      deliveryIds.push({
        recipientId: recipient.id,
        deliveryId: deliveryId,
        channel: channel.name
      });
    }
  }
  
  // Regular recipients get filtered channels
  for (const recipient of recipients) {
    const channels = selectOptimalChannels(alert, recipient.preferences, {});
    const topChannels = channels.slice(0, 2); // Only top 2 channels for regular recipients
    
    for (const channel of topChannels) {
      const deliveryId = deliverAlert(alert, channel.name, recipient);
      deliveryIds.push({
        recipientId: recipient.id,
        deliveryId: deliveryId,
        channel: channel.name
      });
    }
  }
  
  return {
    broadcastId: `broadcast_${alert.id}_${Date.now()}`,
    alertId: alert.id,
    totalDeliveries: deliveryIds.length,
    deliveries: deliveryIds,
    timestamp: Date.now()
  };
}

/**
 * Monitor broadcast delivery status in real-time
 */
function monitorBroadcast(broadcastId) {
  const stats = {
    broadcastId: broadcastId,
    totalDeliveries: 0,
    delivered: 0,
    failed: 0,
    pending: 0,
    channelBreakdown: {}
  };
  
  for (const delivery of deliveryQueue) {
    if (delivery.alertId.includes(broadcastId.split('_')[1])) {
      stats.totalDeliveries++;
      stats[delivery.status === 'delivered' ? 'delivered' : delivery.status === 'failed' ? 'failed' : 'pending']++;
      
      if (!stats.channelBreakdown[delivery.channel]) {
        stats.channelBreakdown[delivery.channel] = {delivered: 0, failed: 0, pending: 0};
      }
      stats.channelBreakdown[delivery.channel][delivery.status]++;
    }
  }
  
  return stats;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    selectOptimalChannels,
    formatMessageForChannel,
    deliverAlert,
    broadcastAlert,
    monitorBroadcast,
    getDeliveryStatus,
    getChannelStats
  };
}
