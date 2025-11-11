# 🚨 Exception Filters - Xử Lý Lỗi

## 📋 Tổng Quan

Exception Filters trong NestJS được sử dụng để catch và handle exceptions, format error responses theo chuẩn nhất quán. WebChat Backend implement 7 exception filters chuyên biệt.

## 🎯 Danh Sách Exception Filters

```
Exception Filters (theo thứ tự ưu tiên)
├── ValidationExceptionFilter        # Validation errors (400)
├── RateLimitExceptionFilter        # Rate limit exceeded (429)
├── TimeoutExceptionFilter          # Request timeout (408)
├── DatabaseExceptionFilter         # MongoDB errors
├── BusinessLogicExceptionFilter    # Business logic errors
├── HttpExceptionFilter             # HTTP exceptions
└── GlobalExceptionFilter           # Catch-all (500)
```

## ✅ 1. ValidationExceptionFilter

### Mục Đích
Handle validation errors từ `class-validator` và format thành response user-friendly.

### Catches
- `BadRequestException` với validation errors
- DTO validation failures
- Pipe validation failures

### Implementation

```typescript
@Catch(BadRequestException)
export class ValidationExceptionFilter extends BaseExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const exceptionResponse = exception.getResponse();

    let message = 'Validation failed';
    let errors: ValidationErrorDto[] = [];

    if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as Record<string, unknown>;
      message = (responseObj.message as string) || message;

      // Extract validation errors
      if (Array.isArray(responseObj.message)) {
        errors = (responseObj.message as Array<Record<string, unknown>>).map(
          (error) =>
            new ValidationErrorDto(
              (error.property as string) || '',
              Object.values(error.constraints || {}).join(', '),
              error.value,
            ),
        );
      }
    }

    const errorResponse = this.createErrorResponse(
      'VALIDATION_ERROR',
      message,
      request,
      errors,
    );

    this.logger.warn(
      `Validation Error: ${message} - ${request.method} ${request.url}`,
    );

    response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    {
      "field": "phone",
      "message": "phone must be a valid phone number",
      "value": "invalid-phone"
    },
    {
      "field": "password",
      "message": "password must be at least 8 characters",
      "value": "short"
    }
  ],
  "timestamp": "2025-10-29 10:00:00",
  "path": "/api/auth/register",
  "method": "POST",
  "requestId": "req_1234567890_abc123"
}
```

### Example

```typescript
// DTO with validation
export class CreateUserDto {
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

// Request với invalid data
POST /api/users
{
  "phone": "invalid",
  "password": "weak",
  "email": "not-an-email"
}

// Response từ ValidationExceptionFilter
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
      "message": "password must be at least 8 characters, password must match..."
    },
    {
      "field": "email",
      "message": "email must be an email"
    }
  ]
}
```

## ⏱️ 2. RateLimitExceptionFilter

### Mục Đích
Handle rate limit exceeded errors và provide retry information.

### Catches
- `ThrottlerException` từ `@nestjs/throttler`

### Implementation

```typescript
@Catch(ThrottlerException)
export class RateLimitExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.createErrorResponse(
      'RATE_LIMIT_EXCEEDED',
      'Too many requests, please try again later',
      request,
      {
        message: exception.message,
        throttlerMessage: exception.getResponse(),
      },
      60,  // Retry after 60 seconds
    );

    this.logger.warn(
      `Rate Limit Exceeded: ${request.method} ${request.url} - IP: ${request.ip} - User: ${(request.user as any)?.id || 'anonymous'}`,
    );

    // Set rate limit headers
    response.setHeader('Retry-After', '60');
    response.setHeader('X-RateLimit-Limit', '100');
    response.setHeader('X-RateLimit-Remaining', '0');
    response.setHeader('X-RateLimit-Reset', String(Date.now() + 60000));

    response.status(HttpStatus.TOO_MANY_REQUESTS).json(errorResponse);
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests, please try again later",
  "details": {
    "message": "ThrottlerException: Too Many Requests",
    "throttlerMessage": { ... }
  },
  "timestamp": "2025-10-29 10:00:00",
  "path": "/api/messages",
  "method": "POST",
  "requestId": "req_1234567890_abc123",
  "retryAfter": 60
}
```

### Response Headers

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1698567950123
```

## ⏰ 3. TimeoutExceptionFilter

### Mục Đích
Handle request timeout errors.

### Catches
- Exceptions với message chứa "timeout"

### Implementation

```typescript
@Catch()
export class TimeoutExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TimeoutExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Check if it's a timeout error
    if (exception.message && exception.message.includes('timeout')) {
      const errorResponse = {
        success: false,
        error: 'REQUEST_TIMEOUT',
        message: 'Request timeout, please try again',
        timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        path: request.url,
        method: request.method,
        requestId: request.requestId || 'unknown',
      };

      this.logger.warn(`Request Timeout: ${request.method} ${request.url}`);
      
      response.status(HttpStatus.REQUEST_TIMEOUT).json(errorResponse);
      return;
    }

    // Not a timeout error, pass to next filter
    throw exception;
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "REQUEST_TIMEOUT",
  "message": "Request timeout, please try again",
  "timestamp": "2025-10-29 10:00:00",
  "path": "/api/heavy-operation",
  "method": "POST",
  "requestId": "req_1234567890_abc123"
}
```

## 🗄️ 4. DatabaseExceptionFilter

### Mục Đích
Handle MongoDB-specific errors và translate thành user-friendly messages.

### Catches
- `MongoError` from MongoDB driver
- Duplicate key errors (11000)
- Validation errors (121)
- Cast errors

### Implementation

```typescript
@Catch(MongoError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  catch(exception: MongoError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.BAD_REQUEST;
    let message = 'Database operation failed';
    let error = 'DATABASE_ERROR';

    if (exception instanceof MongoError) {
      switch (exception.code) {
        case 11000:
          status = HttpStatus.CONFLICT;
          message = 'Duplicate entry found';
          error = 'DUPLICATE_ENTRY';
          break;
        
        case 121:
          status = HttpStatus.BAD_REQUEST;
          message = 'Document validation failed';
          error = 'VALIDATION_ERROR';
          break;
        
        default:
          message = 'Database operation failed';
      }
    }

    const errorResponse = {
      success: false,
      error,
      message,
      details: exception.message,
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      path: request.url,
      method: request.method,
      requestId: request.requestId || 'unknown',
    };

    this.logger.error(
      `Database Error: ${error} - ${message} - ${request.method} ${request.url}`,
      exception.stack,
    );

    response.status(status).json(errorResponse);
  }
}
```

### Error Examples

```json
// Duplicate key error (11000)
{
  "success": false,
  "error": "DUPLICATE_ENTRY",
  "message": "Duplicate entry found",
  "details": "E11000 duplicate key error collection: webchat.users index: phone_1 dup key: { phone: \"+84901234567\" }",
  "timestamp": "2025-10-29 10:00:00",
  "path": "/api/users",
  "method": "POST",
  "requestId": "req_1234567890_abc123"
}

// Validation error (121)
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Document validation failed",
  "details": "Document failed validation",
  "timestamp": "2025-10-29 10:00:00",
  "path": "/api/users",
  "method": "POST",
  "requestId": "req_1234567890_abc123"
}
```

## 💼 5. BusinessLogicExceptionFilter

### Mục Đích
Handle custom business logic exceptions.

### Catches
- Custom exceptions với `isBusinessError` flag

### Implementation

```typescript
@Catch()
export class BusinessLogicExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BusinessLogicExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Check if it's a business logic error
    if (exception.isBusinessError) {
      const errorResponse = {
        success: false,
        error: exception.errorCode || 'BUSINESS_ERROR',
        message: exception.message,
        details: exception.details,
        timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        path: request.url,
        method: request.method,
        requestId: request.requestId || 'unknown',
      };

      this.logger.warn(
        `Business Logic Error: ${exception.errorCode} - ${exception.message} - ${request.method} ${request.url}`,
      );

      response
        .status(exception.status || HttpStatus.BAD_REQUEST)
        .json(errorResponse);
      
      return;
    }

    // Not a business error, pass to next filter
    throw exception;
  }
}
```

### Custom Business Exception

```typescript
export class BusinessLogicException extends BadRequestException {
  public readonly isBusinessError = true;
  public readonly errorCode: string;
  public readonly details?: any;

  constructor(
    message: string,
    errorCode: string,
    details?: any,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ message, errorCode, isBusinessError: true, details });
    this.errorCode = errorCode;
    this.details = details;
    this.status = status;
  }
}

// Usage
throw new BusinessLogicException(
  'Cannot delete admin user',
  'ADMIN_DELETE_FORBIDDEN',
  { userId: user.id, role: user.role },
);
```

### Error Response Format

```json
{
  "success": false,
  "error": "ADMIN_DELETE_FORBIDDEN",
  "message": "Cannot delete admin user",
  "details": {
    "userId": "507f1f77bcf86cd799439011",
    "role": "admin"
  },
  "timestamp": "2025-10-29 10:00:00",
  "path": "/api/users/507f1f77bcf86cd799439011",
  "method": "DELETE",
  "requestId": "req_1234567890_abc123"
}
```

## 🌐 6. HttpExceptionFilter

### Mục Đích
Handle tất cả standard HTTP exceptions từ NestJS.

### Catches
- `HttpException` và các subclasses
- `NotFoundException`
- `UnauthorizedException`
- `ForbiddenException`
- etc.

### Implementation

```typescript
@Catch(HttpException)
export class HttpExceptionFilter extends BaseExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = this.getHttpStatusText(status);
    let details: unknown = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const responseObj = exceptionResponse as Record<string, unknown>;
      message =
        (responseObj.message as string) || this.getHttpStatusText(status);
      details = responseObj.details;
    }

    const error: ErrorCode = this.getErrorCode(status) as ErrorCode;
    
    const errorResponse = this.createErrorResponse(
      error,
      message,
      request,
      details,
    );

    this.logger.warn(
      `HTTP Exception: ${status} - ${message} - ${request.method} ${request.url}`,
    );

    response.status(status).json(errorResponse);
  }

  private getHttpStatusText(status: number): string {
    return this.getErrorCode(status);
  }
}
```

### Common HTTP Exceptions

```typescript
// 400 Bad Request
throw new BadRequestException('Invalid input data');

// 401 Unauthorized
throw new UnauthorizedException('Invalid credentials');

// 403 Forbidden
throw new ForbiddenException('Access denied');

// 404 Not Found
throw new NotFoundException('User not found');

// 409 Conflict
throw new ConflictException('Email already exists');

// 500 Internal Server Error
throw new InternalServerErrorException('Something went wrong');
```

### Error Response Examples

```json
// 404 Not Found
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "User not found",
  "timestamp": "2025-10-29 10:00:00",
  "path": "/api/users/123",
  "method": "GET",
  "requestId": "req_1234567890_abc123"
}

// 401 Unauthorized
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Invalid credentials",
  "timestamp": "2025-10-29 10:00:00",
  "path": "/api/auth/login",
  "method": "POST",
  "requestId": "req_1234567890_abc123"
}

// 403 Forbidden
{
  "success": false,
  "error": "FORBIDDEN",
  "message": "Access denied",
  "timestamp": "2025-10-29 10:00:00",
  "path": "/api/admin/users",
  "method": "DELETE",
  "requestId": "req_1234567890_abc123"
}
```

## 🌍 7. GlobalExceptionFilter

### Mục Đích
Catch-all filter để handle tất cả unhandled exceptions.

### Catches
- Tất cả exceptions không được catch bởi filters khác
- Unknown errors
- System errors

### Implementation

```typescript
@Catch()
export class GlobalExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error: ErrorCode = ERROR_CODES.INTERNAL_ERROR;
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || exception.message;
        details = responseObj.details;
      }
      
      error = this.getErrorCode(status) as ErrorCode;
    } else if (exception instanceof MongoError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database operation failed';
      error = ERROR_CODES.DATABASE_ERROR;
      details = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
      error = ERROR_CODES.UNKNOWN_ERROR;
    }

    const errorResponse = this.createErrorResponse(
      error,
      message,
      request,
      details,
    );

    this.logger.error(
      `Exception: ${error} - ${message} - ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(errorResponse);
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "INTERNAL_ERROR",
  "message": "Internal server error",
  "details": null,
  "timestamp": "2025-10-29 10:00:00",
  "path": "/api/endpoint",
  "method": "POST",
  "requestId": "req_1234567890_abc123"
}
```

## 🎯 Filter Priority & Execution Order

```
Exception thrown
    │
    ▼
┌─────────────────────────────────────────┐
│ Is BadRequestException with validation? │
│ └─► YES: ValidationExceptionFilter      │
└────────────┬────────────────────────────┘
             │ NO
             ▼
┌─────────────────────────────────────────┐
│ Is ThrottlerException?                  │
│ └─► YES: RateLimitExceptionFilter       │
└────────────┬────────────────────────────┘
             │ NO
             ▼
┌─────────────────────────────────────────┐
│ Message contains "timeout"?             │
│ └─► YES: TimeoutExceptionFilter         │
└────────────┬────────────────────────────┘
             │ NO
             ▼
┌─────────────────────────────────────────┐
│ Is MongoError?                          │
│ └─► YES: DatabaseExceptionFilter        │
└────────────┬────────────────────────────┘
             │ NO
             ▼
┌─────────────────────────────────────────┐
│ Has isBusinessError flag?               │
│ └─► YES: BusinessLogicExceptionFilter   │
└────────────┬────────────────────────────┘
             │ NO
             ▼
┌─────────────────────────────────────────┐
│ Is HttpException?                       │
│ └─► YES: HttpExceptionFilter            │
└────────────┬────────────────────────────┘
             │ NO
             ▼
┌─────────────────────────────────────────┐
│ GlobalExceptionFilter (catch-all)       │
└─────────────────────────────────────────┘
```

## 📊 Error Codes Reference

```typescript
export const ERROR_CODES = {
  // Client errors (4xx)
  BAD_REQUEST: 'BAD_REQUEST',                 // 400
  UNAUTHORIZED: 'UNAUTHORIZED',                // 401
  FORBIDDEN: 'FORBIDDEN',                      // 403
  NOT_FOUND: 'NOT_FOUND',                      // 404
  CONFLICT: 'CONFLICT',                        // 409
  VALIDATION_ERROR: 'VALIDATION_ERROR',        // 400
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED', // 429
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',          // 408
  
  // Server errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',            // 500
  
  // Custom errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  BUSINESS_ERROR: 'BUSINESS_ERROR',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;
```

## 🎯 Best Practices

### 1. Throw Appropriate Exceptions

```typescript
// ❌ BAD: Generic error
throw new Error('Something went wrong');

// ✅ GOOD: Specific HTTP exception
throw new NotFoundException('User not found');
throw new UnauthorizedException('Invalid token');
throw new ForbiddenException('Access denied');
```

### 2. Include Helpful Details

```typescript
// ❌ BAD: No context
throw new NotFoundException('Not found');

// ✅ GOOD: With context
throw new NotFoundException(`User with ID ${userId} not found`);

// ✅ BETTER: With details object
throw new NotFoundException({
  message: 'User not found',
  details: { userId, attemptedAt: new Date() },
});
```

### 3. Use Custom Business Exceptions

```typescript
// ✅ Create reusable exceptions
export class UserNotFoundException extends NotFoundException {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`);
  }
}

export class InvalidPasswordException extends BadRequestException {
  constructor() {
    super('Password does not meet requirements');
  }
}

// Usage
throw new UserNotFoundException('123');
throw new InvalidPasswordException();
```

### 4. Log Errors Appropriately

```typescript
try {
  await this.dangerousOperation();
} catch (error) {
  // Log for internal tracking
  this.logger.error('Operation failed', error.stack);
  
  // Throw user-friendly error
  throw new InternalServerErrorException('Operation failed, please try again');
}
```

---

**Next:** [Services Documentation →](./08-services.md)

