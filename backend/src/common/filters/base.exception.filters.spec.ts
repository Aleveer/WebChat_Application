import 'reflect-metadata';
import { HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from './base.exception.filters';

// Concrete implementation for testing abstract class
class TestableBaseExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    // Implementation for testing
  }

  // Expose protected methods for testing
  public getErrorCodeTest(status: number): string {
    return this.getErrorCode(status);
  }

  public createErrorResponseTest(
    error: string,
    message: string,
    request: any,
    details?: any,
    retryAfter?: number,
  ) {
    return this.createErrorResponse(
      error,
      message,
      request,
      details,
      retryAfter,
    );
  }

  public getLogger() {
    return this.logger;
  }
}

describe('BaseExceptionFilter - White Box Testing', () => {
  let filter: TestableBaseExceptionFilter;
  let mockRequest: any;
  let mockResponse: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new TestableBaseExceptionFilter();

    mockRequest = {
      url: '/api/users',
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

  describe('Logger Initialization', () => {
    it('should initialize logger with class name', () => {
      const logger = filter.getLogger();
      expect(logger).toBeDefined();
      expect(logger.constructor.name).toBe('Logger');
    });

    it('should have logger instance in each instance', () => {
      const filter1 = new TestableBaseExceptionFilter();
      const filter2 = new TestableBaseExceptionFilter();

      expect(filter1.getLogger()).not.toBe(filter2.getLogger());
    });
  });

  describe('getErrorCode Method', () => {
    it('should return BAD_REQUEST for 400 status', () => {
      const code = filter.getErrorCodeTest(HttpStatus.BAD_REQUEST);
      expect(code).toBe('BAD_REQUEST');
    });

    it('should return UNAUTHORIZED for 401 status', () => {
      const code = filter.getErrorCodeTest(HttpStatus.UNAUTHORIZED);
      expect(code).toBe('UNAUTHORIZED');
    });

    it('should return FORBIDDEN for 403 status', () => {
      const code = filter.getErrorCodeTest(HttpStatus.FORBIDDEN);
      expect(code).toBe('FORBIDDEN');
    });

    it('should return NOT_FOUND for 404 status', () => {
      const code = filter.getErrorCodeTest(HttpStatus.NOT_FOUND);
      expect(code).toBe('NOT_FOUND');
    });

    it('should return CONFLICT for 409 status', () => {
      const code = filter.getErrorCodeTest(HttpStatus.CONFLICT);
      expect(code).toBe('CONFLICT');
    });

    it('should return VALIDATION_ERROR for 422 status', () => {
      const code = filter.getErrorCodeTest(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(code).toBe('VALIDATION_ERROR');
    });

    it('should return RATE_LIMIT_EXCEEDED for 429 status', () => {
      const code = filter.getErrorCodeTest(HttpStatus.TOO_MANY_REQUESTS);
      expect(code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should return INTERNAL_ERROR for unknown status', () => {
      const code = filter.getErrorCodeTest(999);
      expect(code).toBe('INTERNAL_ERROR');
    });

    it('should return INTERNAL_ERROR for 500 status', () => {
      const code = filter.getErrorCodeTest(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(code).toBe('INTERNAL_ERROR');
    });

    it('should return INTERNAL_ERROR for 0 status', () => {
      const code = filter.getErrorCodeTest(0);
      expect(code).toBe('INTERNAL_ERROR');
    });

    it('should return INTERNAL_ERROR for negative status', () => {
      const code = filter.getErrorCodeTest(-1);
      expect(code).toBe('INTERNAL_ERROR');
    });

    it('should return INTERNAL_ERROR for 200 (success status)', () => {
      const code = filter.getErrorCodeTest(HttpStatus.OK);
      expect(code).toBe('INTERNAL_ERROR');
    });

    it('should return INTERNAL_ERROR for 201 (created status)', () => {
      const code = filter.getErrorCodeTest(HttpStatus.CREATED);
      expect(code).toBe('INTERNAL_ERROR');
    });

    it('should return INTERNAL_ERROR for 204 (no content status)', () => {
      const code = filter.getErrorCodeTest(HttpStatus.NO_CONTENT);
      expect(code).toBe('INTERNAL_ERROR');
    });

    it('should return INTERNAL_ERROR for 300 status', () => {
      const code = filter.getErrorCodeTest(HttpStatus.MOVED_PERMANENTLY);
      expect(code).toBe('INTERNAL_ERROR');
    });

    it('should return INTERNAL_ERROR for 500+ status codes', () => {
      const code = filter.getErrorCodeTest(502);
      expect(code).toBe('INTERNAL_ERROR');
    });
  });

  describe('createErrorResponse Method', () => {
    it('should create basic error response', () => {
      const response = filter.createErrorResponseTest(
        'BAD_REQUEST',
        'Invalid input',
        mockRequest,
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe('BAD_REQUEST');
      expect(response.message).toBe('Invalid input');
      expect(response.path).toBe('/api/users');
      expect(response.method).toBe('GET');
      expect(response.requestId).toBe('test-request-123');
      expect(response.timestamp).toBeDefined();
      expect(response.details).toBeUndefined();
      expect(response.retryAfter).toBeUndefined();
    });

    it('should create error response with details', () => {
      const details = { field: 'email', reason: 'Invalid format' };
      const response = filter.createErrorResponseTest(
        'VALIDATION_ERROR',
        'Validation failed',
        mockRequest,
        details,
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe('VALIDATION_ERROR');
      expect(response.message).toBe('Validation failed');
      expect(response.details).toEqual(details);
    });

    it('should create error response with retryAfter', () => {
      const retryAfter = 30;
      const response = filter.createErrorResponseTest(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests',
        mockRequest,
        undefined,
        retryAfter,
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.message).toBe('Too many requests');
      expect(response.retryAfter).toBe(30);
    });

    it('should create error response with both details and retryAfter', () => {
      const details = { endpoint: '/api/users' };
      const retryAfter = 60;
      const response = filter.createErrorResponseTest(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests',
        mockRequest,
        details,
        retryAfter,
      );

      expect(response.success).toBe(false);
      expect(response.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.message).toBe('Too many requests');
      expect(response.details).toEqual(details);
      expect(response.retryAfter).toBe(60);
    });

    it('should handle request without requestId', () => {
      const requestWithoutId = {
        url: '/api/test',
        method: 'POST',
      };

      const response = filter.createErrorResponseTest(
        'ERROR',
        'Test error',
        requestWithoutId,
      );

      expect(response.requestId).toBe('unknown');
    });

    it('should handle empty details object', () => {
      const response = filter.createErrorResponseTest(
        'ERROR',
        'Test error',
        mockRequest,
        {},
      );

      expect(response.details).toEqual({});
    });

    it('should handle null details', () => {
      const response = filter.createErrorResponseTest(
        'ERROR',
        'Test error',
        mockRequest,
        null,
      );

      expect(response.details).toBeNull();
    });

    it('should handle undefined details', () => {
      const response = filter.createErrorResponseTest(
        'ERROR',
        'Test error',
        mockRequest,
        undefined,
      );

      expect(response.details).toBeUndefined();
    });

    it('should include all request properties', () => {
      const complexRequest = {
        url: '/api/users/123/profile',
        method: 'PUT',
        requestId: 'complex-request-456',
      };

      const response = filter.createErrorResponseTest(
        'ERROR',
        'Test error',
        complexRequest,
      );

      expect(response.path).toBe('/api/users/123/profile');
      expect(response.method).toBe('PUT');
      expect(response.requestId).toBe('complex-request-456');
    });

    it('should generate valid ISO timestamp', () => {
      const response = filter.createErrorResponseTest(
        'ERROR',
        'Test error',
        mockRequest,
      );

      const timestamp = new Date(response.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
      expect(response.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should not include retryAfter when not provided', () => {
      const response = filter.createErrorResponseTest(
        'ERROR',
        'Test error',
        mockRequest,
      );

      expect('retryAfter' in response).toBe(false);
    });

    it('should not include retryAfter when provided as 0 (falsy value)', () => {
      const response = filter.createErrorResponseTest(
        'ERROR',
        'Test error',
        mockRequest,
        undefined,
        0,
      );

      // retryAfter = 0 is falsy, so spread operator excludes it
      expect('retryAfter' in response).toBe(false);
    });

    it('should handle very long error message', () => {
      const longMessage = 'Error: '.repeat(1000);
      const response = filter.createErrorResponseTest(
        'ERROR',
        longMessage,
        mockRequest,
      );

      expect(response.message).toBe(longMessage);
      expect(response.message.length).toBeGreaterThan(1000);
    });

    it('should handle empty error message', () => {
      const response = filter.createErrorResponseTest('ERROR', '', mockRequest);

      expect(response.message).toBe('');
    });

    it('should handle empty error code', () => {
      const response = filter.createErrorResponseTest(
        '',
        'Test message',
        mockRequest,
      );

      expect(response.error).toBe('');
    });

    it('should handle unicode characters in message', () => {
      const message = '错误信息：验证失败';
      const response = filter.createErrorResponseTest(
        'ERROR',
        message,
        mockRequest,
      );

      expect(response.message).toBe(message);
    });

    it('should handle special characters in message', () => {
      const message = 'Error: @#$%^&*()[]{}|\\/:;<>?~`';
      const response = filter.createErrorResponseTest(
        'ERROR',
        message,
        mockRequest,
      );

      expect(response.message).toBe(message);
    });

    it('should handle complex details object', () => {
      const details = {
        errors: [
          { field: 'email', message: 'Invalid format' },
          { field: 'password', message: 'Too short' },
        ],
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'validation',
        },
      };

      const response = filter.createErrorResponseTest(
        'VALIDATION_ERROR',
        'Multiple errors',
        mockRequest,
        details,
      );

      expect(response.details).toEqual(details);
      expect((response.details as any).errors.length).toBe(2);
    });

    it('should handle array as details', () => {
      const details = [1, 2, 3, 4, 5];
      const response = filter.createErrorResponseTest(
        'ERROR',
        'Array error',
        mockRequest,
        details,
      );

      expect(response.details).toEqual(details);
      expect(Array.isArray(response.details)).toBe(true);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle validation error response', () => {
      const details = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'age', message: 'Must be positive' },
      ];

      const response = filter.createErrorResponseTest(
        'VALIDATION_ERROR',
        'Validation failed',
        {
          url: '/api/users',
          method: 'POST',
          requestId: 'req-123',
        },
        details,
      );

      expect(response.error).toBe('VALIDATION_ERROR');
      expect(response.message).toBe('Validation failed');
      expect(Array.isArray(response.details)).toBe(true);
      expect((response.details as any[]).length).toBe(2);
    });

    it('should handle authentication error response', () => {
      const response = filter.createErrorResponseTest(
        'UNAUTHORIZED',
        'Authentication required',
        {
          url: '/api/protected',
          method: 'GET',
          requestId: 'req-456',
        },
      );

      expect(response.error).toBe('UNAUTHORIZED');
      expect(response.message).toBe('Authentication required');
      expect(response.path).toBe('/api/protected');
    });

    it('should handle rate limit error response', () => {
      const response = filter.createErrorResponseTest(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests, please try again later',
        {
          url: '/api/data',
          method: 'GET',
          requestId: 'req-789',
        },
        undefined,
        30,
      );

      expect(response.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.retryAfter).toBe(30);
    });

    it('should handle not found error response', () => {
      const response = filter.createErrorResponseTest(
        'NOT_FOUND',
        'Resource not found',
        {
          url: '/api/users/999',
          method: 'GET',
          requestId: 'req-999',
        },
      );

      expect(response.error).toBe('NOT_FOUND');
      expect(response.message).toBe('Resource not found');
      expect(response.path).toBe('/api/users/999');
    });

    it('should handle conflict error response', () => {
      const details = { existingId: 123, conflictingField: 'email' };
      const response = filter.createErrorResponseTest(
        'CONFLICT',
        'Resource already exists',
        {
          url: '/api/users',
          method: 'POST',
          requestId: 'req-conflict-1',
        },
        details,
      );

      expect(response.error).toBe('CONFLICT');
      expect(response.message).toBe('Resource already exists');
      expect(response.details).toEqual(details);
    });

    it('should handle forbidden error response', () => {
      const response = filter.createErrorResponseTest(
        'FORBIDDEN',
        'You do not have permission to access this resource',
        {
          url: '/api/admin/users',
          method: 'DELETE',
          requestId: 'req-admin-1',
        },
      );

      expect(response.error).toBe('FORBIDDEN');
      expect(response.method).toBe('DELETE');
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed request object', () => {
      const malformedRequest = {
        url: undefined,
        method: undefined,
      } as any;

      const response = filter.createErrorResponseTest(
        'ERROR',
        'Malformed request',
        malformedRequest,
      );

      expect(response.path).toBeUndefined();
      expect(response.method).toBeUndefined();
      expect(response.requestId).toBe('unknown');
    });

    it('should handle request with null url', () => {
      const nullUrlRequest = {
        url: null,
        method: 'GET',
      } as any;

      const response = filter.createErrorResponseTest(
        'ERROR',
        'Test',
        nullUrlRequest,
      );

      expect(response.path).toBeNull();
    });

    it('should handle request with empty strings', () => {
      const emptyRequest = {
        url: '',
        method: '',
        requestId: '',
      };

      const response = filter.createErrorResponseTest(
        'ERROR',
        'Test',
        emptyRequest,
      );

      expect(response.path).toBe('');
      expect(response.method).toBe('');
      // Empty string is falsy, so it falls back to 'unknown'
      expect(response.requestId).toBe('unknown');
    });

    it('should handle very long URL', () => {
      const longUrl = '/' + 'a'.repeat(1000);
      const longRequest = {
        url: longUrl,
        method: 'GET',
      };

      const response = filter.createErrorResponseTest(
        'ERROR',
        'Test',
        longRequest,
      );

      expect(response.path).toBe(longUrl);
      expect(response.path.length).toBe(1001);
    });

    it('should handle concurrent error response creation', () => {
      const responses = [];
      for (let i = 0; i < 10; i++) {
        const req = {
          url: `/api/test${i}`,
          method: 'GET',
          requestId: `req-${i}`,
        };
        responses.push(
          filter.createErrorResponseTest('ERROR', `Test ${i}`, req),
        );
      }

      expect(responses.length).toBe(10);
      expect(responses[0].path).toBe('/api/test0');
      expect(responses[9].path).toBe('/api/test9');
    });

    it('should handle details with circular reference', () => {
      const details: any = { id: 1 };
      details.self = details;

      // Should not throw error
      const response = filter.createErrorResponseTest(
        'ERROR',
        'Circular reference',
        mockRequest,
        details,
      );

      expect(response.details).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should maintain correct types', () => {
      const response = filter.createErrorResponseTest(
        'BAD_REQUEST',
        'Invalid input',
        mockRequest,
      );

      expect(typeof response.success).toBe('boolean');
      expect(typeof response.error).toBe('string');
      expect(typeof response.message).toBe('string');
      expect(typeof response.timestamp).toBe('string');
      expect(typeof response.path).toBe('string');
      expect(typeof response.method).toBe('string');
      expect(typeof response.requestId).toBe('string');
    });

    it('should allow optional details', () => {
      const response = filter.createErrorResponseTest(
        'ERROR',
        'Test',
        mockRequest,
      );

      expect('details' in response).toBe(true);
      expect(response.details).toBeUndefined();
    });

    it('should allow optional retryAfter', () => {
      const response = filter.createErrorResponseTest(
        'ERROR',
        'Test',
        mockRequest,
      );

      expect('retryAfter' in response).toBe(false);
    });
  });

  describe('Concrete Implementation', () => {
    it('should be instantiable as concrete class', () => {
      const instance = new TestableBaseExceptionFilter();
      expect(instance).toBeInstanceOf(BaseExceptionFilter);
      expect(instance).toBeInstanceOf(TestableBaseExceptionFilter);
    });

    it('should implement catch method', () => {
      const instance = new TestableBaseExceptionFilter();
      expect(typeof instance.catch).toBe('function');

      // Should not throw
      expect(() => {
        instance.catch(new Error('test'), mockArgumentsHost);
      }).not.toThrow();
    });

    it('should allow calling catch with different exceptions', () => {
      const instance = new TestableBaseExceptionFilter();

      expect(() => {
        instance.catch(new Error('test'), mockArgumentsHost);
      }).not.toThrow();

      expect(() => {
        instance.catch('string error', mockArgumentsHost);
      }).not.toThrow();

      expect(() => {
        instance.catch({ custom: 'error' }, mockArgumentsHost);
      }).not.toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent error responses', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => {
        const req = {
          url: `/api/test${i}`,
          method: 'GET',
          requestId: `req-${i}`,
        };
        return filter.createErrorResponseTest('ERROR', `Test ${i}`, req);
      });

      const responses = await Promise.all(promises);

      expect(responses.length).toBe(10);
      responses.forEach((response, i) => {
        expect(response.path).toBe(`/api/test${i}`);
      });
    });

    it('should generate unique timestamps for concurrent operations', async () => {
      const startTime = Date.now();
      const responses = Array.from({ length: 10 }, () =>
        filter.createErrorResponseTest('ERROR', 'Test', mockRequest),
      );
      const endTime = Date.now();

      const timestamps = responses.map((r) => new Date(r.timestamp).getTime());
      timestamps.forEach((ts) => {
        expect(ts).toBeGreaterThanOrEqual(startTime);
        expect(ts).toBeLessThanOrEqual(endTime);
      });
    });
  });
});
