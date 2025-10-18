# Cập nhật Schema WebChat Application

## Tổng quan
Đã cập nhật tất cả các schema core của ứng dụng WebChat để phù hợp với yêu cầu đã được cung cấp.

## 1. User Schema (`backend/src/modules/users/schemas/user.schema.ts`)

### Thay đổi chính:
- **Thay đổi**: `first_name` và `last_name` → `fullname` (string, required, maxlength: 100)
- **Thêm mới**: 
  - `username` (string, optional, unique, sparse, maxlength: 50)
  - `email` (string, optional, unique, sparse, lowercase)
- **Giữ nguyên**: `phone_number`, `profile_photo`, `password`

### Validation:
- `phone_number`: Regex `/^\+[1-9]\d{1,11}$/` (international format)
- `fullname`: Regex `/^[a-zA-Z\s]+$/` (chỉ chữ cái và khoảng trắng)
- `username`: Regex `/^[a-zA-Z0-9_]+$/` (chữ cái, số và underscore)
- `email`: Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (email format)
- `profile_photo`: Regex `/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i` (image URL)

### Indexes:
- `phone_number`: unique index
- `username`: sparse unique index
- `email`: sparse unique index

## 2. Group Schema (`backend/src/modules/groups/schemas/group.schema.ts`)

### Không thay đổi:
Schema Group đã phù hợp với yêu cầu từ đầu:
- `name`: string, required, maxlength: 100
- `members`: array of GroupMember objects
- `created_at`: Date, default: Date.now

### GroupMember Structure:
```typescript
{
  user_id: ObjectId (ref: 'User'),
  joined_at: Date,
  is_admin: boolean,
  removed_at: Date | null
}
```

## 3. Messages Schema (`backend/src/modules/messages/schemas/message.schema.ts`)

### Không thay đổi:
Schema Messages đã phù hợp với yêu cầu:
- `sender_id`: ObjectId (ref: 'User')
- `receiver_type`: enum ('user' | 'group')
- `receiver_id`: ObjectId (user_id hoặc group_id)
- `text`: string, required, maxlength: 1000
- `timestamp`: Date, default: Date.now

### Cập nhật Virtual Fields:
- Cập nhật `sender` virtual field để sử dụng `fullname` thay vì `first_name`, `last_name`
- Thêm `username`, `email` vào sender info

## 4. DTOs Updates

### User DTOs (`backend/src/modules/users/dto/create-users.dto.ts`):
- **CreateUserDto**: Cập nhật để sử dụng `fullname`, thêm `username`, `email`
- **UpdateUserDto**: Tương tự như CreateUserDto
- **LoginDto**: Không thay đổi

### Group DTOs:
Không thay đổi, đã phù hợp với yêu cầu.

### Message DTOs:
Không thay đổi, đã phù hợp với yêu cầu.

## 5. Services Updates

### UsersService (`backend/src/modules/users/users.service.ts`):
- Cập nhật `searchUsers()` để tìm kiếm theo `fullname`, `username`, `email`

### GroupsService (`backend/src/modules/groups/groups.service.ts`):
- Cập nhật tất cả `populate()` calls để sử dụng `fullname`, `username`, `email`

### MessagesService (`backend/src/modules/messages/messages.service.ts`):
- Cập nhật tất cả `populate()` calls để sử dụng `fullname`, `username`, `email`
- Cập nhật aggregation pipeline trong `getRecentConversations()`

## 6. Constants Updates (`backend/src/common/constants/app.constants.ts`)

### Thêm mới:
- `MAX_USERNAME_LENGTH: 50`
- `USERNAME_REGEX: /^[a-zA-Z0-9_]+$/`

### Cập nhật:
- `MAX_NAME_LENGTH: 100` (từ 50)
- Sửa `PROFILE_PHOTO_REGEX` (bỏ TODO comment)

## 7. Database Migration Notes

⚠️ **Quan trọng**: Nếu bạn đã có dữ liệu trong database, cần migration:

1. **User Collection**:
   - Rename `first_name` và `last_name` → `fullname`
   - Thêm `username` và `email` fields (optional)
   - Update indexes

2. **Group Collection**:
   - Không cần thay đổi

3. **Messages Collection**:
   - Không cần thay đổi

## 8. API Endpoints

Tất cả API endpoints vẫn hoạt động như cũ, chỉ có response format thay đổi:
- `first_name`, `last_name` → `fullname`
- Thêm `username`, `email` fields trong user responses

## 9. Validation Rules

### User Creation:
- `phone_number`: Required, unique, international format
- `fullname`: Required, max 100 chars, letters and spaces only
- `username`: Optional, unique, max 50 chars, alphanumeric + underscore
- `email`: Optional, unique, valid email format
- `profile_photo`: Optional, valid image URL
- `password`: Required, min 6 chars, sẽ được hash với bcrypt

### Password Security:
- Sử dụng bcrypt với salt rounds = 12
- Password được hash tự động khi save
- Method `comparePassword()` để verify password

## 10. Testing

Để test các thay đổi:
1. Chạy unit tests: `npm test`
2. Chạy e2e tests: `npm run test:e2e`
3. Test API endpoints với Postman hoặc curl

## Kết luận

Tất cả schema core đã được cập nhật thành công để phù hợp với yêu cầu:
- ✅ User schema với phone_number, fullname, username, email, profile_photo
- ✅ Group schema với members array và các trường cần thiết  
- ✅ Messages schema với receiver_type và receiver_id
- ✅ Tất cả DTOs, Services, Controllers đã được cập nhật
- ✅ Validation rules và indexes đã được thiết lập
- ✅ Không có linter errors
