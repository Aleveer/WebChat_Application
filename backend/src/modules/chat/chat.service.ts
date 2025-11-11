import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
//import { Redis } from 'ioredis';
import { Message } from '../messages/schemas/message.schema';
import { Conversation } from './schemas/conversation.schema';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class ChatService {
    //private redis: Redis;

    constructor(
        @InjectModel(Message.name) private messageModel: Model<Message>,
        @InjectModel(Conversation.name) private conversationModel: Model<Conversation>,
        @InjectModel(User.name) private userModel: Model<User>,
        @Inject(forwardRef(() => require('./chat.gateway').ChatGateway))
        private chatGateway: any, // Use any to avoid circular type dependency
    ) { }
    // ) {
    //     this.redis = new Redis({
    //         host: process.env.REDIS_HOST || 'localhost',
    //         port: parseInt(process.env.REDIS_PORT) || 6379,
    //     });
    // }

    // ==================== GET RECENT CHATS ====================
    async getRecentChats(userId: string, limit: number) {
        // validate userId to avoid throwing low-level errors when an invalid id is passed
        if (!Types.ObjectId.isValid(userId)) {
            throw new BadRequestException('Invalid userId');
        }
        //const cacheKey = `chat_list:${userId}`;

        // 1️⃣ CHECK REDIS CACHE
        // const cached = await this.redis.get(cacheKey);
        // if (cached) {
        //     console.log(`✅ Cache HIT for user ${userId}`);
        //     return JSON.parse(cached);
        // }

        //console.log(`⏳ Cache MISS for user ${userId} - querying MongoDB...`);

        // 2️⃣ QUERY MONGODB
        const userObjectId = new Types.ObjectId(userId);
        const conversations = await this.conversationModel
            .find({
                participants: userObjectId,
                isDeleted: false,
                lastMessage: { $exists: true }, // Chỉ lấy conversation có tin nhắn
            })
            .populate('participants', 'username')
            //.populate('groupId', 'name avatar')
            .sort({ lastMessageAt: -1 })
            .limit(limit)
            .lean();

        // 3️⃣ FORMAT DATA
        const formattedChats = conversations.map((conv: any) => {
            const isGroup = conv.type === 'group';

            // Nếu direct chat, lấy thông tin người chat
            const otherUser = isGroup
                ? null
                : conv.participants.find((p: any) => p._id.toString() !== userId);

            return {
                conversationId: conv._id,
                type: conv.type,

                // Info của người/nhóm chat
                chatInfo: isGroup ? {
                    groupId: conv.groupId._id,
                    name: conv.groupId.name,
                    avatar: conv.groupId.avatar,
                } : {
                    userId: otherUser._id,
                    username: otherUser.username,
                    avatar: otherUser.avatar,
                    status: otherUser.status,
                    lastSeen: otherUser.lastSeen,
                },

                // Last message
                lastMessage: {
                    content: conv.lastMessage.content,
                    senderId: conv.lastMessage.senderId,
                    senderName: conv.lastMessage.senderName,
                    type: conv.lastMessage.type,
                },

                // Unread count
                unreadCount: conv.unreadCount || 0,

                lastMessageAt: conv.lastMessageAt,
            };
        });

        // 4️⃣ CACHE VÀO REDIS (TTL: 5 phút)
        // await this.redis.setex(cacheKey, 300, JSON.stringify(formattedChats));
        // console.log(`💾 Cached chat list for user ${userId}`);

        return formattedChats;
    }

    // ==================== SEND MESSAGE ====================
    async sendMessage(senderId: string, receiverId: string, content: string, type: string = 'text') {
        console.log("CALLING SEND MESSAGE.....")
        const senderObjectId = new Types.ObjectId(senderId);
        const receiverObjectId = new Types.ObjectId(receiverId);

        // 1️⃣ TÌM HOẶC TẠO CONVERSATION
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
            console.log(`🆕 Created new conversation: ${conversation._id}`);
        }

        // 2️⃣ LƯU MESSAGE VÀO DB
        const message = await this.messageModel.create({
            conversationId: conversation._id,  // Add conversationId
            senderId: senderObjectId,
            receiver_type: "user",
            receiverId: receiverObjectId,
            text: content
        });

        console.log('✅ Message created:', message._id);

        // 3️⃣ POPULATE SENDER INFO
        await message.populate('senderId', 'username avatar');

        // 4️⃣ UPDATE CONVERSATION
        //const sender = await this.userModel.findById(senderId).select('username');

        await this.conversationModel.findByIdAndUpdate(conversation._id, {
            lastMessage: {
                content: message.text,
                senderId: message.senderId,
                type,
            },
            lastMessageAt: message.createdAt,
            $inc: { [`unreadCount.${receiverId}`]: 1 }, // Tăng unread cho receiver
        });

        // 5️⃣ INVALIDATE CACHE của cả 2 users
        // await this.invalidateChatListCache(senderId);
        // await this.invalidateChatListCache(receiverId);

        // console.log(`💬 Message sent | Sender: ${senderId} | Receiver: ${receiverId}`);
        // console.log(`🗑️  Invalidated cache for both users`);

        // 6️⃣ EMIT TO CONVERSATION ROOM via WebSocket
        if (this.chatGateway && this.chatGateway.emitMessageToConversation) {
            const messageForClient = {
                id: message._id.toString(),
                from: message.senderId,
                to: receiverId,
                content: message.text,
                timestamp: message.createdAt,
                conversationId: conversation._id,
            };
            this.chatGateway.emitMessageToConversation(conversation._id, messageForClient);
        }

        return {
            message,
            conversationId: conversation._id,
        };
    }

    // ==================== SEND MESSAGE BY CONVERSATION ID ====================
    // find receiverId
    async sendMessageByConversation(
        senderId: string,
        conversationId: string,
        content: string,
        type: string = 'text'
    ) {
        // validate conversationId early
        if (!Types.ObjectId.isValid(conversationId)) {
            throw new BadRequestException('Invalid conversationId');
        }

        const conversation = await this.conversationModel.findById(new Types.ObjectId(conversationId));
        
        if (!conversation) {
            console.error('Conversation not found with ID:', conversationId);
            throw new Error('Conversation not found');
        }

        console.log("Conversation found:", conversation);

        // Find the receiver (the other participant)
        const receiverId = conversation.participants.find(
            (p) => p.toString() !== senderId
        );

        if (!receiverId) {
            throw new Error('Receiver not found in conversation');
        }

        console.log("Receiver ID:", receiverId.toString());

        // Reuse the existing sendMessage logic
        return this.sendMessage(senderId, receiverId.toString(), content, type);
    }

    // ==================== GET MESSAGES (CURSOR-BASED PAGINATION) ====================
    async getMessages(
        conversationId: string, 
        limit: number,
        beforeMessageId?: string  // Cursor: Get messages before this message ID
    ) {
        // validate conversationId
        if (!Types.ObjectId.isValid(conversationId)) {
            throw new BadRequestException('Invalid conversationId');
        }

        const query: any = {
            conversationId: new Types.ObjectId(conversationId),
            //isDeleted: false
        };

        // If cursor is provided, get messages before that message
        if (beforeMessageId) {
            if (!Types.ObjectId.isValid(beforeMessageId)) {
                throw new BadRequestException('Invalid beforeMessageId');
            }

            const cursorMessage = await this.messageModel.findById(new Types.ObjectId(beforeMessageId));
            if (cursorMessage) {
                query.createdAt = { $lt: cursorMessage.createdAt };
            }
        }

        const messages = await this.messageModel
            .find(query)
            .sort({ createdAt: -1 }) // Latest first
            .limit(limit)
            .lean();

        return {
            messages: messages.reverse(), // Reverse to show old → new
            hasMore: messages.length === limit, // If we got full limit, there might be more
            oldestMessageId: messages.length > 0 ? messages[0]._id : null // Cursor for next request
        };
    }
}
