import { useEffect, useState } from 'react';
import { Package, Truck, Timer, HeartPulse, DollarSign } from 'lucide-react';
import { api } from '../lib/api';

// Static class strings (not interpolated) so Tailwind's JIT scanner can find them.
const ICON_STYLES = {
  accent: 'bg-hud-accent/10 text-hud-accent',
  accent2: 'bg-hud-accent2/10 text-hud-accent2',
  warn: 'bg-hud-warn/10 text-hud-warn',
  danger: 'bg-hud-danger/10 text-hud-danger',
};

function StatTile({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex-1 min-w-[140px] bg-hud-panel border border-hud-border rounded-lg px-4 py-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-md flex items-center justify-center ${ICON_STYLES[accent]}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">{label}</p>
        <p className="text-lg font-semibold font-mono text-slate-100">{value}</p>
      </div>
    </div>
  );
}

/**
 * Live KPI row. `refreshKey` is bumped by the parent after a dispatch or
 * healing event so the stats update immediately, in addition to a periodic
 * poll as a fallback.
 */
export default function StatsBar({ refreshKey }) {
  const [shipments, setShipments] = useState([]);
  const [healingLogs, setHealingLogs] = useState([]);

  async function refresh() {
    try {
      const [s, h] = await Promise.all([api.shipments(), api.healingLogs()]);
      setShipments(Array.isArray(s) ? s : []);
      setHealingLogs(Array.isArray(h) ? h : []);
    } catch {
      // stats are best-effort; ignore transient failures
    }
  }

  useEffect(() => {
    refresh();
  }, [refreshKey]);

  useEffect(() => {
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, []);

  const total = shipments.length;
  const active = shipments.filter((s) => ['dispatched', 'in_transit', 'rerouting'].includes(s.status)).length;
  const etas = shipments.map((s) => s.etaMinutes).filter((n) => typeof n === 'number');
  const avgEta = etas.length ? Math.round(etas.reduce((a, b) => a + b, 0) / etas.length) : 0;
  const healed = healingLogs.length;
  const costs = shipments.map((s) => s.costEstimate).filter((n) => typeof n === 'number');
  const totalCost = costs.reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-wrap gap-3" data-testid="stats-bar">
      <StatTile icon={Package} label="Total shipments" value={total} accent="accent" />
      <StatTile icon={Truck} label="Active shipments" value={active} accent="accent2" />
      <StatTile icon={Timer} label="Avg ETA (min)" value={avgEta || '—'} accent="warn" />
      <StatTile icon={DollarSign} label="Total shipping cost" value={`$${totalCost.toFixed(2)}`} accent="accent" />
      <StatTile icon={HeartPulse} label="Self-healing events" value={healed} accent="danger" />
    </div>
  );
}
