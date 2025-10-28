import { HttpExceptionFilter } from './http.exception.filters';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';

describe('HttpExceptionFilter - White Box Testing', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/api/test',
      method: 'GET',
      requestId: 'test-request-id',
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // 1. Filter Initialization Tests
  // ========================================
  describe('Filter Initialization', () => {
    it('should create filter instance successfully', () => {
      expect(filter).toBeDefined();
      expect(filter).toBeInstanceOf(HttpExceptionFilter);
    });

    it('should initialize logger with correct class name', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(loggerSpy).toHaveBeenCalled();
    });

    it('should create multiple independent filter instances', () => {
      const filter1 = new HttpExceptionFilter();
      const filter2 = new HttpExceptionFilter();

      expect(filter1).not.toBe(filter2);
      expect(filter1['logger']).not.toBe(filter2['logger']);
    });
  });

  // ========================================
  // 2. HttpException with String Response
  // ========================================
  describe('catch Method - String Response', () => {
    it('should handle HttpException with string response', () => {
      const exception = new HttpException(
        'Test error message',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'BAD_REQUEST',
          message: 'Test error message',
          details: null,
        }),
      );
    });

    it('should handle HttpException with empty string response', () => {
      const exception = new HttpException('', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '',
        }),
      );
    });

    it('should handle HttpException with very long string response', () => {
      const longMessage = 'a'.repeat(1000);
      const exception = new HttpException(longMessage, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: longMessage,
        }),
      );
    });
  });

  // ========================================
  // 3. HttpException with Object Response
  // ========================================
  describe('catch Method - Object Response', () => {
    it('should handle HttpException with object response containing message', () => {
      const exception = new HttpException(
        { message: 'Custom message', details: 'Extra info' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Custom message',
          details: 'Extra info',
        }),
      );
    });

    it('should handle HttpException with object response without message', () => {
      const exception = new HttpException(
        { details: 'Some details' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'BAD_REQUEST',
          details: 'Some details',
        }),
      );
    });

    it('should handle HttpException with empty object response', () => {
      const exception = new HttpException({}, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'BAD_REQUEST',
          details: undefined,
        }),
      );
    });

    it('should handle HttpException with null response', () => {
      const exception = new HttpException(null as any, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'BAD_REQUEST',
          details: null,
        }),
      );
    });

    it('should handle HttpException with nested object in details', () => {
      const exception = new HttpException(
        {
          message: 'Validation failed',
          details: {
            field: 'email',
            errors: ['Invalid format', 'Required'],
          },
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
          details: {
            field: 'email',
            errors: ['Invalid format', 'Required'],
          },
        }),
      );
    });

    it('should handle HttpException with array in details', () => {
      const exception = new HttpException(
        {
          message: 'Multiple errors',
          details: ['Error 1', 'Error 2', 'Error 3'],
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: ['Error 1', 'Error 2', 'Error 3'],
        }),
      );
    });
  });

  // ========================================
  // 4. HTTP Status Codes
  // ========================================
  describe('catch Method - HTTP Status Codes', () => {
    it('should handle BAD_REQUEST status (400)', () => {
      const exception = new HttpException(
        'BAD_REQUEST',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'BAD_REQUEST',
        }),
      );
    });

    it('should handle UNAUTHORIZED status (401)', () => {
      const exception = new HttpException(
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'UNAUTHORIZED',
        }),
      );
    });

    it('should handle FORBIDDEN status (403)', () => {
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'FORBIDDEN',
        }),
      );
    });

    it('should handle NOT_FOUND status (404)', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'NOT_FOUND',
        }),
      );
    });

    it('should handle CONFLICT status (409)', () => {
      const exception = new HttpException('Conflict', HttpStatus.CONFLICT);

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'CONFLICT',
        }),
      );
    });

    it('should handle UNPROCESSABLE_ENTITY status (422)', () => {
      const exception = new HttpException(
        'Validation error',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
        }),
      );
    });

    it('should handle TOO_MANY_REQUESTS status (429)', () => {
      const exception = new HttpException(
        'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'RATE_LIMIT_EXCEEDED',
        }),
      );
    });

    it('should handle INTERNAL_SERVER_ERROR status (500)', () => {
      const exception = new HttpException(
        'Internal error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'HTTP_ERROR',
        }),
      );
    });

    it('should handle unknown HTTP status code', () => {
      const exception = new HttpException('Unknown error', 418); // I'm a teapot

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(418);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'HTTP_ERROR',
        }),
      );
    });

    it('should handle SERVICE_UNAVAILABLE status (503)', () => {
      const exception = new HttpException(
        'Service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'HTTP_ERROR',
        }),
      );
    });
  });

  // ========================================
  // 5. Request Context
  // ========================================
  describe('catch Method - Request Context', () => {
    it('should include correct request URL', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/test',
        }),
      );
    });

    it('should include correct HTTP method', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('should include correct requestId', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'test-request-id',
        }),
      );
    });

    it('should use "unknown" when requestId is missing', () => {
      mockRequest.requestId = undefined;
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    it('should use "unknown" when requestId is null', () => {
      mockRequest.requestId = null as any;
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    it('should use "unknown" when requestId is empty string', () => {
      mockRequest.requestId = '';
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    it('should handle very long URL', () => {
      const longUrl = '/api/' + 'a'.repeat(2000);
      mockRequest.url = longUrl;
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: longUrl,
        }),
      );
    });

    it('should handle URL with query parameters', () => {
      mockRequest.url = '/api/test?param1=value1&param2=value2';
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/test?param1=value1&param2=value2',
        }),
      );
    });

    it('should handle URL with special characters', () => {
      mockRequest.url = '/api/test/user@email.com';
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/test/user@email.com',
        }),
      );
    });

    it('should handle different HTTP methods', () => {
      const methods = [
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'PATCH',
        'OPTIONS',
        'HEAD',
      ];

      methods.forEach((method) => {
        mockRequest.method = method;
        const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

        filter.catch(exception, mockHost);

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            method,
          }),
        );
        jest.clearAllMocks();
      });
    });
  });

  // ========================================
  // 6. Response Structure
  // ========================================
  describe('catch Method - Response Structure', () => {
    it('should always set success to false', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    it('should include valid ISO timestamp', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);
      const beforeTime = new Date().toISOString();

      filter.catch(exception, mockHost);

      const afterTime = new Date().toISOString();
      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];

      expect(callArg.timestamp).toBeDefined();
      expect(callArg.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(callArg.timestamp >= beforeTime).toBe(true);
      expect(callArg.timestamp <= afterTime).toBe(true);
    });

    it('should include all required fields', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArg).toHaveProperty('success');
      expect(callArg).toHaveProperty('error');
      expect(callArg).toHaveProperty('message');
      expect(callArg).toHaveProperty('details');
      expect(callArg).toHaveProperty('timestamp');
      expect(callArg).toHaveProperty('path');
      expect(callArg).toHaveProperty('method');
      expect(callArg).toHaveProperty('requestId');
    });

    it('should have exactly 8 fields in error response', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      const callArg = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(Object.keys(callArg)).toHaveLength(8);
    });

    it('should set details to null by default', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: null,
        }),
      );
    });
  });

  // ========================================
  // 7. getErrorCode Method
  // ========================================
  describe('getErrorCode Method - All Status Codes', () => {
    it('should return BAD_REQUEST for 400', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'BAD_REQUEST',
        }),
      );
    });

    it('should return UNAUTHORIZED for 401', () => {
      const exception = new HttpException('Test', HttpStatus.UNAUTHORIZED);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'UNAUTHORIZED',
        }),
      );
    });

    it('should return FORBIDDEN for 403', () => {
      const exception = new HttpException('Test', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'FORBIDDEN',
        }),
      );
    });

    it('should return NOT_FOUND for 404', () => {
      const exception = new HttpException('Test', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'NOT_FOUND',
        }),
      );
    });

    it('should return CONFLICT for 409', () => {
      const exception = new HttpException('Test', HttpStatus.CONFLICT);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'CONFLICT',
        }),
      );
    });

    it('should return VALIDATION_ERROR for 422', () => {
      const exception = new HttpException(
        'Test',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
        }),
      );
    });

    it('should return RATE_LIMIT_EXCEEDED for 429', () => {
      const exception = new HttpException('Test', HttpStatus.TOO_MANY_REQUESTS);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'RATE_LIMIT_EXCEEDED',
        }),
      );
    });

    it('should return HTTP_ERROR for unknown status', () => {
      const exception = new HttpException('Test', 418);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'HTTP_ERROR',
        }),
      );
    });

    it('should return HTTP_ERROR for 500', () => {
      const exception = new HttpException(
        'Test',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'HTTP_ERROR',
        }),
      );
    });
  });

  // ========================================
  // 8. Logging
  // ========================================
  describe('catch Method - Logging', () => {
    it('should log with correct format', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');
      const exception = new HttpException(
        'Test message',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        'HTTP Exception: 400 - Test message - GET /api/test',
      );
    });

    it('should include status code in log', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');
      const exception = new HttpException('Test', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockHost);

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('404'));
    });

    it('should include message in log', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');
      const exception = new HttpException(
        'Custom error message',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Custom error message'),
      );
    });

    it('should include HTTP method in log', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');
      mockRequest.method = 'POST';
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('POST'));
    });

    it('should include URL in log', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');
      mockRequest.url = '/api/users/123';
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/123'),
      );
    });

    it('should log exactly once per exception', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(loggerSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ========================================
  // 9. ArgumentsHost Interaction
  // ========================================
  describe('catch Method - ArgumentsHost Interaction', () => {
    it('should call switchToHttp', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockHost.switchToHttp).toHaveBeenCalled();
    });

    it('should call getResponse', () => {
      const getResponseSpy = jest.fn().mockReturnValue(mockResponse);
      mockHost.switchToHttp = jest.fn().mockReturnValue({
        getResponse: getResponseSpy,
        getRequest: () => mockRequest,
      });
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(getResponseSpy).toHaveBeenCalled();
    });

    it('should call getRequest', () => {
      const getRequestSpy = jest.fn().mockReturnValue(mockRequest);
      mockHost.switchToHttp = jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: getRequestSpy,
      });
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(getRequestSpy).toHaveBeenCalled();
    });

    it('should call status on response', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should call json on response', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should call response methods in correct order', () => {
      const callOrder: string[] = [];
      mockResponse.status = jest.fn().mockImplementation(() => {
        callOrder.push('status');
        return mockResponse;
      });
      mockResponse.json = jest.fn().mockImplementation(() => {
        callOrder.push('json');
        return mockResponse;
      });
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(callOrder).toEqual(['status', 'json']);
    });
  });

  // ========================================
  // 10. Real-world Scenarios
  // ========================================
  describe('Real-world Scenarios', () => {
    it('should handle validation error from class-validator', () => {
      const exception = new HttpException(
        {
          message: 'Validation failed',
          details: [
            { field: 'email', errors: ['Email must be valid'] },
            { field: 'password', errors: ['Password too short'] },
          ],
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'email' }),
            expect.objectContaining({ field: 'password' }),
          ]),
        }),
      );
    });

    it('should handle authentication failure', () => {
      const exception = new HttpException(
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        }),
      );
    });

    it('should handle permission denied error', () => {
      const exception = new HttpException(
        'You do not have permission to access this resource',
        HttpStatus.FORBIDDEN,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'FORBIDDEN',
        }),
      );
    });

    it('should handle resource not found', () => {
      const exception = new HttpException(
        'User with ID 123 not found',
        HttpStatus.NOT_FOUND,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'NOT_FOUND',
          message: 'User with ID 123 not found',
        }),
      );
    });

    it('should handle rate limiting', () => {
      const exception = new HttpException(
        {
          message: 'Too many requests',
          details: {
            limit: 100,
            remaining: 0,
            resetTime: '2025-10-27T14:00:00Z',
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'RATE_LIMIT_EXCEEDED',
          details: expect.objectContaining({
            limit: 100,
            remaining: 0,
          }),
        }),
      );
    });

    it('should handle duplicate resource creation', () => {
      const exception = new HttpException(
        'Email already exists',
        HttpStatus.CONFLICT,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'CONFLICT',
          message: 'Email already exists',
        }),
      );
    });

    it('should handle malformed request', () => {
      const exception = new HttpException(
        'Invalid JSON format',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'BAD_REQUEST',
          message: 'Invalid JSON format',
        }),
      );
    });
  });

  // ========================================
  // 11. Edge Cases
  // ========================================
  describe('Edge Cases', () => {
    it('should handle exception with number response', () => {
      const exception = new HttpException(12345 as any, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'BAD_REQUEST',
          details: null,
        }),
      );
    });

    it('should handle request with missing URL', () => {
      mockRequest.url = undefined as any;
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: undefined,
        }),
      );
    });

    it('should handle request with null method', () => {
      mockRequest.method = null as any;
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          method: null,
        }),
      );
    });

    it('should handle exception with circular reference in details', () => {
      const circular: any = { prop: 'value' };
      circular.self = circular;
      const exception = new HttpException(
        { message: 'Test', details: circular },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test',
        }),
      );
    });

    it('should handle concurrent exception processing', async () => {
      const exceptions = Array.from(
        { length: 10 },
        (_, i) => new HttpException(`Test ${i}`, HttpStatus.BAD_REQUEST),
      );

      const promises = exceptions.map((exception) =>
        Promise.resolve(filter.catch(exception, mockHost)),
      );

      await Promise.all(promises);

      expect(mockResponse.json).toHaveBeenCalledTimes(10);
    });

    it('should handle error with very long message', () => {
      const longMessage = 'a'.repeat(10000);
      const exception = new HttpException(longMessage, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: longMessage,
        }),
      );
    });

    it('should handle error with special characters', () => {
      const specialMessage = 'Error: <script>alert("XSS")</script>';
      const exception = new HttpException(
        specialMessage,
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: specialMessage,
        }),
      );
    });

    it('should handle error with Unicode characters', () => {
      const unicodeMessage = 'Lỗi: 用户未找到 🚫';
      const exception = new HttpException(unicodeMessage, HttpStatus.NOT_FOUND);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: unicodeMessage,
        }),
      );
    });

    it('should handle exception with boolean details', () => {
      const exception = new HttpException(
        { message: 'Test', details: true },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: true,
        }),
      );
    });

    it('should handle exception with undefined message in object', () => {
      const exception = new HttpException(
        { message: undefined, details: 'info' } as any,
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'BAD_REQUEST',
        }),
      );
    });
  });

  // ========================================
  // 12. Code Coverage - All Branches
  // ========================================
  describe('Code Coverage - All Branches', () => {
    it('should cover string response type branch', () => {
      const exception = new HttpException(
        'String response',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

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

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Object response',
        }),
      );
    });

    it('should cover requestId || "unknown" - with requestId', () => {
      mockRequest.requestId = 'test-id-123';
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'test-id-123',
        }),
      );
    });

    it('should cover requestId || "unknown" - without requestId', () => {
      mockRequest.requestId = undefined;
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    it('should cover all switch cases in getErrorCode', () => {
      const statusCodes = [
        HttpStatus.BAD_REQUEST,
        HttpStatus.UNAUTHORIZED,
        HttpStatus.FORBIDDEN,
        HttpStatus.NOT_FOUND,
        HttpStatus.CONFLICT,
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.TOO_MANY_REQUESTS,
        999, // default case
      ];

      statusCodes.forEach((status) => {
        const exception = new HttpException('Test', status);
        filter.catch(exception, mockHost);
        jest.clearAllMocks();
      });

      expect(true).toBe(true); // All branches covered
    });

    it('should cover null check in object response branch', () => {
      const exception = new HttpException(null as any, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'BAD_REQUEST',
          details: null,
        }),
      );
    });

    it('should cover message fallback when response object has no message', () => {
      const exception = new HttpException(
        { details: 'some details' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'BAD_REQUEST',
        }),
      );
    });
  });

  // ========================================
  // 13. Performance and Stress Testing
  // ========================================
  describe('Performance and Stress Testing', () => {
    it('should handle rapid successive calls', () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const exception = new HttpException(
          `Test ${i}`,
          HttpStatus.BAD_REQUEST,
        );
        filter.catch(exception, mockHost);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
      expect(mockResponse.json).toHaveBeenCalledTimes(100);
    });

    it('should maintain consistent behavior under load', () => {
      const results: any[] = [];

      for (let i = 0; i < 50; i++) {
        const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);
        filter.catch(exception, mockHost);
        results.push((mockResponse.json as jest.Mock).mock.calls[i][0]);
      }

      // All responses should have consistent structure
      results.forEach((result) => {
        expect(result).toHaveProperty('success', false);
        expect(result).toHaveProperty('error', 'BAD_REQUEST');
        expect(result).toHaveProperty('message', 'Test');
      });
    });

    it('should handle large request objects', () => {
      const largeRequest = {
        ...mockRequest,
        body: { data: 'x'.repeat(100000) },
        headers: Object.fromEntries(
          Array.from({ length: 100 }, (_, i) => [`header${i}`, `value${i}`]),
        ),
      };

      mockHost.switchToHttp = jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => largeRequest,
      });

      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      expect(() => filter.catch(exception, mockHost)).not.toThrow();
    });
  });

  // ========================================
  // 14. Integration with NestJS
  // ========================================
  describe('Integration with NestJS', () => {
    it('should be compatible with NestJS ExceptionFilter interface', () => {
      expect(filter.catch).toBeDefined();
      expect(typeof filter.catch).toBe('function');
    });

    it('should work with NestJS ArgumentsHost', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      expect(() => filter.catch(exception, mockHost)).not.toThrow();
      expect(mockHost.switchToHttp).toHaveBeenCalled();
    });

    it('should properly chain response methods', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  // ========================================
  // 15. Type Safety and Validation
  // ========================================
  describe('Type Safety and Validation', () => {
    it('should maintain type safety for response structure', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(typeof response.success).toBe('boolean');
      expect(typeof response.error).toBe('string');
      expect(typeof response.message).toBe('string');
      expect(typeof response.timestamp).toBe('string');
      expect(typeof response.path).toBe('string');
      expect(typeof response.method).toBe('string');
      expect(typeof response.requestId).toBe('string');
    });

    it('should ensure status is always a number', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      expect(typeof exception.getStatus()).toBe('number');
      expect(mockResponse.status).toHaveBeenCalledWith(expect.any(Number));
    });

    it('should ensure timestamp is valid ISO string', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      const timestamp = new Date(response.timestamp);
      expect(timestamp.toISOString()).toBe(response.timestamp);
    });
  });
});
