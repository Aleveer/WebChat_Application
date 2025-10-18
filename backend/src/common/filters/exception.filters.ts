import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';

// Global Exception Filter
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'INTERNAL_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        details = (exceptionResponse as any).details;
      }

      error = this.getErrorCode(status);
    } else if (exception instanceof MongoError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database operation failed';
      error = 'DATABASE_ERROR';
      details = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
      error = 'UNKNOWN_ERROR';
    }

    const errorResponse = {
      success: false,
      error,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.requestId || 'unknown',
    };

    this.logger.error(
      `Exception: ${error} - ${message} - ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_EXCEEDED';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}

// HTTP Exception Filter
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    let message = exception.message;
    let details: any = null;

    if (typeof exceptionResponse === 'object') {
      message = (exceptionResponse as any).message || exception.message;
      details = (exceptionResponse as any).details;
    }

    const errorResponse = {
      success: false,
      error: this.getErrorCode(status),
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.requestId || 'unknown',
    };

    this.logger.warn(
      `HTTP Exception: ${status} - ${message} - ${request.method} ${request.url}`,
    );

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_EXCEEDED';
      default:
        return 'HTTP_ERROR';
    }
  }
}

// Validation Exception Filter
@Catch()
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.BAD_REQUEST;
    let message = 'Validation failed';
    let errors: any[] = [];

    if (exception.response && Array.isArray(exception.response.message)) {
      errors = exception.response.message.map((error: any) => ({
        field: error.property,
        message: Object.values(error.constraints || {}).join(', '),
        value: error.value,
      }));
    } else if (exception.message) {
      message = exception.message;
    }

    const errorResponse = {
      success: false,
      error: 'VALIDATION_ERROR',
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.requestId || 'unknown',
    };

    this.logger.warn(
      `Validation Error: ${message} - ${request.method} ${request.url}`,
    );

    response.status(status).json(errorResponse);
  }
}

// Database Exception Filter
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
      timestamp: new Date().toISOString(),
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

// Rate Limit Exception Filter
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

// Timeout Exception Filter
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
        timestamp: new Date().toISOString(),
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

// Custom Business Logic Exception Filter
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
