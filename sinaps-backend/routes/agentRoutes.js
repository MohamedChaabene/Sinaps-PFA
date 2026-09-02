const express = require('express');
const router = express.Router();
const { signupAgent, getAgents, approveAgent, rejectAgent, loginAgent } = require('../controllers/agentController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.post('/signup', signupAgent);
router.post('/login', loginAgent);
router.get('/', requireAuth, requireAdmin, getAgents);
router.patch('/:id/approve', requireAuth, requireAdmin, approveAgent);
router.delete('/:id', requireAuth, requireAdmin, rejectAgent);

module.exports = router;