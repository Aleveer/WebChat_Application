import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsMetricsService } from './analytics.metrics.service';
import {
  AnalyticsEvent,
  AnalyticsEventSchema,
} from './schemas/analytics-event.schema';
import { UsersModule } from '../users/users.module';
import { GroupsModule } from '../groups/groups.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnalyticsEvent.name, schema: AnalyticsEventSchema },
    ]),
    UsersModule,
    GroupsModule,
    MessagesModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsMetricsService],
  exports: [AnalyticsService, AnalyticsMetricsService],
})
export class AnalyticsModule {}
