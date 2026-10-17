import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

/**
 * Subscribes to the backend's SSE log stream and keeps a rolling buffer
 * of the most recent entries for the terminal panel. Also tracks the raw
 * connection status so the UI can show a live/connecting/offline indicator.
 */
export function useLogStream(maxEntries = 200) {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('connecting');
  const sourceRef = useRef(null);

  useEffect(() => {
    const source = new EventSource(api.logsStreamUrl());
    sourceRef.current = source;

    source.onopen = () => setStatus('live');

    source.onmessage = (event) => {
      setStatus('live');
      try {
        const entry = JSON.parse(event.data);
        setLogs((prev) => [...prev.slice(-(maxEntries - 1)), entry]);
      } catch {
        // ignore malformed payloads
      }
    };

    source.onerror = () => {
      // EventSource auto-reconnects; reflect the drop in status meanwhile.
      setStatus('reconnecting');
    };

    return () => source.close();
  }, [maxEntries]);

  const appendLocal = (entry) => {
    setLogs((prev) => [...prev.slice(-(maxEntries - 1)), { timestamp: new Date().toISOString(), ...entry }]);
  };

  return { logs, appendLocal, status };
}
