const Agent = require('../models/Agent');
const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

exports.loginAgent = async (req, res) => {
  try {
    const { email, password } = req.body;
    const agent = await Agent.findOne({ email });
    if (!agent) return res.status(401).json({ error: 'Identifiants invalides' });

    const match = await bcrypt.compare(password, agent.password);
    if (!match) return res.status(401).json({ error: 'Identifiants invalides' });

    if (agent.role === 'agent' && agent.status !== 'approved') {
      return res.status(403).json({ error: 'Compte en attente de validation' });
    }

    const token = jwt.sign(
      { id: agent._id, role: agent.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, agent: { id: agent._id, name: agent.name, email: agent.email, role: agent.role } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.signupAgent = async (req, res) => {
  try {
    const { name, email, password, skills } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const agent = await Agent.create({ name, email, password: hashedPassword, skills });
    res.status(201).json({ id: agent._id, name: agent.name, email: agent.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAgents = async (req, res) => {
  try {
    const agents = await Agent.find();
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.approveAgent = async (req, res) => {
  try {
    const agent = await Agent.findByIdAndUpdate(req.params.id, { status: 'approved' }, { returnDocument: 'after' });
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.rejectAgent = async (req, res) => {
  try {
    await Agent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Agent rejeté' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};