import { ArrowLeft, ExternalLink, Pause, Play, Siren } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ResponseTimeChart } from '../components/ResponseTimeChart';
import { ErrorState, Loading, MethodTag, StatusPill } from '../components/ui';
import { api } from '../lib/api';
import { bucketsToPoints, windowRange } from '../lib/chart';
import {
  formatDateTime,
  formatDuration,
  formatInterval,
  formatResponse,
  formatUptime,
  timeAgo,
  WINDOW_LABEL,
} from '../lib/format';
import { useApi } from '../lib/useApi';
import type { UptimeWindow } from '../lib/types';

const WINDOWS: UptimeWindow[] = ['24h', '7d', '30d'];

export function MonitorDetail() {
  const { id = '' } = useParams();
  const [window, setWindow] = useState<UptimeWindow>('24h');

  const monitorApi = useApi(() => api.monitors.get(id), [id]);
  const uptimeApi = useApi(() => api.monitors.uptime(id, window), [id, window]);
  const resultsApi = useApi(() => api.monitors.results(id, windowRange(window)), [id, window]);
  const incidentsApi = useApi(() => api.monitors.incidents(id), [id]);

  const points = useMemo(
    () => (resultsApi.data ? bucketsToPoints(resultsApi.data) : []),
    [resultsApi.data],
  );
  const avgResponse = useMemo(() => {
    const withData = points.filter((p) => p.up);
    return withData.length
      ? Math.round(withData.reduce((s, p) => s + p.responseMs, 0) / withData.length)
      : null;
  }, [points]);

  if (monitorApi.loading) {
    return <Loading label="Loading monitor…" />;
  }
  if (monitorApi.error || !monitorApi.data) {
    return (
      <ErrorState message={monitorApi.error ?? 'Monitor not found'} onRetry={monitorApi.reload} />
    );
  }

  const monitor = monitorApi.data;
  const incidents = incidentsApi.data ?? [];

  const togglePause = async (): Promise<void> => {
    await api.monitors.update(monitor.id, { paused: monitor.status !== 'PAUSED' });
    monitorApi.reload();
  };

  return (
    <>
      <div className="breadcrumb">
        <Link to="/app/monitors" className="row" style={{ gap: 5 }}>
          <ArrowLeft size={14} /> Monitors
        </Link>
        <span>/</span>
        <span className="muted">{monitor.name}</span>
      </div>

      {monitor.status === 'DOWN' && (
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
            <StatusPill status={monitor.status} />
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
          <button className="btn btn-ghost" onClick={togglePause}>
            {monitor.status === 'PAUSED' ? <Play size={16} /> : <Pause size={16} />}
            {monitor.status === 'PAUSED' ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      <div className="grid grid-stats" style={{ marginBottom: 18 }}>
        <div className="card stat">
          <div className="label">Uptime ({window})</div>
          <div className="value">{uptimeApi.data ? formatUptime(uptimeApi.data.uptime) : '—'}</div>
        </div>
        <div className="card stat">
          <div className="label">Checks ({window})</div>
          <div className="value">{uptimeApi.data?.totalChecks ?? '—'}</div>
        </div>
        <div className="card stat">
          <div className="label">Avg response ({window})</div>
          <div className="value">{formatResponse(avgResponse ?? monitor.lastResponseMs)}</div>
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
            <span className="sub">{WINDOW_LABEL[window]}</span>
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
          {resultsApi.loading ? (
            <Loading label="Loading chart…" />
          ) : points.length === 0 ? (
            <div className="empty">
              <p className="muted">No check data for this window yet.</p>
            </div>
          ) : (
            <ResponseTimeChart
              series={points}
              window={window}
              color={monitor.status === 'DOWN' ? '#ef4444' : '#6366f1'}
              height={300}
            />
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Incident history</h3>
          </div>
          {incidentsApi.loading ? (
            <Loading label="Loading incidents…" />
          ) : incidents.length === 0 ? (
            <div className="empty">
              <div className="empty-ico">
                <Siren size={20} />
              </div>
              <p className="muted">No recorded outages. Nice.</p>
            </div>
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
                    <td className="muted">{inc.cause ?? '—'}</td>
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
            <ConfigRow
              label="Failure threshold"
              value={`${monitor.failureThreshold} consecutive`}
            />
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
