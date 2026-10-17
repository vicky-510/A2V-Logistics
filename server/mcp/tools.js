const { Inventory, Shipment, TelemetryEvent, HealingLog } = require('../db/models');
const { calculateShortestPath } = require('../services/routingService');

/**
 * MCP (Model Context Protocol) tool definitions.
 * Each tool has a JSON-schema-like `spec` (for the agent/LLM to understand
 * how to call it) and an `execute` function that performs the action.
 *
 * In-memory fallback stores are used when MongoDB is not connected, so the
 * MCP server remains demoable without a live database.
 */

const memoryStore = {
  inventory: new Map([
    ['Godown A', { godownId: 'Godown A', stock: 5000, capacity: 10000 }],
    ['Godown B', { godownId: 'Godown B', stock: 3000, capacity: 8000 }],
  ]),
  shipments: new Map(),
};

function isDbConnected() {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1;
}

const tools = {
  get_godown_stock: {
    spec: {
      name: 'get_godown_stock',
      description: 'Check available stock at a given godown before dispatch.',
      parameters: {
        type: 'object',
        properties: {
          godownId: { type: 'string', description: 'Identifier of the godown, e.g. "Godown A"' },
        },
        required: ['godownId'],
      },
    },
    async execute({ godownId }) {
      if (isDbConnected()) {
        const record = await Inventory.findOne({ godownId });
        if (record) return { godownId, stock: record.stock, capacity: record.capacity };
      }
      const fallback = memoryStore.inventory.get(godownId);
      if (!fallback) throw new Error(`Unknown godown: ${godownId}`);
      return fallback;
    },
  },

  calculate_shortest_path: {
    spec: {
      name: 'calculate_shortest_path',
      description: 'Compute the shortest route between an origin and destination, optionally avoiding blocked edges.',
      parameters: {
        type: 'object',
        properties: {
          origin: { type: 'string' },
          destination: { type: 'string' },
          blockedEdges: { type: 'array', items: { type: 'string' }, description: 'Edges to avoid, formatted "NodeA--NodeB"' },
        },
        required: ['origin', 'destination'],
      },
    },
    async execute({ origin, destination, blockedEdges = [] }) {
      return calculateShortestPath({ origin, destination, blockedEdges });
    },
  },

  dispatch_carrier: {
    spec: {
      name: 'dispatch_carrier',
      description: 'Dispatch a carrier for a shipment along a given route.',
      parameters: {
        type: 'object',
        properties: {
          shipmentId: { type: 'string' },
          originGodownId: { type: 'string' },
          destination: { type: 'string' },
          units: { type: 'number' },
          route: { type: 'array' },
          etaMinutes: { type: 'number' },
          distanceKm: { type: 'number' },
          costEstimate: { type: 'number' },
        },
        required: ['shipmentId', 'originGodownId', 'destination', 'units'],
      },
    },
    async execute({ shipmentId, originGodownId, destination, units, route = [], etaMinutes = null, distanceKm = null, costEstimate = null }) {
      const carrier = `Carrier-${Math.floor(Math.random() * 900 + 100)}`;
      const record = {
        shipmentId,
        originGodownId,
        destination,
        units,
        route,
        etaMinutes,
        distanceKm,
        costEstimate,
        carrier,
        status: 'dispatched',
        currentPosition: route[0] || null,
      };
      if (isDbConnected()) {
        await Shipment.findOneAndUpdate({ shipmentId }, record, { upsert: true, new: true });
      } else {
        memoryStore.shipments.set(shipmentId, record);
      }
      return record;
    },
  },

  logistics_debugger: {
    spec: {
      name: 'logistics_debugger',
      description: 'Diagnose a telemetry disruption event (roadblock/breakdown/weather) and recommend a recovery action.',
      parameters: {
        type: 'object',
        properties: {
          shipmentId: { type: 'string' },
          eventType: { type: 'string', enum: ['roadblock', 'breakdown', 'weather', 'other'] },
          description: { type: 'string' },
        },
        required: ['shipmentId', 'eventType'],
      },
    },
    async execute({ shipmentId, eventType, description }) {
      const DIAGNOSES = {
        roadblock: `Roadblock detected on active route for shipment ${shipmentId}. Recommend bypass route excluding the blocked edge.`,
        breakdown: `Carrier breakdown detected for shipment ${shipmentId}. Recommend immediate carrier reassignment and reroute.`,
        weather: `Severe weather detected along the active route for shipment ${shipmentId}. Recommend a safer bypass route and revised ETA.`,
      };
      const diagnosis =
        DIAGNOSES[eventType] || `Disruption (${eventType}) detected for shipment ${shipmentId}: ${description || 'no details'}.`;
      return { shipmentId, eventType, diagnosis, recommendsReroute: true, recommendsCarrierReassignment: eventType === 'breakdown' };
    },
  },
};

function getToolSpecs() {
  return Object.values(tools).map((t) => t.spec);
}

async function callTool(name, args) {
  const tool = tools[name];
  if (!tool) throw new Error(`Unknown MCP tool: ${name}`);
  return tool.execute(args);
}

/** Looks up a shipment record from MongoDB (or the in-memory fallback). */
async function getShipment(shipmentId) {
  if (isDbConnected()) {
    return Shipment.findOne({ shipmentId });
  }
  return memoryStore.shipments.get(shipmentId) || null;
}

module.exports = { tools, getToolSpecs, callTool, memoryStore, getShipment };
