import { useState } from 'react';
import { motion } from 'framer-motion';
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
      <motion.form
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-hud-panel border border-hud-border rounded-xl p-8 flex flex-col gap-4 shadow-[0_0_40px_-12px_rgba(34,211,238,0.25)]"
      >
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="relative w-14 h-14 rounded-full bg-hud-accent/10 border border-hud-accent flex items-center justify-center text-hud-accent">
            <span className="absolute inset-0 rounded-full border border-hud-accent/40 animate-pulseGlow" />
            <Lock size={22} />
          </div>
          <h1 className="text-2xl font-bold tracking-wide font-display text-hud-accent">AutoRoute AI</h1>
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
          className="flex items-center justify-center gap-2 bg-hud-accent/10 border border-hud-accent text-hud-accent rounded px-4 py-2 font-mono text-sm hover:bg-hud-accent/20 disabled:opacity-40 transition-colors"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : 'Enter'}
        </button>
      </motion.form>
    </div>
  );
}
