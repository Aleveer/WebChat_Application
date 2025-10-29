import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cache } from 'cache-manager';
import { of } from 'rxjs';
import { first } from 'rxjs/operators';
import { CacheInterceptor } from './cache.interceptors';
import { CACHE_CONFIG_KEY } from '../decorators/cache.decorators';

describe('CacheInterceptor - Kiểm thử hộp trắng', () => {
  let interceptor: CacheInterceptor;
  let mockCacheManager: jest.Mocked<Cache>;
  let mockReflector: jest.Mocked<Reflector>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: any;

  beforeEach(() => {
    // Mock Cache Manager
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
      wrap: jest.fn(),
      store: {} as any,
    } as any;

    // Mock Reflector
    mockReflector = {
      get: jest.fn(),
      getAll: jest.fn(),
      getAllAndMerge: jest.fn(),
      getAllAndOverride: jest.fn(),
    } as any;

    // Create interceptor instance
    interceptor = new CacheInterceptor(mockCacheManager, mockReflector);

    // Mock Request
    mockRequest = {
      method: 'GET',
      path: '/api/test',
      url: '/api/test',
      query: {},
      user: undefined,
    };

    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as any;

    // Mock CallHandler
    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ data: 'test' })),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Test Case 1: trackBy - Cache Config Validation', () => {
    it('TC1.1: Nên trả về undefined khi không có cache config', () => {
      // Arrange
      mockReflector.get.mockReturnValue(undefined);

      // Act
      const result = interceptor['trackBy'](mockExecutionContext);

      // Assert
      expect(result).toBeUndefined();
      expect(mockReflector.get).toHaveBeenCalledWith(
        CACHE_CONFIG_KEY,
        mockExecutionContext.getHandler(),
      );
    });

    it('TC1.2: Nên trả về undefined khi cache config là null', () => {
      // Arrange
      mockReflector.get.mockReturnValue(null);

      // Act
      const result = interceptor['trackBy'](mockExecutionContext);

      // Assert
      expect(result).toBeUndefined();
    });

    it('TC1.3: Nên trả về undefined khi TTL = 0', () => {
      // Arrange
      mockReflector.get.mockReturnValue({ ttl: 0 });

      // Act
      const result = interceptor['trackBy'](mockExecutionContext);

      // Assert
      expect(result).toBeUndefined();
    });

    it('TC1.4: Nên trả về undefined khi TTL = 0 và có key', () => {
      // Arrange
      mockReflector.get.mockReturnValue({ ttl: 0, key: 'custom-key' });

      // Act
      const result = interceptor['trackBy'](mockExecutionContext);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('Test Case 2: trackBy - Custom Cache Key', () => {
    it('TC2.1: Nên sử dụng custom key khi được cung cấp', () => {
      // Arrange
      mockReflector.get.mockReturnValue({ ttl: 60, key: 'custom-key' });

      // Act
      const result = interceptor['trackBy'](mockExecutionContext);

      // Assert
      expect(result).toBe('custom-key');
    });

    it('TC2.2: Nên thêm userId vào custom key khi user authenticated', () => {
      // Arrange
      mockRequest.user = { id: 'user-123' };
      mockReflector.get.mockReturnValue({ ttl: 60, key: 'custom-key' });

      // Act
      const result = interceptor['trackBy'](mockExecutionContext);

      // Assert
      expect(result).toBe('custom-key:user-123');
    });

    it('TC2.3: Nên fallback về generateCacheKey khi custom key là empty string', () => {
      // Arrange
      mockReflector.get.mockReturnValue({ ttl: 60, key: '' });

      // Act
      const result = interceptor['trackBy'](mockExecutionContext);

      // Assert - Empty string is falsy, so falls back to generateCacheKey
      expect(result).toBe('cache:GET:/api/test');
    });
  });

  describe('Test Case 3: trackBy - Auto-generated Cache Key', () => {
    it('TC3.1: Nên tạo cache key tự động khi không có custom key', () => {
      // Arrange
      mockReflector.get.mockReturnValue({ ttl: 60 });
      mockRequest.method = 'GET';
      mockRequest.path = '/api/users';
      mockRequest.query = {};

      // Act
      const result = interceptor['trackBy'](mockExecutionContext);

      // Assert
      expect(result).toBe('cache:GET:/api/users');
    });

    it('TC3.2: Nên bao gồm query params trong cache key', () => {
      // Arrange
      mockReflector.get.mockReturnValue({ ttl: 60 });
      mockRequest.query = { page: '1', limit: '10' };

      // Act
      const result = interceptor['trackBy'](mockExecutionContext);

      // Assert
      expect(result).toContain('cache:GET:/api/test:');
      expect(result).toContain('"page":"1"');
      expect(result).toContain('"limit":"10"');
    });

    it('TC3.3: Nên bao gồm userId trong cache key cho authenticated user', () => {
      // Arrange
      mockReflector.get.mockReturnValue({ ttl: 60 });
      mockRequest.user = { id: 'user-456' };

      // Act
      const result = interceptor['trackBy'](mockExecutionContext);

      // Assert
      expect(result).toBe('cache:GET:/api/test:user:user-456');
    });

    it('TC3.4: Nên xử lý cả query params và userId', () => {
      // Arrange
      mockReflector.get.mockReturnValue({ ttl: 60 });
      mockRequest.query = { search: 'test' };
      mockRequest.user = { id: 'user-789' };

      // Act
      const result = interceptor['trackBy'](mockExecutionContext);

      // Assert
      expect(result).toContain('cache:GET:/api/test:');
      expect(result).toContain('"search":"test"');
      expect(result).toContain(':user:user-789');
    });
  });

  describe('Test Case 4: intercept - No Caching', () => {
    it('TC4.1: Nên skip caching khi trackBy trả về undefined', async () => {
      // Arrange
      mockReflector.get.mockReturnValue(undefined);

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      expect(result).toBe(mockCallHandler.handle());
      expect(mockCacheManager.get).not.toHaveBeenCalled();
      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('TC4.2: Nên skip caching khi TTL = 0', async () => {
      // Arrange
      mockReflector.get.mockReturnValue({ ttl: 0 });

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      // Assert
      expect(result).toBe(mockCallHandler.handle());
      expect(mockCacheManager.get).not.toHaveBeenCalled();
    });
  });

  describe('Test Case 5: intercept - Cache HIT', () => {
    it('TC5.1: Nên trả về cached value khi có trong cache', async () => {
      // Arrange
      const cachedData = { data: 'cached-value' };
      mockReflector.get.mockReturnValue({ ttl: 60 });
      mockCacheManager.get.mockResolvedValue(cachedData);

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const value = await result.pipe(first()).toPromise();

      // Assert
      expect(value).toEqual(cachedData);
      expect(mockCacheManager.get).toHaveBeenCalledWith('cache:GET:/api/test');
      expect(mockCallHandler.handle).not.toHaveBeenCalled();
    });

    it('TC5.2: Nên log Cache HIT', async () => {
      // Arrange
      const loggerSpy = jest.spyOn(interceptor['logger'], 'debug');
      mockReflector.get.mockReturnValue({ ttl: 60 });
      mockCacheManager.get.mockResolvedValue({ data: 'test' });

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      await result.pipe(first()).toPromise();

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith('Cache HIT: cache:GET:/api/test');
    });

    it('TC5.3: Cached value 0 bị bỏ qua do if (cachedValue) check', async () => {
      // Arrange - Implementation issue: if (cachedValue) blocks 0!
      mockReflector.get.mockReturnValue({ ttl: 60 });
      mockCacheManager.get.mockResolvedValue(0);

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const value = await result.pipe(first()).toPromise();

      // Assert - 0 is falsy, so if (cachedValue) is false, calls handler instead
      expect(value).toEqual({ data: 'test' }); // Falls through to handler
      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('TC5.4: Nên trả về cached array', async () => {
      // Arrange
      const cachedArray = [1, 2, 3];
      mockReflector.get.mockReturnValue({ ttl: 60 });
      mockCacheManager.get.mockResolvedValue(cachedArray);

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const value = await result.pipe(first()).toPromise();

      // Assert
      expect(value).toEqual(cachedArray);
    });
  });

  describe('Test Case 6: intercept - Cache MISS và Set', () => {
    it('TC6.1: Nên fetch data và cache khi không có trong cache', async () => {
      // Arrange
      const responseData = { data: 'fresh-data' };
      mockReflector.get.mockReturnValue({ ttl: 60 });
      mockCacheManager.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of(responseData));

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const value = await result.pipe(first()).toPromise();

      // Wait for async tap to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(value).toEqual(responseData);
      expect(mockCallHandler.handle).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'cache:GET:/api/test',
        responseData,
        60000,
      );
    });

    it('TC6.2: Nên log Cache MISS', async () => {
      // Arrange
      const loggerSpy = jest.spyOn(interceptor['logger'], 'debug');
      mockReflector.get.mockReturnValue({ ttl: 60 });
      mockCacheManager.get.mockResolvedValue(null);

      // Act
      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith('Cache MISS: cache:GET:/api/test');
    });

    it('TC6.3: Nên sử dụng default TTL 3600s khi không có config', async () => {
      // Arrange
      mockReflector.get
        .mockReturnValueOnce({ ttl: 60 }) // First call in trackBy
        .mockReturnValueOnce(undefined); // Second call in tap
      mockCacheManager.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      await result.pipe(first()).toPromise();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'cache:GET:/api/test',
        { data: 'test' },
        3600000, // Default 1 hour
      );
    });

    it('TC6.4: Nên cache với custom TTL', async () => {
      // Arrange
      mockReflector.get.mockReturnValue({ ttl: 120 });
      mockCacheManager.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      await result.pipe(first()).toPromise();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'cache:GET:/api/test',
        { data: 'test' },
        120000,
      );
    });
  });

  describe('Test Case 7: intercept - Không cache response falsy', () => {
    it('TC7.1: Không nên cache khi response là null (if condition)', async () => {
      // Arrange
      mockReflector.get.mockReturnValue({ ttl: 60 });
      mockCacheManager.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of(null));

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      await result.pipe(first()).toPromise();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert - if (response) blocks null
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('TC7.2: Không nên cache khi response là undefined', async () => {
      // Arrange
      mockReflector.get.mockReturnValue({ ttl: 60 });
      mockCacheManager.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of(undefined));

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      await result.pipe(first()).toPromise();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('TC7.3: Không nên cache khi response là 0 (blocked by if condition)', async () => {
      // Arrange
      mockReflector.get.mockReturnValue({ ttl: 60 });
      mockCacheManager.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of(0));

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      await result.pipe(first()).toPromise();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert - if (response) blocks 0
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('TC7.4: Không nên cache khi response là empty string', async () => {
      // Arrange
      mockReflector.get.mockReturnValue({ ttl: 60 });
      mockCacheManager.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of(''));

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      await result.pipe(first()).toPromise();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('TC7.5: Không nên cache khi response là false', async () => {
      // Arrange
      mockReflector.get.mockReturnValue({ ttl: 60 });
      mockCacheManager.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of(false));

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      await result.pipe(first()).toPromise();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });
  });

  describe('Test Case 8: intercept - Cache Error Handling', () => {
    it('TC8.1: Nên log error khi cache set thất bại', async () => {
      // Arrange
      const loggerSpy = jest.spyOn(interceptor['logger'], 'error');
      const cacheError = new Error('Cache write error');
      mockReflector.get.mockReturnValue({ ttl: 60 });
      mockCacheManager.get.mockResolvedValue(null);
      mockCacheManager.set.mockRejectedValue(cacheError);
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      await result.pipe(first()).toPromise();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        'Failed to cache: cache:GET:/api/test',
        cacheError,
      );
    });

    it('TC8.2: Nên trả về response ngay cả khi cache set thất bại', async () => {
      // Arrange
      mockReflector.get.mockReturnValue({ ttl: 60 });
      mockCacheManager.get.mockResolvedValue(null);
      mockCacheManager.set.mockRejectedValue(new Error('Redis down'));
      mockCallHandler.handle.mockReturnValue(of({ data: 'important' }));

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const value = await result.pipe(first()).toPromise();

      // Assert
      expect(value).toEqual({ data: 'important' });
    });
  });

  describe('Test Case 9: generateCacheKey - Method Variations', () => {
    it('TC9.1: Nên xử lý method POST', () => {
      // Arrange
      mockRequest.method = 'POST';
      mockRequest.path = '/api/users';

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toBe('cache:POST:/api/users');
    });

    it('TC9.2: Nên xử lý method PUT', () => {
      // Arrange
      mockRequest.method = 'PUT';
      mockRequest.path = '/api/users/123';

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toBe('cache:PUT:/api/users/123');
    });

    it('TC9.3: Nên xử lý method DELETE', () => {
      // Arrange
      mockRequest.method = 'DELETE';
      mockRequest.path = '/api/users/456';

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toBe('cache:DELETE:/api/users/456');
    });

    it('TC9.4: Nên xử lý path với parameters', () => {
      // Arrange
      mockRequest.method = 'GET';
      mockRequest.path = '/api/users/123/posts/456';

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toBe('cache:GET:/api/users/123/posts/456');
    });
  });

  describe('Test Case 10: generateCacheKey - Query Parameters', () => {
    it('TC10.1: Nên xử lý empty query', () => {
      // Arrange
      mockRequest.query = {};

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toBe('cache:GET:/api/test');
      expect(result).not.toContain(':{}');
    });

    it('TC10.2: Nên xử lý single query param', () => {
      // Arrange
      mockRequest.query = { page: '1' };

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toContain('cache:GET:/api/test:');
      expect(result).toContain('"page":"1"');
    });

    it('TC10.3: Nên xử lý multiple query params', () => {
      // Arrange
      mockRequest.query = { page: '2', limit: '20', sort: 'asc' };

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toContain('"page":"2"');
      expect(result).toContain('"limit":"20"');
      expect(result).toContain('"sort":"asc"');
    });

    it('TC10.4: Nên serialize query params thành JSON', () => {
      // Arrange
      mockRequest.query = { filter: { status: 'active', role: 'admin' } };

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toContain('cache:GET:/api/test:');
      expect(result).toContain('filter');
      expect(result).toContain('status');
      expect(result).toContain('active');
    });

    it('TC10.5: Nên xử lý query params với special characters', () => {
      // Arrange
      mockRequest.query = { search: 'test@example.com' };

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toContain('test@example.com');
    });
  });

  describe('Test Case 11: generateCacheKey - User Context', () => {
    it('TC11.1: Không nên thêm userId khi user undefined', () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toBe('cache:GET:/api/test');
      expect(result).not.toContain(':user:');
    });

    it('TC11.2: Không nên thêm userId khi user null', () => {
      // Arrange
      mockRequest.user = null;

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toBe('cache:GET:/api/test');
    });

    it('TC11.3: Không nên thêm userId khi user không có id', () => {
      // Arrange
      mockRequest.user = { name: 'John' };

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toBe('cache:GET:/api/test');
    });

    it('TC11.4: Nên thêm userId khi user có id', () => {
      // Arrange
      mockRequest.user = { id: 'user-abc-123' };

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toBe('cache:GET:/api/test:user:user-abc-123');
    });

    it('TC11.5: Nên xử lý userId numeric', () => {
      // Arrange
      mockRequest.user = { id: 12345 };

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toBe('cache:GET:/api/test:user:12345');
    });

    it('TC11.6: Không nên thêm userId khi id là empty string', () => {
      // Arrange
      mockRequest.user = { id: '' };

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toBe('cache:GET:/api/test');
    });
  });

  describe('Test Case 12: buildCacheKey', () => {
    it('TC12.1: Nên trả về prefix khi không có user', () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      const result = interceptor['buildCacheKey']('my-prefix', mockRequest);

      // Assert
      expect(result).toBe('my-prefix');
    });

    it('TC12.2: Nên thêm userId vào prefix khi có user', () => {
      // Arrange
      mockRequest.user = { id: 'user-xyz' };

      // Act
      const result = interceptor['buildCacheKey']('my-prefix', mockRequest);

      // Assert
      expect(result).toBe('my-prefix:user-xyz');
    });

    it('TC12.3: Nên xử lý prefix rỗng', () => {
      // Arrange
      mockRequest.user = { id: 'user-123' };

      // Act
      const result = interceptor['buildCacheKey']('', mockRequest);

      // Assert
      expect(result).toBe(':user-123');
    });

    it('TC12.4: Nên xử lý prefix với colon', () => {
      // Arrange
      mockRequest.user = { id: 'user-456' };

      // Act
      const result = interceptor['buildCacheKey']('cache:custom:', mockRequest);

      // Assert
      expect(result).toBe('cache:custom::user-456');
    });

    it('TC12.5: Không nên thêm userId khi id là null', () => {
      // Arrange
      mockRequest.user = { id: null };

      // Act
      const result = interceptor['buildCacheKey']('prefix', mockRequest);

      // Assert
      expect(result).toBe('prefix');
    });
  });

  describe('Test Case 13: Integration - Complete Flows', () => {
    it('TC13.1: Flow hoàn chỉnh - Cache MISS -> Set -> HIT', async () => {
      // Arrange
      const data = { id: 1, name: 'Test' };
      mockReflector.get.mockReturnValue({ ttl: 60 });
      mockCacheManager.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of(data));

      // Act - First request (MISS)
      const result1 = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const value1 = await result1.pipe(first()).toPromise();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Arrange - Second request (HIT)
      mockCacheManager.get.mockResolvedValue(data);

      // Act - Second request
      const result2 = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      const value2 = await result2.pipe(first()).toPromise();

      // Assert
      expect(value1).toEqual(data);
      expect(value2).toEqual(data);
      expect(mockCallHandler.handle).toHaveBeenCalledTimes(1);
    });

    it('TC13.2: Flow với authenticated user và query params', async () => {
      // Arrange
      mockRequest.user = { id: 'user-integration' };
      mockRequest.query = { filter: 'active' };
      mockReflector.get.mockReturnValue({ ttl: 120 });
      mockCacheManager.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of({ results: [] }));

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      await result.pipe(first()).toPromise();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.stringContaining('cache:GET:/api/test:'),
        { results: [] },
        120000,
      );
    });

    it('TC13.3: Flow với custom key và user', async () => {
      // Arrange
      mockRequest.user = { id: 'user-custom' };
      mockReflector.get.mockReturnValue({ ttl: 90, key: 'custom-cache' });
      mockCacheManager.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of({ custom: 'data' }));

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      await result.pipe(first()).toPromise();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'custom-cache:user-custom',
        { custom: 'data' },
        90000,
      );
    });
  });

  describe('Test Case 14: Edge Cases', () => {
    it('TC14.1: Nên xử lý path với trailing slash', () => {
      // Arrange
      mockRequest.path = '/api/test/';

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toBe('cache:GET:/api/test/');
    });

    it('TC14.2: Nên xử lý path root', () => {
      // Arrange
      mockRequest.path = '/';

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toBe('cache:GET:/');
    });

    it('TC14.3: Nên xử lý query với array values', () => {
      // Arrange
      mockRequest.query = { tags: ['nodejs', 'typescript'] };

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toContain('nodejs');
      expect(result).toContain('typescript');
    });

    it('TC14.4: Nên xử lý TTL rất lớn', async () => {
      // Arrange
      const largeTTL = 86400; // 1 day
      mockReflector.get.mockReturnValue({ ttl: largeTTL });
      mockCacheManager.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      // Act
      const result = await interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );
      await result.pipe(first()).toPromise();
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        expect.any(String),
        { data: 'test' },
        86400000, // 1 day in ms
      );
    });

    it('TC14.5: Nên xử lý userId với special characters', () => {
      // Arrange
      mockRequest.user = { id: 'user@domain.com' };

      // Act
      const result = interceptor['generateCacheKey'](mockRequest);

      // Assert
      expect(result).toContain('user@domain.com');
    });
  });
});
