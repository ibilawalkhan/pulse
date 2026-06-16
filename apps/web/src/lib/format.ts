import type { MonitorStatus, UptimeWindow } from './types';

/** Format an uptime ratio (0..1) as a percentage string. */
export function formatUptime(ratio: number): string {
  return `${(ratio * 100).toFixed(2)}%`;
}

/** Human-readable relative time, e.g. "3 min ago". */
export function timeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

/** Format a duration in seconds as e.g. "1h 23m" or "45s". */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  if (min < 60) {
    const s = seconds % 60;
    return s ? `${min}m ${s}s` : `${min}m`;
  }
  const hr = Math.floor(min / 60);
  const m = min % 60;
  if (hr < 24) return m ? `${hr}h ${m}m` : `${hr}h`;
  const day = Math.floor(hr / 24);
  const h = hr % 24;
  return h ? `${day}d ${h}h` : `${day}d`;
}

/** Format an ISO timestamp as a readable date-time. */
export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatInterval(seconds: number): string {
  if (seconds === 60) return 'Every 1 min';
  if (seconds === 300) return 'Every 5 min';
  if (seconds === 900) return 'Every 15 min';
  return `Every ${seconds}s`;
}

export function formatResponse(ms: number | null): string {
  if (ms == null) return '—';
  return `${ms} ms`;
}

export const STATUS_LABEL: Record<MonitorStatus, string> = {
  UP: 'Operational',
  DOWN: 'Down',
  PAUSED: 'Paused',
  PENDING: 'Pending',
};

export const WINDOW_LABEL: Record<UptimeWindow, string> = {
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
};
