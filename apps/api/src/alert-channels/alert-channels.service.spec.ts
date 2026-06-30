import { NotFoundException } from '@nestjs/common';
import { AlertChannelType, type AlertChannel } from '@pulse/db';
import { AlertChannelsRepository } from './alert-channels.repository';
import { AlertChannelsService } from './alert-channels.service';

const USER_ID = 'user-1';

function makeChannel(overrides: Partial<AlertChannel> = {}): AlertChannel {
  return {
    id: 'ch-1',
    userId: USER_ID,
    type: AlertChannelType.EMAIL,
    destination: 'oncall@acme.io',
    enabled: true,
    ...overrides,
  };
}

describe('AlertChannelsService', () => {
  let service: AlertChannelsService;
  let repository: jest.Mocked<
    Pick<AlertChannelsRepository, 'findManyByUser' | 'findByIdForUser' | 'create' | 'delete'>
  >;

  beforeEach(() => {
    repository = {
      findManyByUser: jest.fn(),
      findByIdForUser: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };
    service = new AlertChannelsService(repository as unknown as AlertChannelsRepository);
  });

  it('lists channels mapped without userId', async () => {
    repository.findManyByUser.mockResolvedValue([makeChannel()]);

    const result = await service.list(USER_ID);

    expect(repository.findManyByUser).toHaveBeenCalledWith(USER_ID);
    expect(result[0]).not.toHaveProperty('userId');
    expect(result[0]).toEqual({
      id: 'ch-1',
      type: 'EMAIL',
      destination: 'oncall@acme.io',
      enabled: true,
    });
  });

  it('connects the owner on create', async () => {
    repository.create.mockResolvedValue(makeChannel({ type: AlertChannelType.SLACK_WEBHOOK }));

    await service.create(USER_ID, {
      type: 'SLACK_WEBHOOK',
      destination: 'https://hooks.slack.com/services/x',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { connect: { id: USER_ID } },
        type: 'SLACK_WEBHOOK',
        destination: 'https://hooks.slack.com/services/x',
      }),
    );
  });

  describe('remove', () => {
    it('deletes an owned channel', async () => {
      repository.findByIdForUser.mockResolvedValue(makeChannel());
      repository.delete.mockResolvedValue(makeChannel());

      await service.remove(USER_ID, 'ch-1');

      expect(repository.delete).toHaveBeenCalledWith('ch-1');
    });

    it('throws 404 when the channel is not owned or missing', async () => {
      repository.findByIdForUser.mockResolvedValue(null);

      await expect(service.remove(USER_ID, 'ch-x')).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
