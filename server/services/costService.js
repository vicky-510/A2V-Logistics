/**
 * Simple, transparent cost model for a shipment: a flat dispatch fee plus
 * a per-kilometer transport rate and a per-unit handling rate. Not meant
 * to be realistic pricing — it's deterministic and explainable, so a
 * reroute's cost delta is easy to demo and reason about.
 */
const BASE_DISPATCH_FEE = 50;
const RATE_PER_KM = 2.5;
const RATE_PER_UNIT = 0.3;

function estimateCost({ distanceKm, units }) {
  if (typeof distanceKm !== 'number' || typeof units !== 'number') {
    throw new Error('estimateCost requires numeric distanceKm and units.');
  }
  const cost = BASE_DISPATCH_FEE + distanceKm * RATE_PER_KM + units * RATE_PER_UNIT;
  return Math.round(cost * 100) / 100;
}

module.exports = { estimateCost, BASE_DISPATCH_FEE, RATE_PER_KM, RATE_PER_UNIT };
