import { NotFoundException } from '@nestjs/common';
import { StatsRepository } from './stats.repository';
import { StatsService } from './stats.service';

const USER_ID = 'user-1';
const MON_ID = 'mon-1';

describe('StatsService', () => {
  let service: StatsService;
  let repository: jest.Mocked<
    Pick<StatsRepository, 'findOwnedMonitorId' | 'getUptime' | 'getBuckets'>
  >;

  beforeEach(() => {
    repository = {
      findOwnedMonitorId: jest.fn().mockResolvedValue(MON_ID),
      getUptime: jest.fn(),
      getBuckets: jest.fn(),
    };
    service = new StatsService(repository as unknown as StatsRepository);
  });

  describe('uptime', () => {
    it('computes the ratio and maps the default window', async () => {
      repository.getUptime.mockResolvedValue({ up: 95, total: 100 });

      const result = await service.uptime(USER_ID, MON_ID, {});

      expect(repository.getUptime).toHaveBeenCalledWith(MON_ID, '24 hours');
      expect(result).toEqual({
        window: '24h',
        uptime: 0.95,
        totalChecks: 100,
        successfulChecks: 95,
      });
    });

    it('reports 100% when there is no data', async () => {
      repository.getUptime.mockResolvedValue({ up: 0, total: 0 });
      const result = await service.uptime(USER_ID, MON_ID, { window: '7d' });
      expect(repository.getUptime).toHaveBeenCalledWith(MON_ID, '7 days');
      expect(result.uptime).toBe(1);
    });

    it('throws 404 when the monitor is not owned', async () => {
      repository.findOwnedMonitorId.mockResolvedValue(null);
      await expect(service.uptime(USER_ID, MON_ID, {})).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('results', () => {
    it('maps the bucket token to an interval and returns buckets', async () => {
      repository.getBuckets.mockResolvedValue([
        { bucketStart: new Date('2026-01-01T00:00:00Z'), avgResponseMs: 120, up: 10, total: 10 },
      ]);

      const result = await service.results(USER_ID, MON_ID, {
        from: '2026-01-01T00:00:00Z',
        to: '2026-01-02T00:00:00Z',
        bucket: '1h',
      });

      expect(repository.getBuckets).toHaveBeenCalledWith(
        MON_ID,
        new Date('2026-01-01T00:00:00Z'),
        new Date('2026-01-02T00:00:00Z'),
        '1 hour',
      );
      expect(result.bucket).toBe('1h');
      expect(result.buckets[0]).toEqual({
        bucketStart: '2026-01-01T00:00:00.000Z',
        avgResponseMs: 120,
        totalChecks: 10,
        successfulChecks: 10,
      });
    });
  });
});
