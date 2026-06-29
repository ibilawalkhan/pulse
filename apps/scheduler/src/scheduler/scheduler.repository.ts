import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ClaimedMonitor {
  id: string;
}

@Injectable()
export class SchedulerRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atomically claim every monitor that is due and not paused, advancing its
   * next_check_at by its own interval and returning the claimed ids in one
   * UPDATE ... RETURNING statement.
   *
   * Claiming *before* enqueueing is the core idempotency invariant of the scheduler: even if 
   * a crash between this update and the SQS publish skips one cycle at worst —
   * it never double-enqueues a monitor.
   */
  claimDueMonitors(): Promise<ClaimedMonitor[]> {
    return this.prisma.$queryRaw<ClaimedMonitor[]>`
      UPDATE "monitor"
      SET "next_check_at" = now() + make_interval(secs => "interval_seconds")
      WHERE "next_check_at" <= now()
        AND "status" <> 'PAUSED'
      RETURNING "id"
    `;
  }
}
