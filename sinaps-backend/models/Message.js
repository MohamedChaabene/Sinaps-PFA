const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: String, enum: ['client', 'ia', 'humain'], required: true },
  authorName: { type: String },
  content: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);