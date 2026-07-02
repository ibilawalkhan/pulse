import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResultsQueryDto, UptimeQueryDto } from '@pulse/shared';
import type { ResultsResponse, UptimeResponse } from '@pulse/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { StatsService } from './stats.service';

@ApiTags('stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('monitors/:monitorId')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('uptime')
  @ApiOperation({ summary: 'Uptime percentage over a window (24h/7d/30d)' })
  uptime(
    @CurrentUser() user: AuthenticatedUser,
    @Param('monitorId', ParseUUIDPipe) monitorId: string,
    @Query() query: UptimeQueryDto,
  ): Promise<UptimeResponse> {
    return this.statsService.uptime(user.userId, monitorId, query);
  }

  @Get('results')
  @ApiOperation({ summary: 'Time-bucketed response-time series for charting' })
  results(
    @CurrentUser() user: AuthenticatedUser,
    @Param('monitorId', ParseUUIDPipe) monitorId: string,
    @Query() query: ResultsQueryDto,
  ): Promise<ResultsResponse> {
    return this.statsService.results(user.userId, monitorId, query);
  }
}
