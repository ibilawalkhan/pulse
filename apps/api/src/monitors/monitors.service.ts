import { Injectable, NotFoundException } from '@nestjs/common';
import { type Monitor, MonitorStatus, Prisma } from '@pulse/db';
import type { CreateMonitorDto, MonitorResponse, UpdateMonitorDto } from '@pulse/shared';
import { toMonitorResponse } from './monitors.mapper';
import { MonitorsRepository } from './monitors.repository';

@Injectable()
export class MonitorsService {
  constructor(private readonly repository: MonitorsRepository) {}

  async list(userId: string): Promise<MonitorResponse[]> {
    const [monitors, stats] = await Promise.all([
      this.repository.findManyByUser(userId),
      this.repository.getStatsForUser(userId),
    ]);
    const statsById = new Map(stats.map((s) => [s.id, s]));
    return monitors.map((m) => toMonitorResponse(m, statsById.get(m.id)));
  }

  async get(userId: string, id: string): Promise<MonitorResponse> {
    const monitor = await this.getOwnedOrThrow(userId, id);
    const stats = await this.repository.getStatsForMonitor(id);
    return toMonitorResponse(monitor, stats ?? undefined);
  }

  async create(userId: string, dto: CreateMonitorDto): Promise<MonitorResponse> {
    // status (PENDING), consecutiveFailures (0) and nextCheckAt (now) come from
    // the schema defaults, so the scheduler picks the monitor up next cycle.
    const created = await this.repository.create({
      user: { connect: { id: userId } },
      name: dto.name,
      url: dto.url,
      method: dto.method,
      intervalSeconds: dto.intervalSeconds,
      expectedStatus: dto.expectedStatus,
      timeoutMs: dto.timeoutMs,
      failureThreshold: dto.failureThreshold,
    });
    return toMonitorResponse(created);
  }

  async update(userId: string, id: string, dto: UpdateMonitorDto): Promise<MonitorResponse> {
    await this.getOwnedOrThrow(userId, id);

    const data: Prisma.MonitorUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.url !== undefined) data.url = dto.url;
    if (dto.method !== undefined) data.method = dto.method;
    if (dto.intervalSeconds !== undefined) data.intervalSeconds = dto.intervalSeconds;
    if (dto.expectedStatus !== undefined) data.expectedStatus = dto.expectedStatus;
    if (dto.timeoutMs !== undefined) data.timeoutMs = dto.timeoutMs;
    if (dto.failureThreshold !== undefined) data.failureThreshold = dto.failureThreshold;

    if (dto.paused !== undefined) {
      if (dto.paused) {
        data.status = MonitorStatus.PAUSED;
      } else {
        // Resume: hand control back to the scheduler with a clean slate.
        data.status = MonitorStatus.PENDING;
        data.consecutiveFailures = 0;
        data.nextCheckAt = new Date();
      }
    }

    const updated = await this.repository.update(id, data);
    const stats = await this.repository.getStatsForMonitor(id);
    return toMonitorResponse(updated, stats ?? undefined);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOwnedOrThrow(userId, id);
    await this.repository.delete(id);
  }

  /** Load a monitor the user owns, or throw 404 (never reveals others' rows). */
  private async getOwnedOrThrow(userId: string, id: string): Promise<Monitor> {
    const monitor = await this.repository.findByIdForUser(id, userId);
    if (!monitor) {
      throw new NotFoundException('Monitor not found');
    }
    return monitor;
  }
}
