import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SchedulerRepository } from './scheduler.repository';
import { SqsPublisher } from '../sqs/sqs.publisher';

const DEFAULT_INTERVAL_MS = 60_000;
const INTERVAL_NAME = 'check-loop';

@Injectable()
export class SchedulerService implements OnApplicationBootstrap {
  /** Guards against a slow cycle overlapping the next tick (single instance). */
  private running = false;

  constructor(
    private readonly repository: SchedulerRepository,
    private readonly publisher: SqsPublisher,
    private readonly registry: SchedulerRegistry,
    private readonly config: ConfigService,
    @InjectPinoLogger(SchedulerService.name) private readonly logger: PinoLogger,
  ) {}

  onApplicationBootstrap(): void {
    const intervalMs = Number(this.config.get('SCHEDULER_INTERVAL_MS', DEFAULT_INTERVAL_MS));
    const interval = setInterval(() => void this.runOnce(), intervalMs);
    this.registry.addInterval(INTERVAL_NAME, interval);
    this.logger.info({ intervalMs }, 'scheduler loop started');

    // Run immediately so newly-due monitors aren't delayed a full interval.
    void this.runOnce();
  }

  /** One claim-and-enqueue cycle. Safe to call repeatedly; never throws. */
  async runOnce(): Promise<void> {
    if (this.running) {
      this.logger.warn('previous cycle still running; skipping this tick');
      return;
    }
    this.running = true;

    try {
      const claimed = await this.repository.claimDueMonitors();
      if (claimed.length === 0) {
        return;
      }

      await this.publisher.enqueueChecks(claimed.map((monitor) => monitor.id));
      this.logger.info({ count: claimed.length }, 'enqueued due checks');
    } catch (err) {
      // Never let a failed cycle kill the loop; the next tick retries.
      this.logger.error({ err }, 'scheduler cycle failed');
    } finally {
      this.running = false;
    }
  }
}
