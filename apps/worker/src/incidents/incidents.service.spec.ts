import { type Incident, MonitorStatus } from '@pulse/db';
import type { CheckOutcome } from '../checker/check-outcome';
import { IncidentsService, type LockedMonitor } from './incidents.service';

const failure: CheckOutcome = { success: false, statusCode: null, responseTimeMs: 0, error: 'DNS' };
const success: CheckOutcome = { success: true, statusCode: 200, responseTimeMs: 40, error: null };

function lockedRow(overrides: Partial<LockedMonitor> = {}): LockedMonitor {
  return {
    id: 'mon-1',
    name: 'API',
    url: 'https://api.acme.io',
    userId: 'user-1',
    status: MonitorStatus.UP,
    consecutiveFailures: 1,
    failureThreshold: 2,
    ...overrides,
  };
}

/** Builds a fake interactive-transaction client. */
function fakeTx(row: LockedMonitor | null, openIncident: Incident | null = null) {
  return {
    $queryRaw: jest.fn().mockResolvedValue(row ? [row] : []),
    monitor: { update: jest.fn().mockResolvedValue({}) },
    incident: {
      create: jest.fn().mockResolvedValue({ id: 'inc-1' } as Incident),
      findFirst: jest.fn().mockResolvedValue(openIncident),
      update: jest.fn().mockResolvedValue({}),
    },
  };
}

function serviceWith(tx: ReturnType<typeof fakeTx>): IncidentsService {
  const prisma = { $transaction: (cb: (t: unknown) => unknown) => cb(tx) };
  return new IncidentsService(prisma as never);
}

describe('IncidentsService.applyOutcome', () => {
  it('opens an incident and reports "down" when crossing the threshold', async () => {
    const tx = fakeTx(lockedRow({ consecutiveFailures: 1 }));
    const result = await serviceWith(tx).applyOutcome('mon-1', failure);

    expect(tx.monitor.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: MonitorStatus.DOWN, consecutiveFailures: 2 } }),
    );
    expect(tx.incident.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { monitorId: 'mon-1', cause: 'DNS' } }),
    );
    expect(result.kind).toBe('down');
  });

  it('resolves the open incident and reports downtime on recovery', async () => {
    const startedAt = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    const open = { id: 'inc-1', startedAt } as Incident;
    const tx = fakeTx(lockedRow({ status: MonitorStatus.DOWN, consecutiveFailures: 3 }), open);

    const result = await serviceWith(tx).applyOutcome('mon-1', success);

    expect(tx.incident.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'inc-1' } }),
    );
    expect(result.kind).toBe('recovery');
    if (result.kind === 'recovery') {
      expect(result.downtimeSeconds).toBeGreaterThanOrEqual(299);
      expect(result.downtimeSeconds).toBeLessThanOrEqual(301);
    }
  });

  it('does nothing for a paused monitor', async () => {
    const tx = fakeTx(lockedRow({ status: MonitorStatus.PAUSED }));
    const result = await serviceWith(tx).applyOutcome('mon-1', failure);

    expect(tx.monitor.update).not.toHaveBeenCalled();
    expect(result.kind).toBe('none');
  });
});
