import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

/** Posts alert messages to a Slack incoming webhook */
@Injectable()
export class SlackSender {
  constructor(
    config: ConfigService,
    @InjectPinoLogger(SlackSender.name) private readonly logger: PinoLogger,
  ) {}

  async send(webhookUrl: string, text: string): Promise<void> {
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
