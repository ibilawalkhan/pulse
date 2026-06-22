import { Injectable } from '@nestjs/common';
import { type Monitor, Prisma } from '@pulse/db';
import { PrismaService } from '../prisma/prisma.service';

/** All Prisma access for the monitors domain. Every read is scoped by userId. */
@Injectable()
export class MonitorsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByUser(userId: string): Promise<Monitor[]> {
    return this.prisma.monitor.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByIdForUser(id: string, userId: string): Promise<Monitor | null> {
    return this.prisma.monitor.findFirst({ where: { id, userId } });
  }

  create(data: Prisma.MonitorCreateInput): Promise<Monitor> {
    return this.prisma.monitor.create({ data });
  }

  update(id: string, data: Prisma.MonitorUpdateInput): Promise<Monitor> {
    return this.prisma.monitor.update({ where: { id }, data });
  }

  delete(id: string): Promise<Monitor> {
    return this.prisma.monitor.delete({ where: { id } });
  }
}
