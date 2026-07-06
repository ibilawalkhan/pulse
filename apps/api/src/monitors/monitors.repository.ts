import { Injectable } from '@nestjs/common';
import { type Monitor, Prisma } from '@pulse/db';
import { PrismaService } from '../prisma/prisma.service';

/** Derived per-monitor stats (24h uptime + last check) for the list/detail views. */
export interface MonitorStatsRow {
  id: string;
  uptime24h: number;
  lastResponseMs: number | null;
  lastCheckedAt: Date | null;
}

/** All Prisma access for the monitors domain. Every read is scoped by userId. */
@Injectable()
export class MonitorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByUser(userId: string): Promise<Monitor[]> {
    return this.prisma.monitor.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByIdForUser(id: string, userId: string): Promise<Monitor | null> {
    return this.prisma.monitor.findFirst({ where: { id, userId } });
  }

  create(data: Prisma.MonitorCreateInput): Promise<Monitor> {
    return this.prisma.monitor.create({ data });
  }

  update(id: string, data: Prisma.MonitorUpdateInput): Promise<Monitor> {
    return this.prisma.monitor.update({ where: { id }, data });
  }

  delete(id: string): Promise<Monitor> {
    return this.prisma.monitor.delete({ where: { id } });
  }

  /** 24h uptime + last-check stats for every monitor the user owns (one query). */
  getStatsForUser(userId: string): Promise<MonitorStatsRow[]> {
    return this.prisma.$queryRaw<
      MonitorStatsRow[]
    >`${this.statsSelect()} WHERE m.user_id = ${userId}::uuid`;
  }

  /** Stats for a single monitor. */
  async getStatsForMonitor(id: string): Promise<MonitorStatsRow | null> {
    const rows = await this.prisma.$queryRaw<
      MonitorStatsRow[]
    >`${this.statsSelect()} WHERE m.id = ${id}::uuid`;
    return rows[0] ?? null;
  }

  private statsSelect(): Prisma.Sql {
    return Prisma.sql`
      SELECT m.id::text AS id,
        COALESCE(
          (SELECT count(*) FILTER (WHERE cr.success)::float / NULLIF(count(*), 0)
           FROM "check_result" cr
           WHERE cr.monitor_id = m.id AND cr.checked_at >= now() - interval '24 hours'),
          1
        ) AS "uptime24h",
        (SELECT cr.response_time_ms FROM "check_result" cr
         WHERE cr.monitor_id = m.id ORDER BY cr.checked_at DESC LIMIT 1) AS "lastResponseMs",
        (SELECT cr.checked_at FROM "check_result" cr
         WHERE cr.monitor_id = m.id ORDER BY cr.checked_at DESC LIMIT 1) AS "lastCheckedAt"
      FROM "monitor" m`;
  }
}
