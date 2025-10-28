import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Message,
  MessageDocument,
  ReceiverType,
} from './schemas/message.schema';
import {
  CreateMessageDto,
  GetMessagesDto,
  SendToUserDto,
  SendToGroupDto,
} from './dto/create-message.dto';
import { GroupsService } from '../groups/groups.service';
import { sanitizeObjectId } from '../../common/utils/sanitization.utils';
import { APP_CONSTANTS } from '../../common/constants/app.constants';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private groupsService: GroupsService,
  ) {}

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    // Validate and sanitize ObjectIds
    const sanitizedSenderId = sanitizeObjectId(createMessageDto.sender_id);
    const sanitizedReceiverId = sanitizeObjectId(createMessageDto.receiver_id);

    if (!sanitizedSenderId || !sanitizedReceiverId) {
      throw new BadRequestException('Invalid sender or receiver ID format');
    }

    const message = new this.messageModel({
      ...createMessageDto,
      sender_id: new Types.ObjectId(sanitizedSenderId),
      receiver_id: new Types.ObjectId(sanitizedReceiverId),
      timestamp: new Date(),
    });

    return await message.save();
  }

  async sendToUser(
    sendToUserDto: SendToUserDto,
    senderId: string,
  ): Promise<Message> {
    // Validate and sanitize ObjectIds
    const sanitizedSenderId = sanitizeObjectId(senderId);
    const sanitizedReceiverId = sanitizeObjectId(sendToUserDto.receiver_id);

    if (!sanitizedSenderId || !sanitizedReceiverId) {
      throw new BadRequestException('Invalid sender or receiver ID format');
    }

    const messageData = {
      sender_id: sanitizedSenderId,
      receiver_type: ReceiverType.USER,
      receiver_id: sanitizedReceiverId,
      text: sendToUserDto.text,
      timestamp: new Date(),
    };

    const message = new this.messageModel(messageData);
    return await message.save();
  }

  async sendToGroup(
    sendToGroupDto: SendToGroupDto,
    senderId: string,
  ): Promise<Message> {
    // Validate and sanitize ObjectIds
    const sanitizedSenderId = sanitizeObjectId(senderId);
    const sanitizedGroupId = sanitizeObjectId(sendToGroupDto.group_id);

    if (!sanitizedSenderId || !sanitizedGroupId) {
      throw new BadRequestException('Invalid sender or group ID format');
    }

    // Verify sender is a member of the group
    const group = await this.groupsService.findOne(sanitizedGroupId);
    if (!group.isMember(new Types.ObjectId(sanitizedSenderId))) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const messageData = {
      sender_id: sanitizedSenderId,
      receiver_type: ReceiverType.GROUP,
      receiver_id: sanitizedGroupId,
      text: sendToGroupDto.text,
      timestamp: new Date(),
    };

    const message = new this.messageModel(messageData);
    return await message.save();
  }

  async getMessages(
    getMessagesDto: GetMessagesDto,
    userId: string,
  ): Promise<Message[]> {
    const { receiver_id, receiver_type, before, limit = 50 } = getMessagesDto;

    // Validate and sanitize ObjectIds
    const sanitizedReceiverId = sanitizeObjectId(receiver_id);
    const sanitizedUserId = sanitizeObjectId(userId);

    if (!sanitizedReceiverId || !sanitizedUserId) {
      throw new BadRequestException('Invalid receiver or user ID format');
    }

    // Validate and cap limit to prevent abuse
    const maxLimit = APP_CONSTANTS.MESSAGES.DEFAULT_MESSAGE_LIMIT;
    const safeLimit = Math.min(Math.max(1, limit), maxLimit);

    const query: Record<string, unknown> = {
      receiver_type,
      receiver_id: new Types.ObjectId(sanitizedReceiverId),
    };

    // Add pagination
    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }

    // For group messages, verify user is a member
    if (receiver_type === ReceiverType.GROUP) {
      const group = await this.groupsService.findOne(sanitizedReceiverId);
      if (!group.isMember(new Types.ObjectId(sanitizedUserId))) {
        throw new ForbiddenException('You are not a member of this group');
      }
    } else {
      // For direct messages, verify user is either sender or receiver
      query.$or = [
        { sender_id: new Types.ObjectId(sanitizedUserId) },
        { receiver_id: new Types.ObjectId(sanitizedUserId) },
      ];
    }

    // Use lean() to get plain objects instead of Mongoose documents
    const messages = await this.messageModel
      .find(query)
      .populate(
        'sender_id',
        'full_name username email phone_number profile_photo',
      )
      .sort({ timestamp: -1 })
      .limit(safeLimit)
      .lean()
      .exec();

    return messages.reverse(); // Return in chronological order
  }

  async getMessagesAfterJoin(
    groupId: string,
    userId: string,
  ): Promise<Message[]> {
    // Validate and sanitize ObjectIds
    const sanitizedGroupId = sanitizeObjectId(groupId);
    const sanitizedUserId = sanitizeObjectId(userId);

    if (!sanitizedGroupId || !sanitizedUserId) {
      throw new BadRequestException('Invalid group or user ID format');
    }

    const group = await this.groupsService.findOne(sanitizedGroupId);
    const member = group.members.find(
      (member) =>
        member.user_id.toString() === sanitizedUserId &&
        member.removed_at === null,
    );

    if (!member) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Only get messages sent after the user joined
    const messages = await this.messageModel
      .find({
        receiver_type: ReceiverType.GROUP,
        receiver_id: new Types.ObjectId(sanitizedGroupId),
        timestamp: { $gte: member.joined_at },
      })
      .populate(
        'sender_id',
        'full_name username email phone_number profile_photo',
      )
      .sort({ timestamp: 1 })
      .lean()
      .exec();

    return messages;
  }

  async getConversationHistory(
    userId1: string,
    userId2: string,
  ): Promise<Message[]> {
    // Validate and sanitize ObjectIds
    const sanitizedUserId1 = sanitizeObjectId(userId1);
    const sanitizedUserId2 = sanitizeObjectId(userId2);

    if (!sanitizedUserId1 || !sanitizedUserId2) {
      throw new BadRequestException('Invalid user ID format');
    }

    const messages = await this.messageModel
      .find({
        receiver_type: ReceiverType.USER,
        $or: [
          {
            sender_id: new Types.ObjectId(sanitizedUserId1),
            receiver_id: new Types.ObjectId(sanitizedUserId2),
          },
          {
            sender_id: new Types.ObjectId(sanitizedUserId2),
            receiver_id: new Types.ObjectId(sanitizedUserId1),
          },
        ],
      })
      .populate(
        'sender_id',
        'full_name username email phone_number profile_photo',
      )
      .sort({ timestamp: 1 })
      .lean()
      .exec();

    return messages;
  }

  async getRecentConversations(userId: string): Promise<
    Array<{
      conversation_id: string;
      receiver_id: string;
      receiver_type: string;
      last_message: unknown;
      unread_count: number;
    }>
  > {
    // Validate and sanitize ObjectId
    const sanitizedUserId = sanitizeObjectId(userId);
    if (!sanitizedUserId) {
      throw new BadRequestException('Invalid user ID format');
    }

    const userObjectId = new Types.ObjectId(sanitizedUserId);

    // Get recent direct messages
    const directMessages = await this.messageModel.aggregate([
      {
        $match: {
          receiver_type: ReceiverType.USER,
          $or: [{ sender_id: userObjectId }, { receiver_id: userObjectId }],
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender_id', userObjectId] },
              '$receiver_id',
              '$sender_id',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $ne: ['$sender_id', userObjectId] }, 1, 0],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          _id: 1,
          user: {
            _id: '$user._id',
            full_name: '$user.full_name',
            username: '$user.username',
            email: '$user.email',
            phone_number: '$user.phone_number',
            profile_photo: '$user.profile_photo',
          },
          lastMessage: 1,
          unreadCount: 1,
        },
      },
    ]);

    // Get recent group messages
    const userGroups = await this.groupsService.findByUserId(sanitizedUserId);
    const groupIds = userGroups
      .map((group) => {
        const groupDoc = group as unknown as { _id?: Types.ObjectId };
        return groupDoc._id?.toString() || '';
      })
      .filter(Boolean);

    const groupMessages = await this.messageModel.aggregate([
      {
        $match: {
          receiver_type: ReceiverType.GROUP,
          receiver_id: { $in: groupIds },
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: '$receiver_id',
          lastMessage: { $first: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'groups',
          localField: '_id',
          foreignField: '_id',
          as: 'group',
        },
      },
      {
        $unwind: '$group',
      },
      {
        $project: {
          _id: 1,
          group: {
            _id: '$group._id',
            name: '$group.name',
          },
          lastMessage: 1,
        },
      },
    ]);

    return [...directMessages, ...groupMessages];
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    // Validate and sanitize ObjectIds
    const sanitizedMessageId = sanitizeObjectId(messageId);
    const sanitizedUserId = sanitizeObjectId(userId);

    if (!sanitizedMessageId || !sanitizedUserId) {
      throw new BadRequestException('Invalid message or user ID format');
    }

    const message = await this.messageModel.findById(sanitizedMessageId).exec();
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only sender can delete their own message
    if (!message.sender_id.equals(new Types.ObjectId(sanitizedUserId))) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messageModel.findByIdAndDelete(sanitizedMessageId).exec();
  }
}
