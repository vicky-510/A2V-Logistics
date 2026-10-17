const { estimateCost, BASE_DISPATCH_FEE, RATE_PER_KM, RATE_PER_UNIT } = require('../services/costService');

describe('costService.estimateCost', () => {
  test('applies the base fee plus per-km and per-unit rates', () => {
    const cost = estimateCost({ distanceKm: 10, units: 100 });
    const expected = BASE_DISPATCH_FEE + 10 * RATE_PER_KM + 100 * RATE_PER_UNIT;
    expect(cost).toBeCloseTo(expected, 2);
  });

  test('rounds to two decimal places', () => {
    const cost = estimateCost({ distanceKm: 3.333, units: 7 });
    expect(Number.isFinite(cost)).toBe(true);
    expect(cost).toBe(Math.round(cost * 100) / 100);
  });

  test('increases with distance', () => {
    const near = estimateCost({ distanceKm: 5, units: 50 });
    const far = estimateCost({ distanceKm: 50, units: 50 });
    expect(far).toBeGreaterThan(near);
  });

  test('throws on non-numeric input', () => {
    expect(() => estimateCost({ distanceKm: 'far', units: 10 })).toThrow();
  });
});
