import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

const EXAMPLE = 'Ship 200 units from Godown A to Port 1';

export default function ChatDispatcher({ onDispatched }) {
  const [messages, setMessages] = useState([
    { role: 'agent', text: 'AutoRoute AI ready. Try: "' + EXAMPLE + '"' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
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
          text: `Dispatched ${order.units} units from ${order.origin} to ${order.destination} via ${result.dispatch.carrier}. Shipment ${result.shipmentId} is in transit (ETA ${result.route.etaMinutes} min).`,
        },
      ]);
      onDispatched?.(result);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'error', text: err.message }]);
    } finally {
      setLoading(false);
    }
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
                ? 'text-slate-100'
                : m.role === 'error'
                ? 'text-hud-danger'
                : 'text-hud-accent2'
            }
          >
            <span className="text-slate-500 mr-2">{m.role === 'user' ? '>' : m.role === 'error' ? '!' : '#'}</span>
            {m.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-hud-border p-3">
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
