import type { AlertChannel } from '@pulse/db';
import type { AlertChannelResponse, AlertChannelType } from '@pulse/shared';

/** Map an AlertChannel entity to its public API representation (drops userId). */
export function toAlertChannelResponse(channel: AlertChannel): AlertChannelResponse {
  return {
    id: channel.id,
    type: channel.type as AlertChannelType,
    destination: channel.destination,
    enabled: channel.enabled,
  };
}
