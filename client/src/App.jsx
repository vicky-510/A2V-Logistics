import { useEffect, useState } from 'react';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import Toaster from './components/Toaster';
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

  return (
    <>
      <Toaster />
      {authed ? <Dashboard onLogout={() => setAuthed(false)} /> : <LoginScreen onLoggedIn={() => setAuthed(true)} />}
    </>
  );
}
