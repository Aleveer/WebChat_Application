import { PaginatedResponseDto } from '../src/common/dto/paginated.response.dto';
import { BaseResponseDto } from '../src/common/dto/base.response.dto';

describe('PaginatedResponseDto - White Box Testing (Input-Output)', () => {
  describe('Constructor', () => {
    /**
     * Test Case 1: Kiểm tra constructor với all parameters
     * Input: data array, pagination object, custom message
     * Expected Output: Instance với all properties
     * Path Coverage: Constructor với full parameters
     */
    it('TC001: should create instance with all parameters', () => {
      const data = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };
      const message = 'Items retrieved';

      const response = new PaginatedResponseDto(data, pagination, message);

      expect(response).toBeInstanceOf(PaginatedResponseDto);
      expect(response).toBeInstanceOf(BaseResponseDto);
      expect(response.success).toBe(true);
      expect(response.message).toBe(message);
      expect(response.data).toEqual(data);
      expect(response.pagination).toEqual(pagination);
    });

    /**
     * Test Case 2: Kiểm tra constructor với default message
     * Input: data, pagination (no message)
     * Expected Output: Default message 'Data retrieved successfully'
     * Path Coverage: Default message parameter
     */
    it('TC002: should use default message when not provided', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.message).toBe('Data retrieved successfully');
    });

    /**
     * Test Case 3: Kiểm tra success always true
     * Input: Any valid parameters
     * Expected Output: success = true (always)
     * Path Coverage: Success field validation
     */
    it('TC003: should always have success true', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.success).toBe(true);
    });

    /**
     * Test Case 4: Kiểm tra error always undefined
     * Input: Any valid parameters
     * Expected Output: error = undefined (always)
     * Path Coverage: Error field validation
     */
    it('TC004: should always have undefined error', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.error).toBeUndefined();
    });

    /**
     * Test Case 5: Kiểm tra timestamp auto-generation
     * Input: data, pagination
     * Expected Output: timestamp generated in ISO format
     * Path Coverage: Timestamp generation
     */
    it('TC005: should auto-generate timestamp', () => {
      const beforeTime = new Date();
      const data = [{ id: 1 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);
      const afterTime = new Date();

      expect(response.timestamp).toBeDefined();
      expect(response.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );

      const timestamp = new Date(response.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    /**
     * Test Case 6: Kiểm tra inheritance from BaseResponseDto
     * Input: Any valid instance
     * Expected Output: Instance of both classes
     * Path Coverage: Inheritance validation
     */
    it('TC006: should inherit from BaseResponseDto', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response).toBeInstanceOf(PaginatedResponseDto);
      expect(response).toBeInstanceOf(BaseResponseDto);
    });

    /**
     * Test Case 7: Kiểm tra requestId property exists
     * Input: Paginated instance
     * Expected Output: requestId property exists (inherited)
     * Path Coverage: Inherited property
     */
    it('TC007: should have requestId property from BaseResponseDto', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response).toHaveProperty('requestId');
      expect(response.requestId).toBeUndefined();
    });

    /**
     * Test Case 8: Kiểm tra pagination object structure
     * Input: Full pagination object
     * Expected Output: All pagination fields present
     * Path Coverage: Pagination structure
     */
    it('TC008: should have complete pagination object structure', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 2,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNext: true,
        hasPrev: true,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.pagination).toHaveProperty('page');
      expect(response.pagination).toHaveProperty('limit');
      expect(response.pagination).toHaveProperty('total');
      expect(response.pagination).toHaveProperty('totalPages');
      expect(response.pagination).toHaveProperty('hasNext');
      expect(response.pagination).toHaveProperty('hasPrev');
    });

    /**
     * Test Case 9: Kiểm tra custom message override
     * Input: Custom message
     * Expected Output: Custom message used
     * Path Coverage: Custom message
     */
    it('TC009: should override default message with custom message', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };
      const customMessage = 'Users fetched successfully';

      const response = new PaginatedResponseDto(
        data,
        pagination,
        customMessage,
      );

      expect(response.message).toBe(customMessage);
      expect(response.message).not.toBe('Data retrieved successfully');
    });
  });

  describe('Data Array Parameter', () => {
    /**
     * Test Case 10: Kiểm tra với empty array
     * Input: Empty data array
     * Expected Output: Empty array preserved
     * Path Coverage: Empty data
     */
    it('TC010: should handle empty data array', () => {
      const data: any[] = [];
      const pagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.data).toEqual([]);
      expect(response.data).toHaveLength(0);
    });

    /**
     * Test Case 11: Kiểm tra với single item
     * Input: Array with 1 item
     * Expected Output: Single item array
     * Path Coverage: Single item
     */
    it('TC011: should handle single item array', () => {
      const data = [{ id: 1, name: 'Single item' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.data).toHaveLength(1);
      expect(response.data?.[0].name).toBe('Single item');
    });

    /**
     * Test Case 12: Kiểm tra với multiple items
     * Input: Array with multiple items
     * Expected Output: All items preserved
     * Path Coverage: Multiple items
     */
    it('TC012: should handle multiple items array', () => {
      const data = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ];
      const pagination = {
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.data).toHaveLength(3);
      expect(response.data).toEqual(data);
    });

    /**
     * Test Case 13: Kiểm tra với complex objects
     * Input: Array of complex nested objects
     * Expected Output: Complex structure preserved
     * Path Coverage: Complex data
     */
    it('TC013: should handle complex nested objects', () => {
      const data = [
        {
          id: 1,
          user: {
            name: 'John',
            profile: { age: 30, settings: { theme: 'dark' } },
          },
          tags: ['tag1', 'tag2'],
        },
      ];
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.data?.[0].user.profile.settings.theme).toBe('dark');
      expect(response.data?.[0].tags).toHaveLength(2);
    });

    /**
     * Test Case 14: Kiểm tra với primitive type arrays
     * Input: Array of primitives (strings, numbers)
     * Expected Output: Primitives preserved
     * Path Coverage: Primitive types
     */
    it('TC014: should handle primitive type arrays', () => {
      const stringData = ['item1', 'item2', 'item3'];
      const numberData = [1, 2, 3, 4, 5];
      const pagination = {
        page: 1,
        limit: 10,
        total: 5,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const stringResponse = new PaginatedResponseDto(stringData, pagination);
      const numberResponse = new PaginatedResponseDto(numberData, pagination);

      expect(stringResponse.data).toEqual(stringData);
      expect(numberResponse.data).toEqual(numberData);
    });

    /**
     * Test Case 15: Kiểm tra với large array
     * Input: Large array (100 items)
     * Expected Output: All items preserved
     * Path Coverage: Large data
     */
    it('TC015: should handle large data arrays', () => {
      const data = Array(100)
        .fill(null)
        .map((_, i) => ({ id: i, value: `item-${i}` }));
      const pagination = {
        page: 1,
        limit: 100,
        total: 100,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.data).toHaveLength(100);
      expect(response.data?.[99].id).toBe(99);
    });

    /**
     * Test Case 16: Kiểm tra data array reference
     * Input: Original array
     * Expected Output: Reference preserved (not cloned)
     * Path Coverage: Reference handling
     */
    it('TC016: should reference original data array', () => {
      const data = [{ id: 1, value: 'original' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);
      data[0].value = 'modified';

      expect(response.data?.[0].value).toBe('modified');
    });
  });

  describe('Pagination Object', () => {
    /**
     * Test Case 17: Kiểm tra page field
     * Input: Various page values
     * Expected Output: Page value preserved
     * Path Coverage: Page field
     */
    it('TC017: should handle various page values', () => {
      const data = [{ id: 1 }];
      const pages = [1, 2, 5, 10, 100];

      pages.forEach((page) => {
        const pagination = {
          page,
          limit: 10,
          total: 1000,
          totalPages: 100,
          hasNext: true,
          hasPrev: page > 1,
        };
        const response = new PaginatedResponseDto(data, pagination);

        expect(response.pagination.page).toBe(page);
      });
    });

    /**
     * Test Case 18: Kiểm tra limit field
     * Input: Various limit values
     * Expected Output: Limit value preserved
     * Path Coverage: Limit field
     */
    it('TC018: should handle various limit values', () => {
      const data = [{ id: 1 }];
      const limits = [10, 20, 50, 100];

      limits.forEach((limit) => {
        const pagination = {
          page: 1,
          limit,
          total: 100,
          totalPages: Math.ceil(100 / limit),
          hasNext: true,
          hasPrev: false,
        };
        const response = new PaginatedResponseDto(data, pagination);

        expect(response.pagination.limit).toBe(limit);
      });
    });

    /**
     * Test Case 19: Kiểm tra total field
     * Input: Various total values
     * Expected Output: Total value preserved
     * Path Coverage: Total field
     */
    it('TC019: should handle various total values', () => {
      const data = [{ id: 1 }];
      const totals = [0, 1, 100, 1000, 10000];

      totals.forEach((total) => {
        const pagination = {
          page: 1,
          limit: 10,
          total,
          totalPages: Math.ceil(total / 10),
          hasNext: total > 10,
          hasPrev: false,
        };
        const response = new PaginatedResponseDto(data, pagination);

        expect(response.pagination.total).toBe(total);
      });
    });

    /**
     * Test Case 20: Kiểm tra totalPages field
     * Input: Various totalPages values
     * Expected Output: TotalPages value preserved
     * Path Coverage: TotalPages field
     */
    it('TC020: should handle various totalPages values', () => {
      const data = [{ id: 1 }];
      const totalPagesValues = [0, 1, 5, 10, 100];

      totalPagesValues.forEach((totalPages) => {
        const pagination = {
          page: 1,
          limit: 10,
          total: totalPages * 10,
          totalPages,
          hasNext: totalPages > 1,
          hasPrev: false,
        };
        const response = new PaginatedResponseDto(data, pagination);

        expect(response.pagination.totalPages).toBe(totalPages);
      });
    });

    /**
     * Test Case 21: Kiểm tra hasNext field
     * Input: hasNext = true and false
     * Expected Output: Boolean value preserved
     * Path Coverage: HasNext field
     */
    it('TC021: should handle hasNext boolean values', () => {
      const data = [{ id: 1 }];

      const withNext = new PaginatedResponseDto(data, {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      });

      const withoutNext = new PaginatedResponseDto(data, {
        page: 10,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: false,
        hasPrev: true,
      });

      expect(withNext.pagination.hasNext).toBe(true);
      expect(withoutNext.pagination.hasNext).toBe(false);
    });

    /**
     * Test Case 22: Kiểm tra hasPrev field
     * Input: hasPrev = true and false
     * Expected Output: Boolean value preserved
     * Path Coverage: HasPrev field
     */
    it('TC022: should handle hasPrev boolean values', () => {
      const data = [{ id: 1 }];

      const withPrev = new PaginatedResponseDto(data, {
        page: 5,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: true,
      });

      const withoutPrev = new PaginatedResponseDto(data, {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      });

      expect(withPrev.pagination.hasPrev).toBe(true);
      expect(withoutPrev.pagination.hasPrev).toBe(false);
    });

    /**
     * Test Case 23: Kiểm tra first page scenario
     * Input: page = 1
     * Expected Output: hasPrev = false, hasNext depends on total
     * Path Coverage: First page
     */
    it('TC023: should handle first page scenario', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.pagination.page).toBe(1);
      expect(response.pagination.hasPrev).toBe(false);
      expect(response.pagination.hasNext).toBe(true);
    });

    /**
     * Test Case 24: Kiểm tra last page scenario
     * Input: page = totalPages
     * Expected Output: hasNext = false, hasPrev = true
     * Path Coverage: Last page
     */
    it('TC024: should handle last page scenario', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 10,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: false,
        hasPrev: true,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.pagination.page).toBe(10);
      expect(response.pagination.hasNext).toBe(false);
      expect(response.pagination.hasPrev).toBe(true);
    });

    /**
     * Test Case 25: Kiểm tra middle page scenario
     * Input: page in middle
     * Expected Output: Both hasNext and hasPrev = true
     * Path Coverage: Middle page
     */
    it('TC025: should handle middle page scenario', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 5,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: true,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.pagination.page).toBe(5);
      expect(response.pagination.hasNext).toBe(true);
      expect(response.pagination.hasPrev).toBe(true);
    });

    /**
     * Test Case 26: Kiểm tra single page scenario
     * Input: totalPages = 1
     * Expected Output: Both hasNext and hasPrev = false
     * Path Coverage: Single page
     */
    it('TC026: should handle single page scenario', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 5,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.pagination.totalPages).toBe(1);
      expect(response.pagination.hasNext).toBe(false);
      expect(response.pagination.hasPrev).toBe(false);
    });

    /**
     * Test Case 27: Kiểm tra empty result scenario
     * Input: total = 0
     * Expected Output: totalPages = 0, no next/prev
     * Path Coverage: Empty results
     */
    it('TC027: should handle empty result scenario', () => {
      const data: any[] = [];
      const pagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.pagination.total).toBe(0);
      expect(response.pagination.totalPages).toBe(0);
      expect(response.data).toHaveLength(0);
    });

    /**
     * Test Case 28: Kiểm tra pagination object reference
     * Input: Original pagination object
     * Expected Output: Reference preserved
     * Path Coverage: Reference handling
     */
    it('TC028: should reference original pagination object', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);
      (pagination as any).page = 2;

      expect(response.pagination.page).toBe(2);
    });
  });

  describe('Edge Cases and Boundaries', () => {
    /**
     * Test Case 29: Kiểm tra với page = 0
     * Input: page = 0
     * Expected Output: Value preserved (edge case)
     * Path Coverage: Page boundary
     */
    it('TC029: should handle page 0', () => {
      const data: any[] = [];
      const pagination = {
        page: 0,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.pagination.page).toBe(0);
    });

    /**
     * Test Case 30: Kiểm tra với limit = 0
     * Input: limit = 0
     * Expected Output: Value preserved
     * Path Coverage: Limit boundary
     */
    it('TC030: should handle limit 0', () => {
      const data: any[] = [];
      const pagination = {
        page: 1,
        limit: 0,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.pagination.limit).toBe(0);
    });

    /**
     * Test Case 31: Kiểm tra với very large numbers
     * Input: Large page, limit, total values
     * Expected Output: Large numbers preserved
     * Path Coverage: Large numbers
     */
    it('TC031: should handle very large numbers', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 999999,
        limit: 100000,
        total: 10000000,
        totalPages: 100,
        hasNext: false,
        hasPrev: true,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.pagination.page).toBe(999999);
      expect(response.pagination.limit).toBe(100000);
      expect(response.pagination.total).toBe(10000000);
    });

    /**
     * Test Case 32: Kiểm tra multiple instances independence
     * Input: Multiple instances
     * Expected Output: Each instance independent
     * Path Coverage: Instance independence
     */
    it('TC032: should create independent instances', () => {
      const data1 = [{ id: 1 }];
      const data2 = [{ id: 2 }];
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
        limit: 20,
        total: 200,
        totalPages: 10,
        hasNext: true,
        hasPrev: true,
      };

      const response1 = new PaginatedResponseDto(data1, pagination1);
      const response2 = new PaginatedResponseDto(data2, pagination2);

      expect(response1).not.toBe(response2);
      expect(response1.pagination.page).toBe(1);
      expect(response2.pagination.page).toBe(2);
      expect(response1.data?.[0].id).toBe(1);
      expect(response2.data?.[0].id).toBe(2);
    });

    /**
     * Test Case 33: Kiểm tra property modification
     * Input: Modify properties after creation
     * Expected Output: Properties can be modified
     * Path Coverage: Mutability
     */
    it('TC033: should allow property modification', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);
      response.message = 'Modified message';
      (response.pagination as any).page = 2;

      expect(response.message).toBe('Modified message');
      expect(response.pagination.page).toBe(2);
    });

    /**
     * Test Case 34: Kiểm tra empty message
     * Input: message = ''
     * Expected Output: Empty message preserved
     * Path Coverage: Empty message
     */
    it('TC034: should handle empty message string', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination, '');

      expect(response.message).toBe('');
    });

    /**
     * Test Case 35: Kiểm tra special characters in message
     * Input: Message with special chars
     * Expected Output: Special chars preserved
     * Path Coverage: Special characters
     */
    it('TC035: should handle special characters in message', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };
      const message = 'Retrieved <data> & symbols !@#$%';

      const response = new PaginatedResponseDto(data, pagination, message);

      expect(response.message).toBe(message);
    });
  });

  describe('Integration and Real-world Scenarios', () => {
    /**
     * Test Case 36: Kiểm tra typical user list pagination
     * Input: User objects with pagination
     * Expected Output: Complete paginated response
     * Path Coverage: User list use case
     */
    it('TC036: should create typical user list pagination', () => {
      const users = [
        { id: 1, name: 'John', email: 'john@example.com' },
        { id: 2, name: 'Jane', email: 'jane@example.com' },
      ];
      const pagination = {
        page: 1,
        limit: 2,
        total: 10,
        totalPages: 5,
        hasNext: true,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(
        users,
        pagination,
        'Users retrieved successfully',
      );

      expect(response.data).toHaveLength(2);
      expect(response.pagination.page).toBe(1);
      expect(response.pagination.hasNext).toBe(true);
    });

    /**
     * Test Case 37: Kiểm tra product catalog pagination
     * Input: Product objects
     * Expected Output: Paginated product response
     * Path Coverage: Product catalog use case
     */
    it('TC037: should create product catalog pagination', () => {
      const products = [
        { id: 1, name: 'Product 1', price: 99.99 },
        { id: 2, name: 'Product 2', price: 149.99 },
      ];
      const pagination = {
        page: 2,
        limit: 2,
        total: 50,
        totalPages: 25,
        hasNext: true,
        hasPrev: true,
      };

      const response = new PaginatedResponseDto(products, pagination);

      expect(response.data?.[0].price).toBe(99.99);
      expect(response.pagination.page).toBe(2);
    });

    /**
     * Test Case 38: Kiểm tra search results pagination
     * Input: Search result items
     * Expected Output: Paginated search results
     * Path Coverage: Search use case
     */
    it('TC038: should create search results pagination', () => {
      const searchResults = [
        { id: 1, title: 'Result 1', relevance: 0.95 },
        { id: 2, title: 'Result 2', relevance: 0.87 },
      ];
      const pagination = {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(
        searchResults,
        pagination,
        'Search completed',
      );

      expect(response.message).toBe('Search completed');
      expect(response.data).toHaveLength(2);
    });

    /**
     * Test Case 39: Kiểm tra JSON serialization
     * Input: Paginated response
     * Expected Output: Can be JSON stringified
     * Path Coverage: JSON serialization
     */
    it('TC039: should be JSON serializable', () => {
      const data = [{ id: 1, name: 'Item' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);
      const json = JSON.stringify(response);
      const parsed = JSON.parse(json);

      expect(parsed.success).toBe(true);
      expect(parsed.data).toHaveLength(1);
      expect(parsed.pagination.page).toBe(1);
      expect(parsed.pagination.total).toBe(1);
    });

    /**
     * Test Case 40: Kiểm tra API response format
     * Input: Paginated response
     * Expected Output: Proper API response structure
     * Path Coverage: API response use case
     */
    it('TC040: should work as HTTP API response', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);

      const apiResponse = {
        statusCode: 200,
        body: response,
      };

      expect(apiResponse.body.success).toBe(true);
      expect(apiResponse.body.pagination).toBeDefined();
      expect(apiResponse.body.data).toBeDefined();
    });

    /**
     * Test Case 41: Kiểm tra với TypeScript generic types
     * Input: Different generic types
     * Expected Output: Type safety maintained
     * Path Coverage: Generic type handling
     */
    it('TC041: should handle different generic types', () => {
      interface User {
        id: number;
        name: string;
      }
      interface Product {
        id: number;
        price: number;
      }

      const users: User[] = [{ id: 1, name: 'John' }];
      const products: Product[] = [{ id: 1, price: 99.99 }];

      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

      const userResponse = new PaginatedResponseDto(users, pagination);
      const productResponse = new PaginatedResponseDto(products, pagination);

      expect(userResponse.data?.[0].name).toBe('John');
      expect(productResponse.data?.[0].price).toBe(99.99);
    });

    /**
     * Test Case 42: Kiểm tra pagination metadata calculation
     * Input: Various page scenarios
     * Expected Output: Correct hasNext/hasPrev calculations
     * Path Coverage: Metadata validation
     */
    it('TC042: should correctly represent pagination state', () => {
      const data = [{ id: 1 }];

      // First page of many
      const firstPage = new PaginatedResponseDto(data, {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      });

      // Middle page
      const middlePage = new PaginatedResponseDto(data, {
        page: 5,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: true,
      });

      // Last page
      const lastPage = new PaginatedResponseDto(data, {
        page: 10,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: false,
        hasPrev: true,
      });

      expect(firstPage.pagination.hasNext).toBe(true);
      expect(firstPage.pagination.hasPrev).toBe(false);

      expect(middlePage.pagination.hasNext).toBe(true);
      expect(middlePage.pagination.hasPrev).toBe(true);

      expect(lastPage.pagination.hasNext).toBe(false);
      expect(lastPage.pagination.hasPrev).toBe(true);
    });

    /**
     * Test Case 43: Kiểm tra với infinite scroll scenario
     * Input: Continuous pagination
     * Expected Output: Correct next page indicator
     * Path Coverage: Infinite scroll use case
     */
    it('TC043: should support infinite scroll scenario', () => {
      const data = Array(20)
        .fill(null)
        .map((_, i) => ({ id: i }));
      const pagination = {
        page: 3,
        limit: 20,
        total: 1000,
        totalPages: 50,
        hasNext: true,
        hasPrev: true,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.data).toHaveLength(20);
      expect(response.pagination.hasNext).toBe(true);
      expect(response.pagination.page).toBe(3);
    });

    /**
     * Test Case 44: Kiểm tra offset calculation support
     * Input: Page and limit
     * Expected Output: Can calculate offset
     * Path Coverage: Offset calculation
     */
    it('TC044: should support offset calculation', () => {
      const data = [{ id: 1 }];
      const page = 5;
      const limit = 10;
      const pagination = {
        page,
        limit,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: true,
      };

      const response = new PaginatedResponseDto(data, pagination);
      const offset = (response.pagination.page - 1) * response.pagination.limit;

      expect(offset).toBe(40); // (5-1) * 10
    });

    /**
     * Test Case 45: Kiểm tra remaining items calculation
     * Input: Page, limit, total
     * Expected Output: Can calculate remaining items
     * Path Coverage: Remaining items
     */
    it('TC045: should support remaining items calculation', () => {
      const data = Array(7)
        .fill(null)
        .map((_, i) => ({ id: i }));
      const pagination = {
        page: 5,
        limit: 10,
        total: 47,
        totalPages: 5,
        hasNext: false,
        hasPrev: true,
      };

      const response = new PaginatedResponseDto(data, pagination);
      const itemsShown =
        (response.pagination.page - 1) * response.pagination.limit +
        data.length;
      const remaining = response.pagination.total - itemsShown;

      expect(itemsShown).toBe(47); // (5-1)*10 + 7 = 47
      expect(remaining).toBe(0);
    });

    /**
     * Test Case 46: Kiểm tra cursor-based pagination support
     * Input: Page as cursor
     * Expected Output: Can be used for cursor pagination
     * Path Coverage: Cursor pagination
     */
    it('TC046: should support cursor-based pagination concept', () => {
      const data = [
        { id: 'cursor-1', name: 'Item 1' },
        { id: 'cursor-2', name: 'Item 2' },
      ];
      const pagination = {
        page: 1,
        limit: 2,
        total: 10,
        totalPages: 5,
        hasNext: true,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.data?.[response.data.length - 1].id).toBe('cursor-2');
      expect(response.pagination.hasNext).toBe(true);
    });

    /**
     * Test Case 47: Kiểm tra empty page in middle scenario
     * Input: Page exists but no data
     * Expected Output: Empty data with valid pagination
     * Path Coverage: Empty middle page
     */
    it('TC047: should handle empty page in valid range', () => {
      const data: any[] = [];
      const pagination = {
        page: 5,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);

      expect(response.data).toHaveLength(0);
      expect(response.pagination.page).toBe(5);
    });

    /**
     * Test Case 48: Kiểm tra navigation links generation
     * Input: Pagination data
     * Expected Output: Can generate prev/next links
     * Path Coverage: Navigation use case
     */
    it('TC048: should provide data for navigation links', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 3,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: true,
      };

      const response = new PaginatedResponseDto(data, pagination);

      const prevPage = response.pagination.hasPrev
        ? response.pagination.page - 1
        : null;
      const nextPage = response.pagination.hasNext
        ? response.pagination.page + 1
        : null;

      expect(prevPage).toBe(2);
      expect(nextPage).toBe(4);
    });

    /**
     * Test Case 49: Kiểm tra logging scenario
     * Input: Paginated response
     * Expected Output: All fields for logging
     * Path Coverage: Logging use case
     */
    it('TC049: should provide all fields for logging', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(
        data,
        pagination,
        'Data fetched',
      );

      const logEntry = {
        timestamp: response.timestamp,
        success: response.success,
        message: response.message,
        itemsCount: response.data?.length,
        page: response.pagination.page,
        total: response.pagination.total,
      };

      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.success).toBe(true);
      expect(logEntry.itemsCount).toBe(1);
      expect(logEntry.page).toBe(1);
    });

    /**
     * Test Case 50: Kiểm tra with metadata extension
     * Input: Extended response with custom fields
     * Expected Output: Can be extended
     * Path Coverage: Extensibility
     */
    it('TC050: should allow extension with custom metadata', () => {
      const data = [{ id: 1 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };

      const response = new PaginatedResponseDto(data, pagination);
      (response as any).customMeta = {
        queryTime: 150,
        source: 'database',
      };

      expect((response as any).customMeta.queryTime).toBe(150);
      expect((response as any).customMeta.source).toBe('database');
    });
  });
});
