/**
 * Simulated Google Maps routing service.
 * Mocked deterministically (no external API key/billing required for the demo).
 * Swap `_fetchGoogleMapsRoute` for a real Google Maps Directions API call in production.
 */

const NODES = {
  'Godown A': { lat: 19.076, lng: 72.8777, label: 'Godown A' },
  'Godown B': { lat: 18.5204, lng: 73.8567, label: 'Godown B' },
  'Hub 1': { lat: 19.2183, lng: 72.9781, label: 'Hub 1' },
  'Hub 2': { lat: 18.9633, lng: 72.8258, label: 'Hub 2' },
  'Port 1': { lat: 18.948, lng: 72.9342, label: 'Port 1' },
  'Port 2': { lat: 19.0821, lng: 72.8416, label: 'Port 2' },
  'Port 3': { lat: 21.1458, lng: 79.0882, label: 'Port 3' },
};

// Adjacency with distance weights (km) — used for shortest-path + bypass calc.
const GRAPH = {
  'Godown A': { 'Hub 1': 12, 'Hub 2': 18 },
  'Godown B': { 'Hub 2': 10, 'Hub 1': 22 },
  'Hub 1': { 'Godown A': 12, 'Godown B': 22, 'Port 1': 15, 'Port 2': 20 },
  'Hub 2': { 'Godown A': 18, 'Godown B': 10, 'Port 1': 9, 'Port 3': 40 },
  'Port 1': { 'Hub 1': 15, 'Hub 2': 9, 'Port 3': 35 },
  'Port 2': { 'Hub 1': 20, 'Port 3': 30 },
  'Port 3': { 'Port 1': 35, 'Port 2': 30, 'Hub 2': 40 },
};

function dijkstra(graph, start, end, blockedEdges = new Set()) {
  const distances = {};
  const previous = {};
  const visited = new Set();
  const queue = new Set(Object.keys(graph));

  Object.keys(graph).forEach((node) => { distances[node] = Infinity; });
  distances[start] = 0;

  while (queue.size > 0) {
    let current = null;
    let currentDist = Infinity;
    for (const node of queue) {
      if (distances[node] < currentDist) {
        currentDist = distances[node];
        current = node;
      }
    }
    if (current === null) break;
    queue.delete(current);
    visited.add(current);
    if (current === end) break;

    const neighbors = graph[current] || {};
    for (const [neighbor, weight] of Object.entries(neighbors)) {
      const edgeKey = [current, neighbor].sort().join('--');
      if (blockedEdges.has(edgeKey)) continue;
      const candidate = distances[current] + weight;
      if (candidate < distances[neighbor]) {
        distances[neighbor] = candidate;
        previous[neighbor] = current;
      }
    }
  }

  if (distances[end] === Infinity) return null;

  const path = [end];
  let node = end;
  while (previous[node]) {
    node = previous[node];
    path.unshift(node);
  }
  return { path, distanceKm: distances[end] };
}

function toRouteNodes(path) {
  return path.map((name) => NODES[name] || { lat: 0, lng: 0, label: name });
}

/**
 * Calculate the shortest path between two named nodes.
 * `blockedEdges` is an array of "NodeA--NodeB" (sorted) strings to exclude,
 * used to simulate roadblocks/disruptions.
 */
function calculateShortestPath({ origin, destination, blockedEdges = [] }) {
  if (!NODES[origin] || !NODES[destination]) {
    throw new Error(`Unknown node(s): ${origin} -> ${destination}`);
  }
  const result = dijkstra(GRAPH, origin, destination, new Set(blockedEdges));
  if (!result) {
    return { found: false, path: [], route: [], distanceKm: null };
  }
  return {
    found: true,
    path: result.path,
    route: toRouteNodes(result.path),
    distanceKm: result.distanceKm,
    etaMinutes: Math.round((result.distanceKm / 40) * 60), // assume avg 40km/h
  };
}

/** Returns the list of valid node names, for validation elsewhere. */
function listNodes() {
  return Object.keys(NODES);
}

module.exports = { calculateShortestPath, listNodes, NODES, GRAPH };
