import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheckService } from './common/services/healthcheck.services';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly healthCheckService: HealthCheckService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Application is running' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('ping')
  @ApiOperation({ summary: 'Ping endpoint' })
  @ApiResponse({ status: 200, description: 'Server is responding' })
  ping(): string {
    return this.appService.getPing();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'System health status' })
  async health() {
    const health = await this.healthCheckService.getOverallHealth();
    return {
      success: true,
      data: health,
    };
  }

  @Get('health/database')
  @ApiOperation({ summary: 'Database health check' })
  async databaseHealth() {
    const health = await this.healthCheckService.checkDatabase();
    return {
      success: true,
      data: health,
    };
  }
}
