import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { HealthCheckService } from '../services/healthcheck.services';
import { Public } from '../decorators/custom.decorators';

/**
 * Health Check Controller
 * Provides endpoints for monitoring service health
 * Public endpoints - no authentication required for monitoring tools
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthCheckService: HealthCheckService) {}

  /**
   * GET /health
   * Overall health check - aggregates all service health checks
   * Returns 200 if all services healthy, 503 if any service unhealthy
   */
  @Get()
  @Public()
  @ApiOperation({ summary: 'Get overall health status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'healthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {
          database: {
            status: 'healthy',
            responseTime: 15,
            details: { database: 'webchat', readyState: 1 }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 503, 
    description: 'Service is unhealthy',
    schema: {
      example: {
        status: 'unhealthy',
        timestamp: '2025-10-28T10:00:00.000Z',
        services: {
          database: {
            status: 'unhealthy',
            responseTime: 5000,
            details: { error: 'Connection timeout' }
          }
        }
      }
    }
  })
  async getHealth() {
    const health = await this.healthCheckService.getOverallHealth();
    
    // Return 503 if any service is unhealthy
    const httpStatus = health.status === 'healthy' ? 200 : 503;
    
    return {
      statusCode: httpStatus,
      ...health,
    };
  }

  /**
   * GET /health/database
   * Database health check only
   */
  @Get('database')
  @Public()
  @ApiOperation({ summary: 'Get database health status' })
  @ApiResponse({ status: 200, description: 'Database health check result' })
  async getDatabaseHealth() {
    const health = await this.healthCheckService.checkDatabase();
    return {
      component: 'database',
      ...health,
    };
  }

  /**
   * GET /health/live
   * Liveness probe - is the application running?
   * For Kubernetes liveness probe
   */
  @Get('live')
  @Public()
  @ApiExcludeEndpoint()
  async getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /health/ready
   * Readiness probe - is the application ready to accept traffic?
   * For Kubernetes readiness probe
   */
  @Get('ready')
  @Public()
  @ApiExcludeEndpoint()
  async getReadiness() {
    const health = await this.healthCheckService.getOverallHealth();
    
    return {
      status: health.status === 'healthy' ? 'ready' : 'not ready',
      timestamp: health.timestamp,
      services: health.services,
    };
  }
}
