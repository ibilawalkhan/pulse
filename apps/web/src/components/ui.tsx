import type { ReactNode } from 'react';
import { STATUS_LABEL } from '../lib/format';
import type { CheckPoint, MonitorStatus } from '../lib/types';

const PILL_CLASS: Record<MonitorStatus, string> = {
  UP: 'pill pill-up',
  DOWN: 'pill pill-down',
  PAUSED: 'pill pill-paused',
  PENDING: 'pill pill-pending',
};

export function StatusPill({ status }: { status: MonitorStatus }) {
  return (
    <span className={PILL_CLASS[status]}>
      <span className={`dot${status === 'UP' ? ' live' : ''}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Compact availability history strip built from a check series. */
export function UptimeStrip({ series, bars = 40 }: { series: CheckPoint[]; bars?: number }) {
  const slice = series.slice(-bars);
  return (
    <div className="uptime-strip" aria-hidden>
      {slice.map((p, i) => (
        <div
          key={i}
          className={`uptime-bar${p.up ? '' : ' bad'}`}
          style={{ height: p.up ? `${Math.min(100, 45 + (p.responseMs % 55))}%` : '100%' }}
          title={`${new Date(p.t).toLocaleString()} — ${p.up ? `${p.responseMs} ms` : 'down'}`}
        />
      ))}
    </div>
  );
}

interface StatProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: { dir: 'pos' | 'neg'; text: string; icon?: ReactNode };
}

export function Stat({ label, value, icon, iconBg, iconColor, trend }: StatProps) {
  return (
    <div className="card stat">
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="label">{label}</div>
          <div className="value">{value}</div>
          {trend && (
            <div className={`trend ${trend.dir}`}>
              {trend.icon}
              {trend.text}
            </div>
          )}
        </div>
        <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-ico">{icon}</div>
      <h3>{title}</h3>
      <p className="muted" style={{ maxWidth: 360, margin: '6px auto 16px' }}>
        {text}
      </p>
      {action}
    </div>
  );
}

export function MethodTag({ method }: { method: string }) {
  return <span className="tag">{method}</span>;
}
