import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import  { SendMessageByConversationDto } from './dto/send-message-by-conversation.dto';

@Controller('chat')
export class ChatController {
    constructor(private chatService: ChatService) { }

    @Get('/conversations')
    async getRecentChats(
        @Query('userId') userId: string,
        @Query('limit') limit: number = 20,
    ) {
        console.log("UserId: " + userId)
        console.log("limit: " + limit)
        return this.chatService.getRecentChats(userId, limit);
    }

    @Get('/messages/:conversationId')
    async getMessages(
        @Param('conversationId') conversationId: string,
        @Query('limit') limit: number = 50,
        @Query('beforeMessageId') beforeMessageId?: string
    ) {
        console.log("ConversationIS from client: ", conversationId)
        return this.chatService.getMessages(conversationId, limit, beforeMessageId);
    }

    // POST /chat/message - Send a message (creates conversation if doesn't exist)
    @Post('message')
    async sendMessage(@Body() dto: SendMessageByConversationDto) {
        return this.chatService.sendMessageByConversation(
            dto.senderId,
            dto.conversationId,
            dto.content,
            dto.type
        );
    }

    // POST /chat/message-new - Send a message to create new conversation with receiverId
    @Post('message-new')
    async sendMessageNew(@Body() dto: { senderId: string; receiverId: string; content: string; type?: string }) {
        return this.chatService.sendMessage(
            dto.senderId,
            dto.receiverId,
            dto.content,
            dto.type || 'text'
        );
    }
}
