import { Module } from '@nestjs/common';
import { HttpCheckerService } from '../checker/http-checker.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CheckConsumerService } from '../sqs/check-consumer.service';
import { sqsClientProvider } from '../sqs/sqs.client.provider';
import { CheckProcessorService } from './check-processor.service';
import { WorkerRepository } from './worker.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    sqsClientProvider,
    CheckConsumerService,
    CheckProcessorService,
    HttpCheckerService,
    WorkerRepository,
  ],
})
export class WorkerModule {}
