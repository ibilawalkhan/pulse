import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { ALERT_CHANNEL_TYPES } from '../constants';
import type { AlertChannelType } from '../constants';
import { IsValidAlertDestination } from '../validators';

/** Payload for POST /alert-channels. */
export class CreateAlertChannelDto {
  @IsIn(ALERT_CHANNEL_TYPES, {
    message: `type must be one of: ${ALERT_CHANNEL_TYPES.join(', ')}`,
  })
  type!: AlertChannelType;

  // Validated against `type`: an email for EMAIL, an https hooks.slack.com URL
  // for SLACK_WEBHOOK.
  @IsValidAlertDestination()
  destination!: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
