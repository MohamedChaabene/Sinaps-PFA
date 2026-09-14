const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { emitToConversation, emitGlobal } = require('../socket');
const { populateConversation } = require('../utils/queryHelpers');
const { QUICK_REPLY_ACTIONS, RESOLUTION_TYPES } = require('../utils/constants');

/**
 * Get the active (non-resolved) conversation for a client.
 * Returns the most recent active conversation based on lastActivityAt.
 * Returns null if no active conversation exists.
 * 
 * This ensures a client has at most one active conversation at a time.
 * If multiple active conversations exist (legacy data), returns the most recently active one.
 */
async function getActiveConversationForClient(clientId) {
  return await populateConversation(
    Conversation.findOne({
      client: clientId,
      status: { $ne: 'resolu' },
    }).sort({ lastActivityAt: -1 })
  );
}

// Créer une nouvelle conversation
exports.createConversation = async (req, res) => {
  try {
    const { clientId } = req.body;
    const conversation = await Conversation.create({
      client: clientId,
      lastActivityAt: new Date(),
      handledBy: 'ia'
    });
    const populated = await populateConversation(Conversation.findById(conversation._id));

    emitGlobal('conversation_created', populated);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer toutes les conversations (avec recherche et pagination optionnelle)
exports.getConversations = async (req, res) => {
  try {
    const { status, search, limit: rawLimit, page: rawPage, includeTestData } = req.query;
    const filter = {};
    if (status) filter.status = status;
    
    // Filter out test data by default unless explicitly requested
    if (includeTestData !== 'true') {
      filter.isTestData = { $ne: true };
    }

    let query = populateConversation(Conversation.find(filter)).sort({ updatedAt: -1 });

    if (rawLimit) {
      const limit = Math.min(parseInt(rawLimit, 10) || 50, 100);
      const page = Math.max(parseInt(rawPage, 10) || 1, 1);
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
    }

    let conversations = await query;

    if (search) {
      const term = search.toLowerCase();
      conversations = conversations.filter(
        (c) =>
          c.client?.name?.toLowerCase().includes(term) ||
          c.client?.email?.toLowerCase().includes(term)
      );
    }

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer une conversation avec ses messages
exports.getConversationById = async (req, res) => {
  try {
    const conversation = await populateConversation(Conversation.findById(req.params.id).lean());
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation introuvable' });
    }

    let messageQuery = Message.find({ conversation: req.params.id }).sort({ createdAt: 1 }).lean();
    if (req.query.limit) {
      const limit = Math.min(parseInt(req.query.limit, 10) || 100, 200);
      messageQuery = messageQuery.limit(limit);
    }

    const messages = await messageQuery;
    res.json({ conversation, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Basculer vers un agent humain
exports.escalateConversation = async (req, res) => {
  try {
    const conversation = await populateConversation(
      Conversation.findByIdAndUpdate(
        req.params.id,
        { handledBy: 'humain', status: 'en_attente' },
        { returnDocument: 'after' }
      )
    );

    emitToConversation(req.params.id, 'conversation_updated', conversation);
    emitGlobal('conversation_updated', conversation);

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Assigner un agent humain à la conversation
exports.assignAgent = async (req, res) => {
  try {
    const { agentId } = req.body;
    
    // Check if conversation is already assigned to a different agent
    const existingConversation = await Conversation.findById(req.params.id);
    if (!existingConversation) {
      return res.status(404).json({ error: 'Conversation introuvable' });
    }
    
    // Prevent stealing: if already assigned to another agent, reject unless admin
    if (existingConversation.assignedAgent && 
        existingConversation.assignedAgent.toString() !== agentId &&
        req.agent.role !== 'admin') {
      return res.status(403).json({ error: 'Cette conversation est déjà assignée à un autre agent' });
    }
    
    const conversation = await populateConversation(
      Conversation.findByIdAndUpdate(
        req.params.id,
        {
          assignedAgent: agentId,
          handledBy: 'humain',
          status: 'en_cours',
        },
        { returnDocument: 'after' }
      )
    );

    emitToConversation(req.params.id, 'conversation_updated', conversation);
    emitGlobal('conversation_updated', conversation);

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Clôturer une conversation avec satisfaction
exports.closeConversation = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const update = { status: 'resolu' };

    const numericRating = Number(rating);
    if (Number.isInteger(numericRating) && numericRating >= 1 && numericRating <= 5) {
      update.satisfaction = { rating: numericRating, comment: comment || '' };
    }

    // If called by an agent/admin, set resolution metadata
    if (req.agent) {
      update.resolvedBy = 'agent';
      update.resolvedAt = new Date();
      update.resolutionType = 'agent_resolved';
    }

    const conversation = await populateConversation(
      Conversation.findByIdAndUpdate(
        req.params.id,
        update,
        { returnDocument: 'after', runValidators: true }
      )
    );

    emitToConversation(req.params.id, 'conversation_updated', conversation);
    emitGlobal('conversation_updated', conversation);

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.findOrCreateConversation = async (req, res) => {
  try {
    const clientId = req.client.id;
    
    // Try to find existing active conversation
    let conversation = await getActiveConversationForClient(clientId);

    if (!conversation) {
      // Create new conversation if none exists
      conversation = await Conversation.create({ 
        client: clientId,
        lastActivityAt: new Date(),
        handledBy: 'ia'
      });
      conversation = await populateConversation(Conversation.findById(conversation._id));

      emitGlobal('conversation_created', conversation);
    }
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Basculer vers l'IA
exports.deescalateConversation = async (req, res) => {
  try {
    const conversation = await populateConversation(
      Conversation.findByIdAndUpdate(
        req.params.id,
        { handledBy: 'ia', status: 'en_cours' },
        { returnDocument: 'after' }
      )
    );

    emitToConversation(req.params.id, 'conversation_updated', conversation);
    emitGlobal('conversation_updated', conversation);

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Quick Reply action handler
exports.handleQuickReply = async (req, res) => {
  try {
    const { action, metadata } = req.body;
    const conversationId = req.params.id;

    // Validate action
    if (!action) {
      return res.status(400).json({ error: 'Action requise' });
    }

    const validActions = Object.values(QUICK_REPLY_ACTIONS);
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Action invalide' });
    }

    // Get current conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation introuvable' });
    }

    // Prevent actions on resolved conversations
    if (conversation.status === 'resolu') {
      return res.status(400).json({ error: 'Cette conversation est déjà résolue' });
    }

    const now = new Date();
    let update = { lastActivityAt: now };

    // Handle each action
    switch (action) {
      case QUICK_REPLY_ACTIONS.CONFIRM_RESOLVED:
        update.status = 'resolu';
        update.resolvedBy = 'client';
        update.resolvedAt = now;
        update.resolutionType = conversation.handledBy === 'ia' 
          ? RESOLUTION_TYPES.CLIENT_CONFIRMED_AI 
          : RESOLUTION_TYPES.CLIENT_CONFIRMED_AGENT;
        break;

      case QUICK_REPLY_ACTIONS.NO_ALL_DONE:
        update.status = 'resolu';
        update.resolvedBy = 'client';
        update.resolvedAt = now;
        update.resolutionType = conversation.handledBy === 'ia'
          ? RESOLUTION_TYPES.CLIENT_CONFIRMED_AI
          : RESOLUTION_TYPES.CLIENT_CONFIRMED_AGENT;
        break;

      case QUICK_REPLY_ACTIONS.YES_ANOTHER_QUESTION:
        // Keep conversation active, just update activity
        break;

      case QUICK_REPLY_ACTIONS.NEW_QUESTION:
        // Keep conversation active, just update activity
        break;

      case QUICK_REPLY_ACTIONS.NEED_MORE_HELP:
        // Keep conversation active, just update activity
        // Do not escalate to human - use ESCALATE_TO_HUMAN for that
        break;

      case QUICK_REPLY_ACTIONS.ESCALATE_TO_HUMAN:
        update.handledBy = 'humain';
        update.status = 'en_attente';
        update.escalationCount = (conversation.escalationCount || 0) + 1;
        update.lastEscalationOffer = now;
        break;

      case QUICK_REPLY_ACTIONS.RETRY_AI:
        update.aiAttemptCount = (conversation.aiAttemptCount || 0) + 1;
        update.handledBy = 'ia';
        update.status = 'en_cours';
        break;

      default:
        return res.status(400).json({ error: 'Action non supportée' });
    }

    const updatedConversation = await populateConversation(
      Conversation.findByIdAndUpdate(
        conversationId,
        update,
        { returnDocument: 'after', runValidators: true }
      )
    );

    // Emit conversation update via Socket.io
    emitToConversation(conversationId, 'conversation_updated', updatedConversation);
    emitGlobal('conversation_updated', updatedConversation);

    res.json({
      success: true,
      conversation: updatedConversation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
