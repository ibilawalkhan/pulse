import { Injectable } from '@nestjs/common';
import type { CheckResult, Monitor } from '@pulse/db';
import { PrismaService } from '../prisma/prisma.service';
import type { CheckOutcome } from '../checker/check-outcome';

@Injectable()
export class WorkerRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMonitor(id: string): Promise<Monitor | null> {
    return this.prisma.monitor.findUnique({ where: { id } });
  }

  recordCheckResult(monitorId: string, outcome: CheckOutcome): Promise<CheckResult> {
    return this.prisma.checkResult.create({
      data: {
        monitorId,
        success: outcome.success,
        statusCode: outcome.statusCode,
        responseTimeMs: outcome.responseTimeMs,
        error: outcome.error,
      },
    });
  }
}
