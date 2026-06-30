import { Module } from '@nestjs/common';
import { AlertChannelsController } from './alert-channels.controller';
import { AlertChannelsRepository } from './alert-channels.repository';
import { AlertChannelsService } from './alert-channels.service';

@Module({
  controllers: [AlertChannelsController],
  providers: [AlertChannelsService, AlertChannelsRepository],
})
export class AlertChannelsModule {}
