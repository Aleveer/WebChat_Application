# Decorators

## Mục lục
- [Tổng quan](#tổng-quan)
- [Custom Decorators](#custom-decorators)
- [Throttle Decorators](#throttle-decorators)
- [Cache Decorators](#cache-decorators)
- [Best Practices](#best-practices)

---

### Phân loại Decorators

1. **Parameter Decorators**: Trích xuất dữ liệu từ request
2. **Method Decorators**: Thêm metadata cho methods
3. **Authorization Decorators**: Xác thực và phân quyền
4. **Caching Decorators**: Quản lý cache
5. **Rate Limiting Decorators**: Giới hạn request

---

## Custom Decorators

### 1. @CurrentUser

Lấy thông tin user hiện tại từ request.

**Sử dụng:**

```typescript
import { CurrentUser } from '@/common';

@Get('profile')
async getProfile(@CurrentUser() user: User) {
  // user chứa thông tin từ JWT payload
  return { id: user.id, email: user.email };
}
```

**Lưu ý:**
- Cần có JWT authentication middleware
- User được inject từ `request.user`

---

### 2. @CurrentUserId

Chỉ lấy user ID thay vì toàn bộ user object.

**Sử dụng:**

```typescript
import { CurrentUserId } from '@/common';

@Get('my-posts')
async getMyPosts(@CurrentUserId() userId: string) {
  return await this.postsService.findByUserId(userId);
}
```

**Lợi ích:**
- Đơn giản hóa code
- Type-safe với string
- Xử lý cả `id` và `_id` field

---

### 3. @ClientIP

Lấy địa chỉ IP của client.

**Sử dụng:**

```typescript
import { ClientIP } from '@/common';

@Post('login')
async login(
  @Body() loginDto: LoginDto,
  @ClientIP() ip: string
) {
  await this.authService.login(loginDto, ip);
  return { message: 'Login successful' };
}
```

**Nguồn IP:**
1. `request.ip`
2. `request.connection.remoteAddress`
3. `request.socket.remoteAddress`
4. Default: `'unknown'`

---

### 4. @UserAgent

Lấy User-Agent string từ request headers.

**Sử dụng:**

```typescript
import { UserAgent } from '@/common';

@Post('login')
async login(
  @Body() loginDto: LoginDto,
  @UserAgent() userAgent: string
) {
  // Log login activity with device info
  await this.auditService.logLogin(loginDto.email, userAgent);
  return await this.authService.login(loginDto);
}
```

---

### 5. @Pagination

Trích xuất và validate pagination parameters.

**Sử dụng:**

```typescript
import { Pagination } from '@/common';

@Get()
async findAll(
  @Pagination(['created_at', 'name', 'email']) 
  pagination: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
  }
) {
  return await this.service.findAll(pagination);
}
```

**Tham số:**
- `data`: Array của allowed sort fields
- Mặc định: `['created_at', 'updated_at', 'name', 'email']`

**Query Parameters:**
```
GET /api/users?page=2&limit=50&sortBy=created_at&sortOrder=desc
```

**Kết quả:**
```typescript
{
  page: 2,        // Min: 1
  limit: 50,      // Min: 1, Max: 100
  sortBy: 'created_at',
  sortOrder: 'desc'
}
```

---

### 6. @SearchQuery

Lấy search query từ query parameters.

**Sử dụng:**

```typescript
import { SearchQuery } from '@/common';

@Get('search')
async search(
  @SearchQuery() query: string,
  @Pagination() pagination: any
) {
  return await this.service.search(query, pagination);
}
```

**Query:**
```
GET /api/users/search?q=john&page=1
```

---

### 7. @RequestId

Lấy request ID từ headers hoặc auto-generated.

**Sử dụng:**

```typescript
import { RequestId } from '@/common';

@Post()
async create(
  @Body() createDto: CreateDto,
  @RequestId() requestId: string
) {
  this.logger.log(`Creating resource - Request ID: ${requestId}`);
  return await this.service.create(createDto);
}
```

**Headers được kiểm tra:**
1. `x-request-id`
2. `x-correlation-id`
3. Default: `'unknown'`

---

### 8. @Language

Lấy ngôn ngữ từ `Accept-Language` header.

**Sử dụng:**

```typescript
import { Language } from '@/common';

@Get('content')
async getContent(@Language() language: string) {
  return await this.contentService.getByLanguage(language);
}
```

**Header:**
```
Accept-Language: vi-VN
```

---

### 9. @Timezone

Lấy timezone từ custom header.

**Sử dụng:**

```typescript
import { Timezone } from '@/common';

@Get('schedule')
async getSchedule(@Timezone() timezone: string) {
  return await this.scheduleService.getByTimezone(timezone);
}
```

**Header:**
```
X-Timezone: Asia/Ho_Chi_Minh
```

---

## Authorization Decorators

### 1. @Public

Đánh dấu endpoint là public (bypass authentication).

**Sử dụng:**

```typescript
import { Public } from '@/common';

@Get('health')
@Public()
async healthCheck() {
  return { status: 'ok' };
}
```

**Lưu ý:**
- Bypass JwtAuthGuard
- Sử dụng cho login, register, health check endpoints

---

### 2. @Roles

Yêu cầu user phải có một trong các roles được chỉ định.

**Sử dụng:**

```typescript
import { Roles } from '@/common';

@Get('admin/users')
@Roles('admin', 'super-admin')
async getAllUsers() {
  return await this.usersService.findAll();
}
```

**Metadata:**
- Key: `'roles'`
- Value: `string[]`

**Guard:**
- Sử dụng với `RolesGuard`
- Kiểm tra `user.role` với required roles

---

### 3. @Permissions

Yêu cầu user phải có ít nhất một permission.

**Sử dụng:**

```typescript
import { Permissions } from '@/common';

@Delete(':id')
@Permissions('users:delete', 'admin:all')
async deleteUser(@Param('id') id: string) {
  return await this.usersService.remove(id);
}
```

**Metadata:**
- Key: `'permissions'`
- Value: `string[]`

**Guard:**
- Sử dụng với `PermissionsGuard`
- Kiểm tra `user.permissions` array

---

### 4. @RateLimit

Custom rate limiting cho endpoint cụ thể.

**Sử dụng:**

```typescript
import { RateLimit } from '@/common';

@Post('send-email')
@RateLimit(5, 60000) // 5 requests per 60 seconds
async sendEmail(@Body() emailDto: EmailDto) {
  return await this.emailService.send(emailDto);
}
```

**Tham số:**
- `limit`: Số lượng requests tối đa
- `windowMs`: Thời gian window (milliseconds)

---

### 5. @ValidationGroups

Chỉ định validation groups cho endpoint.

**Sử dụng:**

```typescript
import { ValidationGroups } from '@/common';

@Post()
@ValidationGroups('create', 'basic')
async create(@Body() createDto: CreateUserDto) {
  return await this.service.create(createDto);
}

@Put(':id')
@ValidationGroups('update', 'basic')
async update(
  @Param('id') id: string,
  @Body() updateDto: UpdateUserDto
) {
  return await this.service.update(id, updateDto);
}
```

---

## Advanced Decorators

### 1. @ApiVersion

Đánh dấu API version cho endpoint.

**Sử dụng:**

```typescript
import { ApiVersion } from '@/common';

@Get('users')
@ApiVersion('v1')
async getUsersV1() {
  return await this.service.findAllV1();
}

@Get('users')
@ApiVersion('v2')
async getUsersV2() {
  return await this.service.findAllV2();
}
```

---

### 2. @Deprecated

Đánh dấu endpoint là deprecated với warning message.

**Sử dụng:**

```typescript
import { Deprecated } from '@/common';

@Get('old-endpoint')
@Deprecated('This endpoint is deprecated. Use /api/v2/new-endpoint instead')
async oldEndpoint() {
  return await this.service.legacyMethod();
}
```

---

### 3. @FileUpload

Metadata cho file upload endpoints.

**Sử dụng:**

```typescript
import { FileUpload } from '@/common';

@Post('upload')
@UseInterceptors(FileInterceptor('file'))
@FileUpload('file', 5 * 1024 * 1024) // 5MB
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  return await this.fileService.upload(file);
}
```

**Tham số:**
- `fieldName`: Tên field trong form-data
- `maxSize`: Kích thước tối đa (bytes)

---

### 4. @TransformResponse

Custom response transformer.

**Sử dụng:**

```typescript
import { TransformResponse } from '@/common';

@Get(':id')
@TransformResponse((data) => ({
  user: data,
  _links: {
    self: `/api/users/${data.id}`,
    posts: `/api/users/${data.id}/posts`
  }
}))
async findOne(@Param('id') id: string) {
  return await this.service.findById(id);
}
```

---

### 5. @ApiExample

Thêm example data cho Swagger documentation.

**Sử dụng:**

```typescript
import { ApiExample } from '@/common';

@Post()
@ApiExample({
  email: 'user@example.com',
  password: 'SecurePass123!',
  name: 'John Doe'
})
async create(@Body() createDto: CreateUserDto) {
  return await this.service.create(createDto);
}
```

---

## Throttle Decorators

### 1. @Throttle

Rate limiting với custom configuration.

**Sử dụng:**

```typescript
import { Throttle } from '@/common';

@Post('login')
@Throttle(5, 60000) // 5 requests per minute
async login(@Body() loginDto: LoginDto) {
  return await this.authService.login(loginDto);
}
```

**Mặc định:**
- `limit`: 100 requests
- `ttl`: 60000ms (1 phút)

---

### 2. @StrictThrottle

Rate limiting nghiêm ngặt (10 requests/minute).

**Sử dụng:**

```typescript
import { StrictThrottle } from '@/common';

@Post('password-reset')
@StrictThrottle()
async resetPassword(@Body() dto: ResetPasswordDto) {
  return await this.authService.resetPassword(dto);
}
```

**Mặc định:**
- `limit`: 10 requests
- `ttl`: 60000ms

---

### 3. @RelaxedThrottle

Rate limiting lỏng lẻo (300 requests/minute).

**Sử dụng:**

```typescript
import { RelaxedThrottle } from '@/common';

@Get('public/posts')
@RelaxedThrottle()
async getPublicPosts() {
  return await this.postsService.findPublic();
}
```

**Mặc định:**
- `limit`: 300 requests
- `ttl`: 60000ms

---

### 4. @AuthThrottle

Rate limiting cho authentication endpoints (5 requests/15 minutes).

**Sử dụng:**

```typescript
import { AuthThrottle } from '@/common';

@Post('login')
@AuthThrottle()
async login(@Body() loginDto: LoginDto) {
  return await this.authService.login(loginDto);
}
```

**Mặc định:**
- `limit`: 5 requests
- `ttl`: 900000ms (15 phút)

---

### 5. @UploadThrottle

Rate limiting cho file upload (10 uploads/hour).

**Sử dụng:**

```typescript
import { UploadThrottle } from '@/common';

@Post('upload')
@UploadThrottle()
@UseInterceptors(FileInterceptor('file'))
async upload(@UploadedFile() file: Express.Multer.File) {
  return await this.fileService.upload(file);
}
```

**Mặc định:**
- `limit`: 10 requests
- `ttl`: 3600000ms (1 giờ)

---

### 6. @ApiThrottle

Rate limiting cho API endpoints (50 requests/minute).

**Sử dụng:**

```typescript
import { ApiThrottle } from '@/common';

@Get('data')
@ApiThrottle()
async getData() {
  return await this.service.getData();
}
```

**Mặc định:**
- `limit`: 50 requests
- `ttl`: 60000ms

---

### 7. @SkipThrottle

Bỏ qua rate limiting cho endpoint.

**Sử dụng:**

```typescript
import { SkipThrottle } from '@/common';

@Get('health')
@SkipThrottle()
async healthCheck() {
  return { status: 'ok' };
}
```

---

## Cache Decorators

### 1. @Cache

Caching với custom configuration.

**Sử dụng:**

```typescript
import { Cache } from '@/common';

@Get(':id')
@Cache({ key: 'user', ttl: 3600 })
async findOne(@Param('id') id: string) {
  return await this.service.findById(id);
}
```

**Options:**
- `key`: Cache key prefix
- `ttl`: Time to live (seconds)

---

### 2. @ShortCache

Short-term caching (5 minutes).

**Sử dụng:**

```typescript
import { ShortCache } from '@/common';

@Get('trending')
@ShortCache('trending-posts')
async getTrendingPosts() {
  return await this.postsService.findTrending();
}
```

**TTL:** 300 seconds (5 phút)

---

### 3. @MediumCache

Medium-term caching (1 hour).

**Sử dụng:**

```typescript
import { MediumCache } from '@/common';

@Get('categories')
@MediumCache('categories')
async getCategories() {
  return await this.categoriesService.findAll();
}
```

**TTL:** 3600 seconds (1 giờ)

---

### 4. @LongCache

Long-term caching (24 hours).

**Sử dụng:**

```typescript
import { LongCache } from '@/common';

@Get('config')
@LongCache('app-config')
async getConfig() {
  return await this.configService.getPublicConfig();
}
```

**TTL:** 86400 seconds (24 giờ)

---

### 5. @UserCache

Caching theo user (30 minutes).

**Sử dụng:**

```typescript
import { UserCache } from '@/common';

@Get('profile')
@UserCache(1800)
async getProfile(@CurrentUserId() userId: string) {
  return await this.usersService.findById(userId);
}
```

**Cache Key:** Tự động include user ID

---

### 6. @QueryCache

Caching cho query results (15 minutes).

**Sử dụng:**

```typescript
import { QueryCache } from '@/common';

@Get('search')
@QueryCache(900)
async search(@Query('q') query: string) {
  return await this.searchService.search(query);
}
```

**Cache Key:** Tự động include query params

---

### 7. @NoCache

Disable caching cho endpoint.

**Sử dụng:**

```typescript
import { NoCache } from '@/common';

@Get('real-time-data')
@NoCache()
async getRealTimeData() {
  return await this.service.getLiveData();
}
```

---

## Best Practices

### 1. Kết hợp Multiple Decorators

```typescript
import { 
  Roles, 
  Throttle, 
  MediumCache,
  CurrentUser 
} from '@/common';

@Get('admin/stats')
@Roles('admin')
@Throttle(10, 60000)
@MediumCache('admin-stats')
async getAdminStats(@CurrentUser() user: User) {
  return await this.statsService.getAdminStats();
}
```

---

### 2. Thứ tự Decorators

Thứ tự quan trọng! Đặt decorators theo thứ tự từ trên xuống:

```typescript
@Get('protected-data')
@Public()                    // 1. Authentication
@Roles('admin')             // 2. Authorization
@Throttle(10, 60000)        // 3. Rate limiting
@MediumCache()              // 4. Caching
@ApiVersion('v1')           // 5. Versioning
async getData() {
  // ...
}
```

---

### 3. Custom Decorators

Tạo custom decorator cho business logic:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentCompany = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return user?.company;
  },
);

// Sử dụng
@Get('company-data')
async getCompanyData(@CurrentCompany() company: Company) {
  return await this.service.getByCompany(company.id);
}
```

---

### 4. Type-Safe Decorators

```typescript
export const TypedQuery = <T>() =>
  createParamDecorator((data: keyof T, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.query[data] : request.query;
  })();

// Sử dụng
interface SearchQuery {
  q: string;
  category: string;
}

@Get('search')
async search(@TypedQuery<SearchQuery>() query: SearchQuery) {
  return await this.service.search(query);
}
```

---

### 5. Conditional Decorators

```typescript
import { applyDecorators } from '@nestjs/common';

export function ProtectedEndpoint(roles?: string[]) {
  const decorators = [
    AuthThrottle(),
    MediumCache()
  ];

  if (roles && roles.length > 0) {
    decorators.push(Roles(...roles));
  }

  return applyDecorators(...decorators);
}

// Sử dụng
@Get('data')
@ProtectedEndpoint(['admin', 'moderator'])
async getData() {
  return await this.service.getData();
}
```

---

### 6. Decorator với Validation

```typescript
export function ValidatedBody<T>(dtoClass: Type<T>) {
  return applyDecorators(
    Body(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })),
  );
}

// Sử dụng
@Post()
async create(@ValidatedBody(CreateUserDto) dto: CreateUserDto) {
  return await this.service.create(dto);
}
```

---

## Ví dụ Thực tế

### Authentication & Authorization

```typescript
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param 
} from '@nestjs/common';
import {
  Public,
  Roles,
  Permissions,
  CurrentUser,
  CurrentUserId,
  AuthThrottle,
  Throttle,
} from '@/common';

@Controller('users')
export class UsersController {
  // Public endpoint
  @Get('public')
  @Public()
  async getPublicUsers() {
    return await this.service.findPublic();
  }

  // Authenticated users only
  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    return user;
  }

  // Admin only
  @Get('admin')
  @Roles('admin')
  async getAdminData() {
    return await this.service.getAdminData();
  }

  // Permission-based
  @Delete(':id')
  @Permissions('users:delete')
  async delete(@Param('id') id: string) {
    return await this.service.delete(id);
  }

  // Rate limited login
  @Post('login')
  @Public()
  @AuthThrottle()
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }
}
```

---

### Caching Strategy

```typescript
import { 
  Controller, 
  Get, 
  Param, 
  Query 
} from '@nestjs/common';
import {
  ShortCache,
  MediumCache,
  LongCache,
  NoCache,
  CurrentUserId,
} from '@/common';

@Controller('content')
export class ContentController {
  // Static content - long cache
  @Get('config')
  @LongCache('app-config')
  async getConfig() {
    return await this.service.getConfig();
  }

  // Category list - medium cache
  @Get('categories')
  @MediumCache('categories')
  async getCategories() {
    return await this.service.getCategories();
  }

  // Trending - short cache
  @Get('trending')
  @ShortCache('trending')
  async getTrending() {
    return await this.service.getTrending();
  }

  // User-specific - user cache
  @Get('recommendations')
  @UserCache(900)
  async getRecommendations(@CurrentUserId() userId: string) {
    return await this.service.getRecommendations(userId);
  }

  // Real-time - no cache
  @Get('live')
  @NoCache()
  async getLiveData() {
    return await this.service.getLiveData();
  }
}
```

---

## Tham khảo

- [NestJS Custom Decorators](https://docs.nestjs.com/custom-decorators)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [Metadata Reflection](https://www.npmjs.com/package/reflect-metadata)
- 