const express = require('express');
const router = express.Router();
const passport = require('passport');
const { register, login, logout, me, refresh, listUsers, updateUserRole, deleteUser } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');
const { generateAccessToken, generateRefreshToken } = require('../utils/GenerateTokens');

// ─── Email / Password routes ───────────────────────────────────────────────

// Public
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

// Protected
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);

// User management
router.get('/users', requireAuth, listUsers);
router.patch('/users/:id/role', requireAuth, updateUserRole);
router.delete('/users/:id', requireAuth, deleteUser);

// ─── Google OAuth2 routes ──────────────────────────────────────────────────

// Step A: kick off the flow — redirects the browser to Google
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false // not using Passport sessions — we issue our own JWTs
}));

// Step B: Google redirects back here after user approves
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/` }),
  (req, res) => {
    // req.user was set by the Strategy's done(null, user) call
    const accessToken = generateAccessToken(req.user);
    const refreshToken = generateRefreshToken(req.user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,      // true in production (HTTPS)
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Can't return JSON here — this is a browser redirect, not a direct API call.
    // Pass the access token via URL query param so the /oauth-success page can grab it.
    res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${accessToken}`);
  }
);

module.exports = router;