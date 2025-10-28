import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CacheService } from './cache.services';

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly cacheService: CacheService,
  ) {}

  async checkDatabase(): Promise<{
    status: string;
    responseTime: number;
    details?: any;
  }> {
    const startTime = Date.now();

    try {
      // Ping the database
      await this.connection.db.admin().ping();

      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        details: {
          database: this.connection.name,
          readyState: this.connection.readyState,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      this.logger.error('Database health check failed:', error);

      return {
        status: 'unhealthy',
        responseTime,
        details: {
          error: error.message,
          database: this.connection.name,
          readyState: this.connection.readyState,
        },
      };
    }
  }

  async checkCache(): Promise<{
    status: string;
    responseTime: number;
    details?: any;
  }> {
    const startTime = Date.now();

    try {
      const testKey = 'health_check_test';
      const testValue = 'test_value';

      // Test cache write
      await this.cacheService.set(testKey, testValue, 10);

      // Test cache read
      const cachedValue = await this.cacheService.get(testKey);

      // Test cache exists
      const exists = await this.cacheService.has(testKey);

      // Test cache delete
      await this.cacheService.delete(testKey);

      const responseTime = Date.now() - startTime;

      // Verify cache operations worked correctly
      const isHealthy = cachedValue === testValue && exists === true;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        details: {
          operations: {
            set: true,
            get: cachedValue === testValue,
            has: exists,
            delete: true,
          },
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      this.logger.error('Cache health check failed:', error);

      return {
        status: 'unhealthy',
        responseTime,
        details: {
          error: error.message,
        },
      };
    }
  }

  async getOverallHealth(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    memory: NodeJS.MemoryUsage;
    services: Record<string, any>;
  }> {
    // Include database and system metrics
    const database = await this.checkDatabase();

    const services = {
      database: await this.checkDatabase(),
      cache: await this.checkCache(),
    };

    const allHealthy = Object.values(services).every(
      (service) => service.status === 'healthy',
    );

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services,
    };
  }
}
