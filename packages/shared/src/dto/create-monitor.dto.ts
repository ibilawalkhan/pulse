import {
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

/** Payload for POST /monitors. */
export class CreateMonitorDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(MONITOR_LIMITS.nameMaxLength)
  name!: string;

  @IsPublicHttpUrl()
  url!: string;

  @IsOptional()
  @IsIn(HTTP_METHODS, { message: `method must be one of: ${HTTP_METHODS.join(', ')}` })
  method?: HttpMethod;

  @IsIn(CHECK_INTERVALS_SECONDS, {
    message: `intervalSeconds must be one of: ${CHECK_INTERVALS_SECONDS.join(', ')}`,
  })
  intervalSeconds!: CheckIntervalSeconds;

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
}
