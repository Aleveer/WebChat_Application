import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly events = new Map<string, any[]>();

  trackEvent(eventName: string, properties: any = {}): void {
    const event = {
      name: eventName,
      properties,
      timestamp: new Date().toISOString(),
    };

    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    this.events.get(eventName)!.push(event);
    this.logger.log(`Event tracked: ${eventName}`);
  }

  trackUserAction(userId: string, action: string, properties: any = {}): void {
    this.trackEvent('user_action', {
      userId,
      action,
      ...properties,
    });
  }

  trackMessageSent(
    senderId: string,
    receiverType: string,
    receiverId: string,
  ): void {
    this.trackEvent('message_sent', {
      senderId,
      receiverType,
      receiverId,
    });
  }

  trackGroupCreated(
    creatorId: string,
    groupId: string,
    memberCount: number,
  ): void {
    this.trackEvent('group_created', {
      creatorId,
      groupId,
      memberCount,
    });
  }

  getEventStats(eventName: string): { count: number; lastEvent: any } {
    const events = this.events.get(eventName) || [];
    return {
      count: events.length,
      lastEvent: events[events.length - 1] || null,
    };
  }

  // Clean old events daily
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  cleanOldEvents(): void {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const [eventName, events] of this.events.entries()) {
      const filteredEvents = events.filter(
        (event) => new Date(event.timestamp) > oneWeekAgo,
      );
      this.events.set(eventName, filteredEvents);
    }

    this.logger.log('Cleaned old analytics events');
  }
}
