import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from '../messages/schemas/message.schema';
import { Conversation } from './schemas/conversation.schema';
import { User } from '../users/schemas/user.schema';
import { Group, GroupDocument } from '../groups/schemas/group.schema';

type PersistMessageResult = {
  message: Message;
  conversationId: Types.ObjectId;
};

type MessageAttachmentOptions = {
  attachmentUrl?: string;
  attachmentType?: string;
  metadata?: Record<string, any>;
};

type PersistMessagePayload = {
  conversation: Conversation;
  senderId: Types.ObjectId;
  receiver:
    | { type: 'user'; id: Types.ObjectId }
    | {
        type: 'group';
        id: Types.ObjectId;
        name: string;
        participants: Types.ObjectId[];
      };
  content: string;
  messageType: string;
  attachment?: MessageAttachmentOptions;
};

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    @Inject(forwardRef(() => require('./chat.gateway').ChatGateway))
    private readonly chatGateway: any,
  ) {}

  async getRecentChats(userId: string, limit: number) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid userId');
    }

    const userObjectId = new Types.ObjectId(userId);
    const conversations = await this.conversationModel
      .find({
        participants: userObjectId,
        isDeleted: false,
      })
      .populate('participants', 'username avatar status lastSeen')
      .populate('groupId', 'name')
      .sort({ lastMessageAt: -1 })
      .limit(limit)
      .lean();

    return conversations.map((conv: any) => {
      const isGroup = conv.type === 'group';
      const lastMessage = conv.lastMessage || {};
      const unreadCountMap =
        conv.unreadCount instanceof Map
          ? Object.fromEntries(conv.unreadCount)
          : conv.unreadCount || {};

      let chatInfo: Record<string, any>;
      if (isGroup) {
        chatInfo = {
          groupId: conv.groupId?._id?.toString() ?? conv.groupId?.toString?.(),
          name: conv.groupId?.name ?? 'Nhóm chưa đặt tên',
        };
      } else {
        const otherUser = (conv.participants || []).find(
          (participant: any) =>
            participant?._id?.toString() &&
            participant._id.toString() !== userId,
        );
        chatInfo = otherUser
          ? {
              userId: otherUser._id?.toString(),
              username: otherUser.username,
              avatar: otherUser.avatar,
              status: otherUser.status,
              lastSeen: otherUser.lastSeen,
            }
          : {
              userId: undefined,
              username: 'Người dùng',
            };
      }

      return {
        conversationId: conv._id?.toString(),
        type: conv.type,
        chatInfo,
        lastMessage: {
          content: lastMessage.content ?? '',
          senderId:
            typeof lastMessage.senderId === 'object'
              ? lastMessage.senderId?.toString()
              : (lastMessage.senderId ?? null),
          senderName: lastMessage.senderName ?? null,
          type: lastMessage.type ?? 'text',
          createdAt: lastMessage.createdAt ?? conv.lastMessageAt ?? null,
          attachmentUrl: lastMessage.attachmentUrl ?? null,
          attachmentType: lastMessage.attachmentType ?? null,
          metadata: lastMessage.metadata ?? null,
          isDeleted: lastMessage.isDeleted ?? false,
          isEdited: lastMessage.isEdited ?? false,
        },
        unreadCount: unreadCountMap,
        lastMessageAt: conv.lastMessageAt,
      };
    });
  }

  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string = '',
    type: string = 'text',
    attachmentOptions: MessageAttachmentOptions = {},
  ): Promise<PersistMessageResult> {
    const senderObjectId = new Types.ObjectId(senderId);
    const receiverObjectId = new Types.ObjectId(receiverId);

    let conversation = await this.conversationModel.findOne({
      type: 'direct',
      participants: { $all: [senderObjectId, receiverObjectId] },
    });

    if (!conversation) {
      conversation = await this.conversationModel.create({
        type: 'direct',
        participants: [senderObjectId, receiverObjectId],
        unreadCount: new Map(),
      });
    }

    const conversationDoc = conversation as unknown as Conversation;

    return this.persistMessage({
      conversation: conversationDoc,
      senderId: senderObjectId,
      receiver: {
        type: 'user',
        id: receiverObjectId,
      },
      content: content ?? '',
      messageType: type,
      attachment: attachmentOptions,
    });
  }

  async sendMessageByConversation(
    senderId: string,
    conversationId: string,
    content: string = '',
    type: string = 'text',
    attachmentOptions: MessageAttachmentOptions = {},
  ): Promise<PersistMessageResult> {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Invalid conversationId');
    }

    const conversation = await this.conversationModel.findById(
      new Types.ObjectId(conversationId),
    );
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const senderObjectId = new Types.ObjectId(senderId);
    if (
      !conversation.participants.some((participant) =>
        participant.equals(senderObjectId),
      )
    ) {
      throw new ForbiddenException('Sender is not part of this conversation');
    }

    const conversationDoc = conversation as unknown as Conversation;

    if (conversation.type === 'group') {
      if (!conversation.groupId) {
        throw new BadRequestException('Group conversation is missing groupId');
      }

      const group = await this.groupModel.findById(conversation.groupId);
      if (!group) {
        throw new NotFoundException('Group not found');
      }

      const groupDoc = group as any as GroupDocument;
      const senderMember = groupDoc.members.find(
        (member) =>
          member.user_id.toString() === senderObjectId.toString() &&
          (member.removed_at === null || member.removed_at === undefined),
      );

      if (!senderMember) {
        throw new ForbiddenException('Sender is not a member of this group');
      }

      const groupReceiver = {
        type: 'group' as const,
        id: groupDoc._id as Types.ObjectId,
        name: groupDoc.name ?? 'Group',
        participants: groupDoc.members
          .filter((member) => member.removed_at === null)
          .map((member) => member.user_id as Types.ObjectId),
      };

      return this.persistMessage({
        conversation: conversationDoc,
        senderId: senderObjectId,
        receiver: groupReceiver,
        content: content ?? '',
        messageType: type,
        attachment: attachmentOptions,
      });
    }

    const receiverId = conversation.participants.find(
      (participant) => !participant.equals(senderObjectId),
    );
    if (!receiverId) {
      throw new BadRequestException('Receiver not found in conversation');
    }

    return this.persistMessage({
      conversation: conversationDoc,
      senderId: senderObjectId,
      receiver: {
        type: 'user',
        id: receiverId as Types.ObjectId,
      },
      content: content ?? '',
      messageType: type,
      attachment: attachmentOptions,
    });
  }

  async getMessages(
    conversationId: string,
    limit: number,
    beforeMessageId?: string,
  ) {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestException('Invalid conversationId');
    }

    const query: Record<string, unknown> = {
      conversationId: new Types.ObjectId(conversationId),
    };

    if (beforeMessageId) {
      if (!Types.ObjectId.isValid(beforeMessageId)) {
        throw new BadRequestException('Invalid beforeMessageId');
      }

      const cursorMessage = await this.messageModel.findById(
        new Types.ObjectId(beforeMessageId),
      );
      if (cursorMessage) {
        query.createdAt = { $lt: cursorMessage.createdAt };
      }
    }

    const messages = await this.messageModel
      .find(query)
      .populate('senderId', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return {
      messages: messages.reverse(),
      hasMore: messages.length === limit,
      oldestMessageId: messages.length > 0 ? messages[0]._id : null,
    };
  }

  private async persistMessage({
    conversation,
    senderId,
    receiver,
    content,
    messageType,
    attachment,
  }: PersistMessagePayload): Promise<PersistMessageResult> {
    const message = await this.messageModel.create({
      conversationId: conversation._id,
      senderId,
      receiver_type: receiver.type,
      receiverId: receiver.id,
      text: content,
      messageType,
      attachmentUrl: attachment?.attachmentUrl,
      attachmentType: attachment?.attachmentType,
      metadata: attachment?.metadata,
    });

    await message.populate('senderId', 'username avatar');
    const senderUsername =
      typeof message.senderId === 'object' && message.senderId
        ? (message.senderId as any).username
        : senderId.toString();

    const incOps: Record<string, number> = {};
    const participantIds =
      receiver.type === 'group'
        ? receiver.participants
        : conversation.participants;

    participantIds.forEach((participantId: Types.ObjectId) => {
      const participantIdStr = participantId.toString();
      if (participantIdStr !== senderId.toString()) {
        incOps[`unreadCount.${participantIdStr}`] = 1;
      }
    });

    const updatePayload: Record<string, unknown> = {
      lastMessage: {
        content,
        senderId,
        senderName: senderUsername,
        type: messageType,
        attachmentUrl: attachment?.attachmentUrl,
        attachmentType: attachment?.attachmentType,
        metadata: attachment?.metadata,
        isDeleted: false,
        isEdited: false,
        createdAt: message.createdAt,
      },
      lastMessageAt: message.createdAt,
    };

    if (Object.keys(incOps).length > 0) {
      updatePayload.$inc = incOps;
    }

    await this.conversationModel.findByIdAndUpdate(conversation._id, {
      ...updatePayload,
    });

    const messageForClient = {
      id: message._id.toString(),
      messageType,
      senderId: senderId.toString(),
      from: senderUsername,
      to:
        receiver.type === 'group'
          ? receiver.name
          : await this.resolveUserName(receiver.id),
      content,
      timestamp: message.createdAt,
      conversationId: conversation._id.toString(),
      attachmentUrl: attachment?.attachmentUrl,
      attachmentType: attachment?.attachmentType,
      metadata: attachment?.metadata,
      conversationType: conversation.type,
      type: messageType,
      isDeleted: false,
      isEdited: false,
    };

    if (this.chatGateway?.emitMessageToConversation) {
      this.chatGateway.emitMessageToConversation(
        conversation._id.toString(),
        messageForClient,
      );
    }

    if (receiver.type === 'user' && this.chatGateway?.emitMessageToUser) {
      this.chatGateway.emitMessageToUser(
        receiver.id.toString(),
        messageForClient,
      );
    }

    return {
      message,
      conversationId: conversation._id as Types.ObjectId,
    };
  }

  private async resolveUserName(userId: Types.ObjectId) {
    const user = await this.userModel
      .findById(userId)
      .select('username')
      .lean();
    return user?.username ?? userId.toString();
  }

  async editMessage(
    messageId: string,
    senderId: string,
    newContent: string,
  ): Promise<Message> {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new BadRequestException('Invalid messageId');
    }

    const message = await this.messageModel.findById(
      new Types.ObjectId(messageId),
    );
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const senderObjectId = new Types.ObjectId(senderId);
    if (!message.senderId.equals(senderObjectId)) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (message.isDeleted) {
      throw new BadRequestException('Cannot edit a deleted message');
    }

    message.text = newContent;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();
    await this.updateConversationLastMessageSnapshot(message);

    // Emit update to conversation
    if (this.chatGateway?.emitMessageUpdate) {
      this.chatGateway.emitMessageUpdate(message.conversationId.toString(), {
        id: message._id.toString(),
        content: newContent,
        isEdited: true,
        editedAt: message.editedAt,
      });
    }

    return message;
  }

  async deleteMessage(messageId: string, senderId: string): Promise<Message> {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new BadRequestException('Invalid messageId');
    }

    const message = await this.messageModel.findById(
      new Types.ObjectId(messageId),
    );
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const senderObjectId = new Types.ObjectId(senderId);
    if (!message.senderId.equals(senderObjectId)) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    message.isDeleted = true;
    message.text = 'This message has been deleted';
    message.attachmentUrl = undefined;
    message.attachmentType = undefined;
    message.metadata = undefined;
    await message.save();
    await this.updateConversationLastMessageSnapshot(message);

    // Emit update to conversation
    if (this.chatGateway?.emitMessageUpdate) {
      this.chatGateway.emitMessageUpdate(message.conversationId.toString(), {
        id: message._id.toString(),
        isDeleted: true,
        attachmentUrl: null,
        attachmentType: null,
      });
    }

    return message;
  }

  private async updateConversationLastMessageSnapshot(message: Message) {
    const conversation = await this.conversationModel.findById(
      message.conversationId,
    );
    if (
      !conversation ||
      !conversation.lastMessage ||
      !conversation.lastMessage.createdAt
    ) {
      return;
    }

    const conversationLastMessageTime = new Date(
      conversation.lastMessage.createdAt,
    ).getTime();
    const messageTime = new Date(message.createdAt).getTime();

    if (conversationLastMessageTime !== messageTime) {
      return;
    }

    conversation.lastMessage.content = message.isDeleted
      ? 'This message has been deleted'
      : message.text;
    conversation.lastMessage.isDeleted = message.isDeleted;
    conversation.lastMessage.isEdited = message.isEdited;
    conversation.lastMessage.attachmentUrl = message.isDeleted
      ? undefined
      : message.attachmentUrl;
    conversation.lastMessage.attachmentType = message.isDeleted
      ? undefined
      : message.attachmentType;
    conversation.lastMessage.metadata = message.isDeleted
      ? undefined
      : message.metadata;
    if (!message.isDeleted && message.messageType) {
      conversation.lastMessage.type = message.messageType;
    }
    conversation.markModified?.('lastMessage');
    await conversation.save();
  }
}
