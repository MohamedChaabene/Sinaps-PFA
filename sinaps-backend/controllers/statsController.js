const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

exports.getStats = async (req, res) => {
  try {
    const [total, resolvedByIA, resolvedByHuman, satisfactionAgg] = await Promise.all([
      Conversation.countDocuments(),
      Conversation.countDocuments({ status: 'resolu', handledBy: 'ia' }),
      Conversation.countDocuments({ status: 'resolu', handledBy: 'humain' }),
      Conversation.aggregate([
        { $match: { 'satisfaction.rating': { $exists: true, $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$satisfaction.rating' } } },
      ]),
    ]);

    // Temps de réponse moyen : délai entre le 1er message client et la 1ère réponse (IA ou humain)
    // Optimisé en 1 seule requête globale au lieu d'une boucle N+1 séquentielle
    const messages = await Message.find({
      sender: { $in: ['client', 'ia', 'humain'] },
    }).sort({ createdAt: 1 });

    const conversationFirstMsgs = new Map();
    for (const msg of messages) {
      const convId = msg.conversation.toString();
      if (!conversationFirstMsgs.has(convId)) {
        conversationFirstMsgs.set(convId, { firstClient: null, firstResponse: null });
      }
      const state = conversationFirstMsgs.get(convId);
      if (!state.firstClient && msg.sender === 'client') {
        state.firstClient = msg;
      } else if (!state.firstResponse && (msg.sender === 'ia' || msg.sender === 'humain')) {
        state.firstResponse = msg;
      }
    }

    let totalResponseTime = 0;
    let countedConversations = 0;

    for (const [, state] of conversationFirstMsgs) {
      if (
        state.firstClient &&
        state.firstResponse &&
        state.firstResponse.createdAt > state.firstClient.createdAt
      ) {
        totalResponseTime += (state.firstResponse.createdAt - state.firstClient.createdAt) / 1000;
        countedConversations++;
      }
    }

    const avgResponseTimeSeconds =
      countedConversations > 0 ? Math.round(totalResponseTime / countedConversations) : 0;

    res.json({
      total,
      resolvedByIA,
      resolvedByHuman,
      avgSatisfaction: satisfactionAgg[0]?.avg?.toFixed(1) || 0,
      avgResponseTimeSeconds,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};