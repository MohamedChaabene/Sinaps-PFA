const express = require('express');
const router = express.Router();
const {
  createConversation,
  getConversations,
  getConversationById,
  escalateConversation,
  closeConversation,
  findOrCreateConversation,
} = require('../controllers/conversationController');

router.post('/find-or-create', findOrCreateConversation);
router.post('/', createConversation);
router.get('/', getConversations);
router.get('/:id', getConversationById);
router.patch('/:id/escalate', escalateConversation);
router.patch('/:id/close', closeConversation);

module.exports = router;    