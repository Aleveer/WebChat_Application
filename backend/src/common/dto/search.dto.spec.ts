import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SearchDto, DateRangeDto, FileUploadDto } from './search.dto';
import { PaginationDto } from './pagination.dto';

describe('SearchDto - White Box Testing', () => {
  describe('Constructor Tests', () => {
    it('should create SearchDto with all properties', () => {
      const dto = new SearchDto();
      dto.q = 'test query';
      dto.filter = 'test filter';
      dto.page = 1;
      dto.limit = 10;

      expect(dto.q).toBe('test query');
      expect(dto.filter).toBe('test filter');
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
    });

    it('should create SearchDto with only q property', () => {
      const dto = new SearchDto();
      dto.q = 'query only';

      expect(dto.q).toBe('query only');
      expect(dto.filter).toBeUndefined();
    });

    it('should create SearchDto with only filter property', () => {
      const dto = new SearchDto();
      dto.filter = 'filter only';

      expect(dto.filter).toBe('filter only');
      expect(dto.q).toBeUndefined();
    });

    it('should create SearchDto with all PaginationDto properties inherited', () => {
      const dto = new SearchDto();
      dto.page = 2;
      dto.limit = 50;
      dto.sortBy = 'name';
      dto.sortOrder = 'asc';
      dto.search = 'search term';

      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(50);
      expect(dto.sortBy).toBe('name');
      expect(dto.sortOrder).toBe('asc');
      expect(dto.search).toBe('search term');
    });

    it('should handle empty object creation', () => {
      const dto = new SearchDto();

      expect(dto.q).toBeUndefined();
      expect(dto.filter).toBeUndefined();
      // Note: page and limit have default values from parent class
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(20);
    });
  });

  describe('Validation Tests - q property', () => {
    it('should accept valid string for q', async () => {
      const dto = new SearchDto();
      dto.q = 'search query';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept empty string for q', async () => {
      const dto = new SearchDto();
      dto.q = '';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept long string for q', async () => {
      const dto = new SearchDto();
      dto.q = 'a'.repeat(1000);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept string with special characters for q', async () => {
      const dto = new SearchDto();
      dto.q = 'query with !@#$%^&*() special chars';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept string with numbers for q', async () => {
      const dto = new SearchDto();
      dto.q = 'query123';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept undefined for q (optional)', async () => {
      const dto = new SearchDto();
      dto.filter = 'test';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept null for q (optional)', async () => {
      const dto = new SearchDto();
      (dto as any).q = null;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle non-string values for q by throwing error', () => {
      expect(() => {
        plainToInstance(SearchDto, { q: 123 });
      }).toThrow();

      expect(() => {
        plainToInstance(SearchDto, { q: true });
      }).toThrow();

      expect(() => {
        plainToInstance(SearchDto, { q: {} });
      }).toThrow();

      expect(() => {
        plainToInstance(SearchDto, { q: [] });
      }).toThrow();
    });
  });

  describe('Validation Tests - filter property', () => {
    it('should accept valid string for filter', async () => {
      const dto = new SearchDto();
      dto.filter = 'category:tech';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept empty string for filter', async () => {
      const dto = new SearchDto();
      dto.filter = '';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept long string for filter', async () => {
      const dto = new SearchDto();
      dto.filter = 'a'.repeat(500);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept string with special characters for filter', async () => {
      const dto = new SearchDto();
      dto.filter = 'filter:value1,value2';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept undefined for filter (optional)', async () => {
      const dto = new SearchDto();
      dto.q = 'query';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept null for filter (optional)', async () => {
      const dto = new SearchDto();
      (dto as any).filter = null;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject number for filter', async () => {
      const dto = plainToInstance(SearchDto, { filter: 456 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('filter');
    });

    it('should reject boolean for filter', async () => {
      const dto = plainToInstance(SearchDto, { filter: false });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('filter');
    });

    it('should reject object for filter', async () => {
      const dto = plainToInstance(SearchDto, { filter: {} });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('filter');
    });

    it('should reject array for filter', async () => {
      const dto = plainToInstance(SearchDto, { filter: [] });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('filter');
    });
  });

  describe('Transform Tests - q property', () => {
    it('should trim whitespace from q', () => {
      const dto = plainToInstance(SearchDto, { q: '  test query  ' });
      expect(dto.q).toBe('test query');
    });

    it('should trim leading whitespace from q', () => {
      const dto = plainToInstance(SearchDto, { q: '  test query' });
      expect(dto.q).toBe('test query');
    });

    it('should trim trailing whitespace from q', () => {
      const dto = plainToInstance(SearchDto, { q: 'test query  ' });
      expect(dto.q).toBe('test query');
    });

    it('should handle string with only whitespace in q', () => {
      const dto = plainToInstance(SearchDto, { q: '     ' });
      expect(dto.q).toBe('');
    });

    it('should handle empty string in q', () => {
      const dto = plainToInstance(SearchDto, { q: '' });
      expect(dto.q).toBe('');
    });

    it('should handle undefined in q (no transform applied)', () => {
      const dto = plainToInstance(SearchDto, { filter: 'test' });
      expect(dto.q).toBeUndefined();
    });
  });

  describe('Inheritance from PaginationDto', () => {
    it('should validate pagination properties from parent', async () => {
      const dto = new SearchDto();
      dto.page = 2;
      dto.limit = 25;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept valid sortBy', async () => {
      const dto = new SearchDto();
      dto.sortBy = 'createdAt';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept valid sortOrder', async () => {
      const dto = new SearchDto();
      dto.sortOrder = 'asc';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept valid search', async () => {
      const dto = new SearchDto();
      dto.search = 'search term';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid sortOrder', async () => {
      const dto = plainToInstance(SearchDto, { sortOrder: 'invalid' });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('sortOrder');
    });

    it('should reject negative page', async () => {
      const dto = plainToInstance(SearchDto, { page: -1 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('page');
    });

    it('should reject limit greater than 100', async () => {
      const dto = plainToInstance(SearchDto, { limit: 101 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('limit');
    });

    it('should reject zero limit', async () => {
      const dto = plainToInstance(SearchDto, { limit: 0 });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('limit');
    });
  });

  describe('Combined Validation Tests', () => {
    it('should accept all valid properties', async () => {
      const dto = new SearchDto();
      dto.q = 'search query';
      dto.filter = 'category:tech';
      dto.page = 2;
      dto.limit = 20;
      dto.sortBy = 'name';
      dto.sortOrder = 'asc';
      dto.search = 'extra search';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept minimal valid properties', async () => {
      const dto = new SearchDto();
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate both q and filter', async () => {
      const dto = new SearchDto();
      dto.q = 'query';
      dto.filter = 'filter';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle complex search scenario', async () => {
      const dto = new SearchDto();
      dto.q = 'node.js backend';
      dto.filter = 'status:active,role:admin';
      dto.page = 3;
      dto.limit = 50;
      dto.sortBy = 'createdAt';
      dto.sortOrder = 'desc';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should work for user search with filters', async () => {
      const dto = new SearchDto();
      dto.q = 'john doe';
      dto.filter = 'role:user,status:active';
      dto.page = 1;
      dto.limit = 20;
      dto.sortBy = 'name';
      dto.sortOrder = 'asc';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should work for message search with pagination', async () => {
      const dto = new SearchDto();
      dto.q = 'important meeting';
      dto.filter = 'type:message';
      dto.page = 2;
      dto.limit = 25;
      dto.sortBy = 'timestamp';
      dto.sortOrder = 'desc';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle search with only query string', async () => {
      const dto = new SearchDto();
      dto.q = 'quick search';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle search with only filter', async () => {
      const dto = new SearchDto();
      dto.filter = 'status:active';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long query string', async () => {
      const dto = new SearchDto();
      dto.q = 'a'.repeat(10000);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle query with newlines', async () => {
      const dto = new SearchDto();
      dto.q = 'multi\nline\nquery';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle query with tabs', async () => {
      const dto = new SearchDto();
      dto.q = 'query\twith\ttabs';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle query with unicode characters', async () => {
      const dto = new SearchDto();
      dto.q = 'tìm kiếm tiếng việt 🎉';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle query with SQL-like strings', async () => {
      const dto = new SearchDto();
      dto.q = "SELECT * FROM users WHERE name='test'";
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const dto = new SearchDto();
      dto.q = 'test';
      dto.filter = 'filter';
      dto.page = 1;
      dto.limit = 10;

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.q).toBe('test');
      expect(parsed.filter).toBe('filter');
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(10);
    });
  });

  describe('Type Safety', () => {
    it('should maintain correct types for all properties', () => {
      const dto = new SearchDto();
      dto.q = 'string';
      dto.filter = 'string';
      dto.page = 1;
      dto.limit = 20;

      expect(typeof dto.q).toBe('string');
      expect(typeof dto.filter).toBe('string');
      expect(typeof dto.page).toBe('number');
      expect(typeof dto.limit).toBe('number');
    });
  });
});

describe('DateRangeDto - White Box Testing', () => {
  describe('Constructor Tests', () => {
    it('should create DateRangeDto with startDate only', () => {
      const dto = new DateRangeDto();
      const date = new Date('2024-01-01');
      dto.startDate = date;

      expect(dto.startDate).toEqual(date);
      expect(dto.endDate).toBeUndefined();
    });

    it('should create DateRangeDto with endDate only', () => {
      const dto = new DateRangeDto();
      const date = new Date('2024-12-31');
      dto.endDate = date;

      expect(dto.endDate).toEqual(date);
      expect(dto.startDate).toBeUndefined();
    });

    it('should create DateRangeDto with both dates', () => {
      const dto = new DateRangeDto();
      dto.startDate = new Date('2024-01-01');
      dto.endDate = new Date('2024-12-31');

      expect(dto.startDate).toBeInstanceOf(Date);
      expect(dto.endDate).toBeInstanceOf(Date);
    });

    it('should create DateRangeDto with no dates', () => {
      const dto = new DateRangeDto();

      expect(dto.startDate).toBeUndefined();
      expect(dto.endDate).toBeUndefined();
    });
  });

  describe('Validation Tests - startDate property', () => {
    it('should accept valid Date object for startDate', async () => {
      const dto = new DateRangeDto();
      dto.startDate = new Date('2024-01-01');
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept future date for startDate', async () => {
      const dto = new DateRangeDto();
      dto.startDate = new Date('2030-01-01');
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept past date for startDate', async () => {
      const dto = new DateRangeDto();
      dto.startDate = new Date('2020-01-01');
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept today date for startDate', async () => {
      const dto = new DateRangeDto();
      dto.startDate = new Date();
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept undefined for startDate (optional)', async () => {
      const dto = new DateRangeDto();
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should transform string to Date for startDate', () => {
      const dto = plainToInstance(DateRangeDto, { startDate: '2024-01-01' });
      expect(dto.startDate).toBeInstanceOf(Date);
    });

    it('should transform number (timestamp) to Date for startDate', () => {
      const timestamp = new Date('2024-01-01').getTime();
      const dto = plainToInstance(DateRangeDto, { startDate: timestamp });
      expect(dto.startDate).toBeInstanceOf(Date);
    });

    it('should transform boolean to Date for startDate', () => {
      const dto = plainToInstance(DateRangeDto, { startDate: true });
      // @Type decorator transforms boolean to Date (no validation)
      expect(dto.startDate).toBeInstanceOf(Date);
    });

    it('should transform object to Date for startDate', () => {
      const dto = plainToInstance(DateRangeDto, { startDate: {} });
      // @Type decorator transforms object to Date (no validation)
      expect(dto.startDate).toBeInstanceOf(Date);
    });
  });

  describe('Validation Tests - endDate property', () => {
    it('should accept valid Date object for endDate', async () => {
      const dto = new DateRangeDto();
      dto.endDate = new Date('2024-12-31');
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept future date for endDate', async () => {
      const dto = new DateRangeDto();
      dto.endDate = new Date('2050-01-01');
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept past date for endDate', async () => {
      const dto = new DateRangeDto();
      dto.endDate = new Date('2020-12-31');
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept today date for endDate', async () => {
      const dto = new DateRangeDto();
      dto.endDate = new Date();
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept undefined for endDate (optional)', async () => {
      const dto = new DateRangeDto();
      dto.startDate = new Date();
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should transform string to Date for endDate', () => {
      const dto = plainToInstance(DateRangeDto, { endDate: '2024-12-31' });
      expect(dto.endDate).toBeInstanceOf(Date);
    });

    it('should transform number (timestamp) to Date for endDate', () => {
      const timestamp = new Date('2024-12-31').getTime();
      const dto = plainToInstance(DateRangeDto, { endDate: timestamp });
      expect(dto.endDate).toBeInstanceOf(Date);
    });

    it('should transform boolean to Date for endDate', () => {
      const dto = plainToInstance(DateRangeDto, { endDate: false });
      // @Type decorator transforms boolean to Date (no validation)
      expect(dto.endDate).toBeInstanceOf(Date);
    });

    it('should handle array for endDate (not transformed)', () => {
      const dto = plainToInstance(DateRangeDto, { endDate: [] });
      // @Type decorator does not transform arrays
      expect(Array.isArray(dto.endDate)).toBe(true);
    });
  });

  describe('Type Transformation Tests', () => {
    it('should transform ISO string to Date for startDate', () => {
      const dto = plainToInstance(DateRangeDto, {
        startDate: '2024-01-01T00:00:00.000Z',
      });
      expect(dto.startDate).toBeInstanceOf(Date);
    });

    it('should transform ISO string to Date for endDate', () => {
      const dto = plainToInstance(DateRangeDto, {
        endDate: '2024-12-31T23:59:59.999Z',
      });
      expect(dto.endDate).toBeInstanceOf(Date);
    });

    it('should transform both dates from strings', () => {
      const dto = plainToInstance(DateRangeDto, {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
      expect(dto.startDate).toBeInstanceOf(Date);
      expect(dto.endDate).toBeInstanceOf(Date);
    });

    it('should handle Unix timestamp in milliseconds', () => {
      const timestamp = new Date('2024-01-01').getTime();
      const dto = plainToInstance(DateRangeDto, { startDate: timestamp });
      expect(dto.startDate).toBeInstanceOf(Date);
      expect(dto.startDate.getTime()).toBe(timestamp);
    });

    it('should handle date string with time', () => {
      const dto = plainToInstance(DateRangeDto, {
        startDate: '2024-01-01T12:30:45',
      });
      expect(dto.startDate).toBeInstanceOf(Date);
    });
  });

  describe('Combined Validation Tests', () => {
    it('should accept both valid dates', async () => {
      const dto = new DateRangeDto();
      dto.startDate = new Date('2024-01-01');
      dto.endDate = new Date('2024-12-31');
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept only startDate', async () => {
      const dto = new DateRangeDto();
      dto.startDate = new Date('2024-01-01');
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept only endDate', async () => {
      const dto = new DateRangeDto();
      dto.endDate = new Date('2024-12-31');
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept neither date', async () => {
      const dto = new DateRangeDto();
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should work for analytics date range', async () => {
      const dto = new DateRangeDto();
      dto.startDate = new Date('2024-01-01');
      dto.endDate = new Date('2024-01-31');
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should work for filter by last week', async () => {
      const dto = new DateRangeDto();
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      dto.startDate = lastWeek;
      dto.endDate = today;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should work for filter by last month', async () => {
      const dto = new DateRangeDto();
      const today = new Date();
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      dto.startDate = lastMonth;
      dto.endDate = today;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should work for year-to-date filter', async () => {
      const dto = new DateRangeDto();
      dto.startDate = new Date('2024-01-01');
      dto.endDate = new Date();
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle startDate equal to endDate', async () => {
      const dto = new DateRangeDto();
      const date = new Date('2024-06-15');
      dto.startDate = date;
      dto.endDate = date;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle very old dates', async () => {
      const dto = new DateRangeDto();
      dto.startDate = new Date('1900-01-01');
      dto.endDate = new Date('1950-01-01');
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle far future dates', async () => {
      const dto = new DateRangeDto();
      dto.startDate = new Date('2100-01-01');
      dto.endDate = new Date('2200-01-01');
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle dates with different times', async () => {
      const dto = new DateRangeDto();
      dto.startDate = new Date('2024-01-01T00:00:00');
      dto.endDate = new Date('2024-01-01T23:59:59');
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize dates to ISO strings', () => {
      const dto = new DateRangeDto();
      dto.startDate = new Date('2024-01-01');
      dto.endDate = new Date('2024-12-31');

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.startDate).toBe('2024-01-01T00:00:00.000Z');
      expect(parsed.endDate).toBe('2024-12-31T00:00:00.000Z');
    });
  });
});

describe('FileUploadDto - White Box Testing', () => {
  describe('Constructor Tests', () => {
    it('should create FileUploadDto with all properties', () => {
      const dto = new FileUploadDto();
      dto.filename = 'test.jpg';
      dto.mimetype = 'image/jpeg';
      dto.size = 1024;
      dto.path = '/uploads/test.jpg';

      expect(dto.filename).toBe('test.jpg');
      expect(dto.mimetype).toBe('image/jpeg');
      expect(dto.size).toBe(1024);
      expect(dto.path).toBe('/uploads/test.jpg');
    });

    it('should create FileUploadDto with required properties', () => {
      const dto = new FileUploadDto();
      dto.filename = 'document.pdf';
      dto.mimetype = 'application/pdf';
      dto.size = 2048;
      dto.path = '/storage/document.pdf';

      expect(dto.filename).toBeDefined();
      expect(dto.mimetype).toBeDefined();
      expect(dto.size).toBeDefined();
      expect(dto.path).toBeDefined();
    });
  });

  describe('Validation Tests - filename property', () => {
    it('should accept valid filename', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'image.png';
      dto.mimetype = 'image/png';
      dto.size = 1000;
      dto.path = '/uploads/image.png';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept filename with extension', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'document.doc';
      dto.mimetype = 'application/msword';
      dto.size = 1000;
      dto.path = '/uploads/document.doc';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept filename with path', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'folder/file.txt';
      dto.mimetype = 'text/plain';
      dto.size = 1000;
      dto.path = '/uploads/folder/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept filename with special characters', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'my_file-v2.1.jpg';
      dto.mimetype = 'image/jpeg';
      dto.size = 1000;
      dto.path = '/uploads/my_file-v2.1.jpg';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept long filename', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'a'.repeat(200) + '.txt';
      dto.mimetype = 'text/plain';
      dto.size = 1000;
      dto.path = '/uploads/long.txt';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject undefined for filename', async () => {
      const dto = new FileUploadDto();
      dto.mimetype = 'text/plain';
      dto.size = 1000;
      dto.path = '/uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'filename')).toBe(true);
    });

    it('should reject number for filename', async () => {
      const dto = plainToInstance(FileUploadDto, { filename: 123 });
      dto.mimetype = 'text/plain';
      dto.size = 1000;
      dto.path = '/uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('filename');
    });

    it('should reject boolean for filename', async () => {
      const dto = plainToInstance(FileUploadDto, { filename: true });
      dto.mimetype = 'text/plain';
      dto.size = 1000;
      dto.path = '/uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('filename');
    });

    it('should reject object for filename', async () => {
      const dto = plainToInstance(FileUploadDto, { filename: {} });
      dto.mimetype = 'text/plain';
      dto.size = 1000;
      dto.path = '/uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('filename');
    });

    it('should reject array for filename', async () => {
      const dto = plainToInstance(FileUploadDto, { filename: [] });
      dto.mimetype = 'text/plain';
      dto.size = 1000;
      dto.path = '/uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('filename');
    });
  });

  describe('Validation Tests - mimetype property', () => {
    it('should accept valid mimetype', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'image.jpg';
      dto.mimetype = 'image/jpeg';
      dto.size = 1000;
      dto.path = '/uploads/image.jpg';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept PDF mimetype', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'doc.pdf';
      dto.mimetype = 'application/pdf';
      dto.size = 1000;
      dto.path = '/uploads/doc.pdf';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept text mimetype', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'text.txt';
      dto.mimetype = 'text/plain';
      dto.size = 1000;
      dto.path = '/uploads/text.txt';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept JSON mimetype', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'data.json';
      dto.mimetype = 'application/json';
      dto.size = 1000;
      dto.path = '/uploads/data.json';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject undefined for mimetype', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'file.txt';
      dto.size = 1000;
      dto.path = '/uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'mimetype')).toBe(true);
    });

    it('should reject number for mimetype', async () => {
      const dto = plainToInstance(FileUploadDto, { mimetype: 123 });
      dto.filename = 'file.txt';
      dto.size = 1000;
      dto.path = '/uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('mimetype');
    });

    it('should reject boolean for mimetype', async () => {
      const dto = plainToInstance(FileUploadDto, { mimetype: false });
      dto.filename = 'file.txt';
      dto.size = 1000;
      dto.path = '/uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('mimetype');
    });

    it('should reject object for mimetype', async () => {
      const dto = plainToInstance(FileUploadDto, { mimetype: {} });
      dto.filename = 'file.txt';
      dto.size = 1000;
      dto.path = '/uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('mimetype');
    });
  });

  describe('Validation Tests - size property', () => {
    it('should accept valid size', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'file.txt';
      dto.mimetype = 'text/plain';
      dto.size = 1024;
      dto.path = '/uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept zero size', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'empty.txt';
      dto.mimetype = 'text/plain';
      dto.size = 0;
      dto.path = '/uploads/empty.txt';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept large size', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'large.jpg';
      dto.mimetype = 'image/jpeg';
      dto.size = 10 * 1024 * 1024;
      dto.path = '/uploads/large.jpg';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept very large size', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'huge.pdf';
      dto.mimetype = 'application/pdf';
      dto.size = 100 * 1024 * 1024;
      dto.path = '/uploads/huge.pdf';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject undefined for size', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'file.txt';
      dto.mimetype = 'text/plain';
      dto.path = '/uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'size')).toBe(true);
    });

    it('should reject string for size', async () => {
      const dto = plainToInstance(FileUploadDto, { size: '1024' });
      dto.filename = 'file.txt';
      dto.mimetype = 'text/plain';
      dto.path = '/uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('size');
    });

    it('should reject boolean for size', async () => {
      const dto = plainToInstance(FileUploadDto, { size: true });
      dto.filename = 'file.txt';
      dto.mimetype = 'text/plain';
      dto.path = '/uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('size');
    });

    it('should reject object for size', async () => {
      const dto = plainToInstance(FileUploadDto, { size: {} });
      dto.filename = 'file.txt';
      dto.mimetype = 'text/plain';
      dto.path = '/uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('size');
    });

    it('should reject array for size', async () => {
      const dto = plainToInstance(FileUploadDto, { size: [] });
      dto.filename = 'file.txt';
      dto.mimetype = 'text/plain';
      dto.path = '/uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('size');
    });

    it('should accept negative size (no Min decorator)', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'file.txt';
      dto.mimetype = 'text/plain';
      dto.size = -1; // No @Min(0) decorator, so negative is allowed
      dto.path = '/uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Validation Tests - path property', () => {
    it('should accept valid absolute path', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'file.txt';
      dto.mimetype = 'text/plain';
      dto.size = 1000;
      dto.path = '/uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept relative path', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'file.txt';
      dto.mimetype = 'text/plain';
      dto.size = 1000;
      dto.path = './uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept long path', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'file.txt';
      dto.mimetype = 'text/plain';
      dto.size = 1000;
      dto.path = '/very/long/path/to/uploads/file.txt';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept path with special characters', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'my_file-v2.jpg';
      dto.mimetype = 'image/jpeg';
      dto.size = 1000;
      dto.path = '/uploads/my_file-v2.jpg';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject undefined for path', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'file.txt';
      dto.mimetype = 'text/plain';
      dto.size = 1000;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'path')).toBe(true);
    });

    it('should reject number for path', async () => {
      const dto = plainToInstance(FileUploadDto, { path: 123 });
      dto.filename = 'file.txt';
      dto.mimetype = 'text/plain';
      dto.size = 1000;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('path');
    });

    it('should reject boolean for path', async () => {
      const dto = plainToInstance(FileUploadDto, { path: false });
      dto.filename = 'file.txt';
      dto.mimetype = 'text/plain';
      dto.size = 1000;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('path');
    });

    it('should reject object for path', async () => {
      const dto = plainToInstance(FileUploadDto, { path: {} });
      dto.filename = 'file.txt';
      dto.mimetype = 'text/plain';
      dto.size = 1000;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('path');
    });
  });

  describe('Combined Validation Tests', () => {
    it('should accept all valid properties', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'image.jpg';
      dto.mimetype = 'image/jpeg';
      dto.size = 1024 * 1024;
      dto.path = '/uploads/image.jpg';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject when filename is missing', async () => {
      const dto = new FileUploadDto();
      dto.mimetype = 'image/jpeg';
      dto.size = 1000;
      dto.path = '/uploads/image.jpg';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject when mimetype is missing', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'image.jpg';
      dto.size = 1000;
      dto.path = '/uploads/image.jpg';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject when size is missing', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'image.jpg';
      dto.mimetype = 'image/jpeg';
      dto.path = '/uploads/image.jpg';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject when path is missing', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'image.jpg';
      dto.mimetype = 'image/jpeg';
      dto.size = 1000;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject when all properties are missing', async () => {
      const dto = new FileUploadDto();
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should work for image upload', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'profile-photo.jpg';
      dto.mimetype = 'image/jpeg';
      dto.size = 2 * 1024 * 1024;
      dto.path = '/uploads/profiles/profile-photo.jpg';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should work for PDF document', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'contract.pdf';
      dto.mimetype = 'application/pdf';
      dto.size = 5 * 1024 * 1024;
      dto.path = '/uploads/documents/contract.pdf';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should work for text file', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'readme.txt';
      dto.mimetype = 'text/plain';
      dto.size = 2048;
      dto.path = '/uploads/files/readme.txt';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should work for JSON data file', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'config.json';
      dto.mimetype = 'application/json';
      dto.size = 512;
      dto.path = '/uploads/config.json';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should work for Excel file', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'report.xlsx';
      dto.mimetype =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      dto.size = 10 * 1024 * 1024;
      dto.path = '/uploads/excel/report.xlsx';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should work for video file', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'video.mp4';
      dto.mimetype = 'video/mp4';
      dto.size = 100 * 1024 * 1024;
      dto.path = '/uploads/videos/video.mp4';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero-byte file', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'empty.txt';
      dto.mimetype = 'text/plain';
      dto.size = 0;
      dto.path = '/uploads/empty.txt';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle very long filename', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'a'.repeat(300) + '.txt';
      dto.mimetype = 'text/plain';
      dto.size = 1000;
      dto.path = '/uploads/long.txt';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle filename with unicode', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'файл-тест.txt';
      dto.mimetype = 'text/plain';
      dto.size = 1000;
      dto.path = '/uploads/файл-тест.txt';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle filename with emoji', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'photo-🎉.jpg';
      dto.mimetype = 'image/jpeg';
      dto.size = 1000;
      dto.path = '/uploads/photo-🎉.jpg';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle filename with multiple dots', async () => {
      const dto = new FileUploadDto();
      dto.filename = 'file.name.backup.2024.txt';
      dto.mimetype = 'text/plain';
      dto.size = 1000;
      dto.path = '/uploads/file.name.backup.2024.txt';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize to JSON correctly', () => {
      const dto = new FileUploadDto();
      dto.filename = 'test.jpg';
      dto.mimetype = 'image/jpeg';
      dto.size = 1024;
      dto.path = '/uploads/test.jpg';

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.filename).toBe('test.jpg');
      expect(parsed.mimetype).toBe('image/jpeg');
      expect(parsed.size).toBe(1024);
      expect(parsed.path).toBe('/uploads/test.jpg');
    });
  });

  describe('Type Safety', () => {
    it('should maintain correct types for all properties', () => {
      const dto = new FileUploadDto();
      dto.filename = 'test.jpg';
      dto.mimetype = 'image/jpeg';
      dto.size = 1024;
      dto.path = '/uploads/test.jpg';

      expect(typeof dto.filename).toBe('string');
      expect(typeof dto.mimetype).toBe('string');
      expect(typeof dto.size).toBe('number');
      expect(typeof dto.path).toBe('string');
    });
  });
});
