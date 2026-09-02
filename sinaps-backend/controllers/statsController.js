const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

exports.getStats = async (req, res) => {
  try {
    const total = await Conversation.countDocuments();
    const resolvedByIA = await Conversation.countDocuments({ status: 'resolu', handledBy: 'ia' });
    const resolvedByHuman = await Conversation.countDocuments({ status: 'resolu', handledBy: 'humain' });

    const satisfactionAgg = await Conversation.aggregate([
      { $match: { 'satisfaction.rating': { $exists: true, $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$satisfaction.rating' } } },
    ]);

    // Temps de réponse moyen : délai entre le 1er message client et la 1ère réponse (IA ou humain)
    const conversations = await Conversation.find();
    let totalResponseTime = 0;
    let countedConversations = 0;

    for (const conv of conversations) {
      const messages = await Message.find({ conversation: conv._id }).sort({ createdAt: 1 });
      const firstClientMsg = messages.find((m) => m.sender === 'client');
      const firstResponse = messages.find((m) => m.sender === 'ia' || m.sender === 'humain');
      if (firstClientMsg && firstResponse && firstResponse.createdAt > firstClientMsg.createdAt) {
        totalResponseTime += (firstResponse.createdAt - firstClientMsg.createdAt) / 1000;
        countedConversations++;
      }
    }

    const avgResponseTimeSeconds = countedConversations > 0 ? Math.round(totalResponseTime / countedConversations) : 0;

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