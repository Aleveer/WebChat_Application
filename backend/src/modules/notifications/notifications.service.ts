import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';
import {
  CreateNotificationDto,
  GetNotificationsDto,
} from './dto/notification.dto';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private usersService: UsersService,
    private groupsService: GroupsService,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = new this.notificationModel(createNotificationDto);
    return notification.save();
  }

  async getUserNotifications(
    userId: string,
    getNotificationsDto: GetNotificationsDto,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { page = 1, limit = 20, type, is_read } = getNotificationsDto;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      recipient: new Types.ObjectId(userId),
    };

    if (type) {
      filter.type = type;
    }

    if (is_read !== undefined) {
      filter.is_read = is_read;
    }

    const notifications = await this.notificationModel
      .find(filter)
      .populate('sender', 'full_name username photo')
      .populate('group', 'name description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.notificationModel.countDocuments(filter);

    return { notifications, total };
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<Notification> {
    const notification = await this.notificationModel.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { is_read: true },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { recipient: userId, is_read: false },
      { is_read: true },
    );
  }

  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    const result = await this.notificationModel.deleteOne({
      _id: notificationId,
      recipient: userId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      recipient: userId,
      is_read: false,
    });
  }

  // Helper methods for creating specific notification types
  async createMessageNotification(
    senderId: string,
    recipientId: string,
    messageId: string,
    groupId?: string,
  ): Promise<Notification> {
    const notificationData: CreateNotificationDto = {
      type: NotificationType.MESSAGE,
      title: 'New Message',
      content: 'You have received a new message',
      sender: senderId,
      recipient: recipientId,
      related_data: {
        message_id: messageId,
        group_id: groupId,
      },
    };

    return this.create(notificationData);
  }

  async createGroupInviteNotification(
    senderId: string,
    recipientId: string,
    groupId: string,
  ): Promise<Notification> {
    const notificationData: CreateNotificationDto = {
      type: NotificationType.GROUP_INVITE,
      title: 'Group Invitation',
      content: 'You have been invited to join a group',
      sender: senderId,
      recipient: recipientId,
      related_data: {
        group_id: groupId,
      },
    };

    return this.create(notificationData);
  }

  async createGroupUpdateNotification(
    groupId: string,
    title: string,
    content: string,
    relatedData?: Record<string, unknown>,
  ): Promise<void> {
    const group = await this.groupsService.findOne(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const groupDoc = group as unknown as {
      created_by?: { toString: () => string };
    };
    const senderId =
      groupDoc.created_by?.toString() ||
      group.members.find((m) => m.is_admin)?.user_id;

    const notifications = group.members.map((member) => ({
      type: NotificationType.GROUP_UPDATE,
      title,
      content,
      sender: senderId || member.user_id,
      recipient: member.user_id,
      group: groupId,
      related_data: relatedData,
    }));

    await this.notificationModel.insertMany(notifications);
  }
}
