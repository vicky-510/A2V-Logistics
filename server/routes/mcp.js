const express = require('express');
const { listTools, invokeTool } = require('../mcp/server');

const router = express.Router();

/** GET /api/mcp/tools — list available MCP tool specs. */
router.get('/tools', (req, res) => {
  res.json(listTools());
});

/** POST /api/mcp/tools/:name/invoke — invoke a named MCP tool directly. */
router.post('/tools/:name/invoke', async (req, res) => {
  try {
    const result = await invokeTool(req.params.name, req.body || {});
    res.json({ ok: true, result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

module.exports = router;
