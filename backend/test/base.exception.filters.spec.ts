import 'reflect-metadata';
import { BaseExceptionFilter } from '../src/common/filters/base.exception.filters';
import { ArgumentsHost, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode, ERROR_CODES } from '../src/common/constants/app.constants';
import { ErrorResponseFormatter } from '../src/common/utils/error-response.formatter';

// Concrete implementation for testing abstract class
class TestExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    // Implementation for testing
  }

  // Expose protected methods for testing
  public testGetErrorCode(status: number): string {
    return this.getErrorCode(status);
  }

  public testCreateErrorResponse(
    error: ErrorCode,
    message: string,
    request: Request,
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

describe('BaseExceptionFilter - White Box Testing (Input-Output)', () => {
  let filter: TestExceptionFilter;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockArgumentsHost: Partial<ArgumentsHost>;

  beforeEach(() => {
    filter = new TestExceptionFilter();

    mockRequest = {
      url: '/api/test',
      method: 'GET',
      requestId: 'test-request-id-123',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    };
  });

  describe('Class Instantiation', () => {
    /**
     * Test Case 1: Kiểm tra instance creation
     * Input: New TestExceptionFilter()
     * Expected Output: Instance created successfully
     * Path Coverage: Constructor
     */
    it('TC001: should create instance of BaseExceptionFilter', () => {
      expect(filter).toBeInstanceOf(BaseExceptionFilter);
      expect(filter).toBeInstanceOf(TestExceptionFilter);
    });

    /**
     * Test Case 2: Kiểm tra logger initialization
     * Input: New instance
     * Expected Output: Logger initialized with class name
     * Path Coverage: Logger initialization
     */
    it('TC002: should initialize logger with constructor name', () => {
      const logger = filter.getLogger();

      expect(logger).toBeInstanceOf(Logger);
      expect(logger).toBeDefined();
    });

    /**
     * Test Case 3: Kiểm tra abstract class cannot be instantiated
     * Input: Try to instantiate BaseExceptionFilter
     * Expected Output: Should require concrete implementation
     * Path Coverage: Abstract class
     */
    it('TC003: should require concrete implementation', () => {
      // Abstract class requires implementation of catch method
      expect(filter.catch).toBeDefined();
      expect(typeof filter.catch).toBe('function');
    });
  });

  describe('getErrorCode Method', () => {
    /**
     * Test Case 4: Kiểm tra 400 Bad Request
     * Input: status = 400
     * Expected Output: BAD_REQUEST error code
     * Path Coverage: Valid HTTP status
     */
    it('TC004: should return BAD_REQUEST for status 400', () => {
      const result = filter.testGetErrorCode(400);

      expect(result).toBe(ERROR_CODES.BAD_REQUEST);
    });

    /**
     * Test Case 5: Kiểm tra 401 Unauthorized
     * Input: status = 401
     * Expected Output: UNAUTHORIZED error code
     * Path Coverage: 401 status
     */
    it('TC005: should return UNAUTHORIZED for status 401', () => {
      const result = filter.testGetErrorCode(401);

      expect(result).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    /**
     * Test Case 6: Kiểm tra 403 Forbidden
     * Input: status = 403
     * Expected Output: FORBIDDEN error code
     * Path Coverage: 403 status
     */
    it('TC006: should return FORBIDDEN for status 403', () => {
      const result = filter.testGetErrorCode(403);

      expect(result).toBe(ERROR_CODES.FORBIDDEN);
    });

    /**
     * Test Case 7: Kiểm tra 404 Not Found
     * Input: status = 404
     * Expected Output: NOT_FOUND error code
     * Path Coverage: 404 status
     */
    it('TC007: should return NOT_FOUND for status 404', () => {
      const result = filter.testGetErrorCode(404);

      expect(result).toBe(ERROR_CODES.NOT_FOUND);
    });

    /**
     * Test Case 8: Kiểm tra 409 Conflict
     * Input: status = 409
     * Expected Output: CONFLICT error code
     * Path Coverage: 409 status
     */
    it('TC008: should return CONFLICT for status 409', () => {
      const result = filter.testGetErrorCode(409);

      expect(result).toBe(ERROR_CODES.CONFLICT);
    });

    /**
     * Test Case 9: Kiểm tra 422 Unprocessable Entity
     * Input: status = 422
     * Expected Output: VALIDATION_ERROR error code
     * Path Coverage: 422 status
     */
    it('TC009: should return VALIDATION_ERROR for status 422', () => {
      const result = filter.testGetErrorCode(422);

      expect(result).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    /**
     * Test Case 10: Kiểm tra 429 Too Many Requests
     * Input: status = 429
     * Expected Output: RATE_LIMIT_EXCEEDED error code
     * Path Coverage: 429 status
     */
    it('TC010: should return RATE_LIMIT_EXCEEDED for status 429', () => {
      const result = filter.testGetErrorCode(429);

      expect(result).toBe(ERROR_CODES.RATE_LIMIT_EXCEEDED);
    });

    /**
     * Test Case 11: Kiểm tra 408 Request Timeout
     * Input: status = 408
     * Expected Output: REQUEST_TIMEOUT error code
     * Path Coverage: 408 status
     */
    it('TC011: should return REQUEST_TIMEOUT for status 408', () => {
      const result = filter.testGetErrorCode(408);

      expect(result).toBe(ERROR_CODES.REQUEST_TIMEOUT);
    });

    /**
     * Test Case 12: Kiểm tra 500 Internal Server Error
     * Input: status = 500
     * Expected Output: INTERNAL_ERROR error code
     * Path Coverage: 500 status
     */
    it('TC012: should return INTERNAL_ERROR for status 500', () => {
      const result = filter.testGetErrorCode(500);

      expect(result).toBe(ERROR_CODES.INTERNAL_ERROR);
    });

    /**
     * Test Case 13: Kiểm tra unknown status code
     * Input: status = 999
     * Expected Output: UNKNOWN_ERROR error code
     * Path Coverage: Unknown status
     */
    it('TC013: should return UNKNOWN_ERROR for unknown status', () => {
      const result = filter.testGetErrorCode(999);

      expect(result).toBe(ERROR_CODES.UNKNOWN_ERROR);
    });

    /**
     * Test Case 14: Kiểm tra 200 OK (success code)
     * Input: status = 200
     * Expected Output: UNKNOWN_ERROR (not in mapping)
     * Path Coverage: Success status
     */
    it('TC014: should return UNKNOWN_ERROR for success status 200', () => {
      const result = filter.testGetErrorCode(200);

      expect(result).toBe(ERROR_CODES.UNKNOWN_ERROR);
    });

    /**
     * Test Case 15: Kiểm tra negative status
     * Input: status = -1
     * Expected Output: UNKNOWN_ERROR
     * Path Coverage: Invalid status
     */
    it('TC015: should return UNKNOWN_ERROR for negative status', () => {
      const result = filter.testGetErrorCode(-1);

      expect(result).toBe(ERROR_CODES.UNKNOWN_ERROR);
    });

    /**
     * Test Case 16: Kiểm tra zero status
     * Input: status = 0
     * Expected Output: UNKNOWN_ERROR
     * Path Coverage: Zero status
     */
    it('TC016: should return UNKNOWN_ERROR for zero status', () => {
      const result = filter.testGetErrorCode(0);

      expect(result).toBe(ERROR_CODES.UNKNOWN_ERROR);
    });

    /**
     * Test Case 17: Kiểm tra all mapped status codes
     * Input: All valid HTTP status codes
     * Expected Output: Correct error codes
     * Path Coverage: All mappings
     */
    it('TC017: should map all standard HTTP status codes correctly', () => {
      const statusMappings = [
        { status: 400, code: ERROR_CODES.BAD_REQUEST },
        { status: 401, code: ERROR_CODES.UNAUTHORIZED },
        { status: 403, code: ERROR_CODES.FORBIDDEN },
        { status: 404, code: ERROR_CODES.NOT_FOUND },
        { status: 409, code: ERROR_CODES.CONFLICT },
        { status: 422, code: ERROR_CODES.VALIDATION_ERROR },
        { status: 429, code: ERROR_CODES.RATE_LIMIT_EXCEEDED },
        { status: 408, code: ERROR_CODES.REQUEST_TIMEOUT },
        { status: 500, code: ERROR_CODES.INTERNAL_ERROR },
      ];

      statusMappings.forEach(({ status, code }) => {
        expect(filter.testGetErrorCode(status)).toBe(code);
      });
    });
  });

  describe('createErrorResponse Method', () => {
    /**
     * Test Case 18: Kiểm tra basic error response
     * Input: error, message, request
     * Expected Output: Complete error response
     * Path Coverage: Basic response creation
     */
    it('TC018: should create basic error response', () => {
      const result = filter.testCreateErrorResponse(
        ERROR_CODES.BAD_REQUEST,
        'Invalid input',
        mockRequest as Request,
      );

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBe(ERROR_CODES.BAD_REQUEST);
      expect(result.message).toBe('Invalid input');
      expect(result.path).toBe('/api/test');
      expect(result.method).toBe('GET');
      expect(result.requestId).toBe('test-request-id-123');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
    });

    /**
     * Test Case 19: Kiểm tra error response with details
     * Input: error, message, request, details
     * Expected Output: Response with details
     * Path Coverage: With details
     */
    it('TC019: should create error response with details', () => {
      const details = { field: 'email', value: 'invalid' };
      const result = filter.testCreateErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Validation failed',
        mockRequest as Request,
        details,
      );

      expect(result.details).toEqual(details);
      expect(result.error).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    /**
     * Test Case 20: Kiểm tra error response with retryAfter
     * Input: error, message, request, undefined, retryAfter
     * Expected Output: Response with retryAfter
     * Path Coverage: With retryAfter
     */
    it('TC020: should create error response with retryAfter', () => {
      const result = filter.testCreateErrorResponse(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Too many requests',
        mockRequest as Request,
        undefined,
        60,
      );

      expect(result.retryAfter).toBe(60);
      expect(result.error).toBe(ERROR_CODES.RATE_LIMIT_EXCEEDED);
    });

    /**
     * Test Case 21: Kiểm tra error response with all parameters
     * Input: All parameters provided
     * Expected Output: Complete response
     * Path Coverage: All parameters
     */
    it('TC021: should create error response with all parameters', () => {
      const details = { errors: ['error1', 'error2'] };
      const result = filter.testCreateErrorResponse(
        ERROR_CODES.BAD_REQUEST,
        'Multiple errors',
        mockRequest as Request,
        details,
        120,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(ERROR_CODES.BAD_REQUEST);
      expect(result.message).toBe('Multiple errors');
      expect(result.details).toEqual(details);
      expect(result.retryAfter).toBe(120);
      expect(result.path).toBe('/api/test');
      expect(result.method).toBe('GET');
      expect(result.requestId).toBe('test-request-id-123');
    });

    /**
     * Test Case 22: Kiểm tra timestamp format
     * Input: Create error response
     * Expected Output: ISO timestamp
     * Path Coverage: Timestamp generation
     */
    it('TC022: should create timestamp in ISO format', () => {
      const result = filter.testCreateErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Error',
        mockRequest as Request,
      );

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    /**
     * Test Case 23: Kiểm tra request without requestId
     * Input: Request without requestId
     * Expected Output: 'unknown' requestId
     * Path Coverage: Missing requestId
     */
    it('TC023: should use "unknown" when requestId is missing', () => {
      const requestWithoutId = {
        url: '/api/test',
        method: 'POST',
      };

      const result = filter.testCreateErrorResponse(
        ERROR_CODES.BAD_REQUEST,
        'Error',
        requestWithoutId as Request,
      );

      expect(result.requestId).toBe('unknown');
    });

    /**
     * Test Case 24: Kiểm tra different HTTP methods
     * Input: Various HTTP methods
     * Expected Output: Correct method in response
     * Path Coverage: Different methods
     */
    it('TC024: should handle different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

      methods.forEach((method) => {
        const request = { ...mockRequest, method } as Request;
        const result = filter.testCreateErrorResponse(
          ERROR_CODES.BAD_REQUEST,
          'Error',
          request,
        );

        expect(result.method).toBe(method);
      });
    });

    /**
     * Test Case 25: Kiểm tra different URL paths
     * Input: Various URL paths
     * Expected Output: Correct path in response
     * Path Coverage: Different paths
     */
    it('TC025: should handle different URL paths', () => {
      const paths = ['/api/users', '/api/posts/123', '/health', '/'];

      paths.forEach((path) => {
        const request = { ...mockRequest, url: path } as Request;
        const result = filter.testCreateErrorResponse(
          ERROR_CODES.NOT_FOUND,
          'Not found',
          request,
        );

        expect(result.path).toBe(path);
      });
    });

    /**
     * Test Case 26: Kiểm tra all error codes
     * Input: All error code types
     * Expected Output: Correct error code in response
     * Path Coverage: All error codes
     */
    it('TC026: should handle all error code types', () => {
      const errorCodes = [
        ERROR_CODES.BAD_REQUEST,
        ERROR_CODES.UNAUTHORIZED,
        ERROR_CODES.FORBIDDEN,
        ERROR_CODES.NOT_FOUND,
        ERROR_CODES.VALIDATION_ERROR,
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
      ];

      errorCodes.forEach((code) => {
        const result = filter.testCreateErrorResponse(
          code,
          'Error',
          mockRequest as Request,
        );

        expect(result.error).toBe(code);
      });
    });

    /**
     * Test Case 27: Kiểm tra empty message
     * Input: Empty message string
     * Expected Output: Empty message accepted
     * Path Coverage: Empty message
     */
    it('TC027: should accept empty message', () => {
      const result = filter.testCreateErrorResponse(
        ERROR_CODES.BAD_REQUEST,
        '',
        mockRequest as Request,
      );

      expect(result.message).toBe('');
    });

    /**
     * Test Case 28: Kiểm tra very long message
     * Input: Very long error message
     * Expected Output: Long message preserved
     * Path Coverage: Long message
     */
    it('TC028: should handle very long messages', () => {
      const longMessage = 'Error: ' + 'x'.repeat(1000);
      const result = filter.testCreateErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        longMessage,
        mockRequest as Request,
      );

      expect(result.message).toBe(longMessage);
      expect(result.message.length).toBeGreaterThan(1000);
    });

    /**
     * Test Case 29: Kiểm tra Unicode in message
     * Input: Message with Unicode
     * Expected Output: Unicode preserved
     * Path Coverage: Unicode
     */
    it('TC029: should handle Unicode in message', () => {
      const message = '错误：无效的输入 🚫';
      const result = filter.testCreateErrorResponse(
        ERROR_CODES.BAD_REQUEST,
        message,
        mockRequest as Request,
      );

      expect(result.message).toBe(message);
    });

    /**
     * Test Case 30: Kiểm tra null details
     * Input: details = null
     * Expected Output: null details
     * Path Coverage: Null details
     */
    it('TC030: should handle null details', () => {
      const result = filter.testCreateErrorResponse(
        ERROR_CODES.BAD_REQUEST,
        'Error',
        mockRequest as Request,
        null,
      );

      expect(result.details).toBeNull();
    });

    /**
     * Test Case 31: Kiểm tra object details
     * Input: Complex object details
     * Expected Output: Object preserved
     * Path Coverage: Object details
     */
    it('TC031: should handle complex object details', () => {
      const details = {
        errors: [
          { field: 'email', message: 'Invalid' },
          { field: 'password', message: 'Too short' },
        ],
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'validation',
        },
      };

      const result = filter.testCreateErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Validation failed',
        mockRequest as Request,
        details,
      );

      expect(result.details).toEqual(details);
      expect(result.details.errors.length).toBe(2);
    });

    /**
     * Test Case 32: Kiểm tra array details
     * Input: Array details
     * Expected Output: Array preserved
     * Path Coverage: Array details
     */
    it('TC032: should handle array details', () => {
      const details = ['error1', 'error2', 'error3'];
      const result = filter.testCreateErrorResponse(
        ERROR_CODES.BAD_REQUEST,
        'Multiple errors',
        mockRequest as Request,
        details,
      );

      expect(result.details).toEqual(details);
      expect(Array.isArray(result.details)).toBe(true);
    });

    /**
     * Test Case 33: Kiểm tra zero retryAfter
     * Input: retryAfter = 0
     * Expected Output: retryAfter omitted (falsy value)
     * Path Coverage: Zero retryAfter
     */
    it('TC033: should omit zero retryAfter (falsy value)', () => {
      const result = filter.testCreateErrorResponse(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Rate limited',
        mockRequest as Request,
        undefined,
        0,
      );

      // Zero is falsy, so retryAfter is omitted
      expect(result.retryAfter).toBeUndefined();
    });

    /**
     * Test Case 34: Kiểm tra negative retryAfter
     * Input: retryAfter = -1
     * Expected Output: retryAfter = -1 (no validation)
     * Path Coverage: Negative retryAfter
     */
    it('TC034: should handle negative retryAfter', () => {
      const result = filter.testCreateErrorResponse(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Rate limited',
        mockRequest as Request,
        undefined,
        -1,
      );

      expect(result.retryAfter).toBe(-1);
    });

    /**
     * Test Case 35: Kiểm tra large retryAfter value
     * Input: retryAfter = 3600
     * Expected Output: retryAfter = 3600
     * Path Coverage: Large retryAfter
     */
    it('TC035: should handle large retryAfter values', () => {
      const result = filter.testCreateErrorResponse(
        ERROR_CODES.RATE_LIMIT_EXCEEDED,
        'Rate limited',
        mockRequest as Request,
        undefined,
        3600,
      );

      expect(result.retryAfter).toBe(3600);
    });
  });

  describe('Integration with ErrorResponseFormatter', () => {
    /**
     * Test Case 36: Kiểm tra delegation to ErrorResponseFormatter
     * Input: createErrorResponse call
     * Expected Output: Calls ErrorResponseFormatter.createErrorResponse
     * Path Coverage: Delegation
     */
    it('TC036: should delegate to ErrorResponseFormatter', () => {
      const spy = jest.spyOn(ErrorResponseFormatter, 'createErrorResponse');

      filter.testCreateErrorResponse(
        ERROR_CODES.BAD_REQUEST,
        'Error',
        mockRequest as Request,
      );

      expect(spy).toHaveBeenCalledWith(
        ERROR_CODES.BAD_REQUEST,
        'Error',
        mockRequest,
        undefined,
        undefined,
      );

      spy.mockRestore();
    });

    /**
     * Test Case 37: Kiểm tra with all parameters to formatter
     * Input: All parameters
     * Expected Output: All passed to formatter
     * Path Coverage: All parameters delegation
     */
    it('TC037: should pass all parameters to ErrorResponseFormatter', () => {
      const spy = jest.spyOn(ErrorResponseFormatter, 'createErrorResponse');
      const details = { key: 'value' };

      filter.testCreateErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Validation error',
        mockRequest as Request,
        details,
        60,
      );

      expect(spy).toHaveBeenCalledWith(
        ERROR_CODES.VALIDATION_ERROR,
        'Validation error',
        mockRequest,
        details,
        60,
      );

      spy.mockRestore();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    /**
     * Test Case 38: Kiểm tra với URL có query parameters
     * Input: URL with query params
     * Expected Output: Full URL preserved
     * Path Coverage: URL with query
     */
    it('TC038: should preserve URL with query parameters', () => {
      const request = {
        ...mockRequest,
        url: '/api/users?page=1&limit=10',
      } as Request;

      const result = filter.testCreateErrorResponse(
        ERROR_CODES.BAD_REQUEST,
        'Error',
        request,
      );

      expect(result.path).toBe('/api/users?page=1&limit=10');
    });

    /**
     * Test Case 39: Kiểm tra với URL có hash
     * Input: URL with hash
     * Expected Output: Full URL preserved
     * Path Coverage: URL with hash
     */
    it('TC039: should preserve URL with hash', () => {
      const request = {
        ...mockRequest,
        url: '/api/users#section',
      } as Request;

      const result = filter.testCreateErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Not found',
        request,
      );

      expect(result.path).toBe('/api/users#section');
    });

    /**
     * Test Case 40: Kiểm tra với special characters in URL
     * Input: URL with special chars
     * Expected Output: Special chars preserved
     * Path Coverage: Special chars
     */
    it('TC040: should handle special characters in URL', () => {
      const request = {
        ...mockRequest,
        url: '/api/users/john@example.com',
      } as Request;

      const result = filter.testCreateErrorResponse(
        ERROR_CODES.NOT_FOUND,
        'Not found',
        request,
      );

      expect(result.path).toBe('/api/users/john@example.com');
    });

    /**
     * Test Case 41: Kiểm tra multiple error responses
     * Input: Multiple calls
     * Expected Output: Independent responses
     * Path Coverage: Multiple calls
     */
    it('TC041: should create independent error responses', () => {
      const result1 = filter.testCreateErrorResponse(
        ERROR_CODES.BAD_REQUEST,
        'Error 1',
        mockRequest as Request,
      );

      const result2 = filter.testCreateErrorResponse(
        ERROR_CODES.UNAUTHORIZED,
        'Error 2',
        mockRequest as Request,
      );

      expect(result1).not.toBe(result2);
      expect(result1.error).toBe(ERROR_CODES.BAD_REQUEST);
      expect(result2.error).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(result1.message).toBe('Error 1');
      expect(result2.message).toBe('Error 2');
    });

    /**
     * Test Case 42: Kiểm tra timestamp ordering
     * Input: Create multiple responses with delay
     * Expected Output: Timestamps in order
     * Path Coverage: Timestamp order
     */
    it('TC042: should create timestamps in chronological order', async () => {
      const result1 = filter.testCreateErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Error 1',
        mockRequest as Request,
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      const result2 = filter.testCreateErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        'Error 2',
        mockRequest as Request,
      );

      const time1 = new Date(result1.timestamp).getTime();
      const time2 = new Date(result2.timestamp).getTime();

      expect(time2).toBeGreaterThanOrEqual(time1);
    });

    /**
     * Test Case 43: Kiểm tra success field always false
     * Input: Any error response
     * Expected Output: success = false
     * Path Coverage: Success field
     */
    it('TC043: should always set success to false', () => {
      const errorCodes = [
        ERROR_CODES.BAD_REQUEST,
        ERROR_CODES.UNAUTHORIZED,
        ERROR_CODES.INTERNAL_ERROR,
      ];

      errorCodes.forEach((code) => {
        const result = filter.testCreateErrorResponse(
          code,
          'Error',
          mockRequest as Request,
        );

        expect(result.success).toBe(false);
      });
    });

    /**
     * Test Case 44: Kiểm tra details with circular reference
     * Input: Object with circular reference
     * Expected Output: Object stored (serialization may fail later)
     * Path Coverage: Circular reference
     */
    it('TC044: should handle details with circular reference', () => {
      const circularDetails: any = { id: 1 };
      circularDetails.self = circularDetails;

      const result = filter.testCreateErrorResponse(
        ERROR_CODES.BAD_REQUEST,
        'Error',
        mockRequest as Request,
        circularDetails,
      );

      expect(result.details).toBe(circularDetails);
      expect(result.details.self).toBe(circularDetails);
    });

    /**
     * Test Case 45: Kiểm tra với empty request URL
     * Input: Empty URL
     * Expected Output: Empty path
     * Path Coverage: Empty URL
     */
    it('TC045: should handle empty request URL', () => {
      const request = { ...mockRequest, url: '' } as Request;

      const result = filter.testCreateErrorResponse(
        ERROR_CODES.BAD_REQUEST,
        'Error',
        request,
      );

      expect(result.path).toBe('');
    });

    /**
     * Test Case 46: Kiểm tra với undefined method
     * Input: Request without method
     * Expected Output: undefined method
     * Path Coverage: Missing method
     */
    it('TC046: should handle undefined method', () => {
      const request = { url: '/api/test', requestId: 'test' } as Request;

      const result = filter.testCreateErrorResponse(
        ERROR_CODES.BAD_REQUEST,
        'Error',
        request,
      );

      expect(result.method).toBeUndefined();
    });
  });

  describe('Abstract Method Implementation', () => {
    /**
     * Test Case 47: Kiểm tra catch method exists
     * Input: Check method
     * Expected Output: Method defined
     * Path Coverage: Abstract method
     */
    it('TC047: should implement catch method', () => {
      expect(filter.catch).toBeDefined();
      expect(typeof filter.catch).toBe('function');
    });

    /**
     * Test Case 48: Kiểm tra catch method can be called
     * Input: Call catch method
     * Expected Output: No error thrown
     * Path Coverage: Method call
     */
    it('TC048: should allow catch method to be called', () => {
      expect(() => {
        filter.catch(new Error('test'), mockArgumentsHost as ArgumentsHost);
      }).not.toThrow();
    });
  });

  describe('Real-world Scenarios', () => {
    /**
     * Test Case 49: Kiểm tra 400 validation error scenario
     * Input: Validation error
     * Expected Output: Proper validation error response
     * Path Coverage: Validation scenario
     */
    it('TC049: should handle validation error scenario', () => {
      const validationDetails = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too short' },
      ];

      const errorCode = filter.testGetErrorCode(422) as ErrorCode;
      const result = filter.testCreateErrorResponse(
        errorCode,
        'Validation failed',
        mockRequest as Request,
        validationDetails,
      );

      expect(errorCode).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(result.error).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(result.details).toEqual(validationDetails);
    });

    /**
     * Test Case 50: Kiểm tra rate limit scenario
     * Input: Rate limit exceeded
     * Expected Output: Rate limit error with retry
     * Path Coverage: Rate limit scenario
     */
    it('TC050: should handle rate limit scenario', () => {
      const errorCode = filter.testGetErrorCode(429) as ErrorCode;
      const result = filter.testCreateErrorResponse(
        errorCode,
        'Too many requests',
        mockRequest as Request,
        undefined,
        60,
      );

      expect(errorCode).toBe(ERROR_CODES.RATE_LIMIT_EXCEEDED);
      expect(result.error).toBe(ERROR_CODES.RATE_LIMIT_EXCEEDED);
      expect(result.retryAfter).toBe(60);
    });

    /**
     * Test Case 51: Kiểm tra authentication error scenario
     * Input: 401 Unauthorized
     * Expected Output: Auth error response
     * Path Coverage: Auth scenario
     */
    it('TC051: should handle authentication error scenario', () => {
      const errorCode = filter.testGetErrorCode(401) as ErrorCode;
      const result = filter.testCreateErrorResponse(
        errorCode,
        'Invalid credentials',
        mockRequest as Request,
      );

      expect(errorCode).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(result.error).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(result.message).toBe('Invalid credentials');
    });

    /**
     * Test Case 52: Kiểm tra not found scenario
     * Input: 404 Not Found
     * Expected Output: Not found error response
     * Path Coverage: Not found scenario
     */
    it('TC052: should handle not found scenario', () => {
      const request = {
        url: '/api/users/999',
        method: 'GET',
        requestId: 'req-123',
      } as Request;

      const errorCode = filter.testGetErrorCode(404) as ErrorCode;
      const result = filter.testCreateErrorResponse(
        errorCode,
        'User not found',
        request,
        { userId: 999 },
      );

      expect(errorCode).toBe(ERROR_CODES.NOT_FOUND);
      expect(result.error).toBe(ERROR_CODES.NOT_FOUND);
      expect(result.path).toBe('/api/users/999');
      expect(result.details.userId).toBe(999);
    });

    /**
     * Test Case 53: Kiểm tra timeout scenario
     * Input: 408 Request Timeout
     * Expected Output: Timeout error response
     * Path Coverage: Timeout scenario
     */
    it('TC053: should handle timeout scenario', () => {
      const errorCode = filter.testGetErrorCode(408) as ErrorCode;
      const result = filter.testCreateErrorResponse(
        errorCode,
        'Request timeout',
        mockRequest as Request,
        { timeoutMs: 30000 },
      );

      expect(errorCode).toBe(ERROR_CODES.REQUEST_TIMEOUT);
      expect(result.error).toBe(ERROR_CODES.REQUEST_TIMEOUT);
      expect(result.details.timeoutMs).toBe(30000);
    });

    /**
     * Test Case 54: Kiểm tra internal server error scenario
     * Input: 500 Internal Server Error
     * Expected Output: Internal error response
     * Path Coverage: Internal error scenario
     */
    it('TC054: should handle internal server error scenario', () => {
      const errorCode = filter.testGetErrorCode(500) as ErrorCode;
      const result = filter.testCreateErrorResponse(
        errorCode,
        'An unexpected error occurred',
        mockRequest as Request,
        { stack: 'Error stack trace...' },
      );

      expect(errorCode).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(result.error).toBe(ERROR_CODES.INTERNAL_ERROR);
      expect(result.details.stack).toBeDefined();
    });

    /**
     * Test Case 55: Kiểm tra conflict scenario
     * Input: 409 Conflict
     * Expected Output: Conflict error response
     * Path Coverage: Conflict scenario
     */
    it('TC055: should handle conflict scenario', () => {
      const errorCode = filter.testGetErrorCode(409) as ErrorCode;
      const result = filter.testCreateErrorResponse(
        errorCode,
        'Email already exists',
        mockRequest as Request,
        { email: 'test@example.com' },
      );

      expect(errorCode).toBe(ERROR_CODES.CONFLICT);
      expect(result.error).toBe(ERROR_CODES.CONFLICT);
      expect(result.details.email).toBe('test@example.com');
    });

    /**
     * Test Case 56: Kiểm tra forbidden scenario
     * Input: 403 Forbidden
     * Expected Output: Forbidden error response
     * Path Coverage: Forbidden scenario
     */
    it('TC056: should handle forbidden scenario', () => {
      const errorCode = filter.testGetErrorCode(403) as ErrorCode;
      const result = filter.testCreateErrorResponse(
        errorCode,
        'Access denied',
        mockRequest as Request,
        { requiredRole: 'admin', userRole: 'user' },
      );

      expect(errorCode).toBe(ERROR_CODES.FORBIDDEN);
      expect(result.error).toBe(ERROR_CODES.FORBIDDEN);
      expect(result.details.requiredRole).toBe('admin');
    });

    /**
     * Test Case 57: Kiểm tra POST request error
     * Input: POST request with error
     * Expected Output: Error response with POST method
     * Path Coverage: POST request
     */
    it('TC057: should handle POST request error', () => {
      const request = {
        url: '/api/users',
        method: 'POST',
        requestId: 'post-req-123',
      } as Request;

      const result = filter.testCreateErrorResponse(
        ERROR_CODES.BAD_REQUEST,
        'Invalid user data',
        request,
        { errors: ['name required', 'email invalid'] },
      );

      expect(result.method).toBe('POST');
      expect(result.path).toBe('/api/users');
      expect(result.details.errors.length).toBe(2);
    });

    /**
     * Test Case 58: Kiểm tra DELETE request error
     * Input: DELETE request with error
     * Expected Output: Error response with DELETE method
     * Path Coverage: DELETE request
     */
    it('TC058: should handle DELETE request error', () => {
      const request = {
        url: '/api/users/123',
        method: 'DELETE',
        requestId: 'delete-req-123',
      } as Request;

      const result = filter.testCreateErrorResponse(
        ERROR_CODES.FORBIDDEN,
        'Cannot delete user',
        request,
        { reason: 'User has active sessions' },
      );

      expect(result.method).toBe('DELETE');
      expect(result.path).toBe('/api/users/123');
      expect(result.details.reason).toBeDefined();
    });

    /**
     * Test Case 59: Kiểm tra PATCH request error
     * Input: PATCH request with error
     * Expected Output: Error response with PATCH method
     * Path Coverage: PATCH request
     */
    it('TC059: should handle PATCH request error', () => {
      const request = {
        url: '/api/users/123',
        method: 'PATCH',
        requestId: 'patch-req-123',
      } as Request;

      const result = filter.testCreateErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        'Invalid update data',
        request,
        { invalidFields: ['age', 'role'] },
      );

      expect(result.method).toBe('PATCH');
      expect(result.details.invalidFields).toEqual(['age', 'role']);
    });

    /**
     * Test Case 60: Kiểm tra complete error flow
     * Input: HTTP status to error response
     * Expected Output: Complete error handling flow
     * Path Coverage: Complete flow
     */
    it('TC060: should handle complete error flow from status to response', () => {
      // Step 1: Get error code from status
      const status = 400;
      const errorCode = filter.testGetErrorCode(status) as ErrorCode;

      // Step 2: Create error response
      const result = filter.testCreateErrorResponse(
        errorCode,
        'Bad request error',
        mockRequest as Request,
        { status, originalError: 'Invalid JSON' },
      );

      // Verify complete flow
      expect(errorCode).toBe(ERROR_CODES.BAD_REQUEST);
      expect(result.success).toBe(false);
      expect(result.error).toBe(ERROR_CODES.BAD_REQUEST);
      expect(result.message).toBe('Bad request error');
      expect(result.details.status).toBe(400);
      expect(result.path).toBe('/api/test');
      expect(result.method).toBe('GET');
      expect(result.requestId).toBe('test-request-id-123');
      expect(result.timestamp).toBeDefined();
    });
  });
});
