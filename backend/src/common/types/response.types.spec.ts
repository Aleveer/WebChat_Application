import {
  PaginatedResponse,
  AuthResponse,
  UserResponse,
  GroupResponse,
  MessageResponse,
  FileResponse,
  NotificationResponse,
  ApiErrorResponse,
  ApiSuccessResponse,
} from './response.types';

describe('Response Types - White Box Testing', () => {
  describe('PaginatedResponse Interface', () => {
    it('should accept PaginatedResponse with empty data array', () => {
      const response: PaginatedResponse<string> = {
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };

      expect(response.data).toEqual([]);
      expect(response.data).toHaveLength(0);
      expect(response.meta.total).toBe(0);
    });

    it('should accept PaginatedResponse with single item', () => {
      const response: PaginatedResponse<string> = {
        data: ['item1'],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      expect(response.data).toHaveLength(1);
      expect(response.data[0]).toBe('item1');
      expect(response.meta.total).toBe(1);
    });

    it('should accept PaginatedResponse with multiple items', () => {
      const response: PaginatedResponse<number> = {
        data: [1, 2, 3, 4, 5],
        meta: {
          page: 1,
          limit: 10,
          total: 5,
          totalPages: 1,
        },
      };

      expect(response.data).toHaveLength(5);
      expect(response.meta.total).toBe(5);
    });

    it('should accept PaginatedResponse with first page', () => {
      const response: PaginatedResponse<string> = {
        data: ['a', 'b', 'c'],
        meta: {
          page: 1,
          limit: 3,
          total: 10,
          totalPages: 4,
        },
      };

      expect(response.meta.page).toBe(1);
      expect(response.meta.page).toBeLessThan(response.meta.totalPages);
    });

    it('should accept PaginatedResponse with middle page', () => {
      const response: PaginatedResponse<string> = {
        data: ['d', 'e', 'f'],
        meta: {
          page: 2,
          limit: 3,
          total: 10,
          totalPages: 4,
        },
      };

      expect(response.meta.page).toBe(2);
      expect(response.meta.page).toBeGreaterThan(1);
      expect(response.meta.page).toBeLessThan(response.meta.totalPages);
    });

    it('should accept PaginatedResponse with last page', () => {
      const response: PaginatedResponse<string> = {
        data: ['j'],
        meta: {
          page: 4,
          limit: 3,
          total: 10,
          totalPages: 4,
        },
      };

      expect(response.meta.page).toBe(response.meta.totalPages);
      expect(response.data.length).toBeLessThan(response.meta.limit);
    });

    it('should accept PaginatedResponse with object array', () => {
      interface Item {
        id: string;
        name: string;
      }

      const response: PaginatedResponse<Item> = {
        data: [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };

      expect(response.data).toHaveLength(2);
      expect(response.data[0].id).toBe('1');
    });

    it('should accept PaginatedResponse with different limit sizes', () => {
      const limits = [10, 20, 50, 100];

      limits.forEach((limit) => {
        const response: PaginatedResponse<number> = {
          data: Array.from({ length: limit }, (_, i) => i),
          meta: {
            page: 1,
            limit,
            total: 1000,
            totalPages: Math.ceil(1000 / limit),
          },
        };

        expect(response.meta.limit).toBe(limit);
        expect(response.data).toHaveLength(limit);
      });
    });

    it('should calculate correct totalPages from total and limit', () => {
      const testCases = [
        { total: 100, limit: 10, expectedPages: 10 },
        { total: 95, limit: 10, expectedPages: 10 },
        { total: 1, limit: 10, expectedPages: 1 },
        { total: 0, limit: 10, expectedPages: 0 },
      ];

      testCases.forEach(({ total, limit, expectedPages }) => {
        const response: PaginatedResponse<string> = {
          data: [],
          meta: {
            page: 1,
            limit,
            total,
            totalPages: expectedPages,
          },
        };

        expect(response.meta.totalPages).toBe(expectedPages);
      });
    });
  });

  describe('AuthResponse Interface', () => {
    it('should accept AuthResponse with minimal user info', () => {
      const response: AuthResponse = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'refresh_token_here',
        user: {
          id: 'user_123',
          phone_number: '+1234567890',
        },
      };

      expect(response.access_token).toBeDefined();
      expect(response.refresh_token).toBeDefined();
      expect(response.user.id).toBe('user_123');
      expect(response.user.phone_number).toBe('+1234567890');
    });

    it('should accept AuthResponse with complete user info', () => {
      const response: AuthResponse = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'refresh_token_here',
        user: {
          id: 'user_123',
          phone_number: '+1234567890',
          username: 'john_doe',
          email: 'john@example.com',
        },
      };

      expect(response.user).toHaveProperty('id');
      expect(response.user).toHaveProperty('phone_number');
      expect(response.user).toHaveProperty('username');
      expect(response.user).toHaveProperty('email');
    });

    it('should accept AuthResponse with JWT token format', () => {
      const response: AuthResponse = {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
        refresh_token: 'refresh_abc123xyz',
        user: {
          id: 'user_123',
          phone_number: '+1234567890',
        },
      };

      expect(response.access_token.split('.')).toHaveLength(3);
    });

    it('should accept AuthResponse with different token lengths', () => {
      const response: AuthResponse = {
        access_token: 'a'.repeat(500),
        refresh_token: 'r'.repeat(300),
        user: {
          id: 'user_123',
          phone_number: '+1234567890',
        },
      };

      expect(response.access_token.length).toBe(500);
      expect(response.refresh_token.length).toBe(300);
    });

    it('should accept AuthResponse with international phone numbers', () => {
      const phoneNumbers = ['+1234567890', '+442071234567', '+81312345678'];

      phoneNumbers.forEach((phone) => {
        const response: AuthResponse = {
          access_token: 'token',
          refresh_token: 'refresh',
          user: {
            id: 'user_123',
            phone_number: phone,
          },
        };

        expect(response.user.phone_number).toMatch(/^\+\d+$/);
      });
    });

    it('should accept AuthResponse with various email formats', () => {
      const emails = [
        'simple@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
      ];

      emails.forEach((email) => {
        const response: AuthResponse = {
          access_token: 'token',
          refresh_token: 'refresh',
          user: {
            id: 'user_123',
            phone_number: '+1234567890',
            email,
          },
        };

        expect(response.user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });
  });

  describe('UserResponse Interface', () => {
    it('should accept UserResponse with required fields only', () => {
      const response: UserResponse = {
        id: 'user_123',
        phone_number: '+1234567890',
        full_name: 'John Doe',
        created_at: new Date('2025-01-01T00:00:00Z'),
        updated_at: new Date('2025-01-01T00:00:00Z'),
      };

      expect(response.id).toBe('user_123');
      expect(response.phone_number).toBe('+1234567890');
      expect(response.full_name).toBe('John Doe');
      expect(response.created_at).toBeInstanceOf(Date);
      expect(response.updated_at).toBeInstanceOf(Date);
    });

    it('should accept UserResponse with all fields', () => {
      const response: UserResponse = {
        id: 'user_123',
        phone_number: '+1234567890',
        full_name: 'John Doe',
        username: 'john_doe',
        email: 'john@example.com',
        profile_photo: 'https://example.com/photos/user123.jpg',
        created_at: new Date('2025-01-01T00:00:00Z'),
        updated_at: new Date('2025-10-28T10:00:00Z'),
      };

      expect(Object.keys(response).length).toBe(8);
    });

    it('should accept UserResponse with same created_at and updated_at', () => {
      const timestamp = new Date('2025-01-01T00:00:00Z');
      const response: UserResponse = {
        id: 'user_123',
        phone_number: '+1234567890',
        full_name: 'John Doe',
        created_at: timestamp,
        updated_at: timestamp,
      };

      expect(response.created_at).toBe(response.updated_at);
    });

    it('should accept UserResponse with updated_at after created_at', () => {
      const response: UserResponse = {
        id: 'user_123',
        phone_number: '+1234567890',
        full_name: 'John Doe',
        created_at: new Date('2025-01-01T00:00:00Z'),
        updated_at: new Date('2025-10-28T10:00:00Z'),
      };

      expect(response.updated_at.getTime()).toBeGreaterThan(
        response.created_at.getTime(),
      );
    });

    it('should accept UserResponse with special characters in full_name', () => {
      const names = [
        "John O'Brien",
        'María José García',
        'Jean-Pierre Dupont',
        'Nguyễn Văn A',
      ];

      names.forEach((name) => {
        const response: UserResponse = {
          id: 'user_123',
          phone_number: '+1234567890',
          full_name: name,
          created_at: new Date(),
          updated_at: new Date(),
        };

        expect(response.full_name).toBe(name);
      });
    });

    it('should accept UserResponse with different profile_photo URLs', () => {
      const urls = [
        'https://example.com/photo.jpg',
        'http://localhost:3000/uploads/avatar.png',
        '/uploads/user/photo.jpg',
        'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      ];

      urls.forEach((url) => {
        const response: UserResponse = {
          id: 'user_123',
          phone_number: '+1234567890',
          full_name: 'John Doe',
          profile_photo: url,
          created_at: new Date(),
          updated_at: new Date(),
        };

        expect(response.profile_photo).toBe(url);
      });
    });
  });

  describe('GroupResponse Interface', () => {
    it('should accept GroupResponse with empty members array', () => {
      const response: GroupResponse = {
        id: 'group_123',
        name: 'Empty Group',
        members: [],
        created_by: 'user_123',
        created_at: new Date('2025-01-01T00:00:00Z'),
        updated_at: new Date('2025-01-01T00:00:00Z'),
      };

      expect(response.members).toEqual([]);
      expect(response.members).toHaveLength(0);
    });

    it('should accept GroupResponse with single member', () => {
      const response: GroupResponse = {
        id: 'group_123',
        name: 'Single Member Group',
        members: [
          {
            user_id: 'user_123',
            is_admin: true,
            joined_at: new Date('2025-01-01T00:00:00Z'),
          },
        ],
        created_by: 'user_123',
        created_at: new Date('2025-01-01T00:00:00Z'),
        updated_at: new Date('2025-01-01T00:00:00Z'),
      };

      expect(response.members).toHaveLength(1);
      expect(response.members[0].user_id).toBe('user_123');
      expect(response.members[0].is_admin).toBe(true);
    });

    it('should accept GroupResponse with multiple members', () => {
      const response: GroupResponse = {
        id: 'group_123',
        name: 'Team Chat',
        members: [
          {
            user_id: 'user_123',
            is_admin: true,
            joined_at: new Date('2025-01-01T00:00:00Z'),
          },
          {
            user_id: 'user_456',
            is_admin: false,
            joined_at: new Date('2025-01-02T00:00:00Z'),
          },
          {
            user_id: 'user_789',
            is_admin: false,
            joined_at: new Date('2025-01-03T00:00:00Z'),
          },
        ],
        created_by: 'user_123',
        created_at: new Date('2025-01-01T00:00:00Z'),
        updated_at: new Date('2025-01-01T00:00:00Z'),
      };

      expect(response.members).toHaveLength(3);
      expect(response.members.filter((m) => m.is_admin)).toHaveLength(1);
      expect(response.members.filter((m) => !m.is_admin)).toHaveLength(2);
    });

    it('should accept GroupResponse with description', () => {
      const response: GroupResponse = {
        id: 'group_123',
        name: 'Team Chat',
        description: 'Main team communication channel',
        members: [],
        created_by: 'user_123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(response.description).toBe('Main team communication channel');
    });

    it('should accept GroupResponse with empty description', () => {
      const response: GroupResponse = {
        id: 'group_123',
        name: 'Team Chat',
        description: '',
        members: [],
        created_by: 'user_123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(response.description).toBe('');
    });

    it('should accept GroupResponse with long description', () => {
      const longDescription = 'A'.repeat(1000);
      const response: GroupResponse = {
        id: 'group_123',
        name: 'Team Chat',
        description: longDescription,
        members: [],
        created_by: 'user_123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(response.description?.length).toBe(1000);
    });

    it('should accept GroupResponse where creator is admin', () => {
      const response: GroupResponse = {
        id: 'group_123',
        name: 'Team Chat',
        members: [
          {
            user_id: 'user_123',
            is_admin: true,
            joined_at: new Date(),
          },
        ],
        created_by: 'user_123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const creator = response.members.find(
        (m) => m.user_id === response.created_by,
      );
      expect(creator?.is_admin).toBe(true);
    });

    it('should accept GroupResponse with multiple admins', () => {
      const response: GroupResponse = {
        id: 'group_123',
        name: 'Team Chat',
        members: [
          {
            user_id: 'user_123',
            is_admin: true,
            joined_at: new Date(),
          },
          {
            user_id: 'user_456',
            is_admin: true,
            joined_at: new Date(),
          },
          {
            user_id: 'user_789',
            is_admin: false,
            joined_at: new Date(),
          },
        ],
        created_by: 'user_123',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const admins = response.members.filter((m) => m.is_admin);
      expect(admins).toHaveLength(2);
    });

    it('should accept GroupResponse with members joined at different times', () => {
      const response: GroupResponse = {
        id: 'group_123',
        name: 'Team Chat',
        members: [
          {
            user_id: 'user_123',
            is_admin: true,
            joined_at: new Date('2025-01-01T00:00:00Z'),
          },
          {
            user_id: 'user_456',
            is_admin: false,
            joined_at: new Date('2025-02-01T00:00:00Z'),
          },
          {
            user_id: 'user_789',
            is_admin: false,
            joined_at: new Date('2025-03-01T00:00:00Z'),
          },
        ],
        created_by: 'user_123',
        created_at: new Date('2025-01-01T00:00:00Z'),
        updated_at: new Date(),
      };

      expect(response.members[0].joined_at.getTime()).toBeLessThan(
        response.members[1].joined_at.getTime(),
      );
    });
  });

  describe('MessageResponse Interface', () => {
    it('should accept MessageResponse for direct user message', () => {
      const response: MessageResponse = {
        id: 'msg_123',
        sender_id: 'user_123',
        receiver_type: 'user',
        receiver_id: 'user_456',
        text: 'Hello, how are you?',
        is_read: false,
        created_at: new Date('2025-10-28T10:00:00Z'),
        updated_at: new Date('2025-10-28T10:00:00Z'),
      };

      expect(response.receiver_type).toBe('user');
      expect(response.sender_id).not.toBe(response.receiver_id);
    });

    it('should accept MessageResponse for group message', () => {
      const response: MessageResponse = {
        id: 'msg_123',
        sender_id: 'user_123',
        receiver_type: 'group',
        receiver_id: 'group_456',
        text: 'Hello everyone!',
        is_read: false,
        created_at: new Date('2025-10-28T10:00:00Z'),
        updated_at: new Date('2025-10-28T10:00:00Z'),
      };

      expect(response.receiver_type).toBe('group');
    });

    it('should accept MessageResponse with unread status', () => {
      const response: MessageResponse = {
        id: 'msg_123',
        sender_id: 'user_123',
        receiver_type: 'user',
        receiver_id: 'user_456',
        text: 'New message',
        is_read: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(response.is_read).toBe(false);
    });

    it('should accept MessageResponse with read status', () => {
      const response: MessageResponse = {
        id: 'msg_123',
        sender_id: 'user_123',
        receiver_type: 'user',
        receiver_id: 'user_456',
        text: 'Old message',
        is_read: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(response.is_read).toBe(true);
    });

    it('should accept MessageResponse with empty text', () => {
      const response: MessageResponse = {
        id: 'msg_123',
        sender_id: 'user_123',
        receiver_type: 'user',
        receiver_id: 'user_456',
        text: '',
        is_read: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(response.text).toBe('');
    });

    it('should accept MessageResponse with long text', () => {
      const longText = 'A'.repeat(5000);
      const response: MessageResponse = {
        id: 'msg_123',
        sender_id: 'user_123',
        receiver_type: 'user',
        receiver_id: 'user_456',
        text: longText,
        is_read: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(response.text.length).toBe(5000);
    });

    it('should accept MessageResponse with special characters in text', () => {
      const response: MessageResponse = {
        id: 'msg_123',
        sender_id: 'user_123',
        receiver_type: 'user',
        receiver_id: 'user_456',
        text: 'Hello! 😀 How are you? 🎉',
        is_read: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(response.text).toContain('😀');
      expect(response.text).toContain('🎉');
    });

    it('should accept MessageResponse with updated_at after created_at (edited message)', () => {
      const response: MessageResponse = {
        id: 'msg_123',
        sender_id: 'user_123',
        receiver_type: 'user',
        receiver_id: 'user_456',
        text: 'Edited message',
        is_read: true,
        created_at: new Date('2025-10-28T10:00:00Z'),
        updated_at: new Date('2025-10-28T11:00:00Z'),
      };

      expect(response.updated_at.getTime()).toBeGreaterThan(
        response.created_at.getTime(),
      );
    });

    it('should accept MessageResponse with multiline text', () => {
      const response: MessageResponse = {
        id: 'msg_123',
        sender_id: 'user_123',
        receiver_type: 'user',
        receiver_id: 'user_456',
        text: 'Line 1\nLine 2\nLine 3',
        is_read: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(response.text.split('\n')).toHaveLength(3);
    });
  });

  describe('FileResponse Interface', () => {
    it('should accept FileResponse with all required fields', () => {
      const response: FileResponse = {
        id: 'file_123',
        original_name: 'document.pdf',
        file_name: 'abc123_document.pdf',
        file_url: 'https://example.com/files/abc123_document.pdf',
        file_size: 1024000,
        file_type: 'document',
        mime_type: 'application/pdf',
        uploaded_by: 'user_123',
        created_at: new Date('2025-10-28T10:00:00Z'),
      };

      expect(response.id).toBe('file_123');
      expect(response.original_name).toBe('document.pdf');
      expect(response.file_size).toBe(1024000);
    });

    it('should accept FileResponse for image file', () => {
      const response: FileResponse = {
        id: 'file_123',
        original_name: 'photo.jpg',
        file_name: 'abc123_photo.jpg',
        file_url: 'https://example.com/files/abc123_photo.jpg',
        file_size: 2048000,
        file_type: 'image',
        mime_type: 'image/jpeg',
        uploaded_by: 'user_123',
        created_at: new Date(),
      };

      expect(response.file_type).toBe('image');
      expect(response.mime_type).toBe('image/jpeg');
    });

    it('should accept FileResponse for video file', () => {
      const response: FileResponse = {
        id: 'file_123',
        original_name: 'video.mp4',
        file_name: 'abc123_video.mp4',
        file_url: 'https://example.com/files/abc123_video.mp4',
        file_size: 10485760,
        file_type: 'video',
        mime_type: 'video/mp4',
        uploaded_by: 'user_123',
        created_at: new Date(),
      };

      expect(response.file_type).toBe('video');
      expect(response.mime_type).toBe('video/mp4');
    });

    it('should accept FileResponse for audio file', () => {
      const response: FileResponse = {
        id: 'file_123',
        original_name: 'audio.mp3',
        file_name: 'abc123_audio.mp3',
        file_url: 'https://example.com/files/abc123_audio.mp3',
        file_size: 5242880,
        file_type: 'audio',
        mime_type: 'audio/mpeg',
        uploaded_by: 'user_123',
        created_at: new Date(),
      };

      expect(response.file_type).toBe('audio');
      expect(response.mime_type).toBe('audio/mpeg');
    });

    it('should accept FileResponse with different file sizes', () => {
      const sizes = [
        1024, // 1 KB
        1048576, // 1 MB
        10485760, // 10 MB
        104857600, // 100 MB
      ];

      sizes.forEach((size) => {
        const response: FileResponse = {
          id: 'file_123',
          original_name: 'file.txt',
          file_name: 'abc123_file.txt',
          file_url: 'https://example.com/files/abc123_file.txt',
          file_size: size,
          file_type: 'document',
          mime_type: 'text/plain',
          uploaded_by: 'user_123',
          created_at: new Date(),
        };

        expect(response.file_size).toBe(size);
      });
    });

    it('should accept FileResponse with zero file size', () => {
      const response: FileResponse = {
        id: 'file_123',
        original_name: 'empty.txt',
        file_name: 'abc123_empty.txt',
        file_url: 'https://example.com/files/abc123_empty.txt',
        file_size: 0,
        file_type: 'document',
        mime_type: 'text/plain',
        uploaded_by: 'user_123',
        created_at: new Date(),
      };

      expect(response.file_size).toBe(0);
    });

    it('should accept FileResponse with different URL formats', () => {
      const urls = [
        'https://example.com/files/file.pdf',
        'http://localhost:3000/uploads/file.pdf',
        '/uploads/file.pdf',
        's3://bucket-name/files/file.pdf',
      ];

      urls.forEach((url) => {
        const response: FileResponse = {
          id: 'file_123',
          original_name: 'file.pdf',
          file_name: 'abc123_file.pdf',
          file_url: url,
          file_size: 1024,
          file_type: 'document',
          mime_type: 'application/pdf',
          uploaded_by: 'user_123',
          created_at: new Date(),
        };

        expect(response.file_url).toBe(url);
      });
    });

    it('should accept FileResponse with special characters in filename', () => {
      const response: FileResponse = {
        id: 'file_123',
        original_name: 'my document (final) v2.0.pdf',
        file_name: 'abc123_my_document_final_v2_0.pdf',
        file_url: 'https://example.com/files/abc123_my_document_final_v2_0.pdf',
        file_size: 1024,
        file_type: 'document',
        mime_type: 'application/pdf',
        uploaded_by: 'user_123',
        created_at: new Date(),
      };

      expect(response.original_name).toContain('(');
      expect(response.original_name).toContain(')');
    });

    it('should accept FileResponse with various mime types', () => {
      const mimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'video/mp4',
        'audio/mpeg',
        'text/plain',
        'application/zip',
      ];

      mimeTypes.forEach((mimeType) => {
        const response: FileResponse = {
          id: 'file_123',
          original_name: 'file',
          file_name: 'abc123_file',
          file_url: 'https://example.com/files/file',
          file_size: 1024,
          file_type: 'document',
          mime_type: mimeType,
          uploaded_by: 'user_123',
          created_at: new Date(),
        };

        expect(response.mime_type).toBe(mimeType);
      });
    });
  });

  describe('NotificationResponse Interface', () => {
    it('should accept NotificationResponse with all required fields', () => {
      const response: NotificationResponse = {
        id: 'notif_123',
        type: 'message',
        title: 'New Message',
        content: 'You have received a new message',
        sender: 'user_123',
        recipient: 'user_456',
        is_read: false,
        created_at: new Date('2025-10-28T10:00:00Z'),
      };

      expect(response.id).toBe('notif_123');
      expect(response.type).toBe('message');
      expect(response.is_read).toBe(false);
    });

    it('should accept NotificationResponse with unread status', () => {
      const response: NotificationResponse = {
        id: 'notif_123',
        type: 'message',
        title: 'New Message',
        content: 'You have a new message',
        sender: 'user_123',
        recipient: 'user_456',
        is_read: false,
        created_at: new Date(),
      };

      expect(response.is_read).toBe(false);
    });

    it('should accept NotificationResponse with read status', () => {
      const response: NotificationResponse = {
        id: 'notif_123',
        type: 'message',
        title: 'New Message',
        content: 'You have a new message',
        sender: 'user_123',
        recipient: 'user_456',
        is_read: true,
        created_at: new Date(),
      };

      expect(response.is_read).toBe(true);
    });

    it('should accept NotificationResponse with different types', () => {
      const types = [
        'message',
        'group_invite',
        'friend_request',
        'system',
        'alert',
      ];

      types.forEach((type) => {
        const response: NotificationResponse = {
          id: 'notif_123',
          type,
          title: 'Notification',
          content: 'Content',
          sender: 'user_123',
          recipient: 'user_456',
          is_read: false,
          created_at: new Date(),
        };

        expect(response.type).toBe(type);
      });
    });

    it('should accept NotificationResponse with empty content', () => {
      const response: NotificationResponse = {
        id: 'notif_123',
        type: 'system',
        title: 'System Update',
        content: '',
        sender: 'system',
        recipient: 'user_456',
        is_read: false,
        created_at: new Date(),
      };

      expect(response.content).toBe('');
    });

    it('should accept NotificationResponse with long content', () => {
      const longContent = 'A'.repeat(1000);
      const response: NotificationResponse = {
        id: 'notif_123',
        type: 'message',
        title: 'Long Message',
        content: longContent,
        sender: 'user_123',
        recipient: 'user_456',
        is_read: false,
        created_at: new Date(),
      };

      expect(response.content.length).toBe(1000);
    });

    it('should accept NotificationResponse for system notification', () => {
      const response: NotificationResponse = {
        id: 'notif_123',
        type: 'system',
        title: 'Maintenance Notice',
        content: 'System maintenance scheduled for tonight',
        sender: 'system',
        recipient: 'user_456',
        is_read: false,
        created_at: new Date(),
      };

      expect(response.sender).toBe('system');
      expect(response.type).toBe('system');
    });

    it('should accept NotificationResponse for group invite', () => {
      const response: NotificationResponse = {
        id: 'notif_123',
        type: 'group_invite',
        title: 'Group Invitation',
        content: 'John invited you to join Team Chat',
        sender: 'user_123',
        recipient: 'user_456',
        is_read: false,
        created_at: new Date(),
      };

      expect(response.type).toBe('group_invite');
    });
  });

  describe('ApiErrorResponse Interface', () => {
    it('should accept ApiErrorResponse with required fields', () => {
      const response: ApiErrorResponse = {
        success: false,
        error: 'NotFoundError',
        message: 'User not found',
        timestamp: new Date().toISOString(),
        path: '/api/users/123',
        method: 'GET',
        requestId: 'req_123456',
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe('NotFoundError');
      expect(response.message).toBe('User not found');
    });

    it('should accept ApiErrorResponse with details', () => {
      const response: ApiErrorResponse = {
        success: false,
        error: 'ValidationError',
        message: 'Invalid input data',
        details: {
          field: 'email',
          reason: 'Invalid email format',
        },
        timestamp: new Date().toISOString(),
        path: '/api/users',
        method: 'POST',
        requestId: 'req_123456',
      };

      expect(response.details).toBeDefined();
      expect(typeof response.details).toBe('object');
    });

    it('should accept ApiErrorResponse with array details', () => {
      const response: ApiErrorResponse = {
        success: false,
        error: 'ValidationError',
        message: 'Multiple validation errors',
        details: [
          { field: 'email', message: 'Invalid email' },
          { field: 'password', message: 'Password too short' },
        ],
        timestamp: new Date().toISOString(),
        path: '/api/users',
        method: 'POST',
        requestId: 'req_123456',
      };

      expect(Array.isArray(response.details)).toBe(true);
    });

    it('should accept ApiErrorResponse with different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

      methods.forEach((method) => {
        const response: ApiErrorResponse = {
          success: false,
          error: 'Error',
          message: 'Error message',
          timestamp: new Date().toISOString(),
          path: '/api/resource',
          method,
          requestId: 'req_123456',
        };

        expect(response.method).toBe(method);
      });
    });

    it('should accept ApiErrorResponse with different error types', () => {
      const errorTypes = [
        'NotFoundError',
        'ValidationError',
        'UnauthorizedError',
        'ForbiddenError',
        'InternalServerError',
      ];

      errorTypes.forEach((error) => {
        const response: ApiErrorResponse = {
          success: false,
          error,
          message: 'Error occurred',
          timestamp: new Date().toISOString(),
          path: '/api/resource',
          method: 'GET',
          requestId: 'req_123456',
        };

        expect(response.error).toBe(error);
      });
    });

    it('should accept ApiErrorResponse with ISO timestamp format', () => {
      const timestamp = new Date().toISOString();
      const response: ApiErrorResponse = {
        success: false,
        error: 'Error',
        message: 'Error message',
        timestamp,
        path: '/api/resource',
        method: 'GET',
        requestId: 'req_123456',
      };

      expect(response.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should accept ApiErrorResponse with different path formats', () => {
      const paths = [
        '/api/users',
        '/api/users/123',
        '/api/v1/users/123/profile',
        '/users',
      ];

      paths.forEach((path) => {
        const response: ApiErrorResponse = {
          success: false,
          error: 'Error',
          message: 'Error message',
          timestamp: new Date().toISOString(),
          path,
          method: 'GET',
          requestId: 'req_123456',
        };

        expect(response.path).toBe(path);
      });
    });

    it('should accept ApiErrorResponse with UUID requestId', () => {
      const response: ApiErrorResponse = {
        success: false,
        error: 'Error',
        message: 'Error message',
        timestamp: new Date().toISOString(),
        path: '/api/resource',
        method: 'GET',
        requestId: '550e8400-e29b-41d4-a716-446655440000',
      };

      expect(response.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should always have success: false', () => {
      const response: ApiErrorResponse = {
        success: false,
        error: 'Error',
        message: 'Error message',
        timestamp: new Date().toISOString(),
        path: '/api/resource',
        method: 'GET',
        requestId: 'req_123456',
      };

      expect(response.success).toBe(false);
    });
  });

  describe('ApiSuccessResponse Interface', () => {
    it('should accept ApiSuccessResponse with minimal fields', () => {
      const response: ApiSuccessResponse<string> = {
        success: true,
        data: 'Success',
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(true);
      expect(response.data).toBe('Success');
      expect(response.timestamp).toBeDefined();
    });

    it('should accept ApiSuccessResponse with requestId', () => {
      const response: ApiSuccessResponse<string> = {
        success: true,
        data: 'Success',
        timestamp: new Date().toISOString(),
        requestId: 'req_123456',
      };

      expect(response.requestId).toBe('req_123456');
    });

    it('should accept ApiSuccessResponse with string data', () => {
      const response: ApiSuccessResponse<string> = {
        success: true,
        data: 'Operation completed successfully',
        timestamp: new Date().toISOString(),
      };

      expect(typeof response.data).toBe('string');
    });

    it('should accept ApiSuccessResponse with number data', () => {
      const response: ApiSuccessResponse<number> = {
        success: true,
        data: 42,
        timestamp: new Date().toISOString(),
      };

      expect(typeof response.data).toBe('number');
      expect(response.data).toBe(42);
    });

    it('should accept ApiSuccessResponse with boolean data', () => {
      const response: ApiSuccessResponse<boolean> = {
        success: true,
        data: true,
        timestamp: new Date().toISOString(),
      };

      expect(typeof response.data).toBe('boolean');
      expect(response.data).toBe(true);
    });

    it('should accept ApiSuccessResponse with object data', () => {
      const response: ApiSuccessResponse<UserResponse> = {
        success: true,
        data: {
          id: 'user_123',
          phone_number: '+1234567890',
          full_name: 'John Doe',
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      expect(typeof response.data).toBe('object');
      expect(response.data.id).toBe('user_123');
    });

    it('should accept ApiSuccessResponse with array data', () => {
      const response: ApiSuccessResponse<string[]> = {
        success: true,
        data: ['item1', 'item2', 'item3'],
        timestamp: new Date().toISOString(),
      };

      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(3);
    });

    it('should accept ApiSuccessResponse with null data', () => {
      const response: ApiSuccessResponse<null> = {
        success: true,
        data: null,
        timestamp: new Date().toISOString(),
      };

      expect(response.data).toBeNull();
    });

    it('should accept ApiSuccessResponse with ISO timestamp', () => {
      const timestamp = new Date().toISOString();
      const response: ApiSuccessResponse<string> = {
        success: true,
        data: 'Success',
        timestamp,
      };

      expect(response.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should always have success: true', () => {
      const response: ApiSuccessResponse<string> = {
        success: true,
        data: 'Success',
        timestamp: new Date().toISOString(),
      };

      expect(response.success).toBe(true);
    });
  });

  describe('Integration Tests - Response Combinations', () => {
    it('should wrap UserResponse in ApiSuccessResponse', () => {
      const user: UserResponse = {
        id: 'user_123',
        phone_number: '+1234567890',
        full_name: 'John Doe',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const response: ApiSuccessResponse<UserResponse> = {
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
        requestId: 'req_123456',
      };

      expect(response.success).toBe(true);
      expect(response.data.id).toBe('user_123');
    });

    it('should wrap PaginatedResponse in ApiSuccessResponse', () => {
      const paginatedUsers: PaginatedResponse<UserResponse> = {
        data: [
          {
            id: 'user_123',
            phone_number: '+1234567890',
            full_name: 'John Doe',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      const response: ApiSuccessResponse<PaginatedResponse<UserResponse>> = {
        success: true,
        data: paginatedUsers,
        timestamp: new Date().toISOString(),
      };

      expect(response.data.data).toHaveLength(1);
      expect(response.data.meta.total).toBe(1);
    });

    it('should create error response for failed authentication', () => {
      const response: ApiErrorResponse = {
        success: false,
        error: 'UnauthorizedError',
        message: 'Invalid credentials',
        details: {
          reason: 'Incorrect password',
        },
        timestamp: new Date().toISOString(),
        path: '/api/auth/login',
        method: 'POST',
        requestId: 'req_123456',
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe('UnauthorizedError');
    });

    it('should create success response for authentication', () => {
      const authData: AuthResponse = {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'refresh_token_here',
        user: {
          id: 'user_123',
          phone_number: '+1234567890',
          username: 'john_doe',
        },
      };

      const response: ApiSuccessResponse<AuthResponse> = {
        success: true,
        data: authData,
        timestamp: new Date().toISOString(),
        requestId: 'req_123456',
      };

      expect(response.success).toBe(true);
      expect(response.data.access_token).toBeDefined();
    });

    it('should create paginated response for multiple messages', () => {
      const messages: MessageResponse[] = [
        {
          id: 'msg_1',
          sender_id: 'user_123',
          receiver_type: 'user',
          receiver_id: 'user_456',
          text: 'Hello',
          is_read: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'msg_2',
          sender_id: 'user_456',
          receiver_type: 'user',
          receiver_id: 'user_123',
          text: 'Hi',
          is_read: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const response: PaginatedResponse<MessageResponse> = {
        data: messages,
        meta: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };

      expect(response.data).toHaveLength(2);
      expect(response.data.filter((m) => !m.is_read)).toHaveLength(1);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(5000);
      const response: ApiErrorResponse = {
        success: false,
        error: 'Error',
        message: longMessage,
        timestamp: new Date().toISOString(),
        path: '/api/resource',
        method: 'GET',
        requestId: 'req_123456',
      };

      expect(response.message.length).toBe(5000);
    });

    it('should handle nested error details', () => {
      const response: ApiErrorResponse = {
        success: false,
        error: 'ValidationError',
        message: 'Validation failed',
        details: {
          errors: {
            email: {
              message: 'Invalid email',
              value: 'invalid-email',
            },
            password: {
              message: 'Too short',
              minLength: 8,
            },
          },
        },
        timestamp: new Date().toISOString(),
        path: '/api/users',
        method: 'POST',
        requestId: 'req_123456',
      };

      expect(typeof response.details).toBe('object');
    });

    it('should handle very large file sizes', () => {
      const response: FileResponse = {
        id: 'file_123',
        original_name: 'large-file.zip',
        file_name: 'abc123_large-file.zip',
        file_url: 'https://example.com/files/large-file.zip',
        file_size: 1073741824, // 1 GB
        file_type: 'archive',
        mime_type: 'application/zip',
        uploaded_by: 'user_123',
        created_at: new Date(),
      };

      expect(response.file_size).toBe(1073741824);
    });

    it('should handle group with maximum members', () => {
      const members = Array.from({ length: 1000 }, (_, i) => ({
        user_id: `user_${i}`,
        is_admin: i === 0,
        joined_at: new Date(),
      }));

      const response: GroupResponse = {
        id: 'group_123',
        name: 'Large Group',
        members,
        created_by: 'user_0',
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(response.members).toHaveLength(1000);
    });

    it('should handle paginated response with maximum limit', () => {
      const response: PaginatedResponse<string> = {
        data: Array.from({ length: 1000 }, (_, i) => `item_${i}`),
        meta: {
          page: 1,
          limit: 1000,
          total: 10000,
          totalPages: 10,
        },
      };

      expect(response.data).toHaveLength(1000);
      expect(response.meta.limit).toBe(1000);
    });
  });

  describe('Type Safety Tests', () => {
    it('should enforce correct generic types', () => {
      const stringResponse: ApiSuccessResponse<string> = {
        success: true,
        data: 'test',
        timestamp: new Date().toISOString(),
      };

      const numberResponse: ApiSuccessResponse<number> = {
        success: true,
        data: 42,
        timestamp: new Date().toISOString(),
      };

      expect(typeof stringResponse.data).toBe('string');
      expect(typeof numberResponse.data).toBe('number');
    });

    it('should enforce receiver_type literal values', () => {
      const userMessage: MessageResponse = {
        id: 'msg_1',
        sender_id: 'user_123',
        receiver_type: 'user',
        receiver_id: 'user_456',
        text: 'Hello',
        is_read: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const groupMessage: MessageResponse = {
        id: 'msg_2',
        sender_id: 'user_123',
        receiver_type: 'group',
        receiver_id: 'group_456',
        text: 'Hello',
        is_read: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      expect(userMessage.receiver_type).toBe('user');
      expect(groupMessage.receiver_type).toBe('group');
    });

    it('should enforce success literal values in error response', () => {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Error',
        message: 'Error message',
        timestamp: new Date().toISOString(),
        path: '/api/resource',
        method: 'GET',
        requestId: 'req_123456',
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.success).not.toBe(true);
    });

    it('should enforce success literal values in success response', () => {
      const successResponse: ApiSuccessResponse<string> = {
        success: true,
        data: 'Success',
        timestamp: new Date().toISOString(),
      };

      expect(successResponse.success).toBe(true);
      expect(successResponse.success).not.toBe(false);
    });
  });
});
