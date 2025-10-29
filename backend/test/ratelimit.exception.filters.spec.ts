import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { RateLimitExceptionFilter } from '../src/common/filters/ratelimit.exception.filters';
import { BaseExceptionFilter } from '../src/common/filters/base.exception.filters';

describe('RateLimitExceptionFilter - Kiểm thử hộp trắng', () => {
  let filter: RateLimitExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockRequest: any;
  let mockArgumentsHost: ArgumentsHost;
  let loggerWarnSpy: jest.SpyInstance;
  let createErrorResponseSpy: jest.SpyInstance;

  beforeEach(() => {
    // Khởi tạo filter
    filter = new RateLimitExceptionFilter();

    // Mock Response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    // Mock Request object
    mockRequest = {
      method: 'POST',
      url: '/api/test',
      ip: '192.168.1.1',
      user: undefined,
    };

    // Mock ArgumentsHost
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getArgByIndex: jest.fn(),
      getArgs: jest.fn(),
      getType: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    };

    // Spy trên logger
    loggerWarnSpy = jest.spyOn(filter['logger'], 'warn').mockImplementation();

    // Spy trên createErrorResponse
    createErrorResponseSpy = jest
      .spyOn(BaseExceptionFilter.prototype as any, 'createErrorResponse')
      .mockReturnValue({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        timestamp: new Date().toISOString(),
        path: '/api/test',
        retryAfter: 60,
      });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Test Case 1: User đã xác thực (authenticated user)', () => {
    it('TC1.1: Nên xử lý exception với user có ID', () => {
      // Arrange
      const userId = 'user-123';
      mockRequest.user = { id: userId } as any;
      const exception = new ThrottlerException('Rate limit exceeded');

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert - Kiểm tra logger được gọi với user ID
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        `Rate Limit Exceeded: POST /api/test - IP: 192.168.1.1 - User: ${userId}`,
      );
    });

    it('TC1.2: Nên tạo error response với đúng parameters cho authenticated user', () => {
      // Arrange
      mockRequest.user = { id: 'user-456' } as any;
      const exceptionMessage = 'Custom rate limit message';
      const throttlerResponse = { statusCode: 429, message: 'Throttled' };
      const exception = new ThrottlerException(exceptionMessage);
      jest.spyOn(exception, 'getResponse').mockReturnValue(throttlerResponse);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(createErrorResponseSpy).toHaveBeenCalledWith(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests, please try again later',
        mockRequest,
        {
          message: exceptionMessage,
          throttlerMessage: throttlerResponse,
        },
        60,
      );
    });
  });

  describe('Test Case 2: User ẩn danh (anonymous user)', () => {
    it('TC2.1: Nên xử lý exception khi user là undefined', () => {
      // Arrange
      mockRequest.user = undefined;
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert - Kiểm tra logger được gọi với 'anonymous'
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Rate Limit Exceeded: POST /api/test - IP: 192.168.1.1 - User: anonymous',
      );
    });

    it('TC2.2: Nên xử lý exception khi user không có ID', () => {
      // Arrange
      mockRequest.user = {} as any;
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Rate Limit Exceeded: POST /api/test - IP: 192.168.1.1 - User: anonymous',
      );
    });

    it('TC2.3: Nên xử lý exception khi user.id là null', () => {
      // Arrange
      mockRequest.user = { id: null } as any;
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Rate Limit Exceeded: POST /api/test - IP: 192.168.1.1 - User: anonymous',
      );
    });

    it('TC2.4: Nên xử lý exception khi user.id là chuỗi rỗng', () => {
      // Arrange
      mockRequest.user = { id: '' } as any;
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Rate Limit Exceeded: POST /api/test - IP: 192.168.1.1 - User: anonymous',
      );
    });
  });

  describe('Test Case 3: HTTP Headers', () => {
    it('TC3.1: Nên set tất cả rate limit headers', () => {
      // Arrange
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert - Kiểm tra tất cả headers
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', '60');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Limit',
        '100',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        '0',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(String),
      );
    });

    it('TC3.2: Nên set X-RateLimit-Reset với timestamp tương lai', () => {
      // Arrange
      const exception = new ThrottlerException();
      const beforeTime = Date.now();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      const resetHeaderCall = (
        mockResponse.setHeader as jest.Mock
      ).mock.calls.find((call) => call[0] === 'X-RateLimit-Reset');
      const resetTime = parseInt(resetHeaderCall[1]);
      expect(resetTime).toBeGreaterThan(beforeTime);
      expect(resetTime).toBeLessThanOrEqual(beforeTime + 60000);
    });

    it('TC3.3: Nên set headers theo đúng thứ tự', () => {
      // Arrange
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert - Kiểm tra thứ tự gọi setHeader
      const setHeaderCalls = (mockResponse.setHeader as jest.Mock).mock.calls;
      expect(setHeaderCalls[0][0]).toBe('Retry-After');
      expect(setHeaderCalls[1][0]).toBe('X-RateLimit-Limit');
      expect(setHeaderCalls[2][0]).toBe('X-RateLimit-Remaining');
      expect(setHeaderCalls[3][0]).toBe('X-RateLimit-Reset');
    });
  });

  describe('Test Case 4: HTTP Response', () => {
    it('TC4.1: Nên trả về status code 429 TOO_MANY_REQUESTS', () => {
      // Arrange
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    });

    it('TC4.2: Nên trả về JSON với error response', () => {
      // Arrange
      const exception = new ThrottlerException();
      const expectedResponse = {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        timestamp: expect.any(String),
        path: '/api/test',
        retryAfter: 60,
      };

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('TC4.3: Nên gọi status trước json', () => {
      // Arrange
      const exception = new ThrottlerException();
      const callOrder: string[] = [];

      (mockResponse.status as jest.Mock).mockImplementation(() => {
        callOrder.push('status');
        return mockResponse;
      });

      (mockResponse.json as jest.Mock).mockImplementation(() => {
        callOrder.push('json');
        return mockResponse;
      });

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(callOrder).toEqual(['status', 'json']);
    });
  });

  describe('Test Case 5: Exception Message và Response', () => {
    it('TC5.1: Nên xử lý exception với message tùy chỉnh', () => {
      // Arrange
      const customMessage = 'Custom throttler message';
      const exception = new ThrottlerException(customMessage);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(createErrorResponseSpy).toHaveBeenCalledWith(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests, please try again later',
        mockRequest,
        expect.objectContaining({
          message: customMessage,
        }),
        60,
      );
    });

    it('TC5.2: Nên xử lý exception với getResponse() trả về object', () => {
      // Arrange
      const throttlerResponse = {
        statusCode: 429,
        message: 'Throttler response',
        details: 'Some details',
      };
      const exception = new ThrottlerException();
      jest.spyOn(exception, 'getResponse').mockReturnValue(throttlerResponse);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(createErrorResponseSpy).toHaveBeenCalledWith(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests, please try again later',
        mockRequest,
        expect.objectContaining({
          throttlerMessage: throttlerResponse,
        }),
        60,
      );
    });

    it('TC5.3: Nên xử lý exception với getResponse() trả về string', () => {
      // Arrange
      const throttlerResponse = 'Simple string response';
      const exception = new ThrottlerException();
      jest.spyOn(exception, 'getResponse').mockReturnValue(throttlerResponse);

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(createErrorResponseSpy).toHaveBeenCalledWith(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests, please try again later',
        mockRequest,
        expect.objectContaining({
          throttlerMessage: throttlerResponse,
        }),
        60,
      );
    });
  });

  describe('Test Case 6: Request Context', () => {
    it('TC6.1: Nên xử lý request với method GET', () => {
      // Arrange
      mockRequest.method = 'GET';
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('GET'),
      );
    });

    it('TC6.2: Nên xử lý request với method PUT', () => {
      // Arrange
      mockRequest.method = 'PUT';
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('PUT'),
      );
    });

    it('TC6.3: Nên xử lý request với method DELETE', () => {
      // Arrange
      mockRequest.method = 'DELETE';
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
      );
    });

    it('TC6.4: Nên xử lý request với URL khác nhau', () => {
      // Arrange
      mockRequest.url = '/api/users/profile';
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/profile'),
      );
    });

    it('TC6.5: Nên xử lý request với IP khác nhau', () => {
      // Arrange
      mockRequest.ip = '10.0.0.1';
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('10.0.0.1'),
      );
    });

    it('TC6.6: Nên xử lý request với query parameters trong URL', () => {
      // Arrange
      mockRequest.url = '/api/search?q=test&limit=10';
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/search?q=test&limit=10'),
      );
    });
  });

  describe('Test Case 7: ArgumentsHost Context', () => {
    it('TC7.1: Nên gọi switchToHttp từ ArgumentsHost', () => {
      // Arrange
      const exception = new ThrottlerException();
      const switchToHttpSpy = jest.spyOn(mockArgumentsHost, 'switchToHttp');

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(switchToHttpSpy).toHaveBeenCalled();
    });

    it('TC7.2: Nên lấy response từ HTTP context', () => {
      // Arrange
      const exception = new ThrottlerException();
      const httpContext = mockArgumentsHost.switchToHttp();
      const getResponseSpy = jest.spyOn(httpContext, 'getResponse');

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(getResponseSpy).toHaveBeenCalled();
    });

    it('TC7.3: Nên lấy request từ HTTP context', () => {
      // Arrange
      const exception = new ThrottlerException();
      const httpContext = mockArgumentsHost.switchToHttp();
      const getRequestSpy = jest.spyOn(httpContext, 'getRequest');

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(getRequestSpy).toHaveBeenCalled();
    });
  });

  describe('Test Case 8: Logging chi tiết', () => {
    it('TC8.1: Nên log với format đầy đủ thông tin', () => {
      // Arrange
      mockRequest.method = 'POST';
      mockRequest.url = '/api/messages';
      mockRequest.ip = '172.16.0.1';
      mockRequest.user = { id: 'user-789' } as any;
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Rate Limit Exceeded: POST /api/messages - IP: 172.16.0.1 - User: user-789',
      );
    });

    it('TC8.2: Nên gọi logger.warn chính xác 1 lần', () => {
      // Arrange
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Test Case 9: Edge Cases', () => {
    it('TC9.1: Nên xử lý khi IP là undefined', () => {
      // Arrange
      mockRequest.ip = undefined;
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('IP: undefined'),
      );
    });

    it('TC9.2: Nên xử lý khi method là undefined', () => {
      // Arrange
      mockRequest.method = undefined;
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(loggerWarnSpy).toHaveBeenCalled();
    });

    it('TC9.3: Nên xử lý khi URL là undefined', () => {
      // Arrange
      mockRequest.url = undefined;
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(loggerWarnSpy).toHaveBeenCalled();
    });

    it('TC9.4: Nên xử lý exception không có message', () => {
      // Arrange
      const exception = new ThrottlerException();
      Object.defineProperty(exception, 'message', { value: undefined });

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(createErrorResponseSpy).toHaveBeenCalledWith(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests, please try again later',
        mockRequest,
        expect.objectContaining({
          message: undefined,
        }),
        60,
      );
    });
  });

  describe('Test Case 10: Integration Flow', () => {
    it('TC10.1: Nên thực hiện toàn bộ flow xử lý exception', () => {
      // Arrange
      mockRequest.user = { id: 'integration-user' } as any;
      const exception = new ThrottlerException('Integration test');

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert - Kiểm tra toàn bộ flow
      expect(mockArgumentsHost.switchToHttp).toHaveBeenCalled();
      expect(createErrorResponseSpy).toHaveBeenCalled();
      expect(loggerWarnSpy).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledTimes(4);
      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('TC10.2: Nên thực hiện flow với thứ tự đúng', () => {
      // Arrange
      const callOrder: string[] = [];
      const exception = new ThrottlerException();

      jest.spyOn(mockArgumentsHost, 'switchToHttp').mockImplementation(() => {
        callOrder.push('switchToHttp');
        return {
          getResponse: () => {
            callOrder.push('getResponse');
            return mockResponse;
          },
          getRequest: () => {
            callOrder.push('getRequest');
            return mockRequest;
          },
        } as any;
      });

      createErrorResponseSpy.mockImplementation((...args) => {
        callOrder.push('createErrorResponse');
        return {};
      });

      loggerWarnSpy.mockImplementation(() => {
        callOrder.push('logger.warn');
      });

      (mockResponse.setHeader as jest.Mock).mockImplementation(() => {
        callOrder.push('setHeader');
        return mockResponse;
      });

      (mockResponse.status as jest.Mock).mockImplementation(() => {
        callOrder.push('status');
        return mockResponse;
      });

      (mockResponse.json as jest.Mock).mockImplementation(() => {
        callOrder.push('json');
        return mockResponse;
      });

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(callOrder).toEqual([
        'switchToHttp',
        'getResponse',
        'getRequest',
        'createErrorResponse',
        'logger.warn',
        'setHeader',
        'setHeader',
        'setHeader',
        'setHeader',
        'status',
        'json',
      ]);
    });
  });

  describe('Test Case 11: Retry-After Value', () => {
    it('TC11.1: Nên sử dụng giá trị retry-after cố định là 60 giây', () => {
      // Arrange
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(createErrorResponseSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Object),
        expect.any(Object),
        60, // retry after value
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', '60');
    });
  });

  describe('Test Case 12: X-RateLimit Values', () => {
    it('TC12.1: Nên set X-RateLimit-Limit là 100', () => {
      // Arrange
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Limit',
        '100',
      );
    });

    it('TC12.2: Nên set X-RateLimit-Remaining là 0', () => {
      // Arrange
      const exception = new ThrottlerException();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        '0',
      );
    });

    it('TC12.3: X-RateLimit-Reset nên là timestamp sau 60 giây', () => {
      // Arrange
      const exception = new ThrottlerException();
      const now = Date.now();

      // Act
      filter.catch(exception, mockArgumentsHost);

      // Assert
      const setHeaderCalls = (mockResponse.setHeader as jest.Mock).mock.calls;
      const resetCall = setHeaderCalls.find(
        (call) => call[0] === 'X-RateLimit-Reset',
      );
      const resetValue = parseInt(resetCall[1]);

      expect(resetValue).toBeGreaterThanOrEqual(now);
      expect(resetValue).toBeLessThanOrEqual(now + 61000); // Cho phép sai số 1 giây
    });
  });
});
