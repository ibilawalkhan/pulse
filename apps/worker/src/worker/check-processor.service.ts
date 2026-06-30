import { Injectable } from '@nestjs/common';
import { MonitorStatus } from '@pulse/db';
import type { CheckJobMessage } from '@pulse/shared';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AlertsService } from '../alerts/alerts.service';
import { HttpCheckerService } from '../checker/http-checker.service';
import { IncidentsService } from '../incidents/incidents.service';
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
    private readonly incidents: IncidentsService,
    private readonly alerts: AlertsService,
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

    // Apply the incident state machine (transactional), then alert *after* the
    // transaction commits so a slow/failed send never holds the row lock.
    const transition = await this.incidents.applyOutcome(monitor.id, outcome);
    if (transition.kind === 'down') {
      this.logger.warn(
        { monitorId: monitor.id, incidentId: transition.incident.id },
        'monitor DOWN',
      );
      await this.alerts.sendDownAlert(transition.monitor, transition.incident);
    } else if (transition.kind === 'recovery') {
      this.logger.info(
        { monitorId: monitor.id, downtimeSeconds: transition.downtimeSeconds },
        'monitor RECOVERED',
      );
      await this.alerts.sendRecoveryAlert(
        transition.monitor,
        transition.incident,
        transition.downtimeSeconds,
      );
    }
  }
}
