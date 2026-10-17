const express = require('express');
const { checkAccessCode, issueToken } = require('../services/authService');

const router = express.Router();

/**
 * POST /api/auth/login
 * body: { code: "<access code>" }
 * Single-credential login: no username, just a shared access code.
 */
router.post('/login', (req, res) => {
  const { code } = req.body || {};
  try {
    if (!checkAccessCode(code)) {
      return res.status(401).json({ ok: false, error: 'Invalid access code.' });
    }
    const token = issueToken();
    res.json({ ok: true, token });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
