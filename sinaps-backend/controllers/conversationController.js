const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { emitToConversation, emitGlobal } = require('../socket');
const { populateConversation } = require('../utils/queryHelpers');

// Créer une nouvelle conversation
exports.createConversation = async (req, res) => {
  try {
    const { clientId } = req.body;
    const conversation = await Conversation.create({ 
      client: clientId,
      lastActivityAt: new Date()
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
    const { status, search, limit: rawLimit, page: rawPage } = req.query;
    const filter = {};
    if (status) filter.status = status;

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
    const conversation = await populateConversation(Conversation.findById(req.params.id));
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation introuvable' });
    }

    let messageQuery = Message.find({ conversation: req.params.id }).sort({ createdAt: 1 });
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
    let conversation = await populateConversation(
      Conversation.findOne({
        client: clientId,
        status: { $ne: 'resolu' },
      }).sort({ createdAt: -1 })
    );

    if (!conversation) {
      conversation = await Conversation.create({ 
        client: clientId,
        lastActivityAt: new Date()
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
