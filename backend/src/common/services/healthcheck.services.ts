import { Injectable, Logger } from '@nestjs/common';

// Health Check Service
@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);

  async checkDatabase(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();

    try {
      // Mock database check - replace with actual database health check
      await new Promise((resolve) => setTimeout(resolve, 10));

      const responseTime = Date.now() - startTime;
      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime,
      };
    }
  }

  async checkRedis(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();

    try {
      //TODO: Mock Redis check - replace with actual Redis health check
      await new Promise((resolve) => setTimeout(resolve, 5));

      const responseTime = Date.now() - startTime;
      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Redis health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime,
      };
    }
  }

  async getOverallHealth(): Promise<{
    status: string;
    timestamp: string;
    services: Record<string, any>;
  }> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const services = { database, redis };
    const allHealthy = Object.values(services).every(
      (service) => service.status === 'healthy',
    );

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services,
    };
  }
}
