# 🎯 API Examples - Hướng Dẫn Sử Dụng API

## 📋 Table of Contents

- [Authentication APIs](#authentication-apis)
- [User Management APIs](#user-management-apis)
- [Message APIs](#message-apis)
- [Group APIs](#group-apis)
- [File Upload APIs](#file-upload-apis)
- [Health & Metrics APIs](#health--metrics-apis)

## 🔐 Authentication APIs

### 1. User Registration

**Endpoint:** `POST /api/auth/register`

**Request:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+84901234567",
    "password": "MySecurePassword123!",
    "full_name": "Nguyen Van A",
    "email": "nguyenvana@example.com",
    "username": "nguyenvana"
  }'
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "phone_number": "+84901234567",
      "full_name": "Nguyen Van A",
      "email": "nguyenvana@example.com",
      "username": "nguyenvana",
      "role": "user",
      "created_at": "2025-10-29T10:00:00.000Z"
    }
  },
  "timestamp": "2025-10-29 10:00:00"
}
```

**Validation Rules:**

- `phone_number`: Required, must match format `+[1-9][0-9]{1,14}`
- `password`: Required, 8-64 characters, must contain uppercase, lowercase, number, and special character
- `full_name`: Required, 1-100 characters, letters and spaces only
- `email`: Optional, valid email format
- `username`: Optional, 3-50 characters, alphanumeric and underscore only

**Error Responses:**

```json
// 400 Bad Request - Validation Error
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": [
    {
      "field": "phone_number",
      "message": "phone_number must match format +[1-9][0-9]{1,14}"
    }
  ],
  "timestamp": "2025-10-29 10:00:00",
  "path": "/api/auth/register",
  "method": "POST",
  "requestId": "req_1234567890_abc123"
}

// 409 Conflict - User Already Exists
{
  "success": false,
  "error": "DUPLICATE_ENTRY",
  "message": "User already exists",
  "timestamp": "2025-10-29 10:00:00",
  "path": "/api/auth/register",
  "method": "POST",
  "requestId": "req_1234567890_abc123"
}
```

### 2. User Login

**Endpoint:** `POST /api/auth/login`

**Request:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+84901234567",
    "password": "MySecurePassword123!"
  }'
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "phone_number": "+84901234567",
      "full_name": "Nguyen Van A",
      "email": "nguyenvana@example.com",
      "username": "nguyenvana",
      "role": "user"
    }
  },
  "timestamp": "2025-10-29 10:00:00"
}
```

**Error Responses:**

```json
// 401 Unauthorized - Invalid Credentials
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Invalid credentials",
  "timestamp": "2025-10-29 10:00:00",
  "path": "/api/auth/login",
  "method": "POST",
  "requestId": "req_1234567890_abc123"
}
```

### 3. Refresh Token

**Endpoint:** `POST /api/auth/refresh`

**Request:**

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-10-29 10:00:00"
}
```

### 4. Get Current User

**Endpoint:** `GET /api/auth/me`

**Request:**

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "phone_number": "+84901234567",
    "full_name": "Nguyen Van A",
    "email": "nguyenvana@example.com",
    "username": "nguyenvana",
    "profile_photo": "https://example.com/photos/user.jpg",
    "role": "user",
    "permissions": ["read", "write"],
    "groups": ["group123", "group456"],
    "created_at": "2025-10-29T10:00:00.000Z"
  },
  "timestamp": "2025-10-29 10:00:00"
}
```

## 👤 User Management APIs

### 1. Update Profile

**Endpoint:** `PATCH /api/users/me`

**Request:**

```bash
curl -X PATCH http://localhost:3000/api/users/me \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Nguyen Van B",
    "email": "newemails@example.com",
    "username": "nguyenvanb"
  }'
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "phone_number": "+84901234567",
    "full_name": "Nguyen Van B",
    "email": "newemail@example.com",
    "username": "nguyenvanb",
    "updated_at": "2025-10-29T10:05:00.000Z"
  },
  "message": "Profile updated successfully",
  "timestamp": "2025-10-29 10:05:00"
}
```

### 2. Change Password

**Endpoint:** `POST /api/users/change-password`

**Request:**

```bash
curl -X POST http://localhost:3000/api/users/change-password \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "MySecurePassword123!",
    "new_password": "NewSecurePassword456!"
  }'
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Password changed successfully",
  "timestamp": "2025-10-29 10:05:00"
}
```

### 3. Get User by ID

**Endpoint:** `GET /api/users/:id`

**Request:**

```bash
curl -X GET http://localhost:3000/api/users/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer {token}"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "phone_number": "+84901234567",
    "full_name": "Nguyen Van A",
    "username": "nguyenvana",
    "profile_photo": "https://example.com/photos/user.jpg",
    "created_at": "2025-10-29T10:00:00.000Z"
  },
  "timestamp": "2025-10-29 10:05:00"
}
```

### 4. Search Users

**Endpoint:** `GET /api/users/search`

**Request:**

```bash
curl -X GET "http://localhost:3000/api/users/search?q=nguyen&page=1&limit=20" \
  -H "Authorization: Bearer {token}"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "phone_number": "+84901234567",
      "full_name": "Nguyen Van A",
      "username": "nguyenvana"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "phone_number": "+84901234568",
      "full_name": "Nguyen Thi B",
      "username": "nguyenthib"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "timestamp": "2025-10-29 10:05:00"
}
```

## 💬 Message APIs

### 1. Send Direct Message (User to User)

**Endpoint:** `POST /api/messages`

**Request:**

```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "receiver_id": "507f1f77bcf86cd799439012",
    "receiver_type": "user",
    "text": "Hello! How are you?"
  }'
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439020",
    "sender_id": "507f1f77bcf86cd799439011",
    "receiver_id": "507f1f77bcf86cd799439012",
    "receiver_type": "user",
    "text": "Hello! How are you?",
    "is_read": false,
    "created_at": "2025-10-29T10:10:00.000Z"
  },
  "message": "Message sent successfully",
  "timestamp": "2025-10-29 10:10:00"
}
```

### 2. Send Group Message

**Endpoint:** `POST /api/messages`

**Request:**

```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "receiver_id": "507f1f77bcf86cd799439030",
    "receiver_type": "group",
    "text": "Hello everyone in the group!"
  }'
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439021",
    "sender_id": "507f1f77bcf86cd799439011",
    "receiver_id": "507f1f77bcf86cd799439030",
    "receiver_type": "group",
    "text": "Hello everyone in the group!",
    "is_read": false,
    "created_at": "2025-10-29T10:10:00.000Z"
  },
  "message": "Message sent successfully",
  "timestamp": "2025-10-29 10:10:00"
}
```

### 3. Get Messages (Conversation)

**Endpoint:** `GET /api/messages`

**Query Parameters:**
- `receiver_id`: ID of receiver (user or group)
- `receiver_type`: "user" or "group"
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)

**Request:**

```bash
curl -X GET "http://localhost:3000/api/messages?receiver_id=507f1f77bcf86cd799439012&receiver_type=user&page=1&limit=50" \
  -H "Authorization: Bearer {token}"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439021",
      "sender_id": "507f1f77bcf86cd799439011",
      "receiver_id": "507f1f77bcf86cd799439012",
      "receiver_type": "user",
      "text": "Hello! How are you?",
      "is_read": true,
      "created_at": "2025-10-29T10:10:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439022",
      "sender_id": "507f1f77bcf86cd799439012",
      "receiver_id": "507f1f77bcf86cd799439011",
      "receiver_type": "user",
      "text": "I'm good, thanks!",
      "is_read": false,
      "created_at": "2025-10-29T10:11:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 2,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "timestamp": "2025-10-29 10:15:00"
}
```

### 4. Mark Message as Read

**Endpoint:** `PATCH /api/messages/:id/read`

**Request:**

```bash
curl -X PATCH http://localhost:3000/api/messages/507f1f77bcf86cd799439021/read \
  -H "Authorization: Bearer {token}"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439021",
    "is_read": true,
    "updated_at": "2025-10-29T10:15:00.000Z"
  },
  "message": "Message marked as read",
  "timestamp": "2025-10-29 10:15:00"
}
```

### 5. Delete Message

**Endpoint:** `DELETE /api/messages/:id`

**Request:**

```bash
curl -X DELETE http://localhost:3000/api/messages/507f1f77bcf86cd799439021 \
  -H "Authorization: Bearer {token}"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Message deleted successfully",
  "timestamp": "2025-10-29 10:20:00"
}
```

## 👥 Group APIs

### 1. Create Group

**Endpoint:** `POST /api/groups`

**Request:**

```bash
curl -X POST http://localhost:3000/api/groups \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Awesome Group",
    "description": "A group for awesome people",
    "member_ids": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
  }'
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439030",
    "name": "My Awesome Group",
    "description": "A group for awesome people",
    "members": [
      {
        "user_id": "507f1f77bcf86cd799439011",
        "is_admin": true,
        "joined_at": "2025-10-29T10:20:00.000Z"
      },
      {
        "user_id": "507f1f77bcf86cd799439012",
        "is_admin": false,
        "joined_at": "2025-10-29T10:20:00.000Z"
      },
      {
        "user_id": "507f1f77bcf86cd799439013",
        "is_admin": false,
        "joined_at": "2025-10-29T10:20:00.000Z"
      }
    ],
    "created_by": "507f1f77bcf86cd799439011",
    "created_at": "2025-10-29T10:20:00.000Z"
  },
  "message": "Group created successfully",
  "timestamp": "2025-10-29 10:20:00"
}
```

### 2. Get Group Details

**Endpoint:** `GET /api/groups/:id`

**Request:**

```bash
curl -X GET http://localhost:3000/api/groups/507f1f77bcf86cd799439030 \
  -H "Authorization: Bearer {token}"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439030",
    "name": "My Awesome Group",
    "description": "A group for awesome people",
    "members": [
      {
        "user_id": "507f1f77bcf86cd799439011",
        "full_name": "Nguyen Van A",
        "is_admin": true,
        "joined_at": "2025-10-29T10:20:00.000Z"
      },
      {
        "user_id": "507f1f77bcf86cd799439012",
        "full_name": "Nguyen Van B",
        "is_admin": false,
        "joined_at": "2025-10-29T10:20:00.000Z"
      }
    ],
    "member_count": 2,
    "created_by": "507f1f77bcf86cd799439011",
    "created_at": "2025-10-29T10:20:00.000Z"
  },
  "timestamp": "2025-10-29 10:25:00"
}
```

### 3. Add Member to Group

**Endpoint:** `POST /api/groups/:id/members`

**Request:**

```bash
curl -X POST http://localhost:3000/api/groups/507f1f77bcf86cd799439030/members \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "507f1f77bcf86cd799439014"
  }'
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user_id": "507f1f77bcf86cd799439014",
    "is_admin": false,
    "joined_at": "2025-10-29T10:30:00.000Z"
  },
  "message": "Member added successfully",
  "timestamp": "2025-10-29 10:30:00"
}
```

### 4. Remove Member from Group

**Endpoint:** `DELETE /api/groups/:groupId/members/:userId`

**Request:**

```bash
curl -X DELETE http://localhost:3000/api/groups/507f1f77bcf86cd799439030/members/507f1f77bcf86cd799439014 \
  -H "Authorization: Bearer {token}"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Member removed successfully",
  "timestamp": "2025-10-29 10:35:00"
}
```

### 5. Update Group

**Endpoint:** `PATCH /api/groups/:id`

**Request:**

```bash
curl -X PATCH http://localhost:3000/api/groups/507f1f77bcf86cd799439030 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Group Name",
    "description": "New description"
  }'
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439030",
    "name": "Updated Group Name",
    "description": "New description",
    "updated_at": "2025-10-29T10:40:00.000Z"
  },
  "message": "Group updated successfully",
  "timestamp": "2025-10-29 10:40:00"
}
```

## 📁 File Upload APIs

### 1. Upload File

**Endpoint:** `POST /api/files/upload`

**Request:**

```bash
curl -X POST http://localhost:3000/api/files/upload \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/image.jpg"
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439040",
    "original_name": "image.jpg",
    "file_name": "image_1698567890123_abc123def456.jpg",
    "file_url": "http://localhost:3000/uploads/image_1698567890123_abc123def456.jpg",
    "file_size": 245632,
    "file_type": "image",
    "mime_type": "image/jpeg",
    "uploaded_by": "507f1f77bcf86cd799439011",
    "created_at": "2025-10-29T10:45:00.000Z"
  },
  "message": "File uploaded successfully",
  "timestamp": "2025-10-29 10:45:00"
}
```

**Supported File Types:**
- Images: jpg, jpeg, png, gif, webp
- Documents: pdf, doc, docx, xls, xlsx, txt
- Max size: 10MB (configurable)

### 2. Get File

**Endpoint:** `GET /uploads/:filename`

**Request:**

```bash
curl -X GET http://localhost:3000/uploads/image_1698567890123_abc123def456.jpg
```

**Response:** Binary file data

## 🏥 Health & Metrics APIs

### 1. Health Check

**Endpoint:** `GET /health`

**Request:**

```bash
curl -X GET http://localhost:3000/health
```

**Response:** `200 OK` (healthy) or `503 Service Unavailable` (unhealthy)

```json
{
  "statusCode": 200,
  "status": "healthy",
  "timestamp": "2025-10-29 10:50:00",
  "uptime": 3600,
  "memory": {
    "rss": 123456789,
    "heapTotal": 98765432,
    "heapUsed": 87654321,
    "external": 12345678
  },
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 15,
      "details": {
        "database": "webchat",
        "readyState": 1
      }
    },
    "cache": {
      "status": "healthy",
      "responseTime": 5,
      "details": {
        "operations": {
          "set": true,
          "get": true,
          "has": true,
          "delete": true
        }
      }
    }
  }
}
```

### 2. Database Health

**Endpoint:** `GET /health/database`

**Request:**

```bash
curl -X GET http://localhost:3000/health/database
```

**Response:** `200 OK`

```json
{
  "component": "database",
  "status": "healthy",
  "responseTime": 12,
  "details": {
    "database": "webchat",
    "readyState": 1
  }
}
```

### 3. Get Metrics (Admin Only)

**Endpoint:** `GET /metrics`

**Request:**

```bash
curl -X GET http://localhost:3000/metrics \
  -H "Authorization: Bearer {admin_token}"
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "counters": {
      "http_requests_total": 12345,
      "http_requests_success": 12000,
      "http_requests_error": 345
    },
    "histograms": {
      "http_request_duration_ms": {
        "count": 12345,
        "min": 5,
        "max": 980,
        "avg": 145,
        "p50": 120,
        "p95": 450,
        "p99": 850
      }
    },
    "timestamp": "2025-10-29 10:55:00"
  }
}
```

## 🔧 Common Headers

### Required Headers

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Optional Headers

```
X-Request-ID: {custom_request_id}      # For request tracking
Accept-Language: en                     # Language preference
X-Timezone: Asia/Ho_Chi_Minh           # Timezone for date formatting
```

### Response Headers

```
X-Request-ID: req_1234567890_abc123    # Unique request ID
X-Correlation-ID: req_1234567890_abc123 # Correlation ID for tracing
X-RateLimit-Limit: 100                  # Rate limit max requests
X-RateLimit-Remaining: 95               # Remaining requests
X-RateLimit-Reset: 1698567890           # Reset timestamp
```

## 🚨 Error Response Format

All errors follow this standard format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {},
  "timestamp": "2025-10-29 10:00:00",
  "path": "/api/endpoint",
  "method": "POST",
  "requestId": "req_1234567890_abc123"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required or failed |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

**Next:** [Best Practices →](./11-best-practices.md)

