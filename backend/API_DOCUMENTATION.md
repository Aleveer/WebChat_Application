# WebChat Backend API

Ứng dụng WebChat backend được xây dựng với NestJS và MongoDB, hỗ trợ gửi tin nhắn văn bản giữa người dùng và trong nhóm.

## Tính năng chính

- ✅ Đăng ký và đăng nhập người dùng
- ✅ Gửi tin nhắn văn bản cho người dùng khác
- ✅ Tạo và quản lý nhóm chat
- ✅ Gửi tin nhắn trong nhóm
- ✅ Quản lý thành viên nhóm (thêm/xóa/thăng admin)
- ✅ Lịch sử tin nhắn với phân trang
- ✅ Mã hóa mật khẩu với bcrypt

## Cấu trúc Database

### User Schema
```typescript
{
  "_id": ObjectId,
  "phone_number": "+84901234567",
  "first_name": "Duy",
  "last_name": "Phan", 
  "profile_photo": "https://example.com/avatar.jpg",
  "password": "hashed_password"
}
```

### Group Schema
```typescript
{
  "_id": ObjectId,
  "name": "Project Team Chat",
  "members": [
    {
      "user_id": ObjectId,
      "joined_at": ISODate,
      "is_admin": true,
      "removed_at": null
    }
  ],
  "created_at": ISODate
}
```

### Message Schema
```typescript
{
  "_id": ObjectId,
  "sender_id": ObjectId,
  "receiver_type": "user" | "group",
  "receiver_id": ObjectId,
  "text": "Hello, team!",
  "timestamp": ISODate
}
```

## API Endpoints

### Users API

#### Đăng ký người dùng
```http
POST /users
Content-Type: application/json

{
  "phone_number": "+84901234567",
  "first_name": "Duy",
  "last_name": "Phan",
  "profile_photo": "https://example.com/avatar.jpg",
  "password": "1234567890"
}
```

#### Đăng nhập
```http
POST /users/login
Content-Type: application/json

{
  "phone_number": "+84901234567",
  "password": "1234567890"
}
```

#### Tìm kiếm người dùng
```http
GET /users/search?q=Duy
```

#### Lấy danh sách liên hệ
```http
GET /users/{userId}/contacts
```

### Groups API

#### Tạo nhóm
```http
POST /groups?creatorId={userId}
Content-Type: application/json

{
  "name": "Project Team Chat",
  "members": [
    {
      "user_id": "user_id_1",
      "is_admin": false
    },
    {
      "user_id": "user_id_2", 
      "is_admin": false
    }
  ]
}
```

#### Lấy nhóm của người dùng
```http
GET /groups/user/{userId}
```

#### Thêm thành viên vào nhóm
```http
POST /groups/{groupId}/members?userId={adminId}
Content-Type: application/json

{
  "user_id": "new_user_id",
  "is_admin": false
}
```

#### Xóa thành viên khỏi nhóm
```http
DELETE /groups/{groupId}/members?userId={requesterId}
Content-Type: application/json

{
  "user_id": "user_to_remove"
}
```

### Messages API

#### Gửi tin nhắn cho người dùng
```http
POST /messages/send-to-user?senderId={senderId}
Content-Type: application/json

{
  "receiver_id": "receiver_user_id",
  "text": "Hello!"
}
```

#### Gửi tin nhắn trong nhóm
```http
POST /messages/send-to-group?senderId={senderId}
Content-Type: application/json

{
  "group_id": "group_id",
  "text": "Hello team!"
}
```

#### Lấy tin nhắn
```http
GET /messages?receiver_id={receiverId}&receiver_type=user&userId={userId}&limit=50&before=2025-01-15T10:00:00Z
```

#### Lấy lịch sử chat giữa 2 người
```http
GET /messages/conversation/{userId1}/{userId2}
```

#### Lấy tin nhắn gần đây
```http
GET /messages/recent/{userId}
```

## Cài đặt và chạy

### Yêu cầu
- Node.js 18+
- MongoDB 4.4+
- npm hoặc yarn

### Cài đặt dependencies
```bash
cd backend
npm install
```

### Cấu hình môi trường
Tạo file `.env` từ `env.example`:
```bash
cp env.example .env
```

Cập nhật các biến môi trường trong `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/webchat
BACKEND_PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Chạy ứng dụng
```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## Quy tắc nghiệp vụ

### Tin nhắn nhóm
- Người dùng chỉ có thể xem tin nhắn được gửi sau khi họ tham gia nhóm
- Khi bị xóa khỏi nhóm, người dùng không thể xem tin nhắn mới
- Khi được thêm vào nhóm, người dùng chỉ thấy tin nhắn từ thời điểm tham gia

### Quản lý nhóm
- Chỉ admin mới có thể thêm/xóa thành viên
- Admin không thể xóa admin khác
- Người dùng có thể tự rời khỏi nhóm
- Ít nhất phải có 1 admin trong nhóm

### Bảo mật
- Mật khẩu được mã hóa với bcrypt (salt rounds: 12)
- Validation đầy đủ cho tất cả input
- Chỉ người gửi mới có thể xóa tin nhắn của mình

## Testing

```bash
# Unit tests
npm run test

# E2E tests  
npm run test:e2e

# Test coverage
npm run test:cov
```
