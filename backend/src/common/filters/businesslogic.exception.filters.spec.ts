import 'reflect-metadata';
import { ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { BusinessLogicExceptionFilter } from './businesslogic.exception.filters';

describe('BusinessLogicExceptionFilter - White Box Testing', () => {
  let filter: BusinessLogicExceptionFilter;
  let mockRequest: any;
  let mockResponse: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new BusinessLogicExceptionFilter();

    mockRequest = {
      url: '/api/users',
      method: 'POST',
      requestId: 'test-request-123',
      body: { name: 'Test' },
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

    // Mock Logger to avoid actual logging
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Logger Initialization', () => {
    it('should initialize logger with class name', () => {
      expect(filter).toBeInstanceOf(BusinessLogicExceptionFilter);
      expect(Logger.prototype.warn).toBeDefined();
    });
  });

  describe('catch Method - Business Logic Error', () => {
    it('should handle business logic error with all properties', () => {
      const exception = {
        isBusinessError: true,
        errorCode: 'USER_EXISTS',
        message: 'User already exists',
        status: HttpStatus.CONFLICT,
        details: { email: 'test@example.com' },
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'USER_EXISTS',
        message: 'User already exists',
        details: { email: 'test@example.com' },
        timestamp: expect.any(String),
        path: '/api/users',
        method: 'POST',
        requestId: 'test-request-123',
      });
    });

    it('should handle business logic error without errorCode', () => {
      const exception = {
        isBusinessError: true,
        message: 'Business error occurred',
        status: HttpStatus.BAD_REQUEST,
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'BUSINESS_ERROR',
          message: 'Business error occurred',
        }),
      );
    });

    it('should handle business logic error without status (default BAD_REQUEST)', () => {
      const exception = {
        isBusinessError: true,
        message: 'Default status error',
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Default status error',
        }),
      );
    });

    it('should handle business logic error without details', () => {
      const exception = {
        isBusinessError: true,
        errorCode: 'SIMPLE_ERROR',
        message: 'Simple error',
        status: HttpStatus.BAD_REQUEST,
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: undefined,
        }),
      );
    });

    it('should handle business logic error with null details', () => {
      const exception = {
        isBusinessError: true,
        message: 'Error with null details',
        details: null,
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: null,
        }),
      );
    });

    it('should handle business logic error with empty object details', () => {
      const exception = {
        isBusinessError: true,
        message: 'Error with empty details',
        details: {},
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: {},
        }),
      );
    });

    it('should handle business logic error with array details', () => {
      const exception = {
        isBusinessError: true,
        message: 'Multiple errors',
        details: ['Error 1', 'Error 2', 'Error 3'],
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: ['Error 1', 'Error 2', 'Error 3'],
        }),
      );
    });

    it('should generate valid ISO timestamp', () => {
      const exception = {
        isBusinessError: true,
        message: 'Timestamp test',
      };

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      const timestamp = new Date(callArgs.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
      expect(callArgs.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should log warning with business error details', () => {
      const exception = {
        isBusinessError: true,
        errorCode: 'TEST_ERROR',
        message: 'Test message',
      };

      filter.catch(exception, mockArgumentsHost);

      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        `Business Logic Error: TEST_ERROR - Test message - POST /api/users`,
      );
    });

    it('should log warning with undefined error code when not provided', () => {
      const exception = {
        isBusinessError: true,
        message: 'No error code',
      };

      filter.catch(exception, mockArgumentsHost);

      // Logger uses exception.errorCode directly, which is undefined
      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        `Business Logic Error: undefined - No error code - POST /api/users`,
      );
    });

    it('should include all request properties', () => {
      const exception = {
        isBusinessError: true,
        message: 'Request properties test',
      };

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.path).toBe('/api/users');
      expect(callArgs.method).toBe('POST');
      expect(callArgs.requestId).toBe('test-request-123');
    });

    it('should handle request without requestId', () => {
      const requestWithoutId = {
        ...mockRequest,
        requestId: undefined,
      };

      const hostWithoutId = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(requestWithoutId),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as any;

      const exception = {
        isBusinessError: true,
        message: 'No request ID',
      };

      filter.catch(exception, hostWithoutId);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'unknown',
        }),
      );
    });

    it('should handle different HTTP status codes', () => {
      const statuses = [
        HttpStatus.BAD_REQUEST,
        HttpStatus.UNAUTHORIZED,
        HttpStatus.FORBIDDEN,
        HttpStatus.NOT_FOUND,
        HttpStatus.CONFLICT,
        HttpStatus.UNPROCESSABLE_ENTITY,
      ];

      statuses.forEach((status) => {
        const exception = {
          isBusinessError: true,
          message: `Error with status ${status}`,
          status,
        };

        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.status).toHaveBeenCalledWith(status);
        mockResponse.status.mockClear();
      });
    });
  });

  describe('catch Method - Non-Business Logic Error', () => {
    it('should re-throw when isBusinessError is false', () => {
      const exception = {
        isBusinessError: false,
        message: 'Not a business error',
      };

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should re-throw when isBusinessError is undefined', () => {
      const exception = {
        message: 'Standard error',
      };

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should re-throw when isBusinessError is null', () => {
      const exception = {
        isBusinessError: null,
        message: 'Null business error',
      };

      expect(() => {
        filter.catch(exception, mockArgumentsHost);
      }).toThrow();

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should re-throw standard Error', () => {
      const standardError = new Error('Standard error');

      expect(() => {
        filter.catch(standardError, mockArgumentsHost);
      }).toThrow('Standard error');

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should re-throw string error', () => {
      const stringError = 'String error';

      expect(() => {
        filter.catch(stringError, mockArgumentsHost);
      }).toThrow();

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should re-throw null error', () => {
      expect(() => {
        filter.catch(null, mockArgumentsHost);
      }).toThrow();

      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should re-throw undefined error', () => {
      expect(() => {
        filter.catch(undefined, mockArgumentsHost);
      }).toThrow();

      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle user already exists error', () => {
      const exception = {
        isBusinessError: true,
        errorCode: 'USER_EXISTS',
        message: 'User with email already exists',
        status: HttpStatus.CONFLICT,
        details: {
          email: 'existing@example.com',
          userId: 123,
        },
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'USER_EXISTS',
          message: 'User with email already exists',
          details: {
            email: 'existing@example.com',
            userId: 123,
          },
        }),
      );
    });

    it('should handle validation error for business logic', () => {
      const exception = {
        isBusinessError: true,
        errorCode: 'INVALID_INPUT',
        message: 'Validation failed',
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        details: {
          errors: [
            { field: 'email', message: 'Invalid format' },
            { field: 'age', message: 'Must be positive' },
          ],
        },
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'INVALID_INPUT',
        }),
      );
    });

    it('should handle insufficient funds error', () => {
      const exception = {
        isBusinessError: true,
        errorCode: 'INSUFFICIENT_FUNDS',
        message: 'Insufficient funds for transaction',
        status: HttpStatus.BAD_REQUEST,
        details: {
          currentBalance: 50,
          requiredAmount: 100,
          difference: 50,
        },
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'INSUFFICIENT_FUNDS',
        }),
      );
    });

    it('should handle rate limit business error', () => {
      const exception = {
        isBusinessError: true,
        errorCode: 'RATE_LIMIT',
        message: 'Too many requests',
        status: HttpStatus.TOO_MANY_REQUESTS,
        details: {
          retryAfter: 60,
          currentRequests: 100,
          limit: 50,
        },
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.TOO_MANY_REQUESTS,
      );
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should handle access denied business error', () => {
      const exception = {
        isBusinessError: true,
        errorCode: 'ACCESS_DENIED',
        message: 'You do not have access to this resource',
        status: HttpStatus.FORBIDDEN,
        details: {
          resource: 'document',
          resourceId: 456,
          requiredRole: 'admin',
        },
      };

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'ACCESS_DENIED',
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long error message', () => {
      const longMessage = 'Error: '.repeat(1000);
      const exception = {
        isBusinessError: true,
        errorCode: 'LONG_ERROR',
        message: longMessage,
      };

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.message).toBe(longMessage);
    });

    it('should handle empty error message', () => {
      const exception = {
        isBusinessError: true,
        errorCode: 'EMPTY_MESSAGE',
        message: '',
      };

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.message).toBe('');
    });

    it('should handle empty error code (falls back to BUSINESS_ERROR)', () => {
      const exception = {
        isBusinessError: true,
        errorCode: '',
        message: 'Empty code test',
      };

      filter.catch(exception, mockArgumentsHost);

      // Empty string is falsy, so it falls back to 'BUSINESS_ERROR'
      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.error).toBe('BUSINESS_ERROR');
    });

    it('should handle special characters in error message', () => {
      const exception = {
        isBusinessError: true,
        errorCode: 'SPECIAL_CHARS',
        message: 'Error: @#$%^&*()[]{}|\\/:;<>?~`',
      };

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.message).toBe('Error: @#$%^&*()[]{}|\\/:;<>?~`');
    });

    it('should handle unicode characters in error message', () => {
      const exception = {
        isBusinessError: true,
        errorCode: 'UNICODE_ERROR',
        message: '错误信息：验证失败！',
      };

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.message).toBe('错误信息：验证失败！');
    });

    it('should handle complex nested details object', () => {
      const exception = {
        isBusinessError: true,
        errorCode: 'COMPLEX_DETAILS',
        message: 'Complex details',
        details: {
          level1: {
            level2: {
              level3: {
                deep: 'value',
                array: [1, 2, 3],
              },
            },
          },
        },
      };

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.details.level1.level2.level3.deep).toBe('value');
    });

    it('should handle details with Date object', () => {
      const date = new Date('2024-01-01');
      const exception = {
        isBusinessError: true,
        message: 'Date in details',
        details: { createdAt: date },
      };

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.details.createdAt).toBe(date);
    });

    it('should handle very long URL in request', () => {
      const longUrl = '/' + 'a'.repeat(2000);
      const requestWithLongUrl = {
        ...mockRequest,
        url: longUrl,
      };

      const hostWithLongUrl = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(requestWithLongUrl),
          getResponse: jest.fn().mockReturnValue(mockResponse),
        }),
      } as any;

      const exception = {
        isBusinessError: true,
        message: 'Long URL test',
      };

      filter.catch(exception, hostWithLongUrl);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(callArgs.path).toBe(longUrl);
    });

    it('should handle concurrent calls', () => {
      const exceptions = Array.from({ length: 10 }, (_, i) => ({
        isBusinessError: true,
        errorCode: `ERROR_${i}`,
        message: `Error ${i}`,
      }));

      exceptions.forEach((exception, i) => {
        filter.catch(exception, mockArgumentsHost);
      });

      expect(mockResponse.json).toHaveBeenCalledTimes(10);
    });

    it('should not call logger for non-business errors', () => {
      const standardError = new Error('Standard error');

      try {
        filter.catch(standardError, mockArgumentsHost);
      } catch (e) {
        // Expected to throw
      }

      expect(Logger.prototype.warn).not.toHaveBeenCalled();
    });

    it('should handle request with all possible HTTP methods', () => {
      const methods = [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS',
        'HEAD',
      ];

      methods.forEach((method) => {
        const requestWithMethod = { ...mockRequest, method };
        const hostWithMethod = {
          switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue(requestWithMethod),
            getResponse: jest.fn().mockReturnValue(mockResponse),
          }),
        } as any;

        const exception = {
          isBusinessError: true,
          message: `Test for ${method}`,
        };

        filter.catch(exception, hostWithMethod);

        const callArgs =
          mockResponse.json.mock.calls[
            mockResponse.json.mock.calls.length - 1
          ][0];
        expect(callArgs.method).toBe(method);
      });
    });
  });

  describe('Response Chain', () => {
    it('should chain status and json calls correctly', () => {
      const mockChainedResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const chainedHost = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue(mockChainedResponse),
        }),
      } as any;

      const exception = {
        isBusinessError: true,
        message: 'Chain test',
      };

      filter.catch(exception, chainedHost);

      expect(mockChainedResponse.status).toHaveBeenCalled();
      expect(mockChainedResponse.json).toHaveBeenCalled();
      expect(mockChainedResponse.status().json).toBe(mockChainedResponse.json);
    });
  });

  describe('Type Safety', () => {
    it('should maintain correct types in response', () => {
      const exception = {
        isBusinessError: true,
        errorCode: 'TYPE_TEST',
        message: 'Type test',
        details: { test: true },
      };

      filter.catch(exception, mockArgumentsHost);

      const callArgs = mockResponse.json.mock.calls[0][0];
      expect(typeof callArgs.success).toBe('boolean');
      expect(typeof callArgs.error).toBe('string');
      expect(typeof callArgs.message).toBe('string');
      expect(typeof callArgs.timestamp).toBe('string');
      expect(typeof callArgs.path).toBe('string');
      expect(typeof callArgs.method).toBe('string');
      expect(typeof callArgs.requestId).toBe('string');
    });
  });
});
