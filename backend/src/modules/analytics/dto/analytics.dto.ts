import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EventType } from '../schemas/analytics-event.schema';
import type { Metadata } from '../../../common/types';

export class CreateAnalyticsEventDto {
  @IsEnum(EventType)
  event_type: EventType;

  @IsMongoId()
  user_id: string;

  @IsOptional()
  @IsObject()
  metadata?: Metadata;

  @IsOptional()
  @IsString()
  session_id?: string;

  @IsOptional()
  @IsString()
  ip_address?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;
}

export class GetAnalyticsDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 50;

  @IsOptional()
  @IsEnum(EventType)
  event_type?: EventType;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;
}
