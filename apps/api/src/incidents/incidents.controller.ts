import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { IncidentResponse } from '@pulse/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { IncidentsService } from './incidents.service';

@ApiTags('incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('monitors/:monitorId/incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  @ApiOperation({ summary: "List a monitor's incident history" })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('monitorId', ParseUUIDPipe) monitorId: string,
  ): Promise<IncidentResponse[]> {
    return this.incidentsService.listForMonitor(user.userId, monitorId);
  }
}
