import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class BusinessLogicExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BusinessLogicExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Check if it's a custom business logic error
    if (exception.isBusinessError) {
      const errorResponse = {
        success: false,
        error: exception.errorCode || 'BUSINESS_ERROR',
        message: exception.message,
        details: exception.details,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        requestId: request.requestId || 'unknown',
      };

      this.logger.warn(
        `Business Logic Error: ${exception.errorCode} - ${exception.message} - ${request.method} ${request.url}`,
      );

      response
        .status(exception.status || HttpStatus.BAD_REQUEST)
        .json(errorResponse);
      return;
    }

    // Re-throw if not a business logic error
    throw exception;
  }
}
