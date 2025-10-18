# Common Utils Test Cases

File này chứa test cases toàn diện cho các utility classes trong `common.utils.ts` của ứng dụng WebChat.

## Cấu trúc Test

### ValidationUtils Tests
- **isValidObjectId**: Test validation MongoDB ObjectId
- **isValidPhoneNumber**: Test validation số điện thoại quốc tế
- **isValidEmail**: Test validation email
- **isValidUrl**: Test validation URL
- **isValidImageUrl**: Test validation image URL
- **sanitizeString**: Test loại bỏ script tags và trim
- **isValidPassword**: Test validation password
- **isValidName**: Test validation tên người dùng

### PasswordUtils Tests
- **hashPassword**: Test hash password với bcrypt
- **comparePassword**: Test so sánh password
- **generateRandomPassword**: Test tạo password ngẫu nhiên
- **validatePasswordStrength**: Test đánh giá độ mạnh password

### StringUtils Tests
- **capitalize**: Test viết hoa chữ cái đầu
- **capitalizeWords**: Test viết hoa chữ cái đầu mỗi từ
- **slugify**: Test tạo slug từ chuỗi
- **truncate**: Test cắt chuỗi với suffix
- **generateRandomString**: Test tạo chuỗi ngẫu nhiên
- **generateUUID**: Test tạo UUID
- **maskEmail**: Test mask email để bảo mật
- **maskPhoneNumber**: Test mask số điện thoại

### DateUtils Tests
- **now**: Test lấy thời gian hiện tại
- **addDays**: Test thêm ngày vào date
- **addHours**: Test thêm giờ vào date
- **addMinutes**: Test thêm phút vào date
- **isExpired**: Test kiểm tra date hết hạn
- **formatDate**: Test format date theo pattern
- **getTimeAgo**: Test tính thời gian đã trôi qua

### ArrayUtils Tests
- **unique**: Test loại bỏ phần tử trùng lặp
- **chunk**: Test chia array thành chunks
- **shuffle**: Test trộn array
- **groupBy**: Test nhóm array theo key function
- **sortBy**: Test sắp xếp array theo key

### ObjectUtils Tests
- **deepClone**: Test clone object sâu
- **isEmpty**: Test kiểm tra object rỗng
- **pick**: Test chọn các key từ object
- **omit**: Test loại bỏ các key từ object
- **merge**: Test merge các object

### PaginationUtils Tests
- **calculatePagination**: Test tính toán thông tin pagination
- **validatePaginationParams**: Test validate và normalize params

### FileUtils Tests
- **getFileExtension**: Test lấy extension file
- **isValidImageType**: Test validation image type
- **formatFileSize**: Test format kích thước file
- **generateFileName**: Test tạo tên file unique

### ResponseUtils Tests
- **success**: Test tạo success response
- **error**: Test tạo error response
- **paginated**: Test tạo paginated response

## Cách chạy Tests

```bash
# Chạy tất cả tests
npm test

# Chỉ chạy common utils tests
npm test --testPathPatterns=common.utils.spec.ts

# Chạy với coverage
npm run test:cov -- --testPathPatterns=common.utils.spec.ts
```

## Đặc điểm của Test Cases

### ✅ Code Clean và Dễ đọc
- Sử dụng tên test cases bằng tiếng Việt rõ ràng
- Cấu trúc test được tổ chức theo từng utility class
- Mỗi test case có mục đích cụ thể và dễ hiểu

### ✅ Coverage Toàn diện
- **97.09% statements coverage**
- **86.44% branches coverage** 
- **100% functions coverage**
- **96.75% lines coverage**
- Test tất cả các methods public của các utility classes
- Test cả happy path và edge cases

### ✅ Test Cases Chi tiết
- **78 test cases** tổng cộng
- Test validation với các input hợp lệ và không hợp lệ
- Test async operations với proper error handling
- Test random generation và uniqueness
- Test edge cases và boundary conditions

### ✅ Best Practices được áp dụng
1. **Arrange-Act-Assert Pattern**: Cấu trúc test rõ ràng
2. **Single Responsibility**: Mỗi test chỉ test một chức năng
3. **Descriptive Names**: Tên test cases mô tả rõ ràng mục đích
4. **Comprehensive Coverage**: Test tất cả các scenarios
5. **Edge Case Testing**: Test các trường hợp đặc biệt

## Test Results

```
Test Suites: 1 passed, 1 total
Tests:       78 passed, 78 total
Snapshots:   0 total
Time:        3.052 s
```

## Mở rộng Tests

Khi thêm chức năng mới vào common utils:

1. Thêm test cases tương ứng trong file này
2. Đảm bảo coverage >= 95%
3. Test cả success và error scenarios
4. Test edge cases và boundary conditions
5. Cập nhật documentation này nếu cần

## Lưu ý

- Tests này không phụ thuộc vào external services
- Sử dụng mock data và test với các input cụ thể
- Password tests sử dụng bcrypt thực tế để test security
- Date tests có thể bị ảnh hưởng bởi timezone, cần lưu ý
- Random generation tests kiểm tra uniqueness và format

## Dependencies

Tests này sử dụng:
- Jest testing framework
- bcryptjs cho password hashing
- crypto module cho random generation
- mongoose Types cho ObjectId validation
