import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  // SECURITY: Allowed upload directories (whitelist)
  private readonly ALLOWED_UPLOAD_DIRS = ['uploads', 'temp', 'public/uploads'];

  // SECURITY: Forbidden path patterns
  private readonly FORBIDDEN_PATTERNS = [
    /\.\./g, // Parent directory traversal
    /~/g, // Home directory
    /^[/\\]/, // Absolute paths
    /[/\\]\.{1,2}[/\\]/g, // Hidden files and parent dirs
  ];

  /**
   * Validate and sanitize file path to prevent path traversal
   */
  private validatePath(destination: string, filename?: string): void {
    // Remove any null bytes
    const cleanDest = destination.replace(/\0/g, '');
    const cleanName = filename?.replace(/\0/g, '') || '';

    // Check for forbidden patterns
    for (const pattern of this.FORBIDDEN_PATTERNS) {
      if (pattern.test(cleanDest) || pattern.test(cleanName)) {
        this.logger.error(
          `Path traversal attempt detected: ${destination}/${filename}`,
        );
        throw new BadRequestException('Invalid file path detected');
      }
    }

    // Normalize and resolve the path
    const normalizedPath = path.normalize(cleanDest);
    const resolvedPath = path.resolve(normalizedPath);

    // Check if destination is in allowed directories
    const isAllowed = this.ALLOWED_UPLOAD_DIRS.some((allowedDir) => {
      const allowedPath = path.resolve(allowedDir);
      return resolvedPath.startsWith(allowedPath);
    });

    if (!isAllowed) {
      this.logger.error(`Unauthorized upload directory: ${destination}`);
      throw new BadRequestException('Unauthorized upload directory');
    }

    // Additional check for absolute path attempt
    if (path.isAbsolute(cleanDest)) {
      this.logger.error(`Absolute path not allowed: ${destination}`);
      throw new BadRequestException('Absolute paths are not allowed');
    }
  }

  /**
   * SECURITY FIX: Sanitize filename to prevent directory traversal
   */
  private sanitizeFilename(filename: string): string {
    // Remove any path separators and parent directory references
    let sanitized = filename
      .replace(/\0/g, '') // Null bytes
      .replace(/\.\./g, '') // Parent directory
      .replace(/[/\\]/g, '') // Path separators
      .replace(/^\.+/, ''); // Leading dots

    // Remove any non-alphanumeric characters except dots, dashes, and underscores
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Ensure filename is not empty after sanitization
    if (!sanitized || sanitized.length === 0) {
      sanitized = `file_${Date.now()}`;
    }

    // Limit filename length
    const maxLength = 255;
    if (sanitized.length > maxLength) {
      const ext = path.extname(sanitized);
      const name = path.basename(sanitized, ext);
      sanitized = name.substring(0, maxLength - ext.length) + ext;
    }

    return sanitized;
  }

  /**
   * Upload file with async operations
   */
  async uploadFile(
    file: Express.Multer.File,
    destination: string = 'uploads',
  ): Promise<{ filename: string; path: string; size: number }> {
    try {
      // SECURITY: Validate destination path
      this.validatePath(destination);

      // SECURITY: Sanitize original filename
      const sanitizedOriginalName = this.sanitizeFilename(file.originalname);
      const filename = this.generateFileName(sanitizedOriginalName);

      // SECURITY: Validate final path
      this.validatePath(destination, filename);

      const uploadPath = path.join(destination, filename);

      // Ensure directory exists (async)
      await fs.mkdir(destination, { recursive: true });

      //TODO: Move file from temp to destination (async)
      // For now, file is already saved by multer
      // In production, move it or upload to cloud storage
      this.logger.log(`File uploaded: ${filename} (${file.size} bytes)`);
      
      return {
        filename,
        path: uploadPath,
        size: file.size,
      };
    } catch (error) {
      this.logger.error('File upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload large file with streaming support
   */
  async uploadFileWithStreaming(
    sourcePath: string,
    destination: string = 'uploads',
    originalName: string,
  ): Promise<{ filename: string; path: string; size: number }> {
    try {
      // SECURITY: Validate paths
      this.validatePath(destination);
      this.validatePath(path.dirname(sourcePath));

      // SECURITY: Sanitize filename
      const sanitizedOriginalName = this.sanitizeFilename(originalName);
      const filename = this.generateFileName(sanitizedOriginalName);

      // SECURITY: Validate final path
      this.validatePath(destination, filename);

      const uploadPath = path.join(destination, filename);

      // Ensure directory exists (async)
      await fs.mkdir(destination, { recursive: true });

      // Stream file to prevent loading entire file into memory
      const readStream = createReadStream(sourcePath);
      const writeStream = createWriteStream(uploadPath);

      // Use pipeline for proper error handling and backpressure
      await pipeline(readStream, writeStream);

      // Get file stats (async)
      const stats = await fs.stat(uploadPath);

      this.logger.log(
        `File streamed successfully: ${filename} (${stats.size} bytes)`,
      );

      return {
        filename,
        path: uploadPath,
        size: stats.size,
      };
    } catch (error) {
      this.logger.error('File streaming failed:', error);
      throw error;
    }
  }

  /**
   * Delete file with async operations
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      // SECURITY: Validate file path before deletion
      const dirPath = path.dirname(filePath);
      const fileName = path.basename(filePath);
      this.validatePath(dirPath, fileName);

      // Check if file exists first (async)
      await fs.access(filePath);

      // Delete file (async)
      await fs.unlink(filePath);

      this.logger.log(`File deleted: ${filePath}`);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.warn(`File not found: ${filePath}`);
        return false;
      }
      this.logger.error(`Failed to delete file ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Get file info with async operations
   */
  async getFileInfo(filePath: string): Promise<{
    size: number;
    created: Date;
    modified: Date;
  } | null> {
    try {
      const stats = await fs.stat(filePath);

      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch (error) {
      this.logger.error(`Failed to get file info ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Check if file exists (async)
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private generateFileName(originalName: string): string {
    // SECURITY: Sanitize the original filename
    const sanitized = this.sanitizeFilename(originalName);

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(sanitized);
    const baseName = path.basename(sanitized, extension);

    // Create safe filename with timestamp and random string
    return `${baseName}_${timestamp}_${randomString}${extension}`;
  }
}
