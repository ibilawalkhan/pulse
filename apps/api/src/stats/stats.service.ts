import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  ResultBucketSize,
  ResultsQueryDto,
  ResultsResponse,
  UptimeQueryDto,
  UptimeResponse,
  UptimeWindow,
} from '@pulse/shared';
import { StatsRepository } from './stats.repository';

/** Maps API window/bucket tokens to Postgres interval literals (never raw user input). */
const WINDOW_INTERVALS: Record<UptimeWindow, string> = {
  '24h': '24 hours',
  '7d': '7 days',
  '30d': '30 days',
};

const BUCKET_INTERVALS: Record<ResultBucketSize, string> = {
  '1m': '1 minute',
  '5m': '5 minutes',
  '15m': '15 minutes',
  '1h': '1 hour',
  '6h': '6 hours',
  '1d': '1 day',
};

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class StatsService {
  constructor(private readonly repository: StatsRepository) {}

  async uptime(userId: string, monitorId: string, query: UptimeQueryDto): Promise<UptimeResponse> {
    await this.assertOwned(userId, monitorId);
    const window: UptimeWindow = query.window ?? '24h';

    const { up, total } = await this.repository.getUptime(monitorId, WINDOW_INTERVALS[window]);
    return {
      window,
      uptime: total === 0 ? 1 : up / total,
      totalChecks: total,
      successfulChecks: up,
    };
  }

  async results(
    userId: string,
    monitorId: string,
    query: ResultsQueryDto,
  ): Promise<ResultsResponse> {
    await this.assertOwned(userId, monitorId);

    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from ? new Date(query.from) : new Date(to.getTime() - DAY_MS);
    const bucket: ResultBucketSize = query.bucket ?? '5m';

    const rows = await this.repository.getBuckets(monitorId, from, to, BUCKET_INTERVALS[bucket]);
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      bucket,
      buckets: rows.map((r) => ({
        bucketStart: r.bucketStart.toISOString(),
        avgResponseMs: r.avgResponseMs,
        totalChecks: r.total,
        successfulChecks: r.up,
      })),
    };
  }

  private async assertOwned(userId: string, monitorId: string): Promise<void> {
    const owned = await this.repository.findOwnedMonitorId(monitorId, userId);
    if (!owned) {
      throw new NotFoundException('Monitor not found');
    }
  }
}
