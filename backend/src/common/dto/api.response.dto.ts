import { ValidationErrorDto } from './validation.error.dto';
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
