# White-Box Testing cho Exception Filters

## Tổng quan

File `exception.filters.spec.ts` chứa các test cases được viết sử dụng **White-Box Testing Methods** để kiểm tra toàn diện các exception filters trong ứng dụng NestJS.

## White-Box Testing Methods được áp dụng

### 1. **Statement Coverage (Coverage dòng lệnh)**
- **Mục tiêu**: Đảm bảo mọi dòng code được thực thi ít nhất một lần
- **Kết quả**: 97.31% statement coverage
- **Cách thực hiện**: Tạo test cases cho tất cả các nhánh logic trong mỗi method

### 2. **Branch Coverage (Coverage nhánh điều kiện)**
- **Mục tiêu**: Kiểm tra tất cả các điều kiện if/else, switch cases
- **Kết quả**: 80% branch coverage
- **Cách thực hiện**: Test cả điều kiện true và false của mỗi branch

### 3. **Function Coverage (Coverage hàm)**
- **Mục tiêu**: Đảm bảo mọi function được gọi ít nhất một lần
- **Kết quả**: 100% function coverage
- **Cách thực hiện**: Test tất cả các public methods của các filter classes

### 4. **Path Coverage (Coverage đường dẫn)**
- **Mục tiêu**: Kiểm tra tất cả các đường dẫn thực thi có thể
- **Cách thực hiện**: Test các kịch bản khác nhau cho mỗi exception type

## Các Exception Filters được test

### 1. **GlobalExceptionFilter**
```typescript
// Test cases bao gồm:
- HttpException với string response
- HttpException với object response
- MongoError handling
- Generic Error handling
- Unknown exception type
- Request không có requestId
- Tất cả HTTP status codes
```

### 2. **HttpExceptionFilter**
```typescript
// Test cases bao gồm:
- HttpException với string response
- HttpException với object response chứa message
- HttpException với object response chứa details
- Fallback khi response object không có message
```

### 3. **ValidationExceptionFilter**
```typescript
// Test cases bao gồm:
- Validation error với array of messages
- Validation error với single message
- Multiple constraints handling
- Validation error không có constraints
```

### 4. **DatabaseExceptionFilter**
```typescript
// Test cases bao gồm:
- Duplicate key error (code 11000)
- Document validation error (code 121)
- Unknown MongoError code
- MongoError không có code
```

### 5. **RateLimitExceptionFilter**
```typescript
// Test cases bao gồm:
- Rate limit exception
- Different message formats
- Re-throw khi không phải rate limit error
- Exception không có message
```

### 6. **TimeoutExceptionFilter**
```typescript
// Test cases bao gồm:
- Timeout exception
- Different timeout message formats
- Re-throw khi không phải timeout error
- Exception không có message
```

### 7. **BusinessLogicExceptionFilter**
```typescript
// Test cases bao gồm:
- Business logic error với đầy đủ properties
- Business logic error không có errorCode
- Business logic error không có status
- Re-throw khi không phải business error
- Business logic error với isBusinessError = false
```

## White-Box Testing Techniques được sử dụng

### 1. **Condition Coverage**
```typescript
// Test cả điều kiện true và false
if (exception instanceof HttpException) {
  // Test case 1: exception là HttpException
} else if (exception instanceof MongoError) {
  // Test case 2: exception là MongoError
} else {
  // Test case 3: exception không phải cả hai
}
```

### 2. **Loop Coverage**
```typescript
// Test với array có nhiều elements
const errors = exception.response.message.map((error: any) => ({
  field: error.property,
  message: Object.values(error.constraints || {}).join(', '),
  value: error.value,
}));
```

### 3. **Switch Coverage**
```typescript
// Test tất cả các cases trong switch statement
switch (exception.code) {
  case 11000: // Test case 1
  case 121:   // Test case 2
  default:    // Test case 3
}
```

### 4. **Exception Path Coverage**
```typescript
// Test các đường dẫn exception khác nhau
try {
  // Normal execution path
} catch (HttpException) {
  // Exception path 1
} catch (MongoError) {
  // Exception path 2
} catch (Error) {
  // Exception path 3
}
```

## Mock Objects và Test Doubles

### 1. **Mock Request/Response**
```typescript
const mockRequest = {
  url: '/test',
  method: 'GET',
  requestId: 'test-request-id',
  ip: '127.0.0.1',
};

const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
};
```

### 2. **Mock ArgumentsHost**
```typescript
const mockArgumentsHost = {
  switchToHttp: jest.fn().mockReturnValue({
    getRequest: jest.fn().mockReturnValue(mockRequest),
    getResponse: jest.fn().mockReturnValue(mockResponse),
  }),
} as any;
```

### 3. **Mock Logger**
```typescript
jest.spyOn(Logger.prototype, 'error').mockImplementation();
jest.spyOn(Logger.prototype, 'warn').mockImplementation();
```

## Integration Tests

### 1. **Real ArgumentsHost Test**
```typescript
const realArgumentsHost = {
  switchToHttp: () => ({
    getRequest: () => mockRequest,
    getResponse: () => mockResponse,
  }),
} as ArgumentsHost;
```

### 2. **Response Structure Consistency**
```typescript
// Kiểm tra cấu trúc response nhất quán
expect(responseCall).toHaveProperty('success', false);
expect(responseCall).toHaveProperty('error');
expect(responseCall).toHaveProperty('message');
expect(responseCall).toHaveProperty('timestamp');
```

### 3. **Logger Calls Verification**
```typescript
// Kiểm tra logger được gọi đúng cách
expect(loggerErrorSpy).toHaveBeenCalledWith(
  expect.stringContaining('Exception: BAD_REQUEST - Test error - GET /test'),
  expect.any(String),
);
```

## Kết quả Coverage

```
File: exception.filters.ts
- Statements: 97.31%
- Branches: 80%
- Functions: 100%
- Lines: 97.01%
- Uncovered Lines: 139-145
```

## Chạy Tests

```bash
# Chạy tất cả tests
npm test

# Chạy tests với coverage
npm run test:cov

# Chạy tests cho file cụ thể
npm test --testPathPatterns=exception.filters.spec.ts
```

## Lợi ích của White-Box Testing

1. **Phát hiện lỗi sớm**: Tìm ra các lỗi logic trong code
2. **Đảm bảo chất lượng**: Kiểm tra tất cả các đường dẫn thực thi
3. **Tài liệu hóa behavior**: Test cases serve as documentation
4. **Refactoring an toàn**: Đảm bảo code vẫn hoạt động sau khi refactor
5. **Debugging hiệu quả**: Dễ dàng xác định vấn đề khi test fail

## Best Practices được áp dụng

1. **Arrange-Act-Assert Pattern**: Cấu trúc test rõ ràng
2. **Descriptive Test Names**: Tên test mô tả rõ ràng kịch bản
3. **Single Responsibility**: Mỗi test chỉ kiểm tra một điều
4. **Mock External Dependencies**: Sử dụng mock để isolate unit under test
5. **Edge Cases Coverage**: Test các trường hợp biên và exception cases
6. **Integration Testing**: Test interaction giữa các components
