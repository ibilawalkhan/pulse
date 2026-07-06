import { MoreVertical, Pause, Play, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { EmptyState, ErrorState, Loading, MethodTag, StatusPill } from '../components/ui';
import { api, apiErrorMessage } from '../lib/api';
import { formatInterval, formatResponse, formatUptime, timeAgo } from '../lib/format';
import { useApi } from '../lib/useApi';
import type { HttpMethod, Monitor, MonitorStatus } from '../lib/types';

type Filter = 'ALL' | MonitorStatus;
const FILTERS: Filter[] = ['ALL', 'UP', 'DOWN', 'PAUSED', 'PENDING'];

const blankForm = {
  name: '',
  url: 'https://',
  method: 'GET' as HttpMethod,
  intervalSeconds: 300 as 60 | 300 | 900,
  expectedStatus: 200,
};

export function Monitors() {
  const { data, loading, error, reload } = useApi(() => api.monitors.list(), []);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const list: Monitor[] = data ?? [];

  const filtered = useMemo(() => {
    return list.filter((m) => {
      const matchesFilter = filter === 'ALL' || m.status === filter;
      const matchesQuery =
        !query ||
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.url.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [list, filter, query]);

  const counts = useMemo(
    () =>
      ({
        ALL: list.length,
        UP: list.filter((m) => m.status === 'UP').length,
        DOWN: list.filter((m) => m.status === 'DOWN').length,
        PAUSED: list.filter((m) => m.status === 'PAUSED').length,
        PENDING: list.filter((m) => m.status === 'PENDING').length,
      }) as Record<Filter, number>,
    [list],
  );

  const togglePause = async (m: Monitor): Promise<void> => {
    setMenuFor(null);
    await api.monitors.update(m.id, { paused: m.status !== 'PAUSED' });
    reload();
  };

  const remove = async (id: string): Promise<void> => {
    setMenuFor(null);
    await api.monitors.remove(id);
    reload();
  };

  const create = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      await api.monitors.create({
        name: form.name,
        url: form.url,
        method: form.method,
        intervalSeconds: form.intervalSeconds,
        expectedStatus: Number(form.expectedStatus),
      });
      setForm(blankForm);
      setOpen(false);
      reload();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not create monitor'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Monitors</h1>
          <p>Manage the endpoints Pulse is watching.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} />
          Add monitor
        </button>
      </div>

      <div className="toolbar">
        <div className="seg">
          {FILTERS.map((f) => (
            <button key={f} className={f === filter ? 'active' : ''} onClick={() => setFilter(f)}>
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()} ({counts[f]})
            </button>
          ))}
        </div>
        <label className="search" style={{ marginLeft: 'auto' }}>
          <Search size={16} />
          <input
            placeholder="Search by name or URL…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>

      <div className="card">
        {loading ? (
          <Loading label="Loading monitors…" />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={22} />}
            title={list.length === 0 ? 'No monitors yet' : 'No monitors found'}
            text={
              list.length === 0
                ? 'Add your first monitor to start watching an endpoint.'
                : 'Try a different filter or search term.'
            }
            action={
              <button className="btn btn-primary" onClick={() => setOpen(true)}>
                <Plus size={16} />
                Add monitor
              </button>
            }
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Monitor</th>
                <th>Status</th>
                <th>Uptime 24h</th>
                <th>Response</th>
                <th>Interval</th>
                <th>Last check</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Link to={`/app/monitors/${m.id}`} className="cell-strong">
                      {m.name}
                    </Link>
                    <div className="row" style={{ gap: 7, marginTop: 3 }}>
                      <MethodTag method={m.method} />
                      <span className="faint mono" style={{ fontSize: 11.5 }}>
                        {m.url}
                      </span>
                    </div>
                  </td>
                  <td>
                    <StatusPill status={m.status} />
                  </td>
                  <td className="cell-strong">{formatUptime(m.uptime24h)}</td>
                  <td>{formatResponse(m.lastResponseMs)}</td>
                  <td className="muted">{formatInterval(m.intervalSeconds)}</td>
                  <td className="muted">{timeAgo(m.lastCheckedAt)}</td>
                  <td style={{ position: 'relative', width: 48 }}>
                    <button
                      className="btn-icon"
                      onClick={() => setMenuFor(menuFor === m.id ? null : m.id)}
                      aria-label="Monitor actions"
                    >
                      <MoreVertical size={17} />
                    </button>
                    {menuFor === m.id && (
                      <div
                        className="card"
                        style={{
                          position: 'absolute',
                          right: 16,
                          top: 44,
                          zIndex: 30,
                          boxShadow: 'var(--shadow-lg)',
                          padding: 6,
                          minWidth: 160,
                        }}
                      >
                        <button
                          className="nav-item"
                          style={{ width: '100%' }}
                          onClick={() => togglePause(m)}
                        >
                          {m.status === 'PAUSED' ? <Play size={16} /> : <Pause size={16} />}
                          {m.status === 'PAUSED' ? 'Resume' : 'Pause'}
                        </button>
                        <button
                          className="nav-item"
                          style={{ width: '100%', color: 'var(--down)' }}
                          onClick={() => remove(m.id)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={open}
        title="Add monitor"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              form="create-monitor"
              type="submit"
              disabled={saving}
            >
              <Plus size={16} />
              {saving ? 'Creating…' : 'Create monitor'}
            </button>
          </>
        }
      >
        <form id="create-monitor" onSubmit={create}>
          {formError && (
            <div className="banner banner-danger" style={{ marginBottom: 14 }}>
              {formError}
            </div>
          )}
          <div className="field">
            <label htmlFor="m-name">Name</label>
            <input
              id="m-name"
              className="input"
              placeholder="e.g. API — Production"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="m-url">URL</label>
            <input
              id="m-url"
              className="input mono"
              placeholder="https://api.example.com/health"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              required
            />
            <span className="hint">Must be a public http(s) endpoint.</span>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="m-method">Method</label>
              <select
                id="m-method"
                className="select"
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value as HttpMethod })}
              >
                <option>GET</option>
                <option>POST</option>
                <option>HEAD</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="m-interval">Check interval</label>
              <select
                id="m-interval"
                className="select"
                value={form.intervalSeconds}
                onChange={(e) =>
                  setForm({ ...form, intervalSeconds: Number(e.target.value) as 60 | 300 | 900 })
                }
              >
                <option value={60}>Every 1 minute</option>
                <option value={300}>Every 5 minutes</option>
                <option value={900}>Every 15 minutes</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="m-status">Expected status code</label>
            <input
              id="m-status"
              className="input"
              type="number"
              value={form.expectedStatus}
              onChange={(e) => setForm({ ...form, expectedStatus: Number(e.target.value) })}
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
