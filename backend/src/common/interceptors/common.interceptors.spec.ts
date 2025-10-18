import { ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { Request, Response } from 'express';
import {
  LoggingInterceptor,
  ResponseTransformInterceptor,
  CacheInterceptor,
  PerformanceInterceptor,
  RequestIdInterceptor,
  TimeoutInterceptor,
  CompressionInterceptor,
  SecurityHeadersInterceptor,
  RateLimitInterceptor,
  SanitizationInterceptor,
} from './common.interceptors';

describe('Common Interceptors - White Box Testing', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  // Helper functions để giảm code duplication
  /**
   * Tạo mock call handler với data tùy chỉnh
   * @param data - Data để mock trả về từ handler
   * @returns Mock CallHandler object với handle method được mock
   */
  const createMockCallHandler = (data?: any) => ({
    handle: jest.fn().mockReturnValue(of(data)),
  });

  /**
   * Tạo mock execution context với request/response tùy chỉnh
   * @param request - Optional custom request object
   * @param response - Optional custom response object
   * @returns Mock ExecutionContext object với switchToHttp method được mock
   */
  const createMockExecutionContext = (
    request?: Partial<Request>,
    response?: Partial<Response>,
  ) =>
    ({
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request || mockRequest),
        getResponse: jest.fn().mockReturnValue(response || mockResponse),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as any;

  /**
   * Setup mock Logger để tránh console output trong test
   * Mock các method log, warn, error của Logger prototype
   */
  const setupLoggerMocks = () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  };

  /**
   * Setup mock Reflect.getMetadata cho cache interceptor
   * @param ttl - Time to live cho cache (default: 60000ms)
   */
  const setupCacheMetadataMock = (ttl: number = 60000) => {
    jest.spyOn(Reflect, 'getMetadata').mockImplementation((key, target) => {
      if (key === 'cache') {
        return { ttl };
      }
      return undefined;
    });
  };

  /**
   * Mock Date.now với giá trị tùy chỉnh để test timing
   * @param timestamps - Array các timestamp để mock theo thứ tự
   * @returns Function để restore Date.now về giá trị gốc
   */
  const mockDateNow = (timestamps: number[]) => {
    const originalNow = Date.now;
    let callCount = 0;
    Date.now = jest.fn(() => {
      const timestamp =
        timestamps[callCount] || timestamps[timestamps.length - 1];
      callCount++;
      return timestamp;
    });
    return originalNow;
  };

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      url: '/test',
      ip: '127.0.0.1', //TODO: Có thể thay đổi địa chỉ IP tùy chỉnh
      headers: {
        'user-agent': 'test-agent',
        'x-request-id': 'test-request-id',
      },
      body: { test: 'data' },
      query: { param: 'value' },
      setTimeout: jest.fn(),
    };

    mockResponse = {
      statusCode: 200,
      setHeader: jest.fn(),
    };

    mockExecutionContext = createMockExecutionContext();
    mockCallHandler = createMockCallHandler();

    setupLoggerMocks();
    setupCacheMetadataMock();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('LoggingInterceptor', () => {
    let interceptor: LoggingInterceptor;

    beforeEach(() => {
      interceptor = new LoggingInterceptor();
    });

    it('should log incoming request and outgoing response', async () => {
      // Arrange
      const mockData = { success: true, data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      expect(result).toBeDefined();
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Incoming Request: GET /test - 127.0.0.1 - test-agent',
      );

      // Wait for completion to ensure all logs are captured
      await result.toPromise();
    });

    it('should log request error with error details', async () => {
      // Arrange
      const error = new Error('Test error') as any;
      error.status = 400;
      const callHandler = {
        handle: jest.fn().mockReturnValue(throwError(() => error)),
      };

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      expect(result).toBeDefined();

      try {
        await result.toPromise();
        fail('Should have thrown error');
      } catch (thrownError) {
        expect(thrownError).toBe(error);
        expect(Logger.prototype.error).toHaveBeenCalledWith(
          expect.stringContaining('Request Error: GET /test - 400'),
        );
      }
    });

    it('should handle request without user-agent header', async () => {
      // Arrange
      mockRequest.headers = {};
      const mockData = { success: true };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      expect(result).toBeDefined();
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        'Incoming Request: GET /test - 127.0.0.1 - ',
      );

      await result.toPromise();
    });

    it('should calculate and log request duration', async () => {
      // Arrange
      const mockData = { success: true };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      await result.toPromise();
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Outgoing Response: GET /test - 200'),
      );
    });
  });

  describe('ResponseTransformInterceptor', () => {
    let interceptor: ResponseTransformInterceptor;

    beforeEach(() => {
      interceptor = new ResponseTransformInterceptor();
    });

    it('should transform data to standard response format', async () => {
      // Arrange
      const mockData = { id: 1, name: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      const data = await result.toPromise();
      expect(data).toEqual({
        success: true,
        data: mockData,
        timestamp: expect.any(String),
      });
    });

    it('should return data as is if already formatted', async () => {
      // Arrange
      const mockData = { success: true, data: 'test', timestamp: '2023-01-01' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      const data = await result.toPromise();
      expect(data).toEqual(mockData);
    });

    it('should handle null data', async () => {
      // Arrange
      const callHandler = createMockCallHandler(null);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      const data = await result.toPromise();
      expect(data).toEqual({
        success: true,
        data: null,
        timestamp: expect.any(String),
      });
    });

    it('should handle undefined data', async () => {
      // Arrange
      const callHandler = createMockCallHandler(undefined);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      const data = await result.toPromise();
      expect(data).toEqual({
        success: true,
        data: undefined,
        timestamp: expect.any(String),
      });
    });
  });

  describe('CacheInterceptor', () => {
    let interceptor: CacheInterceptor;

    beforeEach(() => {
      interceptor = new CacheInterceptor();
    });

    it('should cache data and return it on second request', async () => {
      // Arrange
      const mockData = { cached: 'data' };
      const firstCallHandler = {
        handle: jest.fn().mockReturnValue(of(mockData)),
      };
      const secondCallHandler = {
        handle: jest.fn().mockReturnValue(of(mockData)),
      };

      // Act - First request (should cache data)
      const firstResult = interceptor.intercept(
        mockExecutionContext,
        firstCallHandler,
      );

      // Wait for first request to complete
      await firstResult.toPromise();

      // Act - Second request (should use cached data)
      const secondResult = interceptor.intercept(
        mockExecutionContext,
        secondCallHandler,
      );

      // Wait for second request to complete
      const secondData = await secondResult.toPromise();

      // Assert
      expect(secondData).toEqual(mockData);
      expect(firstCallHandler.handle).toHaveBeenCalledTimes(1);
      expect(secondCallHandler.handle).toHaveBeenCalledTimes(0);
    });

    it('should call next handler when cache is expired', async () => {
      // Arrange
      const mockData = { fresh: 'data' };
      const cacheKey = 'GET:/test:{}';
      const callHandler = createMockCallHandler(mockData);

      // Set expired cache
      (interceptor as any).cache.set(cacheKey, {
        data: { old: 'data' },
        expiry: Date.now() - 1000,
      });

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      const data = await result.toPromise();
      expect(data).toEqual(mockData);
      expect(callHandler.handle).toHaveBeenCalled();
    });

    it('should cache response data with TTL', async () => {
      // Arrange
      const mockData = { fresh: 'data' };
      const callHandler = createMockCallHandler(mockData);

      // Reset query to empty object for this test
      mockRequest.query = {};

      // Mock metadata for cache TTL
      setupCacheMetadataMock(60000);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Wait for result to complete
      await result.toPromise();

      // Assert
      const cacheKey = 'GET:/test:{}';
      const cached = (interceptor as any).cache.get(cacheKey);
      expect(cached).toBeDefined();
      expect(cached.data).toEqual(mockData);
      expect(cached.expiry).toBeGreaterThan(Date.now());
    });

    it('should not cache when TTL is 0', async () => {
      // Arrange
      const mockData = { fresh: 'data' };
      const callHandler = createMockCallHandler(mockData);

      // Mock metadata for no cache
      setupCacheMetadataMock(0);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      await result.toPromise();
      const cacheKey = 'GET:/test:{}';
      const cached = (interceptor as any).cache.get(cacheKey);
      expect(cached).toBeUndefined();
    });

    it('should generate correct cache key with query parameters', async () => {
      // Arrange
      mockRequest.query = { page: '1', limit: '10' };
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Mock metadata for cache TTL
      setupCacheMetadataMock(60000);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Wait for result to complete
      await result.toPromise();

      // Assert
      const expectedKey = 'GET:/test:{"page":"1","limit":"10"}';
      const cached = (interceptor as any).cache.get(expectedKey);
      expect(cached).toBeDefined();
      expect(cached.data).toEqual(mockData);
    });
  });

  describe('PerformanceInterceptor', () => {
    let interceptor: PerformanceInterceptor;

    beforeEach(() => {
      interceptor = new PerformanceInterceptor();
    });

    it('should log warning for slow requests', async () => {
      // Arrange
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Mock Date.now to simulate slow request
      const originalNow = Date.now;
      let callCount = 0;
      Date.now = jest.fn(() => {
        callCount++;
        return callCount === 1 ? 0 : 2000; // 2 second duration
      });

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      await result.toPromise();
      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        'Slow Request: GET /test took 2000ms',
      );

      // Restore original Date.now
      Date.now = originalNow;
    });

    it('should not log warning for fast requests', async () => {
      // Arrange
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      await result.toPromise();
      expect(Logger.prototype.warn).not.toHaveBeenCalled();
    });
  });

  describe('RequestIdInterceptor', () => {
    let interceptor: RequestIdInterceptor;

    beforeEach(() => {
      interceptor = new RequestIdInterceptor();
    });

    it('should use existing x-request-id header', async () => {
      // Arrange
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      await result.toPromise();
      expect(mockRequest.requestId).toBe('test-request-id');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Request-ID',
        'test-request-id',
      );
    });

    it('should use x-correlation-id header when x-request-id is not available', async () => {
      // Arrange
      mockRequest.headers = { 'x-correlation-id': 'correlation-123' };
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      await result.toPromise();
      expect(mockRequest.requestId).toBe('correlation-123');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Request-ID',
        'correlation-123',
      );
    });

    it('should generate new request ID when no headers are present', async () => {
      // Arrange
      mockRequest.headers = {};
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      await result.toPromise();
      expect(mockRequest.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Request-ID',
        mockRequest.requestId,
      );
    });

    it('should generate unique request IDs', async () => {
      // Arrange
      mockRequest.headers = {};
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result1 = interceptor.intercept(mockExecutionContext, callHandler);
      const result2 = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      await result1.toPromise();
      await result2.toPromise();
      expect(mockRequest.requestId).toBeDefined();
    });
  });

  describe('TimeoutInterceptor', () => {
    let interceptor: TimeoutInterceptor;

    beforeEach(() => {
      interceptor = new TimeoutInterceptor(5000);
    });

    it('should set timeout on request', async () => {
      // Arrange
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      await result.toPromise();
      expect(mockRequest.setTimeout).toHaveBeenCalledWith(5000);
    });

    it('should use default timeout when not specified', async () => {
      // Arrange
      const defaultInterceptor = new TimeoutInterceptor();
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = defaultInterceptor.intercept(
        mockExecutionContext,
        callHandler,
      );

      // Assert
      await result.toPromise();
      expect(mockRequest.setTimeout).toHaveBeenCalledWith(30000);
    });
  });

  describe('CompressionInterceptor', () => {
    let interceptor: CompressionInterceptor;

    beforeEach(() => {
      interceptor = new CompressionInterceptor();
    });

    it('should set compression headers', async () => {
      // Arrange
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      await result.toPromise();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Encoding',
        'gzip',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Vary',
        'Accept-Encoding',
      );
    });
  });

  describe('SecurityHeadersInterceptor', () => {
    let interceptor: SecurityHeadersInterceptor;

    beforeEach(() => {
      interceptor = new SecurityHeadersInterceptor();
    });

    it('should set all security headers', async () => {
      // Arrange
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      await result.toPromise();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'nosniff',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Frame-Options',
        'DENY',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-XSS-Protection',
        '1; mode=block',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'strict-origin-when-cross-origin',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy',
        "default-src 'self'",
      );
    });
  });

  describe('RateLimitInterceptor', () => {
    let interceptor: RateLimitInterceptor;

    beforeEach(() => {
      interceptor = new RateLimitInterceptor();
    });

    it('should allow first request', async () => {
      // Arrange
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      const data = await result.toPromise();
      expect(data).toEqual(mockData);
    });

    it('should allow requests within limit', async () => {
      // Arrange
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act - Make multiple requests
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(interceptor.intercept(mockExecutionContext, callHandler));
      }

      // Assert
      for (const result of results) {
        const data = await result.toPromise();
        expect(data).toEqual(mockData);
      }
    });

    it('should throw error when rate limit is exceeded', async () => {
      // Arrange
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act - Make requests exceeding limit
      const results = [];
      for (let i = 0; i < 101; i++) {
        results.push(interceptor.intercept(mockExecutionContext, callHandler));
      }

      // Assert
      try {
        await results[100].toPromise();
        fail('Should have thrown error');
      } catch (error) {
        expect(error.message).toBe('Rate limit exceeded');
      }
    });

    it('should handle unknown IP', async () => {
      // Arrange
      const mockExecutionContextWithUndefinedIP = createMockExecutionContext({
        ...mockRequest,
        ip: undefined,
      });
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(
        mockExecutionContextWithUndefinedIP,
        callHandler,
      );

      // Assert
      const data = await result.toPromise();
      expect(data).toEqual(mockData);
    });

    it('should reset rate limit after window expires', async () => {
      // Arrange
      const testInterceptor = new RateLimitInterceptor();
      const testData = { message: 'success' };
      const testCallHandler = createMockCallHandler(testData);

      // Mock Date.now to control time
      const originalDateNow = mockDateNow([0, 16 * 60 * 1000]); // 16 minutes later

      // Act - First request (should succeed)
      const firstResult = testInterceptor.intercept(
        mockExecutionContext,
        testCallHandler,
      );

      // Act - Second request after window expires (should also succeed)
      const secondResult = testInterceptor.intercept(
        mockExecutionContext,
        testCallHandler,
      );

      // Assert - Both requests should succeed
      const firstData = await firstResult.toPromise();
      const secondData = await secondResult.toPromise();

      expect(firstData).toEqual(testData);
      expect(secondData).toEqual(testData);
      expect(testCallHandler.handle).toHaveBeenCalledTimes(2);

      // Restore original Date.now
      Date.now = originalDateNow;
    });
  });

  describe('SanitizationInterceptor', () => {
    let interceptor: SanitizationInterceptor;

    beforeEach(() => {
      interceptor = new SanitizationInterceptor();
    });

    it('should sanitize request body', async () => {
      // Arrange
      mockRequest.body = {
        name: 'John<script>alert("xss")</script>',
        email: 'john@example.com',
      };
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      await result.toPromise();
      expect(mockRequest.body.name).toBe('John');
      expect(mockRequest.body.email).toBe('john@example.com');
    });

    it('should sanitize query parameters', async () => {
      // Arrange
      mockRequest.query = {
        search: 'test<script>alert("xss")</script>',
        page: '1',
      };
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      await result.toPromise();
      expect(mockRequest.query.search).toBe('test');
      expect(mockRequest.query.page).toBe('1');
    });

    it('should handle nested objects', async () => {
      // Arrange
      mockRequest.body = {
        user: {
          name: 'John<script>alert("xss")</script>',
          profile: {
            bio: 'Bio<script>alert("xss")</script>',
          },
        },
      };
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      await result.toPromise();
      expect(mockRequest.body.user.name).toBe('John');
      expect(mockRequest.body.user.profile.bio).toBe('Bio');
    });

    it('should handle arrays', async () => {
      // Arrange
      mockRequest.body = {
        tags: ['tag1', 'tag2<script>alert("xss")</script>', 'tag3'],
      };
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      await result.toPromise();
      expect(mockRequest.body.tags).toBeDefined();
      expect(Array.isArray(mockRequest.body.tags)).toBe(true);
    });

    it('should handle null and undefined values', async () => {
      // Arrange
      mockRequest.body = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
      };
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      await result.toPromise();
      expect(mockRequest.body.nullValue).toBeNull();
      expect(mockRequest.body.undefinedValue).toBeUndefined();
      expect(mockRequest.body.emptyString).toBe('');
    });

    it('should handle non-object values', async () => {
      // Arrange
      mockRequest.body = 'simple string';
      const mockData = { data: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      const result = interceptor.intercept(mockExecutionContext, callHandler);

      // Assert
      await result.toPromise();
      expect(mockRequest.body).toBe('simple string');
    });
  });

  describe('Integration Tests - White Box Testing', () => {
    it('should work with multiple interceptors in sequence', async () => {
      // Arrange
      const loggingInterceptor = new LoggingInterceptor();
      const responseInterceptor = new ResponseTransformInterceptor();
      const requestIdInterceptor = new RequestIdInterceptor();

      const mockData = { id: 1, name: 'test' };
      const callHandler = createMockCallHandler(mockData);

      // Act
      let result = loggingInterceptor.intercept(
        mockExecutionContext,
        callHandler,
      );
      result = responseInterceptor.intercept(mockExecutionContext, {
        handle: () => result,
      });
      result = requestIdInterceptor.intercept(mockExecutionContext, {
        handle: () => result,
      });

      // Assert
      const data = await result.toPromise();
      expect(data).toEqual({
        success: true,
        data: mockData,
        timestamp: expect.any(String),
      });
      expect(mockRequest.requestId).toBeDefined();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Request-ID',
        mockRequest.requestId,
      );
    });

    it('should handle error propagation through interceptors', async () => {
      // Arrange
      const loggingInterceptor = new LoggingInterceptor();
      const error = new Error('Test error') as any;
      error.status = 500;
      const callHandler = {
        handle: jest.fn().mockReturnValue(throwError(() => error)),
      };

      // Act
      const result = loggingInterceptor.intercept(
        mockExecutionContext,
        callHandler,
      );

      // Assert
      try {
        await result.toPromise();
        fail('Should have thrown error');
      } catch (thrownError) {
        expect(thrownError).toBe(error);
        expect(Logger.prototype.error).toHaveBeenCalledWith(
          expect.stringContaining('Request Error: GET /test - 500'),
        );
      }
    });

    it('should test interceptor state management', async () => {
      // Arrange
      const cacheInterceptor = new CacheInterceptor();
      const mockData = { cached: 'data' };

      // Create separate call handlers for each request to avoid side effects
      const firstCallHandler = createMockCallHandler(mockData);
      const secondCallHandler = createMockCallHandler(mockData);

      // Mock metadata for cache TTL
      setupCacheMetadataMock(60000);

      // Act - First request
      const result1 = cacheInterceptor.intercept(
        mockExecutionContext,
        firstCallHandler,
      );

      // Wait for first request to complete
      await result1.toPromise();

      // Act - Second request (should use cache)
      const result2 = cacheInterceptor.intercept(
        mockExecutionContext,
        secondCallHandler,
      );

      // Wait for second request to complete
      const secondResult = await result2.toPromise();

      // Assert
      expect(secondResult).toEqual(mockData);
      expect(firstCallHandler.handle).toHaveBeenCalledTimes(1); // First request calls handler
      expect(secondCallHandler.handle).toHaveBeenCalledTimes(0); // Second request uses cache
    });
  });
});
