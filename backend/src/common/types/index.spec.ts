import { Request, Response } from 'express';
import { User, PaginationMeta, ApiResponse, RequestWithUser } from './index';

describe('Common Types - White Box Testing', () => {
  describe('User Interface', () => {
    it('should accept minimal valid User with required fields', () => {
      const user: User = {
        id: '507f1f77bcf86cd799439011',
        _id: '507f1f77bcf86cd799439011',
        phone_number: '+1234567890',
        fullname: 'John Doe',
      };

      expect(user.id).toBeDefined();
      expect(user._id).toBeDefined();
      expect(user.phone_number).toBeDefined();
      expect(user.fullname).toBeDefined();
    });

    it('should accept complete User with all fields', () => {
      const user: User = {
        id: '507f1f77bcf86cd799439011',
        _id: '507f1f77bcf86cd799439011',
        phone_number: '+1234567890',
        fullname: 'John Doe',
        username: 'john_doe',
        email: 'john@example.com',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
        groups: ['group1', 'group2'],
        adminGroups: ['group1'],
      };

      expect(Object.keys(user).length).toBe(10);
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('_id');
      expect(user).toHaveProperty('phone_number');
      expect(user).toHaveProperty('fullname');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('permissions');
      expect(user).toHaveProperty('groups');
      expect(user).toHaveProperty('adminGroups');
    });

    it('should accept User with matching id and _id', () => {
      const userId = '507f1f77bcf86cd799439011';
      const user: User = {
        id: userId,
        _id: userId,
        phone_number: '+1234567890',
        fullname: 'John Doe',
      };

      expect(user.id).toBe(user._id);
    });

    it('should accept User with different id and _id', () => {
      const user: User = {
        id: 'string_id_123',
        _id: '507f1f77bcf86cd799439011',
        phone_number: '+1234567890',
        fullname: 'John Doe',
      };

      expect(user.id).not.toBe(user._id);
    });

    it('should accept User with empty optional arrays', () => {
      const user: User = {
        id: '507f1f77bcf86cd799439011',
        _id: '507f1f77bcf86cd799439011',
        phone_number: '+1234567890',
        fullname: 'John Doe',
        permissions: [],
        groups: [],
        adminGroups: [],
      };

      expect(user.permissions).toEqual([]);
      expect(user.groups).toEqual([]);
      expect(user.adminGroups).toEqual([]);
    });

    it('should accept User with single item in arrays', () => {
      const user: User = {
        id: '507f1f77bcf86cd799439011',
        _id: '507f1f77bcf86cd799439011',
        phone_number: '+1234567890',
        fullname: 'John Doe',
        permissions: ['read'],
        groups: ['default'],
        adminGroups: ['default'],
      };

      expect(user.permissions).toHaveLength(1);
      expect(user.groups).toHaveLength(1);
      expect(user.adminGroups).toHaveLength(1);
    });

    it('should accept User with multiple permissions', () => {
      const user: User = {
        id: '507f1f77bcf86cd799439011',
        _id: '507f1f77bcf86cd799439011',
        phone_number: '+1234567890',
        fullname: 'John Doe',
        permissions: [
          'user:read',
          'user:write',
          'user:delete',
          'group:manage',
          'system:admin',
        ],
      };

      expect(user.permissions).toHaveLength(5);
      expect(user.permissions).toContain('system:admin');
    });

    it('should accept User with multiple groups', () => {
      const user: User = {
        id: '507f1f77bcf86cd799439011',
        _id: '507f1f77bcf86cd799439011',
        phone_number: '+1234567890',
        fullname: 'John Doe',
        groups: ['group1', 'group2', 'group3', 'group4', 'group5'],
        adminGroups: ['group1', 'group3'],
      };

      expect(user.groups).toHaveLength(5);
      expect(user.adminGroups).toHaveLength(2);
    });

    it('should accept User with international phone numbers', () => {
      const phoneNumbers = [
        '+1234567890', // US
        '+442071234567', // UK
        '+81312345678', // Japan
        '+861012345678', // China
        '+84912345678', // Vietnam
      ];

      phoneNumbers.forEach((phone, index) => {
        const user: User = {
          id: `user_${index}`,
          _id: `user_${index}`,
          phone_number: phone,
          fullname: `User ${index}`,
        };

        expect(user.phone_number).toMatch(/^\+\d+$/);
      });
    });

    it('should accept User with special characters in fullname', () => {
      const names = [
        "John O'Brien",
        'María José García',
        'Jean-Pierre Dupont',
        'Müller Schmidt',
        'Nguyễn Văn A',
        '李明',
      ];

      names.forEach((name, index) => {
        const user: User = {
          id: `user_${index}`,
          _id: `user_${index}`,
          phone_number: '+1234567890',
          fullname: name,
        };

        expect(user.fullname).toBe(name);
      });
    });

    it('should accept User with various email formats', () => {
      const emails = [
        'simple@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user123@subdomain.example.com',
        'first.last@company.org',
      ];

      emails.forEach((email, index) => {
        const user: User = {
          id: `user_${index}`,
          _id: `user_${index}`,
          phone_number: '+1234567890',
          fullname: 'Test User',
          email,
        };

        expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it('should accept User with different role types', () => {
      const roles = ['guest', 'user', 'moderator', 'admin', 'super_admin'];

      roles.forEach((role, index) => {
        const user: User = {
          id: `user_${index}`,
          _id: `user_${index}`,
          phone_number: '+1234567890',
          fullname: 'Test User',
          role,
        };

        expect(user.role).toBe(role);
      });
    });

    it('should accept User where user is admin of all groups', () => {
      const groups = ['group1', 'group2', 'group3'];
      const user: User = {
        id: '507f1f77bcf86cd799439011',
        _id: '507f1f77bcf86cd799439011',
        phone_number: '+1234567890',
        fullname: 'Admin User',
        groups,
        adminGroups: groups,
      };

      expect(user.groups).toEqual(user.adminGroups);
    });

    it('should accept User where user is not admin of any groups', () => {
      const user: User = {
        id: '507f1f77bcf86cd799439011',
        _id: '507f1f77bcf86cd799439011',
        phone_number: '+1234567890',
        fullname: 'Regular User',
        groups: ['group1', 'group2', 'group3'],
        adminGroups: [],
      };

      expect(user.adminGroups).toHaveLength(0);
      expect(user.groups!.length).toBeGreaterThan(0);
    });
  });

  describe('PaginationMeta Interface', () => {
    it('should accept valid PaginationMeta with first page', () => {
      const meta: PaginationMeta = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
      };

      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(10);
      expect(meta.total).toBe(100);
      expect(meta.totalPages).toBe(10);
    });

    it('should accept valid PaginationMeta with last page', () => {
      const meta: PaginationMeta = {
        page: 10,
        limit: 10,
        total: 100,
        totalPages: 10,
      };

      expect(meta.page).toBe(meta.totalPages);
    });

    it('should accept PaginationMeta with middle page', () => {
      const meta: PaginationMeta = {
        page: 5,
        limit: 20,
        total: 200,
        totalPages: 10,
      };

      expect(meta.page).toBeGreaterThan(1);
      expect(meta.page).toBeLessThan(meta.totalPages);
    });

    it('should accept PaginationMeta with single page', () => {
      const meta: PaginationMeta = {
        page: 1,
        limit: 100,
        total: 50,
        totalPages: 1,
      };

      expect(meta.page).toBe(1);
      expect(meta.totalPages).toBe(1);
      expect(meta.total).toBeLessThan(meta.limit);
    });

    it('should accept PaginationMeta with zero total', () => {
      const meta: PaginationMeta = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };

      expect(meta.total).toBe(0);
      expect(meta.totalPages).toBe(0);
    });

    it('should accept PaginationMeta with exact division', () => {
      const meta: PaginationMeta = {
        page: 1,
        limit: 25,
        total: 100,
        totalPages: 4,
      };

      expect(meta.total / meta.limit).toBe(meta.totalPages);
    });

    it('should accept PaginationMeta with remainder', () => {
      const meta: PaginationMeta = {
        page: 1,
        limit: 10,
        total: 95,
        totalPages: 10,
      };

      expect(Math.ceil(meta.total / meta.limit)).toBe(meta.totalPages);
    });

    it('should accept PaginationMeta with different limit sizes', () => {
      const limits = [10, 20, 50, 100, 200];

      limits.forEach((limit) => {
        const meta: PaginationMeta = {
          page: 1,
          limit,
          total: 1000,
          totalPages: Math.ceil(1000 / limit),
        };

        expect(meta.limit).toBe(limit);
      });
    });

    it('should accept PaginationMeta with large datasets', () => {
      const meta: PaginationMeta = {
        page: 100,
        limit: 100,
        total: 1000000,
        totalPages: 10000,
      };

      expect(meta.total).toBe(1000000);
      expect(meta.totalPages).toBe(10000);
    });

    it('should calculate correct totalPages from total and limit', () => {
      const testCases = [
        { total: 100, limit: 10, expectedPages: 10 },
        { total: 95, limit: 10, expectedPages: 10 },
        { total: 91, limit: 10, expectedPages: 10 },
        { total: 10, limit: 10, expectedPages: 1 },
        { total: 1, limit: 10, expectedPages: 1 },
      ];

      testCases.forEach(({ total, limit, expectedPages }) => {
        const meta: PaginationMeta = {
          page: 1,
          limit,
          total,
          totalPages: expectedPages,
        };

        expect(Math.ceil(meta.total / meta.limit)).toBe(meta.totalPages);
      });
    });
  });

  describe('ApiResponse Interface', () => {
    it('should accept minimal ApiResponse with only success flag', () => {
      const response: ApiResponse = {
        success: true,
      };

      expect(response.success).toBe(true);
      expect(response.message).toBeUndefined();
      expect(response.data).toBeUndefined();
      expect(response.meta).toBeUndefined();
    });

    it('should accept ApiResponse with success and message', () => {
      const response: ApiResponse = {
        success: true,
        message: 'Operation completed successfully',
      };

      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
    });

    it('should accept ApiResponse with failure status', () => {
      const response: ApiResponse = {
        success: false,
        message: 'Operation failed',
      };

      expect(response.success).toBe(false);
      expect(response.message).toBe('Operation failed');
    });

    it('should accept ApiResponse with string data', () => {
      const response: ApiResponse<string> = {
        success: true,
        message: 'User fetched successfully',
        data: 'test data',
      };

      expect(typeof response.data).toBe('string');
      expect(response.data).toBe('test data');
    });

    it('should accept ApiResponse with number data', () => {
      const response: ApiResponse<number> = {
        success: true,
        data: 42,
      };

      expect(typeof response.data).toBe('number');
      expect(response.data).toBe(42);
    });

    it('should accept ApiResponse with boolean data', () => {
      const response: ApiResponse<boolean> = {
        success: true,
        data: true,
      };

      expect(typeof response.data).toBe('boolean');
      expect(response.data).toBe(true);
    });

    it('should accept ApiResponse with object data', () => {
      const response: ApiResponse<User> = {
        success: true,
        message: 'User retrieved',
        data: {
          id: '507f1f77bcf86cd799439011',
          _id: '507f1f77bcf86cd799439011',
          phone_number: '+1234567890',
          fullname: 'John Doe',
          email: 'john@example.com',
        },
      };

      expect(response.data).toBeDefined();
      expect(response.data?.id).toBe('507f1f77bcf86cd799439011');
    });

    it('should accept ApiResponse with array data', () => {
      const users: User[] = [
        {
          id: '1',
          _id: '1',
          phone_number: '+1234567890',
          fullname: 'User 1',
        },
        {
          id: '2',
          _id: '2',
          phone_number: '+1234567891',
          fullname: 'User 2',
        },
      ];

      const response: ApiResponse<User[]> = {
        success: true,
        data: users,
      };

      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(2);
    });

    it('should accept ApiResponse with empty array data', () => {
      const response: ApiResponse<User[]> = {
        success: true,
        message: 'No users found',
        data: [],
      };

      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(0);
    });

    it('should accept ApiResponse with null data', () => {
      const response: ApiResponse<null> = {
        success: true,
        data: null,
      };

      expect(response.data).toBeNull();
    });

    it('should accept ApiResponse with pagination meta', () => {
      const response: ApiResponse<User[]> = {
        success: true,
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
        },
      };

      expect(response.meta).toBeDefined();
      expect(response.meta?.page).toBe(1);
      expect(response.meta?.totalPages).toBe(10);
    });

    it('should accept complete ApiResponse with all fields', () => {
      const response: ApiResponse<User[]> = {
        success: true,
        message: 'Users retrieved successfully',
        data: [
          {
            id: '1',
            _id: '1',
            phone_number: '+1234567890',
            fullname: 'User 1',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('meta');
    });

    it('should accept ApiResponse with nested object data', () => {
      interface NestedData {
        user: User;
        stats: {
          messageCount: number;
          groupCount: number;
        };
      }

      const response: ApiResponse<NestedData> = {
        success: true,
        data: {
          user: {
            id: '1',
            _id: '1',
            phone_number: '+1234567890',
            fullname: 'John Doe',
          },
          stats: {
            messageCount: 100,
            groupCount: 5,
          },
        },
      };

      expect(response.data?.user).toBeDefined();
      expect(response.data?.stats.messageCount).toBe(100);
    });

    it('should accept ApiResponse with generic unknown type', () => {
      const response: ApiResponse = {
        success: true,
        data: { anything: 'can go here' },
      };

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    });

    it('should accept error ApiResponse without data', () => {
      const response: ApiResponse = {
        success: false,
        message: 'User not found',
      };

      expect(response.success).toBe(false);
      expect(response.data).toBeUndefined();
      expect(response.meta).toBeUndefined();
    });
  });

  describe('RequestWithUser Interface', () => {
    it('should accept RequestWithUser with minimal required fields', () => {
      const request = {
        requestId: 'req_123456',
      } as RequestWithUser;

      expect(request.requestId).toBe('req_123456');
      expect(request.user).toBeUndefined();
      expect(request.correlationId).toBeUndefined();
      expect(request.startTime).toBeUndefined();
    });

    it('should accept RequestWithUser with user attached', () => {
      const request = {
        requestId: 'req_123456',
        user: {
          id: '507f1f77bcf86cd799439011',
          _id: '507f1f77bcf86cd799439011',
          phone_number: '+1234567890',
          fullname: 'John Doe',
        },
      } as RequestWithUser;

      expect(request.user).toBeDefined();
      expect(request.user?.id).toBe('507f1f77bcf86cd799439011');
    });

    it('should accept RequestWithUser with all fields', () => {
      const request = {
        requestId: 'req_123456',
        correlationId: 'corr_789012',
        startTime: Date.now(),
        user: {
          id: '507f1f77bcf86cd799439011',
          _id: '507f1f77bcf86cd799439011',
          phone_number: '+1234567890',
          fullname: 'John Doe',
          role: 'admin',
        },
      } as RequestWithUser;

      expect(request.requestId).toBe('req_123456');
      expect(request.correlationId).toBe('corr_789012');
      expect(request.startTime).toBeDefined();
      expect(request.user).toBeDefined();
    });

    it('should accept RequestWithUser with UUID format requestId', () => {
      const request = {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
      } as RequestWithUser;

      expect(request.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should accept RequestWithUser with numeric startTime', () => {
      const now = Date.now();
      const request = {
        requestId: 'req_123456',
        startTime: now,
      } as RequestWithUser;

      expect(typeof request.startTime).toBe('number');
      expect(request.startTime).toBe(now);
    });

    it('should accept RequestWithUser with correlationId', () => {
      const request = {
        requestId: 'req_123456',
        correlationId: 'corr_789012',
      } as RequestWithUser;

      expect(request.correlationId).toBe('corr_789012');
    });

    it('should accept RequestWithUser without user (unauthenticated)', () => {
      const request = {
        requestId: 'req_123456',
      } as RequestWithUser;

      expect(request.user).toBeUndefined();
    });

    it('should accept RequestWithUser with complete user profile', () => {
      const request = {
        requestId: 'req_123456',
        user: {
          id: '507f1f77bcf86cd799439011',
          _id: '507f1f77bcf86cd799439011',
          phone_number: '+1234567890',
          fullname: 'John Doe',
          username: 'john_doe',
          email: 'john@example.com',
          role: 'admin',
          permissions: ['read', 'write', 'delete'],
          groups: ['group1', 'group2'],
          adminGroups: ['group1'],
        },
      } as RequestWithUser;

      expect(request.user?.permissions).toContain('write');
      expect(request.user?.groups).toHaveLength(2);
    });

    it('should extend Express Request interface', () => {
      const request = {
        requestId: 'req_123456',
        method: 'GET',
        url: '/api/users',
        headers: {},
        params: {},
        query: {},
        body: {},
      } as RequestWithUser;

      expect(request.requestId).toBe('req_123456');
      expect(request.method).toBe('GET');
      expect(request.url).toBe('/api/users');
    });

    it('should calculate request duration using startTime', () => {
      const startTime = Date.now() - 1000; // 1 second ago
      const request = {
        requestId: 'req_123456',
        startTime,
      } as RequestWithUser;

      const duration = Date.now() - request.startTime!;
      expect(duration).toBeGreaterThanOrEqual(1000);
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Integration Tests - Type Combinations', () => {
    it('should create paginated ApiResponse with User array', () => {
      const users: User[] = [
        {
          id: '1',
          _id: '1',
          phone_number: '+1234567890',
          fullname: 'User 1',
        },
        {
          id: '2',
          _id: '2',
          phone_number: '+1234567891',
          fullname: 'User 2',
        },
      ];

      const response: ApiResponse<User[]> = {
        success: true,
        message: 'Users retrieved successfully',
        data: users,
        meta: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };

      expect(response.data).toHaveLength(2);
      expect(response.meta?.total).toBe(response.data?.length);
    });

    it('should handle authenticated request with user data in response', () => {
      const user: User = {
        id: '507f1f77bcf86cd799439011',
        _id: '507f1f77bcf86cd799439011',
        phone_number: '+1234567890',
        fullname: 'John Doe',
        role: 'admin',
      };

      const request = {
        requestId: 'req_123456',
        user,
      } as RequestWithUser;

      const response: ApiResponse<User> = {
        success: true,
        message: 'User profile retrieved',
        data: request.user,
      };

      expect(response.data?.id).toBe(request.user?.id);
      expect(response.data?.role).toBe('admin');
    });

    it('should handle empty paginated response', () => {
      const response: ApiResponse<User[]> = {
        success: true,
        message: 'No users found',
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      expect(response.data).toHaveLength(0);
      expect(response.meta?.total).toBe(0);
    });

    it('should handle request lifecycle with timing', () => {
      const startTime = Date.now();
      const request = {
        requestId: 'req_123456',
        correlationId: 'corr_789012',
        startTime,
        user: {
          id: '1',
          _id: '1',
          phone_number: '+1234567890',
          fullname: 'John Doe',
        },
      } as RequestWithUser;

      // Simulate some processing time
      const endTime = Date.now();
      const duration = endTime - request.startTime!;

      expect(duration).toBeGreaterThanOrEqual(0);
      expect(request.requestId).toBeDefined();
      expect(request.correlationId).toBeDefined();
    });

    it('should handle multi-page response scenario', () => {
      const currentPage = 3;
      const itemsPerPage = 20;
      const totalItems = 150;
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      const response: ApiResponse<User[]> = {
        success: true,
        data: [], // Would contain page 3 items
        meta: {
          page: currentPage,
          limit: itemsPerPage,
          total: totalItems,
          totalPages,
        },
      };

      expect(response.meta?.page).toBe(3);
      expect(response.meta?.totalPages).toBe(8);
      expect(response.meta?.page).toBeLessThan(response.meta?.totalPages!);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle User with very long fullname', () => {
      const longName = 'A'.repeat(500);
      const user: User = {
        id: '1',
        _id: '1',
        phone_number: '+1234567890',
        fullname: longName,
      };

      expect(user.fullname.length).toBe(500);
    });

    it('should handle PaginationMeta with page beyond totalPages', () => {
      const meta: PaginationMeta = {
        page: 15,
        limit: 10,
        total: 100,
        totalPages: 10,
      };

      expect(meta.page).toBeGreaterThan(meta.totalPages);
    });

    it('should handle ApiResponse with very large data array', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        _id: `${i}`,
        phone_number: `+123456${i}`,
        fullname: `User ${i}`,
      }));

      const response: ApiResponse<User[]> = {
        success: true,
        data: largeArray,
      };

      expect(response.data).toHaveLength(1000);
    });

    it('should handle RequestWithUser with very old startTime', () => {
      const request = {
        requestId: 'req_123456',
        startTime: 0, // Unix epoch
      } as RequestWithUser;

      const duration = Date.now() - request.startTime!;
      expect(duration).toBeGreaterThan(0);
    });

    it('should handle User with maximum number of groups', () => {
      const manyGroups = Array.from({ length: 100 }, (_, i) => `group${i}`);
      const user: User = {
        id: '1',
        _id: '1',
        phone_number: '+1234567890',
        fullname: 'Power User',
        groups: manyGroups,
        adminGroups: manyGroups,
      };

      expect(user.groups).toHaveLength(100);
      expect(user.adminGroups).toHaveLength(100);
    });

    it('should handle ApiResponse with undefined vs null data', () => {
      const responseUndefined: ApiResponse = {
        success: true,
      };

      const responseNull: ApiResponse<null> = {
        success: true,
        data: null,
      };

      expect(responseUndefined.data).toBeUndefined();
      expect(responseNull.data).toBeNull();
      expect(responseUndefined.data).not.toBe(responseNull.data);
    });

    it('should handle PaginationMeta with negative page (invalid state)', () => {
      const meta: PaginationMeta = {
        page: -1,
        limit: 10,
        total: 100,
        totalPages: 10,
      };

      expect(meta.page).toBeLessThan(1);
    });

    it('should handle empty string fields in User', () => {
      const user: User = {
        id: '',
        _id: '',
        phone_number: '',
        fullname: '',
        username: '',
        email: '',
      };

      expect(user.id).toBe('');
      expect(user.fullname).toBe('');
    });
  });

  describe('Type Safety Tests', () => {
    it('should enforce correct types at compile time', () => {
      const user: User = {
        id: 'valid_id',
        _id: 'valid_id',
        phone_number: '+1234567890',
        fullname: 'John Doe',
      };

      const meta: PaginationMeta = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
      };

      const response: ApiResponse<User> = {
        success: true,
        data: user,
        meta,
      };

      expect(typeof user.id).toBe('string');
      expect(typeof meta.page).toBe('number');
      expect(typeof response.success).toBe('boolean');
    });

    it('should allow generic type inference', () => {
      const createResponse = <T>(data: T): ApiResponse<T> => ({
        success: true,
        data,
      });

      const userResponse = createResponse({
        id: '1',
        _id: '1',
        phone_number: '+1234567890',
        fullname: 'John Doe',
      });

      const numberResponse = createResponse(42);
      const stringResponse = createResponse('test');

      expect(userResponse.data?.id).toBe('1');
      expect(numberResponse.data).toBe(42);
      expect(stringResponse.data).toBe('test');
    });
  });
});
