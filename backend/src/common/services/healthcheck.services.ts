import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

// Health Check Service with real implementation
@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

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

  async getOverallHealth(): Promise<{
    status: string;
    timestamp: string;
    services: Record<string, any>;
  }> {
    const database = await this.checkDatabase();

    const services = { database };
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
