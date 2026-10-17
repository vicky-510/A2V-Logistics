import { useEffect, useState } from 'react';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import { getToken, clearToken } from './lib/auth';
import { onUnauthorized } from './lib/api';

export default function App() {
  const [authed, setAuthed] = useState(() => Boolean(getToken()));

  useEffect(() => {
    onUnauthorized(() => {
      clearToken();
      setAuthed(false);
    });
  }, []);

  if (!authed) {
    return <LoginScreen onLoggedIn={() => setAuthed(true)} />;
  }

  return <Dashboard />;
}
