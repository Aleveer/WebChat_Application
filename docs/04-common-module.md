# 🔧 Common Module - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

**Common Module** là module trung tâm của WebChat Backend, cung cấp các functionality dùng chung cho toàn bộ ứng dụng như authentication, caching, logging, metrics, và nhiều hơn nữa.

## 🎯 Tính Năng Chính

```
CommonModule
├── Controllers       # Health check và metrics endpoints
├── Services         # Shared services (Cache, Email, Notifications, etc.)
├── Guards           # Authorization guards
├── Interceptors     # Request/Response processing
├── Filters          # Exception handling
├── Decorators       # Custom decorators
├── DTOs             # Data Transfer Objects
└── Utils            # Utility functions
```

## 📦 Cài Đặt Common Module

### Import vào App Module

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    // Import với cấu hình mặc định
    CommonModule.forRoot(),
    
    // Hoặc custom configuration
    CommonModule.forRoot({
      enableGlobalInterceptors: true,
      interceptors: {
        requestId: true,
        sanitization: true,
        logging: true,
        metrics: true,
        performance: true,
      },
      enableGlobalFilters: true,
      enableGlobalGuards: true,
    }),
  ],
})
export class AppModule {}
```

### Configuration Options

```typescript
export interface CommonModuleOptions {
  // Enable/disable global interceptors
  enableGlobalInterceptors?: boolean;
  
  // Configure specific interceptors
  interceptors?: {
    requestId?: boolean;        // Request ID generation
    sanitization?: boolean;     // XSS protection
    securityHeaders?: boolean;  // Security headers
    logging?: boolean;          // Request logging
    metrics?: boolean;          // Metrics collection
    performance?: boolean;      // Performance monitoring
  };
  
  // Enable/disable global exception filters
  enableGlobalFilters?: boolean;
  
  // Enable/disable global guards
  enableGlobalGuards?: boolean;
}
```

### Default Configuration

```typescript
export const DEFAULT_COMMON_MODULE_OPTIONS: CommonModuleOptions = {
  enableGlobalInterceptors: true,
  interceptors: {
    requestId: true,
    sanitization: true,
    securityHeaders: true,
    logging: true,
    metrics: true,
    performance: true,
  },
  enableGlobalFilters: true,
  enableGlobalGuards: true,
};
```

## 🛡️ Guards

### 1. JwtAuthGuard

**Mục đích:** Xác thực JWT token và load user data

**Cách sử dụng:**

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from './common';

@Controller('users')
@UseGuards(JwtAuthGuard)  // Áp dụng cho tất cả routes
export class UsersController {
  
  @Get('me')
  getCurrentUser(@CurrentUser() user: User) {
    return user;
  }
  
  // Skip authentication cho route cụ thể
  @Get('public')
  @Public()  // Decorator để skip auth
  getPublicData() {
    return { message: 'Public data' };
  }
}
```

**Flow hoạt động:**

```
Request → Extract token → Verify JWT → Load user → Attach to request
    ↓             ↓             ↓            ↓              ↓
  Header      Bearer       Check exp    Get payload    request.user
            or Cookie      & signature
```

### 2. RolesGuard

**Mục đích:** Kiểm tra user role

**Cách sử dụng:**

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles } from './common';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  
  @Get('dashboard')
  @Roles('admin')  // Chỉ admin mới access được
  getDashboard() {
    return { message: 'Admin dashboard' };
  }
  
  @Get('users')
  @Roles('admin', 'moderator')  // Admin hoặc moderator
  getUsers() {
    return { users: [] };
  }
}
```

### 3. PermissionsGuard

**Mục đích:** Kiểm tra permissions chi tiết

**Cách sử dụng:**

```typescript
import { Controller, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, PermissionsGuard, Permissions } from './common';

@Controller('content')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContentController {
  
  @Delete(':id')
  @Permissions('content.delete')  // Cần permission cụ thể
  deleteContent(@Param('id') id: string) {
    // Delete logic
  }
  
  @Post()
  @Permissions('content.create', 'content.write')  // Hoặc nhiều permissions
  createContent(@Body() dto: CreateContentDto) {
    // Create logic
  }
}
```

### 4. GroupAdminGuard

**Mục đích:** Kiểm tra user có phải admin của group không

**Cách sử dụng:**

```typescript
import { Controller, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, GroupAdminGuard } from './common';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  
  @Patch(':groupId')
  @UseGuards(GroupAdminGuard)  // Chỉ admin của group mới update được
  updateGroup(
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    // Update logic
  }
}
```

### 5. ThrottleGuard

**Mục đích:** Rate limiting

**Cách sử dụng:**

```typescript
import { Controller, Post } from '@nestjs/common';
import { Throttle, StrictThrottle, AuthThrottle } from './common';

@Controller('auth')
export class AuthController {
  
  @Post('login')
  @AuthThrottle()  // 5 requests per 15 minutes
  login(@Body() dto: LoginDto) {
    // Login logic
  }
  
  @Post('register')
  @StrictThrottle(10, 60000)  // 10 requests per minute
  register(@Body() dto: RegisterDto) {
    // Register logic
  }
}

@Controller('api')
@Throttle(100, 60000)  // 100 requests per minute cho tất cả routes
export class ApiController {
  // Routes...
}
```

## 🔄 Interceptors

### 1. RequestIdInterceptor

**Mục đích:** Generate unique ID cho mỗi request

**Tự động enable** khi import CommonModule

**Truy cập Request ID:**

```typescript
import { Controller, Get } from '@nestjs/common';
import { RequestId, getCurrentRequestId } from './common';

@Controller('example')
export class ExampleController {
  
  @Get()
  example(@RequestId() requestId: string) {
    // Sử dụng request ID
    console.log('Request ID:', requestId);
    return { requestId };
  }
  
  someMethod() {
    // Hoặc lấy từ context
    const requestId = getCurrentRequestId();
  }
}
```

### 2. SanitizationInterceptor

**Mục đích:** Loại bỏ XSS và các input nguy hiểm

**Tự động sanitize:**
- Request body
- Query parameters
- URL parameters

**Example:**

```typescript
// Input
{
  "text": "<script>alert('xss')</script>Hello",
  "username": "user<iframe>bad</iframe>"
}

// Output (sau sanitization)
{
  "text": "alert('xss')Hello",
  "username": "userbad"
}
```

### 3. CacheInterceptor

**Mục đích:** Cache responses để tăng performance

**Cách sử dụng:**

```typescript
import { Controller, Get } from '@nestjs/common';
import { Cache, ShortCache, MediumCache, LongCache, NoCache } from './common';

@Controller('users')
export class UsersController {
  
  @Get(':id')
  @Cache({ key: 'user:profile', ttl: 1800 })  // Custom cache
  getUser(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
  
  @Get('stats')
  @ShortCache()  // 5 minutes
  getStats() {
    return this.userService.getStats();
  }
  
  @Get('list')
  @MediumCache()  // 1 hour
  getUsers() {
    return this.userService.findAll();
  }
  
  @Get('config')
  @LongCache()  // 24 hours
  getConfig() {
    return this.configService.get();
  }
  
  @Post('message')
  @NoCache()  // Không cache
  sendMessage(@Body() dto: SendMessageDto) {
    return this.messageService.send(dto);
  }
}
```

**Cache invalidation:**

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService } from './common';

@Injectable()
export class UserService {
  constructor(private cacheService: CacheService) {}
  
  async updateUser(id: string, dto: UpdateUserDto) {
    // Update user
    const user = await this.userRepository.update(id, dto);
    
    // Invalidate cache
    await this.cacheService.delete(`user:profile:${id}`);
    
    return user;
  }
}
```

### 4. LoggingInterceptor

**Mục đích:** Log tất cả requests và responses

**Output:**

```
[2025-10-29 10:30:45] INFO Incoming Request: POST /api/messages - 192.168.1.100
[2025-10-29 10:30:45] INFO Outgoing Response: POST /api/messages - 201 - 145ms
```

### 5. MetricsInterceptor

**Mục đích:** Thu thập metrics về performance

**Tự động track:**
- Request count
- Response time
- Error rate
- Success rate

**Access metrics:**

```bash
GET /metrics  # Tất cả metrics
GET /metrics/counters  # Chỉ counters
GET /metrics/histograms  # Chỉ histograms
```

### 6. PerformanceInterceptor

**Mục đích:** Cảnh báo về slow requests

**Configuration:**

```typescript
export const DEFAULT_INTERCEPTOR_CONFIG = {
  performance: {
    slowRequestThreshold: 1000,  // 1 second
  },
};
```

**Output:**

```
[WARN] Slow Request: POST /api/heavy-operation took 2500ms
```

## 🚨 Exception Filters

### 1. GlobalExceptionFilter

**Catch all exceptions** và format thành response chuẩn

**Response format:**

```json
{
  "success": false,
  "error": "INTERNAL_ERROR",
  "message": "Internal server error",
  "timestamp": "2025-10-29 10:00:00",
  "path": "/api/endpoint",
  "method": "POST",
  "requestId": "req_1234567890_abc123"
}
```

### 2. ValidationExceptionFilter

**Handle validation errors** từ class-validator

**Example:**

```typescript
// DTO with validation
export class CreateUserDto {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;
  
  @MinLength(8)
  password: string;
}

// Response nếu validation fail
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    {
      "field": "phone",
      "message": "phone must be a valid phone number"
    },
    {
      "field": "password",
      "message": "password must be at least 8 characters"
    }
  ]
}
```

### 3. DatabaseExceptionFilter

**Handle MongoDB errors**

**Examples:**

```json
// Duplicate key error
{
  "success": false,
  "error": "DUPLICATE_ENTRY",
  "message": "Duplicate entry found",
  "details": "E11000 duplicate key error: phone"
}

// Validation error
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Document validation failed"
}
```

### 4. RateLimitExceptionFilter

**Handle rate limit exceeded**

**Response:**

```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests, please try again later",
  "retryAfter": 60
}

// Headers
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1698567950
```

## 🎨 Decorators

### Request Data Decorators

```typescript
import { Controller, Get } from '@nestjs/common';
import {
  CurrentUser,
  CurrentUserId,
  ClientIP,
  UserAgent,
  RequestId,
  Language,
  Timezone,
} from './common';

@Controller('example')
export class ExampleController {
  
  @Get()
  example(
    @CurrentUser() user: User,              // Full user object
    @CurrentUserId() userId: string,        // Just user ID
    @ClientIP() ip: string,                 // Client IP address
    @UserAgent() userAgent: string,         // User agent string
    @RequestId() requestId: string,         // Request ID
    @Language() language: string,           // Accept-Language header
    @Timezone() timezone: string,           // X-Timezone header
  ) {
    return {
      user,
      userId,
      ip,
      userAgent,
      requestId,
      language,
      timezone,
    };
  }
}
```

### Pagination Decorator

```typescript
import { Controller, Get } from '@nestjs/common';
import { Pagination } from './common';

@Controller('users')
export class UsersController {
  
  @Get()
  getUsers(
    @Pagination(['name', 'email', 'created_at']) pagination: {
      page: number;
      limit: number;
      sortBy?: string;
      sortOrder: 'asc' | 'desc';
    },
  ) {
    return this.userService.findAll(pagination);
  }
}

// Query: GET /users?page=2&limit=20&sortBy=name&sortOrder=asc
// Pagination value:
{
  page: 2,
  limit: 20,
  sortBy: 'name',
  sortOrder: 'asc'
}
```

### Access Control Decorators

```typescript
import { Controller, Post } from '@nestjs/common';
import { Public, Roles, Permissions } from './common';

@Controller('admin')
export class AdminController {
  
  @Post('action')
  @Roles('admin')                    // Require admin role
  @Permissions('admin.write')        // Require specific permission
  adminAction() {
    // Action logic
  }
  
  @Get('public')
  @Public()                          // Public endpoint (no auth)
  publicEndpoint() {
    // Public logic
  }
}
```

### Rate Limiting Decorators

```typescript
import { Controller, Post } from '@nestjs/common';
import { RateLimit } from './common';

@Controller('api')
export class ApiController {
  
  @Post('action')
  @RateLimit(50, 60000)  // 50 requests per 60 seconds
  limitedAction() {
    // Action logic
  }
}
```

## 🔧 Services

### 1. CacheService

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService } from './common';

@Injectable()
export class MyService {
  constructor(private cacheService: CacheService) {}
  
  async getData(key: string) {
    // Try get from cache
    const cached = await this.cacheService.get<MyData>(key);
    if (cached) return cached;
    
    // Fetch from database
    const data = await this.fetchFromDatabase();
    
    // Store in cache
    await this.cacheService.set(key, data, 3600); // 1 hour TTL
    
    return data;
  }
  
  async updateData(key: string, data: MyData) {
    // Update database
    await this.database.update(data);
    
    // Invalidate cache
    await this.cacheService.delete(key);
  }
  
  async clearAllCache() {
    await this.cacheService.clear();
  }
}
```

### 2. EmailService

```typescript
import { Injectable } from '@nestjs/common';
import { EmailService } from './common';

@Injectable()
export class NotificationService {
  constructor(private emailService: EmailService) {}
  
  async sendWelcomeEmail(user: User) {
    await this.emailService.sendWelcomeEmail(
      user.email,
      user.full_name,
    );
  }
  
  async sendPasswordReset(user: User, token: string) {
    await this.emailService.sendPasswordResetEmail(
      user.email,
      token,
    );
  }
  
  async sendCustomEmail(to: string, subject: string, content: string) {
    await this.emailService.sendEmail(to, subject, content);
  }
}
```

### 3. NotificationService

```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService } from './common';

@Injectable()
export class MessageService {
  constructor(private notificationService: NotificationService) {}
  
  async sendMessage(senderId: string, receiverId: string, text: string) {
    // Save message to database
    const message = await this.saveMessage(senderId, receiverId, text);
    
    // Send notification to receiver
    await this.notificationService.sendMessageNotification(
      receiverId,
      'John Doe',
      text.substring(0, 50),
    );
    
    return message;
  }
}
```

### 4. FileUploadService

```typescript
import { Injectable } from '@nestjs/common';
import { FileUploadService } from './common';

@Injectable()
export class MediaService {
  constructor(private fileUploadService: FileUploadService) {}
  
  async uploadImage(file: Express.Multer.File) {
    // Upload file
    const result = await this.fileUploadService.uploadFile(
      file,
      'uploads/images',
    );
    
    return {
      filename: result.filename,
      path: result.path,
      size: result.size,
    };
  }
  
  async deleteFile(filePath: string) {
    return await this.fileUploadService.deleteFile(filePath);
  }
  
  async checkFileExists(filePath: string) {
    return await this.fileUploadService.fileExists(filePath);
  }
}
```

### 5. MetricsService

```typescript
import { Injectable } from '@nestjs/common';
import { MetricsService } from './common';

@Injectable()
export class MyService {
  constructor(private metricsService: MetricsService) {}
  
  async processTask() {
    // Increment counter
    this.metricsService.incrementCounter('tasks_processed');
    
    // Start timer
    const timerKey = this.metricsService.startTimer('task_duration');
    
    try {
      // Do work
      await this.doWork();
      
      // Record success
      this.metricsService.incrementCounter('tasks_success');
    } catch (error) {
      // Record error
      this.metricsService.incrementCounter('tasks_error');
      throw error;
    } finally {
      // End timer
      const duration = this.metricsService.endTimer(timerKey);
      console.log(`Task completed in ${duration}ms`);
    }
  }
}
```

### 6. HealthCheckService

```typescript
import { Injectable } from '@nestjs/common';
import { HealthCheckService } from './common';

@Injectable()
export class MonitoringService {
  constructor(private healthCheckService: HealthCheckService) {}
  
  async checkSystemHealth() {
    const health = await this.healthCheckService.getOverallHealth();
    
    if (health.status === 'unhealthy') {
      // Send alert
      await this.alertAdmin('System unhealthy!');
    }
    
    return health;
  }
  
  async checkDatabaseOnly() {
    return await this.healthCheckService.checkDatabase();
  }
  
  async checkCacheOnly() {
    return await this.healthCheckService.checkCache();
  }
}
```

## 🔍 Utils

### Validation Utils

```typescript
import { ValidationUtils } from './common';

// Validate ObjectId
if (ValidationUtils.isValidObjectId(id)) {
  // Valid MongoDB ObjectId
}

// Validate phone number
if (ValidationUtils.isValidPhoneNumber('+84901234567')) {
  // Valid phone
}

// Validate email
if (ValidationUtils.isValidEmail('user@example.com')) {
  // Valid email
}

// Validate with Zod
const result = ValidationUtils.validateWithZod(UserSchema, data);
if (result.success) {
  // Valid
} else {
  // Invalid: result.error
}
```

### Password Utils

```typescript
import { PasswordUtils } from './common';

// Hash password
const hashedPassword = await PasswordUtils.hashPassword('MyPassword123!');

// Compare password
const isValid = await PasswordUtils.comparePassword(
  'MyPassword123!',
  hashedPassword,
);

// Validate password strength
const validation = PasswordUtils.validatePasswordStrength('WeakPass');
console.log(validation.isValid);   // false
console.log(validation.score);     // 2
console.log(validation.feedback);  // ["Password should contain..."]

// Generate random password
const randomPassword = PasswordUtils.generateRandomPassword(16);
```

### Pagination Utils

```typescript
import { PaginationUtils } from './common';

// Calculate pagination
const pagination = PaginationUtils.calculatePagination(2, 20, 150);
console.log(pagination);
// {
//   page: 2,
//   limit: 20,
//   total: 150,
//   totalPages: 8,
//   hasNext: true,
//   hasPrev: true,
//   offset: 20
// }

// Validate pagination params
const validated = PaginationUtils.validatePaginationParams(0, 200);
console.log(validated);
// { page: 1, limit: 100 }  // Corrected values
```

### Response Utils

```typescript
import { ResponseUtils } from './common';

// Success response
return ResponseUtils.success(data, 'User created successfully');

// Error response
return ResponseUtils.error('User not found', 'NOT_FOUND');

// Paginated response
return ResponseUtils.paginated(users, page, limit, total, 'Users retrieved');
```

## 📊 Constants

```typescript
import { APP_CONSTANTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from './common';

// Use constants
const maxLength = APP_CONSTANTS.MESSAGES.MAX_TEXT_LENGTH;
const minPasswordLength = APP_CONSTANTS.USERS.MIN_PASSWORD_LENGTH;

// Error messages
throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);

// Success messages
return { message: SUCCESS_MESSAGES.USER_CREATED };
```

## 🎯 Best Practices

### 1. Always Use Guards for Protection

```typescript
// ❌ BAD: No protection
@Controller('admin')
export class AdminController {
  @Delete('user/:id')
  deleteUser(@Param('id') id: string) {
    // Anyone can access!
  }
}

// ✅ GOOD: Proper guards
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Delete('user/:id')
  @Roles('admin')
  deleteUser(@Param('id') id: string) {
    // Only admin can access
  }
}
```

### 2. Cache Expensive Operations

```typescript
// ❌ BAD: No caching
@Get('stats')
async getStats() {
  return await this.calculateExpensiveStats();  // Slow!
}

// ✅ GOOD: With caching
@Get('stats')
@Cache({ key: 'app:stats', ttl: 600 })
async getStats() {
  return await this.calculateExpensiveStats();  // Cached for 10 min
}
```

### 3. Use Proper Rate Limiting

```typescript
// ❌ BAD: No rate limit on auth
@Post('login')
async login(@Body() dto: LoginDto) {
  // Vulnerable to brute force!
}

// ✅ GOOD: Strict rate limit
@Post('login')
@AuthThrottle()  // 5 requests per 15 minutes
async login(@Body() dto: LoginDto) {
  // Protected from brute force
}
```

### 4. Handle Errors Properly

```typescript
// ❌ BAD: Generic error
throw new Error('Something went wrong');

// ✅ GOOD: Specific exception
throw new UserNotFoundException(userId);
// or
throw new BusinessLogicException('Invalid operation', 'INVALID_OPERATION');
```

---

**Next:** [Guards Documentation →](./05-guards.md)

