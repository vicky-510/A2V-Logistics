const express = require('express');
const { eventBus } = require('../utils/eventBus');

const router = express.Router();

/**
 * GET /api/logs/stream — Server-Sent Events stream of live terminal logs
 * emitted by the dispatch pipeline and self-healing loop.
 */
router.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');

  const onLog = (entry) => {
    res.write(`data: ${JSON.stringify(entry)}\n\n`);
  };
  eventBus.on('log', onLog);

  req.on('close', () => {
    eventBus.off('log', onLog);
  });
});

module.exports = router;
