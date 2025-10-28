import { PaginationUtils } from './pagination.utils';

describe('PaginationUtils', () => {
  describe('calculatePagination', () => {
    // Test case 1: Trang đầu tiên với dữ liệu
    it('should calculate pagination for first page', () => {
      const result = PaginationUtils.calculatePagination(1, 10, 100);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true, // page (1) < totalPages (10)
        hasPrev: false, // page (1) > 1 = false
        offset: 0, // (1 - 1) * 10 = 0
      });
    });

    // Test case 2: Trang giữa
    it('should calculate pagination for middle page', () => {
      const result = PaginationUtils.calculatePagination(5, 10, 100);

      expect(result).toEqual({
        page: 5,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true, // page (5) < totalPages (10)
        hasPrev: true, // page (5) > 1
        offset: 40, // (5 - 1) * 10 = 40
      });
    });

    // Test case 3: Trang cuối cùng (branch: page < totalPages = false, page > 1 = true)
    it('should calculate pagination for last page', () => {
      const result = PaginationUtils.calculatePagination(10, 10, 100);

      expect(result).toEqual({
        page: 10,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: false, // page (10) < totalPages (10) = false
        hasPrev: true, // page (10) > 1
        offset: 90, // (10 - 1) * 10 = 90
      });
    });

    // Test case 4: Chỉ có 1 trang (branch: page < totalPages = false, page > 1 = false)
    it('should calculate pagination for single page', () => {
      const result = PaginationUtils.calculatePagination(1, 10, 5);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 5,
        totalPages: 1, // Math.ceil(5 / 10) = 1
        hasNext: false, // page (1) < totalPages (1) = false
        hasPrev: false, // page (1) > 1 = false
        offset: 0,
      });
    });

    // Test case 5: Không có dữ liệu (total = 0)
    it('should calculate pagination for zero total', () => {
      const result = PaginationUtils.calculatePagination(1, 10, 0);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0, // Math.ceil(0 / 10) = 0
        hasNext: false, // page (1) < totalPages (0) = false
        hasPrev: false,
        offset: 0,
      });
    });

    // Test case 6: Total không chia hết cho limit (test Math.ceil)
    it('should round up totalPages when total not divisible by limit', () => {
      const result = PaginationUtils.calculatePagination(1, 10, 95);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 95,
        totalPages: 10, // Math.ceil(95 / 10) = 10
        hasNext: true,
        hasPrev: false,
        offset: 0,
      });
    });

    // Test case 7: Trang 2 của 3 trang (hasNext = true, hasPrev = true)
    it('should have both next and prev for middle page', () => {
      const result = PaginationUtils.calculatePagination(2, 10, 25);

      expect(result.totalPages).toBe(3); // Math.ceil(25 / 10) = 3
      expect(result.hasNext).toBe(true); // 2 < 3
      expect(result.hasPrev).toBe(true); // 2 > 1
      expect(result.offset).toBe(10); // (2 - 1) * 10 = 10
    });

    // Test case 8: Limit = 1 (edge case)
    it('should calculate pagination with limit of 1', () => {
      const result = PaginationUtils.calculatePagination(5, 1, 10);

      expect(result).toEqual({
        page: 5,
        limit: 1,
        total: 10,
        totalPages: 10, // Math.ceil(10 / 1) = 10
        hasNext: true, // 5 < 10
        hasPrev: true, // 5 > 1
        offset: 4, // (5 - 1) * 1 = 4
      });
    });

    // Test case 9: Limit lớn hơn total
    it('should calculate pagination when limit exceeds total', () => {
      const result = PaginationUtils.calculatePagination(1, 100, 50);

      expect(result).toEqual({
        page: 1,
        limit: 100,
        total: 50,
        totalPages: 1, // Math.ceil(50 / 100) = 1
        hasNext: false,
        hasPrev: false,
        offset: 0,
      });
    });

    // Test case 10: Trang vượt quá totalPages
    it('should handle page number exceeding totalPages', () => {
      const result = PaginationUtils.calculatePagination(100, 10, 50);

      expect(result).toEqual({
        page: 100,
        limit: 10,
        total: 50,
        totalPages: 5, // Math.ceil(50 / 10) = 5
        hasNext: false, // 100 < 5 = false
        hasPrev: true, // 100 > 1
        offset: 990, // (100 - 1) * 10 = 990
      });
    });

    // Test case 11: Total = 1, Limit = 1
    it('should handle total and limit both equal to 1', () => {
      const result = PaginationUtils.calculatePagination(1, 1, 1);

      expect(result).toEqual({
        page: 1,
        limit: 1,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
        offset: 0,
      });
    });

    // Test case 12: Trang âm (edge case - invalid input)
    it('should handle negative page number', () => {
      const result = PaginationUtils.calculatePagination(-1, 10, 100);

      expect(result.page).toBe(-1);
      expect(result.hasPrev).toBe(false); // -1 > 1 = false
      expect(result.offset).toBe(-20); // (-1 - 1) * 10 = -20
    });

    // Test case 13: Limit âm (edge case - invalid input)
    it('should handle negative limit', () => {
      const result = PaginationUtils.calculatePagination(1, -10, 100);

      expect(result.limit).toBe(-10);
      expect(result.totalPages).toBe(-10); // Math.ceil(100 / -10) = -10
      expect(result.offset).toBe(-0); // (1 - 1) * -10 = -0 (negative zero)
    });

    // Test case 14: Total âm (edge case - invalid input)
    it('should handle negative total', () => {
      const result = PaginationUtils.calculatePagination(1, 10, -100);

      expect(result.total).toBe(-100);
      expect(result.totalPages).toBe(-10); // Math.ceil(-100 / 10) = -10
    });

    // Test case 15: Số thập phân cho page
    it('should handle decimal page number', () => {
      const result = PaginationUtils.calculatePagination(2.5, 10, 100);

      expect(result.page).toBe(2.5);
      expect(result.offset).toBe(15); // (2.5 - 1) * 10 = 15
    });

    // Test case 16: Số thập phân cho limit
    it('should handle decimal limit', () => {
      const result = PaginationUtils.calculatePagination(1, 10.5, 100);

      expect(result.limit).toBe(10.5);
      expect(result.totalPages).toBe(10); // Math.ceil(100 / 10.5) = 10
      expect(result.offset).toBe(0);
    });

    // Test case 17: Số rất lớn
    it('should handle very large numbers', () => {
      const result = PaginationUtils.calculatePagination(1, 100, 1000000);

      expect(result.totalPages).toBe(10000); // Math.ceil(1000000 / 100)
      expect(result.hasNext).toBe(true);
      expect(result.offset).toBe(0);
    });

    // Test case 18: Page = totalPages (boundary)
    it('should handle page equal to totalPages', () => {
      const result = PaginationUtils.calculatePagination(5, 20, 100);

      expect(result.page).toBe(5);
      expect(result.totalPages).toBe(5); // Math.ceil(100 / 20) = 5
      expect(result.hasNext).toBe(false); // 5 < 5 = false
      expect(result.hasPrev).toBe(true); // 5 > 1
    });

    // Test case 19: Page = 2, totalPages = 1 (invalid state)
    it('should handle page greater than totalPages', () => {
      const result = PaginationUtils.calculatePagination(2, 100, 50);

      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(1); // Math.ceil(50 / 100) = 1
      expect(result.hasNext).toBe(false); // 2 < 1 = false
      expect(result.hasPrev).toBe(true); // 2 > 1
    });

    // Test case 20: Offset calculation verification
    it('should calculate correct offset for various pages', () => {
      expect(PaginationUtils.calculatePagination(1, 10, 100).offset).toBe(0);
      expect(PaginationUtils.calculatePagination(2, 10, 100).offset).toBe(10);
      expect(PaginationUtils.calculatePagination(3, 10, 100).offset).toBe(20);
      expect(PaginationUtils.calculatePagination(10, 10, 100).offset).toBe(90);
    });
  });

  describe('validatePaginationParams', () => {
    // Test case 1: Valid page và limit
    it('should return valid page and limit for normal values', () => {
      const result = PaginationUtils.validatePaginationParams(5, 20);

      expect(result).toEqual({
        page: 5,
        limit: 20,
      });
    });

    // Test case 2: Undefined page và limit (branch: page || 1, limit || 20)
    it('should use defaults when page and limit are undefined', () => {
      const result = PaginationUtils.validatePaginationParams(
        undefined,
        undefined,
      );

      expect(result).toEqual({
        page: 1, // page || 1 = 1
        limit: 20, // limit || 20 = 20
      });
    });

    // Test case 3: Page = 0 (branch: Math.max(1, 0) = 1)
    it('should set page to 1 when page is 0', () => {
      const result = PaginationUtils.validatePaginationParams(0, 10);

      expect(result.page).toBe(1); // Math.max(1, 0) = 1
      expect(result.limit).toBe(10);
    });

    // Test case 4: Page âm (branch: Math.max(1, negative) = 1)
    it('should set page to 1 when page is negative', () => {
      const result = PaginationUtils.validatePaginationParams(-5, 10);

      expect(result.page).toBe(1); // Math.max(1, -5) = 1
      expect(result.limit).toBe(10);
    });

    // Test case 5: Limit = 0 (branch: Math.max(1, 0) = 1, nhưng 0 || 20 = 20)
    it('should use default limit when limit is 0', () => {
      const result = PaginationUtils.validatePaginationParams(1, 0);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20); // 0 || 20 = 20, vì 0 là falsy
    });

    // Test case 6: Limit âm (branch: Math.max(1, negative) = 1)
    it('should set limit to 1 when limit is negative', () => {
      const result = PaginationUtils.validatePaginationParams(1, -10);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(1); // Math.min(100, Math.max(1, -10)) = 1
    });

    // Test case 7: Limit > 100 (branch: Math.min(100, large) = 100)
    it('should cap limit to 100 when limit exceeds 100', () => {
      const result = PaginationUtils.validatePaginationParams(1, 200);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(100); // Math.min(100, Math.max(1, 200)) = 100
    });

    // Test case 8: Limit = 100 (boundary)
    it('should allow limit of 100', () => {
      const result = PaginationUtils.validatePaginationParams(1, 100);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(100); // Math.min(100, 100) = 100
    });

    // Test case 9: Limit = 101 (boundary)
    it('should cap limit to 100 when limit is 101', () => {
      const result = PaginationUtils.validatePaginationParams(1, 101);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(100); // Math.min(100, 101) = 100
    });

    // Test case 10: Limit = 1 (boundary)
    it('should allow limit of 1', () => {
      const result = PaginationUtils.validatePaginationParams(1, 1);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(1);
    });

    // Test case 11: Page = 1 (boundary)
    it('should allow page of 1', () => {
      const result = PaginationUtils.validatePaginationParams(1, 20);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    // Test case 12: Cả hai đều null
    it('should use defaults when both parameters are null', () => {
      const result = PaginationUtils.validatePaginationParams(
        null as any,
        null as any,
      );

      expect(result.page).toBe(1); // null || 1 = 1
      expect(result.limit).toBe(20); // null || 20 = 20
    });

    // Test case 13: Page hợp lệ, limit undefined
    it('should use default limit when limit is undefined', () => {
      const result = PaginationUtils.validatePaginationParams(5, undefined);

      expect(result.page).toBe(5);
      expect(result.limit).toBe(20); // undefined || 20 = 20
    });

    // Test case 14: Page undefined, limit hợp lệ
    it('should use default page when page is undefined', () => {
      const result = PaginationUtils.validatePaginationParams(undefined, 50);

      expect(result.page).toBe(1); // undefined || 1 = 1
      expect(result.limit).toBe(50);
    });

    // Test case 15: Số thập phân cho page
    it('should handle decimal page number', () => {
      const result = PaginationUtils.validatePaginationParams(5.7, 20);

      expect(result.page).toBe(5.7); // Math.max(1, 5.7) = 5.7
      expect(result.limit).toBe(20);
    });

    // Test case 16: Số thập phân cho limit
    it('should handle decimal limit', () => {
      const result = PaginationUtils.validatePaginationParams(1, 50.5);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(50.5); // Math.min(100, Math.max(1, 50.5)) = 50.5
    });

    // Test case 17: Số thập phân âm cho page
    it('should handle negative decimal page', () => {
      const result = PaginationUtils.validatePaginationParams(-2.5, 20);

      expect(result.page).toBe(1); // Math.max(1, -2.5) = 1
      expect(result.limit).toBe(20);
    });

    // Test case 18: Số thập phân > 100 cho limit
    it('should cap decimal limit exceeding 100', () => {
      const result = PaginationUtils.validatePaginationParams(1, 150.7);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(100); // Math.min(100, 150.7) = 100
    });

    // Test case 19: Số rất lớn cho page
    it('should allow very large page numbers', () => {
      const result = PaginationUtils.validatePaginationParams(999999, 20);

      expect(result.page).toBe(999999); // Math.max(1, 999999) = 999999
      expect(result.limit).toBe(20);
    });

    // Test case 20: Limit rất lớn
    it('should cap very large limit to 100', () => {
      const result = PaginationUtils.validatePaginationParams(1, 999999);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(100); // Math.min(100, 999999) = 100
    });

    // Test case 21: Page = NaN (NaN || 1 = 1)
    it('should use default page when page is NaN', () => {
      const result = PaginationUtils.validatePaginationParams(NaN, 20);

      // NaN || 1 = 1 (NaN là falsy)
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    // Test case 22: Limit = NaN (NaN || 20 = 20)
    it('should use default limit when limit is NaN', () => {
      const result = PaginationUtils.validatePaginationParams(1, NaN);

      // NaN || 20 = 20 (NaN là falsy)
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    // Test case 23: Boundary - limit = 99
    it('should allow limit of 99', () => {
      const result = PaginationUtils.validatePaginationParams(1, 99);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(99);
    });

    // Test case 24: Cả hai tham số đều không được truyền
    it('should use defaults when no parameters provided', () => {
      const result = PaginationUtils.validatePaginationParams();

      expect(result).toEqual({
        page: 1,
        limit: 20,
      });
    });
  });

  // Integration tests
  describe('Integration Tests', () => {
    it('should work together - validate then calculate', () => {
      // Validate params trước
      const validated = PaginationUtils.validatePaginationParams(0, 200);

      // Sử dụng validated params để calculate
      const result = PaginationUtils.calculatePagination(
        validated.page,
        validated.limit,
        250,
      );

      expect(validated.page).toBe(1); // 0 được validate thành 1
      expect(validated.limit).toBe(100); // 200 được validate thành 100
      expect(result.totalPages).toBe(3); // Math.ceil(250 / 100) = 3
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    it('should handle complete pagination workflow', () => {
      // User input: page = -5, limit = 500
      const validated = PaginationUtils.validatePaginationParams(-5, 500);

      expect(validated.page).toBe(1);
      expect(validated.limit).toBe(100);

      // Calculate với total = 1000
      const pagination = PaginationUtils.calculatePagination(
        validated.page,
        validated.limit,
        1000,
      );

      expect(pagination).toEqual({
        page: 1,
        limit: 100,
        total: 1000,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
        offset: 0,
      });
    });

    it('should validate and calculate for middle page', () => {
      const validated = PaginationUtils.validatePaginationParams(5, 25);
      const pagination = PaginationUtils.calculatePagination(
        validated.page,
        validated.limit,
        200,
      );

      expect(pagination.page).toBe(5);
      expect(pagination.totalPages).toBe(8); // Math.ceil(200 / 25)
      expect(pagination.hasNext).toBe(true); // 5 < 8
      expect(pagination.hasPrev).toBe(true); // 5 > 1
      expect(pagination.offset).toBe(100); // (5 - 1) * 25
    });

    it('should validate and calculate for last page', () => {
      const validated = PaginationUtils.validatePaginationParams(10, 50);
      const pagination = PaginationUtils.calculatePagination(
        validated.page,
        validated.limit,
        500,
      );

      expect(pagination.totalPages).toBe(10);
      expect(pagination.hasNext).toBe(false); // 10 < 10 = false
      expect(pagination.hasPrev).toBe(true);
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('should handle Infinity values', () => {
      const result = PaginationUtils.calculatePagination(1, Infinity, 100);

      expect(result.totalPages).toBe(0); // Math.ceil(100 / Infinity) = 0
      expect(result.offset).toBeNaN(); // (1 - 1) * Infinity = NaN
    });

    it('should handle very small positive numbers', () => {
      const result = PaginationUtils.calculatePagination(1, 0.1, 1);

      expect(result.totalPages).toBe(10); // Math.ceil(1 / 0.1) = 10
    });

    it('should validate very small positive limit', () => {
      const validated = PaginationUtils.validatePaginationParams(1, 0.5);

      expect(validated.limit).toBe(1); // Math.min(100, Math.max(1, 0.5)) = 1
    });

    it('should handle zero total in calculate', () => {
      const result = PaginationUtils.calculatePagination(1, 10, 0);

      expect(result.totalPages).toBe(0);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });

    it('should handle string-like numbers if passed (type coercion)', () => {
      // TypeScript sẽ catch lỗi này, nhưng runtime có thể xảy ra
      const result = PaginationUtils.calculatePagination(
        '5' as any,
        '10' as any,
        '100' as any,
      );

      // JavaScript type coercion
      expect(result.page).toBe('5');
      expect(result.offset).toBe(40); // ('5' - 1) * '10' = 40
    });
  });
});
