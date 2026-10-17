const express = require('express');
const mongoose = require('mongoose');
const { Shipment, Inventory, HealingLog } = require('../db/models');
const { memoryStore } = require('../mcp/tools');

const router = express.Router();

router.get('/', async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const shipments = await Shipment.find().sort({ createdAt: -1 }).limit(50);
    return res.json(shipments);
  }
  res.json(Array.from(memoryStore.shipments.values()));
});

router.get('/inventory', async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const inventory = await Inventory.find();
    return res.json(inventory);
  }
  res.json(Array.from(memoryStore.inventory.values()));
});

router.get('/healing-logs', async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const logs = await HealingLog.find().sort({ createdAt: -1 }).limit(50);
    return res.json(logs);
  }
  res.json([]);
});

module.exports = router;
