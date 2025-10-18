import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

// Base Auth Guard
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    return true;
  }
}

// JWT Auth Guard
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('JWT token not found');
    }

    // Here you would verify the JWT token
    // For now, we'll assume the token is valid if it exists
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

// Roles Guard
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

// Permissions Guard
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const userPermissions = user.permissions || [];
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

// Group Member Guard
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

    // Here you would check if user is a member of the group
    // This is a simplified version
    const userGroups = user.groups || [];
    const isMember = userGroups.includes(groupId);

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return true;
  }
}

// Group Admin Guard
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

    // Here you would check if user is an admin of the group
    // This is a simplified version
    const userAdminGroups = user.adminGroups || [];
    const isAdmin = userAdminGroups.includes(groupId);

    if (!isAdmin) {
      throw new ForbiddenException('Only group admins can perform this action');
    }

    return true;
  }
}

// Message Owner Guard
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

    // Here you would check if user is the owner of the message
    // This is a simplified version
    const message = (request as any).message; // Assuming message is attached to request
    if (!message) {
      throw new ForbiddenException('Message not found');
    }

    const isOwner = message.sender_id.toString() === user.id;
    if (!isOwner) {
      throw new ForbiddenException(
        'You can only perform this action on your own messages',
      );
    }

    return true;
  }
}

// Rate Limiting Guard
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly requests = new Map<
    string,
    { count: number; resetTime: number }
  >();

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rateLimitConfig = this.reflector.getAllAndOverride<{
      limit: number;
      windowMs: number;
    }>('rateLimit', [context.getHandler(), context.getClass()]);

    if (!rateLimitConfig) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const clientId = request.ip || 'unknown';
    const now = Date.now();
    const windowMs = rateLimitConfig.windowMs;
    const limit = rateLimitConfig.limit;

    const clientRequests = this.requests.get(clientId);

    if (!clientRequests || now > clientRequests.resetTime) {
      this.requests.set(clientId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (clientRequests.count >= limit) {
      throw new ForbiddenException('Rate limit exceeded');
    }

    clientRequests.count++;
    return true;
  }
}

// API Key Guard
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    // Here you would validate the API key
    // This is a simplified version
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    const isValid = validApiKeys.includes(apiKey);

    if (!isValid) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}

// Throttle Guard (for specific endpoints)
@Injectable()
export class ThrottleGuard implements CanActivate {
  private readonly throttleMap = new Map<string, number>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const endpoint = `${request.method}:${request.route?.path}`;
    const now = Date.now();
    const lastRequest = this.throttleMap.get(endpoint) || 0;
    const throttleMs = 1000; // 1 second throttle

    if (now - lastRequest < throttleMs) {
      throw new ForbiddenException('Too many requests, please slow down');
    }

    this.throttleMap.set(endpoint, now);
    return true;
  }
}
