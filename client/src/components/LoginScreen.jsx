import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { setToken } from '../lib/auth';

export default function LoginScreen({ onLoggedIn }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { token } = await api.login(code);
      setToken(token);
      onLoggedIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-hud-bg flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-hud-panel border border-hud-border rounded-lg p-6 flex flex-col gap-4"
      >
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-full bg-hud-accent/10 border border-hud-accent flex items-center justify-center text-hud-accent">
            <Lock size={20} />
          </div>
          <h1 className="text-lg font-bold font-mono tracking-wide text-hud-accent">AUTOROUTE AI</h1>
          <p className="text-xs text-slate-500 font-mono">Enter access code to continue</p>
        </div>

        <input
          type="password"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Access code"
          aria-label="Access code"
          className="bg-hud-bg border border-hud-border rounded px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-hud-accent"
          disabled={loading}
        />

        {error && <p className="text-xs text-hud-danger font-mono">{error}</p>}

        <button
          type="submit"
          disabled={loading || !code}
          className="flex items-center justify-center gap-2 bg-hud-accent/10 border border-hud-accent text-hud-accent rounded px-4 py-2 font-mono text-sm hover:bg-hud-accent/20 disabled:opacity-40"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : 'Enter'}
        </button>
      </form>
    </div>
  );
}
