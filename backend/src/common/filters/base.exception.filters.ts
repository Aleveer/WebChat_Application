import { ExceptionFilter, ArgumentsHost, Logger } from '@nestjs/common';
import { Request } from 'express';
import { ErrorCode, getErrorCodeFromStatus } from '../constants/app.constants';
import {
  ErrorResponse,
  ErrorResponseFormatter,
} from '../utils/error-response.formatter';

export abstract class BaseExceptionFilter implements ExceptionFilter {
  protected readonly logger = new Logger(this.constructor.name);

  abstract catch(exception: unknown, host: ArgumentsHost): void;

  /**
   * Get error code from HTTP status
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
