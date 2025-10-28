import { Injectable } from '@nestjs/common';
import { MetricsService } from '../../common/services/metrics.services';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AnalyticsEvent,
  AnalyticsEventDocument,
  EventType,
} from './schemas/analytics-event.schema';
import { Types } from 'mongoose';

@Injectable()
export class AnalyticsMetricsService {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly configService: ConfigService,
    @InjectModel(AnalyticsEvent.name)
    private analyticsEventModel: Model<AnalyticsEventDocument>,
  ) {}

  async getMetricsSnapshot(): Promise<{
    timestamp: string;
    events: {
      total: number;
      last24h: number;
      lastWeek: number;
    };
    topEvents: Array<{ event_type: string; count: number }>;
    recentActivity: Array<{
      event_type: string;
      count: number;
      timestamp: Date;
    }>;
  }> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      last24hEvents,
      lastWeekEvents,
      topEvents,
      recentActivity,
    ] = await Promise.all([
      this.analyticsEventModel.countDocuments(),
      this.analyticsEventModel.countDocuments({ createdAt: { $gte: last24h } }),
      this.analyticsEventModel.countDocuments({
        createdAt: { $gte: lastWeek },
      }),
      this.analyticsEventModel.aggregate([
        { $group: { _id: '$event_type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      this.analyticsEventModel.aggregate([
        { $match: { createdAt: { $gte: last24h } } },
        {
          $group: {
            _id: { event_type: '$event_type', hour: { $hour: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.hour': -1 } },
        { $limit: 24 },
      ]),
    ]);

    return {
      timestamp: now.toISOString(),
      events: {
        total: totalEvents,
        last24h: last24hEvents,
        lastWeek: lastWeekEvents,
      },
      topEvents: topEvents.map((item) => ({
        event_type: item._id,
        count: item.count,
      })),
      recentActivity: recentActivity.map((item) => ({
        event_type: item._id.event_type,
        count: item.count,
        timestamp: new Date(item._id.hour),
      })),
    };
  }

  async getEventMetrics(eventType: EventType): Promise<{
    total: number;
    last24h: number;
    last7d: number;
    rate: number; // events per hour
  }> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, last24hCount, last7dCount] = await Promise.all([
      this.analyticsEventModel.countDocuments({ event_type: eventType }),
      this.analyticsEventModel.countDocuments({
        event_type: eventType,
        createdAt: { $gte: last24h },
      }),
      this.analyticsEventModel.countDocuments({
        event_type: eventType,
        createdAt: { $gte: last7d },
      }),
    ]);

    return {
      total,
      last24h: last24hCount,
      last7d: last7dCount,
      rate: last7dCount / 168, // events per hour over last 7 days
    };
  }
}
