import { Module } from '@nestjs/common';
import { MonitorsController } from './monitors.controller';
import { MonitorsRepository } from './monitors.repository';
import { MonitorsService } from './monitors.service';

@Module({
  controllers: [MonitorsController],
  providers: [MonitorsService, MonitorsRepository],
  exports: [MonitorsService],
})
export class MonitorsModule {}
