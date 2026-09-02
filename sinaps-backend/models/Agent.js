const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed
  role: { type: String, enum: ['agent', 'admin'], default: 'agent' },
  skills: [{ type: String }], // ex: ["réseau", "facturation"]
  status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
  avatar: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Agent', agentSchema);