import { AlertTriangle } from 'lucide-react';

// Normalized SVG-space positions mirroring the backend's logical node graph
// (server/services/routingService.js). Kept in sync by name, not by lat/lng,
// since this is a stylized command-center HUD rather than a literal map.
const NODE_POSITIONS = {
  'Godown A': { x: 60, y: 220 },
  'Godown B': { x: 60, y: 60 },
  'Hub 1': { x: 220, y: 220 },
  'Hub 2': { x: 220, y: 60 },
  'Port 1': { x: 380, y: 140 },
  'Port 2': { x: 380, y: 240 },
  'Port 3': { x: 500, y: 140 },
};

const EDGES = [
  ['Godown A', 'Hub 1'],
  ['Godown A', 'Hub 2'],
  ['Godown B', 'Hub 2'],
  ['Godown B', 'Hub 1'],
  ['Hub 1', 'Port 1'],
  ['Hub 1', 'Port 2'],
  ['Hub 2', 'Port 1'],
  ['Hub 2', 'Port 3'],
  ['Port 1', 'Port 3'],
  ['Port 2', 'Port 3'],
];

function edgeKey(a, b) {
  return [a, b].sort().join('--');
}

export default function MapHUD({ activeRoute = [], blockedEdge = null, vehiclePosition = null }) {
  const activeEdges = new Set(
    activeRoute.slice(0, -1).map((label, i) => edgeKey(label, activeRoute[i + 1]))
  );

  return (
    <div className="bg-hud-panel border border-hud-border rounded-lg p-4">
      <div className="text-xs uppercase tracking-widest text-hud-accent font-mono mb-3">Map HUD</div>
      <svg viewBox="0 0 560 300" className="w-full h-64" role="img" aria-label="Logistics network map">
        {EDGES.map(([a, b]) => {
          const pa = NODE_POSITIONS[a];
          const pb = NODE_POSITIONS[b];
          const key = edgeKey(a, b);
          const isActive = activeEdges.has(key);
          const isBlocked = blockedEdge === key;
          return (
            <line
              key={key}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke={isBlocked ? '#ef4444' : isActive ? '#22d3ee' : '#1c2433'}
              strokeWidth={isActive || isBlocked ? 3 : 1.5}
              strokeDasharray={isBlocked ? '6 4' : undefined}
            />
          );
        })}

        {blockedEdge &&
          (() => {
            const [a, b] = blockedEdge.split('--');
            const pa = NODE_POSITIONS[a];
            const pb = NODE_POSITIONS[b];
            if (!pa || !pb) return null;
            const mx = (pa.x + pb.x) / 2;
            const my = (pa.y + pb.y) / 2;
            return (
              <g transform={`translate(${mx - 8}, ${my - 8})`} data-testid="roadblock-marker">
                <foreignObject width="16" height="16">
                  <AlertTriangle size={16} color="#ef4444" />
                </foreignObject>
              </g>
            );
          })()}

        {Object.entries(NODE_POSITIONS).map(([name, pos]) => (
          <g key={name}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={10}
              fill={activeRoute.includes(name) ? '#0b3b3f' : '#0b0f17'}
              stroke={activeRoute.includes(name) ? '#22d3ee' : '#334155'}
              strokeWidth={2}
            />
            <text x={pos.x} y={pos.y - 16} textAnchor="middle" className="fill-slate-400" fontSize="10">
              {name}
            </text>
          </g>
        ))}

        {vehiclePosition && NODE_POSITIONS[vehiclePosition] && (
          <circle
            data-testid="vehicle-marker"
            cx={NODE_POSITIONS[vehiclePosition].x}
            cy={NODE_POSITIONS[vehiclePosition].y}
            r={5}
            fill="#34d399"
            className="animate-pulseGlow"
          />
        )}
      </svg>
    </div>
  );
}
