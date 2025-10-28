export class DateUtils {
  static now(): Date {
    return new Date(); // JavaScript Date is already in UTC internally
  }

  static nowUTC(): Date {
    const now = new Date();
    return new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds(),
        now.getUTCMilliseconds(),
      ),
    );
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

  static isExpired(date: Date): boolean {
    return date.getTime() < Date.now(); // Compare timestamps for accuracy
  }

  static formatDate(
    date: Date,
    format: string = 'YYYY-MM-DD',
    useUTC: boolean = true,
  ): string {
    const year = useUTC ? date.getUTCFullYear() : date.getFullYear();
    const month = String(
      (useUTC ? date.getUTCMonth() : date.getMonth()) + 1,
    ).padStart(2, '0');
    const day = String(useUTC ? date.getUTCDate() : date.getDate()).padStart(
      2,
      '0',
    );
    const hours = String(
      useUTC ? date.getUTCHours() : date.getHours(),
    ).padStart(2, '0');
    const minutes = String(
      useUTC ? date.getUTCMinutes() : date.getMinutes(),
    ).padStart(2, '0');
    const seconds = String(
      useUTC ? date.getUTCSeconds() : date.getSeconds(),
    ).padStart(2, '0');

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

  // Parse date string in specific timezone
  static parseInTimezone(dateString: string, timezone: string = 'UTC'): Date {
    // For production, use a library like 'luxon' or 'date-fns-tz'
    // This is a basic implementation
    return new Date(dateString + (timezone === 'UTC' ? 'Z' : ''));
  }

  // Convert date to ISO string (always UTC)
  static toISOString(date: Date): string {
    return date.toISOString();
  }
}
