const express = require('express');
const router = express.Router();
const { createUser, getUsers, findOrCreateUser } = require('../controllers/userController');

router.post('/find-or-create', findOrCreateUser);
router.post('/', createUser);
router.get('/', getUsers);

module.exports = router;