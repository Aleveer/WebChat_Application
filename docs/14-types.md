# Types

## Mục lục
- [Tổng quan](#tổng-quan)
- [Database Types](#database-types)
- [Response Types](#response-types)
- [Metadata Types](#metadata-types)
- [Express Types](#express-types)
- [Common Types](#common-types)
- [Best Practices](#best-practices)

---

## Tổng quan

Types định nghĩa cấu trúc dữ liệu và type safety cho toàn bộ ứng dụng. Common module cung cấp một bộ types chuẩn hóa cho database, responses, metadata và nhiều mục đích khác.

## Database Types

### BaseDocument

Interface cơ bản cho tất cả MongoDB documents.

**Definition:**
```typescript
export interface BaseDocument {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

**Sử dụng:**

```typescript
import { BaseDocument } from '@/common/types';

export interface User extends BaseDocument {
  email: string;
  name: string;
  role: string;
}

// Type-safe document access
function processUser(user: User) {
  console.log(user._id);        // Types.ObjectId
  console.log(user.createdAt);  // Date
  console.log(user.email);      // string
}
```

---

### MongoId

Union type cho MongoDB ID.

**Definition:**
```typescript
export type MongoId = Types.ObjectId | string;
```

**Sử dụng:**

```typescript
import { MongoId } from '@/common/types';

// Accept both ObjectId and string
function findById(id: MongoId): Promise<User> {
  const objectId = typeof id === 'string' 
    ? new Types.ObjectId(id) 
    : id;
  return User.findById(objectId);
}

// Usage
await findById('507f1f77bcf86cd799439011');
await findById(new Types.ObjectId());
```

---

### ID Type Aliases

Semantic type aliases cho các entity IDs.

**Definitions:**
```typescript
export type UserId = string;
export type GroupId = string;
export type MessageId = string;
export type FileId = string;
```

**Sử dụng:**

```typescript
import { UserId, GroupId, MessageId } from '@/common/types';

interface Message {
  id: MessageId;
  senderId: UserId;
  groupId?: GroupId;
  text: string;
}

// Type-safe function signatures
async function sendMessage(
  senderId: UserId,
  receiverId: UserId | GroupId,
  text: string
): Promise<MessageId> {
  // Implementation
}
```

**Lợi ích:**
- Self-documenting code
- Tránh nhầm lẫn giữa các loại IDs
- Dễ dàng refactor type definitions

---

### JwtPayload

Type cho JWT token payload.

**Definition:**
```typescript
export interface JwtPayload {
  sub: string;              // User ID
  phone_number: string;
  username?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  iat?: number;            // Issued at
  exp?: number;            // Expiration
}
```

**Sử dụng:**

```typescript
import { JwtPayload } from '@/common/types';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async generateToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      phone_number: user.phoneNumber,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };
    
    return this.jwtService.sign(payload);
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verify<JwtPayload>(token);
  }
}
```

---

### UserInfo

Extended type cho user information.

**Definition:**
```typescript
export interface UserInfo {
  id?: string;
  _id?: Types.ObjectId;
  sub?: string;
  role?: string;
  permissions?: string[];
  groups?: string[];
  adminGroups?: string[];
  phone_number?: string;
  username?: string;
  email?: string;
  full_name?: string;
}
```

**Sử dụng:**

```typescript
import { UserInfo } from '@/common/types';

// In guards and decorators
function hasPermission(user: UserInfo, permission: string): boolean {
  return user.permissions?.includes(permission) ?? false;
}

// In request handlers
@Get('profile')
async getProfile(@CurrentUser() user: UserInfo) {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    role: user.role,
  };
}
```

---

### ReceiverType

Type cho message receiver type.

**Definition:**
```typescript
export type ReceiverType = 'user' | 'group';
```

**Sử dụng:**

```typescript
import { ReceiverType, UserId, GroupId } from '@/common/types';

interface SendMessageDto {
  receiverType: ReceiverType;
  receiverId: UserId | GroupId;
  text: string;
}

function validateReceiver(type: ReceiverType, id: string): boolean {
  if (type === 'user') {
    return isValidUserId(id);
  } else if (type === 'group') {
    return isValidGroupId(id);
  }
  return false;
}
```

---

## Response Types

### PaginatedResponse<T>

Type cho paginated API responses.

**Definition:**
```typescript
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Sử dụng:**

```typescript
import { PaginatedResponse } from '@/common/types';

@Get()
async findAll(
  @Query() paginationDto: PaginationDto
): Promise<PaginatedResponse<User>> {
  const [data, total] = await Promise.all([
    this.usersService.findAll(paginationDto),
    this.usersService.count(),
  ]);

  return {
    data,
    meta: {
      page: paginationDto.page,
      limit: paginationDto.limit,
      total,
      totalPages: Math.ceil(total / paginationDto.limit),
    },
  };
}
```

---

### AuthResponse

Type cho authentication responses.

**Definition:**
```typescript
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    phone_number: string;
    username?: string;
    email?: string;
  };
}
```

**Sử dụng:**

```typescript
import { AuthResponse } from '@/common/types';

@Post('login')
async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
  const user = await this.authService.validateUser(loginDto);
  const tokens = await this.authService.generateTokens(user);

  return {
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    user: {
      id: user.id,
      phone_number: user.phoneNumber,
      email: user.email,
      username: user.username,
    },
  };
}
```

---

### Entity Response Types

Standard response types cho các entities.

#### UserResponse

```typescript
export interface UserResponse {
  id: string;
  phone_number: string;
  full_name: string;
  username?: string;
  email?: string;
  profile_photo?: string;
  created_at: Date;
  updated_at: Date;
}
```

#### GroupResponse

```typescript
export interface GroupResponse {
  id: string;
  name: string;
  description?: string;
  members: Array<{
    user_id: string;
    is_admin: boolean;
    joined_at: Date;
  }>;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}
```

#### MessageResponse

```typescript
export interface MessageResponse {
  id: string;
  sender_id: string;
  receiver_type: 'user' | 'group';
  receiver_id: string;
  text: string;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
}
```

#### FileResponse

```typescript
export interface FileResponse {
  id: string;
  original_name: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  uploaded_by: string;
  created_at: Date;
}
```

#### NotificationResponse

```typescript
export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  content: string;
  sender: string;
  recipient: string;
  is_read: boolean;
  created_at: Date;
}
```

---

### API Response Types

#### ApiErrorResponse

```typescript
export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: unknown;
  timestamp: string;
  path: string;
  method: string;
  requestId: string;
}
```

**Sử dụng:**

```typescript
import { ApiErrorResponse } from '@/common/types';

function createErrorResponse(
  error: Error,
  request: Request
): ApiErrorResponse {
  return {
    success: false,
    error: 'INTERNAL_ERROR',
    message: error.message,
    timestamp: new Date().toISOString(),
    path: request.url,
    method: request.method,
    requestId: request.requestId,
  };
}
```

---

#### ApiSuccessResponse<T>

```typescript
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}
```

**Sử dụng:**

```typescript
import { ApiSuccessResponse } from '@/common/types';

@Get(':id')
async findOne(@Param('id') id: string): Promise<ApiSuccessResponse<User>> {
  const user = await this.usersService.findById(id);

  return {
    success: true,
    data: user,
    timestamp: new Date().toISOString(),
  };
}
```

---

## Metadata Types

### Generic Metadata Type

```typescript
export type Metadata = Record<string, unknown>;
```

**Sử dụng:**

```typescript
interface Entity {
  id: string;
  name: string;
  metadata?: Metadata;
}

const entity: Entity = {
  id: '123',
  name: 'Example',
  metadata: {
    color: 'blue',
    priority: 5,
    tags: ['important', 'urgent'],
  },
};
```

---

### Specific Metadata Types

#### FileMetadataStructure

```typescript
export interface FileMetadataStructure {
  width?: number;
  height?: number;
  duration?: number;
  tags?: string[];
  description?: string;
  custom_fields?: Record<string, unknown>;
}
```

**Sử dụng:**

```typescript
interface File {
  id: string;
  name: string;
  metadata: FileMetadataStructure;
}

const imageFile: File = {
  id: '123',
  name: 'photo.jpg',
  metadata: {
    width: 1920,
    height: 1080,
    tags: ['vacation', 'beach'],
    description: 'Summer vacation photo',
  },
};
```

---

#### NotificationMetadataStructure

```typescript
export interface NotificationMetadataStructure {
  group_id?: string;
  message_preview?: string;
  sender_info?: Record<string, unknown>;
  action_url?: string;
  custom_data?: Record<string, unknown>;
}
```

**Sử dụng:**

```typescript
interface Notification {
  id: string;
  type: string;
  metadata: NotificationMetadataStructure;
}

const notification: Notification = {
  id: '123',
  type: 'new_message',
  metadata: {
    group_id: 'group_456',
    message_preview: 'Hello everyone!',
    sender_info: {
      name: 'John Doe',
      avatar: 'avatar.jpg',
    },
    action_url: '/chat/group/456',
  },
};
```

---

#### AnalyticsMetadataStructure

```typescript
export interface AnalyticsMetadataStructure {
  browser?: string;
  os?: string;
  device?: string;
  location?: string;
  event_source?: string;
  custom_properties?: Record<string, unknown>;
}
```

**Sử dụng:**

```typescript
interface AnalyticsEvent {
  event: string;
  timestamp: Date;
  metadata: AnalyticsMetadataStructure;
}

const event: AnalyticsEvent = {
  event: 'page_view',
  timestamp: new Date(),
  metadata: {
    browser: 'Chrome',
    os: 'Windows 10',
    device: 'Desktop',
    location: 'Vietnam',
    event_source: 'web_app',
    custom_properties: {
      page: '/dashboard',
      referrer: '/login',
    },
  },
};
```

---

## Express Types

### Request Extension

Extended Request type với custom properties.

**Definition:**
```typescript
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        _id: string;
        phone_number: string;
        full_name: string;
        username?: string;
        email?: string;
        profile_photo?: string;
        role?: string;
        permissions?: string[];
        groups?: string[];
        adminGroups?: string[];
      };
      requestId: string;
      correlationId?: string;
      startTime?: number;
    }
  }
}
```

**Sử dụng:**

```typescript
// Request type tự động include extensions
app.use((req: Request, res: Response, next: NextFunction) => {
  req.requestId = generateRequestId();
  req.startTime = Date.now();
  next();
});

// Access trong handlers
@Get('profile')
async getProfile(@Req() req: Request) {
  const userId = req.user.id;      // Type-safe
  const requestId = req.requestId; // Type-safe
  return await this.usersService.findById(userId);
}
```

---

## Common Types

### User

Complete user type.

**Definition:**
```typescript
export interface User {
  id: string;
  _id: string;
  phone_number: string;
  full_name: string;
  username?: string;
  email?: string;
  profile_photo?: string;
  password?: string;
  role?: string;
  permissions?: string[];
  groups?: string[];
  adminGroups?: string[];
  created_at?: Date;
  updated_at?: Date;
}
```

---

### UserDocument

Flexible user document type.

**Definition:**
```typescript
export interface UserDocument {
  id?: string;
  _id?: { toString: () => string } | string;
  phone_number?: string;
  full_name?: string;
  username?: string;
  email?: string;
  profile_photo?: string;
  role?: string;
  permissions?: string[];
  groups?: string[];
  adminGroups?: string[];
}
```

**Sử dụng:**

```typescript
// Handle both Mongoose document and plain object
function getUserId(user: UserDocument): string {
  if (user.id) return user.id;
  
  if (user._id) {
    return typeof user._id === 'string' 
      ? user._id 
      : user._id.toString();
  }
  
  throw new Error('User ID not found');
}
```

---

### PaginationMeta

```typescript
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

---

### ApiResponse<T>

```typescript
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
}
```

---

### RequestWithUser

Extended Request với User type.

**Definition:**
```typescript
export interface RequestWithUser extends Request {
  user?: User;
  requestId: string;
  correlationId?: string;
  startTime?: number;
}
```

**Sử dụng:**

```typescript
function requireAuth(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    throw new UnauthorizedException('Authentication required');
  }
  next();
}
```

---

## Best Practices

### 1. Use Strict Types

**❌ Không tốt:**
```typescript
function processData(data: any) {
  return data.map(item => item.value);
}
```

**✅ Tốt:**
```typescript
interface DataItem {
  id: string;
  value: number;
}

function processData(data: DataItem[]): number[] {
  return data.map(item => item.value);
}
```

---

### 2. Avoid Type Assertions

**❌ Không tốt:**
```typescript
const user = req.user as User;
const id = user.id as string;
```

**✅ Tốt:**
```typescript
if (!req.user) {
  throw new UnauthorizedException();
}

const user: User = req.user;
const id: string = user.id;
```

---

### 3. Use Union Types

```typescript
type Status = 'pending' | 'approved' | 'rejected';

interface Request {
  id: string;
  status: Status;  // Only allows specific values
}

// Type-safe switch
function handleStatus(status: Status) {
  switch (status) {
    case 'pending':
      return 'Waiting for approval';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      // TypeScript ensures all cases are handled
      const _exhaustive: never = status;
      return _exhaustive;
  }
}
```

---

### 4. Generic Types

```typescript
// Reusable generic response type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Usage with different types
const userResponse: ApiResponse<User> = {
  success: true,
  data: { id: '123', name: 'John' },
};

const usersResponse: ApiResponse<User[]> = {
  success: true,
  data: [
    { id: '123', name: 'John' },
    { id: '456', name: 'Jane' },
  ],
};
```

---

### 5. Utility Types

```typescript
// Partial - Make all properties optional
type PartialUser = Partial<User>;

// Pick - Select specific properties
type UserCredentials = Pick<User, 'email' | 'password'>;

// Omit - Exclude specific properties
type UserWithoutPassword = Omit<User, 'password'>;

// Required - Make all properties required
type RequiredUser = Required<User>;

// Readonly - Make all properties readonly
type ImmutableUser = Readonly<User>;
```

---

### 6. Type Guards

```typescript
function isUser(obj: any): obj is User {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string'
  );
}

function processEntity(entity: User | Group) {
  if (isUser(entity)) {
    // TypeScript knows entity is User here
    console.log(entity.email);
  } else {
    // TypeScript knows entity is Group here
    console.log(entity.members);
  }
}
```

---

### 7. Discriminated Unions

```typescript
interface SuccessResult {
  success: true;
  data: any;
}

interface ErrorResult {
  success: false;
  error: string;
}

type Result = SuccessResult | ErrorResult;

function handleResult(result: Result) {
  if (result.success) {
    // TypeScript knows this is SuccessResult
    console.log(result.data);
  } else {
    // TypeScript knows this is ErrorResult
    console.log(result.error);
  }
}
```

---

### 8. Index Signatures

```typescript
interface Dictionary<T> {
  [key: string]: T;
}

const userCache: Dictionary<User> = {
  '123': { id: '123', name: 'John' },
  '456': { id: '456', name: 'Jane' },
};

// Type-safe access
const user = userCache['123']; // Type: User | undefined
```

---

### 9. Mapped Types

```typescript
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

interface User {
  id: string;
  name: string;
  email: string;
}

type NullableUser = Nullable<User>;
// Result:
// {
//   id: string | null;
//   name: string | null;
//   email: string | null;
// }
```

---

### 10. Conditional Types

```typescript
type NonNullable<T> = T extends null | undefined ? never : T;

type StringOrNumber = string | number | null;
type NonNullStringOrNumber = NonNullable<StringOrNumber>;
// Result: string | number
```

---

## Ví dụ Thực tế

### Service với Type Safety

```typescript
import {
  User,
  UserId,
  PaginatedResponse,
  ApiResponse,
} from '@/common/types';

@Injectable()
export class UsersService {
  async findById(id: UserId): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll(
    page: number,
    limit: number
  ): Promise<PaginatedResponse<User>> {
    const [data, total] = await Promise.all([
      this.userModel
        .find()
        .skip((page - 1) * limit)
        .limit(limit),
      this.userModel.countDocuments(),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(dto: CreateUserDto): Promise<User> {
    const user = await this.userModel.create(dto);
    return user;
  }
}
```

---

## Tham khảo

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Advanced Types](https://www.typescriptlang.org/docs/handbook/advanced-types.html)
- [Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

