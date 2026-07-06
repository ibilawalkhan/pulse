import { NotFoundException } from '@nestjs/common';
import { type Monitor, MonitorStatus } from '@pulse/db';
import type { CreateMonitorDto } from '@pulse/shared';
import { MonitorsRepository } from './monitors.repository';
import { MonitorsService } from './monitors.service';

const USER_ID = 'user-1';

function makeMonitor(overrides: Partial<Monitor> = {}): Monitor {
  return {
    id: 'mon-1',
    userId: USER_ID,
    name: 'API',
    url: 'https://api.acme.io/health',
    method: 'GET',
    intervalSeconds: 60,
    expectedStatus: 200,
    timeoutMs: 10000,
    failureThreshold: 2,
    status: MonitorStatus.PENDING,
    consecutiveFailures: 0,
    nextCheckAt: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('MonitorsService', () => {
  let service: MonitorsService;
  let repository: jest.Mocked<
    Pick<
      MonitorsRepository,
      | 'findManyByUser'
      | 'findByIdForUser'
      | 'create'
      | 'update'
      | 'delete'
      | 'getStatsForUser'
      | 'getStatsForMonitor'
    >
  >;

  beforeEach(() => {
    repository = {
      findManyByUser: jest.fn(),
      findByIdForUser: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getStatsForUser: jest.fn().mockResolvedValue([]),
      getStatsForMonitor: jest.fn().mockResolvedValue(null),
    };
    service = new MonitorsService(repository as unknown as MonitorsRepository);
  });

  it('lists the user monitors, mapped without userId', async () => {
    repository.findManyByUser.mockResolvedValue([makeMonitor()]);

    const result = await service.list(USER_ID);

    expect(repository.findManyByUser).toHaveBeenCalledWith(USER_ID);
    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('userId');
    expect(result[0].id).toBe('mon-1');
  });

  describe('create', () => {
    const dto: CreateMonitorDto = {
      name: 'Checkout',
      url: 'https://api.acme.io/checkout',
      intervalSeconds: 300,
    };

    it('connects the owner and returns the mapped monitor', async () => {
      repository.create.mockResolvedValue(makeMonitor({ name: 'Checkout', intervalSeconds: 300 }));

      const result = await service.create(USER_ID, dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: { connect: { id: USER_ID } },
          name: 'Checkout',
          url: 'https://api.acme.io/checkout',
          intervalSeconds: 300,
        }),
      );
      expect(result.status).toBe(MonitorStatus.PENDING);
    });
  });

  describe('get', () => {
    it('returns the monitor when owned', async () => {
      repository.findByIdForUser.mockResolvedValue(makeMonitor());
      const result = await service.get(USER_ID, 'mon-1');
      expect(result.id).toBe('mon-1');
    });

    it('throws 404 when not found or not owned', async () => {
      repository.findByIdForUser.mockResolvedValue(null);
      await expect(service.get(USER_ID, 'mon-x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    beforeEach(() => repository.findByIdForUser.mockResolvedValue(makeMonitor()));

    it('updates config fields', async () => {
      repository.update.mockResolvedValue(makeMonitor({ name: 'Renamed' }));
      await service.update(USER_ID, 'mon-1', { name: 'Renamed', intervalSeconds: 900 });
      expect(repository.update).toHaveBeenCalledWith(
        'mon-1',
        expect.objectContaining({ name: 'Renamed', intervalSeconds: 900 }),
      );
    });

    it('pauses the monitor', async () => {
      repository.update.mockResolvedValue(makeMonitor({ status: MonitorStatus.PAUSED }));
      await service.update(USER_ID, 'mon-1', { paused: true });
      expect(repository.update).toHaveBeenCalledWith(
        'mon-1',
        expect.objectContaining({ status: MonitorStatus.PAUSED }),
      );
    });

    it('resumes the monitor with a clean slate', async () => {
      repository.update.mockResolvedValue(makeMonitor());
      await service.update(USER_ID, 'mon-1', { paused: false });
      const data = repository.update.mock.calls[0][1];
      expect(data.status).toBe(MonitorStatus.PENDING);
      expect(data.consecutiveFailures).toBe(0);
      expect(data.nextCheckAt).toBeInstanceOf(Date);
    });

    it('throws 404 when updating a monitor the user does not own', async () => {
      repository.findByIdForUser.mockResolvedValue(null);
      await expect(service.update(USER_ID, 'mon-x', { name: 'x' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes an owned monitor', async () => {
      repository.findByIdForUser.mockResolvedValue(makeMonitor());
      repository.delete.mockResolvedValue(makeMonitor());
      await service.remove(USER_ID, 'mon-1');
      expect(repository.delete).toHaveBeenCalledWith('mon-1');
    });

    it('throws 404 when deleting a monitor the user does not own', async () => {
      repository.findByIdForUser.mockResolvedValue(null);
      await expect(service.remove(USER_ID, 'mon-x')).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
