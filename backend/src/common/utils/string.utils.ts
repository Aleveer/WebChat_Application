import * as crypto from 'crypto';
import _ from 'lodash';

export class StringUtils {
  /**
   * Generate random string (hex)
   * @param length - Độ dài mong muốn
   * @returns Random hex string
   */
  static generateRandomString(length: number): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate UUID v4
   * @returns UUID string
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Mask email để bảo mật
   * @param email - Email cần mask
   * @returns Masked email
   * Ví dụ: 'user@example.com' => 'u**r@example.com'
   */
  static maskEmail(email: string): string {
    const [username, domain] = _.split(email, '@');
    if (!username || !domain) return email;

    const maskedUsername =
      _.first(username) + _.repeat('*', username.length - 2) + _.last(username);
    return `${maskedUsername}@${domain}`;
  }

  /**
   * Mask số điện thoại để bảo mật
   * @param phoneNumber - Số điện thoại cần mask
   * @returns Masked phone number
   * Ví dụ: '0123456789' => '012****89'
   */
  static maskPhoneNumber(phoneNumber: string): string {
    if (phoneNumber.length <= 4) return phoneNumber;
    const start = _.take(phoneNumber, 3).join('');
    const end = _.takeRight(phoneNumber, 2).join('');
    const middle = _.repeat('*', phoneNumber.length - 5);
    return `${start}${middle}${end}`;
  }

  /**
   * Chuyển string sang PascalCase
   * @param str - Chuỗi cần chuyển đổi
   * @returns PascalCase string
   * Ví dụ: 'hello world' => 'HelloWorld'
   */
  static pascalCase(str: string): string {
    return _.upperFirst(_.camelCase(str));
  }

  /**
   * Replace tất cả occurrences
   * @param str - Chuỗi gốc
   * @param pattern - Pattern cần thay thế (string hoặc regex)
   * @param replacement - Chuỗi thay thế
   * @returns String đã thay thế
   */
  static replaceAll(
    str: string,
    pattern: string | RegExp,
    replacement: string,
  ): string {
    return _.replace(str, new RegExp(pattern, 'g'), replacement);
  }

  /**
   * Chuyển đổi string thành template và replace variables
   * @param template - Template string với placeholders
   * @param data - Object chứa data để replace
   * @returns String đã được interpolate
   * Ví dụ: template('Hello ${name}', { name: 'John' }) => 'Hello John'
   */
  static template(template: string, data: Record<string, any>): string {
    const compiled = _.template(template);
    return compiled(data);
  }

  /**
   * Tạo initials từ tên
   * @param name - Tên đầy đủ
   * @returns Initials (tối đa 2 ký tự)
   * Ví dụ: 'John Doe' => 'JD'
   */
  static getInitials(name: string): string {
    const words = _.words(name);
    const initials = _.take(words, 2).map((word) => _.upperCase(word[0]));
    return _.join(initials, '');
  }

  /**
   * Reverse string
   * @param str - Chuỗi cần đảo ngược
   * @returns Reversed string
   */
  static reverse(str: string): string {
    return _.reverse(str.split('')).join('');
  }

  /**
   * Check xem string có rỗng không (sau khi trim)
   * @param str - Chuỗi cần kiểm tra
   * @returns true nếu rỗng
   */
  static isEmpty(str: string): boolean {
    return _.isEmpty(_.trim(str));
  }

  /**
   * Slugify có hỗ trợ tiếng Việt
   * @param str - Chuỗi cần chuyển đổi
   * @returns Slug string
   * Ví dụ: 'Xin chào Việt Nam' => 'xin-chao-viet-nam'
   */
  static slugifyVietnamese(str: string): string {
    return _.kebabCase(_.deburr(str));
  }

  /**
   * Truncate string với options tùy chỉnh
   * @param str - Chuỗi cần cắt
   * @param length - Độ dài tối đa
   * @param suffix - Suffix thêm vào (mặc định: '...')
   * @returns Chuỗi đã được cắt ngắn
   */
  static truncate(str: string, length: number, suffix: string = '...'): string {
    return _.truncate(str, {
      length: length,
      omission: suffix,
    });
  }
}
