import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FileType } from '../schemas/file.schema';
import type { Metadata } from '../../../common/types';

export class CreateFileDto {
  @IsString()
  original_name: string;

  @IsString()
  file_name: string;

  @IsString()
  file_path: string;

  @IsString()
  file_url: string;

  @IsNumber()
  file_size: number;

  @IsString()
  mime_type: string;

  @IsEnum(FileType)
  file_type: FileType;

  @IsString()
  uploaded_by: string;

  @IsOptional()
  @IsObject()
  metadata?: Metadata;
}

export class GetFilesDto {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(FileType)
  file_type?: FileType;

  @IsOptional()
  @IsString()
  search?: string;
}
