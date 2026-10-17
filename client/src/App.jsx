import { useState } from 'react';
import ChatDispatcher from './components/ChatDispatcher';
import PipelineView from './components/PipelineView';
import MapHUD from './components/MapHUD';
import TerminalLog from './components/TerminalLog';
import DisruptionButton from './components/DisruptionButton';
import { useLogStream } from './hooks/useLogStream';

export default function App() {
  const { logs } = useLogStream();
  const [activeShipment, setActiveShipment] = useState(null);
  const [activeRoute, setActiveRoute] = useState([]);
  const [blockedEdge, setBlockedEdge] = useState(null);
  const [activeStage, setActiveStage] = useState(-1);

  function handleDispatched(result) {
    setActiveShipment(result.shipmentId);
    setActiveRoute(result.route.path || []);
    setBlockedEdge(null);
    setActiveStage(3);
  }

  function handleHealed(result) {
    if (result.newRoute?.length) {
      setActiveRoute(result.newRoute.map((n) => n.label));
    }
    setBlockedEdge('Godown A--Hub 1');
  }

  return (
    <div className="min-h-screen bg-hud-bg text-slate-200 p-6 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-wide font-mono text-hud-accent">AUTOROUTE AI</h1>
          <p className="text-xs text-slate-500 font-mono">Self-Healing Logistics Command Center</p>
        </div>
        <DisruptionButton shipmentId={activeShipment} onHealed={handleHealed} />
      </header>

      <PipelineView activeStage={activeStage} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-6">
          <div className="h-80">
            <ChatDispatcher onDispatched={handleDispatched} />
          </div>
          <MapHUD activeRoute={activeRoute} blockedEdge={blockedEdge} />
        </div>
        <div className="min-h-[24rem]">
          <TerminalLog logs={logs} />
        </div>
      </div>
    </div>
  );
}
