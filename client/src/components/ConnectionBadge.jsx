const STATUS_STYLES = {
  live: { dot: 'bg-hud-accent2', text: 'text-hud-accent2', label: 'LIVE' },
  connecting: { dot: 'bg-hud-warn', text: 'text-hud-warn', label: 'CONNECTING' },
  reconnecting: { dot: 'bg-hud-danger', text: 'text-hud-danger', label: 'RECONNECTING' },
};

export default function ConnectionBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.connecting;
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono" data-testid="connection-badge">
      <span className={`w-2 h-2 rounded-full ${style.dot} animate-pulseGlow`} />
      <span className={style.text}>{style.label}</span>
    </div>
  );
}
