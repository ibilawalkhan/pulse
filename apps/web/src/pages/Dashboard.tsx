import { Activity, ArrowUpRight, CheckCircle2, Clock, Plus, Siren, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponseTimeChart } from '../components/ResponseTimeChart';
import { Stat, StatusPill } from '../components/ui';
import { formatDuration, formatResponse, formatUptime, timeAgo, WINDOW_LABEL } from '../lib/format';
import { getCheckSeries, getFleetStats, incidents, monitors } from '../lib/mock';
import type { UptimeWindow } from '../lib/types';

const WINDOWS: UptimeWindow[] = ['24h', '7d', '30d'];

export function Dashboard() {
  const stats = getFleetStats();
  const [window, setWindow] = useState<UptimeWindow>('24h');
  const featured = monitors[0];
  const series = getCheckSeries(featured.id, window);
  const recentIncidents = incidents.slice(0, 4);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Good to see you, Bilawal 👋</h1>
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
          trend={{ dir: 'pos', text: 'All core services online', icon: <TrendingUp size={13} /> }}
        />
        <Stat
          label="Avg uptime (24h)"
          value={formatUptime(stats.avgUptime24h)}
          icon={<Activity size={19} />}
          iconBg="var(--brand-soft)"
          iconColor="var(--brand)"
          trend={{ dir: 'pos', text: '+0.04% vs yesterday', icon: <ArrowUpRight size={13} /> }}
        />
        <Stat
          label="Avg response"
          value={formatResponse(stats.avgResponseMs)}
          icon={<Clock size={19} />}
          iconBg="var(--warn-soft)"
          iconColor="var(--warn)"
        />
        <Stat
          label="Ongoing incidents"
          value={stats.ongoingIncidents}
          icon={<Siren size={19} />}
          iconBg="var(--down-soft)"
          iconColor="var(--down)"
          trend={
            stats.ongoingIncidents > 0
              ? { dir: 'neg', text: 'Needs attention' }
              : { dir: 'pos', text: 'All clear' }
          }
        />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <h3>{featured.name}</h3>
              <span className="sub">Response time · {WINDOW_LABEL[window]}</span>
            </div>
            <div className="seg" style={{ marginLeft: 'auto' }}>
              {WINDOWS.map((w) => (
                <button
                  key={w}
                  className={w === window ? 'active' : ''}
                  onClick={() => setWindow(w)}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div className="card-pad">
            <ResponseTimeChart series={series} window={window} />
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
            <div className="divider" />
            <div className="kpi-inline">
              <div className="kpi">
                <div className="v">{stats.total}</div>
                <div className="l">Total monitors</div>
              </div>
              <div className="kpi">
                <div className="v">{formatUptime(stats.avgUptime24h)}</div>
                <div className="l">Avg uptime</div>
              </div>
            </div>
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
          <div className="stack" style={{ padding: '6px 0' }}>
            {recentIncidents.map((inc) => (
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
                    {inc.cause}
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
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 999,
            transition: 'width 300ms',
          }}
        />
      </div>
    </div>
  );
}
