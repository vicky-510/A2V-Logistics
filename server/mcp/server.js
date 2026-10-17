const { getToolSpecs, callTool } = require('./tools');

/**
 * Minimal MCP-style server surface. Exposes tool discovery and invocation
 * so an agent (or HTTP client) can call logistics tools explicitly,
 * mirroring the Model Context Protocol's tool-call pattern.
 */
function listTools() {
  return getToolSpecs();
}

async function invokeTool(name, args) {
  return callTool(name, args);
}

module.exports = { listTools, invokeTool };
