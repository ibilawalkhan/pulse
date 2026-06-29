import type { ConfigService } from '@nestjs/config';
import type { SchedulerRegistry } from '@nestjs/schedule';
import type { PinoLogger } from 'nestjs-pino';
import { SchedulerRepository } from './scheduler.repository';
import { SchedulerService } from './scheduler.service';
import { SqsPublisher } from '../sqs/sqs.publisher';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let repository: jest.Mocked<Pick<SchedulerRepository, 'claimDueMonitors'>>;
  let publisher: jest.Mocked<Pick<SqsPublisher, 'enqueueChecks'>>;

  beforeEach(() => {
    repository = { claimDueMonitors: jest.fn() };
    publisher = { enqueueChecks: jest.fn().mockResolvedValue(undefined) };
    const registry = {} as SchedulerRegistry;
    const config = {} as ConfigService;
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as unknown as PinoLogger;

    service = new SchedulerService(
      repository as unknown as SchedulerRepository,
      publisher as unknown as SqsPublisher,
      registry,
      config,
      logger,
    );
  });

  it('claims then enqueues the claimed monitor ids', async () => {
    repository.claimDueMonitors.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);

    await service.runOnce();

    expect(repository.claimDueMonitors).toHaveBeenCalledTimes(1);
    expect(publisher.enqueueChecks).toHaveBeenCalledWith(['a', 'b']);
  });

  it('does not enqueue when nothing is due', async () => {
    repository.claimDueMonitors.mockResolvedValue([]);

    await service.runOnce();

    expect(publisher.enqueueChecks).not.toHaveBeenCalled();
  });

  it('swallows errors so the loop survives', async () => {
    repository.claimDueMonitors.mockRejectedValue(new Error('db down'));

    await expect(service.runOnce()).resolves.toBeUndefined();
    expect(publisher.enqueueChecks).not.toHaveBeenCalled();
  });

  it('skips overlapping cycles', async () => {
    let resolveClaim: (value: { id: string }[]) => void = () => undefined;
    repository.claimDueMonitors.mockReturnValue(
      new Promise((resolve) => {
        resolveClaim = resolve;
      }),
    );

    const first = service.runOnce(); // starts and awaits the claim
    await service.runOnce(); // guard should make this a no-op

    expect(repository.claimDueMonitors).toHaveBeenCalledTimes(1);

    resolveClaim([]);
    await first;
  });
});
