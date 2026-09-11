const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

exports.getStats = async (req, res) => {
  try {
    const [total, resolvedByIA, resolvedByHuman, satisfactionAgg, responseTimesAgg] = await Promise.all([
      Conversation.countDocuments(),
      Conversation.countDocuments({ status: 'resolu', handledBy: 'ia' }),
      Conversation.countDocuments({ status: 'resolu', handledBy: 'humain' }),
      Conversation.aggregate([
        { $match: { 'satisfaction.rating': { $exists: true, $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$satisfaction.rating' } } },
      ]),
      // Performance optimization: Calculate average response time directly via MongoDB aggregation pipeline
      // Prevents Out-Of-Memory (OOM) crashes by avoiding loading all database messages into Node.js heap.
      Message.aggregate([
        { $match: { sender: { $in: ['client', 'ia', 'humain'] } } },
        {
          $group: {
            _id: '$conversation',
            firstClient: {
              $min: {
                $cond: [{ $eq: ['$sender', 'client'] }, '$createdAt', null],
              },
            },
            firstResponse: {
              $min: {
                $cond: [{ $in: ['$sender', ['ia', 'humain']] }, '$createdAt', null],
              },
            },
          },
        },
        {
          $match: {
            firstClient: { $ne: null },
            firstResponse: { $ne: null },
          },
        },
        {
          $project: {
            diffSeconds: {
              $divide: [{ $subtract: ['$firstResponse', '$firstClient'] }, 1000],
            },
          },
        },
        {
          $match: {
            diffSeconds: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: '$diffSeconds' },
          },
        },
      ]),
    ]);

    const avgResponseTimeSeconds =
      responseTimesAgg.length > 0 && responseTimesAgg[0].avgResponseTime
        ? Math.round(responseTimesAgg[0].avgResponseTime)
        : 0;

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