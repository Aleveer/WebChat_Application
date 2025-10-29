import { Request } from 'express';
import { ErrorCode } from '../constants/app.constants';
import { format } from 'date-fns';
/**
 * Standardized Error Response Interface
 */
export interface ErrorResponse {
  success: false;
  error: ErrorCode;
  message: string;
  details?: any;
  timestamp: string;
  path: string;
  method: string;
  requestId: string;
  retryAfter?: number;
}

/**
 * Centralized Error Response Formatter
 * Ensures consistent error response format across all filters
 */
export class ErrorResponseFormatter {
  /**
   * Create standardized error response
   */
  static createErrorResponse(
    error: ErrorCode,
    message: string,
    request: Request,
    details?: any,
    retryAfter?: number,
  ): ErrorResponse {
    return {
      success: false,
      error,
      message,
      details,
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      path: request.url,
      method: request.method,
      requestId: request.requestId || 'unknown',
      ...(retryAfter && { retryAfter }),
    };
  }

  /**
   * Create validation error response with field details
   */
  static createValidationErrorResponse(
    message: string,
    request: Request,
    validationErrors: Array<{ field: string; message: string; value?: any }>,
  ): ErrorResponse {
    return this.createErrorResponse(
      'VALIDATION_ERROR',
      message,
      request,
      validationErrors,
    );
  }

  /**
   * Create rate limit error response with retry info
   */
  static createRateLimitErrorResponse(
    request: Request,
    retryAfterSeconds: number = 60,
  ): ErrorResponse {
    return this.createErrorResponse(
      'RATE_LIMIT_EXCEEDED',
      'Too many requests, please try again later',
      request,
      undefined,
      retryAfterSeconds,
    );
  }

  /**
   * Create timeout error response
   */
  static createTimeoutErrorResponse(request: Request): ErrorResponse {
    return this.createErrorResponse(
      'REQUEST_TIMEOUT',
      'Request timeout, please try again',
      request,
    );
  }

  /**
   * Create database error response
   */
  static createDatabaseErrorResponse(
    message: string,
    request: Request,
    details?: any,
  ): ErrorResponse {
    return this.createErrorResponse(
      'DATABASE_ERROR',
      message,
      request,
      details,
    );
  }
}
