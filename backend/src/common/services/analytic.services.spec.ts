import { AnalyticsService } from './analytic.services';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let loggerLogMock: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsService],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    loggerLogMock = jest
      .spyOn((service as any)['logger'] as Logger, 'log')
      .mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should track a new event with properties', () => {
      const eventName = 'test_event';
      const properties = { key: 'value', count: 123 };

      service.trackEvent(eventName, properties);

      const stats = service.getEventStats(eventName);
      expect(stats.count).toBe(1);
      expect(stats.lastEvent).toMatchObject({
        name: eventName,
        properties,
      });
      expect(stats.lastEvent.timestamp).toBeDefined();
      expect(loggerLogMock).toHaveBeenCalledWith(`Event tracked: ${eventName}`);
    });

    it('should track event without properties (default empty object)', () => {
      const eventName = 'simple_event';

      service.trackEvent(eventName);

      const stats = service.getEventStats(eventName);
      expect(stats.count).toBe(1);
      expect(stats.lastEvent.properties).toEqual({});
    });

    it('should track multiple events with same name', () => {
      const eventName = 'repeated_event';

      service.trackEvent(eventName, { attempt: 1 });
      service.trackEvent(eventName, { attempt: 2 });
      service.trackEvent(eventName, { attempt: 3 });

      const stats = service.getEventStats(eventName);
      expect(stats.count).toBe(3);
      expect(stats.lastEvent.properties.attempt).toBe(3);
    });

    it('should track different event types independently', () => {
      service.trackEvent('event_type_A', { data: 'A' });
      service.trackEvent('event_type_B', { data: 'B' });
      service.trackEvent('event_type_A', { data: 'A2' });

      const statsA = service.getEventStats('event_type_A');
      const statsB = service.getEventStats('event_type_B');

      expect(statsA.count).toBe(2);
      expect(statsB.count).toBe(1);
    });

    it('should create ISO timestamp for tracked event', () => {
      const beforeTime = new Date().toISOString();
      service.trackEvent('time_test');
      const afterTime = new Date().toISOString();

      const stats = service.getEventStats('time_test');
      expect(stats.lastEvent.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(stats.lastEvent.timestamp >= beforeTime).toBe(true);
      expect(stats.lastEvent.timestamp <= afterTime).toBe(true);
    });

    it('should track event with complex nested properties', () => {
      const eventName = 'complex_event';
      const properties = {
        user: {
          id: 123,
          name: 'John',
        },
        metadata: {
          tags: ['tag1', 'tag2'],
          settings: {
            enabled: true,
          },
        },
      };

      service.trackEvent(eventName, properties);

      const stats = service.getEventStats(eventName);
      expect(stats.lastEvent.properties).toEqual(properties);
    });

    it('should track event with null properties', () => {
      const eventName = 'null_props_event';

      service.trackEvent(eventName, null);

      const stats = service.getEventStats(eventName);
      expect(stats.count).toBe(1);
      expect(stats.lastEvent.properties).toBeNull();
    });

    it('should track event with undefined properties (uses default empty object)', () => {
      const eventName = 'undefined_props_event';

      service.trackEvent(eventName, undefined);

      const stats = service.getEventStats(eventName);
      expect(stats.count).toBe(1);
      expect(stats.lastEvent.properties).toEqual({});
    });
  });

  describe('trackUserAction', () => {
    it('should track user action with userId and action', () => {
      const userId = 'user-123';
      const action = 'login';
      const properties = { ip: '192.168.1.1' };

      service.trackUserAction(userId, action, properties);

      const stats = service.getEventStats('user_action');
      expect(stats.count).toBe(1);
      expect(stats.lastEvent.properties).toMatchObject({
        userId,
        action,
        ip: '192.168.1.1',
      });
      expect(loggerLogMock).toHaveBeenCalledWith('Event tracked: user_action');
    });

    it('should track user action without additional properties', () => {
      const userId = 'user-456';
      const action = 'logout';

      service.trackUserAction(userId, action);

      const stats = service.getEventStats('user_action');
      expect(stats.count).toBe(1);
      expect(stats.lastEvent.properties).toMatchObject({
        userId,
        action,
      });
    });

    it('should track multiple user actions', () => {
      service.trackUserAction('user-1', 'login');
      service.trackUserAction('user-2', 'signup');
      service.trackUserAction('user-1', 'logout');

      const stats = service.getEventStats('user_action');
      expect(stats.count).toBe(3);
    });

    it('should merge additional properties with userId and action', () => {
      const userId = 'user-789';
      const action = 'profile_update';
      const properties = {
        field: 'email',
        oldValue: 'old@example.com',
        newValue: 'new@example.com',
      };

      service.trackUserAction(userId, action, properties);

      const stats = service.getEventStats('user_action');
      expect(stats.lastEvent.properties).toEqual({
        userId,
        action,
        field: 'email',
        oldValue: 'old@example.com',
        newValue: 'new@example.com',
      });
    });
  });

  describe('trackMessageSent', () => {
    it('should track message sent to individual user', () => {
      const senderId = 'sender-123';
      const receiverType = 'user';
      const receiverId = 'receiver-456';

      service.trackMessageSent(senderId, receiverType, receiverId);

      const stats = service.getEventStats('message_sent');
      expect(stats.count).toBe(1);
      expect(stats.lastEvent.properties).toEqual({
        senderId,
        receiverType,
        receiverId,
      });
      expect(loggerLogMock).toHaveBeenCalledWith('Event tracked: message_sent');
    });

    it('should track message sent to group', () => {
      const senderId = 'sender-789';
      const receiverType = 'group';
      const receiverId = 'group-001';

      service.trackMessageSent(senderId, receiverType, receiverId);

      const stats = service.getEventStats('message_sent');
      expect(stats.count).toBe(1);
      expect(stats.lastEvent.properties).toMatchObject({
        senderId,
        receiverType,
        receiverId,
      });
    });

    it('should track multiple messages sent', () => {
      service.trackMessageSent('user-1', 'user', 'user-2');
      service.trackMessageSent('user-1', 'user', 'user-3');
      service.trackMessageSent('user-2', 'group', 'group-1');

      const stats = service.getEventStats('message_sent');
      expect(stats.count).toBe(3);
    });
  });

  describe('trackGroupCreated', () => {
    it('should track group creation with creator and member count', () => {
      const creatorId = 'creator-123';
      const groupId = 'group-456';
      const memberCount = 5;

      service.trackGroupCreated(creatorId, groupId, memberCount);

      const stats = service.getEventStats('group_created');
      expect(stats.count).toBe(1);
      expect(stats.lastEvent.properties).toEqual({
        creatorId,
        groupId,
        memberCount,
      });
      expect(loggerLogMock).toHaveBeenCalledWith(
        'Event tracked: group_created',
      );
    });

    it('should track group creation with zero members', () => {
      const creatorId = 'creator-789';
      const groupId = 'group-001';
      const memberCount = 0;

      service.trackGroupCreated(creatorId, groupId, memberCount);

      const stats = service.getEventStats('group_created');
      expect(stats.lastEvent.properties.memberCount).toBe(0);
    });

    it('should track multiple group creations', () => {
      service.trackGroupCreated('user-1', 'group-1', 3);
      service.trackGroupCreated('user-2', 'group-2', 10);
      service.trackGroupCreated('user-1', 'group-3', 2);

      const stats = service.getEventStats('group_created');
      expect(stats.count).toBe(3);
    });
  });

  describe('getEventStats', () => {
    it('should return stats for existing event', () => {
      service.trackEvent('test_stats', { value: 1 });
      service.trackEvent('test_stats', { value: 2 });

      const stats = service.getEventStats('test_stats');

      expect(stats.count).toBe(2);
      expect(stats.lastEvent.properties.value).toBe(2);
    });

    it('should return zero count and null lastEvent for non-existent event', () => {
      const stats = service.getEventStats('non_existent_event');

      expect(stats.count).toBe(0);
      expect(stats.lastEvent).toBeNull();
    });

    it('should return correct last event after multiple tracks', () => {
      service.trackEvent('sequential_event', { sequence: 1 });
      service.trackEvent('sequential_event', { sequence: 2 });
      service.trackEvent('sequential_event', { sequence: 3 });

      const stats = service.getEventStats('sequential_event');

      expect(stats.count).toBe(3);
      expect(stats.lastEvent.properties.sequence).toBe(3);
    });

    it('should not affect other events when querying stats', () => {
      service.trackEvent('event_A', { data: 'A' });
      service.trackEvent('event_B', { data: 'B' });

      const statsA = service.getEventStats('event_A');
      const statsB = service.getEventStats('event_B');

      expect(statsA.count).toBe(1);
      expect(statsB.count).toBe(1);
      expect(statsA.lastEvent.properties.data).toBe('A');
      expect(statsB.lastEvent.properties.data).toBe('B');
    });
  });

  describe('cleanOldEvents', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should remove events older than one week', () => {
      const now = new Date('2025-10-27T12:00:00.000Z');
      jest.setSystemTime(now);

      // Track recent event (today)
      service.trackEvent('recent_event', { data: 'recent' });

      // Manually add old event (10 days ago)
      const oldTimestamp = new Date(
        now.getTime() - 10 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const eventsMap = (service as any).events;
      eventsMap.set('old_event', [
        {
          name: 'old_event',
          properties: { data: 'old' },
          timestamp: oldTimestamp,
        },
      ]);

      service.cleanOldEvents();

      const recentStats = service.getEventStats('recent_event');
      const oldStats = service.getEventStats('old_event');

      expect(recentStats.count).toBe(1);
      expect(oldStats.count).toBe(0);
      expect(loggerLogMock).toHaveBeenCalledWith(
        'Cleaned old analytics events',
      );
    });

    it('should keep events exactly one week old', () => {
      const now = new Date('2025-10-27T12:00:00.000Z');
      jest.setSystemTime(now);

      // Add event exactly 7 days ago
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const exactlyOneWeekTimestamp = new Date(
        sevenDaysAgo.getTime() + 1000,
      ).toISOString();

      const eventsMap = (service as any).events;
      eventsMap.set('week_old_event', [
        {
          name: 'week_old_event',
          properties: { data: 'week_old' },
          timestamp: exactlyOneWeekTimestamp,
        },
      ]);

      service.cleanOldEvents();

      const stats = service.getEventStats('week_old_event');
      expect(stats.count).toBe(1);
    });

    it('should remove old events from multiple event types', () => {
      const now = new Date('2025-10-27T12:00:00.000Z');
      jest.setSystemTime(now);

      // Add recent events
      service.trackEvent('event_type_1', { recent: true });
      service.trackEvent('event_type_2', { recent: true });

      // Add old events
      const oldTimestamp = new Date(
        now.getTime() - 10 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const eventsMap = (service as any).events;

      const event1Events = eventsMap.get('event_type_1') || [];
      event1Events.push({
        name: 'event_type_1',
        properties: { recent: false },
        timestamp: oldTimestamp,
      });
      eventsMap.set('event_type_1', event1Events);

      const event2Events = eventsMap.get('event_type_2') || [];
      event2Events.push({
        name: 'event_type_2',
        properties: { recent: false },
        timestamp: oldTimestamp,
      });
      eventsMap.set('event_type_2', event2Events);

      service.cleanOldEvents();

      const stats1 = service.getEventStats('event_type_1');
      const stats2 = service.getEventStats('event_type_2');

      expect(stats1.count).toBe(1);
      expect(stats2.count).toBe(1);
      expect(stats1.lastEvent.properties.recent).toBe(true);
      expect(stats2.lastEvent.properties.recent).toBe(true);
    });

    it('should keep mix of old and new events correctly', () => {
      const now = new Date('2025-10-27T12:00:00.000Z');
      jest.setSystemTime(now);

      const eventsMap = (service as any).events;
      const mixedEvents = [
        {
          name: 'mixed_event',
          properties: { day: 1 },
          timestamp: new Date(
            now.getTime() - 1 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          name: 'mixed_event',
          properties: { day: 5 },
          timestamp: new Date(
            now.getTime() - 5 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          name: 'mixed_event',
          properties: { day: 10 },
          timestamp: new Date(
            now.getTime() - 10 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          name: 'mixed_event',
          properties: { day: 0 },
          timestamp: now.toISOString(),
        },
      ];

      eventsMap.set('mixed_event', mixedEvents);

      service.cleanOldEvents();

      const stats = service.getEventStats('mixed_event');
      expect(stats.count).toBe(3); // Day 1, 5, and 0 should remain
    });

    it('should handle empty events map', () => {
      expect(() => service.cleanOldEvents()).not.toThrow();
      expect(loggerLogMock).toHaveBeenCalledWith(
        'Cleaned old analytics events',
      );
    });

    it('should handle event type with no events after filtering', () => {
      const now = new Date('2025-10-27T12:00:00.000Z');
      jest.setSystemTime(now);

      const oldTimestamp = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const eventsMap = (service as any).events;
      eventsMap.set('very_old_event', [
        {
          name: 'very_old_event',
          properties: { data: 'ancient' },
          timestamp: oldTimestamp,
        },
      ]);

      service.cleanOldEvents();

      const stats = service.getEventStats('very_old_event');
      expect(stats.count).toBe(0);
      expect(stats.lastEvent).toBeNull();
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle rapid successive event tracking', () => {
      for (let i = 0; i < 100; i++) {
        service.trackEvent('rapid_event', { index: i });
      }

      const stats = service.getEventStats('rapid_event');
      expect(stats.count).toBe(100);
      expect(stats.lastEvent.properties.index).toBe(99);
    });

    it('should maintain event order in chronological sequence', () => {
      service.trackEvent('ordered_event', { order: 1 });
      service.trackEvent('ordered_event', { order: 2 });
      service.trackEvent('ordered_event', { order: 3 });

      const eventsMap = (service as any).events;
      const events = eventsMap.get('ordered_event');

      expect(events[0].properties.order).toBe(1);
      expect(events[1].properties.order).toBe(2);
      expect(events[2].properties.order).toBe(3);
    });

    it('should handle special characters in event names', () => {
      const specialEventName = 'event:with-special_characters.123';
      service.trackEvent(specialEventName, { test: true });

      const stats = service.getEventStats(specialEventName);
      expect(stats.count).toBe(1);
    });

    it('should handle empty string event name', () => {
      service.trackEvent('', { data: 'empty name' });

      const stats = service.getEventStats('');
      expect(stats.count).toBe(1);
    });
  });
});
