import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppShell } from './components/AppShell';
import { Loading } from './components/ui';
import { useAuth } from './lib/auth';
import { AlertChannels } from './pages/AlertChannels';
import { Dashboard } from './pages/Dashboard';
import { Incidents } from './pages/Incidents';
import { Login } from './pages/Login';
import { MonitorDetail } from './pages/MonitorDetail';
import { Monitors } from './pages/Monitors';
import { NotFound } from './pages/NotFound';
import { Register } from './pages/Register';
import { Settings } from './pages/Settings';

function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === 'loading') {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <Loading label="Restoring your session…" />
      </div>
    );
  }
  return status === 'authenticated' ? <>{children}</> : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="monitors" element={<Monitors />} />
        <Route path="monitors/:id" element={<MonitorDetail />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="alerts" element={<AlertChannels />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
