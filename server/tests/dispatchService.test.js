const { parseOrder, runDispatchPipeline } = require('../services/dispatchService');

describe('dispatchService.parseOrder', () => {
  test('parses a well-formed order', () => {
    const order = parseOrder('Ship 200 units from Godown A to Port 1');
    expect(order).toEqual({ units: 200, origin: 'Godown A', destination: 'Port 1' });
  });

  test('is case-insensitive', () => {
    const order = parseOrder('ship 50 units from godown b to hub 2');
    expect(order).toEqual({ units: 50, origin: 'Godown B', destination: 'Hub 2' });
  });

  test('throws on malformed input', () => {
    expect(() => parseOrder('Please send some stuff somewhere')).toThrow(/Could not parse order/);
  });

  test('throws on an unknown location', () => {
    expect(() => parseOrder('Ship 10 units from Mars Base to Port 1')).toThrow(/Unknown location/);
  });
});

describe('dispatchService.runDispatchPipeline', () => {
  test('runs the full pipeline for a valid order within stock limits', async () => {
    const result = await runDispatchPipeline({ units: 100, origin: 'Godown A', destination: 'Port 1' });
    expect(result.shipmentId).toMatch(/^SHIP-/);
    expect(result.route.found).toBe(true);
    expect(result.dispatch.status).toBe('dispatched');
    expect(typeof result.costEstimate).toBe('number');
    expect(result.costEstimate).toBeGreaterThan(0);
    expect(result.dispatch.costEstimate).toBe(result.costEstimate);
    expect(result.dispatch.distanceKm).toBe(result.route.distanceKm);
  });

  test('rejects an order exceeding available stock', async () => {
    await expect(
      runDispatchPipeline({ units: 999999, origin: 'Godown A', destination: 'Port 1' })
    ).rejects.toThrow(/Insufficient stock/);
  });
});
