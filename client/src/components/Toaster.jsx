import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { subscribeToasts, toast } from '../lib/toast';

const STYLES = {
  success: { border: 'border-hud-accent2', text: 'text-hud-accent2', Icon: CheckCircle2 },
  error: { border: 'border-hud-danger', text: 'text-hud-danger', Icon: XCircle },
  info: { border: 'border-hud-accent', text: 'text-hud-accent', Icon: Info },
};

export default function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => subscribeToasts(setToasts), []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80" data-testid="toaster">
      {toasts.map((t) => {
        const style = STYLES[t.type] || STYLES.info;
        const Icon = style.Icon;
        return (
          <div
            key={t.id}
            role="status"
            className={`animate-toast-in flex items-start gap-2 bg-hud-panel border ${style.border} rounded-lg px-3 py-2 shadow-lg`}
          >
            <Icon size={16} className={`${style.text} shrink-0 mt-0.5`} />
            <p className="text-xs font-mono text-slate-200 flex-1">{t.message}</p>
            <button
              onClick={() => toast.dismiss(t.id)}
              aria-label="Dismiss notification"
              className="text-slate-500 hover:text-slate-300"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
