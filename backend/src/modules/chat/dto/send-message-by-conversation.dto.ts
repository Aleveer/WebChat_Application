import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    FILE = 'file',
    VIDEO = 'video',
    AUDIO = 'audio',
}

export class SendMessageByConversationDto {
    @IsNotEmpty()
    @IsString()
    senderId: string;

    @IsNotEmpty()
    @IsString()
    conversationId: string;

    @IsNotEmpty()
    @IsString()
    content: string;

    @IsOptional()
    @IsEnum(MessageType)
    type?: string = 'text';
}
