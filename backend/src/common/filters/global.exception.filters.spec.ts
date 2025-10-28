import 'reflect-metadata';
import { HttpStatus, HttpException } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { GlobalExceptionFilter } from './global.exception.filters';
import { MongoError } from 'mongodb';

describe('GlobalExceptionFilter - White Box Testing', () => {
  let filter: GlobalExceptionFilter;
  let mockRequest: any;
  let mockResponse: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();

    mockRequest = {
      url: '/api/test',
      method: 'GET',
      requestId: 'test-request-123',
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
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn().mockReturnValue('http'),
    } as any;
  });

  describe('Filter Initialization', () => {
    it('should create filter instance successfully', () => {
      expect(filter).toBeDefined();
      expect(filter).toBeInstanceOf(GlobalExceptionFilter);
    });

    it('should initialize logger with correct class name', () => {
      const logger = (filter as any).logger;
      expect(logger).toBeDefined();
      expect(logger.constructor.name).toBe('Logger');
    });

    it('should create multiple independent filter instances', () => {
      const filter1 = new GlobalExceptionFilter();
      const filter2 = new GlobalExceptionFilter();

      expect(filter1).not.toBe(filter2);
      expect((filter1 as any).logger).not.toBe((filter2 as any).logger);
    });
  });

  describe('catch Method - HttpException', () => {
    it('should handle HttpException with string response', () => {
      const exception = new HttpException(
        'Bad Request',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'BAD_REQUEST',
          message: 'Bad Request',
          details: null,
          timestamp: expect.any(String),
          path: '/api/test',
          method: 'GET',
          requestId: 'test-request-123',
        }),
      );
    });

    it('should handle HttpException with object response', () => {
      const exception = new HttpException(
        {
          message: 'Validation failed',
          details: { field: 'email', error: 'Invalid format' },
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'BAD_REQUEST',
          message: 'Validation failed',
          details: { field: 'email', error: 'Invalid format' },
        }),
      );
    });

    it('should handle HttpException with object response without message', () => {
      const exception = new HttpException(
        { statusCode: 400, error: 'Bad Request' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: exception.message,
        }),
      );
    });

    it('should handle UNAUTHORIZED status (401)', () => {
      const exception = new HttpException(
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'UNAUTHORIZED',
          message: 'Unauthorized',
        }),
      );
    });

    it('should handle FORBIDDEN status (403)', () => {
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'FORBIDDEN',
          message: 'Forbidden',
        }),
      );
    });

    it('should handle NOT_FOUND status (404)', () => {
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'NOT_FOUND',
          message: 'Not Found',
        }),
      );
    });

    it('should handle CONFLICT status (409)', () => {
      const exception = new HttpException('Conflict', HttpStatus.CONFLICT);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'CONFLICT',
          message: 'Conflict',
        }),
      );
    });

    it('should handle UNPROCESSABLE_ENTITY status (422)', () => {
      const exception = new HttpException(
        'Validation Error',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          message: 'Validation Error',
        }),
      );
    });

    it('should handle TOO_MANY_REQUESTS status (429)', () => {
      const exception = new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.TOO_MANY_REQUESTS,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too Many Requests',
        }),
      );
    });

    it('should handle INTERNAL_SERVER_ERROR status (500)', () => {
      const exception = new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'INTERNAL_ERROR',
          message: 'Internal Server Error',
        }),
      );
    });

    it('should handle unknown HTTP status code', () => {
      const exception = new HttpException('Custom Error', 418);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(418);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'INTERNAL_ERROR',
          message: 'Custom Error',
        }),
      );
    });

    it('should log HttpException error', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      const exception = new HttpException('Test Error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('BAD_REQUEST'),
        expect.any(String),
      );
    });
  });

  describe('catch Method - MongoError', () => {
    it('should handle MongoError instance', () => {
      const mongoError = new MongoError('Database connection failed');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Database operation failed',
          details: 'Database connection failed',
        }),
      );
    });

    it('should handle MongoError with different messages', () => {
      const mongoError = new MongoError('E11000 duplicate key error');

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'DATABASE_ERROR',
          details: 'E11000 duplicate key error',
        }),
      );
    });

    it('should log MongoError', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      const mongoError = new MongoError('Database error');

      filter.catch(mongoError, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('DATABASE_ERROR'),
        expect.any(String),
      );
    });
  });

  describe('catch Method - Standard Error', () => {
    it('should handle standard Error instance', () => {
      const error = new Error('Something went wrong');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'UNKNOWN_ERROR',
          message: 'Something went wrong',
          details: null,
        }),
      );
    });

    it('should handle Error with empty message', () => {
      const error = new Error('');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'UNKNOWN_ERROR',
          message: '',
        }),
      );
    });

    it('should handle Error with long message', () => {
      const longMessage = 'Error: ' + 'x'.repeat(5000);
      const error = new Error(longMessage);

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: longMessage,
        }),
      );
    });

    it('should log standard Error with stack trace', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      const error = new Error('Test error');

      filter.catch(error, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('UNKNOWN_ERROR'),
        expect.any(String),
      );
    });
  });

  describe('catch Method - Unknown Exception Types', () => {
    it('should handle string exception', () => {
      const exception = 'String error message';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: null,
        }),
      );
    });

    it('should handle number exception', () => {
      const exception = 12345;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'INTERNAL_ERROR',
          message: 'Internal server error',
        }),
      );
    });

    it('should handle object exception', () => {
      const exception = { custom: 'error', code: 999 };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'INTERNAL_ERROR',
          message: 'Internal server error',
        }),
      );
    });

    it('should handle null exception', () => {
      const exception = null;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    it('should handle undefined exception', () => {
      const exception = undefined;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    it('should log unknown exception without stack trace', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      const exception = 'string error';

      filter.catch(exception, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('INTERNAL_ERROR'),
        undefined,
      );
    });
  });

  describe('catch Method - Request Context', () => {
    it('should include correct request URL', () => {
      mockRequest.url = '/api/users/123';
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/users/123',
        }),
      );
    });

    it('should include correct HTTP method', () => {
      mockRequest.method = 'POST';
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    it('should include correct requestId', () => {
      mockRequest.requestId = 'custom-id-456';
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'custom-id-456',
        }),
      );
    });

    it('should use "unknown" when requestId is missing', () => {
      delete mockRequest.requestId;
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    it('should use "unknown" when requestId is null', () => {
      mockRequest.requestId = null;
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    it('should use "unknown" when requestId is undefined', () => {
      mockRequest.requestId = undefined;
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    it('should use "unknown" when requestId is empty string', () => {
      mockRequest.requestId = '';
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    it('should handle very long URL', () => {
      mockRequest.url = '/api/' + 'a'.repeat(1000);
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArg.path.length).toBeGreaterThan(1000);
    });

    it('should handle URL with query parameters', () => {
      mockRequest.url = '/api/search?q=test&limit=10';
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/search?q=test&limit=10',
        }),
      );
    });

    it('should handle URL with special characters', () => {
      mockRequest.url = '/api/users?email=test@example.com';
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/users?email=test@example.com',
        }),
      );
    });
  });

  describe('catch Method - Response Structure', () => {
    it('should always set success to false', () => {
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it('should include valid ISO timestamp', () => {
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      const timestamp = new Date(callArg.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
      expect(callArg.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should include all required fields', () => {
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean),
          error: expect.any(String),
          message: expect.any(String),
          timestamp: expect.any(String),
          path: expect.any(String),
          method: expect.any(String),
          requestId: expect.any(String),
        }),
      );
    });

    it('should have exactly 8 fields in error response', () => {
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      const keys = Object.keys(callArg);
      expect(keys.length).toBe(8);
      expect(keys).toEqual(
        expect.arrayContaining([
          'success',
          'error',
          'message',
          'details',
          'timestamp',
          'path',
          'method',
          'requestId',
        ]),
      );
    });

    it('should set details to null by default', () => {
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: null,
        }),
      );
    });
  });

  describe('getErrorCode Method - All Status Codes', () => {
    it('should return BAD_REQUEST for 400', () => {
      const exception = new HttpException(
        'Bad Request',
        HttpStatus.BAD_REQUEST,
      );
      filter.catch(exception, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArg.error).toBe('BAD_REQUEST');
    });

    it('should return UNAUTHORIZED for 401', () => {
      const exception = new HttpException(
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );
      filter.catch(exception, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArg.error).toBe('UNAUTHORIZED');
    });

    it('should return FORBIDDEN for 403', () => {
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      filter.catch(exception, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArg.error).toBe('FORBIDDEN');
    });

    it('should return NOT_FOUND for 404', () => {
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
      filter.catch(exception, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArg.error).toBe('NOT_FOUND');
    });

    it('should return CONFLICT for 409', () => {
      const exception = new HttpException('Conflict', HttpStatus.CONFLICT);
      filter.catch(exception, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArg.error).toBe('CONFLICT');
    });

    it('should return VALIDATION_ERROR for 422', () => {
      const exception = new HttpException(
        'Validation Error',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      filter.catch(exception, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArg.error).toBe('VALIDATION_ERROR');
    });

    it('should return RATE_LIMIT_EXCEEDED for 429', () => {
      const exception = new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
      filter.catch(exception, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArg.error).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should return INTERNAL_ERROR for unknown status', () => {
      const exception = new HttpException('Unknown', 999);
      filter.catch(exception, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArg.error).toBe('INTERNAL_ERROR');
    });

    it('should return INTERNAL_ERROR for 500', () => {
      const exception = new HttpException(
        'Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      filter.catch(exception, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArg.error).toBe('INTERNAL_ERROR');
    });
  });

  describe('catch Method - Logging', () => {
    it('should log with correct format', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      const exception = new Error('Test error');

      filter.catch(exception, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Exception:'),
        expect.any(String),
      );
    });

    it('should include error code in log', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('BAD_REQUEST'),
        expect.any(String),
      );
    });

    it('should include message in log', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      const exception = new Error('Custom error message');

      filter.catch(exception, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Custom error message'),
        expect.any(String),
      );
    });

    it('should include HTTP method in log', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      mockRequest.method = 'DELETE';
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.any(String),
      );
    });

    it('should include URL in log', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      mockRequest.url = '/api/specific/endpoint';
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/specific/endpoint'),
        expect.any(String),
      );
    });

    it('should include stack trace for Error instances', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      const secondArg = errorSpy.mock.calls[0][1];
      expect(secondArg).toBeDefined();
      expect(typeof secondArg).toBe('string');
    });

    it('should pass undefined stack for non-Error exceptions', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      const exception = 'string error';

      filter.catch(exception, mockArgumentsHost);

      const secondArg = errorSpy.mock.calls[0][1];
      expect(secondArg).toBeUndefined();
    });
  });

  describe('catch Method - ArgumentsHost Interaction', () => {
    it('should call switchToHttp', () => {
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockArgumentsHost.switchToHttp).toHaveBeenCalledTimes(1);
    });

    it('should call getResponse', () => {
      const exception = new Error('Test');

      const httpContext = mockArgumentsHost.switchToHttp();
      filter.catch(exception, mockArgumentsHost);

      expect(httpContext.getResponse).toHaveBeenCalled();
    });

    it('should call getRequest', () => {
      const exception = new Error('Test');

      const httpContext = mockArgumentsHost.switchToHttp();
      filter.catch(exception, mockArgumentsHost);

      expect(httpContext.getRequest).toHaveBeenCalled();
    });

    it('should call status on response', () => {
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledTimes(1);
    });

    it('should call json on response', () => {
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledTimes(1);
    });

    it('should call response methods in correct order', () => {
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      const statusCallOrder = (mockResponse.status as jest.Mock).mock
        .invocationCallOrder[0];
      const jsonCallOrder = (mockResponse.json as jest.Mock).mock
        .invocationCallOrder[0];

      expect(statusCallOrder).toBeLessThan(jsonCallOrder);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle validation error from class-validator', () => {
      const exception = new HttpException(
        {
          message: 'Validation failed',
          details: [
            { field: 'email', error: 'Email is not valid' },
            { field: 'age', error: 'Age must be positive' },
          ],
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'BAD_REQUEST',
          message: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'age' }),
          ]),
        }),
      );
    });

    it('should handle authentication failure', () => {
      const exception = new HttpException(
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );

      mockRequest.url = '/api/auth/login';
      mockRequest.method = 'POST';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'UNAUTHORIZED',
          message: 'Invalid credentials',
          path: '/api/auth/login',
          method: 'POST',
        }),
      );
    });

    it('should handle permission denied error', () => {
      const exception = new HttpException(
        'You do not have permission to access this resource',
        HttpStatus.FORBIDDEN,
      );

      mockRequest.url = '/api/admin/users';
      mockRequest.method = 'DELETE';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'FORBIDDEN',
          path: '/api/admin/users',
          method: 'DELETE',
        }),
      );
    });

    it('should handle resource not found', () => {
      const exception = new HttpException(
        'User not found',
        HttpStatus.NOT_FOUND,
      );

      mockRequest.url = '/api/users/123';
      mockRequest.method = 'GET';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'NOT_FOUND',
          message: 'User not found',
        }),
      );
    });

    it('should handle rate limiting', () => {
      const exception = new HttpException(
        'Too many requests, please try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.TOO_MANY_REQUESTS,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'RATE_LIMIT_EXCEEDED',
        }),
      );
    });

    it('should handle duplicate resource creation', () => {
      const exception = new HttpException(
        'Email already exists',
        HttpStatus.CONFLICT,
      );

      mockRequest.url = '/api/users';
      mockRequest.method = 'POST';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'CONFLICT',
          message: 'Email already exists',
        }),
      );
    });

    it('should handle MongoDB connection error', () => {
      const mongoError = new MongoError('Failed to connect to MongoDB');

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'DATABASE_ERROR',
          message: 'Database operation failed',
          details: 'Failed to connect to MongoDB',
        }),
      );
    });

    it('should handle unexpected runtime error', () => {
      const error = new TypeError('Cannot read property of undefined');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'UNKNOWN_ERROR',
          message: 'Cannot read property of undefined',
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle HttpException with empty object response', () => {
      const exception = new HttpException({}, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: exception.message,
        }),
      );
    });

    it('should handle HttpException with null response', () => {
      const exception = new HttpException(null as any, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });

    it('should handle HttpException with number response', () => {
      const exception = new HttpException(404 as any, HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    it('should handle request with missing URL', () => {
      delete mockRequest.url;
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: undefined,
        }),
      );
    });

    it('should handle request with null method', () => {
      mockRequest.method = null;
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          method: null,
        }),
      );
    });

    it('should handle exception with circular reference', () => {
      const exception: any = new Error('Circular error');
      exception.circular = exception;

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).not.toThrow();
    });

    it('should handle concurrent exception processing', () => {
      const exceptions = [
        new HttpException('Error 1', HttpStatus.BAD_REQUEST),
        new MongoError('Error 2'),
        new Error('Error 3'),
      ];

      exceptions.forEach((exception) => {
        filter.catch(exception, mockArgumentsHost);
      });

      expect(mockResponse.status).toHaveBeenCalledTimes(3);
      expect(mockResponse.json).toHaveBeenCalledTimes(3);
    });

    it('should handle very long error messages', () => {
      const longMessage = 'Error: ' + 'x'.repeat(10000);
      const exception = new Error(longMessage);

      filter.catch(exception, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArg.message.length).toBeGreaterThan(10000);
    });

    it('should handle error with special characters', () => {
      const exception = new Error('Error: @#$%^&*()[]{}|\\/:;<>?~`"\'');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error: @#$%^&*()[]{}|\\/:;<>?~`"\'',
        }),
      );
    });

    it('should handle error with Unicode characters', () => {
      const exception = new Error('错误：验证失败');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '错误：验证失败',
        }),
      );
    });

    it('should handle array exception', () => {
      const exception = ['error1', 'error2'];

      filter.catch(exception as any, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
  });

  describe('Code Coverage - All Branches', () => {
    it('should cover HttpException instanceof branch', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      expect(exception instanceof HttpException).toBe(true);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalled();
    });

    it('should cover MongoError instanceof branch', () => {
      const exception = new MongoError('Test');

      expect(exception instanceof MongoError).toBe(true);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });

    it('should cover Error instanceof branch', () => {
      const exception = new Error('Test');

      expect(exception instanceof Error).toBe(true);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'UNKNOWN_ERROR',
        }),
      );
    });

    it('should cover string response type branch', () => {
      const exception = new HttpException(
        'String response',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'String response',
        }),
      );
    });

    it('should cover object response type branch', () => {
      const exception = new HttpException(
        { message: 'Object response' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Object response',
        }),
      );
    });

    it('should cover requestId || "unknown" - with requestId', () => {
      mockRequest.requestId = 'valid-id';
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'valid-id',
        }),
      );
    });

    it('should cover requestId || "unknown" - without requestId', () => {
      mockRequest.requestId = undefined;
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    it('should cover stack trace branch for Error', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(errorSpy.mock.calls[0][1]).toBeDefined();
    });

    it('should cover stack trace branch for non-Error', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      const exception = 'string';

      filter.catch(exception, mockArgumentsHost);

      expect(errorSpy.mock.calls[0][1]).toBeUndefined();
    });
  });

  describe('Performance and Stress Testing', () => {
    it('should handle rapid successive calls', () => {
      for (let i = 0; i < 100; i++) {
        const exception = new Error(`Error ${i}`);
        filter.catch(exception, mockArgumentsHost);
      }

      expect(mockResponse.status).toHaveBeenCalledTimes(100);
      expect(mockResponse.json).toHaveBeenCalledTimes(100);
    });

    it('should maintain consistent behavior under load', () => {
      const results: any[] = [];

      for (let i = 0; i < 50; i++) {
        mockResponse.json = jest.fn().mockImplementation((data) => {
          results.push(data);
          return mockResponse;
        });
        mockResponse.status = jest.fn().mockReturnThis();

        const exception = new Error('Test');
        filter.catch(exception, mockArgumentsHost);
      }

      results.forEach((result) => {
        expect(result).toHaveProperty('success', false);
        expect(result).toHaveProperty('error', 'UNKNOWN_ERROR');
      });
    });

    it('should handle large request objects', () => {
      mockRequest.url = '/api/' + 'a'.repeat(5000);
      mockRequest.method = 'POST';
      mockRequest.requestId = 'id-' + '1'.repeat(100);
      mockRequest.largeData = new Array(1000).fill({ key: 'value' });

      const exception = new Error('Test');

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).not.toThrow();

      expect(mockResponse.status).toHaveBeenCalled();
    });
  });

  describe('Integration with NestJS', () => {
    it('should be compatible with NestJS ExceptionFilter interface', () => {
      expect(typeof filter.catch).toBe('function');
      expect(filter.catch.length).toBe(2);
    });

    it('should work with NestJS ArgumentsHost', () => {
      const exception = new Error('Test');

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).not.toThrow();

      expect(mockArgumentsHost.switchToHttp).toHaveBeenCalled();
    });

    it('should properly chain response methods', () => {
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockResponse.status().json).toBe(mockResponse.json);
    });
  });

  describe('Type Safety and Validation', () => {
    it('should maintain type safety for response structure', () => {
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];

      expect(typeof callArg.success).toBe('boolean');
      expect(typeof callArg.error).toBe('string');
      expect(typeof callArg.message).toBe('string');
      expect(typeof callArg.timestamp).toBe('string');
      expect(typeof callArg.path).toBe('string');
      expect(typeof callArg.method).toBe('string');
      expect(typeof callArg.requestId).toBe('string');
    });

    it('should ensure status is always a number', () => {
      const testCases = [
        {
          exception: new HttpException('Test', HttpStatus.BAD_REQUEST),
          status: 400,
        },
        { exception: new MongoError('Test'), status: 400 },
        { exception: new Error('Test'), status: 500 },
        { exception: 'string', status: 500 },
      ];

      testCases.forEach(({ exception, status }) => {
        filter.catch(exception, mockArgumentsHost);

        const statusCall = (mockResponse.status as jest.Mock).mock.calls[
          (mockResponse.status as jest.Mock).mock.calls.length - 1
        ][0];
        expect(typeof statusCall).toBe('number');
        expect(statusCall).toBe(status);
      });
    });

    it('should ensure timestamp is valid ISO string', () => {
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      const timestamp = callArg.timestamp;

      expect(typeof timestamp).toBe('string');
      expect(() => new Date(timestamp)).not.toThrow();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });
});
