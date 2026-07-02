import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UptimeRow {
  up: number;
  total: number;
}

export interface BucketRow {
  bucketStart: Date;
  avgResponseMs: number | null;
  up: number;
  total: number;
}

@Injectable()
export class StatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOwnedMonitorId(monitorId: string, userId: string): Promise<string | null> {
    const monitor = await this.prisma.monitor.findFirst({
      where: { id: monitorId, userId },
      select: { id: true },
    });
    return monitor?.id ?? null;
  }

  /** Successful vs total checks within the given interval before now. */
  async getUptime(monitorId: string, windowInterval: string): Promise<UptimeRow> {
    // `windowInterval` is passed as a bound parameter (not string-interpolated).
    const rows = await this.prisma.$queryRaw<{ up: bigint; total: bigint }[]>`
      SELECT count(*) FILTER (WHERE success) AS up,
             count(*) AS total
      FROM "check_result"
      WHERE monitor_id = ${monitorId}::uuid
        AND checked_at >= now() - ${windowInterval}::interval
    `;
    const row = rows[0] ?? { up: 0n, total: 0n };
    return { up: Number(row.up), total: Number(row.total) };
  }

  /** Time-bucketed average response time + success counts over [from, to). */
  async getBuckets(
    monitorId: string,
    from: Date,
    to: Date,
    bucketInterval: string,
  ): Promise<BucketRow[]> {
    const rows = await this.prisma.$queryRaw<
      { bucket: Date; avg_ms: number | null; up: bigint; total: bigint }[]
    >`
      SELECT date_bin(${bucketInterval}::interval, checked_at, ${from}) AS bucket,
             round(avg(response_time_ms) FILTER (WHERE success))::int AS avg_ms,
             count(*) FILTER (WHERE success) AS up,
             count(*) AS total
      FROM "check_result"
      WHERE monitor_id = ${monitorId}::uuid
        AND checked_at >= ${from}
        AND checked_at < ${to}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;
    return rows.map((r) => ({
      bucketStart: r.bucket,
      avgResponseMs: r.avg_ms,
      up: Number(r.up),
      total: Number(r.total),
    }));
  }
}
