const { runSelfHealingLoop } = require('../services/healingService');
const { callTool } = require('../mcp/tools');

function fakeLlmService(text = 'Rerouting via bypass path to avoid the disruption.') {
  return { generate: jest.fn().mockResolvedValue({ text, modelUsed: 'gemini-2.5-flash', fallbackTriggered: false }) };
}

describe('healingService.runSelfHealingLoop', () => {
  beforeAll(async () => {
    // Seed a dispatched shipment in the in-memory store so the healing loop has a route to repair.
    await callTool('dispatch_carrier', {
      shipmentId: 'SHIP-HEAL-1',
      originGodownId: 'Godown A',
      destination: 'Port 1',
      units: 100,
      route: [{ lat: 19.076, lng: 72.8777, label: 'Godown A' }],
      etaMinutes: 20,
    });
  });

  test('diagnoses a roadblock and finds a bypass route', async () => {
    const llmService = fakeLlmService();
    const result = await runSelfHealingLoop({
      shipmentId: 'SHIP-HEAL-1',
      eventType: 'roadblock',
      description: 'Highway closed near Hub 1',
      blockedEdge: 'Godown A--Hub 1',
      llmService,
    });

    expect(llmService.generate).toHaveBeenCalled();
    expect(result.steps.some((s) => s.actor === 'logistics_debugger')).toBe(true);
    expect(result.steps.some((s) => s.actor === 'gemini-agent')).toBe(true);
  });

  test('continues with rule-based recovery if the LLM call fails', async () => {
    const llmService = { generate: jest.fn().mockRejectedValue(new Error('LLM down')) };
    const result = await runSelfHealingLoop({
      shipmentId: 'SHIP-HEAL-1',
      eventType: 'breakdown',
      description: 'Vehicle broke down',
      llmService,
    });

    expect(result.steps.some((s) => s.message.includes('LLM narration unavailable'))).toBe(true);
  });

  test('logs a fallback notice when the LLM service reports fallbackTriggered', async () => {
    const llmService = {
      generate: jest.fn().mockResolvedValue({ text: 'Recovering.', modelUsed: 'gemini-1.5-flash', fallbackTriggered: true }),
    };
    const result = await runSelfHealingLoop({
      shipmentId: 'SHIP-HEAL-1',
      eventType: 'roadblock',
      llmService,
    });

    expect(result.steps.some((s) => s.message.includes('Fallback model'))).toBe(true);
  });

  test('reassigns the carrier on a breakdown', async () => {
    const llmService = fakeLlmService();
    const result = await runSelfHealingLoop({
      shipmentId: 'SHIP-HEAL-1',
      eventType: 'breakdown',
      description: 'Vehicle broke down',
      llmService,
    });

    expect(result.steps.some((s) => s.message.includes('Carrier reassigned to Carrier-'))).toBe(true);
  });

  test('compares cost before and after the reroute when the shipment has a known cost', async () => {
    await callTool('dispatch_carrier', {
      shipmentId: 'SHIP-HEAL-COST',
      originGodownId: 'Godown A',
      destination: 'Port 1',
      units: 100,
      route: [{ lat: 19.076, lng: 72.8777, label: 'Godown A' }],
      etaMinutes: 20,
      distanceKm: 12,
      costEstimate: 110,
    });

    const llmService = fakeLlmService();
    const result = await runSelfHealingLoop({
      shipmentId: 'SHIP-HEAL-COST',
      eventType: 'roadblock',
      blockedEdge: 'Godown A--Hub 1',
      llmService,
    });

    expect(result.costBefore).toBe(110);
    expect(typeof result.costAfter).toBe('number');
    expect(result.steps.some((s) => s.actor === 'cost-estimator' && /Shipping cost/.test(s.message))).toBe(true);
  });
});
