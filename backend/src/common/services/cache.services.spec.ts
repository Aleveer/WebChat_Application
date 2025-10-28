import { CacheService } from './cache.services';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: jest.Mocked<Cache>;
  let loggerDebugMock: jest.SpyInstance;
  let loggerErrorMock: jest.SpyInstance;
  let loggerLogMock: jest.SpyInstance;

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

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

    loggerDebugMock = jest
      .spyOn((service as any)['logger'] as Logger, 'debug')
      .mockImplementation();
    loggerErrorMock = jest
      .spyOn((service as any)['logger'] as Logger, 'error')
      .mockImplementation();
    loggerLogMock = jest
      .spyOn((service as any)['logger'] as Logger, 'log')
      .mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('set', () => {
    it('should set cache with key, data and default TTL', async () => {
      const key = 'test-key';
      const data = { id: 1, name: 'Test' };

      await service.set(key, data);

      expect(cacheManager.set).toHaveBeenCalledWith(key, data, 3600);
      expect(loggerDebugMock).toHaveBeenCalledWith(
        `Cache set: ${key}, TTL: 3600s`,
      );
    });

    it('should set cache with custom TTL', async () => {
      const key = 'custom-ttl-key';
      const data = 'test-data';
      const customTTL = 7200;

      await service.set(key, data, customTTL);

      expect(cacheManager.set).toHaveBeenCalledWith(key, data, customTTL);
      expect(loggerDebugMock).toHaveBeenCalledWith(
        `Cache set: ${key}, TTL: ${customTTL}s`,
      );
    });

    it('should set cache with TTL of 0', async () => {
      const key = 'zero-ttl-key';
      const data = 'instant-expire';

      await service.set(key, data, 0);

      expect(cacheManager.set).toHaveBeenCalledWith(key, data, 0);
      expect(loggerDebugMock).toHaveBeenCalledWith(
        `Cache set: ${key}, TTL: 0s`,
      );
    });

    it('should set cache with complex object data', async () => {
      const key = 'complex-object';
      const data = {
        user: {
          id: 123,
          profile: {
            name: 'John',
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
        metadata: ['tag1', 'tag2'],
      };

      await service.set(key, data, 1800);

      expect(cacheManager.set).toHaveBeenCalledWith(key, data, 1800);
      expect(loggerDebugMock).toHaveBeenCalled();
    });

    it('should set cache with array data', async () => {
      const key = 'array-data';
      const data = [1, 2, 3, 4, 5];

      await service.set(key, data);

      expect(cacheManager.set).toHaveBeenCalledWith(key, data, 3600);
    });

    it('should set cache with string data', async () => {
      const key = 'string-data';
      const data = 'simple string value';

      await service.set(key, data, 600);

      expect(cacheManager.set).toHaveBeenCalledWith(key, data, 600);
    });

    it('should set cache with number data', async () => {
      const key = 'number-data';
      const data = 42;

      await service.set(key, data);

      expect(cacheManager.set).toHaveBeenCalledWith(key, data, 3600);
    });

    it('should set cache with boolean data', async () => {
      const key = 'boolean-data';
      const data = true;

      await service.set(key, data, 300);

      expect(cacheManager.set).toHaveBeenCalledWith(key, data, 300);
    });

    it('should set cache with null data', async () => {
      const key = 'null-data';
      const data = null;

      await service.set(key, data);

      expect(cacheManager.set).toHaveBeenCalledWith(key, data, 3600);
    });

    it('should handle error when setting cache fails', async () => {
      const key = 'error-key';
      const data = 'test';
      const error = new Error('Cache set failed');

      cacheManager.set.mockRejectedValueOnce(error);

      await service.set(key, data);

      expect(loggerErrorMock).toHaveBeenCalledWith(
        `Failed to set cache for key ${key}:`,
        error,
      );
    });

    it('should not throw error when cache set fails', async () => {
      const key = 'fail-key';
      const data = 'test';

      cacheManager.set.mockRejectedValueOnce(new Error('Connection error'));

      await expect(service.set(key, data)).resolves.not.toThrow();
    });
  });

  describe('get', () => {
    it('should get cached data by key', async () => {
      const key = 'existing-key';
      const cachedData = { id: 1, value: 'cached' };

      cacheManager.get.mockResolvedValueOnce(cachedData);

      const result = await service.get(key);

      expect(cacheManager.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(cachedData);
    });

    it('should return null when key does not exist', async () => {
      const key = 'non-existent-key';

      cacheManager.get.mockResolvedValueOnce(undefined);

      const result = await service.get(key);

      expect(result).toBeNull();
    });

    it('should return null when cached value is null', async () => {
      const key = 'null-value-key';

      cacheManager.get.mockResolvedValueOnce(null);

      const result = await service.get(key);

      expect(result).toBeNull();
    });

    it('should get string data from cache', async () => {
      const key = 'string-key';
      const cachedData = 'cached string';

      cacheManager.get.mockResolvedValueOnce(cachedData);

      const result = await service.get<string>(key);

      expect(result).toBe(cachedData);
    });

    it('should get number data from cache', async () => {
      const key = 'number-key';
      const cachedData = 123;

      cacheManager.get.mockResolvedValueOnce(cachedData);

      const result = await service.get<number>(key);

      expect(result).toBe(123);
    });

    it('should get boolean data from cache (true)', async () => {
      const key = 'boolean-key';
      const cachedData = true;

      cacheManager.get.mockResolvedValueOnce(cachedData);

      const result = await service.get<boolean>(key);

      expect(result).toBe(true);
    });

    it('should return null for boolean false due to falsy check', async () => {
      const key = 'boolean-false-key';
      const cachedData = false;

      cacheManager.get.mockResolvedValueOnce(cachedData);

      const result = await service.get<boolean>(key);

      // Due to `cached || null` logic, false is treated as falsy and returns null
      expect(result).toBeNull();
    });

    it('should get array data from cache', async () => {
      const key = 'array-key';
      const cachedData = [1, 2, 3];

      cacheManager.get.mockResolvedValueOnce(cachedData);

      const result = await service.get<number[]>(key);

      expect(result).toEqual([1, 2, 3]);
    });

    it('should get empty array from cache (truthy in OR operation)', async () => {
      const key = 'empty-array-key';
      const cachedData: any[] = [];

      cacheManager.get.mockResolvedValueOnce(cachedData);

      const result = await service.get<any[]>(key);

      // Empty array is truthy object, so it's returned
      expect(result).toEqual([]);
    });

    it('should return null for number 0 due to falsy check', async () => {
      const key = 'zero-key';
      const cachedData = 0;

      cacheManager.get.mockResolvedValueOnce(cachedData);

      const result = await service.get<number>(key);

      // 0 is falsy, so returns null
      expect(result).toBeNull();
    });

    it('should return null for empty string due to falsy check', async () => {
      const key = 'empty-string-key';
      const cachedData = '';

      cacheManager.get.mockResolvedValueOnce(cachedData);

      const result = await service.get<string>(key);

      // Empty string is falsy, so returns null
      expect(result).toBeNull();
    });

    it('should get complex object from cache', async () => {
      const key = 'complex-key';
      const cachedData = {
        nested: {
          data: 'value',
          array: [1, 2, 3],
        },
      };

      cacheManager.get.mockResolvedValueOnce(cachedData);

      const result = await service.get(key);

      expect(result).toEqual(cachedData);
    });

    it('should handle error when getting cache fails', async () => {
      const key = 'error-key';
      const error = new Error('Cache get failed');

      cacheManager.get.mockRejectedValueOnce(error);

      const result = await service.get(key);

      expect(result).toBeNull();
      expect(loggerErrorMock).toHaveBeenCalledWith(
        `Failed to get cache for key ${key}:`,
        error,
      );
    });

    it('should return null and not throw when cache get fails', async () => {
      const key = 'fail-key';

      cacheManager.get.mockRejectedValueOnce(new Error('Connection error'));

      const result = await service.get(key);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete cache by key and return true', async () => {
      const key = 'delete-key';

      cacheManager.del.mockResolvedValueOnce(undefined);

      const result = await service.delete(key);

      expect(cacheManager.del).toHaveBeenCalledWith(key);
      expect(result).toBe(true);
    });

    it('should handle error when deleting cache fails and return false', async () => {
      const key = 'error-delete-key';
      const error = new Error('Cache delete failed');

      cacheManager.del.mockRejectedValueOnce(error);

      const result = await service.delete(key);

      expect(result).toBe(false);
      expect(loggerErrorMock).toHaveBeenCalledWith(
        `Failed to delete cache for key ${key}:`,
        error,
      );
    });

    it('should return false and not throw when delete fails', async () => {
      const key = 'fail-key';

      cacheManager.del.mockRejectedValueOnce(new Error('Connection error'));

      const result = await service.delete(key);

      expect(result).toBe(false);
    });

    it('should delete multiple different keys', async () => {
      cacheManager.del.mockResolvedValue(undefined);

      const result1 = await service.delete('key1');
      const result2 = await service.delete('key2');
      const result3 = await service.delete('key3');

      expect(result1).toBe(true);
      expect(result2).toBe(true);
      expect(result3).toBe(true);
      expect(cacheManager.del).toHaveBeenCalledTimes(3);
    });
  });

  describe('clear', () => {
    it('should log cache clear request', async () => {
      await service.clear();

      expect(loggerLogMock).toHaveBeenCalledWith(
        'Cache clear requested (not implemented in v6)',
      );
    });

    it('should handle error during clear gracefully', async () => {
      // Force an error by making logger.log throw
      loggerLogMock.mockImplementationOnce(() => {
        throw new Error('Logger error');
      });

      await expect(service.clear()).resolves.not.toThrow();
      expect(loggerErrorMock).toHaveBeenCalledWith(
        'Failed to clear cache:',
        expect.any(Error),
      );
    });

    it('should not throw error when clear is called', async () => {
      await expect(service.clear()).resolves.not.toThrow();
    });
  });

  describe('has', () => {
    it('should return true when key exists with value', async () => {
      const key = 'existing-key';

      cacheManager.get.mockResolvedValueOnce('some value');

      const result = await service.has(key);

      expect(cacheManager.get).toHaveBeenCalledWith(key);
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      const key = 'non-existent-key';

      cacheManager.get.mockResolvedValueOnce(undefined);

      const result = await service.has(key);

      expect(result).toBe(false);
    });

    it('should return false when value is null', async () => {
      const key = 'null-key';

      cacheManager.get.mockResolvedValueOnce(null);

      const result = await service.has(key);

      expect(result).toBe(false);
    });

    it('should return true for various truthy data types', async () => {
      cacheManager.get.mockResolvedValueOnce('string');
      expect(await service.has('string-key')).toBe(true);

      cacheManager.get.mockResolvedValueOnce(123);
      expect(await service.has('number-key')).toBe(true);

      cacheManager.get.mockResolvedValueOnce(true);
      expect(await service.has('boolean-key')).toBe(true);

      cacheManager.get.mockResolvedValueOnce([1]);
      expect(await service.has('array-key')).toBe(true);

      cacheManager.get.mockResolvedValueOnce({ key: 'value' });
      expect(await service.has('object-key')).toBe(true);
    });

    it('should return true when value is 0 (not null/undefined)', async () => {
      const key = 'zero-key';

      cacheManager.get.mockResolvedValueOnce(0);

      const result = await service.has(key);

      // has() checks !== undefined && !== null, so 0 returns true
      expect(result).toBe(true);
    });

    it('should return true when value is false (not null/undefined)', async () => {
      const key = 'false-key';

      cacheManager.get.mockResolvedValueOnce(false);

      const result = await service.has(key);

      // has() checks !== undefined && !== null, so false returns true
      expect(result).toBe(true);
    });

    it('should return true when value is empty string (not null/undefined)', async () => {
      const key = 'empty-string-key';

      cacheManager.get.mockResolvedValueOnce('');

      const result = await service.has(key);

      // has() checks !== undefined && !== null, so empty string returns true
      expect(result).toBe(true);
    });

    it('should handle error when checking existence fails', async () => {
      const key = 'error-key';
      const error = new Error('Cache check failed');

      cacheManager.get.mockRejectedValueOnce(error);

      const result = await service.has(key);

      expect(result).toBe(false);
      expect(loggerErrorMock).toHaveBeenCalledWith(
        `Failed to check cache existence for key ${key}:`,
        error,
      );
    });

    it('should return false and not throw when has check fails', async () => {
      const key = 'fail-key';

      cacheManager.get.mockRejectedValueOnce(new Error('Connection error'));

      const result = await service.has(key);

      expect(result).toBe(false);
    });
  });

  describe('cleanExpiredEntries', () => {
    it('should log cleanup completion message', () => {
      service.cleanExpiredEntries();

      expect(loggerLogMock).toHaveBeenCalledWith(
        'Cache cleanup completed (handled automatically by cache-manager)',
      );
    });

    it('should not throw error when called', () => {
      expect(() => service.cleanExpiredEntries()).not.toThrow();
    });

    it('should call logger exactly once', () => {
      service.cleanExpiredEntries();

      expect(loggerLogMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle set and get for same key', async () => {
      const key = 'test-key';
      const data = { value: 'test' };

      await service.set(key, data);

      cacheManager.get.mockResolvedValueOnce(data);
      const result = await service.get(key);

      expect(result).toEqual(data);
    });

    it('should handle set, check existence, and delete', async () => {
      const key = 'lifecycle-key';
      const data = 'test-data';

      await service.set(key, data);

      cacheManager.get.mockResolvedValueOnce(data);
      const exists = await service.has(key);
      expect(exists).toBe(true);

      const deleted = await service.delete(key);
      expect(deleted).toBe(true);
    });

    it('should handle special characters in keys', async () => {
      const specialKey = 'user:123:profile@domain.com';
      const data = { id: 123 };

      await service.set(specialKey, data);

      expect(cacheManager.set).toHaveBeenCalledWith(specialKey, data, 3600);
    });

    it('should handle very long keys', async () => {
      const longKey = 'a'.repeat(1000);
      const data = 'value';

      await service.set(longKey, data);

      expect(cacheManager.set).toHaveBeenCalledWith(longKey, data, 3600);
    });

    it('should handle empty string key', async () => {
      const emptyKey = '';
      const data = 'value';

      await service.set(emptyKey, data);

      expect(cacheManager.set).toHaveBeenCalledWith(emptyKey, data, 3600);
    });

    it('should handle very large TTL values', async () => {
      const key = 'large-ttl-key';
      const data = 'value';
      const largeTTL = Number.MAX_SAFE_INTEGER;

      await service.set(key, data, largeTTL);

      expect(cacheManager.set).toHaveBeenCalledWith(key, data, largeTTL);
    });

    it('should handle negative TTL values', async () => {
      const key = 'negative-ttl-key';
      const data = 'value';
      const negativeTTL = -100;

      await service.set(key, data, negativeTTL);

      expect(cacheManager.set).toHaveBeenCalledWith(key, data, negativeTTL);
    });

    it('should handle multiple operations on same key', async () => {
      const key = 'multi-op-key';

      await service.set(key, 'value1');
      await service.set(key, 'value2', 7200);
      await service.set(key, 'value3', 3600);

      expect(cacheManager.set).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent operations', async () => {
      const operations = [
        service.set('key1', 'value1'),
        service.set('key2', 'value2'),
        service.get('key3'),
        service.has('key4'),
        service.delete('key5'),
      ];

      await expect(Promise.all(operations)).resolves.not.toThrow();
    });

    it('should verify all error paths log appropriately', async () => {
      const setError = new Error('Set error');
      const getError = new Error('Get error');
      const delError = new Error('Delete error');
      const hasError = new Error('Has error');

      cacheManager.set.mockRejectedValueOnce(setError);
      cacheManager.get.mockRejectedValueOnce(getError);
      cacheManager.del.mockRejectedValueOnce(delError);
      cacheManager.get.mockRejectedValueOnce(hasError);

      await service.set('key1', 'value');
      await service.get('key2');
      await service.delete('key3');
      await service.has('key4');

      expect(loggerErrorMock).toHaveBeenCalledTimes(4);
    });
  });
});
