import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../src/common/controllers/health.controller';
import { HealthCheckService } from '../src/common/services/healthcheck.services';

describe('HealthController - White Box Testing (Input-Output)', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;

  // Mock HealthCheckService
  const mockHealthCheckService = {
    getOverallHealth: jest.fn(),
    checkDatabase: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Controller Initialization', () => {
    /**
     * Test Case 1: Kiểm tra controller được khởi tạo
     * Input: N/A
     * Expected Output: Controller instance tồn tại
     * Path Coverage: Constructor execution
     */
    it('TC001: should be defined', () => {
      expect(controller).toBeDefined();
    });

    /**
     * Test Case 2: Kiểm tra healthCheckService được inject
     * Input: N/A
     * Expected Output: Service instance tồn tại
     * Path Coverage: Dependency injection verification
     */
    it('TC002: should have healthCheckService injected', () => {
      expect(healthCheckService).toBeDefined();
    });
  });

  describe('getHealth() Method', () => {
    /**
     * Test Case 3: Kiểm tra getHealth với status healthy
     * Input: Mock service returns healthy status
     * Expected Output: { statusCode: 200, status: 'healthy', ... }
     * Path Coverage: Healthy branch (httpStatus = 200)
     */
    it('TC003: should return 200 status code when service is healthy', async () => {
      const mockHealthData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {
          database: {
            status: 'healthy',
            responseTime: 15,
            details: { database: 'webchat', readyState: 1 },
          },
        },
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      const result = await controller.getHealth();

      expect(result.statusCode).toBe(200);
      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBe(mockHealthData.timestamp);
      expect(result.services).toEqual(mockHealthData.services);
    });

    /**
     * Test Case 4: Kiểm tra getHealth với status unhealthy
     * Input: Mock service returns unhealthy status
     * Expected Output: { statusCode: 503, status: 'unhealthy', ... }
     * Path Coverage: Unhealthy branch (httpStatus = 503)
     */
    it('TC004: should return 503 status code when service is unhealthy', async () => {
      const mockHealthData = {
        status: 'unhealthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {
          database: {
            status: 'unhealthy',
            responseTime: 5000,
            details: { error: 'Connection timeout' },
          },
        },
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      const result = await controller.getHealth();

      expect(result.statusCode).toBe(503);
      expect(result.status).toBe('unhealthy');
      expect(result.timestamp).toBe(mockHealthData.timestamp);
      expect(result.services).toEqual(mockHealthData.services);
    });

    /**
     * Test Case 5: Kiểm tra getHealth gọi service method đúng
     * Input: N/A
     * Expected Output: healthCheckService.getOverallHealth được gọi
     * Path Coverage: Service method invocation
     */
    it('TC005: should call healthCheckService.getOverallHealth', async () => {
      const mockHealthData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {},
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      await controller.getHealth();

      expect(mockHealthCheckService.getOverallHealth).toHaveBeenCalledTimes(1);
      expect(mockHealthCheckService.getOverallHealth).toHaveBeenCalledWith();
    });

    /**
     * Test Case 6: Kiểm tra getHealth với multiple services healthy
     * Input: Mock with multiple healthy services
     * Expected Output: statusCode = 200, all services included
     * Path Coverage: Multiple services - all healthy
     */
    it('TC006: should return 200 when all multiple services are healthy', async () => {
      const mockHealthData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {
          database: {
            status: 'healthy',
            responseTime: 15,
            details: {},
          },
          redis: {
            status: 'healthy',
            responseTime: 5,
            details: {},
          },
          api: {
            status: 'healthy',
            responseTime: 10,
            details: {},
          },
        },
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      const result = await controller.getHealth();

      expect(result.statusCode).toBe(200);
      expect(result.status).toBe('healthy');
      expect(Object.keys(result.services)).toHaveLength(3);
    });

    /**
     * Test Case 7: Kiểm tra getHealth với one service unhealthy
     * Input: Mock with one unhealthy service among multiple
     * Expected Output: statusCode = 503
     * Path Coverage: Multiple services - at least one unhealthy
     */
    it('TC007: should return 503 when at least one service is unhealthy', async () => {
      const mockHealthData = {
        status: 'unhealthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {
          database: {
            status: 'healthy',
            responseTime: 15,
            details: {},
          },
          redis: {
            status: 'unhealthy',
            responseTime: 5000,
            details: { error: 'Connection failed' },
          },
        },
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      const result = await controller.getHealth();

      expect(result.statusCode).toBe(503);
      expect(result.status).toBe('unhealthy');
    });

    /**
     * Test Case 8: Kiểm tra getHealth return structure
     * Input: Mock healthy response
     * Expected Output: Object có đúng structure với statusCode spread
     * Path Coverage: Object spreading and structure
     */
    it('TC008: should spread health data correctly with statusCode', async () => {
      const mockHealthData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {},
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      const result = await controller.getHealth();

      expect(result).toHaveProperty('statusCode');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('services');
    });

    /**
     * Test Case 9: Kiểm tra getHealth với empty services
     * Input: Mock with no services
     * Expected Output: Valid response with empty services object
     * Path Coverage: Edge case - no services
     */
    it('TC009: should handle empty services object', async () => {
      const mockHealthData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {},
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      const result = await controller.getHealth();

      expect(result.statusCode).toBe(200);
      expect(result.services).toEqual({});
    });

    /**
     * Test Case 10: Kiểm tra getHealth async behavior
     * Input: Mock async response
     * Expected Output: Promise resolves correctly
     * Path Coverage: Async/await execution
     */
    it('TC010: should handle async operation correctly', async () => {
      const mockHealthData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {},
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      const resultPromise = controller.getHealth();

      expect(resultPromise).toBeInstanceOf(Promise);

      const result = await resultPromise;
      expect(result).toBeDefined();
    });
  });

  describe('getDatabaseHealth() Method', () => {
    /**
     * Test Case 11: Kiểm tra getDatabaseHealth với database healthy
     * Input: Mock database healthy status
     * Expected Output: { component: 'database', status: 'healthy', ... }
     * Path Coverage: Database check - healthy path
     */
    it('TC011: should return database health with component field', async () => {
      const mockDatabaseHealth = {
        status: 'healthy',
        responseTime: 15,
        details: { database: 'webchat', readyState: 1 },
      };

      mockHealthCheckService.checkDatabase.mockResolvedValue(
        mockDatabaseHealth,
      );

      const result = await controller.getDatabaseHealth();

      expect(result.component).toBe('database');
      expect(result.status).toBe('healthy');
      expect(result.responseTime).toBe(15);
      expect(result.details).toEqual(mockDatabaseHealth.details);
    });

    /**
     * Test Case 12: Kiểm tra getDatabaseHealth với database unhealthy
     * Input: Mock database unhealthy status
     * Expected Output: { component: 'database', status: 'unhealthy', ... }
     * Path Coverage: Database check - unhealthy path
     */
    it('TC012: should return unhealthy database status', async () => {
      const mockDatabaseHealth = {
        status: 'unhealthy',
        responseTime: 5000,
        details: { error: 'Connection timeout' },
      };

      mockHealthCheckService.checkDatabase.mockResolvedValue(
        mockDatabaseHealth,
      );

      const result = await controller.getDatabaseHealth();

      expect(result.component).toBe('database');
      expect(result.status).toBe('unhealthy');
      expect(result.details.error).toBe('Connection timeout');
    });

    /**
     * Test Case 13: Kiểm tra getDatabaseHealth gọi service method
     * Input: N/A
     * Expected Output: checkDatabase được gọi
     * Path Coverage: Service method invocation
     */
    it('TC013: should call healthCheckService.checkDatabase', async () => {
      const mockDatabaseHealth = {
        status: 'healthy',
        responseTime: 15,
        details: {},
      };

      mockHealthCheckService.checkDatabase.mockResolvedValue(
        mockDatabaseHealth,
      );

      await controller.getDatabaseHealth();

      expect(mockHealthCheckService.checkDatabase).toHaveBeenCalledTimes(1);
      expect(mockHealthCheckService.checkDatabase).toHaveBeenCalledWith();
    });

    /**
     * Test Case 14: Kiểm tra getDatabaseHealth return structure
     * Input: Mock response
     * Expected Output: Object có component + spread database health
     * Path Coverage: Object spreading
     */
    it('TC014: should spread database health data with component', async () => {
      const mockDatabaseHealth = {
        status: 'healthy',
        responseTime: 15,
        details: { database: 'webchat' },
      };

      mockHealthCheckService.checkDatabase.mockResolvedValue(
        mockDatabaseHealth,
      );

      const result = await controller.getDatabaseHealth();

      expect(result).toHaveProperty('component');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('responseTime');
      expect(result).toHaveProperty('details');
    });

    /**
     * Test Case 15: Kiểm tra getDatabaseHealth với fast response
     * Input: Mock quick database response (low responseTime)
     * Expected Output: Health data with low responseTime
     * Path Coverage: Fast response path
     */
    it('TC015: should handle fast database response', async () => {
      const mockDatabaseHealth = {
        status: 'healthy',
        responseTime: 1,
        details: {},
      };

      mockHealthCheckService.checkDatabase.mockResolvedValue(
        mockDatabaseHealth,
      );

      const result = await controller.getDatabaseHealth();

      expect(result.responseTime).toBe(1);
      expect(result.status).toBe('healthy');
    });

    /**
     * Test Case 16: Kiểm tra getDatabaseHealth với slow response
     * Input: Mock slow database response (high responseTime)
     * Expected Output: Health data with high responseTime
     * Path Coverage: Slow response path
     */
    it('TC016: should handle slow database response', async () => {
      const mockDatabaseHealth = {
        status: 'unhealthy',
        responseTime: 10000,
        details: { error: 'Slow query' },
      };

      mockHealthCheckService.checkDatabase.mockResolvedValue(
        mockDatabaseHealth,
      );

      const result = await controller.getDatabaseHealth();

      expect(result.responseTime).toBe(10000);
      expect(result.status).toBe('unhealthy');
    });
  });

  describe('getLiveness() Method', () => {
    /**
     * Test Case 17: Kiểm tra getLiveness trả về alive status
     * Input: N/A
     * Expected Output: { status: 'alive', timestamp: ISO string }
     * Path Coverage: Liveness check execution
     */
    it('TC017: should return alive status', async () => {
      const result = await controller.getLiveness();

      expect(result.status).toBe('alive');
      expect(result.timestamp).toBeDefined();
    });

    /**
     * Test Case 18: Kiểm tra getLiveness timestamp format
     * Input: N/A
     * Expected Output: timestamp là valid ISO string
     * Path Coverage: Timestamp generation
     */
    it('TC018: should return valid ISO timestamp', async () => {
      const result = await controller.getLiveness();

      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );

      const date = new Date(result.timestamp);
      expect(date.toISOString()).toBe(result.timestamp);
    });

    /**
     * Test Case 19: Kiểm tra getLiveness không gọi service
     * Input: N/A
     * Expected Output: Service methods không được gọi
     * Path Coverage: Independent liveness check
     */
    it('TC019: should not call any health check service methods', async () => {
      await controller.getLiveness();

      expect(mockHealthCheckService.getOverallHealth).not.toHaveBeenCalled();
      expect(mockHealthCheckService.checkDatabase).not.toHaveBeenCalled();
    });

    /**
     * Test Case 20: Kiểm tra getLiveness luôn trả về alive
     * Input: Multiple calls
     * Expected Output: Luôn trả về status 'alive'
     * Path Coverage: Consistency check
     */
    it('TC020: should always return alive status', async () => {
      const result1 = await controller.getLiveness();
      const result2 = await controller.getLiveness();
      const result3 = await controller.getLiveness();

      expect(result1.status).toBe('alive');
      expect(result2.status).toBe('alive');
      expect(result3.status).toBe('alive');
    });

    /**
     * Test Case 21: Kiểm tra getLiveness timestamp là unique
     * Input: Multiple sequential calls
     * Expected Output: Different timestamps (hoặc có thể same nếu very fast)
     * Path Coverage: Timestamp uniqueness
     */
    it('TC021: should generate current timestamp on each call', async () => {
      const result1 = await controller.getLiveness();

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result2 = await controller.getLiveness();

      expect(result1.timestamp).toBeDefined();
      expect(result2.timestamp).toBeDefined();
      // Timestamps could be same or different depending on execution speed
    });

    /**
     * Test Case 22: Kiểm tra getLiveness return structure
     * Input: N/A
     * Expected Output: Object with exactly 2 properties
     * Path Coverage: Structure validation
     */
    it('TC022: should return object with status and timestamp only', async () => {
      const result = await controller.getLiveness();

      const keys = Object.keys(result);
      expect(keys).toHaveLength(2);
      expect(keys).toContain('status');
      expect(keys).toContain('timestamp');
    });
  });

  describe('getReadiness() Method', () => {
    /**
     * Test Case 23: Kiểm tra getReadiness với healthy services
     * Input: Mock healthy overall health
     * Expected Output: { status: 'ready', timestamp, services }
     * Path Coverage: Ready branch (health.status === 'healthy')
     */
    it('TC023: should return ready status when services are healthy', async () => {
      const mockHealthData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {
          database: {
            status: 'healthy',
            responseTime: 15,
            details: {},
          },
        },
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      const result = await controller.getReadiness();

      expect(result.status).toBe('ready');
      expect(result.timestamp).toBe(mockHealthData.timestamp);
      expect(result.services).toEqual(mockHealthData.services);
    });

    /**
     * Test Case 24: Kiểm tra getReadiness với unhealthy services
     * Input: Mock unhealthy overall health
     * Expected Output: { status: 'not ready', timestamp, services }
     * Path Coverage: Not ready branch (health.status !== 'healthy')
     */
    it('TC024: should return not ready status when services are unhealthy', async () => {
      const mockHealthData = {
        status: 'unhealthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {
          database: {
            status: 'unhealthy',
            responseTime: 5000,
            details: { error: 'Connection failed' },
          },
        },
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      const result = await controller.getReadiness();

      expect(result.status).toBe('not ready');
      expect(result.timestamp).toBe(mockHealthData.timestamp);
      expect(result.services).toEqual(mockHealthData.services);
    });

    /**
     * Test Case 25: Kiểm tra getReadiness gọi service method
     * Input: N/A
     * Expected Output: getOverallHealth được gọi
     * Path Coverage: Service method invocation
     */
    it('TC025: should call healthCheckService.getOverallHealth', async () => {
      const mockHealthData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {},
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      await controller.getReadiness();

      expect(mockHealthCheckService.getOverallHealth).toHaveBeenCalledTimes(1);
      expect(mockHealthCheckService.getOverallHealth).toHaveBeenCalledWith();
    });

    /**
     * Test Case 26: Kiểm tra getReadiness với multiple services
     * Input: Mock multiple services healthy
     * Expected Output: status 'ready' with all services
     * Path Coverage: Multiple services ready
     */
    it('TC026: should include all services in ready response', async () => {
      const mockHealthData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {
          database: { status: 'healthy', responseTime: 15, details: {} },
          redis: { status: 'healthy', responseTime: 5, details: {} },
          api: { status: 'healthy', responseTime: 10, details: {} },
        },
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      const result = await controller.getReadiness();

      expect(result.status).toBe('ready');
      expect(Object.keys(result.services)).toHaveLength(3);
    });

    /**
     * Test Case 27: Kiểm tra getReadiness return structure
     * Input: Mock response
     * Expected Output: Object with status, timestamp, services
     * Path Coverage: Structure validation
     */
    it('TC027: should return object with correct structure', async () => {
      const mockHealthData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {},
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      const result = await controller.getReadiness();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('services');
    });

    /**
     * Test Case 28: Kiểm tra getReadiness status transformation
     * Input: Various health.status values
     * Expected Output: Correct ready/not ready mapping
     * Path Coverage: Status transformation logic
     */
    it('TC028: should correctly transform health status to ready status', async () => {
      // Test healthy -> ready
      const healthyData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {},
      };
      mockHealthCheckService.getOverallHealth.mockResolvedValue(healthyData);
      const readyResult = await controller.getReadiness();
      expect(readyResult.status).toBe('ready');

      // Test unhealthy -> not ready
      const unhealthyData = {
        status: 'unhealthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {},
      };
      mockHealthCheckService.getOverallHealth.mockResolvedValue(unhealthyData);
      const notReadyResult = await controller.getReadiness();
      expect(notReadyResult.status).toBe('not ready');
    });

    /**
     * Test Case 29: Kiểm tra getReadiness với degraded status
     * Input: Mock health.status = 'degraded' (any non-healthy)
     * Expected Output: status 'not ready'
     * Path Coverage: Non-healthy status handling
     */
    it('TC029: should return not ready for any non-healthy status', async () => {
      const mockHealthData = {
        status: 'degraded' as any,
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {},
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      const result = await controller.getReadiness();

      expect(result.status).toBe('not ready');
    });

    /**
     * Test Case 30: Kiểm tra getReadiness preserves timestamp
     * Input: Mock with specific timestamp
     * Expected Output: Same timestamp in response
     * Path Coverage: Timestamp preservation
     */
    it('TC030: should preserve timestamp from health check', async () => {
      const specificTimestamp = '2025-12-25T12:00:00.000Z';
      const mockHealthData = {
        status: 'healthy',
        timestamp: specificTimestamp,
        services: {},
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      const result = await controller.getReadiness();

      expect(result.timestamp).toBe(specificTimestamp);
    });
  });

  describe('Cross-Method Integration', () => {
    /**
     * Test Case 31: Kiểm tra getHealth và getReadiness sử dụng cùng service
     * Input: N/A
     * Expected Output: Both call getOverallHealth
     * Path Coverage: Service reuse
     */
    it('TC031: should reuse getOverallHealth for both getHealth and getReadiness', async () => {
      const mockHealthData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {},
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      await controller.getHealth();
      await controller.getReadiness();

      expect(mockHealthCheckService.getOverallHealth).toHaveBeenCalledTimes(2);
    });

    /**
     * Test Case 32: Kiểm tra các methods độc lập
     * Input: N/A
     * Expected Output: getLiveness không ảnh hưởng các method khác
     * Path Coverage: Method independence
     */
    it('TC032: should have independent method executions', async () => {
      await controller.getLiveness();

      expect(mockHealthCheckService.getOverallHealth).not.toHaveBeenCalled();
      expect(mockHealthCheckService.checkDatabase).not.toHaveBeenCalled();
    });

    /**
     * Test Case 33: Kiểm tra consistency giữa getHealth và getReadiness
     * Input: Same mock data
     * Expected Output: Consistent health status
     * Path Coverage: Data consistency
     */
    it('TC033: should maintain consistency between getHealth and getReadiness', async () => {
      const mockHealthData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {
          database: { status: 'healthy', responseTime: 15, details: {} },
        },
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      const healthResult = await controller.getHealth();
      const readinessResult = await controller.getReadiness();

      expect(healthResult.status).toBe('healthy');
      expect(readinessResult.status).toBe('ready');
      expect(healthResult.services).toEqual(readinessResult.services);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    /**
     * Test Case 34: Kiểm tra getHealth khi service throws error
     * Input: Mock service throws error
     * Expected Output: Error propagates
     * Path Coverage: Error handling path
     */
    it('TC034: should propagate error from getOverallHealth', async () => {
      const error = new Error('Service unavailable');
      mockHealthCheckService.getOverallHealth.mockRejectedValue(error);

      await expect(controller.getHealth()).rejects.toThrow(
        'Service unavailable',
      );
    });

    /**
     * Test Case 35: Kiểm tra getDatabaseHealth khi service throws error
     * Input: Mock checkDatabase throws error
     * Expected Output: Error propagates
     * Path Coverage: Error handling path
     */
    it('TC035: should propagate error from checkDatabase', async () => {
      const error = new Error('Database connection failed');
      mockHealthCheckService.checkDatabase.mockRejectedValue(error);

      await expect(controller.getDatabaseHealth()).rejects.toThrow(
        'Database connection failed',
      );
    });

    /**
     * Test Case 36: Kiểm tra getReadiness khi service throws error
     * Input: Mock service throws error
     * Expected Output: Error propagates
     * Path Coverage: Error handling path
     */
    it('TC036: should propagate error from getOverallHealth in readiness', async () => {
      const error = new Error('Health check failed');
      mockHealthCheckService.getOverallHealth.mockRejectedValue(error);

      await expect(controller.getReadiness()).rejects.toThrow(
        'Health check failed',
      );
    });

    /**
     * Test Case 37: Kiểm tra với null services
     * Input: Mock with null services
     * Expected Output: Handle gracefully
     * Path Coverage: Null handling
     */
    it('TC037: should handle null services in health data', async () => {
      const mockHealthData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: null as any,
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      const result = await controller.getHealth();

      expect(result.statusCode).toBe(200);
      expect(result.services).toBeNull();
    });

    /**
     * Test Case 38: Kiểm tra với undefined services
     * Input: Mock with undefined services
     * Expected Output: Handle gracefully
     * Path Coverage: Undefined handling
     */
    it('TC038: should handle undefined services in health data', async () => {
      const mockHealthData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: undefined as any,
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      const result = await controller.getHealth();

      expect(result.statusCode).toBe(200);
      expect(result.services).toBeUndefined();
    });
  });

  describe('Type Safety and Return Types', () => {
    /**
     * Test Case 39: Kiểm tra getHealth return type structure
     * Input: N/A
     * Expected Output: Correct TypeScript types
     * Path Coverage: Type validation
     */
    it('TC039: should return correct types from getHealth', async () => {
      const mockHealthData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {},
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);

      const result = await controller.getHealth();

      expect(typeof result.statusCode).toBe('number');
      expect(typeof result.status).toBe('string');
      expect(typeof result.timestamp).toBe('string');
      expect(typeof result.services).toBe('object');
    });

    /**
     * Test Case 40: Kiểm tra getLiveness return type
     * Input: N/A
     * Expected Output: Correct types
     * Path Coverage: Type validation
     */
    it('TC040: should return correct types from getLiveness', async () => {
      const result = await controller.getLiveness();

      expect(typeof result.status).toBe('string');
      expect(typeof result.timestamp).toBe('string');
    });

    /**
     * Test Case 41: Kiểm tra all methods return promises
     * Input: N/A
     * Expected Output: All methods are async
     * Path Coverage: Async validation
     */
    it('TC041: should have all methods returning promises', () => {
      const mockHealthData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {},
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(mockHealthData);
      mockHealthCheckService.checkDatabase.mockResolvedValue({
        status: 'healthy',
        responseTime: 15,
        details: {},
      });

      expect(controller.getHealth()).toBeInstanceOf(Promise);
      expect(controller.getDatabaseHealth()).toBeInstanceOf(Promise);
      expect(controller.getLiveness()).toBeInstanceOf(Promise);
      expect(controller.getReadiness()).toBeInstanceOf(Promise);
    });
  });

  describe('Business Logic Validation', () => {
    /**
     * Test Case 42: Kiểm tra status code mapping logic
     * Input: Various health statuses
     * Expected Output: Correct HTTP status codes
     * Path Coverage: Status code logic
     */
    it('TC042: should map health status to correct HTTP status code', async () => {
      // Healthy -> 200
      const healthyData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {},
      };
      mockHealthCheckService.getOverallHealth.mockResolvedValue(healthyData);
      const healthyResult = await controller.getHealth();
      expect(healthyResult.statusCode).toBe(200);

      // Unhealthy -> 503
      const unhealthyData = {
        status: 'unhealthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {},
      };
      mockHealthCheckService.getOverallHealth.mockResolvedValue(unhealthyData);
      const unhealthyResult = await controller.getHealth();
      expect(unhealthyResult.statusCode).toBe(503);
    });

    /**
     * Test Case 43: Kiểm tra ternary operator trong getHealth
     * Input: 'healthy' và non-'healthy' statuses
     * Expected Output: 200 cho healthy, 503 cho bất kỳ khác
     * Path Coverage: Ternary operator branches
     */
    it('TC043: should use ternary operator correctly for status code', async () => {
      // Test true branch (healthy)
      mockHealthCheckService.getOverallHealth.mockResolvedValue({
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {},
      });
      const trueResult = await controller.getHealth();
      expect(trueResult.statusCode).toBe(200);

      // Test false branch (any non-healthy)
      mockHealthCheckService.getOverallHealth.mockResolvedValue({
        status: 'degraded',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {},
      });
      const falseResult = await controller.getHealth();
      expect(falseResult.statusCode).toBe(503);
    });

    /**
     * Test Case 44: Kiểm tra ternary operator trong getReadiness
     * Input: 'healthy' và non-'healthy' statuses
     * Expected Output: 'ready' cho healthy, 'not ready' cho khác
     * Path Coverage: Ternary operator branches
     */
    it('TC044: should use ternary operator correctly for ready status', async () => {
      // Test true branch
      mockHealthCheckService.getOverallHealth.mockResolvedValue({
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {},
      });
      const trueResult = await controller.getReadiness();
      expect(trueResult.status).toBe('ready');

      // Test false branch
      mockHealthCheckService.getOverallHealth.mockResolvedValue({
        status: 'unhealthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {},
      });
      const falseResult = await controller.getReadiness();
      expect(falseResult.status).toBe('not ready');
    });

    /**
     * Test Case 45: Kiểm tra object spread operator
     * Input: Mock health data
     * Expected Output: Correct object spreading
     * Path Coverage: Spread operator usage
     */
    it('TC045: should spread health data correctly', async () => {
      const mockHealthData = {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: { db: { status: 'healthy' } },
        additionalField: 'test',
      };

      mockHealthCheckService.getOverallHealth.mockResolvedValue(
        mockHealthData as any,
      );

      const result = await controller.getHealth();

      // Should have statusCode + all fields from mockHealthData
      expect(result.statusCode).toBe(200);
      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBe(mockHealthData.timestamp);
      expect(result.services).toEqual(mockHealthData.services);
      expect((result as any).additionalField).toBe('test');
    });
  });
});
