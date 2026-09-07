const express = require('express');
const router = express.Router();
const { createUser, getUsers, findOrCreateUser } = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.post('/find-or-create', findOrCreateUser);
router.post('/', requireAuth, requireAdmin, createUser);
router.get('/', requireAuth, requireAdmin, getUsers);

module.exports = router;