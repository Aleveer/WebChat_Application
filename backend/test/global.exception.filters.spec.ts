import 'reflect-metadata';
import { GlobalExceptionFilter } from '../src/common/filters/global.exception.filters';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';
import { ERROR_CODES } from '../src/common/constants/app.constants';

describe('GlobalExceptionFilter - White Box Testing (Input-Output)', () => {
  let filter: GlobalExceptionFilter;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();

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
    jest.spyOn(filter['logger'], 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('HttpException Handling', () => {
    /**
     * Test Case 1: Kiểm tra HttpException với string message
     * Input: HttpException with string response
     * Expected Output: Proper error response with status
     * Path Coverage: HttpException -> string response
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
     * Test Case 2: Kiểm tra HttpException với object response
     * Input: HttpException with object response
     * Expected Output: Extract message from object
     * Path Coverage: HttpException -> object response
     */
    it('TC002: should handle HttpException with object response', () => {
      const exception = new HttpException(
        { message: 'Validation failed', errors: ['field1', 'field2'] },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.BAD_REQUEST,
          message: 'Validation failed',
        }),
      );
    });

    /**
     * Test Case 3: Kiểm tra HttpException với details
     * Input: HttpException with details in response
     * Expected Output: Details included in error response
     * Path Coverage: HttpException -> object with details
     */
    it('TC003: should include details from HttpException response', () => {
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
     * Test Case 4: Kiểm tra 400 Bad Request
     * Input: HttpException with 400 status
     * Expected Output: BAD_REQUEST error code
     * Path Coverage: Status 400
     */
    it('TC004: should handle 400 Bad Request', () => {
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
     * Test Case 5: Kiểm tra 401 Unauthorized
     * Input: HttpException with 401 status
     * Expected Output: UNAUTHORIZED error code
     * Path Coverage: Status 401
     */
    it('TC005: should handle 401 Unauthorized', () => {
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
     * Test Case 6: Kiểm tra 403 Forbidden
     * Input: HttpException with 403 status
     * Expected Output: FORBIDDEN error code
     * Path Coverage: Status 403
     */
    it('TC006: should handle 403 Forbidden', () => {
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
     * Test Case 7: Kiểm tra 404 Not Found
     * Input: HttpException with 404 status
     * Expected Output: NOT_FOUND error code
     * Path Coverage: Status 404
     */
    it('TC007: should handle 404 Not Found', () => {
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
     * Test Case 8: Kiểm tra 422 Unprocessable Entity
     * Input: HttpException with 422 status
     * Expected Output: VALIDATION_ERROR error code
     * Path Coverage: Status 422
     */
    it('TC008: should handle 422 Unprocessable Entity', () => {
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
     * Test Case 9: Kiểm tra HttpException without message in response object
     * Input: HttpException with object but no message
     * Expected Output: Fallback to exception.message
     * Path Coverage: Object response without message
     */
    it('TC009: should use exception.message when response object has no message', () => {
      const exception = new HttpException(
        { someField: 'value' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: exception.message,
        }),
      );
    });

    /**
     * Test Case 10: Kiểm tra HttpException với empty string message
     * Input: HttpException with empty string
     * Expected Output: Empty message accepted
     * Path Coverage: Empty message
     */
    it('TC010: should handle empty string message', () => {
      const exception = new HttpException('', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '',
        }),
      );
    });
  });

  describe('MongoError Handling', () => {
    /**
     * Test Case 11: Kiểm tra MongoError
     * Input: MongoError instance
     * Expected Output: DATABASE_ERROR with 400 status
     * Path Coverage: MongoError
     */
    it('TC011: should handle MongoError', () => {
      const mongoError = new MongoError('Duplicate key error');

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.DATABASE_ERROR,
          message: 'Database operation failed',
          details: 'Duplicate key error',
        }),
      );
    });

    /**
     * Test Case 12: Kiểm tra MongoError với different messages
     * Input: Various MongoError messages
     * Expected Output: Message in details
     * Path Coverage: Different MongoError scenarios
     */
    it('TC012: should include MongoError message in details', () => {
      const messages = [
        'Connection timeout',
        'Invalid collection',
        'Authentication failed',
      ];

      messages.forEach((msg) => {
        const mongoError = new MongoError(msg);
        filter.catch(mongoError, mockArgumentsHost);

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            details: msg,
          }),
        );
      });
    });

    /**
     * Test Case 13: Kiểm tra MongoError always returns 400
     * Input: MongoError
     * Expected Output: Always BAD_REQUEST status
     * Path Coverage: MongoError status
     */
    it('TC013: should always return BAD_REQUEST status for MongoError', () => {
      const mongoError = new MongoError('Error');

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Generic Error Handling', () => {
    /**
     * Test Case 14: Kiểm tra generic Error
     * Input: Standard Error instance
     * Expected Output: UNKNOWN_ERROR with 500 status
     * Path Coverage: Generic Error
     */
    it('TC014: should handle generic Error', () => {
      const error = new Error('Something went wrong');

      filter.catch(error, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.UNKNOWN_ERROR,
          message: 'Something went wrong',
        }),
      );
    });

    /**
     * Test Case 15: Kiểm tra TypeError
     * Input: TypeError instance
     * Expected Output: UNKNOWN_ERROR with error message
     * Path Coverage: TypeError extends Error
     */
    it('TC015: should handle TypeError', () => {
      const error = new TypeError('Cannot read property of undefined');

      filter.catch(error, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.UNKNOWN_ERROR,
          message: 'Cannot read property of undefined',
        }),
      );
    });

    /**
     * Test Case 16: Kiểm tra ReferenceError
     * Input: ReferenceError instance
     * Expected Output: UNKNOWN_ERROR
     * Path Coverage: ReferenceError extends Error
     */
    it('TC016: should handle ReferenceError', () => {
      const error = new ReferenceError('variable is not defined');

      filter.catch(error, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.UNKNOWN_ERROR,
          message: 'variable is not defined',
        }),
      );
    });

    /**
     * Test Case 17: Kiểm tra RangeError
     * Input: RangeError instance
     * Expected Output: UNKNOWN_ERROR
     * Path Coverage: RangeError extends Error
     */
    it('TC017: should handle RangeError', () => {
      const error = new RangeError('Invalid array length');

      filter.catch(error, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.UNKNOWN_ERROR,
          message: 'Invalid array length',
        }),
      );
    });
  });

  describe('Unknown Exception Handling', () => {
    /**
     * Test Case 18: Kiểm tra string exception
     * Input: String thrown as exception
     * Expected Output: INTERNAL_ERROR with default message
     * Path Coverage: Non-Error exception
     */
    it('TC018: should handle string exception', () => {
      filter.catch('Something went wrong', mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.INTERNAL_ERROR,
          message: 'Internal server error',
        }),
      );
    });

    /**
     * Test Case 19: Kiểm tra number exception
     * Input: Number thrown as exception
     * Expected Output: INTERNAL_ERROR
     * Path Coverage: Primitive exception
     */
    it('TC019: should handle number exception', () => {
      filter.catch(404, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.INTERNAL_ERROR,
          message: 'Internal server error',
        }),
      );
    });

    /**
     * Test Case 20: Kiểm tra null exception
     * Input: null thrown as exception
     * Expected Output: INTERNAL_ERROR
     * Path Coverage: Null exception
     */
    it('TC020: should handle null exception', () => {
      filter.catch(null, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.INTERNAL_ERROR,
          message: 'Internal server error',
        }),
      );
    });

    /**
     * Test Case 21: Kiểm tra undefined exception
     * Input: undefined thrown as exception
     * Expected Output: INTERNAL_ERROR
     * Path Coverage: Undefined exception
     */
    it('TC021: should handle undefined exception', () => {
      filter.catch(undefined, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.INTERNAL_ERROR,
          message: 'Internal server error',
        }),
      );
    });

    /**
     * Test Case 22: Kiểm tra object exception (not Error)
     * Input: Plain object thrown
     * Expected Output: INTERNAL_ERROR
     * Path Coverage: Plain object exception
     */
    it('TC022: should handle plain object exception', () => {
      filter.catch({ code: 'ERROR', msg: 'Failed' }, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.INTERNAL_ERROR,
          message: 'Internal server error',
        }),
      );
    });
  });

  describe('Logging Behavior', () => {
    /**
     * Test Case 23: Kiểm tra logging for HttpException
     * Input: HttpException
     * Expected Output: Logger called with error details
     * Path Coverage: HttpException logging
     */
    it('TC023: should log HttpException with details', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);
      const loggerSpy = jest.spyOn(filter['logger'], 'error');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('NOT_FOUND'),
        expect.any(String),
      );
    });

    /**
     * Test Case 24: Kiểm tra logging includes request details
     * Input: Any exception
     * Expected Output: Log includes method and URL
     * Path Coverage: Request details in log
     */
    it('TC024: should include request method and URL in log', () => {
      const exception = new Error('Test error');
      const loggerSpy = jest.spyOn(filter['logger'], 'error');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/test'),
        expect.any(String),
      );
    });

    /**
     * Test Case 25: Kiểm tra logging with stack trace
     * Input: Error with stack
     * Expected Output: Stack trace logged
     * Path Coverage: Stack trace logging
     */
    it('TC025: should log stack trace for Error instances', () => {
      const error = new Error('Test error');
      const loggerSpy = jest.spyOn(filter['logger'], 'error');

      filter.catch(error, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );
    });

    /**
     * Test Case 26: Kiểm tra logging without stack trace
     * Input: Non-Error exception
     * Expected Output: No stack trace (undefined)
     * Path Coverage: No stack trace
     */
    it('TC026: should log without stack trace for non-Error exceptions', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'error');

      filter.catch('string exception', mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(expect.any(String), undefined);
    });
  });

  describe('Response Structure', () => {
    /**
     * Test Case 27: Kiểm tra response structure completeness
     * Input: Any exception
     * Expected Output: Complete error response structure
     * Path Coverage: Response structure
     */
    it('TC027: should return complete error response structure', () => {
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
     * Test Case 28: Kiểm tra timestamp format
     * Input: Any exception
     * Expected Output: ISO format timestamp
     * Path Coverage: Timestamp
     */
    it('TC028: should include ISO timestamp in response', () => {
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    /**
     * Test Case 29: Kiểm tra success field always false
     * Input: Any exception
     * Expected Output: success = false
     * Path Coverage: Success field
     */
    it('TC029: should always set success to false', () => {
      const exceptions = [
        new HttpException('Error', HttpStatus.BAD_REQUEST),
        new MongoError('DB Error'),
        new Error('Generic error'),
      ];

      exceptions.forEach((exception) => {
        filter.catch(exception, mockArgumentsHost);

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
          }),
        );
      });
    });

    /**
     * Test Case 30: Kiểm tra requestId in response
     * Input: Request with requestId
     * Expected Output: RequestId included
     * Path Coverage: RequestId
     */
    it('TC030: should include requestId in response', () => {
      const exception = new Error('Test');

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
     * Test Case 31: Kiểm tra với different request methods
     * Input: Various HTTP methods
     * Expected Output: Method reflected in response
     * Path Coverage: Different methods
     */
    it('TC031: should handle different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach((method) => {
        mockRequest.method = method;
        const exception = new Error('Test');

        filter.catch(exception, mockArgumentsHost);

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            method: method,
          }),
        );
      });
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
        const exception = new Error('Test');

        filter.catch(exception, mockArgumentsHost);

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            path: url,
          }),
        );
      });
    });

    /**
     * Test Case 33: Kiểm tra without requestId
     * Input: Request without requestId
     * Expected Output: 'unknown' requestId
     * Path Coverage: Missing requestId
     */
    it('TC033: should use "unknown" when requestId is missing', () => {
      delete mockRequest.requestId;
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    /**
     * Test Case 34: Kiểm tra với null details
     * Input: Exception without details
     * Expected Output: details = null
     * Path Coverage: Null details
     */
    it('TC034: should set details to null when not provided', () => {
      const exception = new HttpException('Error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          details: null,
        }),
      );
    });

    /**
     * Test Case 35: Kiểm tra HttpException with nested object response
     * Input: Deeply nested response object
     * Expected Output: Proper extraction
     * Path Coverage: Nested object
     */
    it('TC035: should handle nested object in HttpException response', () => {
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
  });

  describe('Status Code Mapping', () => {
    /**
     * Test Case 36: Kiểm tra 409 Conflict
     * Input: HttpException with 409
     * Expected Output: CONFLICT error code
     * Path Coverage: 409 status
     */
    it('TC036: should handle 409 Conflict', () => {
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
     * Test Case 37: Kiểm tra 429 Too Many Requests
     * Input: HttpException with 429
     * Expected Output: RATE_LIMIT_EXCEEDED error code
     * Path Coverage: 429 status
     */
    it('TC037: should handle 429 Too Many Requests', () => {
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
     * Test Case 38: Kiểm tra 408 Request Timeout
     * Input: HttpException with 408
     * Expected Output: REQUEST_TIMEOUT error code
     * Path Coverage: 408 status
     */
    it('TC038: should handle 408 Request Timeout', () => {
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
     * Test Case 39: Kiểm tra 500 Internal Server Error
     * Input: HttpException with 500
     * Expected Output: INTERNAL_ERROR error code
     * Path Coverage: 500 status
     */
    it('TC039: should handle 500 Internal Server Error', () => {
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
     * Test Case 40: Kiểm tra unknown HTTP status
     * Input: HttpException with unmapped status
     * Expected Output: UNKNOWN_ERROR error code
     * Path Coverage: Unmapped status
     */
    it('TC040: should handle unmapped HTTP status codes', () => {
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

  describe('Real-world Scenarios', () => {
    /**
     * Test Case 41: Kiểm tra validation error scenario
     * Input: Validation exception
     * Expected Output: Proper validation error response
     * Path Coverage: Validation scenario
     */
    it('TC041: should handle validation error scenario', () => {
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
     * Test Case 42: Kiểm tra authentication failure scenario
     * Input: 401 Unauthorized
     * Expected Output: Auth error response
     * Path Coverage: Auth failure
     */
    it('TC042: should handle authentication failure', () => {
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
     * Test Case 43: Kiểm tra resource not found scenario
     * Input: 404 Not Found
     * Expected Output: Not found error
     * Path Coverage: Resource not found
     */
    it('TC043: should handle resource not found', () => {
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
     * Test Case 44: Kiểm tra database duplicate key error
     * Input: MongoError for duplicate key
     * Expected Output: Database error response
     * Path Coverage: DB duplicate
     */
    it('TC044: should handle database duplicate key error', () => {
      const mongoError = new MongoError('E11000 duplicate key error');

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.DATABASE_ERROR,
          message: 'Database operation failed',
          details: 'E11000 duplicate key error',
        }),
      );
    });

    /**
     * Test Case 45: Kiểm tra permission denied scenario
     * Input: 403 Forbidden
     * Expected Output: Forbidden error
     * Path Coverage: Permission denied
     */
    it('TC045: should handle permission denied', () => {
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
     * Test Case 46: Kiểm tra conflict scenario (duplicate resource)
     * Input: 409 Conflict
     * Expected Output: Conflict error
     * Path Coverage: Conflict
     */
    it('TC046: should handle resource conflict', () => {
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
     * Test Case 47: Kiểm tra rate limiting scenario
     * Input: 429 Too Many Requests
     * Expected Output: Rate limit error
     * Path Coverage: Rate limit
     */
    it('TC047: should handle rate limiting', () => {
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
     * Test Case 48: Kiểm tra timeout scenario
     * Input: 408 Request Timeout
     * Expected Output: Timeout error
     * Path Coverage: Timeout
     */
    it('TC048: should handle request timeout', () => {
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
     * Test Case 49: Kiểm tra unexpected error scenario
     * Input: Generic Error
     * Expected Output: Unknown error with 500
     * Path Coverage: Unexpected error
     */
    it('TC049: should handle unexpected errors', () => {
      const error = new Error('Unexpected error occurred');

      filter.catch(error, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.UNKNOWN_ERROR,
          message: 'Unexpected error occurred',
        }),
      );
    });

    /**
     * Test Case 50: Kiểm tra POST request error
     * Input: POST request with error
     * Expected Output: Error with POST method
     * Path Coverage: POST request
     */
    it('TC050: should handle POST request errors', () => {
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
     * Test Case 51: Kiểm tra DELETE request error
     * Input: DELETE request with error
     * Expected Output: Error with DELETE method
     * Path Coverage: DELETE request
     */
    it('TC051: should handle DELETE request errors', () => {
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
     * Test Case 52: Kiểm tra PATCH request error
     * Input: PATCH request with error
     * Expected Output: Error with PATCH method
     * Path Coverage: PATCH request
     */
    it('TC052: should handle PATCH request errors', () => {
      mockRequest.method = 'PATCH';
      mockRequest.url = '/api/users/123';

      const exception = new HttpException(
        'Invalid update data',
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
     * Test Case 53: Kiểm tra URL with query parameters
     * Input: URL with query string
     * Expected Output: Full URL preserved
     * Path Coverage: Query parameters
     */
    it('TC053: should preserve URL with query parameters', () => {
      mockRequest.url = '/api/users?page=1&limit=10';

      const exception = new Error('Error');

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/users?page=1&limit=10',
        }),
      );
    });

    /**
     * Test Case 54: Kiểm tra multiple exceptions in sequence
     * Input: Multiple different exceptions
     * Expected Output: Each handled independently
     * Path Coverage: Multiple exceptions
     */
    it('TC054: should handle multiple exceptions independently', () => {
      const exceptions = [
        new HttpException('Not found', HttpStatus.NOT_FOUND),
        new MongoError('DB error'),
        new Error('Generic error'),
      ];

      exceptions.forEach((exception, index) => {
        filter.catch(exception, mockArgumentsHost);
        expect(mockStatus).toHaveBeenCalledTimes(index + 1);
        expect(mockJson).toHaveBeenCalledTimes(index + 1);
      });
    });

    /**
     * Test Case 55: Kiểm tra exception with Unicode message
     * Input: Exception with Unicode
     * Expected Output: Unicode preserved
     * Path Coverage: Unicode
     */
    it('TC055: should handle Unicode in error messages', () => {
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

    /**
     * Test Case 56: Kiểm tra exception with very long message
     * Input: Very long error message
     * Expected Output: Long message handled
     * Path Coverage: Long message
     */
    it('TC056: should handle very long error messages', () => {
      const longMessage = 'Error: ' + 'x'.repeat(1000);
      const exception = new HttpException(longMessage, HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: longMessage,
        }),
      );
    });

    /**
     * Test Case 57: Kiểm tra MongoError with empty message
     * Input: MongoError with empty string
     * Expected Output: Empty string in details
     * Path Coverage: Empty MongoError message
     */
    it('TC057: should handle MongoError with empty message', () => {
      const mongoError = new MongoError('');

      filter.catch(mongoError, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          details: '',
        }),
      );
    });

    /**
     * Test Case 58: Kiểm tra custom Error subclass
     * Input: Custom Error class
     * Expected Output: Handled as Error
     * Path Coverage: Custom Error
     */
    it('TC058: should handle custom Error subclasses', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const exception = new CustomError('Custom error occurred');

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: ERROR_CODES.UNKNOWN_ERROR,
          message: 'Custom error occurred',
        }),
      );
    });

    /**
     * Test Case 59: Kiểm tra exception during different request paths
     * Input: Various API endpoints
     * Expected Output: Correct path in response
     * Path Coverage: Different endpoints
     */
    it('TC059: should handle errors on different API endpoints', () => {
      const endpoints = [
        '/api/auth/login',
        '/api/users/profile',
        '/api/posts/123/comments',
        '/health',
      ];

      endpoints.forEach((endpoint) => {
        mockRequest.url = endpoint;
        const exception = new Error('Error');

        filter.catch(exception, mockArgumentsHost);

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            path: endpoint,
          }),
        );
      });
    });

    /**
     * Test Case 60: Kiểm tra complete error handling flow
     * Input: HttpException with all properties
     * Expected Output: Complete error flow executed
     * Path Coverage: Complete flow
     */
    it('TC060: should execute complete error handling flow', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'error');

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
  });
});
