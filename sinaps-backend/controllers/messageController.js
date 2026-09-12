const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { getAIResponse } = require('../services/geminiService');
const { emitToConversation, emitGlobal } = require('../socket');
const { populateConversation } = require('../utils/queryHelpers');

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, sender, content, authorName, attachments } = req.body;

    const message = await Message.create({
      conversation: conversationId,
      sender,
      content: content || '',
      authorName,
      attachments: attachments || [],
    });

    const updatedConv = await populateConversation(
      Conversation.findByIdAndUpdate(
        conversationId,
        { updatedAt: new Date(), lastActivityAt: new Date() },
        { returnDocument: 'after' }
      )
    );

    emitToConversation(conversationId, 'message_received', { message, conversation: updatedConv });
    emitGlobal('conversation_updated', updatedConv);

    let aiMessage = null;

    // Si c'est le client qui écrit, l'IA répond automatiquement
    if (sender === 'client' && updatedConv?.handledBy === 'ia') {
      // IMP-012: Emit typing indicator to conversation room
      emitToConversation(conversationId, 'typing_status', {
        conversationId,
        isTyping: true,
        sender: 'ia',
        authorName: 'Assistant IA Sinaps',
      });

      try {
        const aiText = await getAIResponse(content || 'Document joint');
        aiMessage = await Message.create({
          conversation: conversationId,
          sender: 'ia',
          content: aiText,
        });

        const reUpdatedConv = await populateConversation(
          Conversation.findByIdAndUpdate(
            conversationId,
            { updatedAt: new Date(), lastActivityAt: new Date() },
            { returnDocument: 'after' }
          )
        );

        emitToConversation(conversationId, 'message_received', {
          message: aiMessage,
          conversation: reUpdatedConv,
        });
        emitGlobal('conversation_updated', reUpdatedConv);
      } finally {
        emitToConversation(conversationId, 'typing_status', {
          conversationId,
          isTyping: false,
          sender: 'ia',
        });
      }
    }

    res.status(201).json({ message, aiMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
