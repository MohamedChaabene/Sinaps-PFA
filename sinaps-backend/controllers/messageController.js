const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { getAIResponse } = require('../services/geminiService');

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, sender, content, authorName } = req.body;

    const message = await Message.create({
      conversation: conversationId,
      sender,
      content,
      authorName,
    });

    await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() });

    let aiMessage = null;

    // Si c'est le client qui écrit, l'IA répond automatiquement
    if (sender === 'client') {
      const conversation = await Conversation.findById(conversationId);
      if (conversation.handledBy === 'ia') {
        const aiText = await getAIResponse(content);
        aiMessage = await Message.create({
          conversation: conversationId,
          sender: 'ia',
          content: aiText,
        });
      }
    }

    res.status(201).json({ message, aiMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};