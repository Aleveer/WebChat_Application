import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsEventDto, GetAnalyticsDto } from './dto/analytics.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ThrottleGuard } from '../../common/guards/throttle.guards';
import { Roles } from '../../common/decorators/custom.decorators';
import { EventType } from './schemas/analytics-event.schema';

@Controller('analytics')
@UseGuards(JwtAuthGuard, ThrottleGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Post('track')
  async trackEvent(@Body() createEventDto: CreateAnalyticsEventDto) {
    return this.analyticsService.trackEvent(createEventDto);
  }

  @Get('user')
  async getUserAnalytics(
    @Request() req,
    @Query() getAnalyticsDto: GetAnalyticsDto,
  ) {
    return this.analyticsService.getUserAnalytics(
      req.user.sub,
      getAnalyticsDto,
    );
  }

  @Get('system')
  @Roles('admin')
  async getSystemAnalytics(@Query() getAnalyticsDto: GetAnalyticsDto) {
    return this.analyticsService.getSystemAnalytics(getAnalyticsDto);
  }

  @Get('metrics/:eventType')
  @Roles('admin')
  async getEventMetrics(
    @Query('eventType') eventType: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    const timeRange =
      startDate && endDate
        ? {
            start: new Date(startDate),
            end: new Date(endDate),
          }
        : undefined;

    return this.analyticsService.getEventMetrics(
      eventType as EventType,
      timeRange,
    );
  }
}
