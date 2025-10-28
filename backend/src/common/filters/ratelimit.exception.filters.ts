import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseExceptionFilter } from './base.exception.filters';

@Catch()
export class RateLimitExceptionFilter extends BaseExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception.message && exception.message.includes('Rate limit')) {
      const errorResponse = this.createErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests, please try again later',
        request,
        undefined,
        60, // retry after 60 seconds
      );

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
