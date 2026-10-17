const { invokeTool } = require('../mcp/server');
const { emitLog } = require('../utils/eventBus');
const { listNodes } = require('./routingService');
const { estimateCost } = require('./costService');

/**
 * Parses a natural-language dispatch order, e.g.
 * "Ship 200 units from Godown A to Port 3"
 * into { units, origin, destination }. Deterministic regex parser so the
 * pipeline works without an LLM call; the chat layer may additionally use
 * Gemini for richer conversational replies.
 */
function parseOrder(text) {
  const match = text.match(/ship\s+(\d+)\s+units?\s+from\s+(.+?)\s+to\s+(.+)$/i);
  if (!match) {
    throw new Error(
      'Could not parse order. Expected format: "Ship <units> units from <origin> to <destination>".'
    );
  }
  const [, unitsStr, originRaw, destinationRaw] = match;
  const units = parseInt(unitsStr, 10);
  const origin = normalizeNode(originRaw.trim());
  const destination = normalizeNode(destinationRaw.trim());
  return { units, origin, destination };
}

function normalizeNode(raw) {
  const nodes = listNodes();
  const found = nodes.find((n) => n.toLowerCase() === raw.toLowerCase());
  if (!found) {
    throw new Error(`Unknown location "${raw}". Valid locations: ${nodes.join(', ')}`);
  }
  return found;
}

/**
 * Runs the full end-to-end pipeline: Godown (inventory check) -> Packaging
 * -> Shortest Path Routing -> Dispatch. Emits a log event per stage for the
 * live terminal panel.
 */
async function runDispatchPipeline({ units, origin, destination }) {
  const shipmentId = `SHIP-${Date.now()}`;

  emitLog({ shipmentId, actor: 'pipeline', message: `Inventory check at ${origin} for ${units} units...` });
  const stock = await invokeTool('get_godown_stock', { godownId: origin });
  if (stock.stock < units) {
    emitLog({ shipmentId, actor: 'pipeline', message: `Insufficient stock at ${origin}: ${stock.stock} available.` });
    throw new Error(`Insufficient stock at ${origin}: ${stock.stock} available, ${units} requested.`);
  }
  emitLog({ shipmentId, actor: 'pipeline', message: `Stock OK (${stock.stock} available). Proceeding to packaging.` });

  emitLog({ shipmentId, actor: 'pipeline', message: `Applying packaging protocol for ${units} units...` });

  emitLog({ shipmentId, actor: 'pipeline', message: `Calculating shortest route: ${origin} -> ${destination}...` });
  const pathResult = await invokeTool('calculate_shortest_path', { origin, destination });
  if (!pathResult.found) {
    emitLog({ shipmentId, actor: 'pipeline', message: `No route found from ${origin} to ${destination}.` });
    throw new Error(`No route found from ${origin} to ${destination}.`);
  }
  emitLog({
    shipmentId,
    actor: 'pipeline',
    message: `Route found: ${pathResult.path.join(' -> ')} (${pathResult.distanceKm} km, ETA ${pathResult.etaMinutes} min).`,
  });

  const costEstimate = estimateCost({ distanceKm: pathResult.distanceKm, units });
  emitLog({ shipmentId, actor: 'pipeline', message: `Estimated shipping cost: $${costEstimate.toFixed(2)}.` });

  emitLog({ shipmentId, actor: 'pipeline', message: `Dispatching carrier...` });
  const dispatch = await invokeTool('dispatch_carrier', {
    shipmentId,
    originGodownId: origin,
    destination,
    units,
    route: pathResult.route,
    etaMinutes: pathResult.etaMinutes,
    distanceKm: pathResult.distanceKm,
    costEstimate,
  });
  emitLog({ shipmentId, actor: 'pipeline', message: `Dispatched via ${dispatch.carrier}. Shipment ${shipmentId} is now in transit.` });

  return { shipmentId, stock, route: pathResult, dispatch, costEstimate };
}

module.exports = { parseOrder, runDispatchPipeline, normalizeNode };
