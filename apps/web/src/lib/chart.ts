import type { CheckPoint, ResultBucketSize, ResultsResult, UptimeWindow } from './types';

const WINDOW_PARAMS: Record<UptimeWindow, { bucket: ResultBucketSize; fromMs: number }> = {
  '24h': { bucket: '15m', fromMs: 24 * 60 * 60 * 1000 },
  '7d': { bucket: '1h', fromMs: 7 * 24 * 60 * 60 * 1000 },
  '30d': { bucket: '6h', fromMs: 30 * 24 * 60 * 60 * 1000 },
};

// Build the /results query params (from/to/bucket) for an uptime window.
export function windowRange(window: UptimeWindow): {
  from: string;
  to: string;
  bucket: ResultBucketSize;
} {
  const to = new Date();
  const from = new Date(to.getTime() - WINDOW_PARAMS[window].fromMs);
  return { from: from.toISOString(), to: to.toISOString(), bucket: WINDOW_PARAMS[window].bucket };
}

// Map a bucketed results response to chart points.
export function bucketsToPoints(results: ResultsResult): CheckPoint[] {
  return results.buckets.map((b) => ({
    t: b.bucketStart,
    responseMs: b.avgResponseMs ?? 0,
    // A bucket with a successful check (non-null avg) counts as "up".
    up: b.avgResponseMs !== null,
  }));
}
