const crypto = require('crypto');

/**
 * Stateless single-access-code auth. Instead of storing sessions in memory
 * (which wouldn't survive across Vercel's independent serverless
 * invocations), the token is self-contained: base64(expiry) + "." + an
 * HMAC signature over it, verified with a server-side secret.
 */

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function getSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret) {
    throw new Error('AUTH_TOKEN_SECRET is not configured.');
  }
  return secret;
}

function sign(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

function checkAccessCode(code) {
  const expected = process.env.APP_ACCESS_CODE;
  if (!expected) {
    throw new Error('APP_ACCESS_CODE is not configured on the server.');
  }
  return typeof code === 'string' && code.length > 0 && code === expected;
}

function issueToken() {
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(String(expiresAt)).toString('base64url');
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  let expectedSignature;
  try {
    expectedSignature = sign(payload);
  } catch {
    return false;
  }

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return false;
  }

  const expiresAt = Number(Buffer.from(payload, 'base64url').toString('utf8'));
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}

module.exports = { checkAccessCode, issueToken, verifyToken, TOKEN_TTL_MS };
