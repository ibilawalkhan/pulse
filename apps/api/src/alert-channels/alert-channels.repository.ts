import { Injectable } from '@nestjs/common';
import { type AlertChannel, Prisma } from '@pulse/db';
import { PrismaService } from '../prisma/prisma.service';

/** All Prisma access for the alert-channels domain, scoped by userId. */
@Injectable()
export class AlertChannelsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByUser(userId: string): Promise<AlertChannel[]> {
    return this.prisma.alertChannel.findMany({
      where: { userId },
      orderBy: [{ type: 'asc' }, { destination: 'asc' }],
    });
  }

  findByIdForUser(id: string, userId: string): Promise<AlertChannel | null> {
    return this.prisma.alertChannel.findFirst({ where: { id, userId } });
  }

  create(data: Prisma.AlertChannelCreateInput): Promise<AlertChannel> {
    return this.prisma.alertChannel.create({ data });
  }

  delete(id: string): Promise<AlertChannel> {
    return this.prisma.alertChannel.delete({ where: { id } });
  }
}
