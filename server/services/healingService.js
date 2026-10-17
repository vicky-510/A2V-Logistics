const { Shipment, TelemetryEvent, HealingLog } = require('../db/models');
const { invokeTool } = require('../mcp/server');
const { emitLog } = require('../utils/eventBus');

/**
 * The self-healing feedback loop.
 * Given a simulated disruption on a shipment's active route, this:
 *  1. Diagnoses the failure via the `logistics_debugger` MCP tool.
 *  2. Uses the Gemini LLM (with fallback) to narrate/confirm the diagnosis.
 *  3. Recalculates a bypass route via `calculate_shortest_path`, excluding the blocked edge.
 *  4. Persists the updated shipment + a HealingLog of every step.
 *  5. Emits each step as a live log event for the frontend terminal panel.
 */
async function isDbConnected() {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1;
}

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

  // Step 3: find current shipment route to determine origin/destination for reroute
  let shipment = null;
  if (await isDbConnected()) {
    shipment = await Shipment.findOne({ shipmentId });
  }
  const origin = shipment?.route?.[0]?.label || 'Godown A';
  const destination = shipment?.destination || 'Port 3';

  const pathResult = await invokeTool('calculate_shortest_path', {
    origin,
    destination,
    blockedEdges: blockedEdge ? [blockedEdge] : [],
  });

  if (!pathResult.found) {
    log('calculate_shortest_path', `No bypass route found for ${origin} -> ${destination}.`);
    const healingLog = await persistHealingLog({ shipmentId, steps, diagnosis: diagnosis.diagnosis, newRoute: [], modelUsed, fallbackTriggered, outcome: 'failed' });
    return { healed: false, steps, healingLog };
  }

  log('calculate_shortest_path', `Bypass route found: ${pathResult.path.join(' -> ')} (${pathResult.distanceKm} km, ETA ${pathResult.etaMinutes} min).`);

  // Step 4: persist updated route on the shipment
  if (await isDbConnected()) {
    await Shipment.findOneAndUpdate(
      { shipmentId },
      { route: pathResult.route, etaMinutes: pathResult.etaMinutes, status: 'in_transit', currentPosition: pathResult.route[0] },
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
  });

  return { healed: true, steps, newRoute: pathResult.route, healingLog };
}

async function persistHealingLog({ shipmentId, steps, diagnosis, newRoute, modelUsed, fallbackTriggered, outcome }) {
  const doc = { shipmentId, steps, diagnosis, newRoute, modelUsed, fallbackTriggered, outcome };
  if (await isDbConnected()) {
    return HealingLog.create(doc);
  }
  return doc;
}

module.exports = { runSelfHealingLoop };
