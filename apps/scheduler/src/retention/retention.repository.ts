import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RetentionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Delete check_result rows older than the cutoff; returns how many were removed. */
  async deleteCheckResultsBefore(cutoff: Date): Promise<number> {
    const { count } = await this.prisma.checkResult.deleteMany({
      where: { checkedAt: { lt: cutoff } },
    });
    return count;
  }
}
