import { useState } from 'react';
import { LogOut, Satellite } from 'lucide-react';
import ChatDispatcher from './ChatDispatcher';
import PipelineView from './PipelineView';
import MapHUD from './MapHUD';
import TerminalLog from './TerminalLog';
import DisruptionButton from './DisruptionButton';
import StatsBar from './StatsBar';
import ShipmentHistory from './ShipmentHistory';
import ConnectionBadge from './ConnectionBadge';
import { useLogStream } from '../hooks/useLogStream';
import { clearToken } from '../lib/auth';

export default function Dashboard({ onLogout }) {
  const { logs, status } = useLogStream();
  const [activeShipment, setActiveShipment] = useState(null);
  const [activeRoute, setActiveRoute] = useState([]);
  const [blockedEdge, setBlockedEdge] = useState(null);
  const [activeStage, setActiveStage] = useState(-1);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleDispatched(result) {
    setActiveShipment(result.shipmentId);
    setActiveRoute(result.route.path || []);
    setBlockedEdge(null);
    setActiveStage(3);
    setRefreshKey((k) => k + 1);
  }

  function handleHealed(result) {
    if (result.newRoute?.length) {
      setActiveRoute(result.newRoute.map((n) => n.label));
    }
    setBlockedEdge('Godown A--Hub 1');
    setRefreshKey((k) => k + 1);
  }

  function handleLogout() {
    clearToken();
    onLogout?.();
  }

  return (
    <div className="min-h-screen bg-hud-bg text-slate-200 p-6 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-hud-accent/10 border border-hud-accent flex items-center justify-center text-hud-accent">
            <Satellite size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide font-display text-hud-accent">AutoRoute AI</h1>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-500 font-mono">Self-Healing Logistics Command Center</p>
              <ConnectionBadge status={status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DisruptionButton shipmentId={activeShipment} onHealed={handleHealed} />
          <button
            onClick={handleLogout}
            aria-label="Log out"
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 border border-hud-border hover:border-hud-danger hover:text-hud-danger rounded px-3 py-2"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      <StatsBar refreshKey={refreshKey} />

      <PipelineView activeStage={activeStage} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="h-80">
            <ChatDispatcher onDispatched={handleDispatched} />
          </div>
          <MapHUD activeRoute={activeRoute} blockedEdge={blockedEdge} />
        </div>
        <div className="min-h-[24rem] lg:col-span-4">
          <TerminalLog logs={logs} />
        </div>
        <div className="min-h-[24rem] lg:col-span-3">
          <ShipmentHistory refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  );
}
