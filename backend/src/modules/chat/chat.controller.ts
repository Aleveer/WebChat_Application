import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageByConversationDto } from './dto/send-message-by-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

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
            dto.type,
            {
                attachmentUrl: dto.attachmentUrl,
                attachmentType: dto.attachmentType,
                metadata: dto.metadata,
            }
        );
    }

    // POST /chat/message-new - Send a message to create new conversation with receiverId
    @Post('message-new')
    async sendMessageNew(@Body() dto: SendMessageDto) {
        return this.chatService.sendMessage(
            dto.senderId,
            dto.receiverId,
            dto.content,
            dto.type || 'text',
            {
                attachmentUrl: dto.attachmentUrl,
                attachmentType: dto.attachmentType,
                metadata: dto.metadata,
            }
        );
    }

    // PATCH /chat/message/:messageId - Edit a message
    @Post('message/:messageId/edit')
    async editMessage(
        @Param('messageId') messageId: string,
        @Body() dto: { senderId: string; content: string }
    ) {
        return this.chatService.editMessage(
            messageId,
            dto.senderId,
            dto.content
        );
    }

    // DELETE /chat/message/:messageId - Delete a message
    @Post('message/:messageId/delete')
    async deleteMessage(
        @Param('messageId') messageId: string,
        @Body() dto: { senderId: string }
    ) {
        return this.chatService.deleteMessage(
            messageId,
            dto.senderId
        );
    }
}
