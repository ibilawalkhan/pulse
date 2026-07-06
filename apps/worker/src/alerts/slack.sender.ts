import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/** Posts alert messages to a Slack incoming webhook — or logs in development. */
@Injectable()
export class SlackSender {
  private readonly devMode: boolean;

  constructor(
    config: ConfigService,
    @InjectPinoLogger(SlackSender.name) private readonly logger: PinoLogger,
  ) {
    this.devMode = config.get<string>('NODE_ENV') === 'development';
  }

  async send(webhookUrl: string, text: string): Promise<void> {
    if (this.devMode) {
      this.logger.info({ webhookUrl, text }, '[dev] slack alert (not sent)');
      return;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook responded ${response.status}`);
    }
  }
}
