import {
  ExceptionFilter,
  ArgumentsHost,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ErrorCode,
  getErrorCodeFromStatus,
} from '../constants/error-codes.constants';
import {
  ErrorResponse,
  ErrorResponseFormatter,
} from '../utils/error-response.formatter';

export abstract class BaseExceptionFilter implements ExceptionFilter {
  protected readonly logger = new Logger(this.constructor.name);

  abstract catch(exception: unknown, host: ArgumentsHost): void;

  /**
   * Get error code from HTTP status
   * DEPRECATED: Use getErrorCodeFromStatus from error-codes.constants instead
   */
  protected getErrorCode(status: number): string {
    return getErrorCodeFromStatus(status);
  }

  /**
   * Create error response using centralized formatter
   */
  protected createErrorResponse(
    error: ErrorCode,
    message: string,
    request: Request,
    details?: any,
    retryAfter?: number,
  ): ErrorResponse {
    return ErrorResponseFormatter.createErrorResponse(
      error,
      message,
      request,
      details,
      retryAfter,
    );
  }
}
