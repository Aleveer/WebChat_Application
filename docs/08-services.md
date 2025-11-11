# 🔧 Services - Business Logic & Utilities

## 📋 Tổng Quan

Services trong Common Module cung cấp các functionality dùng chung cho toàn bộ ứng dụng. Tất cả services đều được export và có thể inject vào bất kỳ module nào.

## 🎯 Danh Sách Services

```
Common Services
├── CacheService           # Caching layer
├── EmailService          # Email notifications
├── NotificationService   # Push notifications
├── FileUploadService     # File management
├── AnalyticsService      # Event tracking
├── HealthCheckService    # Health monitoring
└── MetricsService        # Performance metrics
```

## 💾 1. CacheService

### Mục Đích
Quản lý cache để tăng performance và giảm database load.

### Features
- Set/Get/Delete cache entries
- TTL (Time To Live) support
- Automatic cleanup
- Generic type support

### Methods

```typescript
export class CacheService {
  // Set cache với TTL
  async set<T>(key: string, data: T, ttl: number = 3600): Promise<void>
  
  // Get cache
  async get<T>(key: string): Promise<T | null>
  
  // Delete cache
  async delete(key: string): Promise<boolean>
  
  // Clear all cache
  async clear(): Promise<void>
  
  // Check if key exists
  async has(key: string): Promise<boolean>
}
```

### Usage Examples

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService } from './common';

@Injectable()
export class UserService {
  constructor(private cacheService: CacheService) {}
  
  async getUser(id: string) {
    // 1. Try get from cache
    const cacheKey = `user:${id}`;
    const cached = await this.cacheService.get<User>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    // 2. Fetch from database
    const user = await this.userRepository.findOne({ _id: id });
    
    // 3. Store in cache (30 minutes)
    await this.cacheService.set(cacheKey, user, 1800);
    
    return user;
  }
  
  async updateUser(id: string, dto: UpdateUserDto) {
    // Update database
    const user = await this.userRepository.update(id, dto);
    
    // Invalidate cache
    await this.cacheService.delete(`user:${id}`);
    
    return user;
  }
  
  async clearUserCache(userId: string) {
    await this.cacheService.delete(`user:${userId}`);
    await this.cacheService.delete(`user:profile:${userId}`);
    await this.cacheService.delete(`user:stats:${userId}`);
  }
}
```

### Cache Keys Convention

```typescript
// User cache keys
'user:{userId}'                    // User data
'user:profile:{userId}'            // User profile
'user:stats:{userId}'              // User statistics

// Group cache keys
'group:{groupId}'                  // Group data
'group:members:{groupId}'          // Group members
'user:groups:{userId}'             // User's groups

// Message cache keys
'message:count:{conversationId}'   // Message count
'messages:{conversationId}:page:{page}'  // Paginated messages

// HTTP cache keys
'cache:GET:/api/users/{id}'        // HTTP response cache
```

### Best Practices

```typescript
// ✅ Use descriptive keys
const key = `user:profile:${userId}`;

// ✅ Set appropriate TTL
await this.cacheService.set(key, data, 1800); // 30 minutes for user data
await this.cacheService.set(key, data, 300);  // 5 minutes for stats
await this.cacheService.set(key, data, 3600); // 1 hour for static data

// ✅ Always invalidate on update
async update(id: string, dto: UpdateDto) {
  const result = await this.repository.update(id, dto);
  await this.cacheService.delete(`resource:${id}`);
  return result;
}

// ❌ Don't cache everything
// ❌ Don't use too long TTL for dynamic data
// ❌ Don't forget to invalidate cache
```

## 📧 2. EmailService

### Mục Đích
Gửi email notifications cho users.

### Features
- Send generic emails
- Welcome emails
- Password reset emails
- Notification emails
- Circuit breaker pattern cho reliability

### Methods

```typescript
export class EmailService {
  // Generic email
  async sendEmail(
    to: string,
    subject: string,
    content: string,
  ): Promise<boolean>
  
  // Welcome email
  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
  ): Promise<boolean>
  
  // Password reset
  async sendPasswordResetEmail(
    userEmail: string,
    resetToken: string,
  ): Promise<boolean>
  
  // Notification email
  async sendNotificationEmail(
    to: string,
    message: string,
  ): Promise<boolean>
}
```

### Usage Examples

```typescript
import { Injectable } from '@nestjs/common';
import { EmailService } from './common';

@Injectable()
export class AuthService {
  constructor(private emailService: EmailService) {}
  
  async register(dto: RegisterDto) {
    // Create user
    const user = await this.userRepository.create(dto);
    
    // Send welcome email
    await this.emailService.sendWelcomeEmail(
      user.email,
      user.full_name,
    );
    
    return user;
  }
  
  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ email });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Generate reset token
    const resetToken = this.generateResetToken();
    
    // Save token
    await this.userRepository.update(user.id, { resetToken });
    
    // Send email
    await this.emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
    );
    
    return { message: 'Reset email sent' };
  }
}
```

### Email Templates

```typescript
// Welcome email
const welcomeEmailContent = `
  <h1>Welcome ${userName}!</h1>
  <p>Thank you for joining WebChat. We're excited to have you on board!</p>
  <p>Best regards,<br>The WebChat Team</p>
`;

// Password reset email
const resetEmailContent = `
  <h1>Password Reset Request</h1>
  <p>You requested a password reset. Click the link below:</p>
  <a href="${resetUrl}">Reset Password</a>
  <p>This link will expire in 1 hour.</p>
  <p>If you didn't request this, please ignore this email.</p>
`;
```

### Configuration

```typescript
// .env.local
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 🔔 3. NotificationService

### Mục Đích
Gửi in-app notifications và push notifications cho users.

### Features
- Send generic notifications
- Message notifications
- Group notifications
- Type-based notifications (info, warning, error, success)

### Methods

```typescript
export class NotificationService {
  // Generic notification
  async sendNotification(
    userId: string,
    title: string,
    message: string,
    type?: 'info' | 'warning' | 'error' | 'success',
  ): Promise<boolean>
  
  // Message notification
  async sendMessageNotification(
    userId: string,
    senderName: string,
    messagePreview: string,
  ): Promise<boolean>
  
  // Group notification
  async sendGroupNotification(
    userId: string,
    groupName: string,
    messagePreview: string,
  ): Promise<boolean>
}
```

### Usage Examples

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService } from './common';

@Injectable()
export class MessageService {
  constructor(
    private notificationService: NotificationService,
  ) {}
  
  async sendMessage(senderId: string, receiverId: string, text: string) {
    // Save message
    const message = await this.messageRepository.create({
      sender_id: senderId,
      receiver_id: receiverId,
      text,
    });
    
    // Get sender info
    const sender = await this.userService.findOne(senderId);
    
    // Send notification to receiver
    await this.notificationService.sendMessageNotification(
      receiverId,
      sender.full_name,
      text.substring(0, 50), // Preview
    );
    
    return message;
  }
  
  async sendGroupMessage(senderId: string, groupId: string, text: string) {
    // Save message
    const message = await this.messageRepository.create({
      sender_id: senderId,
      receiver_id: groupId,
      receiver_type: 'group',
      text,
    });
    
    // Get group and sender info
    const group = await this.groupService.findOne(groupId);
    const sender = await this.userService.findOne(senderId);
    
    // Send notification to all group members (except sender)
    const members = group.members
      .filter(m => m.user_id !== senderId)
      .map(m => m.user_id);
    
    for (const memberId of members) {
      await this.notificationService.sendGroupNotification(
        memberId,
        group.name,
        `${sender.full_name}: ${text.substring(0, 40)}`,
      );
    }
    
    return message;
  }
  
  async sendSystemNotification(userId: string, message: string) {
    await this.notificationService.sendNotification(
      userId,
      'System Notification',
      message,
      'info',
    );
  }
}
```

## 📁 4. FileUploadService

### Mục Đích
Quản lý file uploads một cách an toàn.

### Features
- Secure file upload
- Path traversal prevention
- File type validation
- Size validation
- Streaming support cho large files

### Methods

```typescript
export class FileUploadService {
  // Upload file
  async uploadFile(
    file: Express.Multer.File,
    destination: string = 'uploads',
  ): Promise<{ filename: string; path: string; size: number }>
  
  // Upload with streaming
  async uploadFileWithStreaming(
    sourcePath: string,
    destination: string,
    originalName: string,
  ): Promise<{ filename: string; path: string; size: number }>
  
  // Delete file
  async deleteFile(filePath: string): Promise<boolean>
  
  // Get file info
  async getFileInfo(filePath: string): Promise<{
    size: number;
    created: Date;
    modified: Date;
  } | null>
  
  // Check if file exists
  async fileExists(filePath: string): Promise<boolean>
}
```

### Usage Examples

```typescript
import { Injectable } from '@nestjs/common';
import { FileUploadService } from './common';

@Injectable()
export class MediaService {
  constructor(
    private fileUploadService: FileUploadService,
  ) {}
  
  async uploadUserAvatar(userId: string, file: Express.Multer.File) {
    // Upload to specific directory
    const result = await this.fileUploadService.uploadFile(
      file,
      'uploads/avatars',
    );
    
    // Update user profile
    await this.userService.update(userId, {
      photo: `/uploads/avatars/${result.filename}`,
    });
    
    return {
      url: `/uploads/avatars/${result.filename}`,
      size: result.size,
    };
  }
  
  async uploadChatImage(userId: string, file: Express.Multer.File) {
    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only images are allowed');
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File too large (max 5MB)');
    }
    
    // Upload
    const result = await this.fileUploadService.uploadFile(
      file,
      'uploads/chat-images',
    );
    
    return {
      filename: result.filename,
      url: `/uploads/chat-images/${result.filename}`,
      size: result.size,
    };
  }
  
  async deleteUserFile(userId: string, filePath: string) {
    // Verify user owns the file
    const file = await this.fileRepository.findOne({ 
      path: filePath,
      uploaded_by: userId,
    });
    
    if (!file) {
      throw new ForbiddenException('Cannot delete file');
    }
    
    // Delete from filesystem
    await this.fileUploadService.deleteFile(filePath);
    
    // Delete from database
    await this.fileRepository.delete(file.id);
    
    return { message: 'File deleted successfully' };
  }
}
```

### Security Features

```typescript
// Path validation
private validatePath(destination: string, filename?: string): void {
  // Check for forbidden patterns
  const FORBIDDEN_PATTERNS = [
    /\.\./g,           // Parent directory
    /~/g,              // Home directory
    /^[/\\]/,          // Absolute path
    /[/\\]\.{1,2}[/\\]/g,  // Hidden files
  ];
  
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(destination) || pattern.test(filename || '')) {
      throw new BadRequestException('Invalid file path detected');
    }
  }
}

// Filename sanitization
private sanitizeFilename(filename: string): string {
  return filename
    .replace(/\0/g, '')        // Null bytes
    .replace(/\.\./g, '')      // Parent directory
    .replace(/[/\\]/g, '')     // Path separators
    .replace(/^\.+/, '')       // Leading dots
    .replace(/[^a-zA-Z0-9._-]/g, '_');  // Non-alphanumeric
}
```

## 📊 5. AnalyticsService

### Mục Đích
Track events và user actions cho analytics.

### Features
- Event tracking
- User action tracking
- Automatic cleanup của old events
- Event statistics

### Methods

```typescript
export class AnalyticsService {
  // Track generic event
  trackEvent(eventName: string, properties: any = {}): void
  
  // Track user action
  trackUserAction(userId: string, action: string, properties: any = {}): void
  
  // Track message sent
  trackMessageSent(senderId: string, receiverType: string, receiverId: string): void
  
  // Track group created
  trackGroupCreated(creatorId: string, groupId: string, memberCount: number): void
  
  // Get event stats
  getEventStats(eventName: string): { count: number; lastEvent: any }
}
```

### Usage Examples

```typescript
import { Injectable } from '@nestjs/common';
import { AnalyticsService } from './common';

@Injectable()
export class UserService {
  constructor(
    private analyticsService: AnalyticsService,
  ) {}
  
  async register(dto: RegisterDto) {
    const user = await this.userRepository.create(dto);
    
    // Track registration
    this.analyticsService.trackEvent('user_registered', {
      userId: user.id,
      source: 'web',
      timestamp: new Date(),
    });
    
    return user;
  }
  
  async login(dto: LoginDto) {
    const user = await this.validateCredentials(dto);
    
    // Track login
    this.analyticsService.trackUserAction(user.id, 'login', {
      ip: dto.ip,
      userAgent: dto.userAgent,
    });
    
    return user;
  }
}

@Injectable()
export class MessageService {
  constructor(
    private analyticsService: AnalyticsService,
  ) {}
  
  async sendMessage(senderId: string, receiverId: string, text: string) {
    const message = await this.messageRepository.create({
      sender_id: senderId,
      receiver_id: receiverId,
      text,
    });
    
    // Track message sent
    this.analyticsService.trackMessageSent(
      senderId,
      'user',
      receiverId,
    );
    
    return message;
  }
}
```

### Event Types

```typescript
// User events
'user_registered'      // New user registration
'user_login'           // User login
'user_logout'          // User logout
'user_profile_updated' // Profile update

// Message events
'message_sent'         // Message sent
'message_read'         // Message marked as read
'message_deleted'      // Message deleted

// Group events
'group_created'        // Group created
'group_member_added'   // Member added to group
'group_member_removed' // Member removed from group

// File events
'file_uploaded'        // File uploaded
'file_downloaded'      // File downloaded
'file_deleted'         // File deleted
```

## 🏥 6. HealthCheckService

### Mục Đích
Monitor health của application và dependencies.

### Features
- Database health check
- Cache health check
- Overall health status
- Response time tracking

### Methods

```typescript
export class HealthCheckService {
  // Check database health
  async checkDatabase(): Promise<{
    status: string;
    responseTime: number;
    details?: any;
  }>
  
  // Check cache health
  async checkCache(): Promise<{
    status: string;
    responseTime: number;
    details?: any;
  }>
  
  // Get overall health
  async getOverallHealth(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    memory: NodeJS.MemoryUsage;
    services: Record<string, any>;
  }>
}
```

### Usage Examples

```typescript
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from './common';

@Controller('health')
export class HealthController {
  constructor(
    private healthCheckService: HealthCheckService,
  ) {}
  
  @Get()
  async getHealth() {
    const health = await this.healthCheckService.getOverallHealth();
    const httpStatus = health.status === 'healthy' ? 200 : 503;
    
    return {
      statusCode: httpStatus,
      ...health,
    };
  }
  
  @Get('database')
  async getDatabaseHealth() {
    return await this.healthCheckService.checkDatabase();
  }
  
  @Get('live')
  async getLiveness() {
    return { status: 'alive', timestamp: new Date() };
  }
  
  @Get('ready')
  async getReadiness() {
    const health = await this.healthCheckService.getOverallHealth();
    return {
      status: health.status === 'healthy' ? 'ready' : 'not ready',
      services: health.services,
    };
  }
}
```

### Health Response Format

```json
{
  "status": "healthy",
  "timestamp": "2025-10-29 10:00:00",
  "uptime": 3600,
  "memory": {
    "rss": 123456789,
    "heapTotal": 98765432,
    "heapUsed": 87654321,
    "external": 12345678
  },
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 15,
      "details": {
        "database": "webchat",
        "readyState": 1
      }
    },
    "cache": {
      "status": "healthy",
      "responseTime": 5,
      "details": {
        "operations": {
          "set": true,
          "get": true,
          "has": true,
          "delete": true
        }
      }
    }
  }
}
```

## 📈 7. MetricsService

### Mục Đích
Thu thập và quản lý performance metrics.

### Features
- Counter metrics
- Histogram metrics
- Timer support
- Memory management
- Automatic cleanup

### Methods

```typescript
export class MetricsService {
  // Increment counter
  incrementCounter(name: string, value?: number): void
  
  // Decrement counter
  decrementCounter(name: string, value?: number): void
  
  // Get counter value
  getCounter(name: string): number
  
  // Start timer
  startTimer(name: string, requestId?: string): string
  
  // End timer
  endTimer(timerKey: string): number
  
  // Record histogram value
  recordHistogram(name: string, value: number): void
  
  // Get histogram stats
  getHistogramStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null
  
  // Get all metrics
  getSummary(): {
    counters: Record<string, number>;
    histograms: Record<string, any>;
  }
  
  // Reset all metrics
  reset(): void
}
```

### Usage Examples

```typescript
import { Injectable } from '@nestjs/common';
import { MetricsService } from './common';

@Injectable()
export class TaskService {
  constructor(
    private metricsService: MetricsService,
  ) {}
  
  async processTask(taskId: string) {
    // Increment counter
    this.metricsService.incrementCounter('tasks_started');
    
    // Start timer
    const timerKey = this.metricsService.startTimer('task_processing');
    
    try {
      // Do work
      await this.doWork(taskId);
      
      // Record success
      this.metricsService.incrementCounter('tasks_completed');
      
    } catch (error) {
      // Record error
      this.metricsService.incrementCounter('tasks_failed');
      throw error;
      
    } finally {
      // End timer and record duration
      const duration = this.metricsService.endTimer(timerKey);
      this.metricsService.recordHistogram('task_duration_ms', duration);
    }
  }
  
  async getTaskMetrics() {
    const summary = this.metricsService.getSummary();
    
    return {
      counters: {
        started: summary.counters['tasks_started'] || 0,
        completed: summary.counters['tasks_completed'] || 0,
        failed: summary.counters['tasks_failed'] || 0,
      },
      performance: summary.histograms['task_duration_ms'],
    };
  }
}
```

### Metrics Output

```json
{
  "counters": {
    "http_requests_total": 12345,
    "http_requests_success": 12000,
    "http_requests_error": 345,
    "tasks_started": 5678,
    "tasks_completed": 5432,
    "tasks_failed": 246
  },
  "histograms": {
    "http_request_duration_ms": {
      "count": 12345,
      "min": 5,
      "max": 980,
      "avg": 145,
      "p50": 120,
      "p95": 450,
      "p99": 850
    },
    "task_duration_ms": {
      "count": 5678,
      "min": 50,
      "max": 5000,
      "avg": 250,
      "p50": 200,
      "p95": 800,
      "p99": 1500
    }
  }
}
```

## 🎯 Services Best Practices

### 1. Dependency Injection

```typescript
// ✅ GOOD: Use constructor injection
@Injectable()
export class MyService {
  constructor(
    private cacheService: CacheService,
    private emailService: EmailService,
    private metricsService: MetricsService,
  ) {}
}

// ❌ BAD: Direct instantiation
const cacheService = new CacheService(); // Hard to test
```

### 2. Error Handling

```typescript
// ✅ GOOD: Handle errors gracefully
async sendEmail(to: string, subject: string, content: string) {
  try {
    await this.emailService.sendEmail(to, subject, content);
  } catch (error) {
    this.logger.error('Failed to send email', error);
    // Fallback or throw user-friendly error
    throw new InternalServerErrorException('Failed to send email');
  }
}

// ❌ BAD: Let errors bubble up without handling
async sendEmail(to: string, subject: string, content: string) {
  await this.emailService.sendEmail(to, subject, content); // May throw cryptic errors
}
```

### 3. Async Operations

```typescript
// ✅ GOOD: Use async/await
async getUserData(userId: string) {
  const user = await this.cacheService.get(`user:${userId}`);
  if (!user) {
    const dbUser = await this.userRepository.findOne(userId);
    await this.cacheService.set(`user:${userId}`, dbUser, 1800);
    return dbUser;
  }
  return user;
}

// ❌ BAD: Callback hell
getUserData(userId: string, callback: Function) {
  this.cacheService.get(`user:${userId}`, (err, user) => {
    if (err) return callback(err);
    if (user) return callback(null, user);
    this.userRepository.findOne(userId, (err, dbUser) => {
      // ... nested callbacks
    });
  });
}
```

---

**Completed!** Bạn đã hoàn thành tất cả documentation về Services. [Quay lại trang chủ →](./README.md)

