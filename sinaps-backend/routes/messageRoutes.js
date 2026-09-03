const express = require('express');
const router = express.Router();
const { sendMessage } = require('../controllers/messageController');
const { requireSenderAuth } = require('../middleware/auth');

router.post('/', requireSenderAuth, sendMessage);

module.exports = router;