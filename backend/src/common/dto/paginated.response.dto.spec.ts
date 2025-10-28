import { PaginatedResponseDto } from './paginated.response.dto';
import { BaseResponseDto } from './base.response.dto';

describe('PaginatedResponseDto - White Box Testing', () => {
  describe('Constructor Tests', () => {
    describe('With all parameters', () => {
      it('should create PaginatedResponseDto with all fields', () => {
        const data = [{ id: '1', name: 'Test' }];
        const pagination = {
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
          hasNext: true,
          hasPrev: false,
        };
        const dto = new PaginatedResponseDto(
          data,
          pagination,
          'Custom message',
        );

        expect(dto).toBeInstanceOf(PaginatedResponseDto);
        expect(dto).toBeInstanceOf(BaseResponseDto);
        expect(dto.success).toBe(true);
        expect(dto.message).toBe('Custom message');
        expect(dto.data).toEqual(data);
        expect(dto.pagination).toEqual(pagination);
      });

      it('should use default message when not provided', () => {
        const data = [{ id: '1' }];
        const pagination = {
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
          hasNext: true,
          hasPrev: false,
        };
        const dto = new PaginatedResponseDto(data, pagination);

        expect(dto.message).toBe('Data retrieved successfully');
      });

      it('should accept empty data array', () => {
        const data: any[] = [];
        const pagination = {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        };
        const dto = new PaginatedResponseDto(data, pagination);

        expect(dto.data).toEqual([]);
        expect(dto.data.length).toBe(0);
        expect(dto.pagination.total).toBe(0);
      });

      it('should accept large data array', () => {
        const data = Array.from({ length: 100 }, (_, i) => ({
          id: `${i}`,
          name: `Item ${i}`,
        }));
        const pagination = {
          page: 1,
          limit: 100,
          total: 1000,
          totalPages: 10,
          hasNext: true,
          hasPrev: false,
        };
        const dto = new PaginatedResponseDto(data, pagination);

        expect(dto.data).toHaveLength(100);
        expect(dto.pagination.total).toBe(1000);
      });
    });
  });

  describe('Pagination Logic Tests', () => {
    describe('hasNext logic', () => {
      it('should be true when there are more pages', () => {
        const pagination = {
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
          hasNext: true,
          hasPrev: false,
        };
        const dto = new PaginatedResponseDto([{}], pagination);

        expect(dto.pagination.hasNext).toBe(true);
      });

      it('should be false on last page', () => {
        const pagination = {
          page: 10,
          limit: 10,
          total: 100,
          totalPages: 10,
          hasNext: false,
          hasPrev: true,
        };
        const dto = new PaginatedResponseDto([{}], pagination);

        expect(dto.pagination.hasNext).toBe(false);
      });

      it('should be false when total is 0', () => {
        const pagination = {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        };
        const dto = new PaginatedResponseDto([], pagination);

        expect(dto.pagination.hasNext).toBe(false);
      });
    });

    describe('hasPrev logic', () => {
      it('should be false on first page', () => {
        const pagination = {
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
          hasNext: true,
          hasPrev: false,
        };
        const dto = new PaginatedResponseDto([{}], pagination);

        expect(dto.pagination.hasPrev).toBe(false);
      });

      it('should be true on middle pages', () => {
        const pagination = {
          page: 5,
          limit: 10,
          total: 100,
          totalPages: 10,
          hasNext: true,
          hasPrev: true,
        };
        const dto = new PaginatedResponseDto([{}], pagination);

        expect(dto.pagination.hasPrev).toBe(true);
      });

      it('should be true on last page (page > 1)', () => {
        const pagination = {
          page: 10,
          limit: 10,
          total: 100,
          totalPages: 10,
          hasNext: false,
          hasPrev: true,
        };
        const dto = new PaginatedResponseDto([{}], pagination);

        expect(dto.pagination.hasPrev).toBe(true);
      });
    });

    describe('Edge cases for pagination', () => {
      it('should handle page 1 with hasPrev=false, hasNext=true', () => {
        const pagination = {
          page: 1,
          limit: 10,
          total: 50,
          totalPages: 5,
          hasNext: true,
          hasPrev: false,
        };
        const dto = new PaginatedResponseDto([{}], pagination);

        expect(dto.pagination.page).toBe(1);
        expect(dto.pagination.hasPrev).toBe(false);
        expect(dto.pagination.hasNext).toBe(true);
      });

      it('should handle last page with hasPrev=true, hasNext=false', () => {
        const pagination = {
          page: 5,
          limit: 10,
          total: 50,
          totalPages: 5,
          hasNext: false,
          hasPrev: true,
        };
        const dto = new PaginatedResponseDto([{}], pagination);

        expect(dto.pagination.page).toBe(5);
        expect(dto.pagination.hasPrev).toBe(true);
        expect(dto.pagination.hasNext).toBe(false);
      });

      it('should handle single page (total <= limit)', () => {
        const pagination = {
          page: 1,
          limit: 100,
          total: 50,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        };
        const dto = new PaginatedResponseDto(
          Array.from({ length: 50 }, (_, i) => ({ id: i })),
          pagination,
        );

        expect(dto.pagination.hasNext).toBe(false);
        expect(dto.pagination.hasPrev).toBe(false);
      });
    });
  });

  describe('Type Safety and Generic Type Tests', () => {
    it('should preserve type information for object types', () => {
      interface User {
        id: string;
        name: string;
        email: string;
      }

      const users: User[] = [
        { id: '1', name: 'John', email: 'john@example.com' },
        { id: '2', name: 'Jane', email: 'jane@example.com' },
      ];
      const pagination = {
        page: 1,
        limit: 10,
        total: 20,
        totalPages: 2,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto<User>(users, pagination);

      expect(dto.data[0].name).toBe('John');
      expect(dto.data[0].email).toBe('john@example.com');
    });

    it('should handle number type', () => {
      const data = [1, 2, 3, 4, 5];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto<number>(data, pagination);

      expect(dto.data).toEqual([1, 2, 3, 4, 5]);
      expect(typeof dto.data[0]).toBe('number');
    });

    it('should handle string type', () => {
      const data = ['item1', 'item2', 'item3'];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto<string>(data, pagination);

      expect(dto.data).toEqual(['item1', 'item2', 'item3']);
      expect(typeof dto.data[0]).toBe('string');
    });

    it('should handle complex nested objects', () => {
      const data = [
        {
          id: '1',
          metadata: {
            created: '2023-01-01',
            tags: ['important'],
          },
        },
      ];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      expect(dto.data[0].metadata.tags).toEqual(['important']);
    });
  });

  describe('Edge Cases and Boundary Testing', () => {
    it('should handle empty data array', () => {
      const pagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto([], pagination);

      expect(dto.data).toEqual([]);
      expect(dto.data.length).toBe(0);
    });

    it('should handle single item in data', () => {
      const data = [{ id: '1', name: 'Single' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      expect(dto.data).toHaveLength(1);
      expect(dto.pagination.total).toBe(1);
      expect(dto.pagination.totalPages).toBe(1);
    });

    it('should handle data count equal to limit', () => {
      const data = Array.from({ length: 10 }, (_, i) => ({ id: i }));
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      expect(dto.data).toHaveLength(10);
      expect(dto.pagination.hasNext).toBe(true);
    });

    it('should handle very large page numbers', () => {
      const pagination = {
        page: 1000,
        limit: 10,
        total: 10000,
        totalPages: 1000,
        hasNext: false,
        hasPrev: true,
      };
      const dto = new PaginatedResponseDto([{}], pagination);

      expect(dto.pagination.page).toBe(1000);
      expect(dto.pagination.hasPrev).toBe(true);
    });

    it('should handle limit greater than total', () => {
      const data = Array.from({ length: 10 }, (_, i) => ({ id: i }));
      const pagination = {
        page: 1,
        limit: 100,
        total: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      expect(dto.data.length).toBe(10);
      expect(dto.pagination.limit).toBe(100);
      expect(dto.pagination.total).toBe(10);
    });

    it('should handle data with null items', () => {
      const data: any[] = [null, undefined, { id: '1' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      expect(dto.data).toHaveLength(3);
    });
  });

  describe('Inheritance Behavior', () => {
    it('should inherit from BaseResponseDto', () => {
      const data = [{ id: '1' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      expect(dto instanceof BaseResponseDto).toBe(true);
    });

    it('should have all BaseResponseDto properties plus pagination', () => {
      const data = [{ id: '1' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      expect(dto).toHaveProperty('success');
      expect(dto).toHaveProperty('message');
      expect(dto).toHaveProperty('data');
      expect(dto).toHaveProperty('error');
      expect(dto).toHaveProperty('timestamp');
      expect(dto).toHaveProperty('requestId');
      expect(dto).toHaveProperty('pagination');
    });

    it('should set success always to true', () => {
      const data = [{ id: '1' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      expect(dto.success).toBe(true);
    });
  });

  describe('Timestamp and Metadata', () => {
    it('should auto-generate ISO timestamp', () => {
      const data = [{ id: '1' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const beforeTime = new Date();
      const dto = new PaginatedResponseDto(data, pagination);
      const afterTime = new Date();

      const timestamp = new Date(dto.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp >= beforeTime).toBe(true);
      expect(timestamp <= afterTime).toBe(true);
    });

    it('should have valid ISO timestamp format', () => {
      const data = [{ id: '1' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      expect(dto.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should not have requestId by default', () => {
      const data = [{ id: '1' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      expect(dto.requestId).toBeUndefined();
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should work for user list pagination', () => {
      const users = [
        { id: '1', name: 'John', email: 'john@example.com' },
        { id: '2', name: 'Jane', email: 'jane@example.com' },
        { id: '3', name: 'Bob', email: 'bob@example.com' },
      ];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(
        users,
        pagination,
        'Users retrieved',
      );

      expect(dto.data).toHaveLength(3);
      expect(dto.pagination.hasNext).toBe(true);
      expect(dto.pagination.hasPrev).toBe(false);
      expect(dto.message).toBe('Users retrieved');
    });

    it('should work for second page of results', () => {
      const users = Array.from({ length: 10 }, (_, i) => ({ id: `${i + 10}` }));
      const pagination = {
        page: 2,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: true,
      };
      const dto = new PaginatedResponseDto(users, pagination);

      expect(dto.pagination.page).toBe(2);
      expect(dto.pagination.hasNext).toBe(true);
      expect(dto.pagination.hasPrev).toBe(true);
    });

    it('should work for last page of results', () => {
      const users = Array.from({ length: 5 }, (_, i) => ({ id: `${i + 95}` }));
      const pagination = {
        page: 10,
        limit: 10,
        total: 95,
        totalPages: 10,
        hasNext: false,
        hasPrev: true,
      };
      const dto = new PaginatedResponseDto(users, pagination);

      expect(dto.pagination.hasNext).toBe(false);
      expect(dto.pagination.hasPrev).toBe(true);
    });

    it('should work for empty results with custom message', () => {
      const pagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto([], pagination, 'No users found');

      expect(dto.data).toEqual([]);
      expect(dto.message).toBe('No users found');
      expect(dto.pagination.total).toBe(0);
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize correctly to JSON', () => {
      const data = [{ id: '1', name: 'Test' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.success).toBe(true);
      expect(parsed.data).toEqual(data);
      expect(parsed.pagination).toEqual(pagination);
      expect(parsed.timestamp).toBeDefined();
    });

    it('should serialize pagination object correctly', () => {
      const data = [{ id: '1' }];
      const pagination = {
        page: 5,
        limit: 20,
        total: 200,
        totalPages: 10,
        hasNext: true,
        hasPrev: true,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.pagination.page).toBe(5);
      expect(parsed.pagination.limit).toBe(20);
      expect(parsed.pagination.total).toBe(200);
      expect(parsed.pagination.totalPages).toBe(10);
      expect(parsed.pagination.hasNext).toBe(true);
      expect(parsed.pagination.hasPrev).toBe(true);
    });

    it('should serialize complex nested data', () => {
      const data = [
        {
          id: '1',
          metadata: {
            tags: ['tag1', 'tag2'],
            nested: { deep: 'value' },
          },
        },
      ];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.data[0].metadata.tags).toEqual(['tag1', 'tag2']);
      expect(parsed.data[0].metadata.nested.deep).toBe('value');
    });
  });

  describe('Property Assignment', () => {
    it('should allow property modification', () => {
      const data = [{ id: '1' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      dto.message = 'Modified message';
      dto.pagination.page = 2;
      dto.pagination.hasNext = false;

      expect(dto.message).toBe('Modified message');
      expect(dto.pagination.page).toBe(2);
      expect(dto.pagination.hasNext).toBe(false);
    });

    it('should allow adding requestId', () => {
      const data = [{ id: '1' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      dto.requestId = 'req-123';

      expect(dto.requestId).toBe('req-123');
    });
  });

  describe('Pagination Calculation Edge Cases', () => {
    it('should handle page 1, limit 10, total 5 (single page)', () => {
      const pagination = {
        page: 1,
        limit: 10,
        total: 5,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(
        Array.from({ length: 5 }, (_, i) => ({ id: i })),
        pagination,
      );

      expect(dto.pagination.hasNext).toBe(false);
      expect(dto.pagination.hasPrev).toBe(false);
    });

    it('should handle exact division (total divisible by limit)', () => {
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto([{}], pagination);

      expect(dto.pagination.totalPages).toBe(10);
    });

    it('should handle non-exact division (total not divisible by limit)', () => {
      const pagination = {
        page: 1,
        limit: 10,
        total: 95,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto([{}], pagination);

      expect(dto.pagination.total).toBe(95);
      expect(dto.pagination.totalPages).toBe(10);
    });

    it('should handle limit of 1', () => {
      const data = [{ id: '1' }];
      const pagination = {
        page: 1,
        limit: 1,
        total: 100,
        totalPages: 100,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      expect(dto.pagination.limit).toBe(1);
      expect(dto.pagination.totalPages).toBe(100);
    });

    it('should handle very large limit', () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
      const pagination = {
        page: 1,
        limit: 1000,
        total: 1000,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      expect(dto.pagination.limit).toBe(1000);
      expect(dto.data).toHaveLength(1000);
    });
  });

  describe('Default Message Behavior', () => {
    it('should use default message when not provided', () => {
      const data = [{ id: '1' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      expect(dto.message).toBe('Data retrieved successfully');
    });

    it('should use custom message when provided', () => {
      const data = [{ id: '1' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto(
        data,
        pagination,
        'Custom success message',
      );

      expect(dto.message).toBe('Custom success message');
    });
  });

  describe('Multiple Instances', () => {
    it('should create multiple independent instances', () => {
      const data1 = [{ id: '1' }];
      const data2 = [{ id: '2' }];
      const pagination1 = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const pagination2 = {
        page: 2,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: true,
      };
      const dto1 = new PaginatedResponseDto(data1, pagination1);
      const dto2 = new PaginatedResponseDto(data2, pagination2);

      expect(dto1.pagination.page).toBe(1);
      expect(dto2.pagination.page).toBe(2);
      expect(dto1.pagination.hasPrev).toBe(false);
      expect(dto2.pagination.hasPrev).toBe(true);
    });
  });

  describe('Boundary Values Testing', () => {
    it('should handle minimum values', () => {
      const pagination = {
        page: 1,
        limit: 1,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };
      const dto = new PaginatedResponseDto([{ id: '1' }], pagination);

      expect(dto.pagination.page).toBe(1);
      expect(dto.pagination.limit).toBe(1);
      expect(dto.pagination.total).toBe(1);
    });

    it('should handle maximum reasonable values', () => {
      const data = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      const pagination = {
        page: 10000,
        limit: 1000,
        total: 1000000,
        totalPages: 1000,
        hasNext: false,
        hasPrev: true,
      };
      const dto = new PaginatedResponseDto(data, pagination);

      expect(dto.pagination.page).toBe(10000);
      expect(dto.pagination.limit).toBe(1000);
      expect(dto.pagination.total).toBe(1000000);
    });
  });
});
