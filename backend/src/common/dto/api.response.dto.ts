import { ValidationErrorDto } from './validation.error.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = unknown> {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ required: false })
  message?: string;

  @ApiProperty({ required: false })
  data?: T;

  @ApiProperty({ required: false, type: [ValidationErrorDto] })
  errors?: ValidationErrorDto[];

  @ApiProperty({ required: false })
  meta?: {
    timestamp: string;
    requestId?: string;
    version?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };

  constructor(
    success: boolean,
    data?: T,
    message?: string,
    errors?: ValidationErrorDto[],
    meta?: {
      timestamp: string;
      requestId?: string;
      version?: string;
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    },
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
