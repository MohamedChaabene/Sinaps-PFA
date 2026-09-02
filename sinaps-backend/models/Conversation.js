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
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);