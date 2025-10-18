import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsMongoId,
  MaxLength,
  MinLength,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ReceiverType } from '../schemas/message.schema';

export class CreateMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  sender_id: string;

  @IsEnum(ReceiverType)
  receiver_type: ReceiverType;

  @IsMongoId()
  @IsNotEmpty()
  receiver_id: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  text: string;
}

export class GetMessagesDto {
  @IsMongoId()
  @IsNotEmpty()
  receiver_id: string;

  @IsEnum(ReceiverType)
  receiver_type: ReceiverType;

  @IsOptional()
  @IsDateString()
  before?: string; // ISO date string for pagination

  @IsOptional()
  limit?: number = 50; // Default limit
}

export class SendToUserDto {
  @IsMongoId()
  @IsNotEmpty()
  receiver_id: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  text: string;
}

export class SendToGroupDto {
  @IsMongoId()
  @IsNotEmpty()
  group_id: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  text: string;
}
