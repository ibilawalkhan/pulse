import { LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';

export function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account and preferences.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18, maxWidth: 640 }}>
        <div className="card-head">
          <h3>Profile</h3>
        </div>
        <div className="card-pad">
          <div className="field">
            <label htmlFor="s-email">Email</label>
            <input id="s-email" className="input" value={user?.email ?? ''} readOnly />
          </div>
          <button className="btn btn-ghost" onClick={handleLogout}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18, maxWidth: 640 }}>
        <div className="card-head">
          <h3>Appearance</h3>
        </div>
        <div className="card-pad">
          <div className="row between">
            <div>
              <div className="cell-strong">Theme</div>
              <div className="muted" style={{ fontSize: 13 }}>
                Switch between light and dark mode.
              </div>
            </div>
            <button className="btn btn-ghost" onClick={toggle}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
          </div>
        </div>
      </div>

      <div
        className="card"
        style={{ maxWidth: 640, borderColor: 'color-mix(in srgb, var(--down) 30%, transparent)' }}
      >
        <div className="card-head">
          <h3 style={{ color: 'var(--down)' }}>Danger zone</h3>
        </div>
        <div className="card-pad">
          <div className="row between">
            <div>
              <div className="cell-strong">Delete account</div>
              <div className="muted" style={{ fontSize: 13 }}>
                Permanently remove your account and all monitors.
              </div>
            </div>
            <button className="btn btn-danger">Delete account</button>
          </div>
        </div>
      </div>
    </>
  );
}
