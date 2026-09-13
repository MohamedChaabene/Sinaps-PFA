const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null },
  status: { type: String, enum: ['en_cours', 'en_attente', 'resolu'], default: 'en_cours' },
  handledBy: { type: String, enum: ['ia', 'humain'], default: 'ia' },
  satisfaction: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
  },
  // Resolution metadata
  resolvedBy: {
    type: String,
    enum: ['client', 'agent', 'system'],
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolutionType: {
    type: String,
    enum: [
      'client_confirmed_ai',
      'client_confirmed_agent',
      'agent_resolved',
      'abandoned'
    ],
    default: null
  },
  // Activity tracking
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  // AI tracking
  aiAttemptCount: {
    type: Number,
    default: 0,
    min: 0
  },
  escalationCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastEscalationOffer: {
    type: Date,
    default: null
  },
  // Test data marker
  isTestData: { type: Boolean, default: false }
}, { timestamps: true });

// Index for one active conversation per client
conversationSchema.index(
  { client: 1, status: 1 },
  {
    partialFilterExpression: {
      status: { $ne: 'resolu' }
    }
  }
);

conversationSchema.index({ status: 1 });
conversationSchema.index({ assignedAgent: 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ lastActivityAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);