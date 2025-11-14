import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
} from 'class-validator';

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

    @IsOptional()
    @IsString()
    content?: string;

    @IsOptional()
    @IsEnum(MessageType)
    type?: string = 'text';

    @IsOptional()
    @IsString()
    attachmentUrl?: string;

    @IsOptional()
    @IsString()
    attachmentType?: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any>;
}
