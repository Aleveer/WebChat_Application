import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import {
  CacheService,
  EmailService,
  NotificationService,
  FileUploadService,
  AnalyticsService,
  HealthCheckService,
} from './shared.services';

describe('Shared Services', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        CacheService,
        EmailService,
        NotificationService,
        FileUploadService,
        AnalyticsService,
        HealthCheckService,
      ],
    })
      .overrideProvider(Logger)
      .useValue({
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      })
      .compile();
  });

  afterAll(async () => {
    await module.close();
  });

  describe('CacheService', () => {
    let cacheService: CacheService;

    beforeEach(async () => {
      cacheService = module.get<CacheService>(CacheService);
      cacheService.clear();
    });

    describe('set và get', () => {
      it('nên lưu và lấy dữ liệu thành công', () => {
        const key = 'test-key';
        const data = { message: 'Hello World' };

        cacheService.set(key, data);
        const result = cacheService.get(key);

        expect(result).toEqual(data);
      });

      it('nên trả về null khi key không tồn tại', () => {
        const result = cacheService.get('non-existent-key');
        expect(result).toBeNull();
      });

      it('nên sử dụng TTL mặc định khi không cung cấp', () => {
        const key = 'default-ttl-key';
        const data = { message: 'Default TTL' };

        cacheService.set(key, data);
        const result = cacheService.get(key);

        expect(result).toEqual(data);
      });
    });

    describe('delete', () => {
      it('nên xóa cache thành công', () => {
        const key = 'delete-key';
        const data = { message: 'To be deleted' };

        cacheService.set(key, data);
        expect(cacheService.get(key)).toEqual(data);

        const deleted = cacheService.delete(key);
        expect(deleted).toBe(true);
        expect(cacheService.get(key)).toBeNull();
      });

      it('nên trả về false khi xóa key không tồn tại', () => {
        const deleted = cacheService.delete('non-existent-key');
        expect(deleted).toBe(false);
      });
    });

    describe('has', () => {
      it('nên trả về true khi key tồn tại và chưa hết hạn', () => {
        const key = 'exists-key';
        const data = { message: 'Exists' };

        cacheService.set(key, data);
        expect(cacheService.has(key)).toBe(true);
      });

      it('nên trả về false khi key không tồn tại', () => {
        expect(cacheService.has('non-existent-key')).toBe(false);
      });
    });

    describe('clear', () => {
      it('nên xóa tất cả cache entries', () => {
        cacheService.set('key1', 'data1');
        cacheService.set('key2', 'data2');
        cacheService.set('key3', 'data3');

        expect(cacheService.has('key1')).toBe(true);
        expect(cacheService.has('key2')).toBe(true);
        expect(cacheService.has('key3')).toBe(true);

        cacheService.clear();

        expect(cacheService.has('key1')).toBe(false);
        expect(cacheService.has('key2')).toBe(false);
        expect(cacheService.has('key3')).toBe(false);
      });
    });
  });

  describe('EmailService', () => {
    let emailService: EmailService;

    beforeEach(async () => {
      emailService = module.get<EmailService>(EmailService);
    });

    describe('sendEmail', () => {
      it('nên gửi email thành công', async () => {
        const result = await emailService.sendEmail(
          'test@example.com',
          'Test Subject',
          'Test Content',
        );

        expect(result).toBe(true);
      });
    });

    describe('sendWelcomeEmail', () => {
      it('nên gửi email chào mừng thành công', async () => {
        const result = await emailService.sendWelcomeEmail(
          'newuser@example.com',
          'John Doe',
        );

        expect(result).toBe(true);
      });
    });

    describe('sendPasswordResetEmail', () => {
      it('nên gửi email reset password thành công', async () => {
        const resetToken = 'abc123';

        const result = await emailService.sendPasswordResetEmail(
          'user@example.com',
          resetToken,
        );

        expect(result).toBe(true);
      });
    });
  });

  describe('NotificationService', () => {
    let notificationService: NotificationService;

    beforeEach(async () => {
      notificationService =
        module.get<NotificationService>(NotificationService);
    });

    describe('sendNotification', () => {
      it('nên gửi thông báo thành công với type mặc định', async () => {
        const result = await notificationService.sendNotification(
          'user123',
          'Test Title',
          'Test Message',
        );

        expect(result).toBe(true);
      });

      it('nên gửi thông báo với type cụ thể', async () => {
        const result = await notificationService.sendNotification(
          'user123',
          'Warning Title',
          'Warning Message',
          'warning',
        );

        expect(result).toBe(true);
      });
    });

    describe('sendMessageNotification', () => {
      it('nên gửi thông báo tin nhắn thành công', async () => {
        const result = await notificationService.sendMessageNotification(
          'user123',
          'John Doe',
          'Hello there!',
        );

        expect(result).toBe(true);
      });
    });

    describe('sendGroupNotification', () => {
      it('nên gửi thông báo nhóm thành công', async () => {
        const result = await notificationService.sendGroupNotification(
          'user123',
          'Project Team',
          'Meeting at 3 PM',
        );

        expect(result).toBe(true);
      });
    });
  });

  describe('FileUploadService', () => {
    let fileUploadService: FileUploadService;

    beforeEach(async () => {
      fileUploadService = module.get<FileUploadService>(FileUploadService);
    });

    describe('uploadFile', () => {
      it('nên upload file thành công với destination mặc định', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'test.txt',
          encoding: '7bit',
          mimetype: 'text/plain',
          size: 1024,
          buffer: Buffer.from('test content'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        const result = await fileUploadService.uploadFile(mockFile);

        expect(result).toHaveProperty('filename');
        expect(result).toHaveProperty('path');
        expect(result).toHaveProperty('size', 1024);
        expect(result.path).toContain('uploads/');
      });

      it('nên upload file với destination tùy chỉnh', async () => {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'image.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 2048,
          buffer: Buffer.from('image data'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        const result = await fileUploadService.uploadFile(mockFile, 'images');

        expect(result.path).toContain('images/');
        expect(result.filename).toContain('.jpg');
      });
    });

    describe('deleteFile', () => {
      it('nên xóa file thành công', async () => {
        const result = await fileUploadService.deleteFile('uploads/test.txt');

        expect(result).toBe(true);
      });
    });

    describe('generateFileName', () => {
      it('nên tạo tên file unique với timestamp và random string', () => {
        const originalName = 'test.txt';

        // Sử dụng reflection để test private method
        const generateFileName = (
          fileUploadService as any
        ).generateFileName.bind(fileUploadService);

        const fileName1 = generateFileName(originalName);
        const fileName2 = generateFileName(originalName);

        expect(fileName1).not.toBe(fileName2);
        expect(fileName1).toContain('.txt');
        expect(fileName1).toMatch(/^\d+_[a-z0-9]+\.txt$/);
      });
    });
  });

  describe('AnalyticsService', () => {
    let analyticsService: AnalyticsService;

    beforeEach(async () => {
      analyticsService = module.get<AnalyticsService>(AnalyticsService);
    });

    describe('trackEvent', () => {
      it('nên track event thành công', () => {
        analyticsService.trackEvent('user_login', {
          userId: '123',
          platform: 'web',
        });

        const stats = analyticsService.getEventStats('user_login');
        expect(stats.count).toBe(1);
        expect(stats.lastEvent).toHaveProperty('name', 'user_login');
        expect(stats.lastEvent).toHaveProperty('properties');
        expect(stats.lastEvent.properties).toEqual({
          userId: '123',
          platform: 'web',
        });
      });

      it('nên track multiple events cùng tên', () => {
        analyticsService.trackEvent('page_view', { page: 'home' });
        analyticsService.trackEvent('page_view', { page: 'about' });
        analyticsService.trackEvent('page_view', { page: 'contact' });

        const stats = analyticsService.getEventStats('page_view');
        expect(stats.count).toBe(3);
      });
    });

    describe('trackUserAction', () => {
      it('nên track user action thành công', () => {
        analyticsService.trackUserAction('user123', 'click_button', {
          buttonId: 'submit',
        });

        const stats = analyticsService.getEventStats('user_action');
        expect(stats.count).toBe(1);
        expect(stats.lastEvent.properties).toEqual({
          userId: 'user123',
          action: 'click_button',
          buttonId: 'submit',
        });
      });
    });

    describe('trackMessageSent', () => {
      it('nên track message sent thành công', () => {
        analyticsService.trackMessageSent('sender123', 'user', 'receiver456');

        const stats = analyticsService.getEventStats('message_sent');
        expect(stats.count).toBe(1);
        expect(stats.lastEvent.properties).toEqual({
          senderId: 'sender123',
          receiverType: 'user',
          receiverId: 'receiver456',
        });
      });
    });

    describe('trackGroupCreated', () => {
      it('nên track group created thành công', () => {
        analyticsService.trackGroupCreated('creator123', 'group456', 5);

        const stats = analyticsService.getEventStats('group_created');
        expect(stats.count).toBe(1);
        expect(stats.lastEvent.properties).toEqual({
          creatorId: 'creator123',
          groupId: 'group456',
          memberCount: 5,
        });
      });
    });

    describe('getEventStats', () => {
      it('nên trả về stats cho event tồn tại', () => {
        analyticsService.trackEvent('test_event', { data: 'test' });

        const stats = analyticsService.getEventStats('test_event');
        expect(stats.count).toBe(1);
        expect(stats.lastEvent).toBeDefined();
      });

      it('nên trả về stats rỗng cho event không tồn tại', () => {
        const stats = analyticsService.getEventStats('non_existent_event');
        expect(stats.count).toBe(0);
        expect(stats.lastEvent).toBeNull();
      });
    });
  });

  describe('HealthCheckService', () => {
    let healthCheckService: HealthCheckService;

    beforeEach(async () => {
      healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    });

    describe('checkDatabase', () => {
      it('nên kiểm tra database thành công', async () => {
        const result = await healthCheckService.checkDatabase();

        expect(result).toHaveProperty('status', 'healthy');
        expect(result).toHaveProperty('responseTime');
        expect(result.responseTime).toBeGreaterThan(0);
      });
    });

    describe('checkRedis', () => {
      it('nên kiểm tra Redis thành công', async () => {
        const result = await healthCheckService.checkRedis();

        expect(result).toHaveProperty('status', 'healthy');
        expect(result).toHaveProperty('responseTime');
        expect(result.responseTime).toBeGreaterThan(0);
      });
    });

    describe('getOverallHealth', () => {
      it('nên trả về overall health khi tất cả services healthy', async () => {
        const result = await healthCheckService.getOverallHealth();

        expect(result).toHaveProperty('status', 'healthy');
        expect(result).toHaveProperty('timestamp');
        expect(result).toHaveProperty('services');
        expect(result.services).toHaveProperty('database');
        expect(result.services).toHaveProperty('redis');
        expect(result.services.database.status).toBe('healthy');
        expect(result.services.redis.status).toBe('healthy');
      });

      it('nên có timestamp hợp lệ', async () => {
        const result = await healthCheckService.getOverallHealth();
        const timestamp = new Date(result.timestamp);

        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp.getTime()).not.toBeNaN();
      });
    });
  });
});
