const request = require('supertest');
const { createApp } = require('../app');

describe('Single access-code auth', () => {
  const originalCode = process.env.APP_ACCESS_CODE;
  const originalSecret = process.env.AUTH_TOKEN_SECRET;

  beforeAll(() => {
    process.env.APP_ACCESS_CODE = 'test-code-123';
    process.env.AUTH_TOKEN_SECRET = 'test-secret-for-signing';
  });

  afterAll(() => {
    process.env.APP_ACCESS_CODE = originalCode;
    process.env.AUTH_TOKEN_SECRET = originalSecret;
  });

  const app = createApp({ llmService: { generate: jest.fn().mockResolvedValue({ text: 'ok', modelUsed: 'test', fallbackTriggered: false }) } });

  test('rejects an incorrect access code', async () => {
    const res = await request(app).post('/api/auth/login').send({ code: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
  });

  test('issues a token for the correct access code', async () => {
    const res = await request(app).post('/api/auth/login').send({ code: 'test-code-123' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.token).toBe('string');
  });

  test('blocks protected routes without a token', async () => {
    const res = await request(app).get('/api/shipments');
    expect(res.status).toBe(401);
  });

  test('blocks protected routes with an invalid token', async () => {
    const res = await request(app).get('/api/shipments').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  test('allows protected routes with a valid token', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ code: 'test-code-123' });
    const { token } = loginRes.body;

    const res = await request(app).get('/api/shipments').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('accepts a token passed as a query param (for the SSE log stream)', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ code: 'test-code-123' });
    const { token } = loginRes.body;

    const res = await request(app).get('/api/mcp/tools').query({ token });
    expect(res.status).toBe(200);
  });

  test('does not require auth for /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });
});
