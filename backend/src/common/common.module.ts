/**
 * CommonModule v2.1 - With Configurable Options
 *
 * Comprehensive module that provides shared functionality across the application:
 * - Services: Cache, Email, Notifications, File Upload, Analytics, Health Check, Metrics
 * - Guards: Authentication, Authorization, Rate Limiting
 * - Interceptors: Logging, Performance, Sanitization, Caching, Security
 * - Filters: Exception handling for different error types
 * - Controllers: Metrics, Health Check, and monitoring endpoints
 * - Utils: Utility functions for common operations
 * - Modules can now opt-in/out of specific features
 *
 * @module CommonModule
 * @version 2.1
 */

import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import type { CommonModuleOptions } from './config/common-module.config';
import { DEFAULT_COMMON_MODULE_OPTIONS } from './config/common-module.config';

import { MetricsController } from './controllers/metrics.controller';
import { HealthController } from './controllers/health.controller';

import { CacheService } from './services/cache.services';
import { EmailService } from './services/email.services';
import { NotificationService } from './services/notification.services';
import { FileUploadService } from './services/fileupload.services';
import { AnalyticsService } from './services/analytic.services';
import { HealthCheckService } from './services/healthcheck.services';
import { MetricsService } from './services/metrics.services';

import { AuthGuard } from './guards/auth.guards';
import { ApiKeyGuard } from './guards/apikey.guards';
import { RolesGuard } from './guards/roles.guards';
import { PermissionsGuard } from './guards/permissions.guards';
import { ThrottleGuard } from './guards/throttle.guards';
import { JwtAuthGuard } from './guards/jwt.auth.guard';
import { GroupAdminGuard } from './guards/group.admin.guards';
import { GroupMemberGuard } from './guards/group.member.guards';
import { MessageOwnerGuard } from './guards/message.owner.guards';

import { SanitizationInterceptor } from './interceptors/sanitization.interceptors';
import { LoggingInterceptor } from './interceptors/logging.interceptors';
import { PerformanceInterceptor } from './interceptors/performance.interceptors';
import { RequestIdInterceptor } from './interceptors/request.id.interceptors';
import { ResponseTransformInterceptor } from './interceptors/response.transform.interceptors';
import { TimeoutInterceptor } from './interceptors/timeout.interceptors';
import { CacheInterceptor } from './interceptors/cache.interceptors';
import { MetricsInterceptor } from './interceptors/metrics.interceptors';

import { GlobalExceptionFilter } from './filters/global.exception.filters';
import { HttpExceptionFilter } from './filters/http.exception.filters';
import { DatabaseExceptionFilter } from './filters/database.exception.filters';
import { BusinessLogicExceptionFilter } from './filters/businesslogic.exception.filters';
import { RateLimitExceptionFilter } from './filters/ratelimit.exception.filters';
import { TimeoutExceptionFilter } from './filters/timeout.exception.filters';
import { ValidationExceptionFilter } from './filters/validationexception.filters';

@Module({})
export class CommonModule {
  /**
   * Configure CommonModule with custom options
   *
   * @param options Configuration options
   * @returns Configured module
   *
   * @example
   * CommonModule.forRoot()
   *
   * @example
   * CommonModule.forRoot({ enableGlobalInterceptors: false })
   *
   * @example
   * CommonModule.forRoot({
   *   interceptors: {
   *     logging: true,
   *     metrics: true,
   *     requestId: true,
   *   }
   * })
   */
  static forRoot(options?: CommonModuleOptions): DynamicModule {
    const config = { ...DEFAULT_COMMON_MODULE_OPTIONS, ...options };

    const providers: Provider[] = [
      CacheService,
      EmailService,
      NotificationService,
      FileUploadService,
      AnalyticsService,
      HealthCheckService,
      MetricsService,

      AuthGuard,
      ApiKeyGuard,
      RolesGuard,
      PermissionsGuard,
      ThrottleGuard,
      JwtAuthGuard,
      GroupAdminGuard,
      GroupMemberGuard,
      MessageOwnerGuard,

      SanitizationInterceptor,
      LoggingInterceptor,
      PerformanceInterceptor,
      RequestIdInterceptor,
      ResponseTransformInterceptor,
      TimeoutInterceptor,
      CacheInterceptor,
      MetricsInterceptor,

      GlobalExceptionFilter,
      HttpExceptionFilter,
      DatabaseExceptionFilter,
      BusinessLogicExceptionFilter,
      RateLimitExceptionFilter,
      TimeoutExceptionFilter,
      ValidationExceptionFilter,
    ];

    if (config.enableGlobalInterceptors) {
      if (config.interceptors?.requestId !== false) {
        providers.push({
          provide: APP_INTERCEPTOR,
          useClass: RequestIdInterceptor,
        });
      }

      if (config.interceptors?.sanitization !== false) {
        providers.push({
          provide: APP_INTERCEPTOR,
          useClass: SanitizationInterceptor,
        });
      }

      if (config.interceptors?.logging !== false) {
        providers.push({
          provide: APP_INTERCEPTOR,
          useClass: LoggingInterceptor,
        });
      }

      if (config.interceptors?.metrics !== false) {
        providers.push({
          provide: APP_INTERCEPTOR,
          useClass: MetricsInterceptor,
        });
      }

      if (config.interceptors?.performance !== false) {
        providers.push({
          provide: APP_INTERCEPTOR,
          useClass: PerformanceInterceptor,
        });
      }
    }

    if (config.enableGlobalGuards) {
      providers.push({
        provide: APP_GUARD,
        useClass: JwtAuthGuard,
      });
    }

    if (config.enableGlobalFilters) {
      providers.push({
        provide: APP_FILTER,
        useClass: GlobalExceptionFilter,
      });
    }

    return {
      module: CommonModule,
      imports: [ScheduleModule.forRoot()],
      controllers: [MetricsController, HealthController],
      providers,
      exports: [
        CacheService,
        EmailService,
        NotificationService,
        FileUploadService,
        AnalyticsService,
        HealthCheckService,
        MetricsService,
        AuthGuard,
        ApiKeyGuard,
        RolesGuard,
        PermissionsGuard,
        ThrottleGuard,
        JwtAuthGuard,
        GroupAdminGuard,
        GroupMemberGuard,
        MessageOwnerGuard,
        SanitizationInterceptor,
        LoggingInterceptor,
        PerformanceInterceptor,
        RequestIdInterceptor,
        ResponseTransformInterceptor,
        TimeoutInterceptor,
        CacheInterceptor,
        MetricsInterceptor,
        GlobalExceptionFilter,
        HttpExceptionFilter,
        DatabaseExceptionFilter,
        BusinessLogicExceptionFilter,
        RateLimitExceptionFilter,
        TimeoutExceptionFilter,
        ValidationExceptionFilter,
      ],
    };
  }
}
