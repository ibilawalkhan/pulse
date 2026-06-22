import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CHECK_INTERVALS_SECONDS, HTTP_METHODS, MONITOR_LIMITS } from '../constants';
import type { CheckIntervalSeconds, HttpMethod } from '../constants';
import { IsPublicHttpUrl } from '../validators';

/**
 * Payload for PATCH /monitors/:id. Every field is optional. `paused` drives
 * pause/resume; the worker-managed statuses (UP/DOWN) are never settable here.
 */
export class UpdateMonitorDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(MONITOR_LIMITS.nameMaxLength)
  name?: string;

  @IsOptional()
  @IsPublicHttpUrl()
  url?: string;

  @IsOptional()
  @IsIn(HTTP_METHODS, { message: `method must be one of: ${HTTP_METHODS.join(', ')}` })
  method?: HttpMethod;

  @IsOptional()
  @IsIn(CHECK_INTERVALS_SECONDS, {
    message: `intervalSeconds must be one of: ${CHECK_INTERVALS_SECONDS.join(', ')}`,
  })
  intervalSeconds?: CheckIntervalSeconds;

  @IsOptional()
  @IsInt()
  @Min(MONITOR_LIMITS.expectedStatusMin)
  @Max(MONITOR_LIMITS.expectedStatusMax)
  expectedStatus?: number;

  @IsOptional()
  @IsInt()
  @Min(MONITOR_LIMITS.timeoutMsMin)
  @Max(MONITOR_LIMITS.timeoutMsMax)
  timeoutMs?: number;

  @IsOptional()
  @IsInt()
  @Min(MONITOR_LIMITS.failureThresholdMin)
  @Max(MONITOR_LIMITS.failureThresholdMax)
  failureThreshold?: number;

  /** true → pause the monitor; false → resume it. */
  @IsOptional()
  @IsBoolean()
  paused?: boolean;
}
