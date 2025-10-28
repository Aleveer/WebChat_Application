import { APP_CONSTANTS } from '../constants/app.constants';

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
    const validPage = Math.max(
      APP_CONSTANTS.PAGINATION.DEFAULT_PAGE,
      page || APP_CONSTANTS.PAGINATION.DEFAULT_PAGE,
    );
    const validLimit = Math.min(
      APP_CONSTANTS.PAGINATION.MAX_LIMIT,
      Math.max(
        APP_CONSTANTS.PAGINATION.MIN_LIMIT,
        limit || APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
      ),
    );

    return {
      page: validPage,
      limit: validLimit,
    };
  }
}
