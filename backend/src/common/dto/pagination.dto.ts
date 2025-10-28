import {
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { APP_CONSTANTS } from '../constants/app.constants';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(APP_CONSTANTS.PAGINATION.DEFAULT_PAGE)
  page?: number = APP_CONSTANTS.PAGINATION.DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(APP_CONSTANTS.PAGINATION.MIN_LIMIT)
  @Max(APP_CONSTANTS.PAGINATION.MAX_LIMIT)
  limit?: number = APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  search?: string;
}
