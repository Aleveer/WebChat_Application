# Password Utils Test Cases

File này chứa test cases toàn diện cho `password.utils.ts` - một utility class chuyên dụng để xử lý password security với SHA-256 hashing và salt.

## Cấu trúc Test

### generateSalt Tests
- **Độ dài và format**: Test salt có đúng 32 ký tự hex
- **Uniqueness**: Test salt khác nhau mỗi lần tạo
- **Format validation**: Test salt chỉ chứa ký tự hex hợp lệ

### hashPassword Tests
- **Consistency**: Test cùng input cho cùng output
- **Uniqueness**: Test salt/password khác nhau cho hash khác nhau
- **Format validation**: Test hash có đúng 64 ký tự hex
- **Edge cases**: Test với password/salt rỗng và ký tự đặc biệt

### hashPasswordWithSalt Tests
- **Complete workflow**: Test tạo cả hash và salt
- **Uniqueness**: Test mỗi lần tạo đều unique
- **Correctness**: Test hash được tạo đúng với salt
- **Edge cases**: Test với password rỗng và dài

### verifyPassword Tests
- **Correct verification**: Test password đúng trả về true
- **Security**: Test password/salt/hash sai trả về false
- **Edge cases**: Test với các trường hợp đặc biệt
- **Case sensitivity**: Test password case sensitive
- **Integration**: Test với hash từ hashPasswordWithSalt

### Integration Tests
- **Full workflow**: Test workflow đăng ký → đăng nhập
- **Multiple passwords**: Test với nhiều loại password
- **Uniqueness guarantee**: Test salt và hash unique

### Security Tests
- **High entropy**: Test entropy cao cho salt và hash
- **Non-reversible**: Test không thể reverse engineer
- **Timing attack resistance**: Test resistance với timing attacks

## Cách chạy Tests

```bash
# Chạy tất cả tests
npm test

# Chỉ chạy password utils tests
npm test --testPathPatterns=password.utils.spec.ts

# Chạy với coverage
npm run test:cov -- --testPathPatterns=password.utils.spec.ts
```

## Đặc điểm của Test Cases

### ✅ Code Clean và Dễ đọc
- Sử dụng tên test cases bằng tiếng Việt rõ ràng
- Cấu trúc test được tổ chức theo từng method
- Mỗi test case có mục đích cụ thể và dễ hiểu

### ✅ Coverage Hoàn hảo
- **100% statements coverage**
- **100% branches coverage** 
- **100% functions coverage**
- **100% lines coverage**
- Test tất cả các methods và edge cases

### ✅ Test Cases Chi tiết
- **29 test cases** tổng cộng
- Test security aspects và entropy
- Test integration workflows
- Test edge cases và boundary conditions
- Test uniqueness và randomness

### ✅ Security Focus
1. **Entropy Testing**: Đảm bảo salt và hash có entropy cao
2. **Uniqueness Testing**: Test không có collision
3. **Non-reversibility**: Test không thể reverse engineer
4. **Timing Attack Resistance**: Test resistance với timing attacks
5. **Case Sensitivity**: Test password case sensitive

## Test Results

```
Test Suites: 1 passed, 1 total
Tests:       29 passed, 29 total
Snapshots:   0 total
Time:        0.665 s
```

## Security Features được Test

### Salt Generation
- **Randomness**: Sử dụng crypto.randomBytes(16) cho entropy cao
- **Length**: 32 ký tự hex (16 bytes)
- **Uniqueness**: Mỗi salt đều unique

### Password Hashing
- **Algorithm**: SHA-256 cho security tốt
- **Salt Integration**: Password + salt trước khi hash
- **Consistency**: Cùng input cho cùng output
- **Length**: 64 ký tự hex (32 bytes)

### Verification Process
- **Exact Match**: Hash phải match chính xác
- **Salt Dependency**: Cần đúng salt để verify
- **Case Sensitivity**: Password case sensitive

## Mở rộng Tests

Khi thêm chức năng mới vào password utils:

1. Thêm test cases tương ứng trong file này
2. Đảm bảo coverage = 100%
3. Test cả security aspects và edge cases
4. Test integration với existing methods
5. Cập nhật documentation này nếu cần

## Lưu ý Security

- **Không lưu password plain text**: Luôn hash với salt
- **Salt uniqueness**: Mỗi password cần salt riêng
- **Hash verification**: Sử dụng constant-time comparison
- **Entropy**: Đảm bảo salt có entropy cao
- **Algorithm**: SHA-256 đủ mạnh cho most use cases

## Dependencies

Tests này sử dụng:
- Jest testing framework
- Node.js crypto module cho random generation
- SHA-256 hashing algorithm
- Hex encoding cho salt và hash

## So sánh với bcrypt

PasswordUtils này sử dụng SHA-256 + salt thay vì bcrypt:
- **Pros**: Nhanh hơn, đơn giản hơn, không phụ thuộc external library
- **Cons**: Không có built-in work factor, cần implement timing attack protection
- **Use case**: Phù hợp cho applications không cần maximum security
