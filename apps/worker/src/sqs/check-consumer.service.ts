import { type SQSClient } from '@aws-sdk/client-sqs';
import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CheckJobMessage } from '@pulse/shared';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Consumer } from 'sqs-consumer';
import { CheckProcessorService } from '../worker/check-processor.service';
import { SQS_CLIENT } from './sqs.client.provider';

/**
 * Long-polls the check-jobs queue and hands each message to the processor.
 * sqs-consumer deletes a message only after the handler resolves; if it throws,
 * the message becomes visible again and, after maxReceiveCount, is moved to the
 * DLQ by the queue's redrive policy.
 */
@Injectable()
export class CheckConsumerService implements OnModuleInit, OnModuleDestroy {
  private consumer?: Consumer;

  constructor(
    @Inject(SQS_CLIENT) private readonly sqs: SQSClient,
    private readonly config: ConfigService,
    private readonly processor: CheckProcessorService,
    @InjectPinoLogger(CheckConsumerService.name) private readonly logger: PinoLogger,
  ) {}

  onModuleInit(): void {
    const queueUrl = this.config.getOrThrow<string>('SQS_QUEUE_URL');

    this.consumer = Consumer.create({
      queueUrl,
      sqs: this.sqs,
      batchSize: 10,
      waitTimeSeconds: 20, // long polling
      handleMessage: async (message) => {
        const job = JSON.parse(message.Body ?? '{}') as CheckJobMessage;
        await this.processor.process(job);
      },
    });

    this.consumer.on('error', (err) => this.logger.error({ err }, 'sqs consumer error'));
    this.consumer.on('processing_error', (err, message) =>
      this.logger.error({ err, messageId: message.MessageId }, 'message processing failed'),
    );

    this.consumer.start();
    this.logger.info({ queueUrl }, 'check consumer started');
  }

  onModuleDestroy(): void {
    this.consumer?.stop();
  }
}
