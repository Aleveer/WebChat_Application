import {
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsString,
  IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Base Response DTO
export class BaseResponseDto<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;

  constructor(success: boolean, data?: T, message?: string, error?: string) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data?: T, message?: string): BaseResponseDto<T> {
    return new BaseResponseDto(true, data, message);
  }

  static error(error: string, message?: string): BaseResponseDto {
    return new BaseResponseDto(false, undefined, message, error);
  }
}

// Pagination DTO
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// Paginated Response DTO
export class PaginatedResponseDto<T> extends BaseResponseDto<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  constructor(
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
    message?: string,
  ) {
    super(true, data, message);
    this.pagination = pagination;
  }
}

// Search DTO
export class SearchDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  q?: string;

  @IsOptional()
  @IsString()
  filter?: string;
}

// Date Range DTO
export class DateRangeDto {
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}

// File Upload DTO
export class FileUploadDto {
  @IsString()
  filename: string;

  @IsString()
  mimetype: string;

  @IsNumber()
  size: number;

  @IsString()
  path: string;
}

// Bulk Action DTO
export class BulkActionDto {
  @IsString({ each: true })
  ids: string[];

  @IsString()
  action: string;
}

// ID Parameter DTO
export class IdParamDto {
  @IsString()
  id: string;
}

// Query Parameters DTO
export class QueryParamsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}

// Success Response DTO
export class SuccessResponseDto<T = any> extends BaseResponseDto<T> {
  constructor(data?: T, message?: string) {
    super(true, data, message);
  }
}

// Error Response DTO
export class ErrorResponseDto extends BaseResponseDto {
  constructor(error: string, message?: string) {
    super(false, undefined, message, error);
  }
}

// Validation Error DTO
export class ValidationErrorDto {
  field: string;
  message: string;
  value?: any;

  constructor(field: string, message: string, value?: any) {
    this.field = field;
    this.message = message;
    this.value = value;
  }
}

// API Response DTO for consistent responses
export class ApiResponseDto<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ValidationErrorDto[];
  meta?: {
    timestamp: string;
    requestId?: string;
    version?: string;
  };

  constructor(
    success: boolean,
    data?: T,
    message?: string,
    errors?: ValidationErrorDto[],
    meta?: { timestamp: string; requestId?: string; version?: string },
  ) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.errors = errors;
    this.meta = meta || {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  static success<T>(data?: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto(true, data, message);
  }

  static error(message: string, errors?: ValidationErrorDto[]): ApiResponseDto {
    return new ApiResponseDto(false, undefined, message, errors);
  }
}
