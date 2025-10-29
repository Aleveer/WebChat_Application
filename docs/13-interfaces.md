# Interfaces

## Mục lục
- [Tổng quan](#tổng-quan)
- [Cache Interface](#cache-interface)
- [Email Interface](#email-interface)
- [Notification Interface](#notification-interface)
- [Metrics Interface](#metrics-interface)
- [Best Practices](#best-practices)

---

## Tổng quan

Interfaces định nghĩa contracts cho services và components trong ứng dụng. Common module cung cấp các interface chuẩn cho caching, email, notifications, và metrics để đảm bảo tính nhất quán và dễ dàng thay thế implementation.

### Lợi ích của Interfaces

1. **Contract Definition**: Định nghĩa rõ ràng API của services
2. **Type Safety**: Đảm bảo type-safe trong TypeScript
3. **Dependency Injection**: Dễ dàng inject và mock services
4. **Flexibility**: Dễ dàng thay thế implementation
5. **Testing**: Dễ dàng tạo mock và test

---

## Cache Interface

### ICacheService

Interface cho caching service với các operations cơ bản.

**Definition:**

```typescript
export interface ICacheService {
  set<T>(key: string, data: T, ttl?: number): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}
```

---

### Methods

#### 1. set<T>()

Lưu dữ liệu vào cache.

**Signature:**
```typescript
set<T>(key: string, data: T, ttl?: number): Promise<void>
```

**Parameters:**
- `key`: Cache key (string)
- `data`: Dữ liệu cần lưu (generic type T)
- `ttl`: Time to live (seconds), optional

**Sử dụng:**

```typescript
// Lưu với TTL mặc định (3600s)
await cacheService.set('user:123', userData);

// Lưu với custom TTL (300s)
await cacheService.set('temp:data', tempData, 300);

// Lưu object phức tạp
await cacheService.set('config', {
  theme: 'dark',
  language: 'vi',
  notifications: true
}, 7200);
```

---

#### 2. get<T>()

Lấy dữ liệu từ cache.

**Signature:**
```typescript
get<T>(key: string): Promise<T | null>
```

**Parameters:**
- `key`: Cache key (string)

**Returns:**
- Dữ liệu nếu tìm thấy
- `null` nếu không tồn tại hoặc đã expire

**Sử dụng:**

```typescript
// Lấy user data
const user = await cacheService.get<User>('user:123');
if (user) {
  console.log('Cache hit:', user);
} else {
  console.log('Cache miss');
  // Fetch from database
}

// Với default value
const config = await cacheService.get<Config>('config') ?? defaultConfig;
```

---

#### 3. delete()

Xóa một cache entry.

**Signature:**
```typescript
delete(key: string): Promise<boolean>
```

**Parameters:**
- `key`: Cache key (string)

**Returns:**
- `true` nếu xóa thành công
- `false` nếu key không tồn tại hoặc xóa thất bại

**Sử dụng:**

```typescript
// Xóa user cache khi update
await cacheService.delete('user:123');

// Xóa và kiểm tra kết quả
const deleted = await cacheService.delete('temp:data');
if (deleted) {
  console.log('Cache cleared');
}
```

---

#### 4. clear()

Xóa toàn bộ cache.

**Signature:**
```typescript
clear(): Promise<void>
```

**Sử dụng:**

```typescript
// Xóa toàn bộ cache
await cacheService.clear();

// Trong admin endpoint
@Delete('cache')
@Roles('admin')
async clearCache() {
  await this.cacheService.clear();
  return { message: 'Cache cleared successfully' };
}
```

**⚠️ Lưu ý:**
- Sử dụng cẩn thận vì xóa toàn bộ cache
- Nên restrict cho admin only
- Có thể ảnh hưởng performance ngắn hạn

---

#### 5. has()

Kiểm tra sự tồn tại của cache key.

**Signature:**
```typescript
has(key: string): Promise<boolean>
```

**Parameters:**
- `key`: Cache key (string)

**Returns:**
- `true` nếu key tồn tại và chưa expire
- `false` nếu không tồn tại hoặc đã expire

**Sử dụng:**

```typescript
// Kiểm tra trước khi get
if (await cacheService.has('user:123')) {
  const user = await cacheService.get<User>('user:123');
  return user;
}

// Conditional caching
if (!(await cacheService.has('expensive:calculation'))) {
  const result = await this.performExpensiveCalculation();
  await cacheService.set('expensive:calculation', result, 3600);
}
```

---

### Implementation Example

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ICacheService } from '@/common';

@Injectable()
export class CacheService implements ICacheService {
  constructor(
    @Inject(CACHE_MANAGER) 
    private cacheManager: Cache
  ) {}

  async set<T>(key: string, data: T, ttl: number = 3600): Promise<void> {
    await this.cacheManager.set(key, data, ttl * 1000);
  }

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.cacheManager.get<T>(key);
    return cached ?? null;
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.cacheManager.del(key);
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    await this.cacheManager.reset();
  }

  async has(key: string): Promise<boolean> {
    const value = await this.cacheManager.get(key);
    return value !== undefined && value !== null;
  }
}
```

---

## Email Interface

### IEmailService

Interface cho email service.

**Definition:**

```typescript
export interface IEmailService {
  sendEmail(to: string, subject: string, content: string): Promise<boolean>;
  sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean>;
  sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<boolean>;
  sendNotificationEmail(to: string, message: string): Promise<boolean>;
}
```

---

### Methods

#### 1. sendEmail()

Gửi email cơ bản.

**Signature:**
```typescript
sendEmail(to: string, subject: string, content: string): Promise<boolean>
```

**Parameters:**
- `to`: Email người nhận
- `subject`: Tiêu đề email
- `content`: Nội dung HTML

**Returns:**
- `true` nếu gửi thành công
- `false` nếu thất bại

**Sử dụng:**

```typescript
const success = await emailService.sendEmail(
  'user@example.com',
  'Welcome to Our App',
  '<h1>Welcome!</h1><p>Thank you for joining us.</p>'
);

if (success) {
  console.log('Email sent successfully');
}
```

---

#### 2. sendWelcomeEmail()

Gửi email chào mừng user mới.

**Signature:**
```typescript
sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean>
```

**Parameters:**
- `userEmail`: Email người dùng
- `userName`: Tên người dùng

**Sử dụng:**

```typescript
// Sau khi đăng ký thành công
@Post('register')
async register(@Body() registerDto: RegisterDto) {
  const user = await this.authService.register(registerDto);
  
  // Gửi welcome email (async, không chờ)
  this.emailService.sendWelcomeEmail(user.email, user.name)
    .catch(err => this.logger.error('Failed to send welcome email', err));
  
  return { message: 'Registration successful' };
}
```

---

#### 3. sendPasswordResetEmail()

Gửi email reset password với token.

**Signature:**
```typescript
sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<boolean>
```

**Parameters:**
- `userEmail`: Email người dùng
- `resetToken`: Token reset password

**Sử dụng:**

```typescript
@Post('forgot-password')
async forgotPassword(@Body() dto: ForgotPasswordDto) {
  const resetToken = await this.authService.generateResetToken(dto.email);
  
  await this.emailService.sendPasswordResetEmail(dto.email, resetToken);
  
  return { message: 'Password reset email sent' };
}
```

---

#### 4. sendNotificationEmail()

Gửi email thông báo.

**Signature:**
```typescript
sendNotificationEmail(to: string, message: string): Promise<boolean>
```

**Parameters:**
- `to`: Email người nhận
- `message`: Nội dung thông báo

**Sử dụng:**

```typescript
// Gửi thông báo khi có tin nhắn mới
async notifyNewMessage(userId: string, message: string) {
  const user = await this.usersService.findById(userId);
  
  if (user.emailNotifications) {
    await this.emailService.sendNotificationEmail(
      user.email,
      `You have a new message: ${message}`
    );
  }
}
```

---

### Implementation Example

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailService } from '@/common';

@Injectable()
export class EmailService implements IEmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  async sendEmail(
    to: string,
    subject: string,
    content: string
  ): Promise<boolean> {
    try {
      // Implementation với SMTP hoặc service như SendGrid
      this.logger.log(`Sending email to ${to}: ${subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return false;
    }
  }

  async sendWelcomeEmail(
    userEmail: string,
    userName: string
  ): Promise<boolean> {
    const subject = 'Welcome to Our App!';
    const content = `
      <h1>Welcome ${userName}!</h1>
      <p>Thank you for joining us.</p>
    `;
    return this.sendEmail(userEmail, subject, content);
  }

  async sendPasswordResetEmail(
    userEmail: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request';
    const content = `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
    `;
    return this.sendEmail(userEmail, subject, content);
  }

  async sendNotificationEmail(
    to: string,
    message: string
  ): Promise<boolean> {
    const subject = 'New Notification';
    const content = `<p>${message}</p>`;
    return this.sendEmail(to, subject, content);
  }
}
```

---

## Notification Interface

### INotificationService

Interface cho notification service.

**Definition:**

```typescript
export interface INotificationService {
  sendNotification(
    userId: string,
    title: string,
    message: string,
    type?: 'info' | 'warning' | 'error' | 'success'
  ): Promise<boolean>;
  
  sendMessageNotification(
    userId: string,
    senderName: string,
    messagePreview: string
  ): Promise<boolean>;
  
  sendGroupNotification(
    userId: string,
    groupName: string,
    messagePreview: string
  ): Promise<boolean>;
}
```

---

### Methods

#### 1. sendNotification()

Gửi notification chung.

**Signature:**
```typescript
sendNotification(
  userId: string,
  title: string,
  message: string,
  type?: 'info' | 'warning' | 'error' | 'success'
): Promise<boolean>
```

**Parameters:**
- `userId`: ID người dùng
- `title`: Tiêu đề notification
- `message`: Nội dung
- `type`: Loại notification (optional)

**Sử dụng:**

```typescript
// Info notification
await notificationService.sendNotification(
  userId,
  'Profile Updated',
  'Your profile has been updated successfully',
  'success'
);

// Error notification
await notificationService.sendNotification(
  userId,
  'Payment Failed',
  'Your payment could not be processed',
  'error'
);
```

---

#### 2. sendMessageNotification()

Gửi notification khi có tin nhắn mới.

**Signature:**
```typescript
sendMessageNotification(
  userId: string,
  senderName: string,
  messagePreview: string
): Promise<boolean>
```

**Sử dụng:**

```typescript
// Sau khi gửi message
@Post('messages')
async sendMessage(@Body() dto: SendMessageDto) {
  const message = await this.messagesService.create(dto);
  
  // Notify receiver
  await this.notificationService.sendMessageNotification(
    dto.receiverId,
    message.sender.name,
    message.text.substring(0, 50)
  );
  
  return message;
}
```

---

#### 3. sendGroupNotification()

Gửi notification cho tin nhắn trong group.

**Signature:**
```typescript
sendGroupNotification(
  userId: string,
  groupName: string,
  messagePreview: string
): Promise<boolean>
```

**Sử dụng:**

```typescript
// Notify all group members
async notifyGroupMembers(groupId: string, message: string) {
  const group = await this.groupsService.findById(groupId);
  
  for (const member of group.members) {
    await this.notificationService.sendGroupNotification(
      member.userId,
      group.name,
      message
    );
  }
}
```

---

## Metrics Interface

### IMetricsService

Interface cho metrics collection service.

**Definition:**

```typescript
export interface IMetricsService {
  incrementCounter(name: string, value?: number): void;
  decrementCounter(name: string, value?: number): void;
  getCounter(name: string): number;
  getAllCounters(): Record<string, number>;
  
  startTimer(name: string): void;
  endTimer(name: string): number;
  
  recordHistogram(name: string, value: number): void;
  getHistogramStats(name: string): HistogramStats | null;
  getAllHistograms(): Record<string, any>;
  
  reset(): void;
  getSummary(): MetricsSummary;
}
```

---

### Counter Methods

#### 1. incrementCounter()

Tăng counter.

**Signature:**
```typescript
incrementCounter(name: string, value?: number): void
```

**Sử dụng:**

```typescript
// Increment by 1 (default)
metricsService.incrementCounter('http_requests_total');

// Increment by custom value
metricsService.incrementCounter('bytes_sent', 1024);

// Track user registrations
metricsService.incrementCounter('user_registrations');
```

---

#### 2. decrementCounter()

Giảm counter.

**Signature:**
```typescript
decrementCounter(name: string, value?: number): void
```

**Sử dụng:**

```typescript
// Decrement by 1
metricsService.decrementCounter('active_connections');

// Decrement by custom value
metricsService.decrementCounter('queue_size', 5);
```

---

### Timer Methods

#### 1. startTimer()

Bắt đầu timer.

**Signature:**
```typescript
startTimer(name: string): void
```

---

#### 2. endTimer()

Kết thúc timer và trả về duration.

**Signature:**
```typescript
endTimer(name: string): number
```

**Returns:** Duration in milliseconds

**Sử dụng:**

```typescript
// Measure operation duration
const timerName = 'database_query';
this.metricsService.startTimer(timerName);

const result = await this.database.query(sql);

const duration = this.metricsService.endTimer(timerName);
this.logger.log(`Query took ${duration}ms`);
```

---

### Histogram Methods

#### 1. recordHistogram()

Ghi nhận giá trị vào histogram.

**Signature:**
```typescript
recordHistogram(name: string, value: number): void
```

**Sử dụng:**

```typescript
// Record response time
metricsService.recordHistogram('http_response_time', 150);

// Record request size
metricsService.recordHistogram('request_size_bytes', 2048);
```

---

#### 2. getHistogramStats()

Lấy statistics của histogram.

**Signature:**
```typescript
getHistogramStats(name: string): {
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
} | null
```

**Sử dụng:**

```typescript
const stats = metricsService.getHistogramStats('http_response_time');

if (stats) {
  console.log(`Average response time: ${stats.avg}ms`);
  console.log(`95th percentile: ${stats.p95}ms`);
  console.log(`99th percentile: ${stats.p99}ms`);
}
```

---

## Best Practices

### 1. Dependency Injection với Interfaces

**❌ Không tốt:**
```typescript
constructor(
  private cacheService: CacheService  // Concrete class
) {}
```

**✅ Tốt:**
```typescript
constructor(
  @Inject('CACHE_SERVICE')
  private cacheService: ICacheService  // Interface
) {}
```

---

### 2. Mock Interfaces trong Tests

```typescript
describe('UsersService', () => {
  let service: UsersService;
  let cacheService: ICacheService;

  beforeEach(async () => {
    const mockCacheService: ICacheService = {
      set: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      has: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: 'CACHE_SERVICE',
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    cacheService = module.get('CACHE_SERVICE');
  });

  it('should cache user data', async () => {
    const user = { id: '123', name: 'John' };
    await service.cacheUser(user);
    
    expect(cacheService.set).toHaveBeenCalledWith(
      'user:123',
      user,
      3600
    );
  });
});
```

---

### 3. Multiple Implementations

```typescript
// Redis implementation
@Injectable()
export class RedisCacheService implements ICacheService {
  // ... Redis-specific implementation
}

// Memory implementation
@Injectable()
export class MemoryCacheService implements ICacheService {
  // ... Memory-specific implementation
}

// Module configuration
@Module({
  providers: [
    {
      provide: 'CACHE_SERVICE',
      useClass: process.env.CACHE_TYPE === 'redis' 
        ? RedisCacheService 
        : MemoryCacheService,
    },
  ],
})
export class CacheModule {}
```

---

### 4. Service Wrapper

```typescript
@Injectable()
export class UsersCacheService {
  constructor(
    @Inject('CACHE_SERVICE')
    private cacheService: ICacheService
  ) {}

  async cacheUser(user: User): Promise<void> {
    const key = `user:${user.id}`;
    await this.cacheService.set(key, user, 3600);
  }

  async getCachedUser(userId: string): Promise<User | null> {
    const key = `user:${userId}`;
    return await this.cacheService.get<User>(key);
  }

  async invalidateUser(userId: string): Promise<void> {
    const key = `user:${userId}`;
    await this.cacheService.delete(key);
  }
}
```

---

## Tham khảo

- [TypeScript Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)
- [NestJS Custom Providers](https://docs.nestjs.com/fundamentals/custom-providers)
- [Dependency Injection](https://docs.nestjs.com/fundamentals/dependency-injection)

