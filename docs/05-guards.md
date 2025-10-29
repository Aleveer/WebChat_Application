# 🛡️ Guards - Bảo Mật và Phân Quyền

## 📋 Tổng Quan

Guards trong NestJS được sử dụng để implement logic authorization. Trong WebChat Backend, chúng ta có 8 guards chính để bảo vệ các endpoints.

## 🎯 Các Loại Guards

```
Guards Hierarchy
├── JwtAuthGuard          # Authentication (JWT verification)
├── RolesGuard           # Role-based authorization
├── PermissionsGuard     # Permission-based authorization
├── GroupAdminGuard      # Group admin verification
├── GroupMemberGuard     # Group membership verification
├── MessageOwnerGuard    # Message ownership verification
├── ThrottleGuard        # Rate limiting
└── ApiKeyGuard          # API key validation
```

## 🔐 1. JwtAuthGuard

### Mục Đích
Xác thực JWT token và load thông tin user vào request.

### Implementation

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;  // Skip authentication for public routes
    }

    // 2. Extract token
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    
    if (!token) {
      throw new UnauthorizedException('JWT token not found');
    }

    // 3. Verify token
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });
      
      // 4. Attach user to request
      request['user'] = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid JWT token');
    }
  }

  private extractToken(request: Request): string | undefined {
    // From Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer' && token) return token;
    }
    
    // From cookie
    const cookieToken = request.cookies?.access_token;
    if (cookieToken) return cookieToken;
    
    return undefined;
  }
}
```

### Cách Sử Dụng

```typescript
// Áp dụng global trong app.module.ts
{
  provide: APP_GUARD,
  useClass: JwtAuthGuard,
}

// Hoặc áp dụng cho controller/route cụ thể
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get('me')
  getCurrentUser(@CurrentUser() user: User) {
    return user;
  }
}

// Skip authentication cho route public
@Get('public')
@Public()  // Decorator này skip JwtAuthGuard
getPublicData() {
  return { message: 'Public data' };
}
```

### Flow Diagram

```
Request → JwtAuthGuard
              │
              ├─► Check @Public() decorator
              │   └─► YES: Return true (skip auth)
              │   └─► NO: Continue
              │
              ├─► Extract token
              │   ├─► From Authorization header
              │   └─► From cookie
              │
              ├─► Verify JWT
              │   ├─► Check signature
              │   ├─► Check expiration
              │   └─► Decode payload
              │
              └─► Result
                  ├─► Valid: Attach user to request → Continue
                  └─► Invalid: Throw 401 Unauthorized
```

## 👤 2. RolesGuard

### Mục Đích
Kiểm tra xem user có role phù hợp không.

### Implementation

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. No roles required = allow access
    if (!requiredRoles) {
      return true;
    }

    // 3. Check user's role
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const userWithRole = user as unknown as { role?: string };
    const hasRole = requiredRoles.some((role) => userWithRole.role === role);

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

### Cách Sử Dụng

```typescript
// Apply guards theo thứ tự: Auth → Roles
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  
  // Chỉ admin access
  @Get('dashboard')
  @Roles('admin')
  getDashboard() {
    return { message: 'Admin dashboard' };
  }
  
  // Admin hoặc moderator
  @Get('users')
  @Roles('admin', 'moderator')
  getUsers() {
    return { users: [] };
  }
  
  // Không có @Roles() = mọi authenticated user access được
  @Get('public-admin')
  getPublicAdmin() {
    return { message: 'Any authenticated user' };
  }
}
```

### @Roles() Decorator

```typescript
export const Roles = (...roles: string[]) => {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    Reflect.defineMetadata('roles', roles, descriptor.value);
    return descriptor;
  };
};
```

## 🔑 3. PermissionsGuard

### Mục Đích
Kiểm tra permissions chi tiết hơn role (fine-grained access control).

### Implementation

```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get required permissions
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    // 2. Check user's permissions
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const userWithPermissions = user as unknown as { permissions?: string[] };
    const userPermissions = userWithPermissions.permissions || [];

    // Check if user has ANY of the required permissions
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

### Cách Sử Dụng

```typescript
@Controller('content')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContentController {
  
  @Post()
  @Permissions('content.create')
  createContent(@Body() dto: CreateContentDto) {
    // User needs 'content.create' permission
  }
  
  @Patch(':id')
  @Permissions('content.update', 'content.admin')
  updateContent(@Param('id') id: string, @Body() dto: UpdateContentDto) {
    // User needs 'content.update' OR 'content.admin' permission
  }
  
  @Delete(':id')
  @Permissions('content.delete')
  deleteContent(@Param('id') id: string) {
    // User needs 'content.delete' permission
  }
}
```

### Permission Naming Convention

```typescript
// Format: resource.action
const PERMISSIONS = {
  // Users
  'users.read': 'Read user data',
  'users.write': 'Create/update users',
  'users.delete': 'Delete users',
  'users.admin': 'Full user management',
  
  // Messages
  'messages.read': 'Read messages',
  'messages.write': 'Send messages',
  'messages.delete': 'Delete messages',
  
  // Groups
  'groups.create': 'Create groups',
  'groups.manage': 'Manage group settings',
  'groups.delete': 'Delete groups',
};
```

## 👥 4. GroupAdminGuard

### Mục Đích
Kiểm tra user có phải là admin của group không.

### Implementation

```typescript
@Injectable()
export class GroupAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    const groupId = request.params.groupId || request.params.id;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!groupId) {
      throw new ForbiddenException('Group ID is required');
    }

    if (!Types.ObjectId.isValid(groupId)) {
      throw new ForbiddenException('Invalid Group ID');
    }

    // Check if user is admin of this group
    const userWithAdminGroups = user as unknown as { adminGroups?: string[] };
    const userAdminGroups = userWithAdminGroups.adminGroups || [];
    const isAdmin = userAdminGroups.includes(groupId);

    if (!isAdmin) {
      throw new ForbiddenException('Only group admins can perform this action');
    }

    return true;
  }
}
```

### Cách Sử Dụng

```typescript
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  
  @Patch(':groupId')
  @UseGuards(GroupAdminGuard)  // Only admin can update
  updateGroup(
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.update(groupId, dto);
  }
  
  @Delete(':groupId')
  @UseGuards(GroupAdminGuard)  // Only admin can delete
  deleteGroup(@Param('groupId') groupId: string) {
    return this.groupsService.delete(groupId);
  }
  
  @Post(':groupId/members/:userId/admin')
  @UseGuards(GroupAdminGuard)  // Only admin can promote
  promoteToAdmin(
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
  ) {
    return this.groupsService.promoteToAdmin(groupId, userId);
  }
}
```

## 👥 5. GroupMemberGuard

### Mục Đích
Kiểm tra user có phải là member của group không.

### Implementation

```typescript
@Injectable()
export class GroupMemberGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    const groupId = request.params.groupId || request.params.id;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!groupId) {
      throw new ForbiddenException('Group ID is required');
    }

    // Check if user is member of this group
    const userWithGroups = user as unknown as { groups?: string[] };
    const userGroups = userWithGroups.groups || [];
    const isMember = userGroups.includes(groupId);

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return true;
  }
}
```

### Cách Sử Dụng

```typescript
@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  
  @Get(':groupId')
  @UseGuards(GroupMemberGuard)  // Only members can view
  getGroup(@Param('groupId') groupId: string) {
    return this.groupsService.findOne(groupId);
  }
  
  @Get(':groupId/messages')
  @UseGuards(GroupMemberGuard)  // Only members can read messages
  getMessages(@Param('groupId') groupId: string) {
    return this.messagesService.findByGroup(groupId);
  }
  
  @Post(':groupId/messages')
  @UseGuards(GroupMemberGuard)  // Only members can send messages
  sendMessage(
    @Param('groupId') groupId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.create(groupId, dto);
  }
}
```

## 💬 6. MessageOwnerGuard

### Mục Đích
Kiểm tra user có phải là người gửi message không (để delete/edit).

### Implementation

```typescript
@Injectable()
export class MessageOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    const messageId = request.params.messageId || request.params.id;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!messageId) {
      throw new ForbiddenException('Message ID is required');
    }

    // Message should be loaded by a middleware or previous guard
    const requestWithMessage = request as unknown as {
      message?: { sender_id: { toString: () => string } };
    };
    
    const message = requestWithMessage.message;

    if (!message) {
      throw new ForbiddenException('Message not found');
    }

    // Check if user is the sender
    const userWithId = user as unknown as {
      id?: string;
      _id?: { toString: () => string };
    };
    
    const userId = userWithId.id || userWithId._id?.toString();
    const isOwner = message.sender_id.toString() === userId;

    if (!isOwner) {
      throw new ForbiddenException(
        'You can only perform this action on your own messages',
      );
    }

    return true;
  }
}
```

### Cách Sử Dụng

```typescript
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  
  @Delete(':messageId')
  @UseGuards(MessageOwnerGuard)  // Only sender can delete
  deleteMessage(@Param('messageId') messageId: string) {
    return this.messagesService.delete(messageId);
  }
  
  @Patch(':messageId')
  @UseGuards(MessageOwnerGuard)  // Only sender can edit
  updateMessage(
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messagesService.update(messageId, dto);
  }
}

// Middleware to load message
@Injectable()
export class LoadMessageMiddleware implements NestMiddleware {
  constructor(private messagesService: MessagesService) {}
  
  async use(req: any, res: any, next: Function) {
    const messageId = req.params.messageId || req.params.id;
    if (messageId) {
      const message = await this.messagesService.findOne(messageId);
      req.message = message;
    }
    next();
  }
}
```

## ⏱️ 7. ThrottleGuard

### Mục Đích
Rate limiting để ngăn chặn abuse và DDoS.

### Implementation

```typescript
@Injectable()
export class ThrottleGuard extends NestThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    const clientIp = this.getClientIp(req);
    const user = req.user as { id?: string } | undefined;
    const userId = user?.id;

    // Track by both IP and user ID
    if (userId) {
      return `${clientIp}:${userId}`;
    }

    return clientIp;
  }

  private getClientIp(request: Request): string {
    // Try X-Real-IP header
    const xRealIp = request.headers['x-real-ip'] as string;
    if (xRealIp && this.isValidIp(xRealIp)) {
      return xRealIp;
    }

    // Try X-Forwarded-For header
    const xForwardedFor = request.headers['x-forwarded-for'] as string;
    if (xForwardedFor) {
      const ips = xForwardedFor.split(',').map((ip) => ip.trim());
      const firstIp = ips[0];
      if (firstIp && this.isValidIp(firstIp)) {
        return firstIp;
      }
    }

    // Fallback to request.ip
    return request.ip || 'unknown';
  }

  private isValidIp(ip: string): boolean {
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
  }
}
```

### Cách Sử Dụng

```typescript
import { Throttle, StrictThrottle, AuthThrottle } from './common';

@Controller('api')
@Throttle(100, 60000)  // 100 requests per minute
export class ApiController {
  @Get('data')
  getData() {
    // Inherits controller's rate limit
  }
}

@Controller('auth')
export class AuthController {
  
  @Post('login')
  @AuthThrottle()  // 5 requests per 15 minutes
  login(@Body() dto: LoginDto) {
    // Strict limit for auth endpoints
  }
  
  @Post('register')
  @StrictThrottle(10, 60000)  // 10 requests per minute
  register(@Body() dto: RegisterDto) {
    // Strict limit
  }
}

@Controller('upload')
export class UploadController {
  
  @Post()
  @Throttle(10, 3600000)  // 10 uploads per hour
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    // Limited uploads
  }
}
```

## 🔑 8. ApiKeyGuard

### Mục Đích
Validate API key cho third-party integrations.

### Implementation

```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Get valid API keys from environment
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    const isValid = validApiKeys.includes(apiKey);

    if (!isValid) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
```

### Cách Sử Dụng

```typescript
@Controller('api/external')
@UseGuards(ApiKeyGuard)  // Require API key
export class ExternalApiController {
  
  @Post('webhook')
  handleWebhook(@Body() data: WebhookDto) {
    // Process webhook from third-party
  }
  
  @Get('data')
  getData() {
    // External API access
  }
}
```

## 🎯 Guards Best Practices

### 1. Guard Order Matters

```typescript
// ❌ WRONG ORDER
@UseGuards(RolesGuard, JwtAuthGuard)  // RolesGuard runs first!

// ✅ CORRECT ORDER
@UseGuards(JwtAuthGuard, RolesGuard)  // Auth first, then role check
```

### 2. Combine Multiple Guards

```typescript
@Controller('admin/groups')
@UseGuards(JwtAuthGuard)  // Step 1: Authenticate
export class AdminGroupsController {
  
  @Patch(':groupId')
  @UseGuards(RolesGuard, GroupAdminGuard)  // Step 2: Check role & group admin
  @Roles('admin', 'moderator')
  updateGroup(@Param('groupId') groupId: string, @Body() dto: UpdateGroupDto) {
    // User must be:
    // 1. Authenticated (JwtAuthGuard)
    // 2. Have admin or moderator role (RolesGuard)
    // 3. Be admin of this specific group (GroupAdminGuard)
  }
}
```

### 3. Use @Public() for Open Endpoints

```typescript
@Controller('content')
@UseGuards(JwtAuthGuard)  // Protected by default
export class ContentController {
  
  @Get()
  @Public()  // Override: Anyone can access
  getPublicContent() {
    return this.contentService.findPublic();
  }
  
  @Post()
  createContent(@Body() dto: CreateContentDto) {
    // Requires authentication
  }
}
```

### 4. Custom Guard Logic

```typescript
@Injectable()
export class CustomBusinessGuard implements CanActivate {
  constructor(private businessService: BusinessService) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;
    
    // Custom business logic
    const canAccess = await this.businessService.checkAccess(
      user.id,
      resourceId,
    );
    
    if (!canAccess) {
      throw new ForbiddenException('You cannot access this resource');
    }
    
    return true;
  }
}
```

---

**Next:** [Interceptors Documentation →](./06-interceptors.md)

