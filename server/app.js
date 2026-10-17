const express = require('express');
const cors = require('cors');
const { LLMService } = require('./services/llmService');
const dispatchRouter = require('./routes/dispatch');
const createDisruptRouter = require('./routes/disrupt');
const shipmentsRouter = require('./routes/shipments');
const logsRouter = require('./routes/logs');
const mcpRouter = require('./routes/mcp');

/**
 * Builds the Express app. Exported as a factory (rather than a started
 * server) so tests can mount it with supertest without binding a port,
 * and so Vercel's serverless handler can import it directly.
 */
function createApp({ llmService } = {}) {
  const app = express();
  const resolvedLlmService = llmService ?? new LLMService();

  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ ok: true, service: 'autoroute-ai-server' }));

  app.use('/api/dispatch', dispatchRouter);
  app.use('/api/disrupt', createDisruptRouter(resolvedLlmService));
  app.use('/api/shipments', shipmentsRouter);
  app.use('/api/logs', logsRouter);
  app.use('/api/mcp', mcpRouter);

  app.use((err, req, res, next) => {
    console.error('[Server] Unhandled error:', err);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
