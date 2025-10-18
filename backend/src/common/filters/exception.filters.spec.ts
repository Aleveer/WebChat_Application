import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';
import {
  GlobalExceptionFilter,
  HttpExceptionFilter,
  ValidationExceptionFilter,
  DatabaseExceptionFilter,
  RateLimitExceptionFilter,
  TimeoutExceptionFilter,
  BusinessLogicExceptionFilter,
} from './exception.filters';

describe('Exception Filters', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    mockRequest = {
      url: '/test',
      method: 'GET',
      requestId: 'test-request-id',
      ip: '127.0.0.1',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as any;

    // Mock Logger để tránh console output trong test
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GlobalExceptionFilter', () => {
    let filter: GlobalExceptionFilter;

    beforeEach(() => {
      filter = new GlobalExceptionFilter();
    });

    describe('catch method - White Box Testing', () => {
      it('should handle HttpException with string response', () => {
        // Arrange
        const exception = new HttpException(
          'Test error',
          HttpStatus.BAD_REQUEST,
        );
        const expectedResponse = {
          success: false,
          error: 'BAD_REQUEST',
          message: 'Test error',
          details: null,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.BAD_REQUEST,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should handle HttpException with object response', () => {
        // Arrange
        const exception = new HttpException(
          { message: 'Custom error', details: 'Additional info' },
          HttpStatus.UNAUTHORIZED,
        );
        const expectedResponse = {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Custom error',
          details: 'Additional info',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.UNAUTHORIZED,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should handle MongoError', () => {
        // Arrange
        const exception = new MongoError('Database connection failed');
        const expectedResponse = {
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Database operation failed',
          details: 'Database connection failed',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.BAD_REQUEST,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should handle generic Error', () => {
        // Arrange
        const exception = new Error('Generic error message');
        const expectedResponse = {
          success: false,
          error: 'UNKNOWN_ERROR',
          message: 'Generic error message',
          details: null,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should handle unknown exception type', () => {
        // Arrange
        const exception = { someProperty: 'value' };
        const expectedResponse = {
          success: false,
          error: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: null,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should handle request without requestId', () => {
        // Arrange
        mockRequest.requestId = undefined;
        const exception = new HttpException(
          'Test error',
          HttpStatus.BAD_REQUEST,
        );
        const expectedResponse = {
          success: false,
          error: 'BAD_REQUEST',
          message: 'Test error',
          details: null,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'unknown',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });
    });

    describe('getErrorCode method - White Box Testing', () => {
      it('should return correct error codes for all HTTP status codes', () => {
        const testCases = [
          { status: HttpStatus.BAD_REQUEST, expected: 'BAD_REQUEST' },
          { status: HttpStatus.UNAUTHORIZED, expected: 'UNAUTHORIZED' },
          { status: HttpStatus.FORBIDDEN, expected: 'FORBIDDEN' },
          { status: HttpStatus.NOT_FOUND, expected: 'NOT_FOUND' },
          { status: HttpStatus.CONFLICT, expected: 'CONFLICT' },
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            expected: 'VALIDATION_ERROR',
          },
          {
            status: HttpStatus.TOO_MANY_REQUESTS,
            expected: 'RATE_LIMIT_EXCEEDED',
          },
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            expected: 'INTERNAL_ERROR',
          },
          { status: 999, expected: 'INTERNAL_ERROR' }, // Unknown status
        ];

        testCases.forEach(({ status, expected }) => {
          const exception = new HttpException('Test', status);
          filter.catch(exception, mockArgumentsHost);
          expect(mockResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expected }),
          );
        });
      });
    });
  });

  describe('HttpExceptionFilter', () => {
    let filter: HttpExceptionFilter;

    beforeEach(() => {
      filter = new HttpExceptionFilter();
    });

    describe('catch method - White Box Testing', () => {
      it('should handle HttpException with string response', () => {
        // Arrange
        const exception = new HttpException(
          'Test error',
          HttpStatus.BAD_REQUEST,
        );
        const expectedResponse = {
          success: false,
          error: 'BAD_REQUEST',
          message: 'Test error',
          details: null,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.BAD_REQUEST,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should handle HttpException with object response containing message', () => {
        // Arrange
        const exception = new HttpException(
          { message: 'Custom error message' },
          HttpStatus.UNAUTHORIZED,
        );
        const expectedResponse = {
          success: false,
          error: 'UNAUTHORIZED',
          message: 'Custom error message',
          details: undefined,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.UNAUTHORIZED,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should handle HttpException with object response containing details', () => {
        // Arrange
        const exception = new HttpException(
          { message: 'Error', details: 'Additional details' },
          HttpStatus.FORBIDDEN,
        );
        const expectedResponse = {
          success: false,
          error: 'FORBIDDEN',
          message: 'Error',
          details: 'Additional details',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should fallback to exception.message when response object has no message', () => {
        // Arrange
        const exception = new HttpException(
          { someOtherField: 'value' },
          HttpStatus.NOT_FOUND,
        );
        const expectedResponse = {
          success: false,
          error: 'NOT_FOUND',
          message: 'Http Exception',
          details: undefined,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });
    });
  });

  describe('ValidationExceptionFilter', () => {
    let filter: ValidationExceptionFilter;

    beforeEach(() => {
      filter = new ValidationExceptionFilter();
    });

    describe('catch method - White Box Testing', () => {
      it('should handle validation error with array of messages', () => {
        // Arrange
        const exception = {
          response: {
            message: [
              {
                property: 'email',
                constraints: { isEmail: 'email must be an email' },
                value: 'invalid-email',
              },
              {
                property: 'password',
                constraints: {
                  minLength: 'password must be longer than 8 characters',
                },
                value: '123',
              },
            ],
          },
        };
        const expectedResponse = {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: [
            {
              field: 'email',
              message: 'email must be an email',
              value: 'invalid-email',
            },
            {
              field: 'password',
              message: 'password must be longer than 8 characters',
              value: '123',
            },
          ],
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.BAD_REQUEST,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should handle validation error with single message', () => {
        // Arrange
        const exception = {
          message: 'Custom validation error',
        };
        const expectedResponse = {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Custom validation error',
          errors: [],
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.BAD_REQUEST,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should handle validation error with multiple constraints', () => {
        // Arrange
        const exception = {
          response: {
            message: [
              {
                property: 'username',
                constraints: {
                  isNotEmpty: 'username should not be empty',
                  minLength: 'username must be longer than 3 characters',
                },
                value: '',
              },
            ],
          },
        };
        const expectedResponse = {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: [
            {
              field: 'username',
              message:
                'username should not be empty, username must be longer than 3 characters',
              value: '',
            },
          ],
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.BAD_REQUEST,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should handle validation error without constraints', () => {
        // Arrange
        const exception = {
          response: {
            message: [
              {
                property: 'field',
                constraints: {},
                value: 'test',
              },
            ],
          },
        };
        const expectedResponse = {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: [
            {
              field: 'field',
              message: '',
              value: 'test',
            },
          ],
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.BAD_REQUEST,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });
    });
  });

  describe('DatabaseExceptionFilter', () => {
    let filter: DatabaseExceptionFilter;

    beforeEach(() => {
      filter = new DatabaseExceptionFilter();
    });

    describe('catch method - White Box Testing', () => {
      it('should handle duplicate key error (code 11000)', () => {
        // Arrange
        const exception = new MongoError('Duplicate key error');
        exception.code = 11000;
        const expectedResponse = {
          success: false,
          error: 'DUPLICATE_ENTRY',
          message: 'Duplicate entry found',
          details: 'Duplicate key error',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should handle document validation error (code 121)', () => {
        // Arrange
        const exception = new MongoError('Document validation failed');
        exception.code = 121;
        const expectedResponse = {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Document validation failed',
          details: 'Document validation failed',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.BAD_REQUEST,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should handle unknown MongoError code', () => {
        // Arrange
        const exception = new MongoError('Unknown database error');
        exception.code = 999;
        const expectedResponse = {
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Database operation failed',
          details: 'Unknown database error',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.BAD_REQUEST,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should handle MongoError without code', () => {
        // Arrange
        const exception = new MongoError('Database connection error');
        const expectedResponse = {
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Database operation failed',
          details: 'Database connection error',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.BAD_REQUEST,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });
    });
  });

  describe('RateLimitExceptionFilter', () => {
    let filter: RateLimitExceptionFilter;

    beforeEach(() => {
      filter = new RateLimitExceptionFilter();
    });

    describe('catch method - White Box Testing', () => {
      it('should handle rate limit exception', () => {
        // Arrange
        const exception = {
          message: 'Rate limit exceeded for this endpoint',
        };
        const expectedResponse = {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
          retryAfter: 60,
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.TOO_MANY_REQUESTS,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should handle rate limit exception with different message format', () => {
        // Arrange
        const exception = {
          message: 'Rate limit reached, please slow down',
        };
        const expectedResponse = {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
          retryAfter: 60,
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.TOO_MANY_REQUESTS,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should re-throw exception if not rate limit related', () => {
        // Arrange
        const exception = new Error('Some other error');

        // Act & Assert
        expect(() => filter.catch(exception, mockArgumentsHost)).toThrow();
        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.json).not.toHaveBeenCalled();
      });

      it('should handle exception without message', () => {
        // Arrange
        const exception = {};

        // Act & Assert
        expect(() => filter.catch(exception, mockArgumentsHost)).toThrow();
        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.json).not.toHaveBeenCalled();
      });
    });
  });

  describe('TimeoutExceptionFilter', () => {
    let filter: TimeoutExceptionFilter;

    beforeEach(() => {
      filter = new TimeoutExceptionFilter();
    });

    describe('catch method - White Box Testing', () => {
      it('should handle timeout exception', () => {
        // Arrange
        const exception = {
          message: 'Request timeout after 30 seconds',
        };
        const expectedResponse = {
          success: false,
          error: 'REQUEST_TIMEOUT',
          message: 'Request timeout, please try again',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.REQUEST_TIMEOUT,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should handle timeout exception with different message format', () => {
        // Arrange
        const exception = {
          message: 'Request timeout occurred',
        };
        const expectedResponse = {
          success: false,
          error: 'REQUEST_TIMEOUT',
          message: 'Request timeout, please try again',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.REQUEST_TIMEOUT,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should re-throw exception if not timeout related', () => {
        // Arrange
        const exception = new Error('Some other error');

        // Act & Assert
        expect(() => filter.catch(exception, mockArgumentsHost)).toThrow();
        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.json).not.toHaveBeenCalled();
      });

      it('should handle exception without message', () => {
        // Arrange
        const exception = {};

        // Act & Assert
        expect(() => filter.catch(exception, mockArgumentsHost)).toThrow();
        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.json).not.toHaveBeenCalled();
      });
    });
  });

  describe('BusinessLogicExceptionFilter', () => {
    let filter: BusinessLogicExceptionFilter;

    beforeEach(() => {
      filter = new BusinessLogicExceptionFilter();
    });

    describe('catch method - White Box Testing', () => {
      it('should handle business logic error', () => {
        // Arrange
        const exception = {
          isBusinessError: true,
          errorCode: 'USER_NOT_FOUND',
          message: 'User not found',
          details: 'User with ID 123 does not exist',
          status: HttpStatus.NOT_FOUND,
        };
        const expectedResponse = {
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found',
          details: 'User with ID 123 does not exist',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should handle business logic error without errorCode', () => {
        // Arrange
        const exception = {
          isBusinessError: true,
          message: 'Business logic error',
          details: 'Some details',
        };
        const expectedResponse = {
          success: false,
          error: 'BUSINESS_ERROR',
          message: 'Business logic error',
          details: 'Some details',
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.BAD_REQUEST,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should handle business logic error without status', () => {
        // Arrange
        const exception = {
          isBusinessError: true,
          errorCode: 'INVALID_OPERATION',
          message: 'Invalid operation',
        };
        const expectedResponse = {
          success: false,
          error: 'INVALID_OPERATION',
          message: 'Invalid operation',
          details: undefined,
          timestamp: expect.any(String),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        };

        // Act
        filter.catch(exception, mockArgumentsHost);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.BAD_REQUEST,
        );
        expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
      });

      it('should re-throw exception if not business logic error', () => {
        // Arrange
        const exception = new Error('Some other error');

        // Act & Assert
        expect(() => filter.catch(exception, mockArgumentsHost)).toThrow();
        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.json).not.toHaveBeenCalled();
      });

      it('should handle business logic error with false isBusinessError', () => {
        // Arrange
        const exception = {
          isBusinessError: false,
          errorCode: 'SOME_ERROR',
          message: 'Some error',
        };

        // Act & Assert
        expect(() => filter.catch(exception, mockArgumentsHost)).toThrow();
        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.json).not.toHaveBeenCalled();
      });
    });
  });

  describe('Integration Tests - White Box Testing', () => {
    it('should test all filters with real ArgumentsHost', () => {
      // Arrange
      const realArgumentsHost = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as ArgumentsHost;

      const filters = [
        new GlobalExceptionFilter(),
        new HttpExceptionFilter(),
        new ValidationExceptionFilter(),
        new DatabaseExceptionFilter(),
        new RateLimitExceptionFilter(),
        new TimeoutExceptionFilter(),
        new BusinessLogicExceptionFilter(),
      ];

      // Act & Assert
      filters.forEach((filter) => {
        expect(() => {
          if (filter instanceof GlobalExceptionFilter) {
            filter.catch(new Error('Test error'), realArgumentsHost);
          } else if (filter instanceof HttpExceptionFilter) {
            filter.catch(
              new HttpException('Test', HttpStatus.BAD_REQUEST),
              realArgumentsHost,
            );
          } else if (filter instanceof DatabaseExceptionFilter) {
            const mongoError = new MongoError('Test');
            filter.catch(mongoError, realArgumentsHost);
          } else if (filter instanceof RateLimitExceptionFilter) {
            filter.catch({ message: 'Rate limit exceeded' }, realArgumentsHost);
          } else if (filter instanceof TimeoutExceptionFilter) {
            filter.catch({ message: 'Request timeout' }, realArgumentsHost);
          } else if (filter instanceof BusinessLogicExceptionFilter) {
            filter.catch(
              { isBusinessError: true, message: 'Business error' },
              realArgumentsHost,
            );
          } else if (filter instanceof ValidationExceptionFilter) {
            filter.catch({ message: 'Validation error' }, realArgumentsHost);
          }
        }).not.toThrow();
      });
    });

    it('should test error response structure consistency', () => {
      // Arrange
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
      const filter = new GlobalExceptionFilter();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      const responseCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(responseCall).toHaveProperty('success', false);
      expect(responseCall).toHaveProperty('error');
      expect(responseCall).toHaveProperty('message');
      expect(responseCall).toHaveProperty('timestamp');
      expect(responseCall).toHaveProperty('path');
      expect(responseCall).toHaveProperty('method');
      expect(responseCall).toHaveProperty('requestId');
      expect(new Date(responseCall.timestamp)).toBeInstanceOf(Date);
    });

    it('should test logger calls', () => {
      // Arrange
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error');
      const loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn');
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
      const filter = new GlobalExceptionFilter();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Exception: BAD_REQUEST - Test error - GET /test',
        ),
        expect.any(String),
      );
    });
  });
});
