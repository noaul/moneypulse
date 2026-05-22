import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import type { User } from './types';
import { api, ApiError } from './api';
import { LoginPage, SetupPage } from './AuthPages';
import { Layout } from './Layout';
import { Dashboard } from './Dashboard';
import { AssetPage } from './AssetPage';
import { assetPageConfigs } from './assetConfig';
import { Expenses } from './Expenses';
import { SettingsPage } from './SettingsPage';

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'needsSetup'; user: null }
  | { status: 'anonymous'; user: null }
  | { status: 'authenticated'; user: User };

export default function App() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading', user: null });
  const navigate = useNavigate();

  useEffect(() => {
    async function loadAuth() {
      const setup = await api.get<{ needsSetup: boolean }>('/api/auth/setup-status');
      if (setup.needsSetup) { setAuth({ status: 'needsSetup', user: null }); return; }
      try {
        const me = await api.get<{ user: User }>('/api/auth/me');
        setAuth({ status: 'authenticated', user: me.user });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) { setAuth({ status: 'anonymous', user: null }); return; }
        throw error;
      }
    }
    loadAuth().catch(() => setAuth({ status: 'anonymous', user: null }));
  }, []);

  const onAuthenticated = (user: User) => { setAuth({ status: 'authenticated', user }); navigate('/dashboard'); };

  if (auth.status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center font-mono text-sm text-zinc-500">MoneyPulse loading...</div>;
  }

  if (auth.status === 'needsSetup') {
    return <Routes><Route path="/setup" element={<SetupPage onAuthenticated={onAuthenticated} />} /><Route path="*" element={<Navigate to="/setup" replace />} /></Routes>;
  }

  if (auth.status === 'anonymous') {
    return <Routes><Route path="/login" element={<LoginPage onAuthenticated={onAuthenticated} />} /><Route path="*" element={<Navigate to="/login" replace />} /></Routes>;
  }

  return (
    <Routes>
      <Route element={<Layout user={auth.user} onLogout={() => { setAuth({ status: 'anonymous', user: null }); navigate('/login'); }} />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {assetPageConfigs.map((config) => (
          <Route key={config.endpoint} path={`/${config.endpoint}`} element={<AssetPage config={config} />} />
        ))}
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
