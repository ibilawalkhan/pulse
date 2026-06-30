import { SESClient } from '@aws-sdk/client-ses';
import { type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** DI token for the shared SES client. */
export const SES_CLIENT = Symbol('SES_CLIENT');

/**
 * Builds the SES client. Only used outside development (in dev the email sender
 * logs to the console instead of calling SES). In production credentials come
 * from the task IAM role.
 */
export const sesClientProvider: Provider = {
  provide: SES_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): SESClient => {
    const region = config.getOrThrow<string>('AWS_REGION');
    const endpoint = config.get<string>('AWS_ENDPOINT_URL');
    return new SESClient(endpoint ? { region, endpoint } : { region });
  },
};
