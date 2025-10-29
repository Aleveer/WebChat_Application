# 🔄 Interceptors - Request/Response Processing

## 📋 Tổng Quan

Interceptors trong NestJS cho phép can thiệp vào request/response lifecycle. WebChat Backend sử dụng interceptors để:
- Generate request IDs
- Sanitize input data
- Cache responses
- Log requests
- Collect metrics
- Monitor performance
- Transform responses
- Handle timeouts

## 🎯 Danh Sách Interceptors

```
Interceptors Pipeline (theo thứ tự execution)
1. RequestIdInterceptor       # Generate unique request ID
2. SanitizationInterceptor    # XSS protection & input sanitization
3. LoggingInterceptor         # Request/Response logging
4. MetricsInterceptor         # Metrics collection
5. PerformanceInterceptor     # Performance monitoring
6. TimeoutInterceptor         # Request timeout handling
7. CacheInterceptor           # Response caching
8. ResponseTransformInterceptor  # Standardize response format
```

## 🆔 1. RequestIdInterceptor

### Mục Đích
Generate unique ID cho mỗi request để tracking và debugging.

### Features
- Auto-generate request ID hoặc sử dụng từ header
- Store trong AsyncLocalStorage context
- Add vào response headers
- Support correlation ID

### Implementation

```typescript
export const requestContext = new AsyncLocalStorage<Map<string, any>>();

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestIdInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // 1. Generate or extract request ID
    const requestId =
      (request.headers['x-request-id'] as string) ||
      (request.headers['x-correlation-id'] as string) ||
      this.generateRequestId();

    request.requestId = requestId;

    // 2. Initialize context
    const contextMap = new Map<string, any>();
    contextMap.set('requestId', requestId);
    contextMap.set('userId', request.user?.id || 'anonymous');
    contextMap.set('ip', request.ip || 'unknown');
    contextMap.set('userAgent', request.headers['user-agent'] || 'unknown');
    contextMap.set('startTime', Date.now());

    // 3. Run request in context
    return new Observable((subscriber) => {
      requestContext.run(contextMap, () => {
        next
          .handle()
          .pipe(
            tap({
              next: (data) => {
                // Add headers to response
                const response = context.switchToHttp().getResponse<Response>();
                response.setHeader('X-Request-ID', requestId);
                response.setHeader('X-Correlation-ID', requestId);
              },
              error: (error) => {
                this.logger.error(
                  `Request ${requestId} failed: ${error.message}`,
                  error.stack,
                );
              },
            }),
          )
          .subscribe(subscriber);
      });
    });
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### Sử Dụng

```typescript
// Get request ID trong controller
import { RequestId, getCurrentRequestId } from './common';

@Controller('example')
export class ExampleController {
  
  @Get()
  example(@RequestId() requestId: string) {
    console.log('Request ID:', requestId);
    return { requestId };
  }
  
  // Hoặc trong service
  async someMethod() {
    const requestId = getCurrentRequestId();
    console.log('Current request ID:', requestId);
  }
}
```

## 🛡️ 2. SanitizationInterceptor

### Mục Đích
Bảo vệ khỏi XSS, SQL injection, và các input nguy hiểm.

### Features
- Remove script tags
- Remove iframe tags
- Remove event handlers (onclick, onerror, etc.)
- Remove dangerous protocols (javascript:, vbscript:)
- Escape HTML entities
- Cache sanitized strings để tăng performance

### Implementation

```typescript
export const XssSafeStringSchema = z.string().transform((val) => {
  if (!val || val.length === 0) return val;
  
  let sanitized = val.trim();
  
  // Remove script tags
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*>(.*?)<\/script>/gis,
    '$1',
  );
  
  // Remove style tags
  sanitized = sanitized.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*>(.*?)<\/style>/gis,
    '$1',
  );
  
  // Remove iframe tags
  sanitized = sanitized.replace(
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*>(.*?)<\/iframe>/gis,
    '$1',
  );
  
  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove dangerous protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  
  // Escape HTML if still contains tags
  if (sanitized.includes('<') || sanitized.includes('>')) {
    sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  
  return sanitized;
});

@Injectable()
export class SanitizationInterceptor implements NestInterceptor {
  private readonly sanitizationCache = new Map<string, string>();
  private readonly MAX_CACHE_SIZE = 1000;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      // Sanitize request data
      if (request.body) {
        request.body = this.sanitizeWithCache(request.body);
      }
      
      if (request.query) {
        request.query = this.sanitizeWithCache(request.query);
      }
      
      if (request.params) {
        request.params = this.sanitizeWithCache(request.params);
      }

      return next.handle();
    } catch (error) {
      throw new BadRequestException('Invalid input data');
    }
  }

  private sanitizeWithCache(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeStringWithCache(obj);
    }
    
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeWithCache(item));
    }
    
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = this.sanitizeWithCache(value);
    }
    
    return sanitized;
  }

  private sanitizeStringWithCache(input: string): string {
    // Check cache first
    if (this.sanitizationCache.has(input)) {
      return this.sanitizationCache.get(input)!;
    }

    // Fast path: no dangerous content
    if (!this.hasDangerousContent(input)) {
      this.cacheResult(input, input);
      return input;
    }

    // Sanitize
    try {
      const sanitized = XssSafeStringSchema.parse(input);
      this.cacheResult(input, sanitized);
      return sanitized;
    } catch (error) {
      return input;
    }
  }

  private hasDangerousContent(input: string): boolean {
    const lowerInput = input.toLowerCase();
    const dangerousPatterns = [
      '<script', '<iframe', '<object', '<embed', '<style',
      'javascript:', 'vbscript:', 'data:text/html',
      'onerror', 'onclick', 'onload',
    ];
    return dangerousPatterns.some((pattern) => lowerInput.includes(pattern));
  }
}
```

### Examples

```typescript
// Input
POST /api/messages
{
  "text": "<script>alert('xss')</script>Hello World!",
  "title": "Click <a href='javascript:alert(1)'>here</a>"
}

// After sanitization
{
  "text": "alert('xss')Hello World!",
  "title": "Click here"
}
```

## 💾 3. CacheInterceptor

### Mục Đích
Cache HTTP responses để giảm load database và tăng performance.

### Features
- Automatic caching với decorators
- Configurable TTL
- User-specific cache keys
- Cache HIT/MISS logging
- Manual cache invalidation

### Implementation

```typescript
@Injectable()
export class CacheInterceptor extends NestCacheInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  protected trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Get cache config from decorator
    const cacheConfig = this.reflector.get(
      CACHE_CONFIG_KEY,
      context.getHandler(),
    );

    // No cache if ttl = 0 or no config
    if (!cacheConfig || cacheConfig.ttl === 0) {
      return undefined;
    }

    // Use custom key or generate default
    if (cacheConfig.key) {
      return this.buildCacheKey(cacheConfig.key, request);
    }

    return this.generateCacheKey(request);
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheKey = this.trackBy(context);

    if (!cacheKey) {
      return next.handle();
    }

    // Try get from cache
    const cachedValue = await this.cacheManager.get(cacheKey);
    
    if (cachedValue) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return new Observable((observer) => {
        observer.next(cachedValue);
        observer.complete();
      });
    }

    this.logger.debug(`Cache MISS: ${cacheKey}`);

    // Execute request and cache result
    return next.handle().pipe(
      tap(async (response) => {
        if (response) {
          const cacheConfig = this.reflector.get(
            CACHE_CONFIG_KEY,
            context.getHandler(),
          );
          const ttl = cacheConfig?.ttl || 3600;

          try {
            await this.cacheManager.set(cacheKey, response, ttl * 1000);
            this.logger.debug(`Cached: ${cacheKey}, TTL: ${ttl}s`);
          } catch (error) {
            this.logger.error(`Failed to cache: ${cacheKey}`, error);
          }
        }
      }),
    );
  }

  private generateCacheKey(request: Request): string {
    const { method, path, query } = request;
    const queryString =
      Object.keys(query).length > 0 ? `:${JSON.stringify(query)}` : '';
    
    const user = request.user as { id?: string } | undefined;
    const userId = user?.id ? `:user:${user.id}` : '';
    
    return `cache:${method}:${path}${queryString}${userId}`;
  }

  private buildCacheKey(prefix: string, request: Request): string {
    const user = request.user as { id?: string } | undefined;
    const userId = user?.id ? `:${user.id}` : '';
    return `${prefix}${userId}`;
  }
}
```

### Sử Dụng

```typescript
import { Cache, ShortCache, MediumCache, LongCache, NoCache } from './common';

@Controller('users')
export class UsersController {
  
  // Cache với custom config
  @Get(':id')
  @Cache({ key: 'user:profile', ttl: 1800 })  // 30 minutes
  getUser(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
  
  // Short cache (5 minutes)
  @Get('stats')
  @ShortCache()
  getStats() {
    return this.userService.getStats();
  }
  
  // Medium cache (1 hour)
  @Get()
  @MediumCache()
  getUsers() {
    return this.userService.findAll();
  }
  
  // Long cache (24 hours)
  @Get('config')
  @LongCache()
  getConfig() {
    return this.configService.get();
  }
  
  // No cache
  @Post()
  @NoCache()
  createUser(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
```

### Cache Decorators

```typescript
// Short cache: 5 minutes
export const ShortCache = (key?: string) => {
  return Cache({ key, ttl: 300 });
};

// Medium cache: 1 hour
export const MediumCache = (key?: string) => {
  return Cache({ key, ttl: 3600 });
};

// Long cache: 24 hours
export const LongCache = (key?: string) => {
  return Cache({ key, ttl: 86400 });
};

// User-specific cache: 30 minutes
export const UserCache = (ttl: number = 1800) => {
  return Cache({ ttl });
};

// Query cache: 15 minutes
export const QueryCache = (ttl: number = 900) => {
  return Cache({ ttl });
};

// No cache
export const NoCache = () => {
  return SetMetadata(CACHE_CONFIG_KEY, { ttl: 0 });
};
```

## 📝 4. LoggingInterceptor

### Mục Đích
Log tất cả incoming requests và outgoing responses.

### Implementation

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // Log incoming request
    this.logger.log(
      `Incoming Request: ${method} ${url} - ${ip} - ${userAgent}`,
    );

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const { statusCode } = response;

        // Log outgoing response
        this.logger.log(
          `Outgoing Response: ${method} ${url} - ${statusCode} - ${duration}ms`,
        );
      }),
      catchError((error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Log error
        this.logger.error(
          `Request Error: ${method} ${url} - ${error.status || 500} - ${duration}ms - ${error.message}`,
        );

        return throwError(() => error);
      }),
    );
  }
}
```

### Log Output

```
[2025-10-29 10:30:45] [INFO] Incoming Request: POST /api/messages - 192.168.1.100 - Mozilla/5.0...
[2025-10-29 10:30:45] [INFO] Outgoing Response: POST /api/messages - 201 - 145ms

[2025-10-29 10:31:00] [ERROR] Request Error: GET /api/users/invalid - 404 - 12ms - User not found
```

## 📊 5. MetricsInterceptor

### Mục Đích
Thu thập metrics về HTTP requests.

### Implementation

```typescript
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;

    // Generate metric name
    const timerName = `http_${method.toLowerCase()}_${this.sanitizeUrl(url)}`;

    // Start timer
    this.metricsService.startTimer(timerName);

    // Increment request counter
    this.metricsService.incrementCounter(
      `http_requests_total{method="${method}",path="${url}"}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          // Record success
          const duration = this.metricsService.endTimer(timerName);
          this.metricsService.incrementCounter('http_requests_success');
          this.metricsService.recordHistogram(
            'http_request_duration_ms',
            duration,
          );

          this.logger.debug(
            `Request completed: ${method} ${url} - ${duration}ms`,
          );
        },
        error: () => {
          // Record error
          const duration = this.metricsService.endTimer(timerName);
          this.metricsService.incrementCounter('http_requests_error');
          this.metricsService.recordHistogram(
            'http_request_error_duration_ms',
            duration,
          );

          this.logger.debug(`Request failed: ${method} ${url} - ${duration}ms`);
        },
      }),
    );
  }

  private sanitizeUrl(url: string): string {
    return url
      .split('?')[0]  // Remove query string
      .replace(/\/[a-f0-9]{24}/g, '/:id')  // Replace MongoDB IDs
      .replace(/\/\d+/g, '/:id')  // Replace numeric IDs
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .toLowerCase();
  }
}
```

### Metrics Collected

```
Counters:
- http_requests_total          # Total requests
- http_requests_success        # Successful requests
- http_requests_error          # Failed requests

Histograms:
- http_request_duration_ms     # Request duration
- http_request_error_duration_ms  # Error request duration

Per-endpoint metrics:
- http_get_api_users
- http_post_api_messages
- http_patch_api_users_id
```

## ⚡ 6. PerformanceInterceptor

### Mục Đích
Monitor và cảnh báo slow requests.

### Implementation

```typescript
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);
  private readonly slowRequestThreshold: number;

  constructor(
    @Optional()
    @Inject('INTERCEPTOR_CONFIG')
    private readonly config?: InterceptorConfig,
  ) {
    this.slowRequestThreshold =
      this.config?.performance.slowRequestThreshold ?? 1000;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();
    const { method, url } = request;

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        if (duration > this.slowRequestThreshold) {
          this.logger.warn(`Slow Request: ${method} ${url} took ${duration}ms`);
        }
      }),
    );
  }
}
```

### Configuration

```typescript
export const DEFAULT_INTERCEPTOR_CONFIG = {
  performance: {
    slowRequestThreshold: 1000,  // 1 second
  },
};
```

### Output

```
[WARN] Slow Request: POST /api/heavy-operation took 2500ms
[WARN] Slow Request: GET /api/complex-query took 1850ms
```

## ⏱️ 7. TimeoutInterceptor

### Mục Đích
Cancel requests that take too long.

### Implementation

```typescript
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly timeoutMs: number;

  constructor(
    @Optional()
    @Inject('INTERCEPTOR_CONFIG')
    private readonly config?: InterceptorConfig,
  ) {
    this.timeoutMs =
      this.config?.timeout.default ?? 30000;  // 30 seconds default
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(this.timeoutMs),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          throw new RequestTimeoutException('Request timeout');
        }
        throw error;
      }),
    );
  }
}
```

### Configuration

```typescript
export const DEFAULT_INTERCEPTOR_CONFIG = {
  timeout: {
    default: 30000,      // 30 seconds
    short: 5000,         // 5 seconds
    fileUpload: 300000,  // 5 minutes
  },
};
```

## 🔄 8. ResponseTransformInterceptor

### Mục Đích
Standardize response format across all endpoints.

### Implementation

```typescript
@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If already formatted, return as-is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Transform to standard format
        return {
          success: true,
          data,
          timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        };
      }),
    );
  }
}
```

### Examples

```typescript
// Controller returns plain data
@Get(':id')
getUser(@Param('id') id: string) {
  return { id, name: 'John' };
}

// Client receives standardized response
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John"
  },
  "timestamp": "2025-10-29 10:30:45"
}

// Controller returns formatted response (not transformed)
@Get('custom')
getCustom() {
  return {
    success: true,
    message: 'Custom message',
    data: { ... }
  };
}

// Client receives as-is
{
  "success": true,
  "message": "Custom message",
  "data": { ... }
}
```

## 🎯 Interceptors Best Practices

### 1. Order Matters

```typescript
// Interceptors execute in this order:
// 1. RequestIdInterceptor (outermost)
// 2. SanitizationInterceptor
// 3. LoggingInterceptor
// ...
// 8. ResponseTransformInterceptor (innermost)
```

### 2. Async Operations

```typescript
@Injectable()
export class AsyncInterceptor implements NestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // Async setup
    await this.doAsyncSetup();

    return next.handle().pipe(
      tap(async (response) => {
        // Async cleanup
        await this.doAsyncCleanup(response);
      }),
    );
  }
}
```

### 3. Error Handling

```typescript
@Injectable()
export class SafeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Handle error
        this.logger.error('Error in interceptor', error);
        
        // Re-throw or return fallback
        return throwError(() => error);
      }),
    );
  }
}
```

### 4. Performance Optimization

```typescript
// Use cache for expensive operations
private readonly cache = new Map<string, any>();

intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
  const key = this.getCacheKey(context);
  
  if (this.cache.has(key)) {
    return of(this.cache.get(key));
  }
  
  return next.handle().pipe(
    tap((data) => this.cache.set(key, data)),
  );
}
```

---

**Next:** [Filters Documentation →](./07-filters.md)

