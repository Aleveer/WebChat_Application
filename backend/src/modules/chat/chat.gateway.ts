import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../auth/constants';

interface CreateMessageDto {
  from: string;
  to: string;
  content: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for development
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  // Method to emit message to conversation room (called by ChatService after saving)
  emitMessageToConversation(conversationId: string, message: any) {
    const roomName = `conv:${conversationId}`;
    this.server.to(roomName).emit('receiveMessage', message);
    console.log(`📨 Emitted message to room ${roomName}:`, message.id || message._id);
  }

  // Authenticate socket on connection using token provided in handshake.auth.token
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake?.auth?.token;
      if (!token) {
        console.log('❌ Socket connection rejected: no token');
        client.disconnect(true);
        return;
      }

      // verify token
      const payload: any = this.jwtService.verify(token);
      const userId = payload?.sub;
      const username = payload?.username;
      if (!userId) {
        console.log('❌ Socket connection rejected: invalid token payload');
        client.disconnect(true);
        return;
      }

      // Store user info in socket data (no room join here)
      client.data.userId = userId;
      client.data.username = username;
      console.log(`✅ Socket authenticated for user ${username} (${userId}) - socket ${client.id}`);
    } catch (err) {
      console.log('❌ Socket connection rejected (token verify failed):', err?.message || err);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Socket disconnected: ${client.id} (user ${client.data?.userId})`);
  }

//   @SubscribeMessage('join')
//   handleJoin(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() username: string,
//   ) {
//     // Backward-compatible; still store username if provided
//     client.data.username = username;
//     console.log(`User ${username} joined with socket ID: ${client.id}`);
//     return { event: 'joined', data: `Welcome ${username}!` };
//   }

  // Join a conversation room when user selects/opens a conversation
  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    if (!conversationId) {
      return { error: 'conversationId is required' };
    }

    const roomName = `conv:${conversationId}`;
    client.join(roomName);
    console.log(`🚪 User ${client.data.username} (${client.data.userId}) joined conversation room: ${roomName}`);
    
    return { event: 'joinedConversation', conversationId };
  }

  // Leave a conversation room (optional, for cleanup when user switches conversations)
  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    if (!conversationId) {
      return { error: 'conversationId is required' };
    }

    const roomName = `conv:${conversationId}`;
    client.leave(roomName);
    console.log(`🚪 User ${client.data.username} (${client.data.userId}) left conversation room: ${roomName}`);
    
    return { event: 'leftConversation', conversationId };
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    console.log('Message received:', createMessageDto);
    
    // TODO: Save message to database using ChatService
    // const message = await this.chatService.createMessage(createMessageDto);
    
    // For now, just broadcast the message
    const message = {
      id: Date.now().toString(),
      from: createMessageDto.from,
      to: createMessageDto.to,
      content: createMessageDto.content,
      timestamp: new Date(),
    };
    
    // Broadcast to all clients (including sender)
    this.server.emit('receiveMessage', message);
    
    return message;
  }

//   @SubscribeMessage('getMessages')
//   handleGetMessages(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() data: { userA: string; userB: string },
//   ) {
//     console.log(`Loading messages for ${data.userA} and ${data.userB}`);
    
//     // TODO: Load messages from database using ChatService
//     // const messages = await this.chatService.getMessages(data.userA, data.userB);
    
//     // For now, return empty array
//     const messages: any[] = [];
    
//     // Send message history to the requesting client
//     client.emit('messageHistory', { event: 'messageHistory', data: messages });
    
//     return { event: 'messageHistory', data: messages };
//   }
}
