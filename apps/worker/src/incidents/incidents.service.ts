import { Injectable } from '@nestjs/common';
import { type Incident, MonitorStatus } from '@pulse/db';
import type { CheckOutcome } from '../checker/check-outcome';
import { PrismaService } from '../prisma/prisma.service';
import { decideIncidentTransition } from './incident-decision';

/** Monitor fields the transition needs, loaded under a row lock. */
export interface LockedMonitor {
  id: string;
  name: string;
  url: string;
  userId: string;
  status: MonitorStatus;
  consecutiveFailures: number;
  failureThreshold: number;
}

/** What the worker should do after the transaction commits. */
export type TransitionResult =
  | { kind: 'none' }
  | { kind: 'down'; monitor: LockedMonitor; incident: Incident }
  | {
      kind: 'recovery';
      monitor: LockedMonitor;
      incident: Incident | null;
      downtimeSeconds: number;
    };

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Apply a check outcome to the monitor's incident state in a single
   * transaction. The monitor row is locked FOR UPDATE so concurrent workers
   * (or duplicate SQS deliveries) serialise here — only one can perform the
   * UP→DOWN / DOWN→UP transition; the rest see the already-updated status and
   * fall through to a no-op. Alerts are sent *after* commit by the caller.
   */
  async applyOutcome(monitorId: string, outcome: CheckOutcome): Promise<TransitionResult> {
    return this.prisma.$transaction(async (tx) => {
      const monitor = await this.lockMonitor(tx, monitorId);
      if (!monitor || monitor.status === MonitorStatus.PAUSED) {
        return { kind: 'none' };
      }

      const decision = decideIncidentTransition(monitor, outcome);

      switch (decision.kind) {
        case 'noop':
          return { kind: 'none' };

        case 'updateFailures':
          await tx.monitor.update({
            where: { id: monitorId },
            data: { consecutiveFailures: decision.consecutiveFailures },
          });
          return { kind: 'none' };

        case 'cameUp':
          await tx.monitor.update({
            where: { id: monitorId },
            data: { status: MonitorStatus.UP, consecutiveFailures: 0 },
          });
          return { kind: 'none' };

        case 'wentDown': {
          await tx.monitor.update({
            where: { id: monitorId },
            data: { status: MonitorStatus.DOWN, consecutiveFailures: decision.consecutiveFailures },
          });
          const incident = await tx.incident.create({
            data: { monitorId, cause: outcome.error ?? 'Check failed' },
          });
          return { kind: 'down', monitor, incident };
        }

        case 'recovered': {
          await tx.monitor.update({
            where: { id: monitorId },
            data: { status: MonitorStatus.UP, consecutiveFailures: 0 },
          });
          const open = await tx.incident.findFirst({
            where: { monitorId, resolvedAt: null },
            orderBy: { startedAt: 'desc' },
          });
          const resolvedAt = new Date();
          if (open) {
            await tx.incident.update({ where: { id: open.id }, data: { resolvedAt } });
          }
          const downtimeSeconds = open
            ? Math.round((resolvedAt.getTime() - open.startedAt.getTime()) / 1000)
            : 0;
          return { kind: 'recovery', monitor, incident: open, downtimeSeconds };
        }
      }
    });
  }

  /** SELECT ... FOR UPDATE to serialise transitions on this monitor. */
  private async lockMonitor(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    monitorId: string,
  ): Promise<LockedMonitor | null> {
    const rows = await tx.$queryRaw<LockedMonitor[]>`
      SELECT id, name, url, user_id AS "userId", status,
             consecutive_failures AS "consecutiveFailures",
             failure_threshold AS "failureThreshold"
      FROM "monitor"
      WHERE id = ${monitorId}::uuid
      FOR UPDATE
    `;
    return rows[0] ?? null;
  }
}
