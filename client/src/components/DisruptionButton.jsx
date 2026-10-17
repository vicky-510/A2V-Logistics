import { useState } from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export default function DisruptionButton({ shipmentId, onHealed }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleClick() {
    if (!shipmentId || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.disrupt(shipmentId, 'roadblock', 'Simulated roadblock injected by operator', 'Godown A--Hub 1');
      onHealed?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={!shipmentId || loading}
        className="flex items-center justify-center gap-2 bg-hud-danger/10 border border-hud-danger text-hud-danger rounded px-4 py-2 font-mono text-sm hover:bg-hud-danger/20 disabled:opacity-40"
      >
        {loading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
        Simulate Disruption (Roadblock)
      </button>
      {!shipmentId && (
        <span className="text-xs text-slate-500 font-mono">Dispatch a shipment first to enable this.</span>
      )}
      {error && <span className="text-xs text-hud-danger font-mono">{error}</span>}
    </div>
  );
}
