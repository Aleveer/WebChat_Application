import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class RateLimitExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RateLimitExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception.message && exception.message.includes('Rate limit')) {
      const errorResponse = {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        requestId: request.requestId || 'unknown',
        retryAfter: 60, // seconds
      };

      this.logger.warn(
        `Rate Limit Exceeded: ${request.method} ${request.url} - ${request.ip}`,
      );

      response.status(HttpStatus.TOO_MANY_REQUESTS).json(errorResponse);
      return;
    }

    // Re-throw if not a rate limit error
    throw exception;
  }
}
