import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from '../src/common/services/cache.services';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';

describe('CacheService - White Box Testing', () => {
  let service: CacheService;
  let cacheManager: any;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get(CACHE_MANAGER);

    // Mock logger to avoid console output
    jest.spyOn(service['logger'], 'debug').mockImplementation();
    jest.spyOn(service['logger'], 'log').mockImplementation();
    jest.spyOn(service['logger'], 'error').mockImplementation();

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    /**
     * Test Case 1: Kiểm tra service được khởi tạo
     * Input: N/A
     * Expected Output: Service instance tồn tại
     * Path Coverage: Constructor execution
     */
    it('TC001: should be defined', () => {
      expect(service).toBeDefined();
    });

    /**
     * Test Case 2: Kiểm tra logger được khởi tạo
     * Input: N/A
     * Expected Output: Logger instance tồn tại với đúng name
     * Path Coverage: Logger initialization
     */
    it('TC002: should have logger initialized with correct name', () => {
      expect(service['logger']).toBeDefined();
      expect(service['logger']).toBeInstanceOf(Logger);
    });

    /**
     * Test Case 3: Kiểm tra cacheManager được inject
     * Input: N/A
     * Expected Output: CacheManager instance tồn tại
     * Path Coverage: Dependency injection
     */
    it('TC003: should have cacheManager injected', () => {
      expect(service['cacheManager']).toBeDefined();
      expect(service['cacheManager']).toBe(mockCacheManager);
    });
  });

  describe('set() Method', () => {
    /**
     * Test Case 4: Kiểm tra set cache với default TTL
     * Input: key = 'test', data = 'value', ttl = default (3600)
     * Expected Output: cacheManager.set được gọi với TTL = 3600
     * Path Coverage: Successful set with default TTL
     */
    it('TC004: should set cache with default TTL', async () => {
      const key = 'test';
      const data = 'value';

      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, data);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, data, 3600);
      expect(service['logger'].debug).toHaveBeenCalledWith(
        `Cache set: ${key}, TTL: 3600s`,
      );
    });

    /**
     * Test Case 5: Kiểm tra set cache với custom TTL
     * Input: key = 'test', data = 'value', ttl = 7200
     * Expected Output: cacheManager.set được gọi với TTL = 7200
     * Path Coverage: Successful set with custom TTL
     */
    it('TC005: should set cache with custom TTL', async () => {
      const key = 'test';
      const data = 'value';
      const ttl = 7200;

      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, data, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, data, ttl);
      expect(service['logger'].debug).toHaveBeenCalledWith(
        `Cache set: ${key}, TTL: ${ttl}s`,
      );
    });

    /**
     * Test Case 6: Kiểm tra set cache với complex object
     * Input: key = 'user', data = { id: 1, name: 'John' }
     * Expected Output: Object được cache
     * Path Coverage: Generic type T handling
     */
    it('TC006: should set cache with complex object', async () => {
      const key = 'user';
      const data = { id: 1, name: 'John', roles: ['admin'] };

      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, data);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, data, 3600);
    });

    /**
     * Test Case 7: Kiểm tra set cache với TTL = 0
     * Input: ttl = 0
     * Expected Output: Cache được set với TTL = 0
     * Path Coverage: Edge case - zero TTL
     */
    it('TC007: should set cache with zero TTL', async () => {
      const key = 'test';
      const data = 'value';
      const ttl = 0;

      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, data, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, data, 0);
    });

    /**
     * Test Case 8: Kiểm tra error handling trong set
     * Input: cacheManager.set throws error
     * Expected Output: Error được log, không throw
     * Path Coverage: try-catch error path
     */
    it('TC008: should handle error in set gracefully', async () => {
      const key = 'test';
      const data = 'value';
      const error = new Error('Cache set failed');

      mockCacheManager.set.mockRejectedValue(error);

      await service.set(key, data);

      expect(service['logger'].error).toHaveBeenCalledWith(
        `Failed to set cache for key ${key}:`,
        error,
      );
    });

    /**
     * Test Case 9: Kiểm tra set với null data
     * Input: data = null
     * Expected Output: Null được cache
     * Path Coverage: Null value handling
     */
    it('TC009: should set cache with null data', async () => {
      const key = 'test';
      const data = null;

      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, data);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, null, 3600);
    });

    /**
     * Test Case 10: Kiểm tra set với undefined data
     * Input: data = undefined
     * Expected Output: Undefined được cache
     * Path Coverage: Undefined value handling
     */
    it('TC010: should set cache with undefined data', async () => {
      const key = 'test';
      const data = undefined;

      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, data);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, undefined, 3600);
    });

    /**
     * Test Case 11: Kiểm tra set với empty string key
     * Input: key = ''
     * Expected Output: Cache được set với empty key
     * Path Coverage: Edge case - empty key
     */
    it('TC011: should set cache with empty string key', async () => {
      const key = '';
      const data = 'value';

      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, data);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, data, 3600);
    });

    /**
     * Test Case 12: Kiểm tra set với negative TTL
     * Input: ttl = -100
     * Expected Output: Negative TTL được pass (no validation)
     * Path Coverage: Edge case - negative TTL
     */
    it('TC012: should set cache with negative TTL', async () => {
      const key = 'test';
      const data = 'value';
      const ttl = -100;

      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, data, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, data, ttl);
    });
  });

  describe('get() Method', () => {
    /**
     * Test Case 13: Kiểm tra get cache hit
     * Input: key = 'test', cached value = 'value'
     * Expected Output: Return cached value
     * Path Coverage: Successful get (cached ?? null) - cached path
     */
    it('TC013: should get cached value', async () => {
      const key = 'test';
      const cachedValue = 'value';

      mockCacheManager.get.mockResolvedValue(cachedValue);

      const result = await service.get(key);

      expect(result).toBe(cachedValue);
      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
    });

    /**
     * Test Case 14: Kiểm tra get cache miss (undefined)
     * Input: key = 'test', cached value = undefined
     * Expected Output: Return null
     * Path Coverage: ?? operator - undefined to null
     */
    it('TC014: should return null for cache miss (undefined)', async () => {
      const key = 'test';

      mockCacheManager.get.mockResolvedValue(undefined);

      const result = await service.get(key);

      expect(result).toBeNull();
    });

    /**
     * Test Case 15: Kiểm tra get với cached null
     * Input: cached value = null
     * Expected Output: Return null
     * Path Coverage: ?? operator - null to null
     */
    it('TC015: should return null when cached value is null', async () => {
      const key = 'test';

      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.get(key);

      expect(result).toBeNull();
    });

    /**
     * Test Case 16: Kiểm tra get với false value
     * Input: cached value = false
     * Expected Output: Return false (not converted to null)
     * Path Coverage: ?? operator - falsy but not null/undefined
     */
    it('TC016: should return false when cached value is false', async () => {
      const key = 'test';

      mockCacheManager.get.mockResolvedValue(false);

      const result = await service.get(key);

      expect(result).toBe(false);
    });

    /**
     * Test Case 17: Kiểm tra get với 0 value
     * Input: cached value = 0
     * Expected Output: Return 0 (not converted to null)
     * Path Coverage: ?? operator - zero is valid
     */
    it('TC017: should return 0 when cached value is 0', async () => {
      const key = 'test';

      mockCacheManager.get.mockResolvedValue(0);

      const result = await service.get(key);

      expect(result).toBe(0);
    });

    /**
     * Test Case 18: Kiểm tra get với empty string
     * Input: cached value = ''
     * Expected Output: Return '' (not converted to null)
     * Path Coverage: ?? operator - empty string is valid
     */
    it('TC018: should return empty string when cached', async () => {
      const key = 'test';

      mockCacheManager.get.mockResolvedValue('');

      const result = await service.get(key);

      expect(result).toBe('');
    });

    /**
     * Test Case 19: Kiểm tra get với complex object
     * Input: cached value = { id: 1, name: 'John' }
     * Expected Output: Return object
     * Path Coverage: Generic type T return
     */
    it('TC019: should return complex object from cache', async () => {
      const key = 'user';
      const cachedValue = { id: 1, name: 'John', active: true };

      mockCacheManager.get.mockResolvedValue(cachedValue);

      const result = await service.get(key);

      expect(result).toEqual(cachedValue);
    });

    /**
     * Test Case 20: Kiểm tra error handling trong get
     * Input: cacheManager.get throws error
     * Expected Output: Return null, error logged
     * Path Coverage: try-catch error path
     */
    it('TC020: should handle error in get gracefully', async () => {
      const key = 'test';
      const error = new Error('Cache get failed');

      mockCacheManager.get.mockRejectedValue(error);

      const result = await service.get(key);

      expect(result).toBeNull();
      expect(service['logger'].error).toHaveBeenCalledWith(
        `Failed to get cache for key ${key}:`,
        error,
      );
    });

    /**
     * Test Case 21: Kiểm tra get với array
     * Input: cached value = [1, 2, 3]
     * Expected Output: Return array
     * Path Coverage: Array type handling
     */
    it('TC021: should return array from cache', async () => {
      const key = 'list';
      const cachedValue = [1, 2, 3, 4, 5];

      mockCacheManager.get.mockResolvedValue(cachedValue);

      const result = await service.get(key);

      expect(result).toEqual(cachedValue);
    });
  });

  describe('delete() Method', () => {
    /**
     * Test Case 22: Kiểm tra delete thành công
     * Input: key = 'test'
     * Expected Output: Return true, logger.debug called
     * Path Coverage: Successful delete
     */
    it('TC022: should delete cache successfully', async () => {
      const key = 'test';

      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await service.delete(key);

      expect(result).toBe(true);
      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
      expect(service['logger'].debug).toHaveBeenCalledWith(
        `Cache deleted: ${key}`,
      );
    });

    /**
     * Test Case 23: Kiểm tra error handling trong delete
     * Input: cacheManager.del throws error
     * Expected Output: Return false, error logged
     * Path Coverage: try-catch error path
     */
    it('TC023: should handle error in delete gracefully', async () => {
      const key = 'test';
      const error = new Error('Delete failed');

      mockCacheManager.del.mockRejectedValue(error);

      const result = await service.delete(key);

      expect(result).toBe(false);
      expect(service['logger'].error).toHaveBeenCalledWith(
        `Failed to delete cache for key ${key}:`,
        error,
      );
    });

    /**
     * Test Case 24: Kiểm tra delete với empty key
     * Input: key = ''
     * Expected Output: Delete được gọi với empty key
     * Path Coverage: Edge case - empty key
     */
    it('TC024: should delete with empty key', async () => {
      const key = '';

      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await service.delete(key);

      expect(result).toBe(true);
      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
    });

    /**
     * Test Case 25: Kiểm tra delete multiple times
     * Input: Delete same key twice
     * Expected Output: Both return true
     * Path Coverage: Idempotent operation
     */
    it('TC025: should handle multiple deletes', async () => {
      const key = 'test';

      mockCacheManager.del.mockResolvedValue(undefined);

      const result1 = await service.delete(key);
      const result2 = await service.delete(key);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(mockCacheManager.del).toHaveBeenCalledTimes(2);
    });
  });

  describe('clear() Method', () => {
    /**
     * Test Case 26: Kiểm tra clear cache thành công
     * Input: N/A
     * Expected Output: cacheManager.reset được gọi, log success
     * Path Coverage: Successful clear
     */
    it('TC026: should clear cache successfully', async () => {
      mockCacheManager.reset.mockResolvedValue(undefined);

      await service.clear();

      expect(mockCacheManager.reset).toHaveBeenCalled();
      expect(service['logger'].log).toHaveBeenCalledWith(
        'Cache cleared successfully',
      );
    });

    /**
     * Test Case 27: Kiểm tra error handling trong clear
     * Input: cacheManager.reset throws error
     * Expected Output: Error logged and thrown
     * Path Coverage: try-catch error path with throw
     */
    it('TC027: should handle error in clear and throw', async () => {
      const error = new Error('Clear failed');

      mockCacheManager.reset.mockRejectedValue(error);

      await expect(service.clear()).rejects.toThrow(error);
      expect(service['logger'].error).toHaveBeenCalledWith(
        'Failed to clear cache:',
        error,
      );
    });

    /**
     * Test Case 28: Kiểm tra clear gọi reset method
     * Input: N/A
     * Expected Output: Type assertion (as any).reset() works
     * Path Coverage: Type assertion usage
     */
    it('TC028: should call reset method with type assertion', async () => {
      const resetSpy = jest.spyOn(mockCacheManager, 'reset');

      mockCacheManager.reset.mockResolvedValue(undefined);

      await service.clear();

      expect(resetSpy).toHaveBeenCalledTimes(1);
    });

    /**
     * Test Case 29: Kiểm tra clear multiple times
     * Input: Clear twice
     * Expected Output: reset được gọi 2 lần
     * Path Coverage: Multiple clear operations
     */
    it('TC029: should handle multiple clears', async () => {
      mockCacheManager.reset.mockResolvedValue(undefined);

      await service.clear();
      await service.clear();

      expect(mockCacheManager.reset).toHaveBeenCalledTimes(2);
    });
  });

  describe('has() Method', () => {
    /**
     * Test Case 30: Kiểm tra has với existing key
     * Input: key exists with value
     * Expected Output: Return true
     * Path Coverage: value !== undefined && value !== null (both true)
     */
    it('TC030: should return true for existing key', async () => {
      const key = 'test';

      mockCacheManager.get.mockResolvedValue('value');

      const result = await service.has(key);

      expect(result).toBe(true);
      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
    });

    /**
     * Test Case 31: Kiểm tra has với undefined value
     * Input: value = undefined
     * Expected Output: Return false
     * Path Coverage: value !== undefined (false)
     */
    it('TC031: should return false for undefined value', async () => {
      const key = 'test';

      mockCacheManager.get.mockResolvedValue(undefined);

      const result = await service.has(key);

      expect(result).toBe(false);
    });

    /**
     * Test Case 32: Kiểm tra has với null value
     * Input: value = null
     * Expected Output: Return false
     * Path Coverage: value !== null (false)
     */
    it('TC032: should return false for null value', async () => {
      const key = 'test';

      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.has(key);

      expect(result).toBe(false);
    });

    /**
     * Test Case 33: Kiểm tra has với false value
     * Input: value = false
     * Expected Output: Return true (false is valid value)
     * Path Coverage: Falsy but not null/undefined
     */
    it('TC033: should return true for false value', async () => {
      const key = 'test';

      mockCacheManager.get.mockResolvedValue(false);

      const result = await service.has(key);

      expect(result).toBe(true);
    });

    /**
     * Test Case 34: Kiểm tra has với 0 value
     * Input: value = 0
     * Expected Output: Return true (0 is valid value)
     * Path Coverage: Zero is valid
     */
    it('TC034: should return true for zero value', async () => {
      const key = 'test';

      mockCacheManager.get.mockResolvedValue(0);

      const result = await service.has(key);

      expect(result).toBe(true);
    });

    /**
     * Test Case 35: Kiểm tra has với empty string
     * Input: value = ''
     * Expected Output: Return true (empty string is valid)
     * Path Coverage: Empty string is valid
     */
    it('TC035: should return true for empty string', async () => {
      const key = 'test';

      mockCacheManager.get.mockResolvedValue('');

      const result = await service.has(key);

      expect(result).toBe(true);
    });

    /**
     * Test Case 36: Kiểm tra error handling trong has
     * Input: cacheManager.get throws error
     * Expected Output: Return false, error logged
     * Path Coverage: try-catch error path
     */
    it('TC036: should handle error in has gracefully', async () => {
      const key = 'test';
      const error = new Error('Has check failed');

      mockCacheManager.get.mockRejectedValue(error);

      const result = await service.has(key);

      expect(result).toBe(false);
      expect(service['logger'].error).toHaveBeenCalledWith(
        `Failed to check cache existence for key ${key}:`,
        error,
      );
    });

    /**
     * Test Case 37: Kiểm tra has với object value
     * Input: value = { id: 1 }
     * Expected Output: Return true
     * Path Coverage: Object value handling
     */
    it('TC037: should return true for object value', async () => {
      const key = 'test';

      mockCacheManager.get.mockResolvedValue({ id: 1 });

      const result = await service.has(key);

      expect(result).toBe(true);
    });

    /**
     * Test Case 38: Kiểm tra has với array value
     * Input: value = []
     * Expected Output: Return true
     * Path Coverage: Array value handling
     */
    it('TC038: should return true for array value', async () => {
      const key = 'test';

      mockCacheManager.get.mockResolvedValue([]);

      const result = await service.has(key);

      expect(result).toBe(true);
    });
  });

  describe('cleanExpiredEntries() Method', () => {
    /**
     * Test Case 39: Kiểm tra cleanExpiredEntries được gọi
     * Input: N/A
     * Expected Output: Logger.log được gọi
     * Path Coverage: Method execution
     */
    it('TC039: should log cleanup message', () => {
      service.cleanExpiredEntries();

      expect(service['logger'].log).toHaveBeenCalledWith(
        'Cache cleanup completed (handled automatically by cache-manager)',
      );
    });

    /**
     * Test Case 40: Kiểm tra @Cron decorator
     * Input: N/A
     * Expected Output: Method tồn tại và có thể gọi
     * Path Coverage: Decorator application
     */
    it('TC040: should have cleanExpiredEntries method defined', () => {
      expect(service.cleanExpiredEntries).toBeDefined();
      expect(typeof service.cleanExpiredEntries).toBe('function');
    });

    /**
     * Test Case 41: Kiểm tra cleanExpiredEntries không throw error
     * Input: N/A
     * Expected Output: No error thrown
     * Path Coverage: Safe execution
     */
    it('TC041: should not throw error when called', () => {
      expect(() => service.cleanExpiredEntries()).not.toThrow();
    });

    /**
     * Test Case 42: Kiểm tra multiple calls
     * Input: Call multiple times
     * Expected Output: Each call logs message
     * Path Coverage: Multiple executions
     */
    it('TC042: should log on multiple calls', () => {
      service.cleanExpiredEntries();
      service.cleanExpiredEntries();
      service.cleanExpiredEntries();

      expect(service['logger'].log).toHaveBeenCalledTimes(3);
    });
  });

  describe('Integration Tests - Cross-Method Interactions', () => {
    /**
     * Test Case 43: Kiểm tra set -> get workflow
     * Input: Set then get same key
     * Expected Output: Get returns set value
     * Path Coverage: Set-Get integration
     */
    it('TC043: should set and get value successfully', async () => {
      const key = 'test';
      const value = 'data';

      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue(value);

      await service.set(key, value);
      const result = await service.get(key);

      expect(result).toBe(value);
    });

    /**
     * Test Case 44: Kiểm tra set -> delete -> get workflow
     * Input: Set, delete, then get
     * Expected Output: Get returns null after delete
     * Path Coverage: Set-Delete-Get integration
     */
    it('TC044: should return null after delete', async () => {
      const key = 'test';
      const value = 'data';

      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.del.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue(undefined);

      await service.set(key, value);
      await service.delete(key);
      const result = await service.get(key);

      expect(result).toBeNull();
    });

    /**
     * Test Case 45: Kiểm tra set -> has workflow
     * Input: Set then check has
     * Expected Output: has returns true
     * Path Coverage: Set-Has integration
     */
    it('TC045: should return true from has after set', async () => {
      const key = 'test';
      const value = 'data';

      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue(value);

      await service.set(key, value);
      const result = await service.has(key);

      expect(result).toBe(true);
    });

    /**
     * Test Case 46: Kiểm tra set -> clear -> get workflow
     * Input: Set, clear all, then get
     * Expected Output: Get returns null after clear
     * Path Coverage: Set-Clear-Get integration
     */
    it('TC046: should return null after clear', async () => {
      const key = 'test';
      const value = 'data';

      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.reset.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue(undefined);

      await service.set(key, value);
      await service.clear();
      const result = await service.get(key);

      expect(result).toBeNull();
    });

    /**
     * Test Case 47: Kiểm tra multiple keys operations
     * Input: Set multiple keys, get them
     * Expected Output: All values retrieved correctly
     * Path Coverage: Multiple key handling
     */
    it('TC047: should handle multiple keys', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set('key1', 'value1');
      await service.set('key2', 'value2');
      await service.set('key3', 'value3');

      expect(mockCacheManager.set).toHaveBeenCalledTimes(3);
    });

    /**
     * Test Case 48: Kiểm tra error recovery
     * Input: Error in set, then successful get
     * Expected Output: Service continues working
     * Path Coverage: Error recovery
     */
    it('TC048: should recover from errors', async () => {
      const key = 'test';

      mockCacheManager.set.mockRejectedValueOnce(new Error('Set failed'));
      mockCacheManager.get.mockResolvedValue('value');

      await service.set(key, 'data'); // Fails but doesn't throw
      const result = await service.get(key);

      expect(result).toBe('value');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    /**
     * Test Case 49: Kiểm tra với very long key
     * Input: key = 1000 character string
     * Expected Output: Handled correctly
     * Path Coverage: Long string handling
     */
    it('TC049: should handle very long keys', async () => {
      const key = 'a'.repeat(1000);
      const value = 'data';

      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, 3600);
    });

    /**
     * Test Case 50: Kiểm tra với special characters trong key
     * Input: key with special chars
     * Expected Output: Handled correctly
     * Path Coverage: Special character handling
     */
    it('TC050: should handle special characters in key', async () => {
      const key = 'key:with:special!@#$%^&*()_+-={}[]|;:"<>?,./';
      const value = 'data';

      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, 3600);
    });

    /**
     * Test Case 51: Kiểm tra với Unicode trong key
     * Input: key with Unicode characters
     * Expected Output: Handled correctly
     * Path Coverage: Unicode handling
     */
    it('TC051: should handle Unicode in key', async () => {
      const key = '키_キー_مفتاح_🔑';
      const value = 'data';

      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, 3600);
    });

    /**
     * Test Case 52: Kiểm tra với large data object
     * Input: Large complex object
     * Expected Output: Handled correctly
     * Path Coverage: Large data handling
     */
    it('TC052: should handle large data objects', async () => {
      const key = 'large';
      const value = {
        users: Array(1000)
          .fill(null)
          .map((_, i) => ({ id: i, name: `User${i}` })),
      };

      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, 3600);
    });

    /**
     * Test Case 53: Kiểm tra với circular reference
     * Input: Object with circular reference
     * Expected Output: Passed to cache manager as-is
     * Path Coverage: Circular reference handling
     */
    it('TC053: should handle circular references', async () => {
      const key = 'circular';
      const value: any = { name: 'test' };
      value.self = value;

      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, 3600);
    });

    /**
     * Test Case 54: Kiểm tra với very large TTL
     * Input: ttl = Number.MAX_SAFE_INTEGER
     * Expected Output: Handled correctly
     * Path Coverage: Large TTL value
     */
    it('TC054: should handle very large TTL', async () => {
      const key = 'test';
      const value = 'data';
      const ttl = Number.MAX_SAFE_INTEGER;

      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set(key, value, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, ttl);
    });

    /**
     * Test Case 55: Kiểm tra concurrent operations
     * Input: Multiple simultaneous operations
     * Expected Output: All handled correctly
     * Path Coverage: Concurrency handling
     */
    it('TC055: should handle concurrent operations', async () => {
      mockCacheManager.set.mockResolvedValue(undefined);
      mockCacheManager.get.mockResolvedValue('value');

      const promises = [
        service.set('key1', 'value1'),
        service.get('key2'),
        service.set('key3', 'value3'),
        service.has('key4'),
        service.delete('key5'),
      ];

      await Promise.all(promises);

      expect(mockCacheManager.set).toHaveBeenCalledTimes(2);
      expect(mockCacheManager.get).toHaveBeenCalledTimes(2); // get + has
      expect(mockCacheManager.del).toHaveBeenCalledTimes(1);
    });
  });

  describe('Type Safety and Generic Handling', () => {
    /**
     * Test Case 56: Kiểm tra generic type với string
     * Input: Type T = string
     * Expected Output: Return type is string
     * Path Coverage: Generic type inference
     */
    it('TC056: should handle string type correctly', async () => {
      const key = 'test';
      const value: string = 'data';

      mockCacheManager.get.mockResolvedValue(value);

      const result = await service.get<string>(key);

      expect(typeof result).toBe('string');
    });

    /**
     * Test Case 57: Kiểm tra generic type với number
     * Input: Type T = number
     * Expected Output: Return type is number
     * Path Coverage: Number type handling
     */
    it('TC057: should handle number type correctly', async () => {
      const key = 'test';
      const value: number = 123;

      mockCacheManager.get.mockResolvedValue(value);

      const result = await service.get<number>(key);

      expect(typeof result).toBe('number');
    });

    /**
     * Test Case 58: Kiểm tra generic type với custom interface
     * Input: Type T = custom interface
     * Expected Output: Return object matches interface
     * Path Coverage: Interface type handling
     */
    it('TC058: should handle custom interface type', async () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const key = 'user';
      const value: User = { id: 1, name: 'John', email: 'john@example.com' };

      mockCacheManager.get.mockResolvedValue(value);

      const result = await service.get<User>(key);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
    });

    /**
     * Test Case 59: Kiểm tra generic type với array
     * Input: Type T = string[]
     * Expected Output: Return array of strings
     * Path Coverage: Array type handling
     */
    it('TC059: should handle array type correctly', async () => {
      const key = 'list';
      const value: string[] = ['a', 'b', 'c'];

      mockCacheManager.get.mockResolvedValue(value);

      const result = await service.get<string[]>(key);

      expect(Array.isArray(result)).toBe(true);
    });

    /**
     * Test Case 60: Kiểm tra generic type với Map
     * Input: Type T = Map
     * Expected Output: Return Map object
     * Path Coverage: Map type handling
     */
    it('TC060: should handle Map type correctly', async () => {
      const key = 'map';
      const value = new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ]);

      mockCacheManager.get.mockResolvedValue(value);

      const result = await service.get<Map<string, string>>(key);

      expect(result).toBeInstanceOf(Map);
    });
  });
});
