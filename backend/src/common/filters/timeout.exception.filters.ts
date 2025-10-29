import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { format } from 'date-fns';
@Catch()
export class TimeoutExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TimeoutExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception.message && exception.message.includes('timeout')) {
      const errorResponse = {
        success: false,
        error: 'REQUEST_TIMEOUT',
        message: 'Request timeout, please try again',
        timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        path: request.url,
        method: request.method,
        requestId: request.requestId || 'unknown',
      };

      this.logger.warn(`Request Timeout: ${request.method} ${request.url}`);

      response.status(HttpStatus.REQUEST_TIMEOUT).json(errorResponse);
      return;
    }

    // Re-throw if not a timeout error
    throw exception;
  }
}
