import {
  Catch,
  ArgumentsHost,
  Logger,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';
import { BaseExceptionFilter } from './base.exception.filters';
import { ERROR_CODES, ErrorCode } from '../constants/error-codes.constants';

@Catch()
export class GlobalExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: ErrorCode = ERROR_CODES.INTERNAL_ERROR;
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || exception.message;
        details = responseObj.details;
      }

      error = this.getErrorCode(status) as ErrorCode;
    } else if (exception instanceof MongoError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database operation failed';
      error = ERROR_CODES.DATABASE_ERROR;
      details = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
      error = ERROR_CODES.UNKNOWN_ERROR;
    }

    const errorResponse = this.createErrorResponse(
      error,
      message,
      request,
      details,
    );

    this.logger.error(
      `Exception: ${error} - ${message} - ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(errorResponse);
  }
}
