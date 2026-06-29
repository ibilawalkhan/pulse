import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SqsModule } from '../sqs/sqs.module';
import { SchedulerRepository } from './scheduler.repository';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [PrismaModule, SqsModule],
  providers: [SchedulerService, SchedulerRepository],
})
export class SchedulerModule {}
