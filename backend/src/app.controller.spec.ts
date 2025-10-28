import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthCheckService } from './common/services/healthcheck.services';

describe('AppController', () => {
  let appController: AppController;
  let healthCheckService: HealthCheckService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: HealthCheckService,
          useValue: {
            getOverallHealth: jest.fn().mockResolvedValue({
              status: 'healthy',
              timestamp: new Date().toISOString(),
              services: {
                database: { status: 'healthy', responseTime: 10 },
              },
            }),
            checkDatabase: jest.fn().mockResolvedValue({
              status: 'healthy',
              responseTime: 10,
              details: {
                database: 'test-db',
                readyState: 1,
              },
            }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    healthCheckService = app.get<HealthCheckService>(HealthCheckService);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('ping', () => {
    it('should return "pong"', () => {
      expect(appController.ping()).toBe('pong');
    });
  });

  describe('health', () => {
    it('should return overall health status', async () => {
      const result = await appController.health();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('status');
      expect(result.data).toHaveProperty('timestamp');
      expect(result.data).toHaveProperty('services');
    });

    it('should call healthCheckService.getOverallHealth', async () => {
      await appController.health();
      expect(healthCheckService.getOverallHealth).toHaveBeenCalled();
    });
  });

  describe('databaseHealth', () => {
    it('should return database health status', async () => {
      const result = await appController.databaseHealth();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('status');
      expect(result.data).toHaveProperty('responseTime');
    });

    it('should call healthCheckService.checkDatabase', async () => {
      await appController.databaseHealth();
      expect(healthCheckService.checkDatabase).toHaveBeenCalled();
    });
  });

});
