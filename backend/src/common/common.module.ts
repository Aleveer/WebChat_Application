import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import {
  CacheService,
  EmailService,
  NotificationService,
  FileUploadService,
  AnalyticsService,
  HealthCheckService,
} from './services/shared.services';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    CacheService,
    EmailService,
    NotificationService,
    FileUploadService,
    AnalyticsService,
    HealthCheckService,
  ],
  exports: [
    CacheService,
    EmailService,
    NotificationService,
    FileUploadService,
    AnalyticsService,
    HealthCheckService,
  ],
})
export class CommonModule {}
