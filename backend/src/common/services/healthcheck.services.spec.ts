import { HealthCheckService } from './healthcheck.services';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

describe('HealthCheckService', () => {
  let service: HealthCheckService;
  let mockConnection: any;
  let loggerErrorMock: jest.SpyInstance;

  beforeEach(async () => {
    const mockAdmin = {
      ping: jest.fn(),
    };

    const mockDb = {
      admin: jest.fn().mockReturnValue(mockAdmin),
    };

    mockConnection = {
      db: mockDb,
      name: 'test-database',
      readyState: 1, // 1 = connected
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthCheckService,
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<HealthCheckService>(HealthCheckService);
    loggerErrorMock = jest
      .spyOn((service as any)['logger'] as Logger, 'error')
      .mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('checkDatabase', () => {
    it('should return healthy status when database ping succeeds', async () => {
      mockConnection.db.admin().ping.mockResolvedValueOnce({ ok: 1 });

      const result = await service.checkDatabase();

      expect(result.status).toBe('healthy');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.details).toEqual({
        database: 'test-database',
        readyState: 1,
      });
      expect(mockConnection.db.admin().ping).toHaveBeenCalled();
    });

    it('should measure response time correctly', async () => {
      mockConnection.db
        .admin()
        .ping.mockImplementation(
          () =>
            new Promise((resolve) => setTimeout(() => resolve({ ok: 1 }), 50)),
        );

      const result = await service.checkDatabase();

      expect(result.responseTime).toBeGreaterThanOrEqual(50);
      expect(result.status).toBe('healthy');
    });

    it('should return unhealthy status when database ping fails', async () => {
      const error = new Error('Connection timeout');
      mockConnection.db.admin().ping.mockRejectedValueOnce(error);

      const result = await service.checkDatabase();

      expect(result.status).toBe('unhealthy');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.details).toEqual({
        error: 'Connection timeout',
        database: 'test-database',
        readyState: 1,
      });
      expect(loggerErrorMock).toHaveBeenCalledWith(
        'Database health check failed:',
        error,
      );
    });

    it('should handle database disconnected state', async () => {
      mockConnection.readyState = 0; // 0 = disconnected
      const error = new Error('Database not connected');
      mockConnection.db.admin().ping.mockRejectedValueOnce(error);

      const result = await service.checkDatabase();

      expect(result.status).toBe('unhealthy');
      expect(result.details.readyState).toBe(0);
    });

    it('should handle database connecting state', async () => {
      mockConnection.readyState = 2; // 2 = connecting
      mockConnection.db.admin().ping.mockResolvedValueOnce({ ok: 1 });

      const result = await service.checkDatabase();

      expect(result.status).toBe('healthy');
      expect(result.details.readyState).toBe(2);
    });

    it('should handle database disconnecting state', async () => {
      mockConnection.readyState = 3; // 3 = disconnecting
      const error = new Error('Disconnecting');
      mockConnection.db.admin().ping.mockRejectedValueOnce(error);

      const result = await service.checkDatabase();

      expect(result.status).toBe('unhealthy');
      expect(result.details.readyState).toBe(3);
    });

    it('should include database name in healthy response', async () => {
      mockConnection.name = 'production-db';
      mockConnection.db.admin().ping.mockResolvedValueOnce({ ok: 1 });

      const result = await service.checkDatabase();

      expect(result.details.database).toBe('production-db');
    });

    it('should include database name in unhealthy response', async () => {
      mockConnection.name = 'test-db';
      const error = new Error('Ping failed');
      mockConnection.db.admin().ping.mockRejectedValueOnce(error);

      const result = await service.checkDatabase();

      expect(result.details.database).toBe('test-db');
    });

    it('should handle error without message property', async () => {
      const error = { code: 'ECONNREFUSED' };
      mockConnection.db.admin().ping.mockRejectedValueOnce(error);

      const result = await service.checkDatabase();

      expect(result.status).toBe('unhealthy');
      expect(result.details.error).toBeUndefined();
    });

    it('should measure fast response times', async () => {
      mockConnection.db.admin().ping.mockResolvedValueOnce({ ok: 1 });

      const result = await service.checkDatabase();

      expect(result.responseTime).toBeLessThan(100);
      expect(result.status).toBe('healthy');
    });

    it('should handle multiple consecutive checks', async () => {
      mockConnection.db.admin().ping.mockResolvedValue({ ok: 1 });

      const result1 = await service.checkDatabase();
      const result2 = await service.checkDatabase();
      const result3 = await service.checkDatabase();

      expect(result1.status).toBe('healthy');
      expect(result2.status).toBe('healthy');
      expect(result3.status).toBe('healthy');
      expect(mockConnection.db.admin().ping).toHaveBeenCalledTimes(3);
    });
  });

  describe('getOverallHealth', () => {
    it('should return healthy status when database is healthy', async () => {
      mockConnection.db.admin().ping.mockResolvedValueOnce({ ok: 1 });

      const result = await service.getOverallHealth();

      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
      expect(result.services).toHaveProperty('database');
      expect(result.services.database.status).toBe('healthy');
    });

    it('should return unhealthy status when database is unhealthy', async () => {
      const error = new Error('Database connection failed');
      mockConnection.db.admin().ping.mockRejectedValueOnce(error);

      const result = await service.getOverallHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.services.database.status).toBe('unhealthy');
    });

    it('should include ISO timestamp in response', async () => {
      mockConnection.db.admin().ping.mockResolvedValueOnce({ ok: 1 });

      const beforeTime = new Date().toISOString();
      const result = await service.getOverallHealth();
      const afterTime = new Date().toISOString();

      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(result.timestamp >= beforeTime).toBe(true);
      expect(result.timestamp <= afterTime).toBe(true);
    });

    it('should include response time for database service', async () => {
      mockConnection.db.admin().ping.mockResolvedValueOnce({ ok: 1 });

      const result = await service.getOverallHealth();

      expect(result.services.database.responseTime).toBeDefined();
      expect(typeof result.services.database.responseTime).toBe('number');
    });

    it('should include database details in overall health', async () => {
      mockConnection.db.admin().ping.mockResolvedValueOnce({ ok: 1 });

      const result = await service.getOverallHealth();

      expect(result.services.database.details).toEqual({
        database: 'test-database',
        readyState: 1,
      });
    });

    it('should handle database failure', async () => {
      const dbError = new Error('Database failed');
      mockConnection.db.admin().ping.mockRejectedValueOnce(dbError);

      const result = await service.getOverallHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.services.database.status).toBe('unhealthy');
    });

    it('should have consistent structure for healthy response', async () => {
      mockConnection.db.admin().ping.mockResolvedValueOnce({ ok: 1 });

      const result = await service.getOverallHealth();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('services');
      expect(result.services).toHaveProperty('database');
    });

    it('should have consistent structure for unhealthy response', async () => {
      const error = new Error('Connection failed');
      mockConnection.db.admin().ping.mockRejectedValueOnce(error);

      const result = await service.getOverallHealth();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('services');
      expect(result.services.database).toHaveProperty('status');
      expect(result.services.database).toHaveProperty('responseTime');
      expect(result.services.database).toHaveProperty('details');
    });

    it('should not throw error when health checks fail', async () => {
      const error = new Error('Critical failure');
      mockConnection.db.admin().ping.mockRejectedValueOnce(error);

      await expect(service.getOverallHealth()).resolves.not.toThrow();
    });

    it('should handle rapid consecutive health checks', async () => {
      mockConnection.db.admin().ping.mockResolvedValue({ ok: 1 });

      const results = await Promise.all([
        service.getOverallHealth(),
        service.getOverallHealth(),
        service.getOverallHealth(),
      ]);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.status).toBe('healthy');
        expect(result.timestamp).toBeDefined();
      });
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle null database name', async () => {
      mockConnection.name = null;
      mockConnection.db.admin().ping.mockResolvedValueOnce({ ok: 1 });

      const result = await service.checkDatabase();

      expect(result.status).toBe('healthy');
      expect(result.details.database).toBeNull();
    });

    it('should handle undefined database name', async () => {
      mockConnection.name = undefined;
      mockConnection.db.admin().ping.mockResolvedValueOnce({ ok: 1 });

      const result = await service.checkDatabase();

      expect(result.status).toBe('healthy');
      expect(result.details.database).toBeUndefined();
    });

    it('should handle extremely slow database response', async () => {
      mockConnection.db
        .admin()
        .ping.mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ ok: 1 }), 1000),
            ),
        );

      const result = await service.checkDatabase();

      expect(result.responseTime).toBeGreaterThanOrEqual(1000);
      expect(result.status).toBe('healthy');
    });

    it('should handle database ping timeout', async () => {
      const timeoutError = new Error('Operation timed out after 30000ms');
      mockConnection.db.admin().ping.mockRejectedValueOnce(timeoutError);

      const result = await service.checkDatabase();

      expect(result.status).toBe('unhealthy');
      expect(result.details.error).toContain('timed out');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('ECONNREFUSED');
      networkError.name = 'MongoNetworkError';
      mockConnection.db.admin().ping.mockRejectedValueOnce(networkError);

      const result = await service.checkDatabase();

      expect(result.status).toBe('unhealthy');
      expect(loggerErrorMock).toHaveBeenCalled();
    });

    it('should handle authentication errors', async () => {
      const authError = new Error('Authentication failed');
      mockConnection.db.admin().ping.mockRejectedValueOnce(authError);

      const result = await service.checkDatabase();

      expect(result.status).toBe('unhealthy');
      expect(result.details.error).toBe('Authentication failed');
    });

    it('should handle different readyState values correctly', async () => {
      const readyStates = [0, 1, 2, 3];

      for (const state of readyStates) {
        mockConnection.readyState = state;
        mockConnection.db.admin().ping.mockResolvedValueOnce({ ok: 1 });

        const result = await service.checkDatabase();

        expect(result.details.readyState).toBe(state);
      }
    });

    it('should verify overall health checks database independently', async () => {
      mockConnection.db.admin().ping.mockResolvedValueOnce({ ok: 1 });

      const result = await service.getOverallHealth();

      expect(result.services.database.responseTime).toBeDefined();
      expect(typeof result.services.database.responseTime).toBe('number');
    });

    it('should handle service check order independence', async () => {
      mockConnection.db.admin().ping.mockResolvedValueOnce({ ok: 1 });

      const result1 = await service.getOverallHealth();

      mockConnection.db.admin().ping.mockResolvedValueOnce({ ok: 1 });
      const result2 = await service.getOverallHealth();

      expect(result1.status).toBe(result2.status);
    });

    it('should log database errors', async () => {
      const error = new Error('Database error');
      mockConnection.db.admin().ping.mockRejectedValueOnce(error);

      await service.getOverallHealth();

      expect(loggerErrorMock).toHaveBeenCalledTimes(1);
      expect(loggerErrorMock).toHaveBeenCalledWith(
        'Database health check failed:',
        error,
      );
    });

    it('should maintain health check consistency across multiple calls', async () => {
      mockConnection.db.admin().ping.mockResolvedValue({ ok: 1 });

      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(await service.getOverallHealth());
      }

      expect(results.every((r) => r.status === 'healthy')).toBe(true);
    });

    it('should handle mixed success and failure scenarios', async () => {
      // First call succeeds
      mockConnection.db.admin().ping.mockResolvedValueOnce({ ok: 1 });
      const result1 = await service.getOverallHealth();
      expect(result1.status).toBe('healthy');

      // Second call fails
      mockConnection.db
        .admin()
        .ping.mockRejectedValueOnce(new Error('Failure'));
      const result2 = await service.getOverallHealth();
      expect(result2.status).toBe('unhealthy');

      // Third call succeeds again
      mockConnection.db.admin().ping.mockResolvedValueOnce({ ok: 1 });
      const result3 = await service.getOverallHealth();
      expect(result3.status).toBe('healthy');
    });

    it('should provide complete error information in unhealthy state', async () => {
      const detailedError = new Error(
        'Connection refused: Database is not accepting connections',
      );
      mockConnection.db.admin().ping.mockRejectedValueOnce(detailedError);

      const result = await service.checkDatabase();

      expect(result.status).toBe('unhealthy');
      expect(result.details.error).toBe(
        'Connection refused: Database is not accepting connections',
      );
      expect(result.details.database).toBe('test-database');
      expect(result.details.readyState).toBe(1);
    });

    it('should measure zero response time for instant responses', async () => {
      mockConnection.db.admin().ping.mockResolvedValueOnce({ ok: 1 });

      const result = await service.checkDatabase();

      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.responseTime).toBeLessThan(50);
    });
  });
});
