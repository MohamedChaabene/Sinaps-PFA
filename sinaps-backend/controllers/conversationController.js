const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Créer une nouvelle conversation
exports.createConversation = async (req, res) => {
  try {
    const { clientId } = req.body;
    const conversation = await Conversation.create({ client: clientId });
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer toutes les conversations (pour la sidebar)
exports.getConversations = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;

    let query = Conversation.find(filter)
      .populate('client', 'name avatar email')
      .populate('assignedAgent', 'name avatar')
      .sort({ updatedAt: -1 });

    let conversations = await query;

    if (search) {
      const term = search.toLowerCase();
      conversations = conversations.filter((c) =>
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
    const conversation = await Conversation.findById(req.params.id)
      .populate('client', 'name avatar')
      .populate('assignedAgent', 'name avatar');
    const messages = await Message.find({ conversation: req.params.id }).sort({ createdAt: 1 });
    res.json({ conversation, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Basculer vers un agent humain
exports.escalateConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { handledBy: 'humain', status: 'en_attente' },
      { new: true }
    );
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Clôturer une conversation avec satisfaction
exports.closeConversation = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.id,
      { status: 'resolu', satisfaction: { rating, comment } },
      { new: true }
    );
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.findOrCreateConversation = async (req, res) => {
  try {
    const { clientId } = req.body;
    let conversation = await Conversation.findOne({
      client: clientId,
      status: { $ne: 'resolu' },
    }).sort({ createdAt: -1 });

    if (!conversation) {
      conversation = await Conversation.create({ client: clientId });
    }
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};