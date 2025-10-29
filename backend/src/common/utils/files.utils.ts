import * as crypto from 'crypto';
import { z } from 'zod';

// Schema cho mimetype của các loại file
export const ImageMimeTypeSchema = z.enum([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

export const DocumentMimeTypeSchema = z.enum([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

export const VideoMimeTypeSchema = z.enum([
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
]);

export const AudioMimeTypeSchema = z.enum([
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
]);

// Schema cho file extension
export const ImageExtensionSchema = z.enum([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
]);

export const DocumentExtensionSchema = z.enum([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'txt',
]);

// Schema cho file metadata
export const FileMetadataSchema = z.object({
  filename: z.string().min(1, 'Tên file không được để trống'),
  mimetype: z.string().min(1, 'Mimetype không được để trống'),
  size: z.number().positive('Kích thước file phải lớn hơn 0'),
});

// Schema cho file upload với giới hạn kích thước
export const ImageUploadSchema = FileMetadataSchema.extend({
  mimetype: ImageMimeTypeSchema,
  size: z
    .number()
    .positive()
    .max(5 * 1024 * 1024, 'Kích thước ảnh không được vượt quá 5MB'),
});

export const DocumentUploadSchema = FileMetadataSchema.extend({
  mimetype: DocumentMimeTypeSchema,
  size: z
    .number()
    .positive()
    .max(10 * 1024 * 1024, 'Kích thước tài liệu không được vượt quá 10MB'),
});

export const VideoUploadSchema = FileMetadataSchema.extend({
  mimetype: VideoMimeTypeSchema,
  size: z
    .number()
    .positive()
    .max(50 * 1024 * 1024, 'Kích thước video không được vượt quá 50MB'),
});

// Types được infer từ schemas
export type ImageMimeType = z.infer<typeof ImageMimeTypeSchema>;
export type DocumentMimeType = z.infer<typeof DocumentMimeTypeSchema>;
export type VideoMimeType = z.infer<typeof VideoMimeTypeSchema>;
export type AudioMimeType = z.infer<typeof AudioMimeTypeSchema>;
export type FileMetadata = z.infer<typeof FileMetadataSchema>;
export type ImageUpload = z.infer<typeof ImageUploadSchema>;
export type DocumentUpload = z.infer<typeof DocumentUploadSchema>;
export type VideoUpload = z.infer<typeof VideoUploadSchema>;

/**
 * File Utilities với Zod validation
 */
export class FileUtils {
  /**
   * Lấy extension từ tên file
   * @param filename - Tên file
   * @returns Extension (lowercase)
   */
  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Kiểm tra mimetype có phải là ảnh không (sử dụng Zod)
   * @param mimetype - MIME type cần kiểm tra
   * @returns true nếu là ảnh hợp lệ
   */
  static isValidImageType(mimetype: string): boolean {
    return ImageMimeTypeSchema.safeParse(mimetype).success;
  }

  /**
   * Kiểm tra mimetype có phải là tài liệu không
   * @param mimetype - MIME type cần kiểm tra
   * @returns true nếu là tài liệu hợp lệ
   */
  static isValidDocumentType(mimetype: string): boolean {
    return DocumentMimeTypeSchema.safeParse(mimetype).success;
  }

  /**
   * Kiểm tra mimetype có phải là video không
   * @param mimetype - MIME type cần kiểm tra
   * @returns true nếu là video hợp lệ
   */
  static isValidVideoType(mimetype: string): boolean {
    return VideoMimeTypeSchema.safeParse(mimetype).success;
  }

  /**
   * Kiểm tra mimetype có phải là audio không
   * @param mimetype - MIME type cần kiểm tra
   * @returns true nếu là audio hợp lệ
   */
  static isValidAudioType(mimetype: string): boolean {
    return AudioMimeTypeSchema.safeParse(mimetype).success;
  }

  /**
   * Format file size thành string dễ đọc
   * @param bytes - Kích thước file (bytes)
   * @returns String đã format (ví dụ: "1.5 MB")
   */
  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Generate tên file ngẫu nhiên với timestamp
   * @param originalName - Tên file gốc
   * @returns Tên file mới (unique)
   */
  static generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = this.getFileExtension(originalName);
    return `${timestamp}_${randomString}.${extension}`;
  }

  /**
   * Validate file metadata
   * @param file - File metadata cần validate
   * @returns Result của validation
   */
  static validateFileMetadata(file: unknown) {
    return FileMetadataSchema.safeParse(file);
  }

  /**
   * Validate image upload
   * @param file - File cần validate
   * @returns Result của validation
   */
  static validateImageUpload(file: unknown) {
    return ImageUploadSchema.safeParse(file);
  }

  /**
   * Validate document upload
   * @param file - File cần validate
   * @returns Result của validation
   */
  static validateDocumentUpload(file: unknown) {
    return DocumentUploadSchema.safeParse(file);
  }

  /**
   * Validate video upload
   * @param file - File cần validate
   * @returns Result của validation
   */
  static validateVideoUpload(file: unknown) {
    return VideoUploadSchema.safeParse(file);
  }

  /**
   * Parse và validate file metadata (throw error nếu invalid)
   * @param file - File metadata
   * @returns Parsed và validated file metadata
   * @throws ZodError nếu validation fail
   */
  static parseFileMetadata(file: unknown): FileMetadata {
    return FileMetadataSchema.parse(file);
  }

  /**
   * Parse và validate image upload (throw error nếu invalid)
   * @param file - File upload
   * @returns Parsed và validated image upload
   * @throws ZodError nếu validation fail
   */
  static parseImageUpload(file: unknown): ImageUpload {
    return ImageUploadSchema.parse(file);
  }

  /**
   * Kiểm tra file size có vượt quá giới hạn không
   * @param bytes - Kích thước file (bytes)
   * @param maxMB - Giới hạn tối đa (MB)
   * @returns true nếu trong giới hạn
   */
  static isFileSizeValid(bytes: number, maxMB: number): boolean {
    const maxBytes = maxMB * 1024 * 1024;
    return bytes > 0 && bytes <= maxBytes;
  }

  /**
   * Tạo schema custom cho file upload với giới hạn riêng
   * @param allowedMimetypes - Mảng các mimetype cho phép
   * @param maxSizeMB - Kích thước tối đa (MB)
   * @returns Zod schema
   */
  static createFileUploadSchema(allowedMimetypes: string[], maxSizeMB: number) {
    return FileMetadataSchema.extend({
      mimetype: z.string().refine((mime) => allowedMimetypes.includes(mime), {
        message: `Chỉ chấp nhận các loại file: ${allowedMimetypes.join(', ')}`,
      }),
      size: z
        .number()
        .positive()
        .max(
          maxSizeMB * 1024 * 1024,
          `Kích thước file không được vượt quá ${maxSizeMB}MB`,
        ),
    });
  }

  /**
   * Sanitize tên file (loại bỏ ký tự đặc biệt)
   * @param filename - Tên file cần sanitize
   * @returns Tên file đã được làm sạch
   */
  static sanitizeFileName(filename: string): string {
    // Loại bỏ các ký tự đặc biệt, chỉ giữ chữ cái, số, dấu gạch ngang, gạch dưới và dấu chấm
    return filename.replace(/[^\w\s.-]/g, '').replace(/\s+/g, '_');
  }
}
