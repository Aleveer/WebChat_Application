import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import {
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  AuthGuard,
  RolesGuard,
  PermissionsGuard,
  GroupMemberGuard,
  GroupAdminGuard,
  MessageOwnerGuard,
  RateLimitGuard,
  ApiKeyGuard,
  ThrottleGuard,
} from './auth.guards';

//TODO: Implement tests for JwtAuthGuard, test real domain, ..
describe('Auth Guards', () => {
  let mockRequest: Partial<Request>;
  let mockExecutionContext: ExecutionContext;
  let reflector: Reflector;

  beforeEach(() => {
    mockRequest = {
      user: {
        id: 'user-123',
        role: 'user',
        permissions: ['read', 'write'],
        groups: ['group-1', 'group-2'],
        adminGroups: ['group-1'],
      },
      ip: '127.0.0.1',
      headers: {
        'x-api-key': 'valid-api-key',
      },
      params: {
        groupId: 'group-1',
        messageId: 'message-123',
        id: 'group-1',
      },
      method: 'GET',
      route: { path: '/test' },
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;

    reflector = new Reflector();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthGuard', () => {
    let guard: AuthGuard;

    beforeEach(() => {
      guard = new AuthGuard(reflector);
    });

    it('should allow access for public endpoints', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow access when user is authenticated', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when user is not authenticated', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      mockRequest.user = undefined;

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('RolesGuard', () => {
    let guard: RolesGuard;

    beforeEach(() => {
      guard = new RolesGuard(reflector);
    });

    it('should allow access when no roles are required', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow access when user has required role', () => {
      // Arrange
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['user', 'admin']);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when user is not authenticated', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
      mockRequest.user = undefined;

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException when user does not have required role', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('PermissionsGuard', () => {
    let guard: PermissionsGuard;

    beforeEach(() => {
      guard = new PermissionsGuard(reflector);
    });

    it('should allow access when no permissions are required', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow access when user has required permission', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read']);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when user is not authenticated', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read']);
      mockRequest.user = undefined;

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException when user does not have required permission', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['delete']);

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should handle user without permissions array', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['read']);
      mockRequest.user = { ...mockRequest.user, permissions: undefined };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('GroupMemberGuard', () => {
    let guard: GroupMemberGuard;

    beforeEach(() => {
      guard = new GroupMemberGuard();
    });

    it('should allow access when user is a member of the group', () => {
      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when user is not authenticated', () => {
      // Arrange
      mockRequest.user = undefined;

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException when group ID is missing', () => {
      // Arrange
      mockRequest.params = {};

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when user is not a member of the group', () => {
      // Arrange
      mockRequest.params = { groupId: 'group-999' };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should handle user without groups array', () => {
      // Arrange
      mockRequest.user = { ...mockRequest.user, groups: undefined };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('GroupAdminGuard', () => {
    let guard: GroupAdminGuard;

    beforeEach(() => {
      guard = new GroupAdminGuard();
    });

    it('should allow access when user is an admin of the group', () => {
      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when user is not authenticated', () => {
      // Arrange
      mockRequest.user = undefined;

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException when group ID is missing', () => {
      // Arrange
      mockRequest.params = {};

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when user is not an admin of the group', () => {
      // Arrange
      mockRequest.params = { groupId: 'group-2' };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should handle user without adminGroups array', () => {
      // Arrange
      mockRequest.user = { ...mockRequest.user, adminGroups: undefined };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('MessageOwnerGuard', () => {
    let guard: MessageOwnerGuard;

    beforeEach(() => {
      guard = new MessageOwnerGuard();
      (mockRequest as any).message = {
        sender_id: 'user-123',
      };
    });

    it('should allow access when user is the owner of the message', () => {
      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when user is not authenticated', () => {
      // Arrange
      mockRequest.user = undefined;

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException when message ID is missing', () => {
      // Arrange
      mockRequest.params = {};

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when message is not found', () => {
      // Arrange
      (mockRequest as any).message = undefined;

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when user is not the owner of the message', () => {
      // Arrange
      (mockRequest as any).message = {
        sender_id: 'user-999',
      };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('RateLimitGuard', () => {
    let guard: RateLimitGuard;

    beforeEach(() => {
      guard = new RateLimitGuard(reflector);
    });

    it('should allow access when no rate limit is configured', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow access when within rate limit', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        limit: 10,
        windowMs: 60000,
      });

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when rate limit is exceeded', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        limit: 1,
        windowMs: 60000,
      });

      // Act - First request should pass
      guard.canActivate(mockExecutionContext);

      // Act & Assert - Second request should fail
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should reset rate limit after window expires', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        limit: 1,
        windowMs: 1, // Very short window
      });

      // Act - First request should pass
      guard.canActivate(mockExecutionContext);

      // Wait for window to expire
      setTimeout(() => {
        // Act - Should pass again after window expires
        const result = guard.canActivate(mockExecutionContext);
        expect(result).toBe(true);
      }, 10);
    });

    it('should handle unknown IP', () => {
      // Arrange
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
        limit: 10,
        windowMs: 60000,
      });
      const mockExecutionContextWithUndefinedIP = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            ...mockRequest,
            ip: undefined,
          }),
        }),
      } as any;

      // Act
      const result = guard.canActivate(mockExecutionContextWithUndefinedIP);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('ApiKeyGuard', () => {
    let guard: ApiKeyGuard;
    let originalEnv: string | undefined;

    beforeEach(() => {
      guard = new ApiKeyGuard();
      originalEnv = process.env.VALID_API_KEYS;
      process.env.VALID_API_KEYS = 'valid-api-key,another-valid-key';
    });

    afterEach(() => {
      process.env.VALID_API_KEYS = originalEnv;
    });

    it('should allow access with valid API key', () => {
      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when API key is missing', () => {
      // Arrange
      mockRequest.headers = {};

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when API key is invalid', () => {
      // Arrange
      mockRequest.headers = { 'x-api-key': 'invalid-api-key' };

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('should handle empty VALID_API_KEYS environment variable', () => {
      // Arrange
      process.env.VALID_API_KEYS = '';

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('should handle undefined VALID_API_KEYS environment variable', () => {
      // Arrange
      delete process.env.VALID_API_KEYS;

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('ThrottleGuard', () => {
    let guard: ThrottleGuard;

    beforeEach(() => {
      guard = new ThrottleGuard();
    });

    it('should allow access for first request', () => {
      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException for rapid consecutive requests', () => {
      // Act - First request should pass
      guard.canActivate(mockExecutionContext);

      // Act & Assert - Second request should fail
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should allow access after throttle period', (done) => {
      // Act - First request should pass
      guard.canActivate(mockExecutionContext);

      // Wait for throttle period to expire
      setTimeout(() => {
        // Act - Should pass again after throttle period
        const result = guard.canActivate(mockExecutionContext);
        expect(result).toBe(true);
        done();
      }, 1100); // Wait slightly longer than 1 second throttle
    });

    it('should handle different endpoints separately', () => {
      // Arrange
      const mockExecutionContext2 = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            ...mockRequest,
            method: 'POST',
            route: { path: '/different' },
          }),
        }),
      } as any;

      // Act - Both requests should pass as they are different endpoints
      const result1 = guard.canActivate(mockExecutionContext);
      const result2 = guard.canActivate(mockExecutionContext2);

      // Assert
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should work with multiple guards in sequence', () => {
      // Arrange
      const authGuard = new AuthGuard(reflector);
      const rolesGuard = new RolesGuard(reflector);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['user']);

      // Act
      const authResult = authGuard.canActivate(mockExecutionContext);
      const rolesResult = rolesGuard.canActivate(mockExecutionContext);

      // Assert
      expect(authResult).toBe(true);
      expect(rolesResult).toBe(true);
    });

    it('should handle edge cases with missing request properties', () => {
      // Arrange
      const guard = new GroupMemberGuard();
      mockRequest.user = { id: 'user-123' }; // No groups property

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
    });

    it('should handle different parameter names for group ID', () => {
      // Arrange
      const guard = new GroupMemberGuard();
      mockRequest.params = { id: 'group-1' }; // Using 'id' instead of 'groupId'

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });
  });
});
