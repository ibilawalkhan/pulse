import { SendMessageBatchCommand, type SQSClient } from '@aws-sdk/client-sqs';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CheckJobMessage } from '@pulse/shared';
import { SQS_CLIENT } from './sqs.client.provider';

/** Maximum entries SQS accepts in a single SendMessageBatch call. */
const SQS_BATCH_LIMIT = 10;

@Injectable()
export class SqsPublisher {
  private readonly queueUrl: string;

  constructor(
    @Inject(SQS_CLIENT) private readonly client: SQSClient,
    config: ConfigService,
  ) {
    this.queueUrl = config.getOrThrow<string>('SQS_QUEUE_URL');
  }

  /** Enqueue one check-job message per monitor id, in batches of 10. */
  async enqueueChecks(monitorIds: string[]): Promise<void> {
    for (let i = 0; i < monitorIds.length; i += SQS_BATCH_LIMIT) {
      const batch = monitorIds.slice(i, i + SQS_BATCH_LIMIT);
      const entries = batch.map((monitorId) => ({
        Id: monitorId,
        MessageBody: JSON.stringify({ monitorId, attempt: 1 } satisfies CheckJobMessage),
      }));

      await this.client.send(
        new SendMessageBatchCommand({ QueueUrl: this.queueUrl, Entries: entries }),
      );
    }
  }
}
