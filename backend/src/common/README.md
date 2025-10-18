# Common Shared Utilities

Thư mục `common` chứa tất cả các shared utilities, guards, interceptors, filters, decorators, DTOs và constants được sử dụng chung trong toàn bộ ứng dụng WebChat.

## 📁 Cấu trúc thư mục

```
src/common/
├── constants/           # Application constants
│   └── app.constants.ts
├── dto/                 # Common DTOs
│   └── common.dto.ts
├── decorators/          # Custom decorators
│   └── custom.decorators.ts
├── guards/              # Authentication & Authorization guards
│   └── auth.guards.ts
├── interceptors/        # Request/Response interceptors
│   └── common.interceptors.ts
├── filters/             # Exception filters
│   └── exception.filters.ts
├── utils/               # Utility functions
│   └── common.utils.ts
├── services/            # Shared services
│   └── shared.services.ts
├── common.module.ts     # Common module
└── index.ts            # Export file
```

## 🔧 Constants

### App Constants (`constants/app.constants.ts`)

```typescript
import { APP_CONSTANTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/common';

// Sử dụng constants
const maxMessageLength = APP_CONSTANTS.MESSAGES.MAX_TEXT_LENGTH;
const errorMessage = ERROR_MESSAGES.USER_NOT_FOUND;
const successMessage = SUCCESS_MESSAGES.USER_CREATED;
```

**Các constants chính:**
- `APP_CONSTANTS`: Cấu hình ứng dụng (database, messages, users, groups, etc.)
- `ERROR_MESSAGES`: Thông báo lỗi chuẩn
- `SUCCESS_MESSAGES`: Thông báo thành công chuẩn
- `RECEIVER_TYPES`: Loại người nhận tin nhắn
- `USER_ROLES`: Vai trò người dùng

## 📝 DTOs

### Common DTOs (`dto/common.dto.ts`)

```typescript
import { 
  BaseResponseDto, 
  PaginationDto, 
  SearchDto,
  ApiResponseDto 
} from '@/common';

// Response chuẩn
const response = BaseResponseDto.success(data, 'Operation successful');

// Pagination
const paginationDto = new PaginationDto();
paginationDto.page = 1;
paginationDto.limit = 20;

// Search với pagination
const searchDto = new SearchDto();
searchDto.q = 'search term';
searchDto.page = 1;
searchDto.limit = 10;
```

**Các DTOs chính:**
- `BaseResponseDto`: Response format chuẩn
- `PaginationDto`: Phân trang
- `PaginatedResponseDto`: Response có phân trang
- `SearchDto`: Tìm kiếm với phân trang
- `ApiResponseDto`: API response format

## 🎯 Decorators

### Custom Decorators (`decorators/custom.decorators.ts`)

```typescript
import { 
  CurrentUser, 
  CurrentUserId, 
  Pagination,
  Roles,
  Public 
} from '@/common';

@Controller('users')
export class UsersController {
  @Get('profile')
  @Roles('user', 'admin')
  async getProfile(@CurrentUser() user: any) {
    return user;
  }

  @Get()
  @Public()
  async findAll(@Pagination() pagination: any) {
    return this.usersService.findAll(pagination);
  }

  @Post()
  async create(@Body() dto: CreateUserDto, @CurrentUserId() userId: string) {
    return this.usersService.create(dto, userId);
  }
}
```

**Các decorators chính:**
- `@CurrentUser()`: Lấy user hiện tại từ request
- `@CurrentUserId()`: Lấy user ID hiện tại
- `@Pagination()`: Lấy thông tin phân trang
- `@Roles(...roles)`: Kiểm tra quyền
- `@Public()`: Bỏ qua authentication
- `@RateLimit(limit, windowMs)`: Giới hạn request

## 🛡️ Guards

### Authentication Guards (`guards/auth.guards.ts`)

```typescript
import { 
  AuthGuard, 
  JwtAuthGuard, 
  RolesGuard,
  GroupMemberGuard 
} from '@/common';

@Controller('groups')
@UseGuards(AuthGuard, RolesGuard)
export class GroupsController {
  @Post()
  @Roles('user')
  async create(@Body() dto: CreateGroupDto) {
    // Only authenticated users with 'user' role
  }

  @Get(':id/messages')
  @UseGuards(GroupMemberGuard)
  async getMessages(@Param('id') groupId: string) {
    // Only group members can access
  }
}
```

**Các guards chính:**
- `AuthGuard`: Kiểm tra authentication cơ bản
- `JwtAuthGuard`: Kiểm tra JWT token
- `RolesGuard`: Kiểm tra quyền người dùng
- `PermissionsGuard`: Kiểm tra permissions
- `GroupMemberGuard`: Kiểm tra thành viên nhóm
- `GroupAdminGuard`: Kiểm tra admin nhóm
- `MessageOwnerGuard`: Kiểm tra chủ sở hữu tin nhắn

## 🔄 Interceptors

### Common Interceptors (`interceptors/common.interceptors.ts`)

```typescript
import { 
  LoggingInterceptor,
  ResponseTransformInterceptor,
  CacheInterceptor,
  SecurityHeadersInterceptor 
} from '@/common';

@Controller('users')
@UseInterceptors(
  LoggingInterceptor,
  ResponseTransformInterceptor,
  SecurityHeadersInterceptor
)
export class UsersController {
  @Get()
  @UseInterceptors(CacheInterceptor)
  async findAll() {
    // Response sẽ được cache và log
  }
}
```

**Các interceptors chính:**
- `LoggingInterceptor`: Log request/response
- `ResponseTransformInterceptor`: Chuẩn hóa response format
- `CacheInterceptor`: Cache response
- `PerformanceInterceptor`: Theo dõi performance
- `RequestIdInterceptor`: Thêm request ID
- `SecurityHeadersInterceptor`: Thêm security headers

## 🚨 Filters

### Exception Filters (`filters/exception.filters.ts`)

```typescript
import { 
  GlobalExceptionFilter,
  HttpExceptionFilter,
  ValidationExceptionFilter 
} from '@/common';

// Trong main.ts
app.useGlobalFilters(
  new GlobalExceptionFilter(),
  new HttpExceptionFilter(),
  new ValidationExceptionFilter()
);
```

**Các filters chính:**
- `GlobalExceptionFilter`: Xử lý tất cả exceptions
- `HttpExceptionFilter`: Xử lý HTTP exceptions
- `ValidationExceptionFilter`: Xử lý validation errors
- `DatabaseExceptionFilter`: Xử lý database errors
- `RateLimitExceptionFilter`: Xử lý rate limit errors

## 🛠️ Utilities

### Common Utilities (`utils/common.utils.ts`)

```typescript
import { 
  ValidationUtils,
  PasswordUtils,
  StringUtils,
  DateUtils,
  ArrayUtils,
  PaginationUtils 
} from '@/common';

// Validation
const isValid = ValidationUtils.isValidPhoneNumber('+84901234567');
const sanitized = ValidationUtils.sanitizeString('<script>alert("xss")</script>');

// Password
const hashedPassword = await PasswordUtils.hashPassword('password123');
const isValidPassword = await PasswordUtils.comparePassword('password123', hashedPassword);

// String manipulation
const capitalized = StringUtils.capitalizeWords('hello world');
const slug = StringUtils.slugify('Hello World!');
const masked = StringUtils.maskPhoneNumber('+84901234567');

// Date operations
const tomorrow = DateUtils.addDays(new Date(), 1);
const timeAgo = DateUtils.getTimeAgo(new Date(Date.now() - 3600000));

// Array operations
const unique = ArrayUtils.unique([1, 2, 2, 3]);
const chunked = ArrayUtils.chunk([1, 2, 3, 4, 5], 2);

// Pagination
const pagination = PaginationUtils.calculatePagination(1, 20, 100);
```

**Các utility classes chính:**
- `ValidationUtils`: Validation functions
- `PasswordUtils`: Password hashing/comparison
- `StringUtils`: String manipulation
- `DateUtils`: Date operations
- `ArrayUtils`: Array operations
- `ObjectUtils`: Object operations
- `PaginationUtils`: Pagination calculations
- `FileUtils`: File operations
- `ResponseUtils`: Response formatting

## 🔧 Services

### Shared Services (`services/shared.services.ts`)

```typescript
import { 
  CacheService,
  EmailService,
  NotificationService,
  AnalyticsService 
} from '@/common';

@Injectable()
export class UsersService {
  constructor(
    private cacheService: CacheService,
    private emailService: EmailService,
    private analyticsService: AnalyticsService,
  ) {}

  async create(dto: CreateUserDto) {
    // Cache user data
    this.cacheService.set(`user:${userId}`, userData, 3600000);
    
    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name);
    
    // Track analytics
    this.analyticsService.trackUserAction(userId, 'user_created');
    
    return user;
  }
}
```

**Các services chính:**
- `CacheService`: In-memory caching
- `EmailService`: Email sending
- `NotificationService`: Push notifications
- `FileUploadService`: File upload handling
- `AnalyticsService`: Event tracking
- `HealthCheckService`: Health monitoring

## 📦 Sử dụng trong Module

```typescript
import { Module } from '@nestjs/common';
import { CommonModule } from '@/common';

@Module({
  imports: [CommonModule],
  // ... other imports
})
export class AppModule {}
```

## 🚀 Best Practices

### 1. Sử dụng Constants
```typescript
// ✅ Good
if (message.length > APP_CONSTANTS.MESSAGES.MAX_TEXT_LENGTH) {
  throw new BadRequestException(ERROR_MESSAGES.MESSAGE_TOO_LONG);
}

// ❌ Bad
if (message.length > 1000) {
  throw new BadRequestException('Message is too long');
}
```

### 2. Sử dụng Response Utils
```typescript
// ✅ Good
return ResponseUtils.success(user, SUCCESS_MESSAGES.USER_CREATED);

// ❌ Bad
return {
  success: true,
  data: user,
  message: 'User created successfully',
  timestamp: new Date().toISOString(),
};
```

### 3. Sử dụng Guards
```typescript
// ✅ Good
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
async deleteUser(@Param('id') id: string) {
  // Only admins can delete users
}

// ❌ Bad
async deleteUser(@Param('id') id: string, @CurrentUser() user: any) {
  if (!user || user.role !== 'admin') {
    throw new ForbiddenException();
  }
  // ...
}
```

### 4. Sử dụng Interceptors
```typescript
// ✅ Good
@UseInterceptors(LoggingInterceptor, ResponseTransformInterceptor)
@Controller('users')
export class UsersController {
  // All responses will be logged and transformed
}

// ❌ Bad
@Controller('users')
export class UsersController {
  @Get()
  async findAll() {
    // Manual logging and transformation in each method
  }
}
```

## 🔍 Debugging

### Enable Debug Logging
```typescript
// Trong main.ts
import { Logger } from '@nestjs/common';

const logger = new Logger('Application');
logger.debug('Debug mode enabled');
```

### Health Check
```typescript
// Health check endpoint
@Get('health')
async healthCheck() {
  return this.healthCheckService.getOverallHealth();
}
```

Tất cả các shared utilities này giúp bạn xây dựng ứng dụng WebChat một cách nhất quán, bảo mật và dễ bảo trì!
