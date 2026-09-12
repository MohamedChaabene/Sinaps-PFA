const express = require('express');
const router = express.Router();
const { requireAuth, requireAgentOrAdmin, requireClientAuth, requireConversationAccess } = require('../middleware/auth');
const {
  createConversation,
  getConversations,
  getConversationById,
  escalateConversation,
  deescalateConversation,
  assignAgent,
  closeConversation,
  findOrCreateConversation,
  handleQuickReply,
} = require('../controllers/conversationController');

router.post('/find-or-create', requireClientAuth, findOrCreateConversation);
router.post('/', requireAuth, requireAgentOrAdmin, createConversation);
router.get('/', requireAuth, getConversations);
router.get('/:id', requireConversationAccess, getConversationById);
router.patch('/:id/escalate', requireConversationAccess, escalateConversation);
router.patch('/:id/de-escalate', requireConversationAccess, deescalateConversation);
router.patch('/:id/assign', requireAuth, requireAgentOrAdmin, assignAgent);
router.patch('/:id/close', requireConversationAccess, closeConversation);
router.post('/:id/quick-reply', requireConversationAccess, handleQuickReply);

module.exports = router;
