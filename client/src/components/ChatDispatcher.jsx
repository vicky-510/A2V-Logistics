import { useState } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from '../lib/toast';

const EXAMPLE = 'Ship 200 units from Godown A to Port 1';

const QUICK_COMMANDS = [
  'Ship 200 units from Godown A to Port 1',
  'Ship 100 units from Godown B to Hub 2',
  'Ship 50 units from Godown A to Hub 1',
];

export default function ChatDispatcher({ onDispatched }) {
  const [messages, setMessages] = useState([
    { role: 'agent', text: 'AutoRoute AI ready. Try: "' + EXAMPLE + '"' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function send(text) {
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const { order, result } = await api.dispatch(text);
      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          text: `Dispatched ${order.units} units from ${order.origin} to ${order.destination} via ${result.dispatch.carrier}. Shipment ${result.shipmentId} is in transit (ETA ${result.route.etaMinutes} min, est. cost $${result.costEstimate.toFixed(2)}).`,
        },
      ]);
      toast.success(`Shipment ${result.shipmentId} dispatched`);
      onDispatched?.(result);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'error', text: err.message }]);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSend(e) {
    e.preventDefault();
    send(input.trim());
  }

  return (
    <div className="flex flex-col h-full bg-hud-panel border border-hud-border rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b border-hud-border text-xs uppercase tracking-widest text-hud-accent font-mono">
        Conversational Dispatcher
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 font-mono text-sm" data-testid="chat-log">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'user'
                ? 'text-slate-100 animate-floatIn'
                : m.role === 'error'
                ? 'text-hud-danger animate-floatIn'
                : 'text-hud-accent2 animate-floatIn'
            }
          >
            <span className="text-slate-500 mr-2">{m.role === 'user' ? '>' : m.role === 'error' ? '!' : '#'}</span>
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-1 text-slate-500" data-testid="typing-indicator">
            <span className="w-1.5 h-1.5 rounded-full bg-hud-accent2 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-hud-accent2 animate-bounce" style={{ animationDelay: '120ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-hud-accent2 animate-bounce" style={{ animationDelay: '240ms' }} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 px-3 pt-2">
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => send(cmd)}
            disabled={loading}
            className="flex items-center gap-1 text-[10px] font-mono text-hud-accent/80 border border-hud-border hover:border-hud-accent rounded-full px-2 py-1 disabled:opacity-40"
          >
            <Sparkles size={10} /> {cmd}
          </button>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-hud-border p-3 mt-2">
        <input
          className="flex-1 bg-hud-bg border border-hud-border rounded px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-hud-accent"
          placeholder={EXAMPLE}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          aria-label="Dispatch order"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-hud-accent/10 border border-hud-accent text-hud-accent rounded px-3 py-2 hover:bg-hud-accent/20 disabled:opacity-50"
          aria-label="Send"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
