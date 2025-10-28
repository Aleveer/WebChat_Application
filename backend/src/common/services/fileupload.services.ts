import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import * as path from 'path';

// File Upload Service
@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  /**
   * Upload file with async operations
   * FIXED: Now uses async/await for file operations
   */
  async uploadFile(
    file: Express.Multer.File,
    destination: string = 'uploads',
  ): Promise<{ filename: string; path: string; size: number }> {
    try {
      const filename = this.generateFileName(file.originalname);
      const uploadPath = path.join(destination, filename);

      // Ensure directory exists (async)
      await fs.mkdir(destination, { recursive: true });

      // For now, file is already saved by multer
      // In production, you might want to move it or upload to cloud storage
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
   * FIXED: Added streaming for large files to prevent memory issues
   */
  async uploadFileWithStreaming(
    sourcePath: string,
    destination: string = 'uploads',
    originalName: string,
  ): Promise<{ filename: string; path: string; size: number }> {
    try {
      const filename = this.generateFileName(originalName);
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
   * FIXED: Now uses async/await
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
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
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${randomString}.${extension}`;
  }
}
