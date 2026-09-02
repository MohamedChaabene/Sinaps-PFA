const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/statsController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, requireAdmin, getStats);

module.exports = router;