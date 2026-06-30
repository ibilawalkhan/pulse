import { Injectable } from '@nestjs/common';
import type { AlertChannel, AlertEvent, AlertKind, DeliveryStatus } from '@pulse/db';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AlertsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEnabledChannels(userId: string): Promise<AlertChannel[]> {
    return this.prisma.alertChannel.findMany({ where: { userId, enabled: true } });
  }

  recordAlertEvent(
    incidentId: string,
    channelId: string,
    kind: AlertKind,
    deliveryStatus: DeliveryStatus,
  ): Promise<AlertEvent> {
    return this.prisma.alertEvent.create({
      data: { incidentId, channelId, kind, deliveryStatus },
    });
  }
}
