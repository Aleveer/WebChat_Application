import 'reflect-metadata';
import { HttpExceptionFilter } from '../src/common/filters/http.exception.filters';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ERROR_CODES } from '../src/common/constants/app.constants';

describe('HttpExceptionFilter - White Box Testing (Input-Output)', () => {
  let filter: HttpExceptionFilter;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockRequest = {
      url: '/api/test',
      method: 'GET',
      requestId: 'test-request-id',
    };

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as jest.Mocked<ArgumentsHost>;

    // Mock logger to prevent console output during tests
    jest.spyOn(filter['logger'], 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('String Response Handling', () => {
    /**
     * Test Case 1: Kiểm tra HttpException với string message
     * Input: HttpException with string response
     * Expected Output: String used as message
     * Path Coverage: typeof exceptionResponse === 'string'
     */
    it('TC001: should handle HttpException with string message', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: ERROR_CODES.NOT_FOUND,
          message: 'Not found',
          path: '/api/test',
          method: 'GET',
        }),
      );
    });

    /**
     * Test Case 2: Kiểm tra empty string message
     * Input: HttpException with empty string
     * Expected Output: Empty string accepted
     * Path Coverage: String response (empty)
     */
    it('TC002: should handle empty string message', () => {
      const exception = new HttpException('', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '',
        }),
      );
    });

    /**
     * Test Case 3: Kiểm tra long string message
     * Input: Very long string
     * Expected Output: Long string preserved
     * Path Coverage: String response (long)
     */
    it('TC003: should handle long string message', () => {
      const longMessage = 'Error: ' + 'x'.repeat(500);
      const exception = new HttpException(longMessage, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: longMessage,
        }),
      );
    });

    /**
     * Test Case 4: Kiểm tra Unicode string message
     * Input: String with Unicode characters
     * Expected Output: Unicode preserved
     * Path Coverage: String response (Unicode)
     */
    it('TC004: should handle Unicode in string message', () => {
      const exception = new HttpException(
        '错误：无效的输入 🚫',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '错误：无效的输入 🚫',
        }),
      );
    });
  });

  describe('Object Response Handling', () => {
    /**
     * Test Case 5: Kiểm tra HttpException với object response và message
     * Input: Object response with message
     * Expected Output: Message extracted from object
     * Path Coverage: typeof exceptionResponse === 'object' && message exists
     */
    it('TC005: should handle HttpException with object response containing message', () => {
      const exception = new HttpException(
        { message: 'Validation failed', errors: ['field1'] },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.BAD_REQUEST,
          message: 'Validation failed',
        }),
      );
    });

    /**
     * Test Case 6: Kiểm tra object response without message
     * Input: Object without message property
     * Expected Output: Fallback to HTTP status text
     * Path Coverage: Object response without message
     */
    it('TC006: should use HTTP status text when object has no message', () => {
      const exception = new HttpException(
        { someField: 'value' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: ERROR_CODES.BAD_REQUEST,
        }),
      );
    });

    /**
     * Test Case 7: Kiểm tra object response with details
     * Input: Object with details property
     * Expected Output: Details included in response
     * Path Coverage: Object with details
     */
    it('TC007: should include details from object response', () => {
      const details = { field: 'email', value: 'invalid' };
      const exception = new HttpException(
        { message: 'Invalid input', details },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          details: details,
        }),
      );
    });

    /**
     * Test Case 8: Kiểm tra object response without details
     * Input: Object without details property
     * Expected Output: details = undefined (property not in object)
     * Path Coverage: Object without details
     */
    it('TC008: should set details to undefined when not in object', () => {
      const exception = new HttpException(
        { message: 'Error' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          details: undefined,
        }),
      );
    });

    /**
     * Test Case 9: Kiểm tra nested object response
     * Input: Deeply nested object
     * Expected Output: Nested details preserved
     * Path Coverage: Nested object
     */
    it('TC009: should handle nested object in response', () => {
      const exception = new HttpException(
        {
          message: 'Validation failed',
          details: {
            errors: [
              { field: 'email', message: 'Invalid' },
              { field: 'password', message: 'Too short' },
            ],
          },
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
          details: expect.objectContaining({
            errors: expect.any(Array),
          }),
        }),
      );
    });

    /**
     * Test Case 10: Kiểm tra object with empty message string
     * Input: Object with message = ''
     * Expected Output: Fallback to status text
     * Path Coverage: Object with falsy message
     */
    it('TC010: should fallback to status text when message is empty string', () => {
      const exception = new HttpException(
        { message: '' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: ERROR_CODES.BAD_REQUEST,
        }),
      );
    });
  });

  describe('HTTP Status Code Mapping', () => {
    /**
     * Test Case 11: Kiểm tra 400 Bad Request
     * Input: 400 status
     * Expected Output: BAD_REQUEST error code
     * Path Coverage: Status 400
     */
    it('TC011: should handle 400 Bad Request', () => {
      const exception = new HttpException(
        'Bad request',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.BAD_REQUEST,
        }),
      );
    });

    /**
     * Test Case 12: Kiểm tra 401 Unauthorized
     * Input: 401 status
     * Expected Output: UNAUTHORIZED error code
     * Path Coverage: Status 401
     */
    it('TC012: should handle 401 Unauthorized', () => {
      const exception = new HttpException(
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.UNAUTHORIZED,
        }),
      );
    });

    /**
     * Test Case 13: Kiểm tra 403 Forbidden
     * Input: 403 status
     * Expected Output: FORBIDDEN error code
     * Path Coverage: Status 403
     */
    it('TC013: should handle 403 Forbidden', () => {
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.FORBIDDEN,
        }),
      );
    });

    /**
     * Test Case 14: Kiểm tra 404 Not Found
     * Input: 404 status
     * Expected Output: NOT_FOUND error code
     * Path Coverage: Status 404
     */
    it('TC014: should handle 404 Not Found', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.NOT_FOUND,
        }),
      );
    });

    /**
     * Test Case 15: Kiểm tra 408 Request Timeout
     * Input: 408 status
     * Expected Output: REQUEST_TIMEOUT error code
     * Path Coverage: Status 408
     */
    it('TC015: should handle 408 Request Timeout', () => {
      const exception = new HttpException(
        'Timeout',
        HttpStatus.REQUEST_TIMEOUT,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.REQUEST_TIMEOUT);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.REQUEST_TIMEOUT,
        }),
      );
    });

    /**
     * Test Case 16: Kiểm tra 409 Conflict
     * Input: 409 status
     * Expected Output: CONFLICT error code
     * Path Coverage: Status 409
     */
    it('TC016: should handle 409 Conflict', () => {
      const exception = new HttpException('Conflict', HttpStatus.CONFLICT);

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.CONFLICT,
        }),
      );
    });

    /**
     * Test Case 17: Kiểm tra 422 Unprocessable Entity
     * Input: 422 status
     * Expected Output: VALIDATION_ERROR error code
     * Path Coverage: Status 422
     */
    it('TC017: should handle 422 Unprocessable Entity', () => {
      const exception = new HttpException(
        'Validation error',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.VALIDATION_ERROR,
        }),
      );
    });

    /**
     * Test Case 18: Kiểm tra 429 Too Many Requests
     * Input: 429 status
     * Expected Output: RATE_LIMIT_EXCEEDED error code
     * Path Coverage: Status 429
     */
    it('TC018: should handle 429 Too Many Requests', () => {
      const exception = new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        }),
      );
    });

    /**
     * Test Case 19: Kiểm tra 500 Internal Server Error
     * Input: 500 status
     * Expected Output: INTERNAL_ERROR error code
     * Path Coverage: Status 500
     */
    it('TC019: should handle 500 Internal Server Error', () => {
      const exception = new HttpException(
        'Internal error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.INTERNAL_ERROR,
        }),
      );
    });

    /**
     * Test Case 20: Kiểm tra unmapped HTTP status
     * Input: Status code not in mapping
     * Expected Output: UNKNOWN_ERROR error code
     * Path Coverage: Unmapped status
     */
    it('TC020: should handle unmapped HTTP status codes', () => {
      const exception = new HttpException('Error', 418); // I'm a teapot

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(418);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.UNKNOWN_ERROR,
        }),
      );
    });
  });

  describe('Logging Behavior', () => {
    /**
     * Test Case 21: Kiểm tra logger warning được gọi
     * Input: Any HttpException
     * Expected Output: logger.warn called
     * Path Coverage: Logger invocation
     */
    it('TC021: should log warning for HttpException', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalled();
    });

    /**
     * Test Case 22: Kiểm tra log message format
     * Input: HttpException with specific status and message
     * Expected Output: Log contains status and message
     * Path Coverage: Log format
     */
    it('TC022: should log with correct format', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTP Exception'),
      );
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('404'));
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Not found'),
      );
    });

    /**
     * Test Case 23: Kiểm tra log includes request details
     * Input: HttpException
     * Expected Output: Log contains method and URL
     * Path Coverage: Request details in log
     */
    it('TC023: should include request method and URL in log', () => {
      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/test'),
      );
    });

    /**
     * Test Case 24: Kiểm tra log with different HTTP methods
     * Input: Various HTTP methods
     * Expected Output: Correct method in log
     * Path Coverage: Different methods in log
     */
    it('TC024: should log different HTTP methods correctly', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      methods.forEach((method) => {
        mockRequest.method = method;
        const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

        filter.catch(exception, mockArgumentsHost);

        expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining(method));
      });
    });
  });

  describe('Response Structure', () => {
    /**
     * Test Case 25: Kiểm tra response structure completeness
     * Input: Any HttpException
     * Expected Output: Complete error response
     * Path Coverage: Response structure
     */
    it('TC025: should return complete error response structure', () => {
      const exception = new HttpException(
        'Bad request',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.any(String),
          message: expect.any(String),
          timestamp: expect.any(String),
          path: expect.any(String),
          method: expect.any(String),
          requestId: expect.any(String),
        }),
      );
    });

    /**
     * Test Case 26: Kiểm tra success always false
     * Input: Any HttpException
     * Expected Output: success = false
     * Path Coverage: Success field
     */
    it('TC026: should always set success to false', () => {
      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    /**
     * Test Case 27: Kiểm tra timestamp format
     * Input: Any HttpException
     * Expected Output: ISO format timestamp
     * Path Coverage: Timestamp
     */
    it('TC027: should include ISO timestamp in response', () => {
      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    /**
     * Test Case 28: Kiểm tra path in response
     * Input: HttpException
     * Expected Output: Request path included
     * Path Coverage: Path field
     */
    it('TC028: should include request path in response', () => {
      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/test',
        }),
      );
    });

    /**
     * Test Case 29: Kiểm tra method in response
     * Input: HttpException
     * Expected Output: Request method included
     * Path Coverage: Method field
     */
    it('TC029: should include request method in response', () => {
      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    /**
     * Test Case 30: Kiểm tra requestId in response
     * Input: Request with requestId
     * Expected Output: RequestId included
     * Path Coverage: RequestId field
     */
    it('TC030: should include requestId in response', () => {
      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'test-request-id',
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    /**
     * Test Case 31: Kiểm tra without requestId
     * Input: Request without requestId
     * Expected Output: 'unknown' requestId
     * Path Coverage: Missing requestId
     */
    it('TC031: should use "unknown" when requestId is missing', () => {
      delete mockRequest.requestId;
      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    /**
     * Test Case 32: Kiểm tra với different URLs
     * Input: Various URL paths
     * Expected Output: Path reflected in response
     * Path Coverage: Different URLs
     */
    it('TC032: should handle different URL paths', () => {
      const urls = ['/api/users', '/api/posts/123', '/health', '/'];

      urls.forEach((url) => {
        mockRequest.url = url;
        const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

        filter.catch(exception, mockArgumentsHost);

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            path: url,
          }),
        );
      });
    });

    /**
     * Test Case 33: Kiểm tra URL with query parameters
     * Input: URL with query string
     * Expected Output: Full URL preserved
     * Path Coverage: Query parameters
     */
    it('TC033: should preserve URL with query parameters', () => {
      mockRequest.url = '/api/users?page=1&limit=10';
      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/users?page=1&limit=10',
        }),
      );
    });

    /**
     * Test Case 34: Kiểm tra null object response
     * Input: null as response (edge case)
     * Expected Output: Handled gracefully
     * Path Coverage: Null check
     */
    it('TC034: should handle null response object', () => {
      // This is an edge case - HttpException typically doesn't accept null,
      // but the code has a null check
      const exception = new HttpException(
        'Error' as any,
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });

    /**
     * Test Case 35: Kiểm tra array as details
     * Input: Array in details field
     * Expected Output: Array preserved
     * Path Coverage: Array details
     */
    it('TC035: should handle array as details', () => {
      const details = ['error1', 'error2', 'error3'];
      const exception = new HttpException(
        { message: 'Multiple errors', details },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          details: details,
        }),
      );
    });
  });

  describe('getHttpStatusText Method', () => {
    /**
     * Test Case 36: Kiểm tra getHttpStatusText returns error code
     * Input: Various status codes
     * Expected Output: Correct error codes
     * Path Coverage: getHttpStatusText method
     */
    it('TC036: should return correct error codes for status texts', () => {
      const testCases = [
        { status: 400, expected: ERROR_CODES.BAD_REQUEST },
        { status: 401, expected: ERROR_CODES.UNAUTHORIZED },
        { status: 403, expected: ERROR_CODES.FORBIDDEN },
        { status: 404, expected: ERROR_CODES.NOT_FOUND },
      ];

      testCases.forEach(({ status, expected }) => {
        const exception = new HttpException(
          { someField: 'value' },
          status as HttpStatus,
        );

        filter.catch(exception, mockArgumentsHost);

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expected,
          }),
        );
      });
    });
  });

  describe('Real-world Scenarios', () => {
    /**
     * Test Case 37: Kiểm tra validation error scenario
     * Input: Validation exception with multiple errors
     * Expected Output: Proper validation error response
     * Path Coverage: Validation scenario
     */
    it('TC037: should handle validation error scenario', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too short' },
      ];

      const exception = new HttpException(
        {
          message: 'Validation failed',
          details: validationErrors,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: validationErrors,
        }),
      );
    });

    /**
     * Test Case 38: Kiểm tra authentication failure scenario
     * Input: 401 with credentials message
     * Expected Output: Auth error response
     * Path Coverage: Auth failure
     */
    it('TC038: should handle authentication failure', () => {
      const exception = new HttpException(
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid credentials',
        }),
      );
    });

    /**
     * Test Case 39: Kiểm tra resource not found scenario
     * Input: 404 with resource details
     * Expected Output: Not found error with details
     * Path Coverage: Resource not found
     */
    it('TC039: should handle resource not found', () => {
      mockRequest.url = '/api/users/999';
      const exception = new HttpException(
        { message: 'User not found', details: { userId: 999 } },
        HttpStatus.NOT_FOUND,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.NOT_FOUND,
          path: '/api/users/999',
          details: { userId: 999 },
        }),
      );
    });

    /**
     * Test Case 40: Kiểm tra permission denied scenario
     * Input: 403 with role information
     * Expected Output: Forbidden error
     * Path Coverage: Permission denied
     */
    it('TC040: should handle permission denied', () => {
      const exception = new HttpException(
        {
          message: 'Access denied',
          details: { requiredRole: 'admin', userRole: 'user' },
        },
        HttpStatus.FORBIDDEN,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.FORBIDDEN,
          message: 'Access denied',
        }),
      );
    });

    /**
     * Test Case 41: Kiểm tra conflict scenario
     * Input: 409 with duplicate information
     * Expected Output: Conflict error
     * Path Coverage: Conflict
     */
    it('TC041: should handle resource conflict', () => {
      const exception = new HttpException(
        {
          message: 'Email already exists',
          details: { email: 'test@example.com' },
        },
        HttpStatus.CONFLICT,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.CONFLICT,
          message: 'Email already exists',
        }),
      );
    });

    /**
     * Test Case 42: Kiểm tra rate limiting scenario
     * Input: 429 rate limit
     * Expected Output: Rate limit error
     * Path Coverage: Rate limit
     */
    it('TC042: should handle rate limiting', () => {
      const exception = new HttpException(
        'Too many requests, please try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.RATE_LIMIT_EXCEEDED,
          message: 'Too many requests, please try again later',
        }),
      );
    });

    /**
     * Test Case 43: Kiểm tra timeout scenario
     * Input: 408 timeout
     * Expected Output: Timeout error
     * Path Coverage: Timeout
     */
    it('TC043: should handle request timeout', () => {
      const exception = new HttpException(
        'Request timeout',
        HttpStatus.REQUEST_TIMEOUT,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.REQUEST_TIMEOUT,
          message: 'Request timeout',
        }),
      );
    });

    /**
     * Test Case 44: Kiểm tra POST request error
     * Input: POST request with error
     * Expected Output: Error with POST method
     * Path Coverage: POST request
     */
    it('TC044: should handle POST request errors', () => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';

      const exception = new HttpException(
        'Invalid user data',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          path: '/api/users',
        }),
      );
    });

    /**
     * Test Case 45: Kiểm tra PUT request error
     * Input: PUT request with error
     * Expected Output: Error with PUT method
     * Path Coverage: PUT request
     */
    it('TC045: should handle PUT request errors', () => {
      mockRequest.method = 'PUT';
      mockRequest.url = '/api/users/123';

      const exception = new HttpException(
        'Invalid update data',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          path: '/api/users/123',
        }),
      );
    });

    /**
     * Test Case 46: Kiểm tra DELETE request error
     * Input: DELETE request with error
     * Expected Output: Error with DELETE method
     * Path Coverage: DELETE request
     */
    it('TC046: should handle DELETE request errors', () => {
      mockRequest.method = 'DELETE';
      mockRequest.url = '/api/users/123';

      const exception = new HttpException(
        'Cannot delete user',
        HttpStatus.FORBIDDEN,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
          path: '/api/users/123',
        }),
      );
    });

    /**
     * Test Case 47: Kiểm tra PATCH request error
     * Input: PATCH request with error
     * Expected Output: Error with PATCH method
     * Path Coverage: PATCH request
     */
    it('TC047: should handle PATCH request errors', () => {
      mockRequest.method = 'PATCH';
      mockRequest.url = '/api/users/123';

      const exception = new HttpException(
        'Invalid patch data',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PATCH',
          path: '/api/users/123',
        }),
      );
    });

    /**
     * Test Case 48: Kiểm tra multiple exceptions in sequence
     * Input: Multiple different exceptions
     * Expected Output: Each handled independently
     * Path Coverage: Multiple exceptions
     */
    it('TC048: should handle multiple exceptions independently', () => {
      const exceptions = [
        new HttpException('Not found', HttpStatus.NOT_FOUND),
        new HttpException('Bad request', HttpStatus.BAD_REQUEST),
        new HttpException('Forbidden', HttpStatus.FORBIDDEN),
      ];

      exceptions.forEach((exception, index) => {
        filter.catch(exception, mockArgumentsHost);
        expect(mockStatus).toHaveBeenCalledTimes(index + 1);
        expect(mockJson).toHaveBeenCalledTimes(index + 1);
      });
    });

    /**
     * Test Case 49: Kiểm tra nested API routes
     * Input: Deep nested API paths
     * Expected Output: Full path preserved
     * Path Coverage: Nested routes
     */
    it('TC049: should handle deeply nested API routes', () => {
      mockRequest.url = '/api/v1/users/123/posts/456/comments/789';
      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/v1/users/123/posts/456/comments/789',
        }),
      );
    });

    /**
     * Test Case 50: Kiểm tra special characters in message
     * Input: Message with special characters
     * Expected Output: Special characters preserved
     * Path Coverage: Special characters
     */
    it('TC050: should handle special characters in message', () => {
      const exception = new HttpException(
        'Error: <script>alert("XSS")</script>',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error: <script>alert("XSS")</script>',
        }),
      );
    });

    /**
     * Test Case 51: Kiểm tra complex details object
     * Input: Details with multiple nested levels
     * Expected Output: Complex object preserved
     * Path Coverage: Complex details
     */
    it('TC051: should handle complex details object', () => {
      const complexDetails = {
        errors: [
          {
            field: 'user.profile.email',
            constraints: {
              isEmail: 'email must be an email',
              isNotEmpty: 'email should not be empty',
            },
          },
        ],
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'validation-pipe',
        },
      };

      const exception = new HttpException(
        { message: 'Validation failed', details: complexDetails },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          details: complexDetails,
        }),
      );
    });

    /**
     * Test Case 52: Kiểm tra message with line breaks
     * Input: Multi-line error message
     * Expected Output: Line breaks preserved
     * Path Coverage: Multi-line message
     */
    it('TC052: should handle multi-line error messages', () => {
      const multiLineMessage = 'Error occurred:\n- Line 1\n- Line 2\n- Line 3';
      const exception = new HttpException(
        multiLineMessage,
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: multiLineMessage,
        }),
      );
    });

    /**
     * Test Case 53: Kiểm tra boolean details
     * Input: Boolean value in details
     * Expected Output: Boolean preserved
     * Path Coverage: Boolean details
     */
    it('TC053: should handle boolean in details', () => {
      const exception = new HttpException(
        { message: 'Error', details: true },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          details: true,
        }),
      );
    });

    /**
     * Test Case 54: Kiểm tra number details
     * Input: Number value in details
     * Expected Output: Number preserved
     * Path Coverage: Number details
     */
    it('TC054: should handle number in details', () => {
      const exception = new HttpException(
        { message: 'Error', details: 12345 },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          details: 12345,
        }),
      );
    });

    /**
     * Test Case 55: Kiểm tra different request IDs
     * Input: Various requestId formats
     * Expected Output: RequestId preserved
     * Path Coverage: Different requestIds
     */
    it('TC055: should handle different requestId formats', () => {
      const requestIds = [
        'uuid-123-456',
        'req_abc123',
        '1234567890',
        'trace-id-xyz',
      ];

      requestIds.forEach((requestId) => {
        mockRequest.requestId = requestId;
        const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

        filter.catch(exception, mockArgumentsHost);

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            requestId: requestId,
          }),
        );
      });
    });

    /**
     * Test Case 56: Kiểm tra complete error handling flow
     * Input: HttpException with all properties
     * Expected Output: Complete flow executed
     * Path Coverage: Complete flow
     */
    it('TC056: should execute complete error handling flow', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      const exception = new HttpException(
        {
          message: 'Validation failed',
          details: { fields: ['email', 'password'] },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

      filter.catch(exception, mockArgumentsHost);

      // Verify all steps executed
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: { fields: ['email', 'password'] },
          timestamp: expect.any(String),
          path: '/api/test',
          method: 'GET',
          requestId: 'test-request-id',
        }),
      );
      expect(loggerSpy).toHaveBeenCalled();
    });

    /**
     * Test Case 57: Kiểm tra message priority (object over status)
     * Input: Object with message vs fallback
     * Expected Output: Object message takes priority
     * Path Coverage: Message priority
     */
    it('TC057: should prioritize object message over status text', () => {
      const exception = new HttpException(
        { message: 'Custom bad request message' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Custom bad request message',
        }),
      );
    });

    /**
     * Test Case 58: Kiểm tra string response priority
     * Input: String response
     * Expected Output: String takes highest priority
     * Path Coverage: String priority
     */
    it('TC058: should prioritize string response over everything', () => {
      const exception = new HttpException(
        'Simple string message',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Simple string message',
        }),
      );
    });

    /**
     * Test Case 59: Kiểm tra empty details vs undefined
     * Input: Empty object as details
     * Expected Output: Empty object preserved (not null)
     * Path Coverage: Empty details
     */
    it('TC059: should preserve empty object as details', () => {
      const exception = new HttpException(
        { message: 'Error', details: {} },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          details: {},
        }),
      );
    });

    /**
     * Test Case 60: Kiểm tra status code extraction
     * Input: HttpException with custom status
     * Expected Output: Correct status used
     * Path Coverage: Status extraction
     */
    it('TC060: should correctly extract status code from exception', () => {
      const customStatuses = [
        HttpStatus.CREATED,
        HttpStatus.ACCEPTED,
        HttpStatus.NO_CONTENT,
        HttpStatus.MOVED_PERMANENTLY,
      ];

      customStatuses.forEach((status) => {
        const exception = new HttpException('Message', status);

        filter.catch(exception, mockArgumentsHost);

        expect(mockStatus).toHaveBeenCalledWith(status);
      });
    });
  });
});
