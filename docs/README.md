# 📖 WebChat Backend - Tài Liệu Hướng Dẫn Sử Dụng

## 🎯 Tổng Quan

WebChat Backend là một hệ thống backend mạnh mẽ được xây dựng bằng NestJS, cung cấp các tính năng chat real-time với kiến trúc modular, bảo mật cao và hiệu suất tối ưu.

## 📑 Mục Lục

### 🚀 Getting Started
- [Quick Start Guide](./QUICKSTART.md) - Bắt đầu trong 5 phút
- [Mục Lục Đầy Đủ](./INDEX.md) - Tất cả tài liệu
- [Sơ Đồ Hệ Thống](./DIAGRAMS.md) - Visual documentation

### 🏗️ Architecture & Core
1. [Kiến Trúc Hệ Thống](./02-architecture.md)
2. [DTOs - Data Transfer Objects](./03-dtos.md)
3. [Common Module](./04-common-module.md)

### 🛡️ Security & Request Processing
4. [Guards - Bảo Mật](./05-guards.md)
5. [Interceptors - Xử Lý Request/Response](./06-interceptors.md)
6. [Filters - Xử Lý Lỗi](./07-filters.md)

### 🔧 Services & Utilities
7. [Services - Dịch Vụ](./08-services.md)
8. [Decorators - Custom Decorators](./12-decorators.md)
9. [Interfaces - Service Interfaces](./13-interfaces.md)
10. [Types - TypeScript Types](./14-types.md)
11. [Utils - Utility Functions](./15-utils.md)

### 📚 Guides & Examples
12. [Flow Hoạt Động](./09-flows.md)
13. [API Examples](./10-api-examples.md)
14. [Best Practices](./11-best-practices.md)

## 🏗️ Cấu Trúc Thư Mục

```
backend/
├── src/
    ├── common/                 # Common Module - Shared resources
    |   ├── config/            # Configuration files (CommonModuleOptions, InterceptorConfig)
    │   ├── constants/         # Application constants (APP_CONSTANTS, ERROR_MESSAGES)
    │   ├── controllers/       # Common controllers (HealthController, MetricsController)
    │   ├── decorators/        # Custom decorators
    │   ├── dto/              # Data Transfer Objects
    │   ├── filters/          # Exception filters (7 filters)
    │   ├── guards/           # Authorization guards (8 guards)
    │   ├── interceptors/     # Request/Response interceptors (8 interceptors)
    │   ├── interfaces/       # TypeScript interfaces
    │   │   ├── cache.interface.ts       # ICacheService
    │   │   ├── email.interface.ts       # IEmailService
    │   │   ├── metrics.interface.ts     # IMetricsService
    │   │   └── notification.interface.ts # INotificationService
    │   ├── services/         # Common services (7 services)
    │   ├── types/            # Type definitions
    │   │   ├── database.types.ts        # BaseDocument, MongoId, JwtPayload
    │   │   ├── express.d.ts            # Express Request extensions
    │   │   ├── response.types.ts       # API response types
    │   │   └── metadata.types.ts       # Metadata structures
    │   └── utils/            # Utility functions
    │       ├── validation.utils.ts     # ValidationUtils, Zod schemas
    │       ├── sanitization.utils.ts   # Sanitization functions
    │       ├── password.utils.ts       # PasswordUtils (hash, compare)
    │       ├── string.utils.ts         # StringUtils (mask, slugify)
    │       ├── pagination.utils.ts     # PaginationUtils
    │       ├── response.utils.ts       # ResponseUtils
    │       ├── files.utils.ts          # FileUtils
    │       ├── circuit-breaker.ts      # CircuitBreaker pattern
    │       └── error-response.formatter.ts # Error formatting
    ├── config/               # App configuration
    ├── docs/                 # Documentation (14 tài liệu)
    └── modules/                  # Source code (modules)
        ├── auth/             # Authentication module
        ├── users/            # User management
        ├── messages/         # Messaging system
        ├── groups/           # Group management
        └── ...               # Other modules
```

## 🎨 Tính Năng Chính

### 1. **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (RBAC)
- Permission-based authorization
- Group-level permissions

### 2. **Request Processing**
- Request validation & sanitization
- XSS protection
- SQL/NoSQL injection prevention
- Rate limiting
- Request timeout handling

### 3. **Monitoring & Logging**
- Comprehensive logging system
- Performance metrics
- Health checks
- Request tracking with correlation ID

### 4. **Caching & Performance**
- Multi-level caching strategy
- Cache invalidation
- Query optimization

### 5. **Error Handling**
- Centralized error handling
- Detailed error responses
- Error tracking and logging

### 6. **File Management**
- Secure file upload
- File type validation
- Path traversal prevention

## 📊 Sơ Đồ Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST PIPELINE                         │
├─────────────────────────────────────────────────────────────┤
│  1. Request ID Generation                                   │
│  2. Sanitization (XSS, SQL Injection Prevention)           │
│  3. Authentication (JWT Validation)                         │
│  4. Authorization (Guards: Role, Permission, etc.)         │
│  5. Rate Limiting                                           │
│  6. Request Logging                                         │
│  7. Business Logic Execution                                │
│  8. Response Transformation                                 │
│  9. Caching (if applicable)                                 │
│  10. Metrics Recording                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    RESPONSE / ERROR                         │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Security Features

- **Input Validation**: Tất cả input được validate bằng Zod và class-validator
- **Sanitization**: Loại bỏ các ký tự nguy hiểm, XSS protection
- **Authentication**: JWT tokens với refresh token support
- **Authorization**: Multi-level guards (Role, Permission, Group)
- **Rate Limiting**: Ngăn chặn abuse và DDoS
- **File Upload Security**: Validate file type, size, và path
- **Circuit Breaker**: Bảo vệ hệ thống khỏi cascading failures

## 📈 Performance Optimizations

- **Caching Strategy**: Multi-tier caching với TTL flexibility
- **Connection Pooling**: MongoDB connection pool optimization
- **Request Timeout**: Configurable timeouts
- **Memory Management**: Circular buffers cho metrics
- **Lazy Loading**: Module lazy loading khi cần thiết

## 🔍 Monitoring

### Health Check Endpoints

```bash
# Overall health
GET /health

# Database health
GET /health/database

# Liveness probe
GET /health/live

# Readiness probe
GET /health/ready
```

### Metrics Endpoints (Admin only)

```bash
# All metrics
GET /metrics

# Counters
GET /metrics/counters

# Histograms
GET /metrics/histograms

# Prometheus format
GET /metrics/prometheus
```