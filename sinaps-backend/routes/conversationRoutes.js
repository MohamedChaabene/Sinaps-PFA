const express = require('express');
const router = express.Router();
const { requireAuth, requireAgentOrAdmin, requireClientAuth, requireConversationAccess } = require('../middleware/auth');
const {
  createConversation,
  getConversations,
  getConversationById,
  escalateConversation,
  assignAgent,
  closeConversation,
  findOrCreateConversation,
} = require('../controllers/conversationController');

router.post('/find-or-create', requireClientAuth, findOrCreateConversation);
router.post('/', createConversation);
router.get('/', requireAuth, getConversations);
router.get('/:id', requireConversationAccess, getConversationById);
router.patch('/:id/escalate', requireConversationAccess, escalateConversation);
router.patch('/:id/assign', requireAuth, requireAgentOrAdmin, assignAgent);
router.patch('/:id/close', requireConversationAccess, closeConversation);

module.exports = router;
