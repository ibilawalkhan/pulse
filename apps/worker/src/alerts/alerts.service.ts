import { Injectable } from '@nestjs/common';
import { AlertChannelType, AlertKind, DeliveryStatus, type Incident } from '@pulse/db';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AlertsRepository } from './alerts.repository';
import { EmailSender } from './email.sender';
import { SlackSender } from './slack.sender';

/** The monitor fields an alert message needs. */
export interface AlertTarget {
  name: string;
  url: string;
  userId: string;
}

@Injectable()
export class AlertsService {
  constructor(
    private readonly repository: AlertsRepository,
    private readonly email: EmailSender,
    private readonly slack: SlackSender,
    @InjectPinoLogger(AlertsService.name) private readonly logger: PinoLogger,
  ) {}

  async sendDownAlert(monitor: AlertTarget, incident: Incident): Promise<void> {
    const subject = `🔴 ${monitor.name} is DOWN`;
    const text =
      `${monitor.name} (${monitor.url}) is down.\n` +
      `Cause: ${incident.cause ?? 'unknown'}.\n` +
      `Detected at ${incident.startedAt.toISOString()}.`;
    await this.dispatch(monitor.userId, incident.id, AlertKind.DOWN, subject, text);
  }

  async sendRecoveryAlert(
    monitor: AlertTarget,
    incident: Incident | null,
    downtimeSeconds: number,
  ): Promise<void> {
    const subject = `✅ ${monitor.name} has recovered`;
    const text = `${monitor.name} (${monitor.url}) is back up after ${formatDuration(downtimeSeconds)} of downtime.`;
    await this.dispatch(monitor.userId, incident?.id ?? null, AlertKind.RECOVERED, subject, text);
  }

  /**
   * Deliver an alert to every enabled channel for the user, recording each
   * attempt as an alert_event. A delivery failure is logged and stored as
   * FAILED — never thrown — so one bad channel can't block the others or the
   * worker.
   */
  private async dispatch(
    userId: string,
    incidentId: string | null,
    kind: AlertKind,
    subject: string,
    text: string,
  ): Promise<void> {
    const channels = await this.repository.findEnabledChannels(userId);

    for (const channel of channels) {
      let deliveryStatus: DeliveryStatus = DeliveryStatus.SENT;
      try {
        if (channel.type === AlertChannelType.EMAIL) {
          await this.email.send(channel.destination, subject, text);
        } else {
          await this.slack.send(channel.destination, text);
        }
      } catch (err) {
        deliveryStatus = DeliveryStatus.FAILED;
        this.logger.error({ err, channelId: channel.id, kind }, 'alert delivery failed');
      }

      if (incidentId) {
        await this.repository.recordAlertEvent(incidentId, channel.id, kind, deliveryStatus);
      }
    }
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes ? `${hours}h ${remMinutes}m` : `${hours}h`;
}
