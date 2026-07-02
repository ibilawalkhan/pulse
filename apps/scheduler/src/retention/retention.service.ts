import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { RetentionRepository } from './retention.repository';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_RETENTION_DAYS = 30;

/**
 * Purges old check_result rows so the high-volume table stays bounded
 * Runs in the scheduler (a singleton) rather than the worker, so
 * horizontally-scaled workers never run duplicate deletes.
 */
@Injectable()
export class RetentionService {
  private readonly retentionDays: number;

  constructor(
    private readonly repository: RetentionRepository,
    config: ConfigService,
    @InjectPinoLogger(RetentionService.name) private readonly logger: PinoLogger,
  ) {
    this.retentionDays = Number(config.get('RETENTION_DAYS', DEFAULT_RETENTION_DAYS));
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM, { name: 'check-result-retention' })
  async purgeOldCheckResults(): Promise<void> {
    const cutoff = new Date(Date.now() - this.retentionDays * DAY_MS);
    try {
      const deleted = await this.repository.deleteCheckResultsBefore(cutoff);
      this.logger.info(
        { deleted, cutoff: cutoff.toISOString(), retentionDays: this.retentionDays },
        'purged old check results',
      );
    } catch (err) {
      // A failed purge must not crash the scheduler; the next run retries.
      this.logger.error({ err }, 'retention purge failed');
    }
  }
}
