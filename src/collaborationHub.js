/**
 * collaborationHub.js — Real-Time Team Coordination & Communication Platform
 * 
 * Enables structured team collaboration during crisis response with:
 * - Incident command channels (chat groups)
 * - Action tracking and assignment
 * - Situation updates and briefings
 * - Resource coordination
 * - Decision logs
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// 1. INCIDENT COMMAND CHANNELS
// ─────────────────────────────────────────────────────────────────────────────

const commandChannels = {};
const channelMessages = {};
const channelMembers = {};

/**
 * Create incident command channel for team collaboration
 */
function createCommandChannel(incidentId, metadata = {}) {
  const channelId = `CH-${incidentId}-${Date.now()}`;
  
  const channel = {
    id: channelId,
    incidentId: incidentId,
    name: metadata.name || `Crisis Response - ${incidentId.substring(0, 12)}`,
    description: metadata.description || 'Incident command channel',
    topic: metadata.topic || 'Crisis Management',
    createdAt: Date.now(),
    createdBy: metadata.createdBy || 'system',
    
    // Channel settings
    isPrivate: true,
    requiresApproval: false,
    messageRetentionDays: metadata.messageRetentionDays || 90,
    
    // Members
    members: [],
    memberCount: 0,
    
    // Statistics
    messageCount: 0,
    lastActivityAt: null,
    
    // Status
    status: 'ACTIVE'
  };
  
  commandChannels[channelId] = channel;
  channelMessages[channelId] = [];
  channelMembers[channelId] = [];
  
  return channel;
}

/**
 * Add member to command channel
 */
function addChannelMember(channelId, member = {}) {
  const channel = commandChannels[channelId];
  if (!channel) return {success: false};
  
  const memberEntry = {
    id: member.id,
    name: member.name,
    role: member.role || 'Team Member',
    joinedAt: Date.now(),
    joinedBy: member.joinedBy || 'system',
    isActive: true,
    lastSeenAt: Date.now(),
    permissions: member.permissions || ['view', 'comment']
  };
  
  channelMembers[channelId].push(memberEntry);
  channel.members.push(memberEntry.id);
  channel.memberCount = channel.members.length;
  
  // Post system message
  postSystemMessage(channelId, {
    type: 'MEMBER_JOINED',
    content: `${member.name} joined the channel`,
    metadata: {memberId: member.id}
  });
  
  return {success: true, memberCount: channel.memberCount};
}

/**
 * Remove member from channel
 */
function removeChannelMember(channelId, memberId) {
  const channel = commandChannels[channelId];
  if (!channel) return {success: false};
  
  const memberIdx = channelMembers[channelId].findIndex(m => m.id === memberId);
  if (memberIdx === -1) return {success: false};
  
  const member = channelMembers[channelId][memberIdx];
  channelMembers[channelId].splice(memberIdx, 1);
  channel.members = channel.members.filter(id => id !== memberId);
  channel.memberCount = channel.members.length;
  
  postSystemMessage(channelId, {
    type: 'MEMBER_LEFT',
    content: `${member.name} left the channel`,
    metadata: {memberId: memberId}
  });
  
  return {success: true, memberCount: channel.memberCount};
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MESSAGING & COMMUNICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Post message to incident command channel
 */
function postMessage(channelId, message = {}) {
  const channel = commandChannels[channelId];
  if (!channel) return null;
  
  const msgId = `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const messageEntry = {
    id: msgId,
    channelId: channelId,
    author: {
      id: message.authorId,
      name: message.authorName
    },
    content: message.content,
    type: message.type || 'text',
    timestamp: Date.now(),
    editedAt: null,
    
    // Message metadata
    mentions: extractMentions(message.content),
    attachments: message.attachments || [],
    reactions: {},
    threadCount: 0,
    
    // Importance
    isPinned: false,
    isImportant: message.isImportant || false,
    priority: message.priority || 'normal'
  };
  
  channelMessages[channelId].push(messageEntry);
  channel.messageCount++;
  channel.lastActivityAt = Date.now();
  
  return messageEntry;
}

/**
 * Post system message (automated alerts, status changes)
 */
function postSystemMessage(channelId, message = {}) {
  return postMessage(channelId, {
    authorId: 'system',
    authorName: 'System',
    content: message.content,
    type: message.type || 'system',
    isImportant: message.type === 'ESCALATION' || message.type === 'CRITICAL'
  });
}

/**
 * Edit message
 */
function editMessage(channelId, messageId, newContent) {
  const messages = channelMessages[channelId];
  if (!messages) return {success: false};
  
  const message = messages.find(m => m.id === messageId);
  if (!message) return {success: false};
  
  message.content = newContent;
  message.editedAt = Date.now();
  
  return {success: true, editedAt: message.editedAt};
}

/**
 * React to message (emoji reactions)
 */
function reactToMessage(channelId, messageId, emoji) {
  const messages = channelMessages[channelId];
  if (!messages) return {success: false};
  
  const message = messages.find(m => m.id === messageId);
  if (!message) return {success: false};
  
  if (!message.reactions[emoji]) {
    message.reactions[emoji] = 0;
  }
  message.reactions[emoji]++;
  
  return {success: true, emoji: emoji, count: message.reactions[emoji]};
}

/**
 * Pin important message for visibility
 */
function pinMessage(channelId, messageId) {
  const messages = channelMessages[channelId];
  if (!messages) return {success: false};
  
  const message = messages.find(m => m.id === messageId);
  if (!message) return {success: false};
  
  message.isPinned = true;
  
  postSystemMessage(channelId, {
    type: 'MESSAGE_PINNED',
    content: 'Message pinned for visibility'
  });
  
  return {success: true};
}

/**
 * Get channel messages with pagination
 */
function getChannelMessages(channelId, limit = 50, offset = 0) {
  const messages = channelMessages[channelId] || [];
  return {
    total: messages.length,
    messages: messages.slice(Math.max(0, messages.length - offset - limit), messages.length - offset).reverse(),
    hasMore: offset + limit < messages.length
  };
}

/**
 * Extract mentions from content
 */
function extractMentions(content) {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ACTION TRACKING & ASSIGNMENT
// ─────────────────────────────────────────────────────────────────────────────

const incidentActions = {};

/**
 * Create action item assigned to team member
 */
function createAction(channelId, action = {}) {
  if (!incidentActions[channelId]) {
    incidentActions[channelId] = [];
  }
  
  const actionId = `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const actionItem = {
    id: actionId,
    channelId: channelId,
    title: action.title,
    description: action.description,
    
    // Assignment
    assignedTo: action.assignedTo || [],
    createdBy: action.createdBy,
    
    // Status
    status: 'OPEN',
    priority: action.priority || 'medium',
    
    // Timeline
    createdAt: Date.now(),
    dueAt: action.dueAt,
    completedAt: null,
    
    // Progress
    progress: 0,
    subtasks: action.subtasks || [],
    
    // Dependencies
    dependsOn: action.dependsOn || [],
    blockedBy: [],
    
    // Comments
    comments: [],
    attachments: action.attachments || []
  };
  
  incidentActions[channelId].push(actionItem);
  
  // Post action to channel
  const actionUrl = `#action/${actionId}`;
  postSystemMessage(channelId, {
    content: `📋 New action: ${action.title} (assigned to ${action.assignedTo.join(', ')})`,
    type: 'ACTION_CREATED',
    metadata: {actionId: actionId}
  });
  
  return actionItem;
}

/**
 * Update action status
 */
function updateActionStatus(channelId, actionId, newStatus) {
  const actions = incidentActions[channelId] || [];
  const action = actions.find(a => a.id === actionId);
  
  if (!action) return {success: false};
  
  const validStatuses = ['OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(newStatus)) return {success: false};
  
  const oldStatus = action.status;
  action.status = newStatus;
  
  if (newStatus === 'COMPLETED') {
    action.completedAt = Date.now();
  }
  
  // Post status update
  postSystemMessage(channelId, {
    content: `✓ Action "${action.title}" status changed to ${newStatus}`,
    type: 'ACTION_STATUS_CHANGED',
    metadata: {actionId: actionId, oldStatus, newStatus}
  });
  
  return {success: true, actionId, newStatus};
}

/**
 * List actions with filters
 */
function listActions(channelId, filters = {}) {
  const actions = incidentActions[channelId] || [];
  let results = [...actions];
  
  if (filters.status) {
    results = results.filter(a => a.status === filters.status);
  }
  
  if (filters.assignedTo) {
    results = results.filter(a => a.assignedTo.includes(filters.assignedTo));
  }
  
  if (filters.priority) {
    results = results.filter(a => a.priority === filters.priority);
  }
  
  return results.sort((a, b) => {
    // Sort by priority
    const priorityOrder = {critical: 1, high: 2, medium: 3, low: 4};
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    // Then by due date
    return (a.dueAt || Infinity) - (b.dueAt || Infinity);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SITUATION UPDATES & BRIEFINGS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create situation briefing/update
 */
function createSituationBriefing(channelId, briefing = {}) {
  const briefingId = `BRIEF-${Date.now()}`;
  
  const briefingEntry = {
    id: briefingId,
    channelId: channelId,
    type: briefing.type || 'SITREP', // SITREP, BRIEFING, UPDATE
    title: briefing.title || `Situation Report - ${new Date().toLocaleTimeString('ar-SA')}`,
    
    // Core information
    currentStatus: briefing.currentStatus || 'In Progress',
    keyMetrics: briefing.keyMetrics || {},
    affectedAreas: briefing.affectedAreas || [],
    
    // Response details
    responsePhase: briefing.responsePhase || 'Assessment',
    resourcesDeployed: briefing.resourcesDeployed || [],
    
    // Next steps
    nextActions: briefing.nextActions || [],
    anticipatedChallenges: briefing.anticipatedChallenges || [],
    
    // Context
    createdAt: Date.now(),
    createdBy: briefing.createdBy,
    importance: briefing.importance || 'normal'
  };
  
  // Post as pinned message
  const msgContent = formatBriefingMessage(briefingEntry);
  const message = postMessage(channelId, {
    authorId: briefing.createdBy || 'system',
    authorName: 'Command Center',
    content: msgContent,
    type: 'briefing',
    isImportant: briefing.importance === 'critical'
  });
  
  if (message) {
    pinMessage(channelId, message.id);
  }
  
  return briefingEntry;
}

function formatBriefingMessage(briefing) {
  return `
📊 **${briefing.title}**

🎯 **Current Status:** ${briefing.currentStatus}
📍 **Phase:** ${briefing.responsePhase}

${briefing.keyMetrics && Object.keys(briefing.keyMetrics).length > 0 ? `
📈 **Metrics:**
${Object.entries(briefing.keyMetrics).map(([key, val]) => `• ${key}: ${val}`).join('\n')}
` : ''}

${briefing.resourcesDeployed.length > 0 ? `
🚑 **Resources Deployed:**
${briefing.resourcesDeployed.map(r => `• ${r}`).join('\n')}
` : ''}

${briefing.nextActions.length > 0 ? `
➡️ **Next Actions:**
${briefing.nextActions.map(a => `• ${a}`).join('\n')}
` : ''}
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. DECISION LOGGING & KNOWLEDGE BASE
// ─────────────────────────────────────────────────────────────────────────────

const decisions = {};

/**
 * Log decision for audit trail and post-incident analysis
 */
function logDecision(channelId, decision = {}) {
  if (!decisions[channelId]) {
    decisions[channelId] = [];
  }
  
  const decisionId = `DEC-${Date.now()}`;
  
  const decisionEntry = {
    id: decisionId,
    channelId: channelId,
    title: decision.title,
    
    // Decision context
    context: decision.context,
    alternatives: decision.alternatives || [],
    chosenAlternative: decision.chosenAlternative,
    rationale: decision.rationale,
    
    // Timeline
    timestamp: Date.now(),
    madeBy: decision.madeBy,
    approvedBy: decision.approvedBy,
    
    // Impact
    expectedImpact: decision.expectedImpact,
    actualImpact: null,
    
    // References
    references: decision.references || [],
    relatedActions: decision.relatedActions || []
  };
  
  decisions[channelId].push(decisionEntry);
  
  postSystemMessage(channelId, {
    content: `📋 Decision logged: ${decision.title} (by ${decision.madeBy})`,
    type: 'DECISION_LOGGED',
    metadata: {decisionId: decisionId}
  });
  
  return decisionEntry;
}

/**
 * Get decision log for channel
 */
function getDecisionLog(channelId) {
  return decisions[channelId] || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. COLLABORATION METRICS
// ─────────────────────────────────────────────────────────────────────────────

function getChannelStats(channelId) {
  const channel = commandChannels[channelId];
  const messages = channelMessages[channelId] || [];
  const actions = incidentActions[channelId] || [];
  
  if (!channel) return null;
  
  const activeMembers = channelMembers[channelId] || [];
  const completedActions = actions.filter(a => a.status === 'COMPLETED').length;
  const pendingActions = actions.filter(a => ['OPEN', 'IN_PROGRESS'].includes(a.status)).length;
  
  return {
    channelId: channelId,
    incidentId: channel.incidentId,
    totalMembers: activeMembers.length,
    totalMessages: messages.length,
    totalActions: actions.length,
    completedActions: completedActions,
    pendingActions: pendingActions,
    completionRate: actions.length > 0 ? ((completedActions / actions.length) * 100).toFixed(1) + '%' : '0%',
    avgMessagesPerMember: activeMembers.length > 0 ? (messages.length / activeMembers. length).toFixed(1) : 0,
    lastActivityAt: channel.lastActivityAt,
    createdAt: channel.createdAt,
    ageMinutes: Math.floor((Date.now() - channel.createdAt) / 60000)
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createCommandChannel,
    addChannelMember,
    removeChannelMember,
    postMessage,
    postSystemMessage,
    editMessage,
    reactToMessage,
    pinMessage,
    getChannelMessages,
    createAction,
    updateActionStatus,
    listActions,
    createSituationBriefing,
    logDecision,
    getDecisionLog,
    getChannelStats
  };
}
