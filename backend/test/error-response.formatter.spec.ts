import { Request } from 'express';
import {
  ErrorResponseFormatter,
  ErrorResponse,
} from '../src/common/utils/error-response.formatter';
import { ErrorCode } from '../src/common/constants/app.constants';

describe('ErrorResponseFormatter - White Box Testing', () => {
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    // Setup mock Request object
    mockRequest = {
      url: '/api/v1/users',
      method: 'POST',
      requestId: 'test-request-id-12345',
    };
  });

  describe('ErrorResponse Interface', () => {
    /**
     * Test Case 1: Kiểm tra ErrorResponse interface structure
     * Input: ErrorResponse object
     * Expected Output: Object có đầy đủ required fields
     * Path Coverage: Interface type validation
     */
    it('TC001: should have required fields in ErrorResponse interface', () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'BAD_REQUEST',
        message: 'Test error',
        timestamp: new Date().toISOString(),
        path: '/api/test',
        method: 'GET',
        requestId: 'req-123',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.message).toBeDefined();
      expect(errorResponse.timestamp).toBeDefined();
      expect(errorResponse.path).toBeDefined();
      expect(errorResponse.method).toBeDefined();
      expect(errorResponse.requestId).toBeDefined();
    });

    /**
     * Test Case 2: Kiểm tra ErrorResponse với optional fields
     * Input: ErrorResponse với details và retryAfter
     * Expected Output: Optional fields được chứa
     * Path Coverage: Optional fields validation
     */
    it('TC002: should support optional fields (details, retryAfter)', () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Validation failed',
        timestamp: new Date().toISOString(),
        path: '/api/test',
        method: 'POST',
        requestId: 'req-123',
        details: { field: 'email', error: 'Invalid format' },
        retryAfter: 60,
      };

      expect(errorResponse.details).toBeDefined();
      expect(errorResponse.retryAfter).toBe(60);
    });

    /**
     * Test Case 3: Kiểm tra success field luôn là false
     * Input: ErrorResponse object
     * Expected Output: success = false
     * Path Coverage: Constant field validation
     */
    it('TC003: should always have success = false', () => {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'NOT_FOUND',
        message: 'Resource not found',
        timestamp: new Date().toISOString(),
        path: '/api/test',
        method: 'GET',
        requestId: 'req-123',
      };

      expect(errorResponse.success).toBe(false);
    });
  });

  describe('createErrorResponse Method', () => {
    /**
     * Test Case 4: Kiểm tra createErrorResponse với minimal parameters
     * Input: error, message, request (no details, no retryAfter)
     * Expected Output: ErrorResponse object với required fields only
     * Path Coverage: Line 29-40 (minimal parameters path)
     */
    it('TC004: should create error response with minimal parameters', () => {
      const result = ErrorResponseFormatter.createErrorResponse(
        'BAD_REQUEST',
        'Invalid input',
        mockRequest as Request,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('BAD_REQUEST');
      expect(result.message).toBe('Invalid input');
      expect(result.path).toBe('/api/v1/users');
      expect(result.method).toBe('POST');
      expect(result.requestId).toBe('test-request-id-12345');
      expect(result.timestamp).toBeDefined();
      expect(result.details).toBeUndefined();
      expect(result.retryAfter).toBeUndefined();
    });

    /**
     * Test Case 5: Kiểm tra createErrorResponse với all parameters
     * Input: error, message, request, details, retryAfter
     * Expected Output: ErrorResponse object với all fields
     * Path Coverage: Line 29-40 (all parameters path)
     */
    it('TC005: should create error response with all parameters', () => {
      const details = { code: 'ERR001', info: 'Additional info' };

      const result = ErrorResponseFormatter.createErrorResponse(
        'INTERNAL_ERROR',
        'Server error',
        mockRequest as Request,
        details,
        120,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('INTERNAL_ERROR');
      expect(result.message).toBe('Server error');
      expect(result.path).toBe('/api/v1/users');
      expect(result.method).toBe('POST');
      expect(result.requestId).toBe('test-request-id-12345');
      expect(result.timestamp).toBeDefined();
      expect(result.details).toEqual(details);
      expect(result.retryAfter).toBe(120);
    });

    /**
     * Test Case 6: Kiểm tra createErrorResponse với details nhưng không có retryAfter
     * Input: error, message, request, details, undefined retryAfter
     * Expected Output: ErrorResponse với details, không có retryAfter
     * Path Coverage: Line 38 (conditional retryAfter - false branch)
     */
    it('TC006: should create error response with details but no retryAfter', () => {
      const details = { userId: '123', reason: 'Not authorized' };

      const result = ErrorResponseFormatter.createErrorResponse(
        'UNAUTHORIZED',
        'Access denied',
        mockRequest as Request,
        details,
      );

      expect(result.details).toEqual(details);
      expect(result.retryAfter).toBeUndefined();
    });

    /**
     * Test Case 7: Kiểm tra createErrorResponse với retryAfter = 0
     * Input: retryAfter = 0
     * Expected Output: retryAfter không được include (falsy value)
     * Path Coverage: Line 38 (conditional retryAfter - falsy check)
     */
    it('TC007: should not include retryAfter when value is 0', () => {
      const result = ErrorResponseFormatter.createErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests',
        mockRequest as Request,
        undefined,
        0,
      );

      expect(result.retryAfter).toBeUndefined();
    });

    /**
     * Test Case 8: Kiểm tra createErrorResponse với retryAfter = null
     * Input: retryAfter = null
     * Expected Output: retryAfter không được include
     * Path Coverage: Line 38 (conditional retryAfter - falsy check)
     */
    it('TC008: should not include retryAfter when value is null', () => {
      const result = ErrorResponseFormatter.createErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests',
        mockRequest as Request,
        undefined,
        null as any,
      );

      expect(result.retryAfter).toBeUndefined();
    });

    /**
     * Test Case 9: Kiểm tra timestamp format (ISO 8601)
     * Input: Valid request
     * Expected Output: timestamp là ISO 8601 string
     * Path Coverage: Line 35 (timestamp generation)
     */
    it('TC009: should generate timestamp in ISO 8601 format', () => {
      const result = ErrorResponseFormatter.createErrorResponse(
        'NOT_FOUND',
        'Resource not found',
        mockRequest as Request,
      );

      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(() => new Date(result.timestamp)).not.toThrow();
    });

    /**
     * Test Case 10: Kiểm tra với request không có requestId
     * Input: request.requestId = undefined
     * Expected Output: requestId = 'unknown'
     * Path Coverage: Line 37 (|| 'unknown' fallback)
     */
    it('TC010: should use "unknown" when requestId is not set', () => {
      mockRequest.requestId = undefined;

      const result = ErrorResponseFormatter.createErrorResponse(
        'BAD_REQUEST',
        'Invalid input',
        mockRequest as Request,
      );

      expect(result.requestId).toBe('unknown');
    });

    /**
     * Test Case 11: Kiểm tra với request.requestId = null
     * Input: request.requestId = null
     * Expected Output: requestId = 'unknown'
     * Path Coverage: Line 37 (|| 'unknown' fallback)
     */
    it('TC011: should use "unknown" when requestId is null', () => {
      (mockRequest as any).requestId = null;

      const result = ErrorResponseFormatter.createErrorResponse(
        'BAD_REQUEST',
        'Invalid input',
        mockRequest as Request,
      );

      expect(result.requestId).toBe('unknown');
    });

    /**
     * Test Case 12: Kiểm tra với request.requestId = empty string
     * Input: request.requestId = ''
     * Expected Output: requestId = 'unknown'
     * Path Coverage: Line 37 (|| 'unknown' fallback for empty string)
     */
    it('TC012: should use "unknown" when requestId is empty string', () => {
      mockRequest.requestId = '';

      const result = ErrorResponseFormatter.createErrorResponse(
        'BAD_REQUEST',
        'Invalid input',
        mockRequest as Request,
      );

      expect(result.requestId).toBe('unknown');
    });

    /**
     * Test Case 13: Kiểm tra với all ErrorCode types
     * Input: Tất cả ErrorCode values
     * Expected Output: All error codes được accept
     * Path Coverage: Type validation for ErrorCode union
     */
    it('TC013: should accept all valid ErrorCode values', () => {
      const errorCodes: ErrorCode[] = [
        'BAD_REQUEST',
        'UNAUTHORIZED',
        'FORBIDDEN',
        'NOT_FOUND',
        'CONFLICT',
        'VALIDATION_ERROR',
        'RATE_LIMIT_EXCEEDED',
        'REQUEST_TIMEOUT',
        'INTERNAL_ERROR',
        'DATABASE_ERROR',
        'DUPLICATE_ENTRY',
        'DATABASE_VALIDATION_ERROR',
        'BUSINESS_ERROR',
        'INVALID_TOKEN',
        'TOKEN_EXPIRED',
        'INVALID_CREDENTIALS',
        'UNKNOWN_ERROR',
      ];

      errorCodes.forEach((code) => {
        const result = ErrorResponseFormatter.createErrorResponse(
          code,
          `Test for ${code}`,
          mockRequest as Request,
        );

        expect(result.error).toBe(code);
      });
    });

    /**
     * Test Case 14: Kiểm tra với different request methods
     * Input: GET, POST, PUT, DELETE, PATCH methods
     * Expected Output: Method được reflect correctly
     * Path Coverage: Line 36 (method field)
     */
    it('TC014: should handle different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach((method) => {
        mockRequest.method = method;
        const result = ErrorResponseFormatter.createErrorResponse(
          'BAD_REQUEST',
          'Test',
          mockRequest as Request,
        );

        expect(result.method).toBe(method);
      });
    });

    /**
     * Test Case 15: Kiểm tra với different request paths
     * Input: Various URL paths
     * Expected Output: Path được reflect correctly
     * Path Coverage: Line 36 (path field)
     */
    it('TC015: should handle different request paths', () => {
      const paths = [
        '/api/v1/users',
        '/api/v1/users/123',
        '/api/v1/users?page=1&limit=10',
        '/health',
        '/',
      ];

      paths.forEach((path) => {
        mockRequest.url = path;
        const result = ErrorResponseFormatter.createErrorResponse(
          'NOT_FOUND',
          'Not found',
          mockRequest as Request,
        );

        expect(result.path).toBe(path);
      });
    });

    /**
     * Test Case 16: Kiểm tra với complex details object
     * Input: Nested details object
     * Expected Output: Details được preserve correctly
     * Path Coverage: Line 34 (details field)
     */
    it('TC016: should handle complex details object', () => {
      const complexDetails = {
        errors: [
          { field: 'email', message: 'Invalid format' },
          { field: 'password', message: 'Too short' },
        ],
        metadata: {
          requestTime: Date.now(),
          userId: '123',
        },
        stack: 'Error stack trace...',
      };

      const result = ErrorResponseFormatter.createErrorResponse(
        'VALIDATION_ERROR',
        'Multiple errors',
        mockRequest as Request,
        complexDetails,
      );

      expect(result.details).toEqual(complexDetails);
      expect(result.details.errors).toHaveLength(2);
      expect(result.details.metadata.userId).toBe('123');
    });

    /**
     * Test Case 17: Kiểm tra với details = null
     * Input: details = null
     * Expected Output: details = null (not undefined)
     * Path Coverage: Line 34 (details with null value)
     */
    it('TC017: should allow null as details value', () => {
      const result = ErrorResponseFormatter.createErrorResponse(
        'INTERNAL_ERROR',
        'Error',
        mockRequest as Request,
        null,
      );

      expect(result.details).toBeNull();
    });

    /**
     * Test Case 18: Kiểm tra với details = empty object
     * Input: details = {}
     * Expected Output: details = {}
     * Path Coverage: Line 34 (details with empty object)
     */
    it('TC018: should allow empty object as details value', () => {
      const result = ErrorResponseFormatter.createErrorResponse(
        'INTERNAL_ERROR',
        'Error',
        mockRequest as Request,
        {},
      );

      expect(result.details).toEqual({});
    });

    /**
     * Test Case 19: Kiểm tra immutability of request object
     * Input: Request object
     * Expected Output: Request không bị modify
     * Path Coverage: Side effects check
     */
    it('TC019: should not modify the original request object', () => {
      const originalUrl = mockRequest.url;
      const originalMethod = mockRequest.method;
      const originalRequestId = mockRequest.requestId;

      ErrorResponseFormatter.createErrorResponse(
        'BAD_REQUEST',
        'Test',
        mockRequest as Request,
      );

      expect(mockRequest.url).toBe(originalUrl);
      expect(mockRequest.method).toBe(originalMethod);
      expect(mockRequest.requestId).toBe(originalRequestId);
    });

    /**
     * Test Case 20: Kiểm tra với retryAfter values khác nhau
     * Input: Various retryAfter numbers
     * Expected Output: retryAfter được reflect correctly
     * Path Coverage: Line 38 (conditional retryAfter - true branch)
     */
    it('TC020: should handle different retryAfter values', () => {
      const retryAfterValues = [1, 30, 60, 300, 3600];

      retryAfterValues.forEach((seconds) => {
        const result = ErrorResponseFormatter.createErrorResponse(
          'RATE_LIMIT_EXCEEDED',
          'Too many requests',
          mockRequest as Request,
          undefined,
          seconds,
        );

        expect(result.retryAfter).toBe(seconds);
      });
    });
  });

  describe('createValidationErrorResponse Method', () => {
    /**
     * Test Case 21: Kiểm tra createValidationErrorResponse với single validation error
     * Input: Single validation error
     * Expected Output: ErrorResponse với VALIDATION_ERROR code
     * Path Coverage: Line 47-54 (single error path)
     */
    it('TC021: should create validation error response with single error', () => {
      const validationErrors = [
        { field: 'email', message: 'Email is required' },
      ];

      const result = ErrorResponseFormatter.createValidationErrorResponse(
        'Validation failed',
        mockRequest as Request,
        validationErrors,
      );

      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.message).toBe('Validation failed');
      expect(result.details).toEqual(validationErrors);
      expect(result.details).toHaveLength(1);
    });

    /**
     * Test Case 22: Kiểm tra createValidationErrorResponse với multiple errors
     * Input: Array of validation errors
     * Expected Output: ErrorResponse với array of errors
     * Path Coverage: Line 47-54 (multiple errors path)
     */
    it('TC022: should create validation error response with multiple errors', () => {
      const validationErrors = [
        { field: 'email', message: 'Email is invalid' },
        { field: 'password', message: 'Password too short' },
        { field: 'username', message: 'Username already exists' },
      ];

      const result = ErrorResponseFormatter.createValidationErrorResponse(
        'Multiple validation errors',
        mockRequest as Request,
        validationErrors,
      );

      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.details).toEqual(validationErrors);
      expect(result.details).toHaveLength(3);
    });

    /**
     * Test Case 23: Kiểm tra validation error với field values
     * Input: Validation errors với value field
     * Expected Output: Details chứa field values
     * Path Coverage: Line 47-54 (with value field)
     */
    it('TC023: should include field values in validation errors', () => {
      const validationErrors = [
        { field: 'age', message: 'Must be >= 18', value: 15 },
        { field: 'email', message: 'Invalid format', value: 'invalid-email' },
      ];

      const result = ErrorResponseFormatter.createValidationErrorResponse(
        'Validation failed',
        mockRequest as Request,
        validationErrors,
      );

      expect(result.details[0].value).toBe(15);
      expect(result.details[1].value).toBe('invalid-email');
    });

    /**
     * Test Case 24: Kiểm tra validation error với empty array
     * Input: Empty validation errors array
     * Expected Output: ErrorResponse với empty details
     * Path Coverage: Line 47-54 (empty array path)
     */
    it('TC024: should handle empty validation errors array', () => {
      const result = ErrorResponseFormatter.createValidationErrorResponse(
        'No specific errors',
        mockRequest as Request,
        [],
      );

      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.details).toEqual([]);
      expect(result.details).toHaveLength(0);
    });

    /**
     * Test Case 25: Kiểm tra validation error không có retryAfter
     * Input: Validation error
     * Expected Output: No retryAfter field
     * Path Coverage: Line 47-54 (no retryAfter)
     */
    it('TC025: should not include retryAfter in validation errors', () => {
      const validationErrors = [
        { field: 'email', message: 'Email is required' },
      ];

      const result = ErrorResponseFormatter.createValidationErrorResponse(
        'Validation failed',
        mockRequest as Request,
        validationErrors,
      );

      expect(result.retryAfter).toBeUndefined();
    });

    /**
     * Test Case 26: Kiểm tra validation error có đầy đủ standard fields
     * Input: Validation error
     * Expected Output: All standard fields present
     * Path Coverage: Line 47-54 (complete response)
     */
    it('TC026: should include all standard error fields', () => {
      const validationErrors = [
        { field: 'name', message: 'Name is required' },
      ];

      const result = ErrorResponseFormatter.createValidationErrorResponse(
        'Validation failed',
        mockRequest as Request,
        validationErrors,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.message).toBe('Validation failed');
      expect(result.timestamp).toBeDefined();
      expect(result.path).toBe('/api/v1/users');
      expect(result.method).toBe('POST');
      expect(result.requestId).toBe('test-request-id-12345');
    });

    /**
     * Test Case 27: Kiểm tra validation error với complex field structure
     * Input: Nested field names
     * Expected Output: Field names preserved
     * Path Coverage: Line 47-54 (complex field names)
     */
    it('TC027: should handle nested field names', () => {
      const validationErrors = [
        { field: 'user.profile.email', message: 'Invalid email' },
        { field: 'settings.notifications.enabled', message: 'Must be boolean' },
      ];

      const result = ErrorResponseFormatter.createValidationErrorResponse(
        'Nested validation failed',
        mockRequest as Request,
        validationErrors,
      );

      expect(result.details[0].field).toBe('user.profile.email');
      expect(result.details[1].field).toBe('settings.notifications.enabled');
    });
  });

  describe('createRateLimitErrorResponse Method', () => {
    /**
     * Test Case 28: Kiểm tra createRateLimitErrorResponse với default retryAfter
     * Input: Request only (no retryAfterSeconds)
     * Expected Output: retryAfter = 60 (default)
     * Path Coverage: Line 61-68 (default parameter path)
     */
    it('TC028: should use default retryAfter of 60 seconds', () => {
      const result =
        ErrorResponseFormatter.createRateLimitErrorResponse(
          mockRequest as Request,
        );

      expect(result.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.message).toBe('Too many requests, please try again later');
      expect(result.retryAfter).toBe(60);
    });

    /**
     * Test Case 29: Kiểm tra createRateLimitErrorResponse với custom retryAfter
     * Input: Request, retryAfterSeconds = 120
     * Expected Output: retryAfter = 120
     * Path Coverage: Line 61-68 (custom parameter path)
     */
    it('TC029: should use custom retryAfter value', () => {
      const result = ErrorResponseFormatter.createRateLimitErrorResponse(
        mockRequest as Request,
        120,
      );

      expect(result.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.retryAfter).toBe(120);
    });

    /**
     * Test Case 30: Kiểm tra rate limit error message
     * Input: Request
     * Expected Output: Standard rate limit message
     * Path Coverage: Line 64 (message constant)
     */
    it('TC030: should use standard rate limit error message', () => {
      const result =
        ErrorResponseFormatter.createRateLimitErrorResponse(
          mockRequest as Request,
        );

      expect(result.message).toBe('Too many requests, please try again later');
    });

    /**
     * Test Case 31: Kiểm tra rate limit error code
     * Input: Request
     * Expected Output: RATE_LIMIT_EXCEEDED error code
     * Path Coverage: Line 63 (error code constant)
     */
    it('TC031: should use RATE_LIMIT_EXCEEDED error code', () => {
      const result =
        ErrorResponseFormatter.createRateLimitErrorResponse(
          mockRequest as Request,
        );

      expect(result.error).toBe('RATE_LIMIT_EXCEEDED');
    });

    /**
     * Test Case 32: Kiểm tra rate limit không có details
     * Input: Request
     * Expected Output: details = undefined
     * Path Coverage: Line 61-68 (no details)
     */
    it('TC032: should not include details in rate limit error', () => {
      const result =
        ErrorResponseFormatter.createRateLimitErrorResponse(
          mockRequest as Request,
        );

      expect(result.details).toBeUndefined();
    });

    /**
     * Test Case 33: Kiểm tra rate limit với retryAfter = 0
     * Input: retryAfterSeconds = 0
     * Expected Output: retryAfter không được include (falsy)
     * Path Coverage: Line 61-68, Line 38 (falsy retryAfter)
     */
    it('TC033: should not include retryAfter when value is 0', () => {
      const result = ErrorResponseFormatter.createRateLimitErrorResponse(
        mockRequest as Request,
        0,
      );

      expect(result.retryAfter).toBeUndefined();
    });

    /**
     * Test Case 34: Kiểm tra rate limit với different retry values
     * Input: Various retry seconds
     * Expected Output: Correct retryAfter values
     * Path Coverage: Line 61-68 (different parameters)
     */
    it('TC034: should handle different retry values', () => {
      const retryValues = [30, 60, 300, 3600];

      retryValues.forEach((seconds) => {
        const result = ErrorResponseFormatter.createRateLimitErrorResponse(
          mockRequest as Request,
          seconds,
        );

        expect(result.retryAfter).toBe(seconds);
      });
    });

    /**
     * Test Case 35: Kiểm tra rate limit có đầy đủ standard fields
     * Input: Request
     * Expected Output: All standard fields present
     * Path Coverage: Line 61-68 (complete response)
     */
    it('TC035: should include all standard error fields', () => {
      const result =
        ErrorResponseFormatter.createRateLimitErrorResponse(
          mockRequest as Request,
        );

      expect(result.success).toBe(false);
      expect(result.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.message).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.path).toBe('/api/v1/users');
      expect(result.method).toBe('POST');
      expect(result.requestId).toBe('test-request-id-12345');
    });
  });

  describe('createTimeoutErrorResponse Method', () => {
    /**
     * Test Case 36: Kiểm tra createTimeoutErrorResponse basic functionality
     * Input: Request
     * Expected Output: ErrorResponse với REQUEST_TIMEOUT code
     * Path Coverage: Line 73-78 (basic path)
     */
    it('TC036: should create timeout error response', () => {
      const result =
        ErrorResponseFormatter.createTimeoutErrorResponse(
          mockRequest as Request,
        );

      expect(result.error).toBe('REQUEST_TIMEOUT');
      expect(result.message).toBe('Request timeout, please try again');
    });

    /**
     * Test Case 37: Kiểm tra timeout error message
     * Input: Request
     * Expected Output: Standard timeout message
     * Path Coverage: Line 75 (message constant)
     */
    it('TC037: should use standard timeout error message', () => {
      const result =
        ErrorResponseFormatter.createTimeoutErrorResponse(
          mockRequest as Request,
        );

      expect(result.message).toBe('Request timeout, please try again');
    });

    /**
     * Test Case 38: Kiểm tra timeout error code
     * Input: Request
     * Expected Output: REQUEST_TIMEOUT error code
     * Path Coverage: Line 74 (error code constant)
     */
    it('TC038: should use REQUEST_TIMEOUT error code', () => {
      const result =
        ErrorResponseFormatter.createTimeoutErrorResponse(
          mockRequest as Request,
        );

      expect(result.error).toBe('REQUEST_TIMEOUT');
    });

    /**
     * Test Case 39: Kiểm tra timeout error không có details
     * Input: Request
     * Expected Output: details = undefined
     * Path Coverage: Line 73-78 (no details)
     */
    it('TC039: should not include details in timeout error', () => {
      const result =
        ErrorResponseFormatter.createTimeoutErrorResponse(
          mockRequest as Request,
        );

      expect(result.details).toBeUndefined();
    });

    /**
     * Test Case 40: Kiểm tra timeout error không có retryAfter
     * Input: Request
     * Expected Output: retryAfter = undefined
     * Path Coverage: Line 73-78 (no retryAfter)
     */
    it('TC040: should not include retryAfter in timeout error', () => {
      const result =
        ErrorResponseFormatter.createTimeoutErrorResponse(
          mockRequest as Request,
        );

      expect(result.retryAfter).toBeUndefined();
    });

    /**
     * Test Case 41: Kiểm tra timeout có đầy đủ standard fields
     * Input: Request
     * Expected Output: All standard fields present
     * Path Coverage: Line 73-78 (complete response)
     */
    it('TC041: should include all standard error fields', () => {
      const result =
        ErrorResponseFormatter.createTimeoutErrorResponse(
          mockRequest as Request,
        );

      expect(result.success).toBe(false);
      expect(result.error).toBe('REQUEST_TIMEOUT');
      expect(result.message).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.path).toBe('/api/v1/users');
      expect(result.method).toBe('POST');
      expect(result.requestId).toBe('test-request-id-12345');
    });
  });

  describe('createDatabaseErrorResponse Method', () => {
    /**
     * Test Case 42: Kiểm tra createDatabaseErrorResponse basic functionality
     * Input: message, request (no details)
     * Expected Output: ErrorResponse với DATABASE_ERROR code
     * Path Coverage: Line 83-91 (no details path)
     */
    it('TC042: should create database error response without details', () => {
      const result = ErrorResponseFormatter.createDatabaseErrorResponse(
        'Database connection failed',
        mockRequest as Request,
      );

      expect(result.error).toBe('DATABASE_ERROR');
      expect(result.message).toBe('Database connection failed');
      expect(result.details).toBeUndefined();
    });

    /**
     * Test Case 43: Kiểm tra createDatabaseErrorResponse với details
     * Input: message, request, details
     * Expected Output: ErrorResponse với details
     * Path Coverage: Line 83-91 (with details path)
     */
    it('TC043: should create database error response with details', () => {
      const details = {
        code: 'ECONNREFUSED',
        host: 'localhost',
        port: 27017,
      };

      const result = ErrorResponseFormatter.createDatabaseErrorResponse(
        'Cannot connect to database',
        mockRequest as Request,
        details,
      );

      expect(result.error).toBe('DATABASE_ERROR');
      expect(result.message).toBe('Cannot connect to database');
      expect(result.details).toEqual(details);
    });

    /**
     * Test Case 44: Kiểm tra database error code
     * Input: message, request
     * Expected Output: DATABASE_ERROR error code
     * Path Coverage: Line 85 (error code constant)
     */
    it('TC044: should use DATABASE_ERROR error code', () => {
      const result = ErrorResponseFormatter.createDatabaseErrorResponse(
        'Database error',
        mockRequest as Request,
      );

      expect(result.error).toBe('DATABASE_ERROR');
    });

    /**
     * Test Case 45: Kiểm tra database error với custom message
     * Input: Various error messages
     * Expected Output: Messages preserved
     * Path Coverage: Line 86 (custom message)
     */
    it('TC045: should use custom error messages', () => {
      const messages = [
        'Connection timeout',
        'Query execution failed',
        'Transaction rolled back',
        'Duplicate key violation',
      ];

      messages.forEach((message) => {
        const result = ErrorResponseFormatter.createDatabaseErrorResponse(
          message,
          mockRequest as Request,
        );

        expect(result.message).toBe(message);
      });
    });

    /**
     * Test Case 46: Kiểm tra database error không có retryAfter
     * Input: message, request
     * Expected Output: retryAfter = undefined
     * Path Coverage: Line 83-91 (no retryAfter)
     */
    it('TC046: should not include retryAfter in database error', () => {
      const result = ErrorResponseFormatter.createDatabaseErrorResponse(
        'Database error',
        mockRequest as Request,
      );

      expect(result.retryAfter).toBeUndefined();
    });

    /**
     * Test Case 47: Kiểm tra database error với complex details
     * Input: Complex error details
     * Expected Output: Details preserved
     * Path Coverage: Line 83-91 (complex details)
     */
    it('TC047: should handle complex database error details', () => {
      const details = {
        driver: 'mongodb',
        errorCode: 11000,
        keyPattern: { email: 1 },
        keyValue: { email: 'test@example.com' },
        errmsg: 'E11000 duplicate key error',
      };

      const result = ErrorResponseFormatter.createDatabaseErrorResponse(
        'Duplicate key error',
        mockRequest as Request,
        details,
      );

      expect(result.details).toEqual(details);
      expect(result.details.errorCode).toBe(11000);
      expect(result.details.keyValue.email).toBe('test@example.com');
    });

    /**
     * Test Case 48: Kiểm tra database error có đầy đủ standard fields
     * Input: message, request, details
     * Expected Output: All standard fields present
     * Path Coverage: Line 83-91 (complete response)
     */
    it('TC048: should include all standard error fields', () => {
      const result = ErrorResponseFormatter.createDatabaseErrorResponse(
        'Database error',
        mockRequest as Request,
        { code: 'ERR001' },
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('DATABASE_ERROR');
      expect(result.message).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.path).toBe('/api/v1/users');
      expect(result.method).toBe('POST');
      expect(result.requestId).toBe('test-request-id-12345');
      expect(result.details).toBeDefined();
    });
  });

  describe('Integration Scenarios', () => {
    /**
     * Test Case 49: Scenario - API validation failure
     * Input: Invalid user registration data
     * Expected Output: Proper validation error response
     * Path Coverage: Real-world validation scenario
     */
    it('TC049: should handle user registration validation failure', () => {
      mockRequest.url = '/api/v1/auth/register';
      mockRequest.method = 'POST';

      const validationErrors = [
        { field: 'email', message: 'Email is invalid', value: 'invalid-email' },
        { field: 'password', message: 'Password must be at least 8 characters', value: 'short' },
        { field: 'username', message: 'Username is required' },
      ];

      const result = ErrorResponseFormatter.createValidationErrorResponse(
        'Registration validation failed',
        mockRequest as Request,
        validationErrors,
      );

      expect(result.error).toBe('VALIDATION_ERROR');
      expect(result.path).toBe('/api/v1/auth/register');
      expect(result.details).toHaveLength(3);
    });

    /**
     * Test Case 50: Scenario - Rate limit exceeded during login
     * Input: Too many login attempts
     * Expected Output: Rate limit error with retry info
     * Path Coverage: Security scenario
     */
    it('TC050: should handle rate limit during login attempts', () => {
      mockRequest.url = '/api/v1/auth/login';
      mockRequest.method = 'POST';

      const result = ErrorResponseFormatter.createRateLimitErrorResponse(
        mockRequest as Request,
        300, // 5 minutes
      );

      expect(result.error).toBe('RATE_LIMIT_EXCEEDED');
      expect(result.retryAfter).toBe(300);
      expect(result.path).toBe('/api/v1/auth/login');
    });

    /**
     * Test Case 51: Scenario - Database connection timeout
     * Input: Database unavailable
     * Expected Output: Database error with connection details
     * Path Coverage: Infrastructure failure scenario
     */
    it('TC051: should handle database connection failure', () => {
      mockRequest.url = '/api/v1/users/123';
      mockRequest.method = 'GET';

      const result = ErrorResponseFormatter.createDatabaseErrorResponse(
        'Failed to connect to database',
        mockRequest as Request,
        {
          code: 'ETIMEDOUT',
          host: 'mongodb://localhost:27017',
          timeout: 5000,
        },
      );

      expect(result.error).toBe('DATABASE_ERROR');
      expect(result.details.code).toBe('ETIMEDOUT');
    });

    /**
     * Test Case 52: Scenario - Request timeout during file upload
     * Input: Large file upload timeout
     * Expected Output: Timeout error
     * Path Coverage: Timeout scenario
     */
    it('TC052: should handle request timeout during file upload', () => {
      mockRequest.url = '/api/v1/files/upload';
      mockRequest.method = 'POST';

      const result =
        ErrorResponseFormatter.createTimeoutErrorResponse(
          mockRequest as Request,
        );

      expect(result.error).toBe('REQUEST_TIMEOUT');
      expect(result.path).toBe('/api/v1/files/upload');
      expect(result.method).toBe('POST');
    });

    /**
     * Test Case 53: Scenario - Multiple error types in sequence
     * Input: Different error formatters
     * Expected Output: Consistent response format
     * Path Coverage: Consistency check across formatters
     */
    it('TC053: should maintain consistent format across all error types', () => {
      const validation = ErrorResponseFormatter.createValidationErrorResponse(
        'Validation error',
        mockRequest as Request,
        [{ field: 'test', message: 'error' }],
      );

      const rateLimit = ErrorResponseFormatter.createRateLimitErrorResponse(
        mockRequest as Request,
      );

      const timeout = ErrorResponseFormatter.createTimeoutErrorResponse(
        mockRequest as Request,
      );

      const database = ErrorResponseFormatter.createDatabaseErrorResponse(
        'Database error',
        mockRequest as Request,
      );

      // All should have same structure
      [validation, rateLimit, timeout, database].forEach((response) => {
        expect(response.success).toBe(false);
        expect(response.error).toBeDefined();
        expect(response.message).toBeDefined();
        expect(response.timestamp).toBeDefined();
        expect(response.path).toBeDefined();
        expect(response.method).toBeDefined();
        expect(response.requestId).toBeDefined();
      });
    });

    /**
     * Test Case 54: Scenario - Error tracking với requestId
     * Input: Multiple requests với different requestIds
     * Expected Output: RequestId được track correctly
     * Path Coverage: Request tracking scenario
     */
    it('TC054: should track errors with different request IDs', () => {
      const requestIds = ['req-001', 'req-002', 'req-003'];

      requestIds.forEach((id) => {
        mockRequest.requestId = id;
        const result = ErrorResponseFormatter.createErrorResponse(
          'BAD_REQUEST',
          'Test',
          mockRequest as Request,
        );

        expect(result.requestId).toBe(id);
      });
    });

    /**
     * Test Case 55: Scenario - Timestamp ordering
     * Input: Sequential error responses
     * Expected Output: Timestamps in chronological order
     * Path Coverage: Timestamp generation scenario
     */
    it('TC055: should generate timestamps in chronological order', () => {
      const result1 = ErrorResponseFormatter.createErrorResponse(
        'BAD_REQUEST',
        'First error',
        mockRequest as Request,
      );

      // Small delay
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      
      return delay(10).then(() => {
        const result2 = ErrorResponseFormatter.createErrorResponse(
          'BAD_REQUEST',
          'Second error',
          mockRequest as Request,
        );

        const time1 = new Date(result1.timestamp).getTime();
        const time2 = new Date(result2.timestamp).getTime();

        expect(time2).toBeGreaterThanOrEqual(time1);
      });
    });
  });

  describe('Type Safety and Edge Cases', () => {
    /**
     * Test Case 56: Kiểm tra static class methods
     * Input: N/A
     * Expected Output: All methods are static
     * Path Coverage: Class structure validation
     */
    it('TC056: should have all methods as static', () => {
      expect(typeof ErrorResponseFormatter.createErrorResponse).toBe('function');
      expect(typeof ErrorResponseFormatter.createValidationErrorResponse).toBe('function');
      expect(typeof ErrorResponseFormatter.createRateLimitErrorResponse).toBe('function');
      expect(typeof ErrorResponseFormatter.createTimeoutErrorResponse).toBe('function');
      expect(typeof ErrorResponseFormatter.createDatabaseErrorResponse).toBe('function');
    });

    /**
     * Test Case 57: Kiểm tra không thể instantiate class
     * Input: new ErrorResponseFormatter()
     * Expected Output: Class chỉ có static methods
     * Path Coverage: Class design validation
     */
    it('TC057: should be a utility class with static methods only', () => {
      // TypeScript prevents instantiation, but we can check methods exist
      const methods = Object.getOwnPropertyNames(ErrorResponseFormatter);
      
      expect(methods).toContain('createErrorResponse');
      expect(methods).toContain('createValidationErrorResponse');
      expect(methods).toContain('createRateLimitErrorResponse');
      expect(methods).toContain('createTimeoutErrorResponse');
      expect(methods).toContain('createDatabaseErrorResponse');
    });

    /**
     * Test Case 58: Kiểm tra return type consistency
     * Input: All formatter methods
     * Expected Output: All return ErrorResponse interface
     * Path Coverage: Return type validation
     */
    it('TC058: should return ErrorResponse type from all methods', () => {
      const results = [
        ErrorResponseFormatter.createErrorResponse('BAD_REQUEST', 'Test', mockRequest as Request),
        ErrorResponseFormatter.createValidationErrorResponse('Test', mockRequest as Request, []),
        ErrorResponseFormatter.createRateLimitErrorResponse(mockRequest as Request),
        ErrorResponseFormatter.createTimeoutErrorResponse(mockRequest as Request),
        ErrorResponseFormatter.createDatabaseErrorResponse('Test', mockRequest as Request),
      ];

      results.forEach((result) => {
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('message');
        expect(result).toHaveProperty('timestamp');
        expect(result).toHaveProperty('path');
        expect(result).toHaveProperty('method');
        expect(result).toHaveProperty('requestId');
      });
    });

    /**
     * Test Case 59: Kiểm tra với undefined values trong request
     * Input: Request with undefined properties
     * Expected Output: Proper defaults used
     * Path Coverage: Undefined handling
     */
    it('TC059: should handle undefined request properties', () => {
      const incompleteRequest = {
        url: undefined,
        method: undefined,
        requestId: undefined,
      } as any;

      const result = ErrorResponseFormatter.createErrorResponse(
        'BAD_REQUEST',
        'Test',
        incompleteRequest,
      );

      expect(result.path).toBeUndefined();
      expect(result.method).toBeUndefined();
      expect(result.requestId).toBe('unknown');
    });

    /**
     * Test Case 60: Kiểm tra immutability của response object
     * Input: ErrorResponse
     * Expected Output: Different object instances created each time
     * Path Coverage: Object construction validation
     */
    it('TC060: should create new response object each time', () => {
      const result1 = ErrorResponseFormatter.createErrorResponse(
        'BAD_REQUEST',
        'Test',
        mockRequest as Request,
      );

      const result2 = ErrorResponseFormatter.createErrorResponse(
        'BAD_REQUEST',
        'Test',
        mockRequest as Request,
      );

      // Should be different object instances
      expect(result1).not.toBe(result2);
      
      // Both should have valid structure
      expect(result1).toEqual(expect.objectContaining({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Test',
      }));
      
      expect(result2).toEqual(expect.objectContaining({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Test',
      }));
      
      // Timestamps should be valid ISO strings (may be same if created in same millisecond)
      expect(result1.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result2.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});
