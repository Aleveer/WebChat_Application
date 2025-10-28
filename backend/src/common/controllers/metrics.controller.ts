import {
  Controller,
  Get,
  UseGuards,
  Request,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { Roles } from '../decorators/custom.decorators';
import { MetricsService, MetricsCounter } from '../services/metrics.services';

@ApiTags('Metrics')
@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  private readonly logger = new Logger(MetricsController.name);

  constructor(
    private readonly metricsService: MetricsService,
    @Optional()
    @Inject('ANALYTICS_METRICS_SERVICE')
    private readonly analyticsMetricsService?: any,
  ) {}

  @Get()
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all metrics' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getMetrics(@Request() req) {
    const { counters, histograms } = this.metricsService.getSummary();

    return {
      success: true,
      data: {
        counters,
        histograms,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('analytics')
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get analytics metrics' })
  @ApiResponse({ status: 200, description: 'Analytics metrics retrieved' })
  async getAnalyticsMetrics() {
    if (!this.analyticsMetricsService) {
      return {
        success: false,
        message: 'Analytics metrics service not available',
        data: null,
      };
    }

    const metrics = await this.analyticsMetricsService.getMetricsSnapshot();

    return {
      success: true,
      data: metrics,
    };
  }

  @Get('counters')
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all counters' })
  async getCounters() {
    const counters = this.metricsService.getAllCounters();

    return {
      success: true,
      data: counters,
    };
  }

  @Get('histograms')
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all histograms' })
  async getHistograms() {
    const histograms = this.metricsService.getAllHistograms();

    return {
      success: true,
      data: histograms,
    };
  }

  // Prometheus-compatible endpoint (without auth for monitoring tools)
  @Get('prometheus')
  @ApiExcludeEndpoint()
  async getPrometheusMetrics() {
    const { counters, histograms } = this.metricsService.getSummary();

    const lines: string[] = [];

    const sanitizeMetricName = (name: string): string => {
      // Prometheus metric names must match [a-zA-Z_:][a-zA-Z0-9_:]*
      let sanitized = name.replace(/[^a-zA-Z0-9_:]/g, '_');

      // Must start with letter, underscore, or colon
      if (!/^[a-zA-Z_:]/.test(sanitized)) {
        sanitized = '_' + sanitized;
      }

      // Validate final name
      if (!/^[a-zA-Z_:][a-zA-Z0-9_:]*$/.test(sanitized)) {
        this.logger.warn(
          `Invalid metric name: ${name}, sanitized to: ${sanitized}`,
        );
      }

      return sanitized;
    };

    // Export counters
    for (const [name, value] of Object.entries(counters)) {
      const sanitizedName = sanitizeMetricName(name);
      lines.push(`# HELP ${sanitizedName} ${name}`);
      lines.push(`# TYPE ${sanitizedName} counter`);
      lines.push(`${sanitizedName} ${value}`);
    }

    // Filter out null histograms BEFORE iteration
    const validHistograms = Object.entries(histograms).filter(
      ([_, stats]) => stats !== null,
    );

    // Export histograms
    for (const [name, stats] of validHistograms) {
      const sanitizedName = sanitizeMetricName(name);
      lines.push(`# HELP ${sanitizedName} ${name}`);
      lines.push(`# TYPE ${sanitizedName} histogram`);
      lines.push(`${sanitizedName}_count ${stats.count}`);
      lines.push(`${sanitizedName}_sum ${stats.avg * stats.count}`);
      lines.push(`${sanitizedName}_avg ${stats.avg}`);
      lines.push(`${sanitizedName}_min ${stats.min}`);
      lines.push(`${sanitizedName}_max ${stats.max}`);
      lines.push(`${sanitizedName}_p50 ${stats.p50}`);
      lines.push(`${sanitizedName}_p95 ${stats.p95}`);
      lines.push(`${sanitizedName}_p99 ${stats.p99}`);
    }

    return lines.join('\n');
  }

  @Get('reset')
  @Roles('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reset all metrics (admin only)' })
  async resetMetrics() {
    this.metricsService.reset();

    return {
      success: true,
      message: 'Metrics reset successfully',
    };
  }
}
