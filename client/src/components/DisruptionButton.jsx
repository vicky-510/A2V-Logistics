import { useState } from 'react';
import { Zap, Loader2, Construction, Wrench, CloudLightning } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from '../lib/toast';

const DISRUPTION_TYPES = [
  { type: 'roadblock', label: 'Roadblock', icon: Construction, description: 'Simulated roadblock injected by operator', blockedEdge: 'Godown A--Hub 1' },
  { type: 'breakdown', label: 'Breakdown', icon: Wrench, description: 'Simulated vehicle breakdown injected by operator', blockedEdge: null },
  { type: 'weather', label: 'Weather', icon: CloudLightning, description: 'Simulated severe weather injected by operator', blockedEdge: 'Godown A--Hub 1' },
];

export default function DisruptionButton({ shipmentId, onHealed }) {
  const [selected, setSelected] = useState(DISRUPTION_TYPES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleClick() {
    if (!shipmentId || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.disrupt(shipmentId, selected.type, selected.description, selected.blockedEdge);
      toast[result.healed ? 'success' : 'error'](
        result.healed ? `Self-healing loop recovered from the ${selected.label.toLowerCase()}` : 'Self-healing loop could not find a bypass route'
      );
      onHealed?.(result);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1" role="group" aria-label="Disruption type">
        {DISRUPTION_TYPES.map((d) => {
          const Icon = d.icon;
          const active = selected.type === d.type;
          return (
            <button
              key={d.type}
              type="button"
              onClick={() => setSelected(d)}
              aria-pressed={active}
              className={`flex items-center gap-1 text-[10px] font-mono rounded px-2 py-1 border ${
                active
                  ? 'border-hud-danger text-hud-danger bg-hud-danger/10'
                  : 'border-hud-border text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={11} /> {d.label}
            </button>
          );
        })}
      </div>
      <button
        onClick={handleClick}
        disabled={!shipmentId || loading}
        className="flex items-center justify-center gap-2 bg-hud-danger/10 border border-hud-danger text-hud-danger rounded px-4 py-2 font-mono text-sm hover:bg-hud-danger/20 disabled:opacity-40"
      >
        {loading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
        Simulate {selected.label}
      </button>
      {!shipmentId && (
        <span className="text-xs text-slate-500 font-mono">Dispatch a shipment first to enable this.</span>
      )}
      {error && <span className="text-xs text-hud-danger font-mono">{error}</span>}
    </div>
  );
}
