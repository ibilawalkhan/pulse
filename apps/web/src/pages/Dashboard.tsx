import { Activity, CheckCircle2, Clock, Plus, Siren } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ResponseTimeChart } from '../components/ResponseTimeChart';
import { ErrorState, Loading, Stat, StatusPill } from '../components/ui';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { bucketsToPoints, windowRange } from '../lib/chart';
import { formatDuration, formatResponse, formatUptime, timeAgo } from '../lib/format';
import { useApi } from '../lib/useApi';
import type { IncidentWithMonitor, Monitor } from '../lib/types';

interface DashboardData {
  monitors: Monitor[];
  incidents: IncidentWithMonitor[];
}

async function loadDashboard(): Promise<DashboardData> {
  const monitors = await api.monitors.list();
  const nested = await Promise.all(
    monitors.map((m) =>
      api.monitors
        .incidents(m.id)
        .then((list) => list.map((i) => ({ ...i, monitorId: m.id, monitorName: m.name }))),
    ),
  );
  const incidents = nested
    .flat()
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  return { monitors, incidents };
}

export function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi(loadDashboard, []);

  const monitors = data?.monitors ?? [];
  const featured = monitors[0];
  const chartApi = useApi(
    () =>
      featured ? api.monitors.results(featured.id, windowRange('24h')) : Promise.resolve(null),
    [featured?.id],
  );
  const points = useMemo(
    () => (chartApi.data ? bucketsToPoints(chartApi.data) : []),
    [chartApi.data],
  );

  const stats = useMemo(() => {
    const active = monitors.filter((m) => m.status === 'UP' || m.status === 'DOWN');
    const responding = monitors.filter((m) => m.lastResponseMs != null);
    return {
      total: monitors.length,
      up: monitors.filter((m) => m.status === 'UP').length,
      down: monitors.filter((m) => m.status === 'DOWN').length,
      paused: monitors.filter((m) => m.status === 'PAUSED').length,
      pending: monitors.filter((m) => m.status === 'PENDING').length,
      avgUptime: active.length ? active.reduce((s, m) => s + m.uptime24h, 0) / active.length : 1,
      avgResponse: responding.length
        ? Math.round(
            responding.reduce((s, m) => s + (m.lastResponseMs ?? 0), 0) / responding.length,
          )
        : 0,
      ongoing: (data?.incidents ?? []).filter((i) => !i.resolvedAt).length,
    };
  }, [monitors, data]);

  const name = user?.email.split('@')[0] ?? 'there';

  if (loading) return <Loading label="Loading your dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Good to see you, {name} 👋</h1>
          <p>Here&apos;s how your services are performing right now.</p>
        </div>
        <Link to="/app/monitors" className="btn btn-primary">
          <Plus size={16} />
          Add monitor
        </Link>
      </div>

      <div className="grid grid-stats" style={{ marginBottom: 18 }}>
        <Stat
          label="Monitors up"
          value={`${stats.up}/${stats.total}`}
          icon={<CheckCircle2 size={19} />}
          iconBg="var(--up-soft)"
          iconColor="var(--up)"
        />
        <Stat
          label="Avg uptime (24h)"
          value={formatUptime(stats.avgUptime)}
          icon={<Activity size={19} />}
          iconBg="var(--brand-soft)"
          iconColor="var(--brand)"
        />
        <Stat
          label="Avg response"
          value={formatResponse(stats.avgResponse)}
          icon={<Clock size={19} />}
          iconBg="var(--warn-soft)"
          iconColor="var(--warn)"
        />
        <Stat
          label="Ongoing incidents"
          value={stats.ongoing}
          icon={<Siren size={19} />}
          iconBg="var(--down-soft)"
          iconColor="var(--down)"
          trend={
            stats.ongoing > 0
              ? { dir: 'neg', text: 'Needs attention' }
              : { dir: 'pos', text: 'All clear' }
          }
        />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <h3>{featured ? featured.name : 'Response time'}</h3>
              <span className="sub">Last 24 hours</span>
            </div>
          </div>
          <div className="card-pad">
            {!featured ? (
              <div className="empty">
                <p className="muted">Add a monitor to see response times.</p>
              </div>
            ) : chartApi.loading ? (
              <Loading label="Loading chart…" />
            ) : points.length === 0 ? (
              <div className="empty">
                <p className="muted">No checks recorded yet — data appears once the worker runs.</p>
              </div>
            ) : (
              <ResponseTimeChart series={points} window="24h" />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Fleet status</h3>
          </div>
          <div className="card-pad stack" style={{ gap: 14 }}>
            <StatusRow label="Operational" count={stats.up} total={stats.total} color="var(--up)" />
            <StatusRow label="Down" count={stats.down} total={stats.total} color="var(--down)" />
            <StatusRow
              label="Paused"
              count={stats.paused}
              total={stats.total}
              color="var(--warn)"
            />
            <StatusRow
              label="Pending"
              count={stats.pending}
              total={stats.total}
              color="var(--pending)"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Monitors</h3>
            <Link
              to="/app/monitors"
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 'auto' }}
            >
              View all
            </Link>
          </div>
          {monitors.length === 0 ? (
            <div className="empty">
              <p className="muted">No monitors yet.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Monitor</th>
                  <th>Status</th>
                  <th>Uptime 24h</th>
                  <th>Response</th>
                </tr>
              </thead>
              <tbody>
                {monitors.slice(0, 5).map((m) => (
                  <tr key={m.id}>
                    <td>
                      <Link to={`/app/monitors/${m.id}`} className="cell-strong">
                        {m.name}
                      </Link>
                      <div className="faint mono" style={{ fontSize: 11.5 }}>
                        {m.url}
                      </div>
                    </td>
                    <td>
                      <StatusPill status={m.status} />
                    </td>
                    <td>{formatUptime(m.uptime24h)}</td>
                    <td>{formatResponse(m.lastResponseMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Recent incidents</h3>
            <Link
              to="/app/incidents"
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 'auto' }}
            >
              View all
            </Link>
          </div>
          {(data?.incidents ?? []).length === 0 ? (
            <div className="empty">
              <div className="empty-ico">
                <CheckCircle2 size={20} />
              </div>
              <p className="muted">No incidents — all healthy.</p>
            </div>
          ) : (
            <div className="stack" style={{ padding: '6px 0' }}>
              {(data?.incidents ?? []).slice(0, 4).map((inc) => (
                <Link
                  to="/app/incidents"
                  key={inc.id}
                  className="row"
                  style={{ padding: '12px 20px', gap: 12 }}
                >
                  <span
                    className="stat-icon"
                    style={{
                      background: inc.resolvedAt ? 'var(--up-soft)' : 'var(--down-soft)',
                      color: inc.resolvedAt ? 'var(--up)' : 'var(--down)',
                      margin: 0,
                      width: 34,
                      height: 34,
                    }}
                  >
                    <Siren size={16} />
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="cell-strong">{inc.monitorName}</div>
                    <div
                      className="faint"
                      style={{
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {inc.cause ?? 'Outage'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12 }} className="muted">
                      {timeAgo(inc.startedAt)}
                    </div>
                    <div className="faint" style={{ fontSize: 11.5 }}>
                      {inc.resolvedAt ? formatDuration(inc.durationSeconds) : 'ongoing'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StatusRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="row between" style={{ marginBottom: 6 }}>
        <span className="row" style={{ gap: 8 }}>
          <span
            className="dot"
            style={{ width: 8, height: 8, borderRadius: 4, background: color }}
          />
          {label}
        </span>
        <span className="cell-strong">{count}</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 999 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}
