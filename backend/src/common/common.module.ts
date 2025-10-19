import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

// Services
import { CacheService } from './services/cache.services';
import { EmailService } from './services/email.services';
import { NotificationService } from './services/notification.services';
import { FileUploadService } from './services/fileupload.services';
import { AnalyticsService } from './services/analytic.services';
import { HealthCheckService } from './services/healthcheck.services';

// Guards
import { AuthGuard } from './guards/auth.guards';
import { ApiKeyGuard } from './guards/apikey.guards';
import { RolesGuard } from './guards/roles.guards';
import { PermissionsGuard } from './guards/permissions.guards';
import { RateLimitGuard } from './guards/ratelimit.guards';
import { ThrottleGuard } from './guards/throttle.guards';
import { JwtAuthGuard } from './guards/jwt.auth.guard';
import { GroupAdminGuard } from './guards/group.admin.guards';
import { GroupMemberGuard } from './guards/group.member.guards';
import { MessageOwnerGuard } from './guards/message.owner.guards';

// Interceptors
import { SanitizationInterceptor } from './interceptors/sanitization.interceptors';
import { LoggingInterceptor } from './interceptors/logging.interceptors';
import { PerformanceInterceptor } from './interceptors/performance.interceptors';
import { RequestIdInterceptor } from './interceptors/request.id.interceptors';
import { ResponseTransformInterceptor } from './interceptors/response.transform.interceptors';
import { SecurityHeadersInterceptor } from './interceptors/security.headers.interceptors';
import { TimeoutInterceptor } from './interceptors/timeout.interceptors';
import { CacheInterceptor } from './interceptors/cache.interceptors';
import { CompressionInterceptor } from './interceptors/compression.interceptors';
import { RateLimitInterceptor } from './interceptors/ratelimit.interceptors';

// Filters
import { GlobalExceptionFilter } from './filters/global.exception.filters';
import { HttpExceptionFilter } from './filters/http.exception.filters';
import { DatabaseExceptionFilter } from './filters/database.exception.filters';
import { BusinessLogicExceptionFilter } from './filters/businesslogic.exception.filters';
import { RateLimitExceptionFilter } from './filters/ratelimit.exception.filters';
import { TimeoutExceptionFilter } from './filters/timeout.exception.filters';
import { ValidationExceptionFilter } from './filters/validationexception.filters';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    // Services
    CacheService,
    EmailService,
    NotificationService,
    FileUploadService,
    AnalyticsService,
    HealthCheckService,

    // Guards
    AuthGuard,
    ApiKeyGuard,
    RolesGuard,
    PermissionsGuard,
    RateLimitGuard,
    ThrottleGuard,
    JwtAuthGuard,
    GroupAdminGuard,
    GroupMemberGuard,
    MessageOwnerGuard,

    // Interceptors
    SanitizationInterceptor,
    LoggingInterceptor,
    PerformanceInterceptor,
    RequestIdInterceptor,
    ResponseTransformInterceptor,
    SecurityHeadersInterceptor,
    TimeoutInterceptor,
    CacheInterceptor,
    CompressionInterceptor,
    RateLimitInterceptor,

    // Filters
    GlobalExceptionFilter,
    HttpExceptionFilter,
    DatabaseExceptionFilter,
    BusinessLogicExceptionFilter,
    RateLimitExceptionFilter,
    TimeoutExceptionFilter,
    ValidationExceptionFilter,

    // Global providers
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SanitizationInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [
    // Services
    CacheService,
    EmailService,
    NotificationService,
    FileUploadService,
    AnalyticsService,
    HealthCheckService,

    // Guards
    AuthGuard,
    ApiKeyGuard,
    RolesGuard,
    PermissionsGuard,
    RateLimitGuard,
    ThrottleGuard,
    JwtAuthGuard,
    GroupAdminGuard,
    GroupMemberGuard,
    MessageOwnerGuard,

    // Interceptors
    SanitizationInterceptor,
    LoggingInterceptor,
    PerformanceInterceptor,
    RequestIdInterceptor,
    ResponseTransformInterceptor,
    SecurityHeadersInterceptor,
    TimeoutInterceptor,
    CacheInterceptor,
    CompressionInterceptor,
    RateLimitInterceptor,

    // Filters
    GlobalExceptionFilter,
    HttpExceptionFilter,
    DatabaseExceptionFilter,
    BusinessLogicExceptionFilter,
    RateLimitExceptionFilter,
    TimeoutExceptionFilter,
    ValidationExceptionFilter,
  ],
})
export class CommonModule {}
