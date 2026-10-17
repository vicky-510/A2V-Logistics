import { useEffect, useState } from 'react';
import { ListChecks } from 'lucide-react';
import { api } from '../lib/api';

const STATUS_STYLES = {
  pending: 'bg-slate-600/20 text-slate-400 border-slate-600',
  packaging: 'bg-hud-accent/10 text-hud-accent border-hud-accent',
  in_transit: 'bg-hud-accent2/10 text-hud-accent2 border-hud-accent2',
  rerouting: 'bg-hud-warn/10 text-hud-warn border-hud-warn',
  dispatched: 'bg-hud-accent2/10 text-hud-accent2 border-hud-accent2',
  delivered: 'bg-hud-accent2/10 text-hud-accent2 border-hud-accent2',
  failed: 'bg-hud-danger/10 text-hud-danger border-hud-danger',
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span className={`text-[10px] uppercase tracking-wide font-mono border rounded px-1.5 py-0.5 ${style}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function ShipmentHistory({ refreshKey }) {
  const [shipments, setShipments] = useState([]);

  useEffect(() => {
    api
      .shipments()
      .then((data) => setShipments(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [refreshKey]);

  return (
    <div className="bg-hud-panel border border-hud-border rounded-lg flex flex-col overflow-hidden">
      <div className="px-4 py-2 border-b border-hud-border flex items-center gap-2 text-xs uppercase tracking-widest text-hud-accent font-mono">
        <ListChecks size={14} /> Shipment History
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-hud-border/60" data-testid="shipment-history">
        {shipments.length === 0 && (
          <p className="px-4 py-4 text-xs text-slate-600 font-mono">No shipments yet.</p>
        )}
        {shipments.map((s) => (
          <div key={s.shipmentId} className="px-4 py-2 flex items-center justify-between gap-2 text-xs font-mono">
            <div className="min-w-0">
              <p className="text-slate-200 truncate">{s.shipmentId}</p>
              <p className="text-slate-500 truncate">
                {s.originGodownId} → {s.destination} · {s.units} units
              </p>
            </div>
            <StatusBadge status={s.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
