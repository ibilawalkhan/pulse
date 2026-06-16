import { ArrowLeft, ExternalLink, Pause, Play, Siren } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ResponseTimeChart } from '../components/ResponseTimeChart';
import { EmptyState, MethodTag, StatusPill } from '../components/ui';
import {
  formatDateTime,
  formatDuration,
  formatInterval,
  formatResponse,
  formatUptime,
  timeAgo,
  WINDOW_LABEL,
} from '../lib/format';
import { getCheckSeries, getIncidentsForMonitor, getMonitor } from '../lib/mock';
import type { MonitorStatus, UptimeWindow } from '../lib/types';

const WINDOWS: UptimeWindow[] = ['24h', '7d', '30d'];

export function MonitorDetail() {
  const { id = '' } = useParams();
  const monitor = getMonitor(id);
  const [window, setWindow] = useState<UptimeWindow>('24h');
  const [status, setStatus] = useState<MonitorStatus | null>(monitor?.status ?? null);

  const series = useMemo(
    () => (monitor ? getCheckSeries(monitor.id, window) : []),
    [monitor, window],
  );
  const incidents = monitor ? getIncidentsForMonitor(monitor.id) : [];

  const avgResponse = useMemo(() => {
    const up = series.filter((p) => p.up);
    return up.length ? Math.round(up.reduce((s, p) => s + p.responseMs, 0) / up.length) : 0;
  }, [series]);

  if (!monitor) {
    return (
      <EmptyState
        icon={<Siren size={22} />}
        title="Monitor not found"
        text="This monitor may have been deleted."
        action={
          <Link to="/app/monitors" className="btn btn-primary">
            Back to monitors
          </Link>
        }
      />
    );
  }

  const uptimeByWindow: Record<UptimeWindow, number> = {
    '24h': monitor.uptime24h,
    '7d': monitor.uptime7d,
    '30d': monitor.uptime30d,
  };
  const effectiveStatus = status ?? monitor.status;

  return (
    <>
      <div className="breadcrumb">
        <Link to="/app/monitors" className="row" style={{ gap: 5 }}>
          <ArrowLeft size={14} /> Monitors
        </Link>
        <span>/</span>
        <span className="muted">{monitor.name}</span>
      </div>

      {effectiveStatus === 'DOWN' && (
        <div className="banner banner-danger">
          <Siren size={18} />
          <span>
            <strong>{monitor.name} is down.</strong> {monitor.consecutiveFailures} consecutive
            failed checks — an incident is open and your team has been alerted.
          </span>
        </div>
      )}

      <div className="page-header">
        <div>
          <div className="row" style={{ gap: 12 }}>
            <h1>{monitor.name}</h1>
            <StatusPill status={effectiveStatus} />
          </div>
          <div className="row" style={{ gap: 8, marginTop: 8 }}>
            <MethodTag method={monitor.method} />
            <a
              href={monitor.url}
              target="_blank"
              rel="noreferrer"
              className="row mono muted"
              style={{ gap: 5, fontSize: 13 }}
            >
              {monitor.url}
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
        <div className="row">
          <button
            className="btn btn-ghost"
            onClick={() => setStatus(effectiveStatus === 'PAUSED' ? 'UP' : 'PAUSED')}
          >
            {effectiveStatus === 'PAUSED' ? <Play size={16} /> : <Pause size={16} />}
            {effectiveStatus === 'PAUSED' ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      <div className="grid grid-stats" style={{ marginBottom: 18 }}>
        <div className="card stat">
          <div className="label">Uptime (24h)</div>
          <div className="value">{formatUptime(monitor.uptime24h)}</div>
        </div>
        <div className="card stat">
          <div className="label">Uptime (7d)</div>
          <div className="value">{formatUptime(monitor.uptime7d)}</div>
        </div>
        <div className="card stat">
          <div className="label">Avg response</div>
          <div className="value">{formatResponse(avgResponse || monitor.lastResponseMs)}</div>
        </div>
        <div className="card stat">
          <div className="label">Last check</div>
          <div className="value" style={{ fontSize: 20 }}>
            {timeAgo(monitor.lastCheckedAt)}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-head">
          <div>
            <h3>Response time</h3>
            <span className="sub">
              {WINDOW_LABEL[window]} · uptime {formatUptime(uptimeByWindow[window])}
            </span>
          </div>
          <div className="seg" style={{ marginLeft: 'auto' }}>
            {WINDOWS.map((w) => (
              <button key={w} className={w === window ? 'active' : ''} onClick={() => setWindow(w)}>
                {w}
              </button>
            ))}
          </div>
        </div>
        <div className="card-pad">
          <ResponseTimeChart
            series={series}
            window={window}
            color={effectiveStatus === 'DOWN' ? '#ef4444' : '#6366f1'}
            height={300}
          />
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Incident history</h3>
          </div>
          {incidents.length === 0 ? (
            <EmptyState
              icon={<Siren size={20} />}
              title="No incidents"
              text="This monitor hasn't had any recorded outages. Nice."
            />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Started</th>
                  <th>Duration</th>
                  <th>Cause</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id}>
                    <td>{formatDateTime(inc.startedAt)}</td>
                    <td>{formatDuration(inc.durationSeconds)}</td>
                    <td className="muted">{inc.cause}</td>
                    <td>
                      {inc.resolvedAt ? (
                        <span className="pill pill-up">
                          <span className="dot" /> Resolved
                        </span>
                      ) : (
                        <span className="pill pill-down">
                          <span className="dot" /> Ongoing
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Configuration</h3>
          </div>
          <div className="card-pad stack" style={{ gap: 0 }}>
            <ConfigRow label="HTTP method" value={monitor.method} />
            <ConfigRow label="Check interval" value={formatInterval(monitor.intervalSeconds)} />
            <ConfigRow label="Expected status" value={String(monitor.expectedStatus)} />
            <ConfigRow label="Timeout" value={`${monitor.timeoutMs} ms`} />
            <ConfigRow label="Failure threshold" value="2 consecutive" />
            <ConfigRow label="Created" value={formatDateTime(monitor.createdAt)} last />
          </div>
        </div>
      </div>
    </>
  );
}

function ConfigRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="row between"
      style={{
        padding: '12px 0',
        borderBottom: last ? 'none' : '1px solid var(--surface-border)',
      }}
    >
      <span className="muted">{label}</span>
      <span className="cell-strong">{value}</span>
    </div>
  );
}
