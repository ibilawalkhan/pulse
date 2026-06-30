import { AlertChannelType, AlertKind, DeliveryStatus, type Incident } from '@pulse/db';
import type { PinoLogger } from 'nestjs-pino';
import { AlertsRepository } from './alerts.repository';
import { AlertsService, type AlertTarget } from './alerts.service';
import { EmailSender } from './email.sender';
import { SlackSender } from './slack.sender';

const monitor: AlertTarget = { name: 'API', url: 'https://api.acme.io', userId: 'user-1' };
const incident = {
  id: 'inc-1',
  cause: 'TIMEOUT',
  startedAt: new Date('2026-01-01T00:00:00Z'),
} as Incident;

describe('AlertsService', () => {
  let service: AlertsService;
  let repository: jest.Mocked<Pick<AlertsRepository, 'findEnabledChannels' | 'recordAlertEvent'>>;
  let email: jest.Mocked<Pick<EmailSender, 'send'>>;
  let slack: jest.Mocked<Pick<SlackSender, 'send'>>;

  beforeEach(() => {
    repository = {
      findEnabledChannels: jest.fn(),
      recordAlertEvent: jest.fn().mockResolvedValue(undefined),
    };
    email = { send: jest.fn().mockResolvedValue(undefined) };
    slack = { send: jest.fn().mockResolvedValue(undefined) };
    const logger = { error: jest.fn() } as unknown as PinoLogger;

    service = new AlertsService(
      repository as unknown as AlertsRepository,
      email as unknown as EmailSender,
      slack as unknown as SlackSender,
      logger,
    );
  });

  it('dispatches to email and slack channels by type and records SENT', async () => {
    repository.findEnabledChannels.mockResolvedValue([
      { id: 'ch-1', type: AlertChannelType.EMAIL, destination: 'a@b.com' },
      { id: 'ch-2', type: AlertChannelType.SLACK_WEBHOOK, destination: 'https://hooks/x' },
    ] as never);

    await service.sendDownAlert(monitor, incident);

    expect(email.send).toHaveBeenCalledWith(
      'a@b.com',
      expect.stringContaining('DOWN'),
      expect.any(String),
    );
    expect(slack.send).toHaveBeenCalledWith('https://hooks/x', expect.any(String));
    expect(repository.recordAlertEvent).toHaveBeenCalledWith(
      'inc-1',
      'ch-1',
      AlertKind.DOWN,
      DeliveryStatus.SENT,
    );
  });

  it('records FAILED (and does not throw) when a sender fails', async () => {
    repository.findEnabledChannels.mockResolvedValue([
      { id: 'ch-1', type: AlertChannelType.EMAIL, destination: 'a@b.com' },
    ] as never);
    email.send.mockRejectedValue(new Error('SES down'));

    await expect(service.sendDownAlert(monitor, incident)).resolves.toBeUndefined();
    expect(repository.recordAlertEvent).toHaveBeenCalledWith(
      'inc-1',
      'ch-1',
      AlertKind.DOWN,
      DeliveryStatus.FAILED,
    );
  });

  it('includes downtime in the recovery alert', async () => {
    repository.findEnabledChannels.mockResolvedValue([
      { id: 'ch-1', type: AlertChannelType.EMAIL, destination: 'a@b.com' },
    ] as never);

    await service.sendRecoveryAlert(monitor, incident, 300);

    expect(email.send).toHaveBeenCalledWith(
      'a@b.com',
      expect.stringContaining('recovered'),
      expect.stringContaining('5m'),
    );
    expect(repository.recordAlertEvent).toHaveBeenCalledWith(
      'inc-1',
      'ch-1',
      AlertKind.RECOVERED,
      DeliveryStatus.SENT,
    );
  });
});
