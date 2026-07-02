import { NotFoundException } from '@nestjs/common';
import type { Incident } from '@pulse/db';
import { IncidentsRepository } from './incidents.repository';
import { IncidentsService } from './incidents.service';

const USER_ID = 'user-1';
const MON_ID = 'mon-1';

describe('IncidentsService', () => {
  let service: IncidentsService;
  let repository: jest.Mocked<Pick<IncidentsRepository, 'findOwnedMonitorId' | 'findByMonitor'>>;

  beforeEach(() => {
    repository = {
      findOwnedMonitorId: jest.fn(),
      findByMonitor: jest.fn(),
    };
    service = new IncidentsService(repository as unknown as IncidentsRepository);
  });

  it('throws 404 when the monitor is not owned or missing', async () => {
    repository.findOwnedMonitorId.mockResolvedValue(null);

    await expect(service.listForMonitor(USER_ID, MON_ID)).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findByMonitor).not.toHaveBeenCalled();
  });

  it('maps resolved and ongoing incidents with computed duration', async () => {
    repository.findOwnedMonitorId.mockResolvedValue(MON_ID);
    const resolved = {
      id: 'inc-1',
      startedAt: new Date('2026-01-01T00:00:00Z'),
      resolvedAt: new Date('2026-01-01T00:05:00Z'),
      cause: 'TIMEOUT',
    } as Incident;
    const ongoing = {
      id: 'inc-2',
      startedAt: new Date(Date.now() - 60_000),
      resolvedAt: null,
      cause: 'DNS',
    } as Incident;
    repository.findByMonitor.mockResolvedValue([ongoing, resolved]);

    const result = await service.listForMonitor(USER_ID, MON_ID);

    expect(result[1]).toEqual({
      id: 'inc-1',
      startedAt: '2026-01-01T00:00:00.000Z',
      resolvedAt: '2026-01-01T00:05:00.000Z',
      cause: 'TIMEOUT',
      durationSeconds: 300,
    });
    // ongoing incident measures up to "now" (~60s)
    expect(result[0].resolvedAt).toBeNull();
    expect(result[0].durationSeconds).toBeGreaterThanOrEqual(59);
    expect(result[0].durationSeconds).toBeLessThanOrEqual(61);
  });
});
