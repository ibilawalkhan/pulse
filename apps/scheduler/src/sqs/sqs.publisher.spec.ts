import type { ConfigService } from '@nestjs/config';
import type { CheckJobMessage } from '@pulse/shared';
import { SqsPublisher } from './sqs.publisher';

describe('SqsPublisher', () => {
  const send = jest.fn().mockResolvedValue({});
  const client = { send } as unknown as ConstructorParameters<typeof SqsPublisher>[0];
  const config = {
    getOrThrow: () => 'http://localhost:4566/000000000000/check-jobs',
  } as unknown as ConfigService;

  let publisher: SqsPublisher;

  beforeEach(() => {
    send.mockClear();
    publisher = new SqsPublisher(client, config);
  });

  it('does nothing for an empty list', async () => {
    await publisher.enqueueChecks([]);
    expect(send).not.toHaveBeenCalled();
  });

  it('sends a single batch with correct check-job messages', async () => {
    await publisher.enqueueChecks(['a', 'b']);

    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0];
    const entries = command.input.Entries as Array<{ Id: string; MessageBody: string }>;
    expect(entries).toHaveLength(2);
    expect(entries[0].Id).toBe('a');
    expect(JSON.parse(entries[0].MessageBody)).toEqual<CheckJobMessage>({
      monitorId: 'a',
      attempt: 1,
    });
  });

  it('splits more than 10 ids into batches of 10', async () => {
    const ids = Array.from({ length: 23 }, (_, i) => `mon-${i}`);
    await publisher.enqueueChecks(ids);

    expect(send).toHaveBeenCalledTimes(3);
    const sizes = send.mock.calls.map((call) => call[0].input.Entries.length);
    expect(sizes).toEqual([10, 10, 3]);
  });
});
