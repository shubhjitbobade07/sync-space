const express = require('express');
const router = express.Router();
const { register, login, logout, me, refresh } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

// Public routes — no token required
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

// Protected routes — valid access token required
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);

module.exports = router;