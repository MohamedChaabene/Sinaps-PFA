const Conversation = require('../models/Conversation');

exports.getStats = async (req, res) => {
  try {
    const total = await Conversation.countDocuments();
    const resolvedByIA = await Conversation.countDocuments({ status: 'resolu', handledBy: 'ia' });
    const resolvedByHuman = await Conversation.countDocuments({ status: 'resolu', handledBy: 'humain' });

    const satisfactionAgg = await Conversation.aggregate([
      { $match: { 'satisfaction.rating': { $exists: true, $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$satisfaction.rating' } } },
    ]);

    res.json({
      total,
      resolvedByIA,
      resolvedByHuman,
      avgSatisfaction: satisfactionAgg[0]?.avg?.toFixed(1) || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};