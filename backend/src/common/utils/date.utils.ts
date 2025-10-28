export class DateUtils {
  // FIXED: Always return UTC time to avoid timezone inconsistencies
  static now(): Date {
    return new Date(); // JavaScript Date is already in UTC internally
  }

  // FIXED: Ensure UTC calculations
  static nowUTC(): Date {
    const now = new Date();
    return new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
      now.getUTCMilliseconds()
    ));
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days); // Use UTC methods
    return result;
  }

  static addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setUTCHours(result.getUTCHours() + hours); // Use UTC methods
    return result;
  }

  static addMinutes(date: Date, minutes: number): Date {
    const result = new Date(date);
    result.setUTCMinutes(result.getUTCMinutes() + minutes); // Use UTC methods
    return result;
  }

  // FIXED: Timezone-aware comparison
  static isExpired(date: Date): boolean {
    return date.getTime() < Date.now(); // Compare timestamps for accuracy
  }

  // FIXED: Format in UTC by default, allow timezone specification
  static formatDate(
    date: Date, 
    format: string = 'YYYY-MM-DD',
    useUTC: boolean = true
  ): string {
    const year = useUTC ? date.getUTCFullYear() : date.getFullYear();
    const month = String((useUTC ? date.getUTCMonth() : date.getMonth()) + 1).padStart(2, '0');
    const day = String(useUTC ? date.getUTCDate() : date.getDate()).padStart(2, '0');
    const hours = String(useUTC ? date.getUTCHours() : date.getHours()).padStart(2, '0');
    const minutes = String(useUTC ? date.getUTCMinutes() : date.getMinutes()).padStart(2, '0');
    const seconds = String(useUTC ? date.getUTCSeconds() : date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  static getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000)
      return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  }

  // NEW: Parse date string in specific timezone
  static parseInTimezone(dateString: string, timezone: string = 'UTC'): Date {
    // For production, use a library like 'luxon' or 'date-fns-tz'
    // This is a basic implementation
    return new Date(dateString + (timezone === 'UTC' ? 'Z' : ''));
  }

  // NEW: Convert date to ISO string (always UTC)
  static toISOString(date: Date): string {
    return date.toISOString();
  }
}

// Array Utilities
export class ArrayUtils {
  static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  static shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static groupBy<T, K extends string | number | symbol>(
    array: T[],
    key: (item: T) => K,
  ): Record<K, T[]> {
    return array.reduce(
      (groups, item) => {
        const groupKey = key(item);
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
      },
      {} as Record<K, T[]>,
    );
  }

  static sortBy<T>(
    array: T[],
    key: keyof T,
    order: 'asc' | 'desc' = 'asc',
  ): T[] {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }
}
