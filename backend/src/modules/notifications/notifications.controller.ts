import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { GetNotificationsDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.auth.guard';
import { RateLimitGuard } from '../../common/guards/ratelimit.guards';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RateLimitGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(
    @Request() req,
    @Query() getNotificationsDto: GetNotificationsDto,
  ) {
    return this.notificationsService.getUserNotifications(
      req.user.sub,
      getNotificationsDto,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.sub);
    return { unread_count: count };
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.sub);
  }

  @Put('mark-all-read')
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.sub);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string, @Request() req) {
    await this.notificationsService.deleteNotification(id, req.user.sub);
    return { message: 'Notification deleted successfully' };
  }
}
