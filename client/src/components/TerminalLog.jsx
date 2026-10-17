import { useEffect, useRef } from 'react';
import { TerminalSquare } from 'lucide-react';

const ACTOR_COLORS = {
  pipeline: 'text-hud-accent',
  telemetry: 'text-hud-warn',
  logistics_debugger: 'text-hud-warn',
  'gemini-agent': 'text-hud-accent2',
  calculate_shortest_path: 'text-hud-accent2',
  system: 'text-slate-400',
};

export default function TerminalLog({ logs }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-hud-panel border border-hud-border rounded-lg flex flex-col h-full overflow-hidden">
      <div className="px-4 py-2 border-b border-hud-border flex items-center gap-2 text-xs uppercase tracking-widest text-hud-accent font-mono">
        <TerminalSquare size={14} /> Live Self-Healing Terminal
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs space-y-1" data-testid="terminal-log">
        {logs.length === 0 && <div className="text-slate-600">Waiting for events...</div>}
        {logs.map((entry, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-slate-600">{new Date(entry.timestamp).toLocaleTimeString()}</span>
            <span className={ACTOR_COLORS[entry.actor] || 'text-slate-300'}>[{entry.actor}]</span>
            <span className="text-slate-300">{entry.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
