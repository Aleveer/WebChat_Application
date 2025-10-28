import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import {
  CreateMessageDto,
  GetMessagesDto,
  SendToUserDto,
  SendToGroupDto,
} from './dto/create-message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.auth.guard';
import { RateLimitGuard } from '../../common/guards/ratelimit.guards';

@Controller('messages')
@UseGuards(JwtAuthGuard, RateLimitGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createMessageDto: CreateMessageDto) {
    const message = await this.messagesService.create(createMessageDto);
    return {
      success: true,
      message: 'Message sent successfully',
      data: message,
    };
  }

  @Post('send-to-user')
  @HttpCode(HttpStatus.CREATED)
  async sendToUser(@Body() sendToUserDto: SendToUserDto, @Request() req) {
    const senderId = req.user?.sub || req.user?._id;

    const message = await this.messagesService.sendToUser(
      sendToUserDto,
      senderId,
    );
    return {
      success: true,
      message: 'Message sent successfully',
      data: message,
    };
  }

  @Post('send-to-group')
  @HttpCode(HttpStatus.CREATED)
  async sendToGroup(@Body() sendToGroupDto: SendToGroupDto, @Request() req) {
    const senderId = req.user?.sub || req.user?._id;

    const message = await this.messagesService.sendToGroup(
      sendToGroupDto,
      senderId,
    );
    return {
      success: true,
      message: 'Message sent successfully',
      data: message,
    };
  }

  @Get()
  async getMessages(@Query() getMessagesDto: GetMessagesDto, @Request() req) {
    const userId = req.user?.sub || req.user?._id;

    const messages = await this.messagesService.getMessages(
      getMessagesDto,
      userId,
    );
    return {
      success: true,
      data: messages,
    };
  }

  @Get('conversation/:userId1/:userId2')
  async getConversationHistory(
    @Param('userId1') userId1: string,
    @Param('userId2') userId2: string,
  ) {
    const messages = await this.messagesService.getConversationHistory(
      userId1,
      userId2,
    );
    return {
      success: true,
      data: messages,
    };
  }

  @Get('recent/:userId')
  async getRecentConversations(@Param('userId') userId: string) {
    const conversations =
      await this.messagesService.getRecentConversations(userId);
    return {
      success: true,
      data: conversations,
    };
  }

  @Get('group/:groupId/after-join')
  async getMessagesAfterJoin(
    @Param('groupId') groupId: string,
    @Request() req,
  ) {
    const userId = req.user?.sub || req.user?._id;

    const messages = await this.messagesService.getMessagesAfterJoin(
      groupId,
      userId,
    );
    return {
      success: true,
      data: messages,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(@Param('id') id: string, @Request() req) {
    const userId = req.user?.sub || req.user?._id;

    await this.messagesService.deleteMessage(id, userId);
    return {
      success: true,
      message: 'Message deleted successfully',
    };
  }
}
