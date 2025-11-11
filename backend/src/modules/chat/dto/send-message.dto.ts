import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    FILE = 'file',
    VIDEO = 'video',
    AUDIO = 'audio',
}

export class SendMessageDto {
    @IsNotEmpty()
    @IsString()
    senderId: string;

    @IsNotEmpty()
    @IsString()
    receiverId: string;

    @IsNotEmpty()
    @IsString()
    content: string;

    @IsOptional()
    @IsEnum(MessageType)
    type?: string = 'text';
}
