const request = require('supertest');
const { createApp } = require('../app');

describe('HTTP routes', () => {
  const app = createApp({ llmService: { generate: jest.fn().mockResolvedValue({ text: 'ok', modelUsed: 'test', fallbackTriggered: false }) } });

  test('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('GET /api/mcp/tools lists the four MCP tools', async () => {
    const res = await request(app).get('/api/mcp/tools');
    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.name).sort()).toEqual([
      'calculate_shortest_path',
      'dispatch_carrier',
      'get_godown_stock',
      'logistics_debugger',
    ]);
  });

  test('POST /api/dispatch runs the pipeline for a valid order', async () => {
    const res = await request(app)
      .post('/api/dispatch')
      .send({ message: 'Ship 100 units from Godown A to Port 1' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.result.dispatch.status).toBe('dispatched');
  });

  test('POST /api/dispatch rejects a malformed message', async () => {
    const res = await request(app).post('/api/dispatch').send({ message: 'hello there' });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  test('POST /api/dispatch requires a message body', async () => {
    const res = await request(app).post('/api/dispatch').send({});
    expect(res.status).toBe(400);
  });

  test('POST /api/disrupt triggers the self-healing loop', async () => {
    await request(app).post('/api/dispatch').send({ message: 'Ship 50 units from Godown B to Hub 2' });

    const res = await request(app)
      .post('/api/disrupt')
      .send({ shipmentId: 'SHIP-TEST-1', eventType: 'roadblock', description: 'test roadblock' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.steps)).toBe(true);
  });

  test('POST /api/disrupt requires a shipmentId', async () => {
    const res = await request(app).post('/api/disrupt').send({ eventType: 'roadblock' });
    expect(res.status).toBe(400);
  });

  test('GET /api/shipments returns an array', async () => {
    const res = await request(app).get('/api/shipments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
