export class PaginationUtils {
  static calculatePagination(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
      offset: (page - 1) * limit,
    };
  }

  static validatePaginationParams(page?: number, limit?: number) {
    const validPage = Math.max(1, page || 1);
    const validLimit = Math.min(100, Math.max(1, limit || 20));

    return {
      page: validPage,
      limit: validLimit,
    };
  }
}
