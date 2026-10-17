const express = require('express');
const { parseOrder, runDispatchPipeline } = require('../services/dispatchService');

const router = express.Router();

/**
 * POST /api/dispatch
 * body: { message: "Ship 200 units from Godown A to Port 3" }
 * Conversational text dispatcher — parses the order and runs the full
 * Godown -> Packaging -> Routing -> Dispatch pipeline.
 */
router.post('/', async (req, res) => {
  const { message } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Request body must include a "message" string.' });
  }
  try {
    const order = parseOrder(message);
    const result = await runDispatchPipeline(order);
    res.json({ ok: true, order, result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

module.exports = router;
