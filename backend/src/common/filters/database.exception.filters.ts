import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';
import { format } from 'date-fns';
@Catch(MongoError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  catch(exception: MongoError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.BAD_REQUEST;
    let message = 'Database operation failed';
    let error = 'DATABASE_ERROR';

    if (exception instanceof MongoError) {
      switch (exception.code) {
        case 11000:
          status = HttpStatus.CONFLICT;
          message = 'Duplicate entry found';
          error = 'DUPLICATE_ENTRY';
          break;
        case 121:
          status = HttpStatus.BAD_REQUEST;
          message = 'Document validation failed';
          error = 'VALIDATION_ERROR';
          break;
        default:
          message = 'Database operation failed';
      }
    }

    const errorResponse = {
      success: false,
      error,
      message,
      details: exception.message,
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      path: request.url,
      method: request.method,
      requestId: request.requestId || 'unknown',
    };

    this.logger.error(
      `Database Error: ${error} - ${message} - ${request.method} ${request.url}`,
      exception.stack,
    );

    response.status(status).json(errorResponse);
  }
}
