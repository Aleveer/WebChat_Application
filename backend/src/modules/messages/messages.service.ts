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

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private groupsService: GroupsService,
  ) {}

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    const message = new this.messageModel({
      ...createMessageDto,
      sender_id: new Types.ObjectId(createMessageDto.sender_id),
      receiver_id: new Types.ObjectId(createMessageDto.receiver_id),
      timestamp: new Date(),
    });

    return await message.save();
  }

  async sendToUser(
    sendToUserDto: SendToUserDto,
    senderId: string,
  ): Promise<Message> {
    const messageData = {
      sender_id: senderId,
      receiver_type: ReceiverType.USER,
      receiver_id: sendToUserDto.receiver_id,
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
    // Verify sender is a member of the group
    const group = await this.groupsService.findOne(sendToGroupDto.group_id);
    if (!group.isMember(new Types.ObjectId(senderId))) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const messageData = {
      sender_id: senderId,
      receiver_type: ReceiverType.GROUP,
      receiver_id: sendToGroupDto.group_id,
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

    let query: any = {
      receiver_type,
      receiver_id: new Types.ObjectId(receiver_id),
    };

    // Add pagination
    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }

    // For group messages, verify user is a member
    if (receiver_type === ReceiverType.GROUP) {
      const group = await this.groupsService.findOne(receiver_id);
      if (!group.isMember(new Types.ObjectId(userId))) {
        throw new ForbiddenException('You are not a member of this group');
      }
    } else {
      // For direct messages, verify user is either sender or receiver
      query.$or = [
        { sender_id: new Types.ObjectId(userId) },
        { receiver_id: new Types.ObjectId(userId) },
      ];
    }

    const messages = await this.messageModel
      .find(query)
      .populate(
        'sender_id',
        'fullname username email phone_number profile_photo',
      )
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec();

    return messages.reverse(); // Return in chronological order
  }

  async getMessagesAfterJoin(
    groupId: string,
    userId: string,
  ): Promise<Message[]> {
    const group = await this.groupsService.findOne(groupId);
    const member = group.members.find(
      (member) =>
        member.user_id.toString() === userId && member.removed_at === null,
    );

    if (!member) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Only get messages sent after the user joined
    const messages = await this.messageModel
      .find({
        receiver_type: ReceiverType.GROUP,
        receiver_id: new Types.ObjectId(groupId),
        timestamp: { $gte: member.joined_at },
      })
      .populate(
        'sender_id',
        'fullname username email phone_number profile_photo',
      )
      .sort({ timestamp: 1 })
      .exec();

    return messages;
  }

  async getConversationHistory(
    userId1: string,
    userId2: string,
  ): Promise<Message[]> {
    const messages = await this.messageModel
      .find({
        receiver_type: ReceiverType.USER,
        $or: [
          {
            sender_id: new Types.ObjectId(userId1),
            receiver_id: new Types.ObjectId(userId2),
          },
          {
            sender_id: new Types.ObjectId(userId2),
            receiver_id: new Types.ObjectId(userId1),
          },
        ],
      })
      .populate(
        'sender_id',
        'fullname username email phone_number profile_photo',
      )
      .sort({ timestamp: 1 })
      .exec();

    return messages;
  }

  async getRecentConversations(userId: string): Promise<any[]> {
    // Get recent direct messages
    const directMessages = await this.messageModel.aggregate([
      {
        $match: {
          receiver_type: ReceiverType.USER,
          $or: [
            { sender_id: new Types.ObjectId(userId) },
            { receiver_id: new Types.ObjectId(userId) },
          ],
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender_id', new Types.ObjectId(userId)] },
              '$receiver_id',
              '$sender_id',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $ne: ['$sender_id', new Types.ObjectId(userId)] },
                1,
                0,
              ],
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
            fullname: '$user.fullname',
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
    const userGroups = await this.groupsService.findByUserId(userId);
    const groupIds = userGroups.map((group) => (group as any)._id);

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

    return {
      directMessages,
      groupMessages,
    } as any;
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId).exec();
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only sender can delete their own message
    if (!message.sender_id.equals(new Types.ObjectId(userId))) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messageModel.findByIdAndDelete(messageId).exec();
  }
}
