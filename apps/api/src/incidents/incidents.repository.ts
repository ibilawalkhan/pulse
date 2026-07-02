import { Injectable } from '@nestjs/common';
import type { Incident } from '@pulse/db';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IncidentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the monitor id if it exists and is owned by the user, else null. */
  async findOwnedMonitorId(monitorId: string, userId: string): Promise<string | null> {
    const monitor = await this.prisma.monitor.findFirst({
      where: { id: monitorId, userId },
      select: { id: true },
    });
    return monitor?.id ?? null;
  }

  findByMonitor(monitorId: string): Promise<Incident[]> {
    return this.prisma.incident.findMany({
      where: { monitorId },
      orderBy: { startedAt: 'desc' },
    });
  }
}
