const { Shipment, TelemetryEvent, HealingLog } = require('../db/models');
const { invokeTool } = require('../mcp/server');
const { getShipment } = require('../mcp/tools');
const { emitLog } = require('../utils/eventBus');
const { estimateCost } = require('./costService');

/**
 * The self-healing feedback loop.
 * Given a simulated disruption on a shipment's active route (roadblock,
 * breakdown, or weather), this:
 *  1. Diagnoses the failure via the `logistics_debugger` MCP tool.
 *  2. Uses the Gemini LLM (with fallback) to narrate/confirm the diagnosis.
 *  3. For a breakdown, reassigns a new carrier.
 *  4. Recalculates a bypass route via `calculate_shortest_path`, excluding
 *     the blocked edge (for roadblocks/weather).
 *  5. Compares the shipping cost before vs. after the reroute.
 *  6. Persists the updated shipment + a HealingLog of every step.
 *  7. Emits each step as a live log event for the frontend terminal panel.
 */
async function isDbConnected() {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1;
}

const DEFAULT_UNITS_IF_UNKNOWN = 100;

async function runSelfHealingLoop({ shipmentId, eventType, description, blockedEdge, llmService }) {
  const steps = [];
  const log = (actor, message) => {
    const entry = { actor, message };
    steps.push(entry);
    emitLog({ shipmentId, actor, message });
    return entry;
  };

  log('telemetry', `Disruption event received: ${eventType} on shipment ${shipmentId}. ${description || ''}`.trim());

  // Step 1: diagnose via MCP debugger tool
  const diagnosis = await invokeTool('logistics_debugger', { shipmentId, eventType, description });
  log('logistics_debugger', diagnosis.diagnosis);

  // Step 2: ask the LLM agent to narrate the recovery plan (with fallback middleware)
  let modelUsed = 'none';
  let fallbackTriggered = false;
  if (llmService) {
    try {
      const prompt =
        `You are a logistics self-healing agent. A ${eventType} disrupted shipment ${shipmentId}. ` +
        `Diagnosis: ${diagnosis.diagnosis} In one sentence, state the recovery action you will take.`;
      const { text, modelUsed: used, fallbackTriggered: fb } = await llmService.generate(prompt);
      modelUsed = used;
      fallbackTriggered = fb;
      log('gemini-agent', text.trim());
      if (fb) log('system', `Fallback model "${used}" used due to primary quota/timeout.`);
    } catch (err) {
      log('gemini-agent', `LLM narration unavailable (${err.message}); proceeding with rule-based recovery.`);
    }
  }

  const shipment = await getShipment(shipmentId);
  const units = shipment?.units ?? DEFAULT_UNITS_IF_UNKNOWN;
  const costBefore = shipment?.costEstimate ?? null;

  // Step 3: for a breakdown, reassign the carrier before touching the route
  let carrier = shipment?.carrier ?? null;
  if (diagnosis.recommendsCarrierReassignment) {
    carrier = `Carrier-${Math.floor(Math.random() * 900 + 100)}`;
    log('logistics_debugger', `Carrier reassigned to ${carrier}.`);
  }

  // Step 4: find current shipment route to determine origin/destination for reroute
  const origin = shipment?.route?.[0]?.label || 'Godown A';
  const destination = shipment?.destination || 'Port 3';

  const pathResult = await invokeTool('calculate_shortest_path', {
    origin,
    destination,
    blockedEdges: blockedEdge ? [blockedEdge] : [],
  });

  if (!pathResult.found) {
    log('calculate_shortest_path', `No bypass route found for ${origin} -> ${destination}.`);
    const healingLog = await persistHealingLog({
      shipmentId, steps, diagnosis: diagnosis.diagnosis, newRoute: [], modelUsed, fallbackTriggered, outcome: 'failed', costBefore, costAfter: null,
    });
    return { healed: false, steps, healingLog };
  }

  log('calculate_shortest_path', `Bypass route found: ${pathResult.path.join(' -> ')} (${pathResult.distanceKm} km, ETA ${pathResult.etaMinutes} min).`);

  // Step 5: cost comparison
  const costAfter = estimateCost({ distanceKm: pathResult.distanceKm, units });
  if (costBefore !== null) {
    const delta = costAfter - costBefore;
    const direction = delta > 0 ? 'increased' : delta < 0 ? 'decreased' : 'unchanged';
    log(
      'cost-estimator',
      `Shipping cost ${direction}: $${costBefore.toFixed(2)} -> $${costAfter.toFixed(2)} (${delta >= 0 ? '+' : ''}$${delta.toFixed(2)}).`
    );
  } else {
    log('cost-estimator', `Recalculated shipping cost for the bypass route: $${costAfter.toFixed(2)}.`);
  }

  // Step 6: persist updated route (and carrier, if reassigned) on the shipment
  if (await isDbConnected()) {
    await Shipment.findOneAndUpdate(
      { shipmentId },
      {
        route: pathResult.route,
        etaMinutes: pathResult.etaMinutes,
        distanceKm: pathResult.distanceKm,
        costEstimate: costAfter,
        status: 'in_transit',
        currentPosition: pathResult.route[0],
        ...(carrier ? { carrier } : {}),
      },
      { upsert: true }
    );
    await TelemetryEvent.findOneAndUpdate(
      { shipmentId, resolved: false },
      { resolved: true },
      { sort: { createdAt: -1 } }
    );
  }
  log('system', `Shipment ${shipmentId} rerouted and healing loop complete.`);

  const healingLog = await persistHealingLog({
    shipmentId,
    steps,
    diagnosis: diagnosis.diagnosis,
    newRoute: pathResult.route,
    modelUsed,
    fallbackTriggered,
    outcome: 'healed',
    costBefore,
    costAfter,
  });

  return { healed: true, steps, newRoute: pathResult.route, healingLog, costBefore, costAfter };
}

async function persistHealingLog({ shipmentId, steps, diagnosis, newRoute, modelUsed, fallbackTriggered, outcome, costBefore, costAfter }) {
  const doc = { shipmentId, steps, diagnosis, newRoute, modelUsed, fallbackTriggered, outcome, costBefore, costAfter };
  if (await isDbConnected()) {
    return HealingLog.create(doc);
  }
  return doc;
}

module.exports = { runSelfHealingLoop };
