import 'reflect-metadata';
import { HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { DatabaseExceptionFilter } from './database.exception.filters';
import { MongoError } from 'mongodb';

describe('DatabaseExceptionFilter - White Box Testing', () => {
  let filter: DatabaseExceptionFilter;
  let mockRequest: any;
  let mockResponse: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new DatabaseExceptionFilter();

    mockRequest = {
      url: '/api/users',
      method: 'POST',
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
      expect(filter).toBeInstanceOf(DatabaseExceptionFilter);
    });

    it('should initialize logger with correct class name', () => {
      const logger = (filter as any).logger;
      expect(logger).toBeDefined();
      expect(logger.constructor.name).toBe('Logger');
    });

    it('should create multiple independent filter instances', () => {
      const filter1 = new DatabaseExceptionFilter();
      const filter2 = new DatabaseExceptionFilter();

      expect(filter1).not.toBe(filter2);
      expect((filter1 as any).logger).not.toBe((filter2 as any).logger);
    });
  });

  describe('catch Method - MongoError Code 11000 (Duplicate Entry)', () => {
    it('should handle duplicate entry error with code 11000', () => {
      const mongoError = new MongoError(
        'E11000 duplicate key error collection',
      );
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'DUPLICATE_ENTRY',
          message: 'Duplicate entry found',
          details: mongoError.message,
          timestamp: expect.any(String),
          path: '/api/users',
          method: 'POST',
          requestId: 'test-request-123',
        }),
      );
    });

    it('should handle duplicate key error for unique index violation', () => {
      const mongoError = new MongoError(
        'E11000 duplicate key error collection: users index: email_1 dup key: { email: "test@example.com" }',
      );
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'DUPLICATE_ENTRY',
          message: 'Duplicate entry found',
        }),
      );
    });

    it('should handle duplicate error with different message format', () => {
      const mongoError = new MongoError('Duplicate key violation');
      (mongoError as any).code = 11000;
      mockRequest.url = '/api/groups';
      mockRequest.method = 'PUT';

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'DUPLICATE_ENTRY',
          message: 'Duplicate entry found',
          details: 'Duplicate key violation',
          path: '/api/groups',
          method: 'PUT',
        }),
      );
    });

    it('should log duplicate entry error', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      const mongoError = new MongoError('E11000 duplicate key error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('DUPLICATE_ENTRY'),
        expect.any(String),
      );
    });
  });

  describe('catch Method - MongoError Code 121 (Validation Error)', () => {
    it('should handle document validation error with code 121', () => {
      const mongoError = new MongoError('Document failed validation');
      (mongoError as any).code = 121;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Document validation failed',
          details: mongoError.message,
        }),
      );
    });

    it('should handle schema validation failure', () => {
      const mongoError = new MongoError(
        'Document validation failed: age: Path `age` is required',
      );
      (mongoError as any).code = 121;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          message: 'Document validation failed',
          details: 'Document validation failed: age: Path `age` is required',
        }),
      );
    });

    it('should log validation error', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      const mongoError = new MongoError('Validation failed');
      (mongoError as any).code = 121;

      filter.catch(mongoError, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('VALIDATION_ERROR'),
        expect.any(String),
      );
    });
  });

  describe('catch Method - Unknown MongoError Codes', () => {
    it('should handle unknown error code with default message', () => {
      const mongoError = new MongoError('Unknown database error');
      (mongoError as any).code = 999;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Database operation failed',
          details: 'Unknown database error',
        }),
      );
    });

    it('should handle error code 0', () => {
      const mongoError = new MongoError('Error with code 0');
      (mongoError as any).code = 0;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'DATABASE_ERROR',
          message: 'Database operation failed',
        }),
      );
    });

    it('should handle negative error code', () => {
      const mongoError = new MongoError('Negative error code');
      (mongoError as any).code = -1;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'DATABASE_ERROR',
          message: 'Database operation failed',
        }),
      );
    });

    it('should handle very large error code', () => {
      const mongoError = new MongoError('Large error code');
      (mongoError as any).code = 99999;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'DATABASE_ERROR',
          message: 'Database operation failed',
        }),
      );
    });

    it('should handle undefined error code', () => {
      const mongoError = new MongoError('No error code');
      (mongoError as any).code = undefined;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'DATABASE_ERROR',
          message: 'Database operation failed',
        }),
      );
    });

    it('should handle null error code', () => {
      const mongoError = new MongoError('Null error code');
      (mongoError as any).code = null;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'DATABASE_ERROR',
          message: 'Database operation failed',
        }),
      );
    });
  });

  describe('catch Method - Request Context', () => {
    it('should include correct request URL in error response', () => {
      mockRequest.url = '/api/messages/123';
      const mongoError = new MongoError('Database error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/messages/123',
        }),
      );
    });

    it('should include correct HTTP method in error response', () => {
      mockRequest.method = 'DELETE';
      const mongoError = new MongoError('Database error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });

    it('should include correct requestId in error response', () => {
      mockRequest.requestId = 'custom-request-id-456';
      const mongoError = new MongoError('Database error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'custom-request-id-456',
        }),
      );
    });

    it('should use "unknown" when requestId is missing', () => {
      delete mockRequest.requestId;
      const mongoError = new MongoError('Database error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    it('should use "unknown" when requestId is null', () => {
      mockRequest.requestId = null;
      const mongoError = new MongoError('Database error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    it('should use "unknown" when requestId is undefined', () => {
      mockRequest.requestId = undefined;
      const mongoError = new MongoError('Database error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    it('should use "unknown" when requestId is empty string', () => {
      mockRequest.requestId = '';
      const mongoError = new MongoError('Database error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    it('should handle very long URL', () => {
      mockRequest.url = '/api/' + 'a'.repeat(1000);
      const mongoError = new MongoError('Database error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: mockRequest.url,
        }),
      );
      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArg.path.length).toBeGreaterThan(1000);
    });

    it('should handle URL with special characters', () => {
      mockRequest.url = '/api/users?name=John&email=test@example.com';
      const mongoError = new MongoError('Database error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/users?name=John&email=test@example.com',
        }),
      );
    });

    it('should handle URL with Unicode characters', () => {
      mockRequest.url = '/api/用户/123';
      const mongoError = new MongoError('Database error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/用户/123',
        }),
      );
    });
  });

  describe('catch Method - Response Structure', () => {
    it('should return response with success: false', () => {
      const mongoError = new MongoError('Database error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it('should include valid ISO timestamp', () => {
      const mongoError = new MongoError('Database error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      const timestamp = new Date(callArg.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
      expect(callArg.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should include all required fields in error response', () => {
      const mongoError = new MongoError('Database error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: expect.any(Boolean),
          error: expect.any(String),
          message: expect.any(String),
          details: expect.any(String),
          timestamp: expect.any(String),
          path: expect.any(String),
          method: expect.any(String),
          requestId: expect.any(String),
        }),
      );
    });

    it('should have exactly 8 fields in error response', () => {
      const mongoError = new MongoError('Database error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

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
  });

  describe('catch Method - Error Details', () => {
    it('should include exception message in details', () => {
      const mongoError = new MongoError(
        'Custom detailed error message from MongoDB',
      );
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: 'Custom detailed error message from MongoDB',
        }),
      );
    });

    it('should handle empty error message', () => {
      const mongoError = new MongoError('');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: '',
        }),
      );
    });

    it('should handle very long error message', () => {
      const longMessage = 'Error: ' + 'x'.repeat(5000);
      const mongoError = new MongoError(longMessage);
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: longMessage,
        }),
      );
    });

    it('should handle error message with newlines', () => {
      const mongoError = new MongoError('Line 1\nLine 2\nLine 3');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: 'Line 1\nLine 2\nLine 3',
        }),
      );
    });

    it('should handle error message with special characters', () => {
      const mongoError = new MongoError('Error: @#$%^&*()[]{}|\\/:;<>?~`"\'');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: 'Error: @#$%^&*()[]{}|\\/:;<>?~`"\'',
        }),
      );
    });

    it('should handle error message with JSON format', () => {
      const mongoError = new MongoError(
        JSON.stringify({ error: 'test', code: 123 }),
      );
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArg.details).toBe('{"error":"test","code":123}');
    });
  });

  describe('catch Method - Logging', () => {
    it('should log error with correct format', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      const mongoError = new MongoError('Test error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database Error'),
        expect.any(String),
      );
    });

    it('should include error code in log message', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      const mongoError = new MongoError('Test error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('DUPLICATE_ENTRY'),
        expect.any(String),
      );
    });

    it('should include HTTP method in log message', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      mockRequest.method = 'PATCH';
      const mongoError = new MongoError('Test error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('PATCH'),
        expect.any(String),
      );
    });

    it('should include request URL in log message', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      mockRequest.url = '/api/specific/endpoint';
      const mongoError = new MongoError('Test error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/specific/endpoint'),
        expect.any(String),
      );
    });

    it('should include error message in log', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      const mongoError = new MongoError('Test error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate entry found'),
        expect.any(String),
      );
    });

    it('should include stack trace in log', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      const mongoError = new MongoError('Test error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      const secondArg = errorSpy.mock.calls[0][1];
      expect(secondArg).toBeDefined();
      expect(typeof secondArg).toBe('string');
    });

    it('should log for all error codes', () => {
      const logger = (filter as any).logger;
      const errorSpy = jest.spyOn(logger, 'error');

      // Test code 11000
      let mongoError = new MongoError('Duplicate');
      (mongoError as any).code = 11000;
      filter.catch(mongoError, mockArgumentsHost);

      // Test code 121
      mongoError = new MongoError('Validation');
      (mongoError as any).code = 121;
      filter.catch(mongoError, mockArgumentsHost);

      // Test unknown code
      mongoError = new MongoError('Unknown');
      (mongoError as any).code = 999;
      filter.catch(mongoError, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('catch Method - ArgumentsHost Interaction', () => {
    it('should call switchToHttp on ArgumentsHost', () => {
      const mongoError = new MongoError('Test error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockArgumentsHost.switchToHttp).toHaveBeenCalledTimes(1);
    });

    it('should call getResponse on HTTP context', () => {
      const mongoError = new MongoError('Test error');
      (mongoError as any).code = 11000;

      const httpContext = mockArgumentsHost.switchToHttp();
      filter.catch(mongoError, mockArgumentsHost);

      expect(httpContext.getResponse).toHaveBeenCalled();
    });

    it('should call getRequest on HTTP context', () => {
      const mongoError = new MongoError('Test error');
      (mongoError as any).code = 11000;

      const httpContext = mockArgumentsHost.switchToHttp();
      filter.catch(mongoError, mockArgumentsHost);

      expect(httpContext.getRequest).toHaveBeenCalled();
    });

    it('should call status on response object', () => {
      const mongoError = new MongoError('Test error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledTimes(1);
    });

    it('should call json on response object', () => {
      const mongoError = new MongoError('Test error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledTimes(1);
    });

    it('should call response methods in correct order', () => {
      const mongoError = new MongoError('Test error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      const statusCallOrder = (mockResponse.status as jest.Mock).mock
        .invocationCallOrder[0];
      const jsonCallOrder = (mockResponse.json as jest.Mock).mock
        .invocationCallOrder[0];

      expect(statusCallOrder).toBeLessThan(jsonCallOrder);
    });
  });

  describe('catch Method - HTTP Status Codes', () => {
    it('should set status 409 CONFLICT for duplicate entry (code 11000)', () => {
      const mongoError = new MongoError('Duplicate');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.status).toHaveBeenCalledWith(409);
    });

    it('should set status 400 BAD_REQUEST for validation error (code 121)', () => {
      const mongoError = new MongoError('Validation');
      (mongoError as any).code = 121;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should set status 400 BAD_REQUEST for unknown error', () => {
      const mongoError = new MongoError('Unknown');
      (mongoError as any).code = 999;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle duplicate email registration', () => {
      const mongoError = new MongoError(
        'E11000 duplicate key error collection: webchat.users index: email_1 dup key: { email: "user@example.com" }',
      );
      (mongoError as any).code = 11000;
      mockRequest.url = '/api/auth/register';
      mockRequest.method = 'POST';

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'DUPLICATE_ENTRY',
          message: 'Duplicate entry found',
          path: '/api/auth/register',
          method: 'POST',
        }),
      );
    });

    it('should handle duplicate username in user creation', () => {
      const mongoError = new MongoError(
        'E11000 duplicate key error collection: webchat.users index: username_1 dup key: { username: "johndoe" }',
      );
      (mongoError as any).code = 11000;
      mockRequest.url = '/api/users';
      mockRequest.method = 'POST';

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'DUPLICATE_ENTRY',
          message: 'Duplicate entry found',
        }),
      );
    });

    it('should handle schema validation failure for required fields', () => {
      const mongoError = new MongoError(
        'Document validation failed: email: Path `email` is required, username: Path `username` is required',
      );
      (mongoError as any).code = 121;
      mockRequest.url = '/api/users';
      mockRequest.method = 'POST';

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          message: 'Document validation failed',
        }),
      );
    });

    it('should handle invalid data type validation error', () => {
      const mongoError = new MongoError(
        'Document validation failed: age: Cast to Number failed for value "abc" at path "age"',
      );
      (mongoError as any).code = 121;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          message: 'Document validation failed',
        }),
      );
    });

    it('should handle duplicate group name creation', () => {
      const mongoError = new MongoError(
        'E11000 duplicate key error collection: webchat.groups index: name_1 dup key: { name: "DevTeam" }',
      );
      (mongoError as any).code = 11000;
      mockRequest.url = '/api/groups';
      mockRequest.method = 'POST';

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    });

    it('should handle connection timeout error', () => {
      const mongoError = new MongoError('connection timed out');
      (mongoError as any).code = 50;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'DATABASE_ERROR',
          message: 'Database operation failed',
        }),
      );
    });

    it('should handle network error during database operation', () => {
      const mongoError = new MongoError(
        'network error while attempting to run',
      );
      (mongoError as any).code = 89;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });

    it('should handle message creation with duplicate timestamp', () => {
      const mongoError = new MongoError(
        'E11000 duplicate key error collection: webchat.messages index: timestamp_1',
      );
      (mongoError as any).code = 11000;
      mockRequest.url = '/api/messages';
      mockRequest.method = 'POST';
      mockRequest.requestId = 'msg-create-123';

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/messages',
          requestId: 'msg-create-123',
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle MongoError with missing code property', () => {
      const mongoError = new MongoError('Error without code');
      delete (mongoError as any).code;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'DATABASE_ERROR',
          message: 'Database operation failed',
        }),
      );
    });

    it('should handle MongoError with string code', () => {
      const mongoError = new MongoError('Error with string code');
      (mongoError as any).code = '11000';

      filter.catch(mongoError, mockArgumentsHost);

      // String '11000' will not match case 11000 (number)
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'DATABASE_ERROR',
        }),
      );
    });

    it('should handle MongoError with float code', () => {
      const mongoError = new MongoError('Error with float code');
      (mongoError as any).code = 11000.5;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });

    it('should handle request with missing url', () => {
      delete mockRequest.url;
      const mongoError = new MongoError('Error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: undefined,
        }),
      );
    });

    it('should handle request with null method', () => {
      mockRequest.method = null;
      const mongoError = new MongoError('Error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          method: null,
        }),
      );
    });

    it('should handle MongoError with circular reference in properties', () => {
      const mongoError = new MongoError('Circular error');
      (mongoError as any).code = 11000;
      (mongoError as any).circular = mongoError;

      expect(() => {
        filter.catch(mongoError, mockArgumentsHost);
      }).not.toThrow();
    });

    it('should handle concurrent error processing', () => {
      const errors = [
        { code: 11000, message: 'Duplicate 1' },
        { code: 121, message: 'Validation 1' },
        { code: 999, message: 'Unknown 1' },
      ];

      errors.forEach((errorData) => {
        const mongoError = new MongoError(errorData.message);
        (mongoError as any).code = errorData.code;
        filter.catch(mongoError, mockArgumentsHost);
      });

      expect(mockResponse.status).toHaveBeenCalledTimes(3);
      expect(mockResponse.json).toHaveBeenCalledTimes(3);
    });

    it('should handle MongoError with very long message', () => {
      const longMessage = 'MongoDB Error: ' + 'x'.repeat(10000);
      const mongoError = new MongoError(longMessage);
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArg.details.length).toBeGreaterThan(10000);
    });

    it('should handle request with undefined properties', () => {
      mockRequest.url = undefined;
      mockRequest.method = undefined;
      mockRequest.requestId = undefined;

      const mongoError = new MongoError('Error');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: undefined,
          method: undefined,
          requestId: 'unknown',
        }),
      );
    });

    it('should handle MongoError with code as boolean', () => {
      const mongoError = new MongoError('Boolean code');
      (mongoError as any).code = true;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });

    it('should handle MongoError with code as object', () => {
      const mongoError = new MongoError('Object code');
      (mongoError as any).code = { value: 11000 };

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });

    it('should handle MongoError with code as array', () => {
      const mongoError = new MongoError('Array code');
      (mongoError as any).code = [11000];

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Code Coverage - All Branches', () => {
    it('should cover switch case 11000', () => {
      const mongoError = new MongoError('Test');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'DUPLICATE_ENTRY',
        }),
      );
    });

    it('should cover switch case 121', () => {
      const mongoError = new MongoError('Test');
      (mongoError as any).code = 121;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
        }),
      );
    });

    it('should cover switch default case', () => {
      const mongoError = new MongoError('Test');
      (mongoError as any).code = 12345;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'DATABASE_ERROR',
        }),
      );
    });

    it('should cover requestId || "unknown" - with requestId', () => {
      mockRequest.requestId = 'valid-id';
      const mongoError = new MongoError('Test');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'valid-id',
        }),
      );
    });

    it('should cover requestId || "unknown" - without requestId', () => {
      mockRequest.requestId = undefined;
      const mongoError = new MongoError('Test');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    it('should verify MongoError instanceof check is true', () => {
      const mongoError = new MongoError('Test');
      (mongoError as any).code = 11000;

      expect(mongoError instanceof MongoError).toBe(true);

      filter.catch(mongoError, mockArgumentsHost);

      // Should enter the instanceof block
      expect(mockResponse.status).toHaveBeenCalled();
    });
  });

  describe('Performance and Stress Testing', () => {
    it('should handle rapid successive calls', () => {
      for (let i = 0; i < 100; i++) {
        const mongoError = new MongoError(`Error ${i}`);
        (mongoError as any).code = i % 2 === 0 ? 11000 : 121;
        filter.catch(mongoError, mockArgumentsHost);
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

        const mongoError = new MongoError(`Error ${i}`);
        (mongoError as any).code = 11000;
        filter.catch(mongoError, mockArgumentsHost);
      }

      // All should have same structure
      results.forEach((result) => {
        expect(result).toHaveProperty('success', false);
        expect(result).toHaveProperty('error', 'DUPLICATE_ENTRY');
        expect(result).toHaveProperty('message', 'Duplicate entry found');
      });
    });

    it('should handle large request objects', () => {
      mockRequest.url = '/api/' + 'a'.repeat(5000);
      mockRequest.method = 'POST';
      mockRequest.requestId = 'id-' + '1'.repeat(100);
      mockRequest.largeData = new Array(1000).fill({
        key: 'value',
        nested: { data: 'test' },
      });

      const mongoError = new MongoError('Large request error');
      (mongoError as any).code = 11000;

      expect(() => {
        filter.catch(mongoError, mockArgumentsHost);
      }).not.toThrow();

      expect(mockResponse.status).toHaveBeenCalled();
    });
  });

  describe('Integration with NestJS', () => {
    it('should be compatible with NestJS ExceptionFilter interface', () => {
      expect(typeof filter.catch).toBe('function');
      expect(filter.catch.length).toBe(2); // exception and host parameters
    });

    it('should work with NestJS ArgumentsHost', () => {
      const mongoError = new MongoError('Test');
      (mongoError as any).code = 11000;

      expect(() => {
        filter.catch(mongoError, mockArgumentsHost);
      }).not.toThrow();

      expect(mockArgumentsHost.switchToHttp).toHaveBeenCalled();
    });

    it('should properly chain response methods', () => {
      const mongoError = new MongoError('Test');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(mockResponse.status().json).toBe(mockResponse.json);
    });
  });

  describe('Type Safety and Validation', () => {
    it('should maintain type safety for response structure', () => {
      const mongoError = new MongoError('Test');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];

      expect(typeof callArg.success).toBe('boolean');
      expect(typeof callArg.error).toBe('string');
      expect(typeof callArg.message).toBe('string');
      expect(typeof callArg.details).toBe('string');
      expect(typeof callArg.timestamp).toBe('string');
      expect(typeof callArg.path).toBe('string');
      expect(typeof callArg.method).toBe('string');
      expect(typeof callArg.requestId).toBe('string');
    });

    it('should ensure status is always a number', () => {
      const testCases = [
        { code: 11000, expectedStatus: 409 },
        { code: 121, expectedStatus: 400 },
        { code: 999, expectedStatus: 400 },
      ];

      testCases.forEach(({ code, expectedStatus }) => {
        const mongoError = new MongoError('Test');
        (mongoError as any).code = code;

        filter.catch(mongoError, mockArgumentsHost);

        const statusCall = (mockResponse.status as jest.Mock).mock.calls[
          (mockResponse.status as jest.Mock).mock.calls.length - 1
        ][0];
        expect(typeof statusCall).toBe('number');
        expect(statusCall).toBe(expectedStatus);
      });
    });

    it('should ensure timestamp is valid ISO string', () => {
      const mongoError = new MongoError('Test');
      (mongoError as any).code = 11000;

      filter.catch(mongoError, mockArgumentsHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      const timestamp = callArg.timestamp;

      expect(typeof timestamp).toBe('string');
      expect(() => new Date(timestamp)).not.toThrow();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });
});
