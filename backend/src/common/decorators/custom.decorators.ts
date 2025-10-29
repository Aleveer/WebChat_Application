import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { APP_CONSTANTS } from '../constants/app.constants';
import { UserDocument } from '../types';
import '../types/express.d';

//TODO: Write test-cases for decorators file
// Get current user from request
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Express.Request['user'] => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user;
  },
);

// Get user ID from request
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as UserDocument | undefined;

    if (!user) return undefined;

    // Handle both MongoDB ObjectId and string ID
    if (user.id) return user.id;
    if (user._id) {
      return typeof user._id === 'string' ? user._id : user._id.toString();
    }

    return undefined;
  },
);

// Get IP address from request
export const ClientIP = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (
      request.ip ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  },
);

// Get User Agent from request
export const UserAgent = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.get('User-Agent') || '';
  },
);

// Get pagination parameters
export const Pagination = createParamDecorator(
  (
    data: string[] | undefined, // Pass allowed sort fields as parameter
    ctx: ExecutionContext,
  ): {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
  } => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const page =
      parseInt(request.query.page as string) ||
      APP_CONSTANTS.PAGINATION.DEFAULT_PAGE;
    const limit =
      parseInt(request.query.limit as string) ||
      APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT;
    const sortBy = request.query.sortBy as string;
    const sortOrder = (request.query.sortOrder as 'asc' | 'desc') || 'desc';

    // Use provided allowed fields or default set
    const allowedSortFields = data || [
      'created_at',
      'updated_at',
      'createdAt',
      'updatedAt',
      'name',
      'email',
      'full_name',
    ];

    const validatedSortBy =
      sortBy && allowedSortFields.includes(sortBy) ? sortBy : 'created_at';

    return {
      page: Math.max(APP_CONSTANTS.PAGINATION.DEFAULT_PAGE, page),
      limit: Math.min(
        APP_CONSTANTS.PAGINATION.MAX_LIMIT,
        Math.max(APP_CONSTANTS.PAGINATION.MIN_LIMIT, limit),
      ),
      sortBy: validatedSortBy,
      sortOrder,
    };
  },
);

// Get search query
export const SearchQuery = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.query.q as string;
  },
);

// Get request ID for tracing
export const RequestId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (
      (request.headers['x-request-id'] as string) ||
      (request.headers['x-correlation-id'] as string) ||
      'unknown'
    );
  },
);

// Get language from request headers
export const Language = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request.headers['accept-language'] as string) || 'en';
  },
);

// Get timezone from request headers
export const Timezone = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request.headers['x-timezone'] as string) || 'UTC';
  },
);

// Custom decorator for roles
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

// Custom decorator for permissions
export const Permissions = (...permissions: string[]) => {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    Reflect.defineMetadata('permissions', permissions, descriptor.value);
    return descriptor;
  };
};

// Custom decorator for public routes (skip auth)
export const Public = () => {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    Reflect.defineMetadata('isPublic', true, descriptor.value);
    return descriptor;
  };
};

// Custom decorator for rate limiting
// Note: For rate limiting, use @nestjs/throttler decorators from throttle.decorators.ts
export const RateLimit = (limit: number, windowMs: number) => {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    Reflect.defineMetadata('rateLimit', { limit, windowMs }, descriptor.value);
    return descriptor;
  };
};

// Note: For caching, use decorators from cache.decorators.ts (@Cache, @ShortCache, etc.)

// Custom decorator for validation groups
export const ValidationGroups = (...groups: string[]) => {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    Reflect.defineMetadata('validationGroups', groups, descriptor.value);
    return descriptor;
  };
};

// Custom decorator for API versioning
export const ApiVersion = (version: string) => {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    Reflect.defineMetadata('apiVersion', version, descriptor.value);
    return descriptor;
  };
};

// Custom decorator for deprecated endpoints
export const Deprecated = (message?: string) => {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    Reflect.defineMetadata('deprecated', { message }, descriptor.value);
    return descriptor;
  };
};

// Custom decorator for file upload
export const FileUpload = (fieldName: string, maxSize?: number) => {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    Reflect.defineMetadata(
      'fileUpload',
      { fieldName, maxSize },
      descriptor.value,
    );
    return descriptor;
  };
};

// Custom decorator for API response transformation
export const TransformResponse = (transformer: (data: unknown) => unknown) => {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    Reflect.defineMetadata('transformResponse', transformer, descriptor.value);
    return descriptor;
  };
};

// Custom decorator for response examples
export const ApiExample = (example: unknown) => {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor => {
    Reflect.defineMetadata('apiExample', example, descriptor.value);
    return descriptor;
  };
};
