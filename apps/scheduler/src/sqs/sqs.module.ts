import { Module } from '@nestjs/common';
import { sqsClientProvider } from './sqs.client.provider';
import { SqsPublisher } from './sqs.publisher';

@Module({
  providers: [sqsClientProvider, SqsPublisher],
  exports: [SqsPublisher],
})
export class SqsModule {}
