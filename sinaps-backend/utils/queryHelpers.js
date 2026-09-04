/**
 * Shared query helpers for Mongoose models to avoid repetitive population logic
 */

function populateConversation(query) {
  return query
    .populate('client', 'name avatar email')
    .populate('assignedAgent', 'name avatar');
}

module.exports = {
  populateConversation,
};
