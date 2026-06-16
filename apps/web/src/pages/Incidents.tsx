import { CheckCircle2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui';
import { formatDateTime, formatDuration, timeAgo } from '../lib/format';
import { incidents as allIncidents } from '../lib/mock';

type Filter = 'ALL' | 'ONGOING' | 'RESOLVED';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ONGOING', label: 'Ongoing' },
  { key: 'RESOLVED', label: 'Resolved' },
];

export function Incidents() {
  const [filter, setFilter] = useState<Filter>('ALL');

  const filtered = useMemo(() => {
    if (filter === 'ONGOING') return allIncidents.filter((i) => !i.resolvedAt);
    if (filter === 'RESOLVED') return allIncidents.filter((i) => i.resolvedAt);
    return allIncidents;
  }, [filter]);

  const ongoing = allIncidents.filter((i) => !i.resolvedAt).length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Incidents</h1>
          <p>Every recorded outage, with cause and duration.</p>
        </div>
      </div>

      <div className="grid grid-stats" style={{ marginBottom: 18 }}>
        <div className="card stat">
          <div className="label">Ongoing</div>
          <div className="value" style={{ color: ongoing ? 'var(--down)' : 'var(--up)' }}>
            {ongoing}
          </div>
        </div>
        <div className="card stat">
          <div className="label">Total (30d)</div>
          <div className="value">{allIncidents.length}</div>
        </div>
        <div className="card stat">
          <div className="label">Mean time to recovery</div>
          <div className="value" style={{ fontSize: 22 }}>
            {formatDuration(
              Math.round(
                allIncidents
                  .filter((i) => i.resolvedAt)
                  .reduce((s, i) => s + i.durationSeconds, 0) /
                  Math.max(1, allIncidents.filter((i) => i.resolvedAt).length),
              ),
            )}
          </div>
        </div>
        <div className="card stat">
          <div className="label">Affected monitors</div>
          <div className="value">{new Set(allIncidents.map((i) => i.monitorId)).size}</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="seg">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={f.key === filter ? 'active' : ''}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={22} />}
            title="No incidents here"
            text="Nothing matches this filter — which usually means things are healthy."
          />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Monitor</th>
                <th>Started</th>
                <th>Duration</th>
                <th>Cause</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc) => (
                <tr key={inc.id}>
                  <td>
                    <Link to={`/app/monitors/${inc.monitorId}`} className="cell-strong">
                      {inc.monitorName}
                    </Link>
                  </td>
                  <td>
                    {formatDateTime(inc.startedAt)}
                    <div className="faint" style={{ fontSize: 11.5 }}>
                      {timeAgo(inc.startedAt)}
                    </div>
                  </td>
                  <td>{formatDuration(inc.durationSeconds)}</td>
                  <td className="muted">{inc.cause}</td>
                  <td>
                    {inc.resolvedAt ? (
                      <span className="pill pill-up">
                        <span className="dot" /> Resolved
                      </span>
                    ) : (
                      <span className="pill pill-down">
                        <span className="dot live" /> Ongoing
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
