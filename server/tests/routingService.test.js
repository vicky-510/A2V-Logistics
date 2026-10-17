const { calculateShortestPath, listNodes } = require('../services/routingService');

describe('routingService', () => {
  test('lists known nodes including all godowns and ports', () => {
    const nodes = listNodes();
    expect(nodes).toEqual(expect.arrayContaining(['Godown A', 'Godown B', 'Port 1', 'Port 3']));
  });

  test('finds a shortest path between a godown and a port', () => {
    const result = calculateShortestPath({ origin: 'Godown A', destination: 'Port 1' });
    expect(result.found).toBe(true);
    expect(result.path[0]).toBe('Godown A');
    expect(result.path[result.path.length - 1]).toBe('Port 1');
    expect(result.distanceKm).toBeGreaterThan(0);
    expect(result.etaMinutes).toBeGreaterThan(0);
  });

  test('reroutes around a blocked edge', () => {
    const direct = calculateShortestPath({ origin: 'Godown A', destination: 'Port 1' });
    const blockedEdgeOnDirectPath = [direct.path[0], direct.path[1]].sort().join('--');

    const rerouted = calculateShortestPath({
      origin: 'Godown A',
      destination: 'Port 1',
      blockedEdges: [blockedEdgeOnDirectPath],
    });

    expect(rerouted.found).toBe(true);
    expect(rerouted.path).not.toEqual(direct.path);
  });

  test('returns found:false when no path exists after blocking all routes', () => {
    const result = calculateShortestPath({
      origin: 'Godown A',
      destination: 'Port 1',
      blockedEdges: ['Godown A--Hub 1', 'Godown A--Hub 2'],
    });
    expect(result.found).toBe(false);
    expect(result.route).toEqual([]);
  });

  test('throws on an unknown node', () => {
    expect(() => calculateShortestPath({ origin: 'Nowhere', destination: 'Port 1' })).toThrow();
  });
});
