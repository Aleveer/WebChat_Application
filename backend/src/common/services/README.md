# Shared Services Test Cases

File này chứa test cases toàn diện cho các shared services trong ứng dụng WebChat.

## Cấu trúc Test

### CacheService Tests
- **set và get**: Test việc lưu trữ và lấy dữ liệu từ cache
- **delete**: Test việc xóa cache entries
- **has**: Test kiểm tra sự tồn tại của cache entries
- **clear**: Test xóa tất cả cache entries

### EmailService Tests
- **sendEmail**: Test gửi email cơ bản
- **sendWelcomeEmail**: Test gửi email chào mừng
- **sendPasswordResetEmail**: Test gửi email reset password

### NotificationService Tests
- **sendNotification**: Test gửi thông báo với các loại khác nhau
- **sendMessageNotification**: Test gửi thông báo tin nhắn
- **sendGroupNotification**: Test gửi thông báo nhóm

### FileUploadService Tests
- **uploadFile**: Test upload file với destination mặc định và tùy chỉnh
- **deleteFile**: Test xóa file
- **generateFileName**: Test tạo tên file unique

### AnalyticsService Tests
- **trackEvent**: Test theo dõi events
- **trackUserAction**: Test theo dõi hành động người dùng
- **trackMessageSent**: Test theo dõi tin nhắn được gửi
- **trackGroupCreated**: Test theo dõi nhóm được tạo
- **getEventStats**: Test lấy thống kê events

### HealthCheckService Tests
- **checkDatabase**: Test kiểm tra sức khỏe database
- **checkRedis**: Test kiểm tra sức khỏe Redis
- **getOverallHealth**: Test kiểm tra tổng thể sức khỏe hệ thống

## Cách chạy Tests

```bash
# Chạy tất cả tests
npm test

# Chỉ chạy shared services tests
npm test --testPathPatterns=shared.services.spec.ts

# Chạy với coverage
npm run test:cov
```

## Đặc điểm của Test Cases


### ✅ Coverage Toàn diện
- Test tất cả các methods public của các services
- Test cả happy path và edge cases
- Test error handling và validation

### ✅ Mock và Isolation
- Sử dụng Jest mocks cho Logger
- Mỗi test case độc lập với nhau
- Setup và teardown rõ ràng

### ✅ Async/Await Support
- Xử lý đúng các async operations
- Sử dụng proper error handling
- Test timeout và performance

## Mở rộng Tests

Khi thêm chức năng mới vào shared services:

1. Thêm test cases tương ứng trong file này
2. Đảm bảo coverage >= 90%
3. Test cả success và error scenarios
4. Cập nhật documentation này nếu cần

## Lưu ý

- Tests này sử dụng mock implementations, không test với real services
- Để test integration với real services, cần tạo separate integration tests
- Logger được mock để tránh console output trong tests
- File upload tests sử dụng mock Multer file