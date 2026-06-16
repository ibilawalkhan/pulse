import {
  Activity,
  Bell,
  LayoutDashboard,
  LogOut,
  Moon,
  Search,
  Settings,
  Siren,
  Sun,
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { getFleetStats } from '../lib/mock';
import { useTheme } from '../lib/theme';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/monitors', label: 'Monitors', icon: Activity, end: false },
  { to: '/app/incidents', label: 'Incidents', icon: Siren, end: false },
  { to: '/app/alerts', label: 'Alert channels', icon: Bell, end: false },
  { to: '/app/settings', label: 'Settings', icon: Settings, end: false },
];

const TITLES: Record<string, string> = {
  '/app': 'Dashboard',
  '/app/monitors': 'Monitors',
  '/app/incidents': 'Incidents',
  '/app/alerts': 'Alert channels',
  '/app/settings': 'Settings',
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AppShell() {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const stats = getFleetStats();

  const title =
    TITLES[location.pathname] ??
    (location.pathname.startsWith('/app/monitors/') ? 'Monitor detail' : 'Pulse');

  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Activity size={18} strokeWidth={2.5} />
          </span>
          Pulse
        </div>

        <nav className="nav">
          <div className="nav-label">Monitoring</div>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={18} />
              {label}
              {to === '/app/incidents' && stats.ongoingIncidents > 0 && (
                <span className="badge-count">{stats.ongoingIncidents}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{user ? initials(user.name) : 'U'}</div>
            <div className="meta">
              <div className="name">{user?.name}</div>
              <div className="email">{user?.email}</div>
            </div>
            <button
              className="btn-icon"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="page-title">{title}</div>
          <div className="spacer" />
          <label className="search">
            <Search size={16} />
            <input placeholder="Search monitors…" aria-label="Search monitors" />
          </label>
          <button
            className="btn-icon"
            onClick={toggle}
            title="Toggle theme"
            aria-label="Toggle colour theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="btn-icon" title="Notifications" aria-label="Notifications">
            <Bell size={18} />
          </button>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
