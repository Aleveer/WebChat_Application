import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AnalyticsEvent,
  AnalyticsEventDocument,
  EventType,
} from './schemas/analytics-event.schema';
import { CreateAnalyticsEventDto, GetAnalyticsDto } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(AnalyticsEvent.name)
    private analyticsEventModel: Model<AnalyticsEventDocument>,
  ) {}

  async trackEvent(
    createEventDto: CreateAnalyticsEventDto,
  ): Promise<AnalyticsEvent> {
    const event = new this.analyticsEventModel(createEventDto);
    return event.save();
  }

  async getUserAnalytics(
    userId: string,
    getAnalyticsDto: GetAnalyticsDto,
  ): Promise<{ events: AnalyticsEvent[]; total: number }> {
    const {
      page = 1,
      limit = 50,
      event_type,
      start_date,
      end_date,
    } = getAnalyticsDto;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      user_id: new Types.ObjectId(userId),
    };

    if (event_type) {
      filter.event_type = event_type;
    }

    if (start_date || end_date) {
      const dateFilter: Record<string, unknown> = {};
      if (start_date) {
        dateFilter.$gte = new Date(start_date);
      }
      if (end_date) {
        dateFilter.$lte = new Date(end_date);
      }
      filter.created_at = dateFilter;
    }

    const events = await this.analyticsEventModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.analyticsEventModel.countDocuments(filter);

    return { events, total };
  }

  async getSystemAnalytics(getAnalyticsDto: GetAnalyticsDto): Promise<{
    total_events: number;
    by_type: Array<{ _id: string; count: number }>;
    timeline: Array<{ date: string; count: number }>;
    event_counts?: unknown;
  }> {
    const { event_type, start_date, end_date } = getAnalyticsDto;

    const filter: Record<string, unknown> = {};

    if (event_type) {
      filter.event_type = event_type;
    }

    if (start_date || end_date) {
      const dateFilter: { $gte?: Date; $lte?: Date } = {};
      if (start_date) {
        dateFilter.$gte = new Date(start_date);
      }
      if (end_date) {
        dateFilter.$lte = new Date(end_date);
      }
      filter.created_at = dateFilter;
    }

    // Get event counts by type
    const eventCounts = await this.analyticsEventModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$event_type',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get daily activity
    const dailyActivity = await this.analyticsEventModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$created_at' },
            month: { $month: '$created_at' },
            day: { $dayOfMonth: '$created_at' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    // Get user activity
    const userActivity = await this.analyticsEventModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$user_id',
          event_count: { $sum: 1 },
          last_activity: { $max: '$created_at' },
        },
      },
      { $sort: { event_count: -1 } },
      { $limit: 10 },
    ]);

    return {
      total_events: eventCounts.reduce((sum, item) => sum + item.count, 0),
      by_type: eventCounts,
      timeline: dailyActivity,
      daily_activity: dailyActivity,
      top_users: userActivity,
    } as unknown as {
      total_events: number;
      by_type: Array<{ _id: string; count: number }>;
      timeline: Array<{ date: string; count: number }>;
      event_counts?: unknown;
    };
  }

  // Helper methods for common events
  async trackUserLogin(
    userId: string,
    metadata?: Record<string, unknown>,
  ): Promise<AnalyticsEvent> {
    return this.trackEvent({
      event_type: EventType.USER_LOGIN,
      user_id: userId,
      metadata: metadata || {},
    });
  }

  async trackUserLogout(
    userId: string,
    metadata?: Record<string, unknown>,
  ): Promise<AnalyticsEvent> {
    return this.trackEvent({
      event_type: EventType.USER_LOGOUT,
      user_id: userId,
      metadata: metadata || {},
    });
  }

  async trackMessageSent(
    userId: string,
    messageId: string,
    groupId?: string,
  ): Promise<AnalyticsEvent> {
    return this.trackEvent({
      event_type: EventType.MESSAGE_SENT,
      user_id: userId,
      metadata: {
        message_id: messageId,
        group_id: groupId,
      },
    });
  }

  async trackGroupCreated(
    userId: string,
    groupId: string,
  ): Promise<AnalyticsEvent> {
    return this.trackEvent({
      event_type: EventType.GROUP_CREATED,
      user_id: userId,
      metadata: {
        group_id: groupId,
      },
    });
  }

  async trackGroupJoined(
    userId: string,
    groupId: string,
  ): Promise<AnalyticsEvent> {
    return this.trackEvent({
      event_type: EventType.GROUP_JOINED,
      user_id: userId,
      metadata: {
        group_id: groupId,
      },
    });
  }

  async trackFileUploaded(
    userId: string,
    fileId: string,
    fileType: string,
  ): Promise<AnalyticsEvent> {
    return this.trackEvent({
      event_type: EventType.FILE_UPLOADED,
      user_id: userId,
      metadata: {
        file_id: fileId,
        file_type: fileType,
      },
    });
  }

  async getEventMetrics(
    eventType: EventType,
    timeRange?: { start: Date; end: Date },
  ): Promise<{
    total: number;
    by_date: Array<{ date: string; count: number }>;
    top_events: Array<unknown>;
  }> {
    const filter: Record<string, unknown> = { event_type: eventType };

    if (timeRange) {
      filter.created_at = {
        $gte: timeRange.start,
        $lte: timeRange.end,
      };
    }

    const metrics = await this.analyticsEventModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total_events: { $sum: 1 },
          unique_users: { $addToSet: '$user_id' },
        },
      },
      {
        $project: {
          total_events: 1,
          unique_users: { $size: '$unique_users' },
        },
      },
    ]);

    return metrics[0] || { total_events: 0, unique_users: 0 };
  }
}
