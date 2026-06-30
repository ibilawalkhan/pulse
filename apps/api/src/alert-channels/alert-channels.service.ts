import { Injectable, NotFoundException } from '@nestjs/common';
import type { AlertChannelResponse, CreateAlertChannelDto } from '@pulse/shared';
import { toAlertChannelResponse } from './alert-channels.mapper';
import { AlertChannelsRepository } from './alert-channels.repository';

@Injectable()
export class AlertChannelsService {
  constructor(private readonly repository: AlertChannelsRepository) {}

  async list(userId: string): Promise<AlertChannelResponse[]> {
    const channels = await this.repository.findManyByUser(userId);
    return channels.map(toAlertChannelResponse);
  }

  async create(userId: string, dto: CreateAlertChannelDto): Promise<AlertChannelResponse> {
    const created = await this.repository.create({
      user: { connect: { id: userId } },
      type: dto.type,
      destination: dto.destination,
      enabled: dto.enabled,
    });
    return toAlertChannelResponse(created);
  }

  async remove(userId: string, id: string): Promise<void> {
    const channel = await this.repository.findByIdForUser(id, userId);
    if (!channel) {
      throw new NotFoundException('Alert channel not found');
    }
    await this.repository.delete(id);
  }
}
