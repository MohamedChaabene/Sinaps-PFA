const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { getAIResponse } = require('../services/geminiService');
const { emitToConversation, emitGlobal } = require('../socket');

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, sender, content, authorName } = req.body;

    const message = await Message.create({
      conversation: conversationId,
      sender,
      content,
      authorName,
    });

    const updatedConv = await Conversation.findByIdAndUpdate(
      conversationId,
      { updatedAt: new Date() },
      { new: true }
    )
      .populate('client', 'name avatar email')
      .populate('assignedAgent', 'name avatar');

    emitToConversation(conversationId, 'message_received', { message, conversation: updatedConv });
    emitGlobal('conversation_updated', updatedConv);

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

        const reUpdatedConv = await Conversation.findByIdAndUpdate(
          conversationId,
          { updatedAt: new Date() },
          { new: true }
        )
          .populate('client', 'name avatar email')
          .populate('assignedAgent', 'name avatar');

        emitToConversation(conversationId, 'message_received', {
          message: aiMessage,
          conversation: reUpdatedConv,
        });
        emitGlobal('conversation_updated', reUpdatedConv);
      }
    }

    res.status(201).json({ message, aiMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
