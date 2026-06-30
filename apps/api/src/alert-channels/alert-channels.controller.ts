import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateAlertChannelDto } from '@pulse/shared';
import type { AlertChannelResponse } from '@pulse/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { AlertChannelsService } from './alert-channels.service';

@ApiTags('alert-channels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('alert-channels')
export class AlertChannelsController {
  constructor(private readonly alertChannelsService: AlertChannelsService) {}

  @Get()
  @ApiOperation({ summary: "List the authenticated user's alert channels" })
  list(@CurrentUser() user: AuthenticatedUser): Promise<AlertChannelResponse[]> {
    return this.alertChannelsService.list(user.userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add an email or Slack alert channel' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAlertChannelDto,
  ): Promise<AlertChannelResponse> {
    return this.alertChannelsService.create(user.userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an alert channel' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.alertChannelsService.remove(user.userId, id);
  }
}
