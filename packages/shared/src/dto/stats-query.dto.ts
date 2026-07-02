import { IsIn, IsISO8601, IsOptional } from 'class-validator';
import { RESULT_BUCKETS, UPTIME_WINDOWS } from '../constants';
import type { ResultBucketSize, UptimeWindow } from '../constants';

/** Query for GET /monitors/:id/uptime. */
export class UptimeQueryDto {
  @IsOptional()
  @IsIn(UPTIME_WINDOWS, { message: `window must be one of: ${UPTIME_WINDOWS.join(', ')}` })
  window?: UptimeWindow;
}

/** Query for GET /monitors/:id/results. */
export class ResultsQueryDto {
  @IsOptional()
  @IsISO8601({}, { message: 'from must be an ISO 8601 date-time' })
  from?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'to must be an ISO 8601 date-time' })
  to?: string;

  @IsOptional()
  @IsIn(RESULT_BUCKETS, { message: `bucket must be one of: ${RESULT_BUCKETS.join(', ')}` })
  bucket?: ResultBucketSize;
}
