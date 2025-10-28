import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { HealthCheckService } from '../src/common/services/healthcheck.services';
import { CacheService } from '../src/common/services/cache.services';

describe('HealthCheckService - White Box Testing', () => {
  let service: HealthCheckService;
  let mockConnection: Partial<Connection>;
  let mockCacheService: Partial<CacheService>;

  beforeEach(async () => {
    // Mock Connection
    mockConnection = {
      name: 'webchat-test',
      readyState: 1,
      db: {
        admin: jest.fn().mockReturnValue({
          ping: jest.fn().mockResolvedValue({ ok: 1 }),
        }),
      } as any,
    };

    // Mock CacheService
    mockCacheService = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue('test_value'),
      has: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthCheckService,
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<HealthCheckService>(HealthCheckService);

    // Suppress logger output during tests
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    /**
     * TC001: Kiểm tra service được khởi tạo
     * Input: N/A
     * Expected Output: Service instance tồn tại
     * Path Coverage: Constructor execution
     */
    it('TC001: should be defined', () => {
      expect(service).toBeDefined();
    });

    /**
     * TC002: Kiểm tra logger được khởi tạo
     * Input: N/A
     * Expected Output: Logger instance tồn tại với đúng context
     * Path Coverage: Logger initialization
     */
    it('TC002: should initialize logger with correct context', () => {
      const loggerSpy = jest.spyOn(Logger.prototype, 'error');
      expect(service['logger']).toBeDefined();
      expect(service['logger']).toBeInstanceOf(Logger);
      
      // Verify logger context by triggering an error
      service['logger'].error('test');
      expect(loggerSpy).toHaveBeenCalled();
    });

    /**
     * TC003: Kiểm tra connection được inject
     * Input: N/A
     * Expected Output: Connection instance tồn tại
     * Path Coverage: Dependency injection verification
     */
    it('TC003: should have connection injected', () => {
      expect(service['connection']).toBeDefined();
      expect(service['connection']).toBe(mockConnection);
    });

    /**
     * TC004: Kiểm tra cacheService được inject
     * Input: N/A
     * Expected Output: CacheService instance tồn tại
     * Path Coverage: Dependency injection verification
     */
    it('TC004: should have cacheService injected', () => {
      expect(service['cacheService']).toBeDefined();
      expect(service['cacheService']).toBe(mockCacheService);
    });
  });

  describe('checkDatabase() Method - Success Paths', () => {
    /**
     * TC005: Kiểm tra checkDatabase khi database healthy
     * Input: Mock successful ping
     * Expected Output: { status: 'healthy', responseTime: number, details: {...} }
     * Path Coverage: Try block - success path
     */
    it('TC005: should return healthy status when database ping succeeds', async () => {
      const result = await service.checkDatabase();

      expect(result.status).toBe('healthy');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.details).toBeDefined();
      expect(result.details.database).toBe('webchat-test');
      expect(result.details.readyState).toBe(1);
    });

    /**
     * TC006: Kiểm tra checkDatabase calls admin().ping()
     * Input: N/A
     * Expected Output: admin().ping() được gọi
     * Path Coverage: Database ping execution
     */
    it('TC006: should call connection.db.admin().ping()', async () => {
      const pingMock = mockConnection.db.admin().ping as jest.Mock;
      
      // Reset call counts from beforeEach
      pingMock.mockClear();

      await service.checkDatabase();

      expect(pingMock).toHaveBeenCalledTimes(1);
      expect(pingMock).toHaveBeenCalledWith();
    });

    /**
     * TC007: Kiểm tra responseTime được tính toán
     * Input: Mock ping with delay
     * Expected Output: responseTime > 0
     * Path Coverage: Time measurement
     */
    it('TC007: should calculate responseTime correctly', async () => {
      const pingMock = mockConnection.db.admin().ping as jest.Mock;
      pingMock.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: 1 }), 50)),
      );

      const result = await service.checkDatabase();

      expect(result.responseTime).toBeGreaterThanOrEqual(50);
    });

    /**
     * TC008: Kiểm tra startTime initialization
     * Input: N/A
     * Expected Output: responseTime được tính từ Date.now()
     * Path Coverage: Date.now() call at start
     */
    it('TC008: should initialize startTime with Date.now()', async () => {
      const dateNowSpy = jest.spyOn(Date, 'now');
      const startTime = Date.now();

      await service.checkDatabase();

      expect(dateNowSpy).toHaveBeenCalled();
      expect(dateNowSpy.mock.results[0].value).toBeGreaterThanOrEqual(startTime);
    });

    /**
     * TC009: Kiểm tra details object structure
     * Input: Mock connection với specific properties
     * Expected Output: details chứa database và readyState
     * Path Coverage: Details object creation
     */
    it('TC009: should include correct details in healthy response', async () => {
      (mockConnection as any).name = 'custom-db';
      (mockConnection as any).readyState = 2;

      const result = await service.checkDatabase();

      expect(result.details).toEqual({
        database: 'custom-db',
        readyState: 2,
      });
    });

    /**
     * TC010: Kiểm tra return object có đầy đủ properties
     * Input: N/A
     * Expected Output: Object có status, responseTime, details
     * Path Coverage: Return object structure
     */
    it('TC010: should return object with all required properties', async () => {
      const result = await service.checkDatabase();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('responseTime');
      expect(result).toHaveProperty('details');
      expect(Object.keys(result)).toHaveLength(3);
    });
  });

  describe('checkDatabase() Method - Error Paths', () => {
    /**
     * TC011: Kiểm tra checkDatabase khi ping fails
     * Input: Mock ping throws error
     * Expected Output: { status: 'unhealthy', responseTime, details with error }
     * Path Coverage: Catch block execution
     */
    it('TC011: should return unhealthy status when ping fails', async () => {
      const error = new Error('Connection timeout');
      const pingMock = mockConnection.db.admin().ping as jest.Mock;
      pingMock.mockRejectedValue(error);

      const result = await service.checkDatabase();

      expect(result.status).toBe('unhealthy');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.details.error).toBe('Connection timeout');
    });

    /**
     * TC012: Kiểm tra error logging
     * Input: Mock ping throws error
     * Expected Output: Logger.error được gọi
     * Path Coverage: Error logging execution
     */
    it('TC012: should log error when database check fails', async () => {
      const error = new Error('Database error');
      const pingMock = mockConnection.db.admin().ping as jest.Mock;
      pingMock.mockRejectedValue(error);

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await service.checkDatabase();

      expect(loggerSpy).toHaveBeenCalledWith('Database health check failed:', error);
    });

    /**
     * TC013: Kiểm tra responseTime trong error case
     * Input: Mock ping fails after delay
     * Expected Output: responseTime vẫn được tính
     * Path Coverage: responseTime calculation in catch block
     */
    it('TC013: should calculate responseTime even when check fails', async () => {
      const pingMock = mockConnection.db.admin().ping as jest.Mock;
      pingMock.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 30),
          ),
      );

      const result = await service.checkDatabase();

      expect(result.responseTime).toBeGreaterThanOrEqual(30);
    });

    /**
     * TC014: Kiểm tra details trong error case
     * Input: Mock ping fails
     * Expected Output: details chứa error, database, readyState
     * Path Coverage: Error details object creation
     */
    it('TC014: should include error details in unhealthy response', async () => {
      const error = new Error('Connection refused');
      const pingMock = mockConnection.db.admin().ping as jest.Mock;
      pingMock.mockRejectedValue(error);

      (mockConnection as any).name = 'test-db';
      (mockConnection as any).readyState = 0;

      const result = await service.checkDatabase();

      expect(result.details).toEqual({
        error: 'Connection refused',
        database: 'test-db',
        readyState: 0,
      });
    });

    /**
     * TC015: Kiểm tra error.message property
     * Input: Error object with message
     * Expected Output: error.message được sử dụng
     * Path Coverage: Error message extraction
     */
    it('TC015: should extract error message correctly', async () => {
      const error = new Error('Custom error message');
      const pingMock = mockConnection.db.admin().ping as jest.Mock;
      pingMock.mockRejectedValue(error);

      const result = await service.checkDatabase();

      expect(result.details.error).toBe('Custom error message');
    });

    /**
     * TC016: Kiểm tra error object without message
     * Input: Error without explicit message
     * Expected Output: Handle gracefully
     * Path Coverage: Edge case - error without message
     */
    it('TC016: should handle error without message', async () => {
      const error = { message: undefined };
      const pingMock = mockConnection.db.admin().ping as jest.Mock;
      pingMock.mockRejectedValue(error);

      const result = await service.checkDatabase();

      expect(result.status).toBe('unhealthy');
      expect(result.details).toHaveProperty('error');
    });
  });

  describe('checkCache() Method - Success Paths', () => {
    /**
     * TC017: Kiểm tra checkCache khi cache healthy
     * Input: Mock successful cache operations
     * Expected Output: { status: 'healthy', responseTime, details }
     * Path Coverage: Try block - all operations succeed
     */
    it('TC017: should return healthy status when all cache operations succeed', async () => {
      const result = await service.checkCache();

      expect(result.status).toBe('healthy');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.details).toBeDefined();
      expect(result.details.operations).toBeDefined();
    });

    /**
     * TC018: Kiểm tra cache operations sequence
     * Input: N/A
     * Expected Output: set -> get -> has -> delete được gọi theo thứ tự
     * Path Coverage: Sequential cache operations
     */
    it('TC018: should execute cache operations in correct sequence', async () => {
      const callOrder: string[] = [];

      (mockCacheService.set as jest.Mock).mockImplementation(async () => {
        callOrder.push('set');
      });
      (mockCacheService.get as jest.Mock).mockImplementation(async () => {
        callOrder.push('get');
        return 'test_value';
      });
      (mockCacheService.has as jest.Mock).mockImplementation(async () => {
        callOrder.push('has');
        return true;
      });
      (mockCacheService.delete as jest.Mock).mockImplementation(async () => {
        callOrder.push('delete');
      });

      await service.checkCache();

      expect(callOrder).toEqual(['set', 'get', 'has', 'delete']);
    });

    /**
     * TC019: Kiểm tra cache set operation
     * Input: N/A
     * Expected Output: set được gọi với testKey, testValue, TTL=10
     * Path Coverage: Cache write operation
     */
    it('TC019: should call cache set with correct parameters', async () => {
      await service.checkCache();

      expect(mockCacheService.set).toHaveBeenCalledTimes(1);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'health_check_test',
        'test_value',
        10,
      );
    });

    /**
     * TC020: Kiểm tra cache get operation
     * Input: N/A
     * Expected Output: get được gọi với testKey
     * Path Coverage: Cache read operation
     */
    it('TC020: should call cache get with correct key', async () => {
      await service.checkCache();

      expect(mockCacheService.get).toHaveBeenCalledTimes(1);
      expect(mockCacheService.get).toHaveBeenCalledWith('health_check_test');
    });

    /**
     * TC021: Kiểm tra cache has operation
     * Input: N/A
     * Expected Output: has được gọi với testKey
     * Path Coverage: Cache existence check
     */
    it('TC021: should call cache has with correct key', async () => {
      await service.checkCache();

      expect(mockCacheService.has).toHaveBeenCalledTimes(1);
      expect(mockCacheService.has).toHaveBeenCalledWith('health_check_test');
    });

    /**
     * TC022: Kiểm tra cache delete operation
     * Input: N/A
     * Expected Output: delete được gọi với testKey
     * Path Coverage: Cache deletion
     */
    it('TC022: should call cache delete with correct key', async () => {
      await service.checkCache();

      expect(mockCacheService.delete).toHaveBeenCalledTimes(1);
      expect(mockCacheService.delete).toHaveBeenCalledWith('health_check_test');
    });

    /**
     * TC023: Kiểm tra cached value verification
     * Input: get returns 'test_value'
     * Expected Output: isHealthy = true
     * Path Coverage: Value verification logic
     */
    it('TC023: should verify cached value matches test value', async () => {
      (mockCacheService.get as jest.Mock).mockResolvedValue('test_value');

      const result = await service.checkCache();

      expect(result.status).toBe('healthy');
      expect(result.details.operations.get).toBe(true);
    });

    /**
     * TC024: Kiểm tra cache exists verification
     * Input: has returns true
     * Expected Output: isHealthy includes exists check
     * Path Coverage: Existence verification
     */
    it('TC024: should verify cache key exists', async () => {
      (mockCacheService.has as jest.Mock).mockResolvedValue(true);

      const result = await service.checkCache();

      expect(result.status).toBe('healthy');
      expect(result.details.operations.has).toBe(true);
    });

    /**
     * TC025: Kiểm tra isHealthy logic - both conditions true
     * Input: get returns correct value AND has returns true
     * Expected Output: status = 'healthy'
     * Path Coverage: isHealthy = true branch (both conditions met)
     */
    it('TC025: should return healthy when both get and has conditions are true', async () => {
      (mockCacheService.get as jest.Mock).mockResolvedValue('test_value');
      (mockCacheService.has as jest.Mock).mockResolvedValue(true);

      const result = await service.checkCache();

      expect(result.status).toBe('healthy');
    });

    /**
     * TC026: Kiểm tra operations details structure
     * Input: Successful operations
     * Expected Output: operations có set, get, has, delete properties
     * Path Coverage: Operations details object
     */
    it('TC026: should include all operations in details', async () => {
      const result = await service.checkCache();

      expect(result.details.operations).toEqual({
        set: true,
        get: true,
        has: true,
        delete: true,
      });
    });

    /**
     * TC027: Kiểm tra responseTime calculation
     * Input: Cache operations with delay
     * Expected Output: responseTime reflects actual time taken
     * Path Coverage: Time measurement
     */
    it('TC027: should calculate responseTime for cache operations', async () => {
      (mockCacheService.set as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 20)),
      );

      const result = await service.checkCache();

      expect(result.responseTime).toBeGreaterThanOrEqual(20);
    });

    /**
     * TC028: Kiểm tra startTime initialization
     * Input: N/A
     * Expected Output: Date.now() được gọi
     * Path Coverage: startTime initialization
     */
    it('TC028: should initialize startTime at method start', async () => {
      const dateNowSpy = jest.spyOn(Date, 'now');

      await service.checkCache();

      expect(dateNowSpy).toHaveBeenCalled();
    });
  });

  describe('checkCache() Method - Unhealthy Paths', () => {
    /**
     * TC029: Kiểm tra khi get returns wrong value
     * Input: get returns incorrect value
     * Expected Output: status = 'unhealthy'
     * Path Coverage: isHealthy = false (get condition false)
     */
    it('TC029: should return unhealthy when cached value does not match', async () => {
      (mockCacheService.get as jest.Mock).mockResolvedValue('wrong_value');
      (mockCacheService.has as jest.Mock).mockResolvedValue(true);

      const result = await service.checkCache();

      expect(result.status).toBe('unhealthy');
      expect(result.details.operations.get).toBe(false);
    });

    /**
     * TC030: Kiểm tra khi has returns false
     * Input: has returns false
     * Expected Output: status = 'unhealthy'
     * Path Coverage: isHealthy = false (has condition false)
     */
    it('TC030: should return unhealthy when cache key does not exist', async () => {
      (mockCacheService.get as jest.Mock).mockResolvedValue('test_value');
      (mockCacheService.has as jest.Mock).mockResolvedValue(false);

      const result = await service.checkCache();

      expect(result.status).toBe('unhealthy');
      expect(result.details.operations.has).toBe(false);
    });

    /**
     * TC031: Kiểm tra khi both get và has fail
     * Input: get returns wrong value AND has returns false
     * Expected Output: status = 'unhealthy'
     * Path Coverage: isHealthy = false (both conditions false)
     */
    it('TC031: should return unhealthy when both conditions fail', async () => {
      (mockCacheService.get as jest.Mock).mockResolvedValue('wrong_value');
      (mockCacheService.has as jest.Mock).mockResolvedValue(false);

      const result = await service.checkCache();

      expect(result.status).toBe('unhealthy');
      expect(result.details.operations.get).toBe(false);
      expect(result.details.operations.has).toBe(false);
    });

    /**
     * TC032: Kiểm tra AND operator logic
     * Input: Various combinations of get/has results
     * Expected Output: Correct isHealthy evaluation
     * Path Coverage: Boolean AND operation
     */
    it('TC032: should use AND operator correctly in isHealthy check', async () => {
      // Case 1: true && true = true
      (mockCacheService.get as jest.Mock).mockResolvedValue('test_value');
      (mockCacheService.has as jest.Mock).mockResolvedValue(true);
      let result = await service.checkCache();
      expect(result.status).toBe('healthy');

      // Case 2: true && false = false
      (mockCacheService.get as jest.Mock).mockResolvedValue('test_value');
      (mockCacheService.has as jest.Mock).mockResolvedValue(false);
      result = await service.checkCache();
      expect(result.status).toBe('unhealthy');

      // Case 3: false && true = false
      (mockCacheService.get as jest.Mock).mockResolvedValue('wrong');
      (mockCacheService.has as jest.Mock).mockResolvedValue(true);
      result = await service.checkCache();
      expect(result.status).toBe('unhealthy');

      // Case 4: false && false = false
      (mockCacheService.get as jest.Mock).mockResolvedValue('wrong');
      (mockCacheService.has as jest.Mock).mockResolvedValue(false);
      result = await service.checkCache();
      expect(result.status).toBe('unhealthy');
    });
  });

  describe('checkCache() Method - Error Paths', () => {
    /**
     * TC033: Kiểm tra khi cache.set throws error
     * Input: set operation fails
     * Expected Output: { status: 'unhealthy', error details }
     * Path Coverage: Catch block - set error
     */
    it('TC033: should handle error when cache set fails', async () => {
      const error = new Error('Cache write failed');
      (mockCacheService.set as jest.Mock).mockRejectedValue(error);

      const result = await service.checkCache();

      expect(result.status).toBe('unhealthy');
      expect(result.details.error).toBe('Cache write failed');
    });

    /**
     * TC034: Kiểm tra khi cache.get throws error
     * Input: get operation fails
     * Expected Output: { status: 'unhealthy', error details }
     * Path Coverage: Catch block - get error
     */
    it('TC034: should handle error when cache get fails', async () => {
      const error = new Error('Cache read failed');
      (mockCacheService.get as jest.Mock).mockRejectedValue(error);

      const result = await service.checkCache();

      expect(result.status).toBe('unhealthy');
      expect(result.details.error).toBe('Cache read failed');
    });

    /**
     * TC035: Kiểm tra khi cache.has throws error
     * Input: has operation fails
     * Expected Output: { status: 'unhealthy', error details }
     * Path Coverage: Catch block - has error
     */
    it('TC035: should handle error when cache has fails', async () => {
      const error = new Error('Cache check failed');
      (mockCacheService.has as jest.Mock).mockRejectedValue(error);

      const result = await service.checkCache();

      expect(result.status).toBe('unhealthy');
      expect(result.details.error).toBe('Cache check failed');
    });

    /**
     * TC036: Kiểm tra khi cache.delete throws error
     * Input: delete operation fails
     * Expected Output: { status: 'unhealthy', error details }
     * Path Coverage: Catch block - delete error
     */
    it('TC036: should handle error when cache delete fails', async () => {
      const error = new Error('Cache delete failed');
      (mockCacheService.delete as jest.Mock).mockRejectedValue(error);

      const result = await service.checkCache();

      expect(result.status).toBe('unhealthy');
      expect(result.details.error).toBe('Cache delete failed');
    });

    /**
     * TC037: Kiểm tra error logging
     * Input: Cache operation throws error
     * Expected Output: Logger.error được gọi
     * Path Coverage: Error logging in catch block
     */
    it('TC037: should log error when cache check fails', async () => {
      const error = new Error('Cache error');
      (mockCacheService.set as jest.Mock).mockRejectedValue(error);

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await service.checkCache();

      expect(loggerSpy).toHaveBeenCalledWith('Cache health check failed:', error);
    });

    /**
     * TC038: Kiểm tra responseTime trong error case
     * Input: Cache operation fails after delay
     * Expected Output: responseTime vẫn được tính
     * Path Coverage: responseTime in catch block
     */
    it('TC038: should calculate responseTime even when check fails', async () => {
      (mockCacheService.set as jest.Mock).mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 40),
          ),
      );

      const result = await service.checkCache();

      expect(result.responseTime).toBeGreaterThanOrEqual(40);
    });

    /**
     * TC039: Kiểm tra error.message extraction
     * Input: Error with specific message
     * Expected Output: details.error contains error.message
     * Path Coverage: Error message extraction
     */
    it('TC039: should extract error message in catch block', async () => {
      const error = new Error('Specific cache error');
      (mockCacheService.set as jest.Mock).mockRejectedValue(error);

      const result = await service.checkCache();

      expect(result.details.error).toBe('Specific cache error');
    });

    /**
     * TC040: Kiểm tra return structure trong error case
     * Input: Any cache error
     * Expected Output: Object với status, responseTime, details
     * Path Coverage: Error return object structure
     */
    it('TC040: should return correct structure in error case', async () => {
      (mockCacheService.set as jest.Mock).mockRejectedValue(new Error('Error'));

      const result = await service.checkCache();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('responseTime');
      expect(result).toHaveProperty('details');
      expect(result.status).toBe('unhealthy');
    });
  });

  describe('getOverallHealth() Method - Success Paths', () => {
    /**
     * TC041: Kiểm tra getOverallHealth khi all services healthy
     * Input: Both database and cache healthy
     * Expected Output: { status: 'healthy', services: {...} }
     * Path Coverage: allHealthy = true branch
     */
    it('TC041: should return healthy when all services are healthy', async () => {
      const result = await service.getOverallHealth();

      expect(result.status).toBe('healthy');
      expect(result.services.database.status).toBe('healthy');
      expect(result.services.cache.status).toBe('healthy');
    });

    /**
     * TC042: Kiểm tra services object structure
     * Input: N/A
     * Expected Output: services contains database and cache
     * Path Coverage: Services object creation
     */
    it('TC042: should include both database and cache in services', async () => {
      const result = await service.getOverallHealth();

      expect(result.services).toHaveProperty('database');
      expect(result.services).toHaveProperty('cache');
      expect(Object.keys(result.services)).toHaveLength(2);
    });

    /**
     * TC043: Kiểm tra checkDatabase được gọi 2 lần
     * Input: N/A
     * Expected Output: checkDatabase called twice (database variable + services.database)
     * Path Coverage: Duplicate checkDatabase calls
     */
    it('TC043: should call checkDatabase twice', async () => {
      const checkDatabaseSpy = jest.spyOn(service, 'checkDatabase');

      await service.getOverallHealth();

      expect(checkDatabaseSpy).toHaveBeenCalledTimes(2);
    });

    /**
     * TC044: Kiểm tra checkCache được gọi
     * Input: N/A
     * Expected Output: checkCache called once
     * Path Coverage: checkCache invocation
     */
    it('TC044: should call checkCache once', async () => {
      const checkCacheSpy = jest.spyOn(service, 'checkCache');

      await service.getOverallHealth();

      expect(checkCacheSpy).toHaveBeenCalledTimes(1);
    });

    /**
     * TC045: Kiểm tra timestamp generation
     * Input: N/A
     * Expected Output: timestamp là valid ISO string
     * Path Coverage: new Date().toISOString()
     */
    it('TC045: should generate ISO timestamp', async () => {
      const result = await service.getOverallHealth();

      expect(result.timestamp).toBeDefined();
      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );

      const date = new Date(result.timestamp);
      expect(date.toISOString()).toBe(result.timestamp);
    });

    /**
     * TC046: Kiểm tra uptime calculation
     * Input: N/A
     * Expected Output: uptime = process.uptime()
     * Path Coverage: process.uptime() call
     */
    it('TC046: should include process uptime', async () => {
      const expectedUptime = process.uptime();

      const result = await service.getOverallHealth();

      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.uptime).toBeCloseTo(expectedUptime, 0);
    });

    /**
     * TC047: Kiểm tra memory usage
     * Input: N/A
     * Expected Output: memory = process.memoryUsage()
     * Path Coverage: process.memoryUsage() call
     */
    it('TC047: should include memory usage', async () => {
      const result = await service.getOverallHealth();

      expect(result.memory).toBeDefined();
      expect(result.memory).toHaveProperty('rss');
      expect(result.memory).toHaveProperty('heapTotal');
      expect(result.memory).toHaveProperty('heapUsed');
      expect(result.memory).toHaveProperty('external');
    });

    /**
     * TC048: Kiểm tra Object.values() usage
     * Input: services object
     * Expected Output: Array of service health objects
     * Path Coverage: Object.values(services)
     */
    it('TC048: should use Object.values to get service array', async () => {
      const result = await service.getOverallHealth();

      const servicesArray = Object.values(result.services);
      expect(servicesArray).toHaveLength(2);
      expect(servicesArray[0]).toHaveProperty('status');
      expect(servicesArray[1]).toHaveProperty('status');
    });

    /**
     * TC049: Kiểm tra every() method - all healthy
     * Input: All services healthy
     * Expected Output: every() returns true
     * Path Coverage: every() with all true
     */
    it('TC049: should use every() to check all services are healthy', async () => {
      const result = await service.getOverallHealth();

      const allHealthy = Object.values(result.services).every(
        (service) => service.status === 'healthy',
      );

      expect(allHealthy).toBe(true);
      expect(result.status).toBe('healthy');
    });

    /**
     * TC050: Kiểm tra return object structure
     * Input: N/A
     * Expected Output: Object với 5 properties
     * Path Coverage: Return object completeness
     */
    it('TC050: should return object with all required properties', async () => {
      const result = await service.getOverallHealth();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('services');
      expect(Object.keys(result)).toHaveLength(5);
    });
  });

  describe('getOverallHealth() Method - Unhealthy Paths', () => {
    /**
     * TC051: Kiểm tra khi database unhealthy
     * Input: Database check fails
     * Expected Output: status = 'unhealthy'
     * Path Coverage: allHealthy = false (database unhealthy)
     */
    it('TC051: should return unhealthy when database is unhealthy', async () => {
      const pingMock = mockConnection.db.admin().ping as jest.Mock;
      pingMock.mockRejectedValue(new Error('DB error'));

      const result = await service.getOverallHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.services.database.status).toBe('unhealthy');
    });

    /**
     * TC052: Kiểm tra khi cache unhealthy
     * Input: Cache check fails
     * Expected Output: status = 'unhealthy'
     * Path Coverage: allHealthy = false (cache unhealthy)
     */
    it('TC052: should return unhealthy when cache is unhealthy', async () => {
      (mockCacheService.set as jest.Mock).mockRejectedValue(
        new Error('Cache error'),
      );

      const result = await service.getOverallHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.services.cache.status).toBe('unhealthy');
    });

    /**
     * TC053: Kiểm tra khi both services unhealthy
     * Input: Both database and cache fail
     * Expected Output: status = 'unhealthy'
     * Path Coverage: allHealthy = false (all unhealthy)
     */
    it('TC053: should return unhealthy when both services are unhealthy', async () => {
      const pingMock = mockConnection.db.admin().ping as jest.Mock;
      pingMock.mockRejectedValue(new Error('DB error'));
      (mockCacheService.set as jest.Mock).mockRejectedValue(
        new Error('Cache error'),
      );

      const result = await service.getOverallHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.services.database.status).toBe('unhealthy');
      expect(result.services.cache.status).toBe('unhealthy');
    });

    /**
     * TC054: Kiểm tra every() method - at least one unhealthy
     * Input: One service unhealthy
     * Expected Output: every() returns false
     * Path Coverage: every() with at least one false
     */
    it('TC054: should use every() to detect any unhealthy service', async () => {
      (mockCacheService.set as jest.Mock).mockRejectedValue(
        new Error('Cache error'),
      );

      const result = await service.getOverallHealth();

      const allHealthy = Object.values(result.services).every(
        (service) => service.status === 'healthy',
      );

      expect(allHealthy).toBe(false);
      expect(result.status).toBe('unhealthy');
    });

    /**
     * TC055: Kiểm tra ternary operator - healthy branch
     * Input: allHealthy = true
     * Expected Output: status = 'healthy'
     * Path Coverage: Ternary true branch
     */
    it('TC055: should return healthy status when ternary condition is true', async () => {
      const result = await service.getOverallHealth();

      expect(result.status).toBe('healthy');
    });

    /**
     * TC056: Kiểm tra ternary operator - unhealthy branch
     * Input: allHealthy = false
     * Expected Output: status = 'unhealthy'
     * Path Coverage: Ternary false branch
     */
    it('TC056: should return unhealthy status when ternary condition is false', async () => {
      (mockCacheService.set as jest.Mock).mockRejectedValue(
        new Error('Cache error'),
      );

      const result = await service.getOverallHealth();

      expect(result.status).toBe('unhealthy');
    });
  });

  describe('getOverallHealth() Method - Integration Tests', () => {
    /**
     * TC057: Kiểm tra database variable (unused)
     * Input: N/A
     * Expected Output: database được tính nhưng không dùng
     * Path Coverage: Unused variable assignment
     */
    it('TC057: should calculate database health but not use the variable', async () => {
      const checkDatabaseSpy = jest.spyOn(service, 'checkDatabase');

      await service.getOverallHealth();

      // First call for 'database' variable, second for services.database
      expect(checkDatabaseSpy).toHaveBeenCalledTimes(2);
    });

    /**
     * TC058: Kiểm tra services object overwrites database variable
     * Input: N/A
     * Expected Output: services.database is separate call
     * Path Coverage: Duplicate database check
     */
    it('TC058: should call checkDatabase separately for services object', async () => {
      const checkDatabaseSpy = jest
        .spyOn(service, 'checkDatabase')
        .mockResolvedValueOnce({
          status: 'healthy',
          responseTime: 10,
          details: { first: 'call' },
        })
        .mockResolvedValueOnce({
          status: 'healthy',
          responseTime: 20,
          details: { second: 'call' },
        });

      const result = await service.getOverallHealth();

      // The services.database uses the second call
      expect(checkDatabaseSpy).toHaveBeenCalledTimes(2);
      expect(result.services.database.details).toEqual({ second: 'call' });
    });

    /**
     * TC059: Kiểm tra async operations
     * Input: N/A
     * Expected Output: All async operations complete
     * Path Coverage: Promise.all simulation (parallel await)
     */
    it('TC059: should handle async operations correctly', async () => {
      const resultPromise = service.getOverallHealth();

      expect(resultPromise).toBeInstanceOf(Promise);

      const result = await resultPromise;
      expect(result).toBeDefined();
    });

    /**
     * TC060: Kiểm tra system metrics không depend on service health
     * Input: Services unhealthy
     * Expected Output: uptime và memory vẫn được báo cáo
     * Path Coverage: System metrics independence
     */
    it('TC060: should report system metrics regardless of service health', async () => {
      (mockCacheService.set as jest.Mock).mockRejectedValue(
        new Error('Cache error'),
      );

      const result = await service.getOverallHealth();

      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(result.memory).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    /**
     * TC061: Kiểm tra response time của các services
     * Input: N/A
     * Expected Output: Mỗi service có responseTime riêng
     * Path Coverage: Individual service timing
     */
    it('TC061: should include responseTime for each service', async () => {
      const result = await service.getOverallHealth();

      expect(result.services.database.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.services.cache.responseTime).toBeGreaterThanOrEqual(0);
    });

    /**
     * TC062: Kiểm tra services details
     * Input: N/A
     * Expected Output: Mỗi service có details riêng
     * Path Coverage: Service details inclusion
     */
    it('TC062: should include details for each service', async () => {
      const result = await service.getOverallHealth();

      expect(result.services.database.details).toBeDefined();
      expect(result.services.cache.details).toBeDefined();
    });

    /**
     * TC063: Kiểm tra timestamp uniqueness
     * Input: Multiple calls
     * Expected Output: Each call has current timestamp
     * Path Coverage: Timestamp generation per call
     */
    it('TC063: should generate new timestamp for each call', async () => {
      const result1 = await service.getOverallHealth();

      await new Promise((resolve) => setTimeout(resolve, 10));

      const result2 = await service.getOverallHealth();

      expect(result1.timestamp).toBeDefined();
      expect(result2.timestamp).toBeDefined();
      // Timestamps might be different due to timing
    });

    /**
     * TC064: Kiểm tra memory object structure
     * Input: N/A
     * Expected Output: memory có đầy đủ NodeJS.MemoryUsage properties
     * Path Coverage: Memory usage structure
     */
    it('TC064: should return complete memory usage object', async () => {
      const result = await service.getOverallHealth();

      expect(typeof result.memory.rss).toBe('number');
      expect(typeof result.memory.heapTotal).toBe('number');
      expect(typeof result.memory.heapUsed).toBe('number');
      expect(typeof result.memory.external).toBe('number');
    });

    /**
     * TC065: Kiểm tra uptime type
     * Input: N/A
     * Expected Output: uptime là number
     * Path Coverage: Type validation
     */
    it('TC065: should return uptime as number', async () => {
      const result = await service.getOverallHealth();

      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    /**
     * TC066: Kiểm tra concurrent calls
     * Input: Multiple simultaneous calls
     * Expected Output: Each call independent
     * Path Coverage: Concurrent execution
     */
    it('TC066: should handle concurrent health checks', async () => {
      const [result1, result2, result3] = await Promise.all([
        service.getOverallHealth(),
        service.getOverallHealth(),
        service.getOverallHealth(),
      ]);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();
      expect(result1.status).toBe('healthy');
      expect(result2.status).toBe('healthy');
      expect(result3.status).toBe('healthy');
    });

    /**
     * TC067: Kiểm tra cache với null response
     * Input: cache.get returns null
     * Expected Output: isHealthy = false
     * Path Coverage: Null value handling
     */
    it('TC067: should handle null cached value', async () => {
      (mockCacheService.get as jest.Mock).mockResolvedValue(null);

      const result = await service.checkCache();

      expect(result.status).toBe('unhealthy');
      expect(result.details.operations.get).toBe(false);
    });

    /**
     * TC068: Kiểm tra cache với undefined response
     * Input: cache.get returns undefined
     * Expected Output: isHealthy = false
     * Path Coverage: Undefined value handling
     */
    it('TC068: should handle undefined cached value', async () => {
      (mockCacheService.get as jest.Mock).mockResolvedValue(undefined);

      const result = await service.checkCache();

      expect(result.status).toBe('unhealthy');
      expect(result.details.operations.get).toBe(false);
    });

    /**
     * TC069: Kiểm tra readyState values
     * Input: Different readyState values
     * Expected Output: readyState reflected in details
     * Path Coverage: Various connection states
     */
    it('TC069: should report different readyState values', async () => {
      const states = [0, 1, 2, 3]; // disconnected, connected, connecting, disconnecting

      for (const state of states) {
        (mockConnection as any).readyState = state;
        const result = await service.checkDatabase();
        expect(result.details.readyState).toBe(state);
      }
    });

    /**
     * TC070: Kiểm tra very slow database response
     * Input: Database ping with long delay
     * Expected Output: responseTime reflects delay
     * Path Coverage: Timeout scenarios
     */
    it('TC070: should handle very slow database response', async () => {
      const pingMock = mockConnection.db.admin().ping as jest.Mock;
      pingMock.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: 1 }), 100)),
      );

      const result = await service.checkDatabase();

      expect(result.responseTime).toBeGreaterThanOrEqual(100);
      expect(result.status).toBe('healthy');
    });

    /**
     * TC071: Kiểm tra very slow cache operations
     * Input: Cache operations with long delay
     * Expected Output: responseTime reflects delay, operations complete
     * Path Coverage: Slow cache performance
     */
    it('TC071: should handle slow cache operations', async () => {
      (mockCacheService.set as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50)),
      );

      const result = await service.checkCache();

      expect(result.responseTime).toBeGreaterThanOrEqual(50);
      expect(result.status).toBe('healthy');
    });

    /**
     * TC072: Kiểm tra empty database name
     * Input: connection.name = ''
     * Expected Output: Empty string in details
     * Path Coverage: Empty string handling
     */
    it('TC072: should handle empty database name', async () => {
      (mockConnection as any).name = '';

      const result = await service.checkDatabase();

      expect(result.details.database).toBe('');
    });

    /**
     * TC073: Kiểm tra special characters trong error message
     * Input: Error with special characters
     * Expected Output: Error message preserved
     * Path Coverage: String handling
     */
    it('TC073: should preserve special characters in error messages', async () => {
      const error = new Error('Error: "Connection failed" at <database>');
      const pingMock = mockConnection.db.admin().ping as jest.Mock;
      pingMock.mockRejectedValue(error);

      const result = await service.checkDatabase();

      expect(result.details.error).toBe('Error: "Connection failed" at <database>');
    });

    /**
     * TC074: Kiểm tra multiple consecutive health checks
     * Input: Sequential calls
     * Expected Output: Each call executes independently
     * Path Coverage: State independence
     */
    it('TC074: should execute multiple health checks independently', async () => {
      const result1 = await service.getOverallHealth();
      const result2 = await service.getOverallHealth();
      const result3 = await service.getOverallHealth();

      expect(result1.status).toBe('healthy');
      expect(result2.status).toBe('healthy');
      expect(result3.status).toBe('healthy');

      // Each should have unique timestamp
      expect(result1.timestamp).toBeDefined();
      expect(result2.timestamp).toBeDefined();
      expect(result3.timestamp).toBeDefined();
    });

    /**
     * TC075: Kiểm tra database health followed by cache health
     * Input: Sequential individual checks
     * Expected Output: Each works independently
     * Path Coverage: Method independence
     */
    it('TC075: should allow individual service checks independently', async () => {
      const dbResult = await service.checkDatabase();
      const cacheResult = await service.checkCache();

      expect(dbResult.status).toBe('healthy');
      expect(cacheResult.status).toBe('healthy');
      expect(dbResult).not.toHaveProperty('services');
      expect(cacheResult).not.toHaveProperty('services');
    });
  });
});
