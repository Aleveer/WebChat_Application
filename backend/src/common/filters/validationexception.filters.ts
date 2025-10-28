import {
  Catch,
  ArgumentsHost,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseExceptionFilter } from './base.exception.filters';
import { ValidationErrorDto } from '../dto/validation.error.dto';

@Catch(BadRequestException)
export class ValidationExceptionFilter extends BaseExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const exceptionResponse = exception.getResponse();
    let message = 'Validation failed';
    let errors: ValidationErrorDto[] = [];

    if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as Record<string, unknown>;
      message = (responseObj.message as string) || message;

      if (Array.isArray(responseObj.message)) {
        errors = (responseObj.message as Array<Record<string, unknown>>).map(
          (error) =>
            new ValidationErrorDto(
              (error.property as string) || '',
              Object.values(error.constraints || {}).join(', '),
              error.value,
            ),
        );
      }
    }

    const errorResponse = this.createErrorResponse(
      'VALIDATION_ERROR',
      message,
      request,
      errors,
    );

    this.logger.warn(
      `Validation Error: ${message} - ${request.method} ${request.url}`,
    );
    response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
  }
}
