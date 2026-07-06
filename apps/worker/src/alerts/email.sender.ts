import { SendEmailCommand, type SESClient } from '@aws-sdk/client-ses';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SES_CLIENT } from './ses.client.provider';

/** Sends alert emails via SES — or logs to the console in development. */
@Injectable()
export class EmailSender {
  private readonly devMode: boolean;
  private readonly from: string;

  constructor(
    @Inject(SES_CLIENT) private readonly ses: SESClient,
    config: ConfigService,
    @InjectPinoLogger(EmailSender.name) private readonly logger: PinoLogger,
  ) {
    this.devMode = config.get<string>('NODE_ENV') === 'development';
    this.from = config.get<string>('SES_FROM_ADDRESS', 'alerts@pulse.local');
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    if (this.devMode) {
      this.logger.info({ to, subject, body }, '[dev] email alert (not sent)');
      return;
    }

    await this.ses.send(
      new SendEmailCommand({
        Source: this.from,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject },
          Body: { Text: { Data: body } },
        },
      }),
    );
  }
}
