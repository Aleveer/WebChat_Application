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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ThrottleGuard } from '../../common/guards/throttle.guards';
import { ResponseUtils } from '../../common/utils/response.utils';

@Controller('messages')
@UseGuards(JwtAuthGuard, ThrottleGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createMessageDto: CreateMessageDto) {
    const message = await this.messagesService.create(createMessageDto);
    return ResponseUtils.success(message, 'Message sent successfully');
  }

  @Post('send-to-user')
  @HttpCode(HttpStatus.CREATED)
  async sendToUser(@Body() sendToUserDto: SendToUserDto, @Request() req) {
    const senderId = req.user?.sub || req.user?._id;

    const message = await this.messagesService.sendToUser(
      sendToUserDto,
      senderId,
    );
    return ResponseUtils.success(message, 'Message sent successfully');
  }

  @Post('send-to-group')
  @HttpCode(HttpStatus.CREATED)
  async sendToGroup(@Body() sendToGroupDto: SendToGroupDto, @Request() req) {
    const senderId = req.user?.sub || req.user?._id;

    const message = await this.messagesService.sendToGroup(
      sendToGroupDto,
      senderId,
    );
    return ResponseUtils.success(message, 'Message sent successfully');
  }

  @Get()
  async getMessages(@Query() getMessagesDto: GetMessagesDto, @Request() req) {
    const userId = req.user?.sub || req.user?._id;

    const messages = await this.messagesService.getMessages(
      getMessagesDto,
      userId,
    );
    return ResponseUtils.success(messages);
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
    return ResponseUtils.success(messages);
  }

  @Get('recent/:userId')
  async getRecentConversations(@Param('userId') userId: string) {
    const conversations =
      await this.messagesService.getRecentConversations(userId);
    return ResponseUtils.success(conversations);
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
    return ResponseUtils.success(messages);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(@Param('id') id: string, @Request() req) {
    const userId = req.user?.sub || req.user?._id;

    await this.messagesService.deleteMessage(id, userId);
    return ResponseUtils.success(null, 'Message deleted successfully');
  }
}
