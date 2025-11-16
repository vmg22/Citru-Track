const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/login', ctrl.login);
router.get('/me', authMiddleware, ctrl.me);

module.exports = router;
