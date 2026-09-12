const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { getAIResponse } = require('../services/geminiService');
const { emitToConversation, emitGlobal } = require('../socket');
const { populateConversation } = require('../utils/queryHelpers');
const { QUICK_REPLY_ACTIONS } = require('../utils/constants');

/**
 * Generate standard Quick Replies for AI responses
 * These provide conversation flow control without requiring text parsing
 */
function getStandardQuickReplies() {
  return [
    {
      id: 'confirm-resolved',
      label: "👍 C'est ce qu'il me fallait",
      action: QUICK_REPLY_ACTIONS.CONFIRM_RESOLVED,
      metadata: {}
    },
    {
      id: 'new-question',
      label: '💬 J\'ai une autre question',
      action: QUICK_REPLY_ACTIONS.NEW_QUESTION,
      metadata: {}
    },
    {
      id: 'escalate-human',
      label: '👨‍💼 Parler à un agent',
      action: QUICK_REPLY_ACTIONS.ESCALATE_TO_HUMAN,
      metadata: {}
    }
  ];
}

/**
 * Generate Quick Replies for responses that indicate human help is needed
 * Used when AI cannot answer or indicates need for human assistance
 */
function getEscalationQuickReplies() {
  return [
    {
      id: 'escalate-human',
      label: '👨‍💼 Parler à un agent',
      action: QUICK_REPLY_ACTIONS.ESCALATE_TO_HUMAN,
      metadata: {}
    },
    {
      id: 'new-question',
      label: '💬 J\'ai une autre question',
      action: QUICK_REPLY_ACTIONS.NEW_QUESTION,
      metadata: {}
    }
  ];
}

/**
 * Detect if AI response indicates need for human escalation
 * Based on response content analysis
 */
function requiresEscalation(aiResponse) {
  const escalationIndicators = [
    'je ne peux pas répondre',
    'je n\'ai pas cette information',
    'je n\'ai pas trouvé de réponse',
    'cette question ne concerne pas',
    'mettre en relation avec un agent',
    'agent humain',
    'agent de support'
  ];
  
  const normalized = aiResponse.toLowerCase();
  return escalationIndicators.some(indicator => normalized.includes(indicator));
}

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
        
        // Choose appropriate Quick Replies based on response content
        const quickReplies = requiresEscalation(aiText) 
          ? getEscalationQuickReplies()
          : getStandardQuickReplies();
        
        aiMessage = await Message.create({
          conversation: conversationId,
          sender: 'ia',
          content: aiText,
          quickReplies
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
