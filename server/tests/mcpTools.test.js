const { callTool, getToolSpecs, getShipment } = require('../mcp/tools');

describe('MCP tools', () => {
  test('exposes exactly the four required tool specs', () => {
    const names = getToolSpecs().map((t) => t.name).sort();
    expect(names).toEqual([
      'calculate_shortest_path',
      'dispatch_carrier',
      'get_godown_stock',
      'logistics_debugger',
    ]);
  });

  test('get_godown_stock returns stock for a known godown (in-memory fallback)', async () => {
    const result = await callTool('get_godown_stock', { godownId: 'Godown A' });
    expect(result.godownId).toBe('Godown A');
    expect(typeof result.stock).toBe('number');
  });

  test('get_godown_stock throws for an unknown godown', async () => {
    await expect(callTool('get_godown_stock', { godownId: 'Nowhere' })).rejects.toThrow();
  });

  test('calculate_shortest_path delegates to the routing service', async () => {
    const result = await callTool('calculate_shortest_path', { origin: 'Godown A', destination: 'Port 1' });
    expect(result.found).toBe(true);
  });

  test('dispatch_carrier creates a shipment record in the in-memory store', async () => {
    const result = await callTool('dispatch_carrier', {
      shipmentId: 'SHIP-TEST-1',
      originGodownId: 'Godown A',
      destination: 'Port 1',
      units: 50,
      route: [],
      etaMinutes: 30,
      distanceKm: 27,
      costEstimate: 132.5,
    });
    expect(result.status).toBe('dispatched');
    expect(result.carrier).toMatch(/^Carrier-\d+$/);
    expect(result.distanceKm).toBe(27);
    expect(result.costEstimate).toBe(132.5);
  });

  test('getShipment returns the dispatched shipment from the in-memory store', async () => {
    const shipment = await getShipment('SHIP-TEST-1');
    expect(shipment).not.toBeNull();
    expect(shipment.costEstimate).toBe(132.5);
  });

  test('getShipment returns null for an unknown shipment', async () => {
    const shipment = await getShipment('SHIP-DOES-NOT-EXIST');
    expect(shipment).toBeNull();
  });

  test('logistics_debugger returns a roadblock diagnosis', async () => {
    const result = await callTool('logistics_debugger', {
      shipmentId: 'SHIP-TEST-1',
      eventType: 'roadblock',
    });
    expect(result.recommendsReroute).toBe(true);
    expect(result.recommendsCarrierReassignment).toBe(false);
    expect(result.diagnosis).toMatch(/roadblock/i);
  });

  test('logistics_debugger returns a breakdown diagnosis with carrier reassignment', async () => {
    const result = await callTool('logistics_debugger', {
      shipmentId: 'SHIP-TEST-1',
      eventType: 'breakdown',
    });
    expect(result.recommendsCarrierReassignment).toBe(true);
    expect(result.diagnosis).toMatch(/breakdown/i);
  });

  test('logistics_debugger returns a weather diagnosis', async () => {
    const result = await callTool('logistics_debugger', {
      shipmentId: 'SHIP-TEST-1',
      eventType: 'weather',
    });
    expect(result.recommendsReroute).toBe(true);
    expect(result.diagnosis).toMatch(/weather/i);
  });

  test('throws for an unknown tool name', async () => {
    await expect(callTool('not_a_real_tool', {})).rejects.toThrow('Unknown MCP tool');
  });
});
