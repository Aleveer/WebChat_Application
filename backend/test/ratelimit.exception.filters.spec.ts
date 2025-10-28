import 'reflect-metadata';
import { RateLimitExceptionFilter } from '../src/common/filters/ratelimit.exception.filters';
import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

describe('RateLimitExceptionFilter - White Box Testing (Input-Output)', () => {
  let filter: RateLimitExceptionFilter;
  let mockRequest: any; // Using any to allow IP modification
  let mockResponse: Partial<Response>;
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    filter = new RateLimitExceptionFilter();

    mockRequest = {
      url: '/api/test',
      method: 'GET',
      requestId: 'test-request-id',
      ip: '192.168.1.1',
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

  describe('Rate Limit Exception Handling', () => {
    /**
     * Test Case 1: Kiểm tra rate limit exception
     * Input: Exception with 'Rate limit' in message
     * Expected Output: 429 response with RATE_LIMIT_EXCEEDED
     * Path Coverage: exception.message.includes('Rate limit') === true
     */
    it('TC001: should handle rate limit exception', () => {
      const exception = { message: 'Rate limit exceeded' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          retryAfter: 60,
        }),
      );
    });

    /**
     * Test Case 2: Kiểm tra rate limit với chữ hoa chữ thường khác nhau
     * Input: 'Rate limit' (case-sensitive)
     * Expected Output: Rate limit handling
     * Path Coverage: Case-sensitive check
     */
    it('TC002: should handle "Rate limit" with exact case', () => {
      const exception = { message: 'Rate limit has been reached' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    });

    /**
     * Test Case 3: Kiểm tra 'RATE LIMIT' viết hoa
     * Input: 'RATE LIMIT' (uppercase)
     * Expected Output: Re-throw (case-sensitive)
     * Path Coverage: Not matching due to case
     */
    it('TC003: should not match uppercase "RATE LIMIT"', () => {
      const exception = { message: 'RATE LIMIT exceeded' };

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();
    });

    /**
     * Test Case 4: Kiểm tra 'rate limit' viết thường
     * Input: 'rate limit' (lowercase)
     * Expected Output: Re-throw (case-sensitive)
     * Path Coverage: Not matching due to case
     */
    it('TC004: should not match lowercase "rate limit"', () => {
      const exception = { message: 'rate limit exceeded' };

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();
    });

    /**
     * Test Case 5: Kiểm tra message chứa 'Rate limit' ở giữa
     * Input: 'Rate limit' in middle of message
     * Expected Output: Rate limit handling
     * Path Coverage: Substring match
     */
    it('TC005: should handle "Rate limit" in middle of message', () => {
      const exception = {
        message: 'User exceeded Rate limit for this endpoint',
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    });

    /**
     * Test Case 6: Kiểm tra message bắt đầu bằng 'Rate limit'
     * Input: Message starts with 'Rate limit'
     * Expected Output: Rate limit handling
     * Path Coverage: Starts with check
     */
    it('TC006: should handle message starting with "Rate limit"', () => {
      const exception = { message: 'Rate limit: 100 requests per minute' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    });

    /**
     * Test Case 7: Kiểm tra message kết thúc bằng 'Rate limit'
     * Input: Message ends with 'Rate limit'
     * Expected Output: Rate limit handling
     * Path Coverage: Ends with check
     */
    it('TC007: should handle message ending with "Rate limit"', () => {
      const exception = { message: 'Exceeded Rate limit' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    });

    /**
     * Test Case 8: Kiểm tra multiple 'Rate limit' trong message
     * Input: 'Rate limit' appears multiple times
     * Expected Output: Rate limit handling
     * Path Coverage: Multiple occurrences
     */
    it('TC008: should handle multiple "Rate limit" in message', () => {
      const exception = {
        message: 'Rate limit exceeded. Rate limit will reset in 60 seconds',
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    });

    /**
     * Test Case 9: Kiểm tra 'Rate limit' với khoảng trắng bổ sung
     * Input: Extra spaces around 'Rate limit'
     * Expected Output: Rate limit handling
     * Path Coverage: Whitespace handling
     */
    it('TC009: should handle "Rate limit" with surrounding spaces', () => {
      const exception = { message: '  Rate limit  exceeded  ' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    });

    /**
     * Test Case 10: Kiểm tra empty message
     * Input: Exception with empty message
     * Expected Output: Re-throw (no 'Rate limit')
     * Path Coverage: Empty message
     */
    it('TC010: should re-throw exception with empty message', () => {
      const exception = { message: '' };

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();
    });
  });

  describe('Non-Rate Limit Exception Handling', () => {
    /**
     * Test Case 11: Kiểm tra exception without message property
     * Input: Exception without message
     * Expected Output: Re-throw
     * Path Coverage: !exception.message
     */
    it('TC011: should re-throw exception without message property', () => {
      const exception = { error: 'Some error' };

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();
    });

    /**
     * Test Case 12: Kiểm tra exception with null message
     * Input: Exception with message = null
     * Expected Output: Re-throw
     * Path Coverage: Null message
     */
    it('TC012: should re-throw exception with null message', () => {
      const exception = { message: null };

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();
    });

    /**
     * Test Case 13: Kiểm tra exception with undefined message
     * Input: Exception with message = undefined
     * Expected Output: Re-throw
     * Path Coverage: Undefined message
     */
    it('TC013: should re-throw exception with undefined message', () => {
      const exception = { message: undefined };

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();
    });

    /**
     * Test Case 14: Kiểm tra different error message
     * Input: Exception with different message
     * Expected Output: Re-throw
     * Path Coverage: Different message
     */
    it('TC014: should re-throw exception with different message', () => {
      const exception = { message: 'Internal server error' };

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();
    });

    /**
     * Test Case 15: Kiểm tra HttpException (not rate limit)
     * Input: Standard HttpException
     * Expected Output: Re-throw
     * Path Coverage: HttpException without 'Rate limit'
     */
    it('TC015: should re-throw HttpException without rate limit message', () => {
      const exception = { message: 'Bad request', statusCode: 400 };

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();
    });

    /**
     * Test Case 16: Kiểm tra Error instance
     * Input: Standard Error
     * Expected Output: Re-throw
     * Path Coverage: Error instance
     */
    it('TC016: should re-throw Error instance', () => {
      const exception = new Error('Something went wrong');

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();
    });

    /**
     * Test Case 17: Kiểm tra TypeError
     * Input: TypeError instance
     * Expected Output: Re-throw
     * Path Coverage: TypeError
     */
    it('TC017: should re-throw TypeError', () => {
      const exception = new TypeError('Type error occurred');

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();
    });

    /**
     * Test Case 18: Kiểm tra string exception
     * Input: String thrown as exception
     * Expected Output: Re-throw
     * Path Coverage: String exception
     */
    it('TC018: should re-throw string exception', () => {
      const exception = 'String error';

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();
    });

    /**
     * Test Case 19: Kiểm tra number exception
     * Input: Number thrown as exception
     * Expected Output: Re-throw
     * Path Coverage: Number exception
     */
    it('TC019: should re-throw number exception', () => {
      const exception = 404;

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();
    });

    /**
     * Test Case 20: Kiểm tra partial match 'Ratelimit' (no space)
     * Input: 'Ratelimit' without space
     * Expected Output: Re-throw (not matching)
     * Path Coverage: Partial match
     */
    it('TC020: should not match "Ratelimit" without space', () => {
      const exception = { message: 'Ratelimit exceeded' };

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();
    });
  });

  describe('Response Structure', () => {
    /**
     * Test Case 21: Kiểm tra response structure completeness
     * Input: Rate limit exception
     * Expected Output: Complete error response
     * Path Coverage: Response structure
     */
    it('TC021: should return complete error response structure', () => {
      const exception = { message: 'Rate limit exceeded' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          timestamp: expect.any(String),
          path: expect.any(String),
          method: expect.any(String),
          requestId: expect.any(String),
          retryAfter: 60,
        }),
      );
    });

    /**
     * Test Case 22: Kiểm tra retryAfter value
     * Input: Rate limit exception
     * Expected Output: retryAfter = 60
     * Path Coverage: retryAfter field
     */
    it('TC022: should include retryAfter of 60 seconds', () => {
      const exception = { message: 'Rate limit exceeded' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          retryAfter: 60,
        }),
      );
    });

    /**
     * Test Case 23: Kiểm tra success field
     * Input: Rate limit exception
     * Expected Output: success = false
     * Path Coverage: Success field
     */
    it('TC023: should set success to false', () => {
      const exception = { message: 'Rate limit exceeded' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        }),
      );
    });

    /**
     * Test Case 24: Kiểm tra error code
     * Input: Rate limit exception
     * Expected Output: error = 'RATE_LIMIT_EXCEEDED'
     * Path Coverage: Error code
     */
    it('TC024: should set error code to RATE_LIMIT_EXCEEDED', () => {
      const exception = { message: 'Rate limit exceeded' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'RATE_LIMIT_EXCEEDED',
        }),
      );
    });

    /**
     * Test Case 25: Kiểm tra message text
     * Input: Rate limit exception
     * Expected Output: Standard retry message
     * Path Coverage: Message field
     */
    it('TC025: should use standard retry message', () => {
      const exception = { message: 'Rate limit exceeded' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Too many requests, please try again later',
        }),
      );
    });

    /**
     * Test Case 26: Kiểm tra timestamp format
     * Input: Rate limit exception
     * Expected Output: ISO format timestamp
     * Path Coverage: Timestamp
     */
    it('TC026: should include ISO timestamp', () => {
      const exception = { message: 'Rate limit exceeded' };

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    /**
     * Test Case 27: Kiểm tra path field
     * Input: Rate limit exception
     * Expected Output: Request path included
     * Path Coverage: Path field
     */
    it('TC027: should include request path', () => {
      const exception = { message: 'Rate limit exceeded' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/test',
        }),
      );
    });

    /**
     * Test Case 28: Kiểm tra method field
     * Input: Rate limit exception
     * Expected Output: Request method included
     * Path Coverage: Method field
     */
    it('TC028: should include request method', () => {
      const exception = { message: 'Rate limit exceeded' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    /**
     * Test Case 29: Kiểm tra requestId field
     * Input: Rate limit exception with requestId
     * Expected Output: RequestId included
     * Path Coverage: RequestId field
     */
    it('TC029: should include requestId', () => {
      const exception = { message: 'Rate limit exceeded' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'test-request-id',
        }),
      );
    });

    /**
     * Test Case 30: Kiểm tra details field
     * Input: Rate limit exception
     * Expected Output: details = undefined
     * Path Coverage: Details parameter
     */
    it('TC030: should pass undefined as details', () => {
      const exception = { message: 'Rate limit exceeded' };

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockJson.mock.calls[0][0];
      expect(responseCall.details).toBeUndefined();
    });
  });

  describe('Logging Behavior', () => {
    /**
     * Test Case 31: Kiểm tra logger warning được gọi
     * Input: Rate limit exception
     * Expected Output: logger.warn called
     * Path Coverage: Logger invocation
     */
    it('TC031: should log warning for rate limit', () => {
      const exception = { message: 'Rate limit exceeded' };
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalled();
    });

    /**
     * Test Case 32: Kiểm tra log message format
     * Input: Rate limit exception
     * Expected Output: Log contains 'Rate Limit Exceeded'
     * Path Coverage: Log format
     */
    it('TC032: should log with correct format', () => {
      const exception = { message: 'Rate limit exceeded' };
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rate Limit Exceeded'),
      );
    });

    /**
     * Test Case 33: Kiểm tra log includes request method
     * Input: Rate limit exception
     * Expected Output: Log contains method
     * Path Coverage: Method in log
     */
    it('TC033: should include request method in log', () => {
      const exception = { message: 'Rate limit exceeded' };
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('GET'));
    });

    /**
     * Test Case 34: Kiểm tra log includes request URL
     * Input: Rate limit exception
     * Expected Output: Log contains URL
     * Path Coverage: URL in log
     */
    it('TC034: should include request URL in log', () => {
      const exception = { message: 'Rate limit exceeded' };
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
      );
    });

    /**
     * Test Case 35: Kiểm tra log includes request IP
     * Input: Rate limit exception with IP
     * Expected Output: Log contains IP address
     * Path Coverage: IP in log
     */
    it('TC035: should include request IP in log', () => {
      const exception = { message: 'Rate limit exceeded' };
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('192.168.1.1'),
      );
    });

    /**
     * Test Case 36: Kiểm tra logging không được gọi khi re-throw
     * Input: Non-rate limit exception
     * Expected Output: Logger not called
     * Path Coverage: No logging on re-throw
     */
    it('TC036: should not log when re-throwing exception', () => {
      const exception = { message: 'Other error' };
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();

      expect(loggerSpy).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    /**
     * Test Case 37: Kiểm tra without requestId
     * Input: Request without requestId
     * Expected Output: 'unknown' requestId
     * Path Coverage: Missing requestId
     */
    it('TC037: should use "unknown" when requestId is missing', () => {
      delete mockRequest.requestId;
      const exception = { message: 'Rate limit exceeded' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    /**
     * Test Case 38: Kiểm tra without IP address
     * Input: Request without IP
     * Expected Output: Logging still works
     * Path Coverage: Missing IP
     */
    it('TC038: should handle missing IP address', () => {
      delete mockRequest.ip;
      const exception = { message: 'Rate limit exceeded' };
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalled();
    });

    /**
     * Test Case 39: Kiểm tra với different HTTP methods
     * Input: Various HTTP methods
     * Expected Output: Method reflected in log and response
     * Path Coverage: Different methods
     */
    it('TC039: should handle different HTTP methods', () => {
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

      methods.forEach((method) => {
        mockRequest.method = method;
        const exception = { message: 'Rate limit exceeded' };

        filter.catch(exception, mockArgumentsHost);

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            method: method,
          }),
        );
      });
    });

    /**
     * Test Case 40: Kiểm tra với different URLs
     * Input: Various URL paths
     * Expected Output: Path reflected in response
     * Path Coverage: Different URLs
     */
    it('TC040: should handle different URL paths', () => {
      const urls = ['/api/users', '/api/posts/123', '/health'];

      urls.forEach((url) => {
        mockRequest.url = url;
        const exception = { message: 'Rate limit exceeded' };

        filter.catch(exception, mockArgumentsHost);

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            path: url,
          }),
        );
      });
    });

    /**
     * Test Case 41: Kiểm tra URL with query parameters
     * Input: URL with query string
     * Expected Output: Full URL preserved
     * Path Coverage: Query parameters
     */
    it('TC041: should preserve URL with query parameters', () => {
      mockRequest.url = '/api/users?page=1&limit=10';
      const exception = { message: 'Rate limit exceeded' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/users?page=1&limit=10',
        }),
      );
    });

    /**
     * Test Case 42: Kiểm tra IPv6 address
     * Input: Request with IPv6 address
     * Expected Output: IPv6 included in log
     * Path Coverage: IPv6
     */
    it('TC042: should handle IPv6 address', () => {
      mockRequest.ip = '::1';
      const exception = { message: 'Rate limit exceeded' };
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('::1'));
    });

    /**
     * Test Case 43: Kiểm tra với proxy IP (X-Forwarded-For)
     * Input: Request with proxy IP
     * Expected Output: IP in log
     * Path Coverage: Proxy IP
     */
    it('TC043: should handle proxy IP address', () => {
      mockRequest.ip = '10.0.0.1';
      const exception = { message: 'Rate limit exceeded' };
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('10.0.0.1'),
      );
    });

    /**
     * Test Case 44: Kiểm tra message with special characters
     * Input: 'Rate limit' with special chars around
     * Expected Output: Rate limit handling
     * Path Coverage: Special characters
     */
    it('TC044: should handle special characters around "Rate limit"', () => {
      const exception = { message: '*** Rate limit *** exceeded' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    });

    /**
     * Test Case 45: Kiểm tra message with newlines
     * Input: Multi-line message with 'Rate limit'
     * Expected Output: Rate limit handling
     * Path Coverage: Newlines
     */
    it('TC045: should handle newlines in message', () => {
      const exception = { message: 'Error:\nRate limit exceeded\nRetry later' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    });
  });

  describe('Real-world Scenarios', () => {
    /**
     * Test Case 46: Kiểm tra POST request rate limited
     * Input: POST request exceeding rate limit
     * Expected Output: 429 response
     * Path Coverage: POST rate limit
     */
    it('TC046: should handle POST request rate limit', () => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';
      const exception = { message: 'Rate limit exceeded for POST requests' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          path: '/api/users',
        }),
      );
    });

    /**
     * Test Case 47: Kiểm tra authentication endpoint rate limited
     * Input: Login endpoint rate limit
     * Expected Output: 429 response
     * Path Coverage: Auth rate limit
     */
    it('TC047: should handle authentication endpoint rate limit', () => {
      mockRequest.url = '/api/auth/login';
      const exception = { message: 'Rate limit on login attempts' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/auth/login',
        }),
      );
    });

    /**
     * Test Case 48: Kiểm tra API endpoint rate limited
     * Input: API endpoint rate limit
     * Expected Output: 429 response with retryAfter
     * Path Coverage: API rate limit
     */
    it('TC048: should handle API endpoint rate limit', () => {
      mockRequest.url = '/api/v1/search';
      const exception = { message: 'Rate limit: 100 requests per minute' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          retryAfter: 60,
        }),
      );
    });

    /**
     * Test Case 49: Kiểm tra multiple IPs rate limited
     * Input: Different IP addresses
     * Expected Output: Each IP logged separately
     * Path Coverage: Multiple IPs
     */
    it('TC049: should log different IP addresses separately', () => {
      const ips = ['192.168.1.1', '10.0.0.1', '172.16.0.1'];
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');

      ips.forEach((ip) => {
        mockRequest.ip = ip;
        const exception = { message: 'Rate limit exceeded' };

        filter.catch(exception, mockArgumentsHost);

        expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining(ip));
      });
    });

    /**
     * Test Case 50: Kiểm tra sequential rate limit errors
     * Input: Multiple rate limit exceptions
     * Expected Output: Each handled independently
     * Path Coverage: Multiple rate limits
     */
    it('TC050: should handle sequential rate limit errors', () => {
      const exceptions = [
        { message: 'Rate limit exceeded' },
        { message: 'Rate limit reached' },
        { message: 'Too many requests - Rate limit' },
      ];

      exceptions.forEach((exception, index) => {
        filter.catch(exception, mockArgumentsHost);
        expect(mockStatus).toHaveBeenCalledTimes(index + 1);
        expect(mockJson).toHaveBeenCalledTimes(index + 1);
      });
    });

    /**
     * Test Case 51: Kiểm tra mixed exceptions (rate limit and others)
     * Input: Alternating rate limit and other exceptions
     * Expected Output: Rate limits handled, others re-thrown
     * Path Coverage: Mixed exceptions
     */
    it('TC051: should handle mixed exception types', () => {
      const rateLimitException = { message: 'Rate limit exceeded' };
      const otherException = { message: 'Server error' };

      // Rate limit should be handled
      filter.catch(rateLimitException, mockArgumentsHost);
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);

      // Other exception should be re-thrown
      expect(() => {
        filter.catch(otherException, mockArgumentsHost);
      }).toThrow();
    });

    /**
     * Test Case 52: Kiểm tra rate limit from different endpoints
     * Input: Various endpoints hitting rate limit
     * Expected Output: All handled with same response
     * Path Coverage: Multiple endpoints
     */
    it('TC052: should handle rate limit from different endpoints', () => {
      const endpoints = [
        '/api/users',
        '/api/posts',
        '/api/comments',
        '/api/search',
      ];

      endpoints.forEach((endpoint) => {
        mockRequest.url = endpoint;
        const exception = { message: 'Rate limit exceeded' };

        filter.catch(exception, mockArgumentsHost);

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'RATE_LIMIT_EXCEEDED',
            retryAfter: 60,
          }),
        );
      });
    });

    /**
     * Test Case 53: Kiểm tra rate limit with additional exception properties
     * Input: Exception with extra properties
     * Expected Output: Rate limit handling (properties ignored)
     * Path Coverage: Extra properties
     */
    it('TC053: should handle exception with additional properties', () => {
      const exception = {
        message: 'Rate limit exceeded',
        statusCode: 429,
        timestamp: new Date().toISOString(),
        path: '/api/test',
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    });

    /**
     * Test Case 54: Kiểm tra complete rate limit flow
     * Input: Rate limit exception
     * Expected Output: Complete flow executed
     * Path Coverage: Complete flow
     */
    it('TC054: should execute complete rate limit flow', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'warn');
      const exception = { message: 'Rate limit exceeded' };

      filter.catch(exception, mockArgumentsHost);

      // Verify all steps
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rate Limit Exceeded'),
      );
      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          retryAfter: 60,
        }),
      );
    });

    /**
     * Test Case 55: Kiểm tra exception với message object (not string)
     * Input: Exception where message is object
     * Expected Output: Re-throw (includes check fails)
     * Path Coverage: Message object type
     */
    it('TC055: should re-throw when message is not string', () => {
      const exception = { message: { text: 'Rate limit exceeded' } };

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();
    });

    /**
     * Test Case 56: Kiểm tra exception với message array
     * Input: Exception where message is array
     * Expected Output: Re-throw
     * Path Coverage: Message array type
     */
    it('TC056: should re-throw when message is array', () => {
      const exception = { message: ['Rate limit exceeded'] };

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();
    });

    /**
     * Test Case 57: Kiểm tra very long message với 'Rate limit'
     * Input: Very long message containing 'Rate limit'
     * Expected Output: Rate limit handling
     * Path Coverage: Long message
     */
    it('TC057: should handle very long message containing "Rate limit"', () => {
      const longMessage = 'x'.repeat(500) + ' Rate limit ' + 'y'.repeat(500);
      const exception = { message: longMessage };

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    });

    /**
     * Test Case 58: Kiểm tra Unicode trong rate limit message
     * Input: 'Rate limit' với Unicode characters
     * Expected Output: Rate limit handling
     * Path Coverage: Unicode
     */
    it('TC058: should handle Unicode around "Rate limit"', () => {
      const exception = { message: '🚫 Rate limit exceeded 错误' };

      filter.catch(exception, mockArgumentsHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    });

    /**
     * Test Case 59: Kiểm tra early return behavior
     * Input: Rate limit exception
     * Expected Output: Function returns early, no throw
     * Path Coverage: Early return
     */
    it('TC059: should return early and not throw for rate limit', () => {
      const exception = { message: 'Rate limit exceeded' };

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).not.toThrow();
    });

    /**
     * Test Case 60: Kiểm tra retryAfter constant value
     * Input: Multiple rate limit exceptions
     * Expected Output: retryAfter always 60
     * Path Coverage: Constant retryAfter
     */
    it('TC060: should always use 60 seconds for retryAfter', () => {
      const exceptions = [
        { message: 'Rate limit 1' },
        { message: 'Rate limit 2' },
        { message: 'Rate limit 3' },
      ];

      exceptions.forEach((exception) => {
        filter.catch(exception, mockArgumentsHost);

        expect(mockJson).toHaveBeenCalledWith(
          expect.objectContaining({
            retryAfter: 60,
          }),
        );
      });
    });
  });
});
