import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { MessagesService } from '../messages/messages.service';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { EventType } from '../analytics/schemas/analytics-event.schema';
import { ReceiverType } from '../messages/schemas/message.schema';

interface AuthenticatedSocket extends Socket {
  user?: {
    sub: string;
    phone_number: string;
    username?: string;
    email?: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(
    private jwtService: JwtService,
    private messagesService: MessagesService,
    private usersService: UsersService,
    private groupsService: GroupsService,
    private notificationsService: NotificationsService,
    private analyticsService: AnalyticsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.user = payload;

      // Track user connection
      this.connectedUsers.set(payload.sub, client.id);

      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub).add(client.id);

      // Join user to their personal room
      await client.join(`user:${payload.sub}`);

      // Load groups lazily, not on connection
      // Groups will be joined when user actually navigates to them
      // This reduces connection time from O(n) to O(1) where n = number of groups

      // Track analytics
      await this.analyticsService.trackEvent({
        event_type: EventType.USER_LOGIN,
        user_id: payload.sub,
        metadata: { socket_connection: true },
      });

      // Notify user is online
      this.server.to(`user:${payload.sub}`).emit('user_online', {
        user_id: payload.sub,
        status: 'online',
      });

      this.logger.log(`User ${payload.sub} connected with socket ${client.id}`);
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      const userId = client.user.sub;

      // Remove socket from user's socket set
      if (this.userSockets.has(userId)) {
        this.userSockets.get(userId).delete(client.id);

        // If no more sockets for this user, mark as offline
        if (this.userSockets.get(userId).size === 0) {
          this.connectedUsers.delete(userId);
          this.userSockets.delete(userId);

          // Notify user is offline
          this.server.emit('user_offline', {
            user_id: userId,
            status: 'offline',
          });

          // Track analytics
          await this.analyticsService.trackEvent({
            event_type: EventType.USER_LOGOUT,
            user_id: userId,
            metadata: { socket_disconnection: true },
          });
        }
      }

      this.logger.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody()
    data: { content: string; group_id?: string; receiver_id?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.user) {
        return { error: 'Unauthorized' };
      }

      const { content, group_id, receiver_id } = data;

      if (!content || (!group_id && !receiver_id)) {
        return { error: 'Invalid message data' };
      }

      // Create message
      const message = await this.messagesService.create({
        sender_id: client.user.sub,
        receiver_type: group_id ? ReceiverType.GROUP : ReceiverType.USER,
        receiver_id: group_id || receiver_id,
        text: content,
      });

      // Track analytics
      const messageDoc = message as unknown as {
        _id?: Types.ObjectId;
        id?: string;
      };
      const messageId = messageDoc._id?.toString() || messageDoc.id;
      await this.analyticsService.trackMessageSent(
        client.user.sub,
        messageId || '',
        group_id,
      );

      // Emit to appropriate room
      if (group_id) {
        this.server.to(`group:${group_id}`).emit('new_message', {
          message,
          sender: client.user,
        });
      } else {
        // Direct message
        this.server.to(`user:${receiver_id}`).emit('new_message', {
          message,
          sender: client.user,
        });
        this.server.to(`user:${client.user.sub}`).emit('message_sent', {
          message,
        });
      }

      return { success: true, message };
    } catch (error) {
      this.logger.error('Send message error:', error);
      return { error: 'Failed to send message' };
    }
  }

  @SubscribeMessage('join_group')
  async handleJoinGroup(
    @MessageBody() data: { group_id: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.user) {
        return { error: 'Unauthorized' };
      }

      const { group_id } = data;

      // Verify user is member of group
      const group = await this.groupsService.findOne(group_id);
      const userId = client.user.sub;

      if (!group) {
        return { error: 'Group not found' };
      }

      // Check if user is a member
      const isMember = group.members?.some(
        (member) => member.user_id?.toString() === userId && !member.removed_at,
      );

      if (!isMember) {
        return { error: 'Not a member of this group' };
      }

      await client.join(`group:${group_id}`);

      // Track analytics
      await this.analyticsService.trackEvent({
        event_type: EventType.GROUP_JOINED,
        user_id: client.user.sub,
        metadata: { group_id },
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Join group error:', error);
      return { error: 'Failed to join group' };
    }
  }

  @SubscribeMessage('leave_group')
  async handleLeaveGroup(
    @MessageBody() data: { group_id: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.user) {
        return { error: 'Unauthorized' };
      }

      const { group_id } = data;

      await client.leave(`group:${group_id}`);

      // Track analytics
      await this.analyticsService.trackEvent({
        event_type: EventType.GROUP_LEFT,
        user_id: client.user.sub,
        metadata: { group_id },
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Leave group error:', error);
      return { error: 'Failed to leave group' };
    }
  }

  @SubscribeMessage('typing_start')
  async handleTypingStart(
    @MessageBody() data: { group_id?: string; receiver_id?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) return;

    const { group_id, receiver_id } = data;

    if (group_id) {
      this.server.to(`group:${group_id}`).emit('user_typing', {
        user_id: client.user.sub,
        username: client.user.username,
        group_id,
      });
    } else if (receiver_id) {
      this.server.to(`user:${receiver_id}`).emit('user_typing', {
        user_id: client.user.sub,
        username: client.user.username,
      });
    }
  }

  @SubscribeMessage('typing_stop')
  async handleTypingStop(
    @MessageBody() data: { group_id?: string; receiver_id?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) return;

    const { group_id, receiver_id } = data;

    if (group_id) {
      this.server.to(`group:${group_id}`).emit('user_stopped_typing', {
        user_id: client.user.sub,
        group_id,
      });
    } else if (receiver_id) {
      this.server.to(`user:${receiver_id}`).emit('user_stopped_typing', {
        user_id: client.user.sub,
      });
    }
  }

  @SubscribeMessage('mark_message_read')
  async handleMarkMessageRead(
    @MessageBody() data: { message_id: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.user) {
        return { error: 'Unauthorized' };
      }

      const { message_id } = data;

      // Update message read status
      // Note: markAsRead method needs to be implemented in MessagesService
      // await this.messagesService.markAsRead(message_id, client.user.sub);
      this.logger.debug('Mark message as read:', message_id);

      return { success: true };
    } catch (error) {
      this.logger.error('Mark message read error:', error);
      return { error: 'Failed to mark message as read' };
    }
  }

  // Helper method to get online users
  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Helper method to check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
