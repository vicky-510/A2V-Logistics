import { Warehouse, PackageCheck, Route, Truck } from 'lucide-react';

const STAGES = [
  { key: 'godown', label: 'Godown', icon: Warehouse },
  { key: 'packaging', label: 'Packaging', icon: PackageCheck },
  { key: 'routing', label: 'Routing', icon: Route },
  { key: 'dispatch', label: 'Dispatch', icon: Truck },
];

/**
 * `activeStage` is the index of the furthest-completed stage (-1 = none).
 */
export default function PipelineView({ activeStage = -1 }) {
  return (
    <div className="bg-hud-panel border border-hud-border rounded-lg p-4">
      <div className="text-xs uppercase tracking-widest text-hud-accent font-mono mb-4">Pipeline</div>
      <div className="flex items-center justify-between">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const isDone = i <= activeStage;
          const isCurrent = i === activeStage;
          return (
            <div key={stage.key} className="flex-1 flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  data-testid={`stage-${stage.key}`}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                    isDone
                      ? 'border-hud-accent2 text-hud-accent2 bg-hud-accent2/10'
                      : 'border-hud-border text-slate-500'
                  } ${isCurrent ? 'animate-pulseGlow' : ''}`}
                >
                  <Icon size={18} />
                </div>
                <span className={`text-xs font-mono ${isDone ? 'text-hud-accent2' : 'text-slate-500'}`}>
                  {stage.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div
                  className={`flex-1 h-px mx-2 ${i < activeStage ? 'bg-hud-accent2' : 'bg-hud-border'}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
