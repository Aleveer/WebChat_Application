import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsObject,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '../schemas/notification.schema';
import type { Metadata } from '../../../common/types';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsMongoId()
  sender: string;

  @IsMongoId()
  recipient: string;

  @IsOptional()
  @IsMongoId()
  group?: string;

  @IsOptional()
  @IsObject()
  related_data?: Metadata;
}

export class GetNotificationsDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsBoolean()
  is_read?: boolean;
}
