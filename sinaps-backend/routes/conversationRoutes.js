const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  createConversation,
  getConversations,
  getConversationById,
  escalateConversation,
  assignAgent,
  closeConversation,
  findOrCreateConversation,
} = require('../controllers/conversationController');

router.post('/find-or-create', findOrCreateConversation);
router.post('/', createConversation);
router.get('/', requireAuth, getConversations);
router.get('/:id', getConversationById);
router.patch('/:id/escalate', escalateConversation);
router.patch('/:id/assign', assignAgent);
router.patch('/:id/close', closeConversation);

module.exports = router;
