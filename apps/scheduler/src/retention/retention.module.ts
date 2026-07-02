import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RetentionRepository } from './retention.repository';
import { RetentionService } from './retention.service';

@Module({
  imports: [PrismaModule],
  providers: [RetentionService, RetentionRepository],
})
export class RetentionModule {}
