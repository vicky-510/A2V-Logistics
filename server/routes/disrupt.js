const express = require('express');
const { TelemetryEvent } = require('../db/models');
const { runSelfHealingLoop } = require('../services/healingService');

module.exports = function createDisruptRouter(llmService) {
  const router = express.Router();

  /**
   * POST /api/disrupt
   * body: { shipmentId, eventType: "roadblock" | "breakdown" | "weather", description?, blockedEdge? }
   * Simulates a disruption and triggers the autonomous self-healing loop.
   */
  router.post('/', async (req, res) => {
    const { shipmentId, eventType = 'roadblock', description, blockedEdge } = req.body || {};
    if (!shipmentId) {
      return res.status(400).json({ error: 'shipmentId is required.' });
    }
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        await TelemetryEvent.create({ shipmentId, type: eventType, description });
      }
      const result = await runSelfHealingLoop({ shipmentId, eventType, description, blockedEdge, llmService });
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  return router;
};
