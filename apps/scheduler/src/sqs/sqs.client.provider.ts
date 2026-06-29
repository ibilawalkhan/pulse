import { SQSClient } from '@aws-sdk/client-sqs';
import { type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** DI token for the shared SQS client. */
export const SQS_CLIENT = Symbol('SQS_CLIENT');

/**
 * Builds the SQS client. When AWS_ENDPOINT_URL is set (LocalStack locally) we
 * pass an explicit endpoint + static test credentials; in production it is unset,
 * so the SDK targets real SQS and resolves credentials from the task IAM role.
 */
export const sqsClientProvider: Provider = {
  provide: SQS_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): SQSClient => {
    const region = config.getOrThrow<string>('AWS_REGION');
    const endpoint = config.get<string>('AWS_ENDPOINT_URL');

    if (!endpoint) {
      return new SQSClient({ region });
    }

    return new SQSClient({
      region,
      endpoint,
      credentials: {
        accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID', 'test'),
        secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY', 'test'),
      },
    });
  },
};
