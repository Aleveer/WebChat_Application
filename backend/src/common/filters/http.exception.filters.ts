import {
  Catch,
  ArgumentsHost,
  Logger,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseExceptionFilter } from './base.exception.filters';
import { ErrorCode } from '../constants/app.constants';

@Catch(HttpException)
export class HttpExceptionFilter extends BaseExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    let message = this.getHttpStatusText(status);
    let details: unknown = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const responseObj = exceptionResponse as Record<string, unknown>;
      message =
        (responseObj.message as string) || this.getHttpStatusText(status);
      details = responseObj.details;
    }

    const error: ErrorCode = this.getErrorCode(status) as ErrorCode;
    const errorResponse = this.createErrorResponse(
      error,
      message,
      request,
      details,
    );

    this.logger.warn(
      `HTTP Exception: ${status} - ${message} - ${request.method} ${request.url}`,
    );

    response.status(status).json(errorResponse);
  }

  private getHttpStatusText(status: number): string {
    // This method is kept for backward compatibility
    return this.getErrorCode(status);
  }
}
