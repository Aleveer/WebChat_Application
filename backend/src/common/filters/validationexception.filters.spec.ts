import { ValidationExceptionFilter } from './validationexception.filters';
import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationErrorDto } from '../dto/validation.error.dto';

describe('ValidationExceptionFilter', () => {
  let filter: ValidationExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let loggerWarnMock: jest.SpyInstance;

  beforeEach(() => {
    filter = new ValidationExceptionFilter();
    // Mock logger
    loggerWarnMock = jest
      .spyOn((filter as any)['logger'] as Logger, 'warn')
      .mockImplementation();

    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();

    mockRequest = {
      method: 'POST',
      url: '/api/users',
      requestId: 'test-request-123',
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    } as any;

    mockArgumentsHost = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Validation exception with array of errors', () => {
    it('should handle validation exception with multiple field errors', () => {
      const exceptionResponse = {
        message: [
          {
            property: 'email',
            constraints: {
              isEmail: 'email must be an email',
              isNotEmpty: 'email should not be empty',
            },
            value: 'invalid-email',
          },
          {
            property: 'password',
            constraints: {
              minLength: 'password must be longer than 6 characters',
            },
            value: '123',
          },
        ],
      };

      const exception = new BadRequestException(exceptionResponse);

      filter.catch(exception, mockArgumentsHost);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: 'email must be an email, email should not be empty',
              value: 'invalid-email',
            }),
            expect.objectContaining({
              field: 'password',
              message: 'password must be longer than 6 characters',
              value: '123',
            }),
          ]),
        }),
      );

      expect(loggerWarnMock).toHaveBeenCalledWith(
        expect.stringContaining('Validation Error'),
      );
    });

    it('should handle validation exception with single field error', () => {
      const exceptionResponse = {
        message: [
          {
            property: 'username',
            constraints: {
              isNotEmpty: 'username should not be empty',
            },
            value: '',
          },
        ],
      };

      const exception = new BadRequestException(exceptionResponse);

      filter.catch(exception, mockArgumentsHost);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'username',
              message: 'username should not be empty',
              value: '',
            }),
          ]),
        }),
      );
    });

    it('should handle validation error with missing property field', () => {
      const exceptionResponse = {
        message: [
          {
            constraints: {
              isString: 'must be a string',
            },
            value: 123,
          },
        ],
      };

      const exception = new BadRequestException(exceptionResponse);

      filter.catch(exception, mockArgumentsHost);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: '',
              message: 'must be a string',
              value: 123,
            }),
          ]),
        }),
      );
    });

    it('should handle validation error with missing constraints', () => {
      const exceptionResponse = {
        message: [
          {
            property: 'age',
            value: -5,
          },
        ],
      };

      const exception = new BadRequestException(exceptionResponse);

      filter.catch(exception, mockArgumentsHost);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'age',
              message: '',
              value: -5,
            }),
          ]),
        }),
      );
    });

    it('should handle validation error with undefined value', () => {
      const exceptionResponse = {
        message: [
          {
            property: 'optionalField',
            constraints: {
              isString: 'must be a string',
            },
            value: undefined,
          },
        ],
      };

      const exception = new BadRequestException(exceptionResponse);

      filter.catch(exception, mockArgumentsHost);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'optionalField',
              message: 'must be a string',
              value: undefined,
            }),
          ]),
        }),
      );
    });
  });

  describe('Validation exception with string message', () => {
    it('should handle BadRequestException with custom string message', () => {
      const exception = new BadRequestException(
        'Custom validation error message',
      );

      filter.catch(exception, mockArgumentsHost);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          message: 'Custom validation error message',
          details: [],
        }),
      );

      expect(loggerWarnMock).toHaveBeenCalledWith(
        'Validation Error: Custom validation error message - POST /api/users',
      );
    });

    it('should handle BadRequestException with object containing string message', () => {
      const exceptionResponse = {
        message: 'Invalid input data',
        error: 'Bad Request',
      };

      const exception = new BadRequestException(exceptionResponse);

      filter.catch(exception, mockArgumentsHost);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: [],
        }),
      );
    });

    it('should use default message when message is missing', () => {
      const exceptionResponse = {
        error: 'Bad Request',
      };

      const exception = new BadRequestException(exceptionResponse);

      filter.catch(exception, mockArgumentsHost);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [],
        }),
      );

      expect(loggerWarnMock).toHaveBeenCalledWith(
        'Validation Error: Validation failed - POST /api/users',
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle empty array of validation errors', () => {
      const exceptionResponse = {
        message: [],
      };

      const exception = new BadRequestException(exceptionResponse);

      filter.catch(exception, mockArgumentsHost);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          details: [],
        }),
      );
    });

    it('should handle validation error with complex nested value', () => {
      const complexValue = {
        nested: {
          field: 'value',
          array: [1, 2, 3],
        },
      };

      const exceptionResponse = {
        message: [
          {
            property: 'complexField',
            constraints: {
              isObject: 'invalid object structure',
            },
            value: complexValue,
          },
        ],
      };

      const exception = new BadRequestException(exceptionResponse);

      filter.catch(exception, mockArgumentsHost);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'complexField',
              message: 'invalid object structure',
              value: complexValue,
            }),
          ]),
        }),
      );
    });

    it('should handle validation error with null value', () => {
      const exceptionResponse = {
        message: [
          {
            property: 'nullableField',
            constraints: {
              isNotEmpty: 'should not be empty',
            },
            value: null,
          },
        ],
      };

      const exception = new BadRequestException(exceptionResponse);

      filter.catch(exception, mockArgumentsHost);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'nullableField',
              message: 'should not be empty',
              value: null,
            }),
          ]),
        }),
      );
    });

    it('should handle different HTTP methods', () => {
      mockRequest.method = 'PUT';
      mockRequest.url = '/api/users/123';

      const exception = new BadRequestException('Update validation failed');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerWarnMock).toHaveBeenCalledWith(
        'Validation Error: Update validation failed - PUT /api/users/123',
      );
    });

    it('should handle validation error with multiple constraints per field', () => {
      const exceptionResponse = {
        message: [
          {
            property: 'email',
            constraints: {
              isEmail: 'must be an email',
              isNotEmpty: 'should not be empty',
              maxLength: 'must be at most 100 characters',
            },
            value: 'a'.repeat(150),
          },
        ],
      };

      const exception = new BadRequestException(exceptionResponse);

      filter.catch(exception, mockArgumentsHost);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: expect.stringContaining('must be an email'),
              value: 'a'.repeat(150),
            }),
          ]),
        }),
      );

      const callArgs = jsonMock.mock.calls[0][0];
      const emailError = callArgs.details.find(
        (e: ValidationErrorDto) => e.field === 'email',
      );
      expect(emailError.message).toContain('must be an email');
      expect(emailError.message).toContain('should not be empty');
      expect(emailError.message).toContain('must be at most 100 characters');
    });

    it('should verify response structure matches base filter format', () => {
      const exception = new BadRequestException('Test validation');

      filter.catch(exception, mockArgumentsHost);

      const callArgs = jsonMock.mock.calls[0][0];
      expect(callArgs).toHaveProperty('success', false);
      expect(callArgs).toHaveProperty('error', 'VALIDATION_ERROR');
      expect(callArgs).toHaveProperty('message', 'Test validation');
      expect(callArgs).toHaveProperty('timestamp');
      expect(callArgs).toHaveProperty('path', '/api/users');
      expect(callArgs).toHaveProperty('method', 'POST');
      expect(callArgs).toHaveProperty('requestId');
      expect(callArgs).toHaveProperty('details');
    });
  });

  describe('ValidationErrorDto construction', () => {
    it('should correctly map validation errors to ValidationErrorDto', () => {
      const exceptionResponse = {
        message: [
          {
            property: 'testField',
            constraints: {
              constraint1: 'error message 1',
              constraint2: 'error message 2',
            },
            value: 'testValue',
          },
        ],
      };

      const exception = new BadRequestException(exceptionResponse);

      filter.catch(exception, mockArgumentsHost);

      const callArgs = jsonMock.mock.calls[0][0];
      const validationError = callArgs.details[0];

      expect(validationError).toBeInstanceOf(ValidationErrorDto);
      expect(validationError.field).toBe('testField');
      expect(validationError.message).toBe('error message 1, error message 2');
      expect(validationError.value).toBe('testValue');
    });
  });
});
