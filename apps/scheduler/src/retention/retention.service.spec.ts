import type { ConfigService } from '@nestjs/config';
import type { PinoLogger } from 'nestjs-pino';
import { RetentionRepository } from './retention.repository';
import { RetentionService } from './retention.service';

const DAY_MS = 24 * 60 * 60 * 1000;

function build(retentionDays = 30) {
  const repository = { deleteCheckResultsBefore: jest.fn().mockResolvedValue(7) };
  const config = {
    get: jest.fn().mockReturnValue(String(retentionDays)),
  } as unknown as ConfigService;
  const logger = { info: jest.fn(), error: jest.fn() } as unknown as PinoLogger;
  const service = new RetentionService(
    repository as unknown as RetentionRepository,
    config,
    logger,
  );
  return { service, repository, logger };
}

describe('RetentionService', () => {
  it('deletes rows older than the retention cutoff (~30 days ago)', async () => {
    const { service, repository } = build(30);

    await service.purgeOldCheckResults();

    const cutoff: Date = repository.deleteCheckResultsBefore.mock.calls[0][0];
    const expected = Date.now() - 30 * DAY_MS;
    expect(Math.abs(cutoff.getTime() - expected)).toBeLessThan(5000);
  });

  it('honours a custom RETENTION_DAYS', async () => {
    const { service, repository } = build(7);

    await service.purgeOldCheckResults();

    const cutoff: Date = repository.deleteCheckResultsBefore.mock.calls[0][0];
    const expected = Date.now() - 7 * DAY_MS;
    expect(Math.abs(cutoff.getTime() - expected)).toBeLessThan(5000);
  });

  it('swallows errors so the scheduler survives', async () => {
    const { service, repository, logger } = build();
    repository.deleteCheckResultsBefore.mockRejectedValue(new Error('db down'));

    await expect(service.purgeOldCheckResults()).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });
});
