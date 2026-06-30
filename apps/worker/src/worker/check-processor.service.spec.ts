import { type Monitor, MonitorStatus } from '@pulse/db';
import type { PinoLogger } from 'nestjs-pino';
import type { CheckOutcome } from '../checker/check-outcome';
import { HttpCheckerService } from '../checker/http-checker.service';
import { CheckProcessorService } from './check-processor.service';
import { WorkerRepository } from './worker.repository';

const okOutcome: CheckOutcome = {
  success: true,
  statusCode: 200,
  responseTimeMs: 123,
  error: null,
};

function makeMonitor(overrides: Partial<Monitor> = {}): Monitor {
  return { id: 'mon-1', status: MonitorStatus.UP, ...overrides } as Monitor;
}

describe('CheckProcessorService', () => {
  let service: CheckProcessorService;
  let repository: jest.Mocked<Pick<WorkerRepository, 'findMonitor' | 'recordCheckResult'>>;
  let checker: jest.Mocked<Pick<HttpCheckerService, 'check'>>;

  beforeEach(() => {
    repository = {
      findMonitor: jest.fn(),
      recordCheckResult: jest.fn().mockResolvedValue(undefined),
    };
    checker = { check: jest.fn().mockResolvedValue(okOutcome) };
    const logger = { info: jest.fn(), warn: jest.fn(), debug: jest.fn() } as unknown as PinoLogger;

    service = new CheckProcessorService(
      repository as unknown as WorkerRepository,
      checker as unknown as HttpCheckerService,
      logger,
    );
  });

  it('checks the monitor and records the result', async () => {
    repository.findMonitor.mockResolvedValue(makeMonitor());

    await service.process({ monitorId: 'mon-1', attempt: 1 });

    expect(checker.check).toHaveBeenCalled();
    expect(repository.recordCheckResult).toHaveBeenCalledWith('mon-1', okOutcome);
  });

  it('drops the job when the monitor no longer exists', async () => {
    repository.findMonitor.mockResolvedValue(null);

    await service.process({ monitorId: 'gone', attempt: 1 });

    expect(checker.check).not.toHaveBeenCalled();
    expect(repository.recordCheckResult).not.toHaveBeenCalled();
  });

  it('skips paused monitors', async () => {
    repository.findMonitor.mockResolvedValue(makeMonitor({ status: MonitorStatus.PAUSED }));

    await service.process({ monitorId: 'mon-1', attempt: 1 });

    expect(checker.check).not.toHaveBeenCalled();
    expect(repository.recordCheckResult).not.toHaveBeenCalled();
  });
});
