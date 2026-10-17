const { verifyToken } = require('../services/authService');

/**
 * Protects routes behind the single-access-code login. Accepts the token
 * either as a Bearer header (normal fetch calls) or a `token` query param
 * (needed for the SSE log stream, since EventSource can't set headers).
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const headerToken = header.startsWith('Bearer ') ? header.slice(7) : null;
  const token = headerToken || req.query.token;
  if (!verifyToken(token)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized. Please log in.' });
  }
  next();
}

module.exports = { requireAuth };
