import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { PaginationDto } from '../src/common/dto/pagination.dto';
import { APP_CONSTANTS } from '../src/common/constants/app.constants';

describe('PaginationDto - White Box Testing (Input-Output)', () => {
  describe('Constructor and Default Values', () => {
    /**
     * Test Case 1: Kiểm tra constructor với default values
     * Input: New instance without parameters
     * Expected Output: All default values set correctly
     * Path Coverage: Default initialization
     */
    it('TC001: should create instance with default values', () => {
      const dto = new PaginationDto();

      expect(dto.page).toBe(APP_CONSTANTS.PAGINATION.DEFAULT_PAGE);
      expect(dto.limit).toBe(APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT);
      expect(dto.sortOrder).toBe('desc');
      expect(dto.sortBy).toBeUndefined();
      expect(dto.search).toBeUndefined();
    });

    /**
     * Test Case 2: Kiểm tra instance type
     * Input: New instance
     * Expected Output: Instance of PaginationDto
     * Path Coverage: Instance validation
     */
    it('TC002: should be instance of PaginationDto', () => {
      const dto = new PaginationDto();

      expect(dto).toBeInstanceOf(PaginationDto);
    });

    /**
     * Test Case 3: Kiểm tra property assignment
     * Input: Assign all properties
     * Expected Output: All properties set
     * Path Coverage: Property assignment
     */
    it('TC003: should allow property assignment', () => {
      const dto = new PaginationDto();
      dto.page = 5;
      dto.limit = 50;
      dto.sortBy = 'createdAt';
      dto.sortOrder = 'asc';
      dto.search = 'test';

      expect(dto.page).toBe(5);
      expect(dto.limit).toBe(50);
      expect(dto.sortBy).toBe('createdAt');
      expect(dto.sortOrder).toBe('asc');
      expect(dto.search).toBe('test');
    });
  });

  describe('Page Field Validation', () => {
    /**
     * Test Case 4: Kiểm tra valid page number
     * Input: page = 1 (default)
     * Expected Output: Validation passes
     * Path Coverage: Valid page
     */
    it('TC004: should pass validation with default page', async () => {
      const dto = plainToClass(PaginationDto, {});

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 5: Kiểm tra valid page number > 1
     * Input: page = 5
     * Expected Output: Validation passes
     * Path Coverage: Valid page number
     */
    it('TC005: should pass validation with valid page number', async () => {
      const dto = plainToClass(PaginationDto, { page: '5' });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(5);
    });

    /**
     * Test Case 6: Kiểm tra page = 1 (boundary)
     * Input: page = 1
     * Expected Output: Validation passes
     * Path Coverage: Minimum boundary
     */
    it('TC006: should pass validation with page = 1', async () => {
      const dto = plainToClass(PaginationDto, { page: '1' });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(1);
    });

    /**
     * Test Case 7: Kiểm tra page = 0 (below minimum)
     * Input: page = 0
     * Expected Output: Validation fails - Min constraint
     * Path Coverage: Below minimum
     */
    it('TC007: should fail validation with page = 0', async () => {
      const dto = plainToClass(PaginationDto, { page: '0' });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('page');
      expect(errors[0].constraints).toHaveProperty('min');
    });

    /**
     * Test Case 8: Kiểm tra negative page
     * Input: page = -1
     * Expected Output: Validation fails
     * Path Coverage: Negative number
     */
    it('TC008: should fail validation with negative page', async () => {
      const dto = plainToClass(PaginationDto, { page: '-1' });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('page');
    });

    /**
     * Test Case 9: Kiểm tra non-numeric page
     * Input: page = 'abc'
     * Expected Output: Validation fails - IsNumber
     * Path Coverage: Non-numeric input
     */
    it('TC009: should fail validation with non-numeric page', async () => {
      const dto = plainToClass(PaginationDto, { page: 'abc' });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('page');
      expect(errors[0].constraints).toHaveProperty('isNumber');
    });

    /**
     * Test Case 10: Kiểm tra decimal page
     * Input: page = 1.5
     * Expected Output: Converted to number
     * Path Coverage: Decimal number
     */
    it('TC010: should handle decimal page number', async () => {
      const dto = plainToClass(PaginationDto, { page: '1.5' });

      const errors = await validate(dto);

      expect(dto.page).toBe(1.5);
      // Validation passes as IsNumber doesn't check for integers
      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 11: Kiểm tra very large page number
     * Input: page = 999999
     * Expected Output: Validation passes
     * Path Coverage: Large number
     */
    it('TC011: should pass validation with very large page', async () => {
      const dto = plainToClass(PaginationDto, { page: '999999' });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(999999);
    });

    /**
     * Test Case 12: Kiểm tra page undefined (optional)
     * Input: No page provided
     * Expected Output: Uses default value
     * Path Coverage: Optional field
     */
    it('TC012: should use default when page is not provided', async () => {
      const dto = plainToClass(PaginationDto, {});

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(APP_CONSTANTS.PAGINATION.DEFAULT_PAGE);
    });
  });

  describe('Limit Field Validation', () => {
    /**
     * Test Case 13: Kiểm tra valid limit
     * Input: limit = 20 (default)
     * Expected Output: Validation passes
     * Path Coverage: Valid limit
     */
    it('TC013: should pass validation with default limit', async () => {
      const dto = plainToClass(PaginationDto, {});

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.limit).toBe(APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT);
    });

    /**
     * Test Case 14: Kiểm tra limit = 1 (minimum boundary)
     * Input: limit = 1
     * Expected Output: Validation passes
     * Path Coverage: Minimum boundary
     */
    it('TC014: should pass validation with limit = 1', async () => {
      const dto = plainToClass(PaginationDto, { limit: '1' });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.limit).toBe(1);
    });

    /**
     * Test Case 15: Kiểm tra limit = 100 (maximum boundary)
     * Input: limit = 100
     * Expected Output: Validation passes
     * Path Coverage: Maximum boundary
     */
    it('TC015: should pass validation with limit = 100', async () => {
      const dto = plainToClass(PaginationDto, { limit: '100' });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.limit).toBe(100);
    });

    /**
     * Test Case 16: Kiểm tra limit = 0 (below minimum)
     * Input: limit = 0
     * Expected Output: Validation fails - Min constraint
     * Path Coverage: Below minimum
     */
    it('TC016: should fail validation with limit = 0', async () => {
      const dto = plainToClass(PaginationDto, { limit: '0' });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('limit');
      expect(errors[0].constraints).toHaveProperty('min');
    });

    /**
     * Test Case 17: Kiểm tra limit = 101 (above maximum)
     * Input: limit = 101
     * Expected Output: Validation fails - Max constraint
     * Path Coverage: Above maximum
     */
    it('TC017: should fail validation with limit = 101', async () => {
      const dto = plainToClass(PaginationDto, { limit: '101' });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('limit');
      expect(errors[0].constraints).toHaveProperty('max');
    });

    /**
     * Test Case 18: Kiểm tra negative limit
     * Input: limit = -10
     * Expected Output: Validation fails
     * Path Coverage: Negative number
     */
    it('TC018: should fail validation with negative limit', async () => {
      const dto = plainToClass(PaginationDto, { limit: '-10' });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('limit');
    });

    /**
     * Test Case 19: Kiểm tra non-numeric limit
     * Input: limit = 'abc'
     * Expected Output: Validation fails - IsNumber
     * Path Coverage: Non-numeric input
     */
    it('TC019: should fail validation with non-numeric limit', async () => {
      const dto = plainToClass(PaginationDto, { limit: 'abc' });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('limit');
      expect(errors[0].constraints).toHaveProperty('isNumber');
    });

    /**
     * Test Case 20: Kiểm tra various valid limits
     * Input: Various limits between 1-100
     * Expected Output: All pass validation
     * Path Coverage: Valid range
     */
    it('TC020: should pass validation with various valid limits', async () => {
      const limits = [10, 20, 50, 75, 100];

      for (const limit of limits) {
        const dto = plainToClass(PaginationDto, { limit: limit.toString() });
        const errors = await validate(dto);

        expect(errors.length).toBe(0);
        expect(dto.limit).toBe(limit);
      }
    });

    /**
     * Test Case 21: Kiểm tra limit undefined (optional)
     * Input: No limit provided
     * Expected Output: Uses default value
     * Path Coverage: Optional field
     */
    it('TC021: should use default when limit is not provided', async () => {
      const dto = plainToClass(PaginationDto, {});

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.limit).toBe(APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT);
    });
  });

  describe('SortBy Field Validation', () => {
    /**
     * Test Case 22: Kiểm tra valid sortBy
     * Input: sortBy = 'createdAt'
     * Expected Output: Validation passes
     * Path Coverage: Valid sortBy
     */
    it('TC022: should pass validation with valid sortBy', async () => {
      const dto = plainToClass(PaginationDto, { sortBy: 'createdAt' });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortBy).toBe('createdAt');
    });

    /**
     * Test Case 23: Kiểm tra various sortBy fields
     * Input: Different field names
     * Expected Output: All pass validation
     * Path Coverage: Various field names
     */
    it('TC023: should pass validation with various sortBy fields', async () => {
      const sortFields = ['name', 'email', 'updatedAt', 'id', 'status'];

      for (const field of sortFields) {
        const dto = plainToClass(PaginationDto, { sortBy: field });
        const errors = await validate(dto);

        expect(errors.length).toBe(0);
        expect(dto.sortBy).toBe(field);
      }
    });

    /**
     * Test Case 24: Kiểm tra sortBy with special characters
     * Input: sortBy with dots/underscores
     * Expected Output: Validation passes (string accepted)
     * Path Coverage: Special characters
     */
    it('TC024: should pass validation with special characters in sortBy', async () => {
      const sortBy = 'user.profile.name';
      const dto = plainToClass(PaginationDto, { sortBy });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortBy).toBe(sortBy);
    });

    /**
     * Test Case 25: Kiểm tra sortBy empty string
     * Input: sortBy = ''
     * Expected Output: Validation passes (empty string is valid)
     * Path Coverage: Empty string
     */
    it('TC025: should pass validation with empty sortBy', async () => {
      const dto = plainToClass(PaginationDto, { sortBy: '' });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortBy).toBe('');
    });

    /**
     * Test Case 26: Kiểm tra sortBy non-string
     * Input: sortBy = 123
     * Expected Output: Validation fails - IsString
     * Path Coverage: Non-string input
     */
    it('TC026: should fail validation with non-string sortBy', async () => {
      const dto = plainToClass(PaginationDto, { sortBy: 123 });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('sortBy');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    /**
     * Test Case 27: Kiểm tra sortBy undefined (optional)
     * Input: No sortBy provided
     * Expected Output: Validation passes, undefined
     * Path Coverage: Optional field
     */
    it('TC027: should pass validation when sortBy is not provided', async () => {
      const dto = plainToClass(PaginationDto, {});

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortBy).toBeUndefined();
    });

    /**
     * Test Case 28: Kiểm tra sortBy with whitespace
     * Input: sortBy = '  field  '
     * Expected Output: Validation passes
     * Path Coverage: Whitespace
     */
    it('TC028: should pass validation with whitespace in sortBy', async () => {
      const dto = plainToClass(PaginationDto, { sortBy: '  field  ' });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortBy).toBe('  field  ');
    });
  });

  describe('SortOrder Field Validation', () => {
    /**
     * Test Case 29: Kiểm tra default sortOrder
     * Input: No sortOrder provided
     * Expected Output: Default 'desc'
     * Path Coverage: Default value
     */
    it('TC029: should use default sortOrder desc', async () => {
      const dto = plainToClass(PaginationDto, {});

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortOrder).toBe('desc');
    });

    /**
     * Test Case 30: Kiểm tra sortOrder = 'asc'
     * Input: sortOrder = 'asc'
     * Expected Output: Validation passes
     * Path Coverage: Valid 'asc'
     */
    it('TC030: should pass validation with sortOrder asc', async () => {
      const dto = plainToClass(PaginationDto, { sortOrder: 'asc' });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortOrder).toBe('asc');
    });

    /**
     * Test Case 31: Kiểm tra sortOrder = 'desc'
     * Input: sortOrder = 'desc'
     * Expected Output: Validation passes
     * Path Coverage: Valid 'desc'
     */
    it('TC031: should pass validation with sortOrder desc', async () => {
      const dto = plainToClass(PaginationDto, { sortOrder: 'desc' });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.sortOrder).toBe('desc');
    });

    /**
     * Test Case 32: Kiểm tra invalid sortOrder
     * Input: sortOrder = 'invalid'
     * Expected Output: Validation fails - IsEnum
     * Path Coverage: Invalid enum value
     */
    it('TC032: should fail validation with invalid sortOrder', async () => {
      const dto = plainToClass(PaginationDto, { sortOrder: 'invalid' });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('sortOrder');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    /**
     * Test Case 33: Kiểm tra uppercase sortOrder
     * Input: sortOrder = 'ASC'
     * Expected Output: Validation fails (case sensitive)
     * Path Coverage: Case sensitivity
     */
    it('TC033: should fail validation with uppercase sortOrder', async () => {
      const dto = plainToClass(PaginationDto, { sortOrder: 'ASC' });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('sortOrder');
    });

    /**
     * Test Case 34: Kiểm tra numeric sortOrder
     * Input: sortOrder = 1
     * Expected Output: Validation fails
     * Path Coverage: Non-string type
     */
    it('TC034: should fail validation with numeric sortOrder', async () => {
      const dto = plainToClass(PaginationDto, { sortOrder: 1 });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('sortOrder');
    });

    /**
     * Test Case 35: Kiểm tra empty string sortOrder
     * Input: sortOrder = ''
     * Expected Output: Validation fails
     * Path Coverage: Empty string
     */
    it('TC035: should fail validation with empty sortOrder', async () => {
      const dto = plainToClass(PaginationDto, { sortOrder: '' });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('sortOrder');
    });
  });

  describe('Search Field Validation', () => {
    /**
     * Test Case 36: Kiểm tra valid search string
     * Input: search = 'test query'
     * Expected Output: Validation passes
     * Path Coverage: Valid search
     */
    it('TC036: should pass validation with valid search', async () => {
      const dto = plainToClass(PaginationDto, { search: 'test query' });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.search).toBe('test query');
    });

    /**
     * Test Case 37: Kiểm tra search undefined (optional)
     * Input: No search provided
     * Expected Output: Validation passes, undefined
     * Path Coverage: Optional field
     */
    it('TC037: should pass validation when search is not provided', async () => {
      const dto = plainToClass(PaginationDto, {});

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.search).toBeUndefined();
    });

    /**
     * Test Case 38: Kiểm tra empty search string
     * Input: search = ''
     * Expected Output: Validation passes
     * Path Coverage: Empty string
     */
    it('TC038: should pass validation with empty search', async () => {
      const dto = plainToClass(PaginationDto, { search: '' });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.search).toBe('');
    });

    /**
     * Test Case 39: Kiểm tra search with special characters
     * Input: search = '!@#$%^&*()'
     * Expected Output: Validation passes
     * Path Coverage: Special characters
     */
    it('TC039: should pass validation with special characters in search', async () => {
      const search = '!@#$%^&*()';
      const dto = plainToClass(PaginationDto, { search });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.search).toBe(search);
    });

    /**
     * Test Case 40: Kiểm tra search with Unicode
     * Input: search = '用户 😀'
     * Expected Output: Validation passes
     * Path Coverage: Unicode
     */
    it('TC040: should pass validation with Unicode in search', async () => {
      const search = '用户 😀';
      const dto = plainToClass(PaginationDto, { search });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.search).toBe(search);
    });

    /**
     * Test Case 41: Kiểm tra very long search string
     * Input: Very long string
     * Expected Output: Validation passes (no max length)
     * Path Coverage: Long string
     */
    it('TC041: should pass validation with very long search', async () => {
      const search = 'a'.repeat(1000);
      const dto = plainToClass(PaginationDto, { search });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.search).toBe(search);
    });

    /**
     * Test Case 42: Kiểm tra non-string search
     * Input: search = 123
     * Expected Output: Validation fails - IsString
     * Path Coverage: Non-string input
     */
    it('TC042: should fail validation with non-string search', async () => {
      const dto = plainToClass(PaginationDto, { search: 123 });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('search');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    /**
     * Test Case 43: Kiểm tra search with whitespace only
     * Input: search = '   '
     * Expected Output: Validation passes
     * Path Coverage: Whitespace only
     */
    it('TC043: should pass validation with whitespace-only search', async () => {
      const dto = plainToClass(PaginationDto, { search: '   ' });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.search).toBe('   ');
    });
  });

  describe('Combined Field Validation', () => {
    /**
     * Test Case 44: Kiểm tra all fields valid
     * Input: All fields with valid values
     * Expected Output: Validation passes
     * Path Coverage: Complete valid object
     */
    it('TC044: should pass validation with all fields valid', async () => {
      const dto = plainToClass(PaginationDto, {
        page: '2',
        limit: '50',
        sortBy: 'createdAt',
        sortOrder: 'asc',
        search: 'test',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(2);
      expect(dto.limit).toBe(50);
      expect(dto.sortBy).toBe('createdAt');
      expect(dto.sortOrder).toBe('asc');
      expect(dto.search).toBe('test');
    });

    /**
     * Test Case 45: Kiểm tra multiple fields invalid
     * Input: Multiple invalid fields
     * Expected Output: Multiple validation errors
     * Path Coverage: Multiple errors
     */
    it('TC045: should fail validation with multiple invalid fields', async () => {
      const dto = plainToClass(PaginationDto, {
        page: '0',
        limit: '101',
        sortOrder: 'invalid',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const properties = errors.map((e) => e.property);
      expect(properties).toContain('page');
      expect(properties).toContain('limit');
      expect(properties).toContain('sortOrder');
    });

    /**
     * Test Case 46: Kiểm tra only required fields
     * Input: Only required fields (all optional, so none)
     * Expected Output: Uses defaults
     * Path Coverage: All optional
     */
    it('TC046: should pass validation with no fields (all optional)', async () => {
      const dto = plainToClass(PaginationDto, {});

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(APP_CONSTANTS.PAGINATION.DEFAULT_PAGE);
      expect(dto.limit).toBe(APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT);
      expect(dto.sortOrder).toBe('desc');
    });

    /**
     * Test Case 47: Kiểm tra partial fields
     * Input: Only some fields provided
     * Expected Output: Provided fields + defaults
     * Path Coverage: Partial input
     */
    it('TC047: should handle partial field input', async () => {
      const dto = plainToClass(PaginationDto, {
        page: '3',
        search: 'query',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(3);
      expect(dto.limit).toBe(APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT);
      expect(dto.search).toBe('query');
      expect(dto.sortOrder).toBe('desc');
    });
  });

  describe('Type Transformation', () => {
    /**
     * Test Case 48: Kiểm tra string to number transformation
     * Input: String numbers
     * Expected Output: Converted to numbers
     * Path Coverage: Type transformation
     */
    it('TC048: should transform string to number for page and limit', async () => {
      const dto = plainToClass(PaginationDto, {
        page: '5',
        limit: '50',
      });

      expect(typeof dto.page).toBe('number');
      expect(typeof dto.limit).toBe('number');
      expect(dto.page).toBe(5);
      expect(dto.limit).toBe(50);
    });

    /**
     * Test Case 49: Kiểm tra numeric input
     * Input: Already numbers
     * Expected Output: Kept as numbers
     * Path Coverage: Numeric input
     */
    it('TC049: should handle numeric input directly', async () => {
      const dto = new PaginationDto();
      dto.page = 10;
      dto.limit = 25;

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(10);
      expect(dto.limit).toBe(25);
    });

    /**
     * Test Case 50: Kiểm tra invalid number strings
     * Input: Non-numeric strings
     * Expected Output: Validation fails
     * Path Coverage: Invalid transformation
     */
    it('TC050: should fail validation with invalid number strings', async () => {
      const dto = plainToClass(PaginationDto, {
        page: 'abc',
        limit: 'xyz',
      });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Real-world Scenarios', () => {
    /**
     * Test Case 51: Kiểm tra typical user list request
     * Input: Common pagination params
     * Expected Output: Valid DTO
     * Path Coverage: User list use case
     */
    it('TC051: should handle typical user list pagination', async () => {
      const dto = plainToClass(PaginationDto, {
        page: '1',
        limit: '20',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    /**
     * Test Case 52: Kiểm tra search scenario
     * Input: Pagination with search
     * Expected Output: Valid DTO
     * Path Coverage: Search use case
     */
    it('TC052: should handle search pagination', async () => {
      const dto = plainToClass(PaginationDto, {
        page: '1',
        limit: '10',
        search: 'john doe',
        sortBy: 'relevance',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.search).toBe('john doe');
    });

    /**
     * Test Case 53: Kiểm tra from query string
     * Input: URL query params
     * Expected Output: Properly transformed
     * Path Coverage: Query string use case
     */
    it('TC053: should handle query string parameters', async () => {
      const queryParams = {
        page: '3',
        limit: '50',
        sortBy: 'name',
        sortOrder: 'asc',
        search: 'test',
      };

      const dto = plainToClass(PaginationDto, queryParams);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect(dto.page).toBe(3);
      expect(dto.limit).toBe(50);
    });

    /**
     * Test Case 54: Kiểm tra JSON serialization
     * Input: Valid DTO
     * Expected Output: Can be JSON stringified
     * Path Coverage: JSON serialization
     */
    it('TC054: should be JSON serializable', () => {
      const dto = plainToClass(PaginationDto, {
        page: '2',
        limit: '25',
        sortBy: 'createdAt',
        sortOrder: 'asc',
      });

      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json);

      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(25);
      expect(parsed.sortBy).toBe('createdAt');
      expect(parsed.sortOrder).toBe('asc');
    });

    /**
     * Test Case 55: Kiểm tra multiple instances
     * Input: Multiple DTOs
     * Expected Output: Independent instances
     * Path Coverage: Instance independence
     */
    it('TC055: should create independent instances', async () => {
      const dto1 = plainToClass(PaginationDto, { page: '1', limit: '10' });
      const dto2 = plainToClass(PaginationDto, { page: '2', limit: '20' });

      expect(dto1).not.toBe(dto2);
      expect(dto1.page).toBe(1);
      expect(dto2.page).toBe(2);
      expect(dto1.limit).toBe(10);
      expect(dto2.limit).toBe(20);
    });

    /**
     * Test Case 56: Kiểm tra with extra fields
     * Input: Extra unknown fields
     * Expected Output: Extra fields ignored
     * Path Coverage: Unknown fields
     */
    it('TC056: should ignore extra unknown fields', async () => {
      const dto = plainToClass(PaginationDto, {
        page: '1',
        limit: '10',
        unknownField: 'value',
      });

      const errors = await validate(dto);

      expect(errors.length).toBe(0);
      expect((dto as any).unknownField).toBeDefined();
    });

    /**
     * Test Case 57: Kiểm tra null values
     * Input: null for optional fields
     * Expected Output: null values accepted (optional fields)
     * Path Coverage: Null handling
     */
    it('TC057: should handle null values for optional fields', async () => {
      const dto = plainToClass(PaginationDto, {
        sortBy: null,
        search: null,
      });

      const errors = await validate(dto);

      // Optional fields accept null
      expect(errors.length).toBe(0);
      expect(dto.sortBy).toBeNull();
      expect(dto.search).toBeNull();
    });

    /**
     * Test Case 58: Kiểm tra offset calculation
     * Input: page and limit
     * Expected Output: Can calculate offset
     * Path Coverage: Offset calculation
     */
    it('TC058: should support offset calculation', async () => {
      const dto = plainToClass(PaginationDto, {
        page: '5',
        limit: '10',
      });

      const offset = ((dto.page ?? 1) - 1) * (dto.limit ?? 20);

      expect(offset).toBe(40); // (5-1) * 10
    });

    /**
     * Test Case 59: Kiểm tra sorting parameters
     * Input: Sort by multiple scenarios
     * Expected Output: Valid sorting config
     * Path Coverage: Sorting use case
     */
    it('TC059: should handle various sorting scenarios', async () => {
      const scenarios = [
        { sortBy: 'name', sortOrder: 'asc' },
        { sortBy: 'createdAt', sortOrder: 'desc' },
        { sortBy: 'updatedAt', sortOrder: 'asc' },
      ];

      for (const scenario of scenarios) {
        const dto = plainToClass(PaginationDto, scenario);
        const errors = await validate(dto);

        expect(errors.length).toBe(0);
        expect(dto.sortBy).toBe(scenario.sortBy);
        expect(dto.sortOrder).toBe(scenario.sortOrder);
      }
    });

    /**
     * Test Case 60: Kiểm tra default behavior consistency
     * Input: Empty object multiple times
     * Expected Output: Same defaults every time
     * Path Coverage: Default consistency
     */
    it('TC060: should consistently apply defaults', async () => {
      const dto1 = plainToClass(PaginationDto, {});
      const dto2 = plainToClass(PaginationDto, {});
      const dto3 = plainToClass(PaginationDto, {});

      expect(dto1.page).toBe(dto2.page);
      expect(dto2.page).toBe(dto3.page);
      expect(dto1.limit).toBe(dto2.limit);
      expect(dto2.limit).toBe(dto3.limit);
      expect(dto1.sortOrder).toBe(dto2.sortOrder);
      expect(dto2.sortOrder).toBe(dto3.sortOrder);
    });
  });
});
