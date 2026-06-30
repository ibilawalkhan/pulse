import { Injectable } from '@nestjs/common';
import { MonitorStatus } from '@pulse/db';
import type { CheckJobMessage } from '@pulse/shared';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { HttpCheckerService } from '../checker/http-checker.service';
import { WorkerRepository } from './worker.repository';

/**
 * Orchestrates processing of a single check job: load the monitor, run the HTTP
 * check, and persist the result.
 */
@Injectable()
export class CheckProcessorService {
  constructor(
    private readonly repository: WorkerRepository,
    private readonly checker: HttpCheckerService,
    @InjectPinoLogger(CheckProcessorService.name) private readonly logger: PinoLogger,
  ) {}

  async process(job: CheckJobMessage): Promise<void> {
    const monitor = await this.repository.findMonitor(job.monitorId);
    if (!monitor) {
      // Monitor was deleted after the job was enqueued — nothing to do.
      this.logger.warn({ monitorId: job.monitorId }, 'monitor not found; dropping check job');
      return;
    }

    if (monitor.status === MonitorStatus.PAUSED) {
      this.logger.debug({ monitorId: monitor.id }, 'monitor paused; skipping check');
      return;
    }

    const outcome = await this.checker.check(monitor);
    await this.repository.recordCheckResult(monitor.id, outcome);

    this.logger.info(
      {
        monitorId: monitor.id,
        success: outcome.success,
        statusCode: outcome.statusCode,
        responseTimeMs: outcome.responseTimeMs,
        error: outcome.error,
      },
      'check result recorded',
    );
  }
}
