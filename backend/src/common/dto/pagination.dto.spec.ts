import 'reflect-metadata';
import { validate } from 'class-validator';
import { PaginationDto } from './pagination.dto';

describe('PaginationDto - White Box Testing', () => {
  describe('page field validation', () => {
    it('should accept valid page number', async () => {
      const dto = new PaginationDto();
      dto.page = 1;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(1);
    });

    it('should accept page with default value of 1', async () => {
      const dto = new PaginationDto();

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(1);
    });

    it('should accept page 2', async () => {
      const dto = new PaginationDto();
      dto.page = 2;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(2);
    });

    it('should accept large page numbers', async () => {
      const dto = new PaginationDto();
      dto.page = 1000;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(1000);
    });

    it('should reject page less than 1', async () => {
      const dto = new PaginationDto();
      dto.page = 0;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should reject page as negative number', async () => {
      const dto = new PaginationDto();
      dto.page = -1;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should handle undefined page (optional)', async () => {
      const dto = new PaginationDto();

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(1); // Default value
    });

    it('should accept page with decimal value', async () => {
      const dto = new PaginationDto();
      dto.page = 1.5;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(1.5);
    });
  });

  describe('limit field validation', () => {
    it('should accept valid limit number', async () => {
      const dto = new PaginationDto();
      dto.limit = 10;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.limit).toBe(10);
    });

    it('should accept limit with default value of 20', async () => {
      const dto = new PaginationDto();

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.limit).toBe(20);
    });

    it('should accept limit 1 (minimum)', async () => {
      const dto = new PaginationDto();
      dto.limit = 1;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.limit).toBe(1);
    });

    it('should accept limit 100 (maximum)', async () => {
      const dto = new PaginationDto();
      dto.limit = 100;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.limit).toBe(100);
    });

    it('should reject limit less than 1', async () => {
      const dto = new PaginationDto();
      dto.limit = 0;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should reject limit greater than 100', async () => {
      const dto = new PaginationDto();
      dto.limit = 101;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('max');
    });

    it('should reject limit as negative number', async () => {
      const dto = new PaginationDto();
      dto.limit = -5;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should handle undefined limit (optional)', async () => {
      const dto = new PaginationDto();
      dto.page = 1;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.limit).toBe(20); // Default value
    });

    it('should accept limit with boundary value 50 (middle range)', async () => {
      const dto = new PaginationDto();
      dto.limit = 50;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.limit).toBe(50);
    });

    it('should accept limit exactly at boundary (1)', async () => {
      const dto = new PaginationDto();
      dto.limit = 1;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.limit).toBe(1);
    });

    it('should accept limit exactly at boundary (100)', async () => {
      const dto = new PaginationDto();
      dto.limit = 100;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.limit).toBe(100);
    });

    it('should fail limit just above boundary (101)', async () => {
      const dto = new PaginationDto();
      dto.limit = 101;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('sortBy field validation', () => {
    it('should accept valid string sortBy', async () => {
      const dto = new PaginationDto();
      dto.sortBy = 'name';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortBy).toBe('name');
    });

    it('should accept sortBy with special characters', async () => {
      const dto = new PaginationDto();
      dto.sortBy = 'created_at';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortBy).toBe('created_at');
    });

    it('should accept empty string sortBy', async () => {
      const dto = new PaginationDto();
      dto.sortBy = '';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortBy).toBe('');
    });

    it('should accept sortBy with unicode characters', async () => {
      const dto = new PaginationDto();
      dto.sortBy = 'name_中文';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortBy).toBe('name_中文');
    });

    it('should accept very long sortBy string', async () => {
      const dto = new PaginationDto();
      dto.sortBy = 'a'.repeat(1000);

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should handle undefined sortBy (optional)', async () => {
      const dto = new PaginationDto();
      dto.page = 1;
      dto.limit = 10;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortBy).toBeUndefined();
    });

    it('should reject sortBy as number', async () => {
      const dto = new PaginationDto();
      (dto as any).sortBy = 123;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should reject sortBy as array', async () => {
      const dto = new PaginationDto();
      (dto as any).sortBy = ['name', 'age'];

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject sortBy as object', async () => {
      const dto = new PaginationDto();
      (dto as any).sortBy = { field: 'name' };

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('sortOrder field validation', () => {
    it('should accept valid sortOrder "asc"', async () => {
      const dto = new PaginationDto();
      dto.sortOrder = 'asc';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortOrder).toBe('asc');
    });

    it('should accept valid sortOrder "desc"', async () => {
      const dto = new PaginationDto();
      dto.sortOrder = 'desc';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortOrder).toBe('desc');
    });

    it('should use default sortOrder "desc"', async () => {
      const dto = new PaginationDto();

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortOrder).toBe('desc');
    });

    it('should reject invalid sortOrder "ASC" (uppercase)', async () => {
      const dto = new PaginationDto();
      dto.sortOrder = 'ASC' as any;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should reject invalid sortOrder "DESC" (uppercase)', async () => {
      const dto = new PaginationDto();
      dto.sortOrder = 'DESC' as any;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid sortOrder "ascending"', async () => {
      const dto = new PaginationDto();
      dto.sortOrder = 'ascending' as any;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid sortOrder "descending"', async () => {
      const dto = new PaginationDto();
      dto.sortOrder = 'descending' as any;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject empty string sortOrder', async () => {
      const dto = new PaginationDto();
      dto.sortOrder = '' as any;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject sortOrder as number', async () => {
      const dto = new PaginationDto();
      (dto as any).sortOrder = 1;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject sortOrder as boolean', async () => {
      const dto = new PaginationDto();
      (dto as any).sortOrder = true;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should handle undefined sortOrder (optional)', async () => {
      const dto = new PaginationDto();
      dto.page = 1;
      dto.limit = 10;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortOrder).toBe('desc'); // Default value
    });
  });

  describe('search field validation', () => {
    it('should accept valid search string', async () => {
      const dto = new PaginationDto();
      dto.search = 'test query';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.search).toBe('test query');
    });

    it('should accept search with special characters', async () => {
      const dto = new PaginationDto();
      dto.search = 'user@example.com';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.search).toBe('user@example.com');
    });

    it('should accept empty string search', async () => {
      const dto = new PaginationDto();
      dto.search = '';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.search).toBe('');
    });

    it('should accept very long search string', async () => {
      const dto = new PaginationDto();
      dto.search = 'a'.repeat(10000);

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should accept unicode characters in search', async () => {
      const dto = new PaginationDto();
      dto.search = '中文 日本語 한국어';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.search).toBe('中文 日本語 한국어');
    });

    it('should accept emoji in search', async () => {
      const dto = new PaginationDto();
      dto.search = '🚀 test ⭐';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.search).toBe('🚀 test ⭐');
    });

    it('should handle undefined search (optional)', async () => {
      const dto = new PaginationDto();
      dto.page = 1;
      dto.limit = 10;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.search).toBeUndefined();
    });

    it('should reject search as number', async () => {
      const dto = new PaginationDto();
      (dto as any).search = 123;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should reject search as array', async () => {
      const dto = new PaginationDto();
      (dto as any).search = ['term1', 'term2'];

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject search as object', async () => {
      const dto = new PaginationDto();
      (dto as any).search = { query: 'test' };

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Complete object validation', () => {
    it('should validate complete valid PaginationDto', async () => {
      const dto = new PaginationDto();
      dto.page = 1;
      dto.limit = 20;
      dto.sortBy = 'created_at';
      dto.sortOrder = 'desc';
      dto.search = 'test';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
      expect(dto.sortBy).toBe('created_at');
      expect(dto.sortOrder).toBe('desc');
      expect(dto.search).toBe('test');
    });

    it('should validate with only required fields (defaults applied)', async () => {
      const dto = new PaginationDto();

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
      expect(dto.sortOrder).toBe('desc');
    });

    it('should validate with page and limit only', async () => {
      const dto = new PaginationDto();
      dto.page = 2;
      dto.limit = 50;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(50);
    });

    it('should fail validation with multiple invalid fields', async () => {
      const dto = new PaginationDto();
      dto.page = 0;
      dto.limit = 101;
      dto.sortOrder = 'invalid' as any;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with only page invalid', async () => {
      const dto = new PaginationDto();
      dto.page = 0;
      dto.limit = 20;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'page')).toBe(true);
    });

    it('should fail validation with only limit invalid', async () => {
      const dto = new PaginationDto();
      dto.page = 1;
      dto.limit = 101;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'limit')).toBe(true);
    });

    it('should handle empty object (all defaults)', async () => {
      const dto = new PaginationDto();

      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
      expect(dto.sortOrder).toBe('desc');
      expect(dto.sortBy).toBeUndefined();
      expect(dto.search).toBeUndefined();
    });
  });

  describe('Edge Cases and Boundary Testing', () => {
    it('should handle minimum valid values', async () => {
      const dto = new PaginationDto();
      dto.page = 1;
      dto.limit = 1;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(1);
    });

    it('should handle maximum valid values', async () => {
      const dto = new PaginationDto();
      dto.page = 9999;
      dto.limit = 100;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(9999);
      expect(dto.limit).toBe(100);
    });

    it('should handle limit exactly at boundary (1)', async () => {
      const dto = new PaginationDto();
      dto.limit = 1;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.limit).toBe(1);
    });

    it('should handle limit exactly at boundary (100)', async () => {
      const dto = new PaginationDto();
      dto.limit = 100;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.limit).toBe(100);
    });

    it('should fail limit just below boundary (0)', async () => {
      const dto = new PaginationDto();
      dto.limit = 0;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail limit just above boundary (101)', async () => {
      const dto = new PaginationDto();
      dto.limit = 101;

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Real-world Usage Scenarios', () => {
    it('should work for first page with default values', async () => {
      const dto = new PaginationDto();

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
      expect(dto.sortOrder).toBe('desc');
    });

    it('should work for second page with sorting', async () => {
      const dto = new PaginationDto();
      dto.page = 2;
      dto.limit = 10;
      dto.sortBy = 'created_at';
      dto.sortOrder = 'desc';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(10);
      expect(dto.sortBy).toBe('created_at');
      expect(dto.sortOrder).toBe('desc');
    });

    it('should work for search with pagination', async () => {
      const dto = new PaginationDto();
      dto.page = 1;
      dto.limit = 20;
      dto.search = 'john doe';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.search).toBe('john doe');
    });

    it('should work for ascending sort order', async () => {
      const dto = new PaginationDto();
      dto.page = 1;
      dto.limit = 50;
      dto.sortBy = 'name';
      dto.sortOrder = 'asc';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortOrder).toBe('asc');
    });

    it('should work for complex query with all fields', async () => {
      const dto = new PaginationDto();
      dto.page = 5;
      dto.limit = 100;
      dto.sortBy = 'updated_at';
      dto.sortOrder = 'asc';
      dto.search = 'active users';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(5);
      expect(dto.limit).toBe(100);
      expect(dto.sortBy).toBe('updated_at');
      expect(dto.sortOrder).toBe('asc');
      expect(dto.search).toBe('active users');
    });
  });

  describe('Instance and Property Tests', () => {
    it('should create instance with new operator', () => {
      const dto = new PaginationDto();

      expect(dto).toBeInstanceOf(PaginationDto);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
      expect(dto.sortOrder).toBe('desc');
    });

    it('should allow property modification', () => {
      const dto = new PaginationDto();

      dto.page = 5;
      dto.limit = 50;
      dto.sortBy = 'name';
      dto.sortOrder = 'asc';
      dto.search = 'test';

      expect(dto.page).toBe(5);
      expect(dto.limit).toBe(50);
      expect(dto.sortBy).toBe('name');
      expect(dto.sortOrder).toBe('asc');
      expect(dto.search).toBe('test');
    });

    it('should handle property modification with validation', async () => {
      const dto = new PaginationDto();
      dto.page = 0; // Invalid

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize correctly to JSON', () => {
      const dto = new PaginationDto();
      dto.page = 2;
      dto.limit = 50;
      dto.sortBy = 'name';
      dto.sortOrder = 'asc';
      dto.search = 'test';

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(50);
      expect(parsed.sortBy).toBe('name');
      expect(parsed.sortOrder).toBe('asc');
      expect(parsed.search).toBe('test');
    });

    it('should serialize default values', () => {
      const dto = new PaginationDto();

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(20);
      expect(parsed.sortOrder).toBe('desc');
    });
  });

  describe('Combination and Integration Tests', () => {
    it('should handle page and limit combination', async () => {
      const combinations = [
        { page: 1, limit: 10 },
        { page: 2, limit: 20 },
        { page: 5, limit: 50 },
        { page: 10, limit: 100 },
      ];

      for (const combo of combinations) {
        const dto = new PaginationDto();
        dto.page = combo.page;
        dto.limit = combo.limit;
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
        expect(dto.page).toBe(combo.page);
        expect(dto.limit).toBe(combo.limit);
      }
    });

    it('should handle sortBy and sortOrder combination', async () => {
      const dto = new PaginationDto();
      dto.sortBy = 'created_at';
      dto.sortOrder = 'asc';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortBy).toBe('created_at');
      expect(dto.sortOrder).toBe('asc');
    });

    it('should handle all optional fields together', async () => {
      const dto = new PaginationDto();
      dto.sortBy = 'updated_at';
      dto.sortOrder = 'desc';
      dto.search = 'query term';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortBy).toBe('updated_at');
      expect(dto.sortOrder).toBe('desc');
      expect(dto.search).toBe('query term');
    });
  });

  describe('Special Character Handling', () => {
    it('should handle search with SQL injection attempts', async () => {
      const dto = new PaginationDto();
      dto.search = "'; DROP TABLE users; --";

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.search).toContain('DROP');
    });

    it('should handle search with HTML tags', async () => {
      const dto = new PaginationDto();
      dto.search = '<script>alert("xss")</script>';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.search).toContain('<script>');
    });

    it('should handle sortBy with dots and underscores', async () => {
      const dto = new PaginationDto();
      dto.sortBy = 'user.profile.name';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should handle whitespace in search', async () => {
      const dto = new PaginationDto();
      dto.search = '   spaced   ';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.search).toBe('   spaced   ');
    });
  });

  describe('Default Values Behavior', () => {
    it('should have page default to 1', () => {
      const dto = new PaginationDto();

      expect(dto.page).toBe(1);
    });

    it('should have limit default to 20', () => {
      const dto = new PaginationDto();

      expect(dto.limit).toBe(20);
    });

    it('should have sortOrder default to desc', () => {
      const dto = new PaginationDto();

      expect(dto.sortOrder).toBe('desc');
    });

    it('should allow overriding all defaults', async () => {
      const dto = new PaginationDto();
      dto.page = 5;
      dto.limit = 50;
      dto.sortOrder = 'asc';

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(5);
      expect(dto.limit).toBe(50);
      expect(dto.sortOrder).toBe('asc');
    });
  });
});
