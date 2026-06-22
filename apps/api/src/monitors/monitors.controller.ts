import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateMonitorDto, UpdateMonitorDto } from '@pulse/shared';
import type { MonitorResponse } from '@pulse/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { MonitorsService } from './monitors.service';

@ApiTags('monitors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('monitors')
export class MonitorsController {
  constructor(private readonly monitorsService: MonitorsService) {}

  @Get()
  @ApiOperation({ summary: "List the authenticated user's monitors" })
  list(@CurrentUser() user: AuthenticatedUser): Promise<MonitorResponse[]> {
    return this.monitorsService.list(user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a monitor' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMonitorDto,
  ): Promise<MonitorResponse> {
    return this.monitorsService.create(user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single monitor' })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MonitorResponse> {
    return this.monitorsService.get(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update, pause or resume a monitor' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMonitorDto,
  ): Promise<MonitorResponse> {
    return this.monitorsService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a monitor (cascades results and incidents)' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.monitorsService.remove(user.userId, id);
  }
}
