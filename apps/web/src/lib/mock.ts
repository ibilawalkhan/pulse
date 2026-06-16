import type {
  AlertChannel,
  CheckPoint,
  CurrentUser,
  Incident,
  Monitor,
  UptimeWindow,
} from './types';

// ---------------------------------------------------------------------------
// Deterministic pseudo-random generator so the dummy charts stay stable
// between renders (a Math.random() series would jump on every re-render).
// ---------------------------------------------------------------------------
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const now = Date.now();
const iso = (msAgo: number): string => new Date(now - msAgo).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const currentUser: CurrentUser = {
  id: 'usr_01',
  email: 'kbilawal84437@gmail.com',
  name: 'Bilawal Khan',
};

export const monitors: Monitor[] = [
  {
    id: 'mon_api_prod',
    name: 'API — Production',
    url: 'https://api.acme.io/health',
    method: 'GET',
    intervalSeconds: 60,
    expectedStatus: 200,
    timeoutMs: 10000,
    status: 'UP',
    consecutiveFailures: 0,
    uptime24h: 1,
    uptime7d: 0.9994,
    uptime30d: 0.9989,
    lastResponseMs: 142,
    lastCheckedAt: iso(38_000),
    createdAt: iso(120 * DAY),
  },
  {
    id: 'mon_web_app',
    name: 'Marketing Site',
    url: 'https://www.acme.io',
    method: 'GET',
    intervalSeconds: 300,
    expectedStatus: 200,
    timeoutMs: 10000,
    status: 'UP',
    consecutiveFailures: 0,
    uptime24h: 0.9986,
    uptime7d: 0.9971,
    uptime30d: 0.9965,
    lastResponseMs: 318,
    lastCheckedAt: iso(2 * MIN),
    createdAt: iso(95 * DAY),
  },
  {
    id: 'mon_checkout',
    name: 'Checkout Service',
    url: 'https://api.acme.io/v2/checkout',
    method: 'POST',
    intervalSeconds: 60,
    expectedStatus: 200,
    timeoutMs: 8000,
    status: 'DOWN',
    consecutiveFailures: 4,
    uptime24h: 0.9123,
    uptime7d: 0.982,
    uptime30d: 0.991,
    lastResponseMs: null,
    lastCheckedAt: iso(45_000),
    createdAt: iso(60 * DAY),
  },
  {
    id: 'mon_auth',
    name: 'Auth / SSO',
    url: 'https://auth.acme.io/.well-known/openid-configuration',
    method: 'GET',
    intervalSeconds: 300,
    expectedStatus: 200,
    timeoutMs: 10000,
    status: 'UP',
    consecutiveFailures: 0,
    uptime24h: 1,
    uptime7d: 1,
    uptime30d: 0.9998,
    lastResponseMs: 89,
    lastCheckedAt: iso(70_000),
    createdAt: iso(140 * DAY),
  },
  {
    id: 'mon_cdn',
    name: 'CDN Edge (eu-west)',
    url: 'https://cdn.acme.io/ping',
    method: 'HEAD',
    intervalSeconds: 900,
    expectedStatus: 200,
    timeoutMs: 5000,
    status: 'PAUSED',
    consecutiveFailures: 0,
    uptime24h: 0.9999,
    uptime7d: 0.9997,
    uptime30d: 0.9995,
    lastResponseMs: 24,
    lastCheckedAt: iso(3 * HOUR),
    createdAt: iso(30 * DAY),
  },
  {
    id: 'mon_billing',
    name: 'Billing Webhook',
    url: 'https://api.acme.io/webhooks/stripe',
    method: 'POST',
    intervalSeconds: 300,
    expectedStatus: 200,
    timeoutMs: 10000,
    status: 'PENDING',
    consecutiveFailures: 0,
    uptime24h: 1,
    uptime7d: 1,
    uptime30d: 1,
    lastResponseMs: null,
    lastCheckedAt: null,
    createdAt: iso(20 * MIN),
  },
];

const windowConfig: Record<UptimeWindow, { points: number; stepMs: number }> = {
  '24h': { points: 48, stepMs: 30 * MIN },
  '7d': { points: 56, stepMs: 3 * HOUR },
  '30d': { points: 60, stepMs: 12 * HOUR },
};

/** Generate a response-time / availability series for a monitor + window. */
export function getCheckSeries(monitorId: string, window: UptimeWindow): CheckPoint[] {
  const monitor = monitors.find((m) => m.id === monitorId);
  const { points, stepMs } = windowConfig[window];
  const rand = mulberry32(hashSeed(monitorId + window));
  const base = monitor ? baselineLatency(monitor) : 120;
  const series: CheckPoint[] = [];

  for (let i = points - 1; i >= 0; i -= 1) {
    const jitter = (rand() - 0.5) * base * 0.5;
    const spike = rand() > 0.94 ? base * (1 + rand() * 2) : 0;
    const responseMs = Math.max(8, Math.round(base + jitter + spike));
    // Inject the occasional outage, and keep the DOWN monitor mostly failing
    // toward the end of the window.
    const failChance = monitor?.status === 'DOWN' && i < 6 ? 0.7 : 0.02;
    const up = rand() > failChance;
    series.push({
      t: iso((i + 1) * stepMs),
      responseMs: up ? responseMs : 0,
      up,
    });
  }
  return series;
}

function baselineLatency(monitor: Monitor): number {
  switch (monitor.id) {
    case 'mon_cdn':
      return 26;
    case 'mon_auth':
      return 92;
    case 'mon_api_prod':
      return 140;
    case 'mon_web_app':
      return 300;
    default:
      return 180;
  }
}

export const incidents: Incident[] = [
  {
    id: 'inc_01',
    monitorId: 'mon_checkout',
    monitorName: 'Checkout Service',
    startedAt: iso(4 * MIN),
    resolvedAt: null,
    cause: 'HTTP 503 — upstream payment gateway unavailable',
    durationSeconds: 4 * 60,
  },
  {
    id: 'inc_02',
    monitorId: 'mon_web_app',
    monitorName: 'Marketing Site',
    startedAt: iso(9 * HOUR),
    resolvedAt: iso(9 * HOUR - 6 * MIN),
    cause: 'TIMEOUT — no response within 10000ms',
    durationSeconds: 6 * 60,
  },
  {
    id: 'inc_03',
    monitorId: 'mon_checkout',
    monitorName: 'Checkout Service',
    startedAt: iso(2 * DAY),
    resolvedAt: iso(2 * DAY - 22 * MIN),
    cause: 'HTTP 500 — internal server error',
    durationSeconds: 22 * 60,
  },
  {
    id: 'inc_04',
    monitorId: 'mon_api_prod',
    monitorName: 'API — Production',
    startedAt: iso(5 * DAY),
    resolvedAt: iso(5 * DAY - 2 * MIN),
    cause: 'CONNECTION_REFUSED — deploy rollout',
    durationSeconds: 2 * 60,
  },
  {
    id: 'inc_05',
    monitorId: 'mon_web_app',
    monitorName: 'Marketing Site',
    startedAt: iso(12 * DAY),
    resolvedAt: iso(12 * DAY - 14 * MIN),
    cause: 'HTTP 502 — bad gateway',
    durationSeconds: 14 * 60,
  },
];

export const alertChannels: AlertChannel[] = [
  { id: 'ch_01', type: 'EMAIL', destination: 'kbilawal84437@gmail.com', enabled: true },
  { id: 'ch_02', type: 'EMAIL', destination: 'oncall@acme.io', enabled: true },
  {
    id: 'ch_03',
    type: 'SLACK_WEBHOOK',
    destination: 'https://hooks.slack.com/services/T00/B00/xxxxxxxx',
    enabled: true,
  },
  {
    id: 'ch_04',
    type: 'SLACK_WEBHOOK',
    destination: 'https://hooks.slack.com/services/T00/B01/yyyyyyyy',
    enabled: false,
  },
];

export function getMonitor(id: string): Monitor | undefined {
  return monitors.find((m) => m.id === id);
}

export function getIncidentsForMonitor(id: string): Incident[] {
  return incidents.filter((i) => i.monitorId === id);
}

export interface FleetStats {
  total: number;
  up: number;
  down: number;
  paused: number;
  pending: number;
  avgUptime24h: number;
  avgResponseMs: number;
  ongoingIncidents: number;
}

export function getFleetStats(): FleetStats {
  const active = monitors.filter((m) => m.status !== 'PAUSED' && m.status !== 'PENDING');
  const responding = active.filter((m) => m.lastResponseMs != null);
  return {
    total: monitors.length,
    up: monitors.filter((m) => m.status === 'UP').length,
    down: monitors.filter((m) => m.status === 'DOWN').length,
    paused: monitors.filter((m) => m.status === 'PAUSED').length,
    pending: monitors.filter((m) => m.status === 'PENDING').length,
    avgUptime24h: active.length
      ? active.reduce((sum, m) => sum + m.uptime24h, 0) / active.length
      : 1,
    avgResponseMs: responding.length
      ? Math.round(
          responding.reduce((sum, m) => sum + (m.lastResponseMs ?? 0), 0) / responding.length,
        )
      : 0,
    ongoingIncidents: incidents.filter((i) => i.resolvedAt === null).length,
  };
}
