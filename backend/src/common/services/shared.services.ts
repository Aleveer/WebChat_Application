import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

// Cache Service
@Injectable()
export class CacheService {
  private readonly cache = new Map<string, { data: any; expiry: number }>();
  private readonly logger = new Logger(CacheService.name);

  set(key: string, data: any, ttl: number = 3600000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
  }

  get(key: string): any {
    const cached = this.cache.get(key);
    if (!cached || cached.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached || cached.expiry < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  // Clean expired entries every hour
  @Cron(CronExpression.EVERY_HOUR)
  cleanExpiredEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache.entries()) {
      if (value.expiry < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`Cleaned ${cleaned} expired cache entries`);
    }
  }
}

// Email Service (Mock implementation)
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendEmail(
    to: string,
    subject: string,
    content: string,
  ): Promise<boolean> {
    try {
      // Mock email sending - replace with actual email service
      this.logger.log(`Sending email to ${to}: ${subject}`);

      // Simulate email sending delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
  ): Promise<boolean> {
    const subject = 'Welcome to WebChat!';
    const content = `
      <h1>Welcome ${userName}!</h1>
      <p>Thank you for joining WebChat. You can now start chatting with your friends!</p>
    `;

    return this.sendEmail(userEmail, subject, content);
  }

  async sendPasswordResetEmail(
    userEmail: string,
    resetToken: string,
  ): Promise<boolean> {
    const subject = 'Password Reset Request';
    const content = `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
    `;

    return this.sendEmail(userEmail, subject, content);
  }
}

// Notification Service
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async sendNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info',
  ): Promise<boolean> {
    try {
      // Mock notification sending - replace with actual notification service
      this.logger.log(`Sending notification to user ${userId}: ${title}`);

      // Here you would integrate with push notification services
      // like Firebase Cloud Messaging, Apple Push Notification Service, etc.

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send notification to user ${userId}:`,
        error,
      );
      return false;
    }
  }

  async sendMessageNotification(
    userId: string,
    senderName: string,
    messagePreview: string,
  ): Promise<boolean> {
    return this.sendNotification(
      userId,
      `New message from ${senderName}`,
      messagePreview,
      'info',
    );
  }

  async sendGroupNotification(
    userId: string,
    groupName: string,
    messagePreview: string,
  ): Promise<boolean> {
    return this.sendNotification(
      userId,
      `New message in ${groupName}`,
      messagePreview,
      'info',
    );
  }
}

// File Upload Service
@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  async uploadFile(
    file: Express.Multer.File,
    destination: string = 'uploads',
  ): Promise<{ filename: string; path: string; size: number }> {
    try {
      // Mock file upload - replace with actual file storage service
      const filename = this.generateFileName(file.originalname);
      const path = `${destination}/${filename}`;

      this.logger.log(`File uploaded: ${filename}`);

      return {
        filename,
        path,
        size: file.size,
      };
    } catch (error) {
      this.logger.error('File upload failed:', error);
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    try {
      // Mock file deletion - replace with actual file storage service
      this.logger.log(`File deleted: ${filePath}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete file ${filePath}:`, error);
      return false;
    }
  }

  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${randomString}.${extension}`;
  }
}

// Analytics Service
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

// Health Check Service
@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);

  async checkDatabase(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();

    try {
      // Mock database check - replace with actual database health check
      await new Promise((resolve) => setTimeout(resolve, 10));

      const responseTime = Date.now() - startTime;
      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime,
      };
    }
  }

  async checkRedis(): Promise<{ status: string; responseTime: number }> {
    const startTime = Date.now();

    try {
      //TODO: Mock Redis check - replace with actual Redis health check
      await new Promise((resolve) => setTimeout(resolve, 5));

      const responseTime = Date.now() - startTime;
      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error('Redis health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime,
      };
    }
  }

  async getOverallHealth(): Promise<{
    status: string;
    timestamp: string;
    services: Record<string, any>;
  }> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const services = { database, redis };
    const allHealthy = Object.values(services).every(
      (service) => service.status === 'healthy',
    );

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services,
    };
  }
}
