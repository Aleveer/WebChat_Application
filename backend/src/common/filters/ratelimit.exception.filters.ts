import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { BaseExceptionFilter } from './base.exception.filters';

/**
 * Exception Filter for @nestjs/throttler rate limiting
 *
 * Handles ThrottlerException and provides consistent error responses
 * with retry-after headers and detailed logging
 */
@Catch(ThrottlerException)
export class RateLimitExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.createErrorResponse(
      'RATE_LIMIT_EXCEEDED',
      'Too many requests, please try again later',
      request,
      {
        message: exception.message,
        throttlerMessage: exception.getResponse(),
      },
      60, // retry after 60 seconds
    );

    this.logger.warn(
      `Rate Limit Exceeded: ${request.method} ${request.url} - IP: ${request.ip} - User: ${(request.user as any)?.id || 'anonymous'}`,
    );

    // Add Retry-After header
    response.setHeader('Retry-After', '60');

    // Add rate limit headers for client information
    response.setHeader('X-RateLimit-Limit', '100'); // Can be made dynamic
    response.setHeader('X-RateLimit-Remaining', '0');
    response.setHeader('X-RateLimit-Reset', String(Date.now() + 60000));

    response.status(HttpStatus.TOO_MANY_REQUESTS).json(errorResponse);
  }
}
