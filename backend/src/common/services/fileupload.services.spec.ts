import { FileUploadService } from './fileupload.services';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('FileUploadService', () => {
  let service: FileUploadService;
  let loggerLogMock: jest.SpyInstance;
  let loggerErrorMock: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileUploadService],
    }).compile();

    service = module.get<FileUploadService>(FileUploadService);
    loggerLogMock = jest
      .spyOn((service as any)['logger'] as Logger, 'log')
      .mockImplementation();
    loggerErrorMock = jest
      .spyOn((service as any)['logger'] as Logger, 'error')
      .mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should upload file with default destination', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test-document.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadFile(mockFile);

      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('size');
      expect(result.size).toBe(1024);
      expect(result.path).toContain('uploads/');
      expect(result.path).toContain('.pdf');
      expect(loggerLogMock).toHaveBeenCalledWith(
        expect.stringContaining('File uploaded:'),
      );
    });

    it('should upload file with custom destination', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'avatar',
        originalname: 'profile-pic.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 2048,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const customDestination = 'avatars/users';
      const result = await service.uploadFile(mockFile, customDestination);

      expect(result.path).toContain('avatars/users/');
      expect(result.path).toContain('.jpg');
      expect(result.size).toBe(2048);
    });

    it('should generate unique filename with timestamp', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'document.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 512,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result1 = await service.uploadFile(mockFile);
      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));
      const result2 = await service.uploadFile(mockFile);

      expect(result1.filename).not.toBe(result2.filename);
      expect(result1.filename).toMatch(/^\d+_[a-z0-9]+\.txt$/);
      expect(result2.filename).toMatch(/^\d+_[a-z0-9]+\.txt$/);
    });

    it('should handle file with multiple dots in name', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'my.test.file.name.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1500,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadFile(mockFile);

      expect(result.filename).toContain('.pdf');
      expect(result.path).toContain('.pdf');
    });

    it('should handle file without extension', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'README',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 256,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadFile(mockFile);

      expect(result.filename).toContain('.README');
      expect(result.size).toBe(256);
    });

    it('should handle file with uppercase extension', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'image.PNG',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 3072,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadFile(mockFile);

      expect(result.filename).toContain('.PNG');
      expect(result.path).toContain('.PNG');
    });

    it('should handle zero-size file', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'empty.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 0,
        buffer: Buffer.from(''),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadFile(mockFile);

      expect(result.size).toBe(0);
      expect(result.filename).toContain('.txt');
    });

    it('should handle large file size', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'large-video.mp4',
        encoding: '7bit',
        mimetype: 'video/mp4',
        size: 104857600, // 100MB
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadFile(mockFile);

      expect(result.size).toBe(104857600);
      expect(result.filename).toContain('.mp4');
    });

    it('should handle file with special characters in name', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'file@#$%^&()_+-=.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 2048,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadFile(mockFile);

      expect(result.filename).toContain('.jpg');
      expect(result.size).toBe(2048);
    });

    it('should handle file with unicode characters', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: '文档.docx',
        encoding: '7bit',
        mimetype:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 4096,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadFile(mockFile);

      expect(result.filename).toContain('.docx');
      expect(result.size).toBe(4096);
    });

    it('should log successful file upload with filename', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadFile(mockFile);

      expect(loggerLogMock).toHaveBeenCalledWith(
        `File uploaded: ${result.filename}`,
      );
    });

    it('should throw error when upload fails', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      // Mock generateFileName to throw error
      jest
        .spyOn(service as any, 'generateFileName')
        .mockImplementationOnce(() => {
          throw new Error('File generation failed');
        });

      await expect(service.uploadFile(mockFile)).rejects.toThrow(
        'File generation failed',
      );
      expect(loggerErrorMock).toHaveBeenCalledWith(
        'File upload failed:',
        expect.any(Error),
      );
    });

    it('should handle destination with trailing slash', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadFile(mockFile, 'uploads/');

      expect(result.path).toContain('uploads//');
    });

    it('should handle nested destination path', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'document.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadFile(
        mockFile,
        'uploads/documents/pdf',
      );

      expect(result.path).toContain('uploads/documents/pdf/');
      expect(result.path).toContain('.pdf');
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully and return true', async () => {
      const filePath = 'uploads/test-file.pdf';

      const result = await service.deleteFile(filePath);

      expect(result).toBe(true);
      expect(loggerLogMock).toHaveBeenCalledWith(`File deleted: ${filePath}`);
    });

    it('should delete file with nested path', async () => {
      const filePath = 'uploads/documents/2024/test.pdf';

      const result = await service.deleteFile(filePath);

      expect(result).toBe(true);
      expect(loggerLogMock).toHaveBeenCalledWith(`File deleted: ${filePath}`);
    });

    it('should handle file path with special characters', async () => {
      const filePath = 'uploads/file@#$%_123.jpg';

      const result = await service.deleteFile(filePath);

      expect(result).toBe(true);
      expect(loggerLogMock).toHaveBeenCalledWith(`File deleted: ${filePath}`);
    });

    it('should handle absolute file path', async () => {
      const filePath = '/var/www/uploads/file.pdf';

      const result = await service.deleteFile(filePath);

      expect(result).toBe(true);
    });

    it('should handle Windows-style file path', async () => {
      const filePath = 'C:\\uploads\\file.pdf';

      const result = await service.deleteFile(filePath);

      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      const filePath = 'uploads/error-file.pdf';

      // Mock logger.log to throw error
      loggerLogMock.mockImplementationOnce(() => {
        throw new Error('Deletion failed');
      });

      const result = await service.deleteFile(filePath);

      expect(result).toBe(false);
      expect(loggerErrorMock).toHaveBeenCalledWith(
        `Failed to delete file ${filePath}:`,
        expect.any(Error),
      );
    });

    it('should handle empty file path', async () => {
      const filePath = '';

      const result = await service.deleteFile(filePath);

      expect(result).toBe(true);
      expect(loggerLogMock).toHaveBeenCalledWith('File deleted: ');
    });

    it('should handle very long file path', async () => {
      const longPath = 'uploads/' + 'a'.repeat(500) + '/file.pdf';

      const result = await service.deleteFile(longPath);

      expect(result).toBe(true);
      expect(loggerLogMock).toHaveBeenCalledWith(`File deleted: ${longPath}`);
    });

    it('should delete multiple files sequentially', async () => {
      const filePaths = [
        'uploads/file1.pdf',
        'uploads/file2.jpg',
        'uploads/file3.txt',
      ];

      for (const path of filePaths) {
        const result = await service.deleteFile(path);
        expect(result).toBe(true);
      }

      expect(loggerLogMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('generateFileName (private method)', () => {
    it('should generate filename with timestamp and random string', () => {
      const originalName = 'test.pdf';
      const filename = (service as any).generateFileName(originalName);

      expect(filename).toMatch(/^\d+_[a-z0-9]+\.pdf$/);
    });

    it('should generate different filenames for same original name', () => {
      const originalName = 'document.txt';

      const filename1 = (service as any).generateFileName(originalName);
      const filename2 = (service as any).generateFileName(originalName);

      expect(filename1).not.toBe(filename2);
    });

    it('should preserve file extension', () => {
      const extensions = ['pdf', 'jpg', 'png', 'txt', 'docx', 'xlsx'];

      for (const ext of extensions) {
        const filename = (service as any).generateFileName(`test.${ext}`);
        expect(filename).toContain(`.${ext}`);
      }
    });

    it('should handle file with multiple extensions correctly', () => {
      const originalName = 'archive.tar.gz';
      const filename = (service as any).generateFileName(originalName);

      // Should take the last extension
      expect(filename).toContain('.gz');
    });

    it('should handle filename without extension', () => {
      const originalName = 'README';
      const filename = (service as any).generateFileName(originalName);

      expect(filename).toContain('.README');
    });

    it('should handle empty string original name', () => {
      const originalName = '';
      const filename = (service as any).generateFileName(originalName);

      expect(filename).toMatch(/^\d+_[a-z0-9]+\.$/);
    });

    it('should generate filename with timestamp close to current time', () => {
      const beforeTimestamp = Date.now();
      const filename = (service as any).generateFileName('test.pdf');
      const afterTimestamp = Date.now();

      const timestampPart = filename.split('_')[0];
      const timestamp = parseInt(timestampPart, 10);

      expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(timestamp).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should generate random string with correct length', () => {
      const filename = (service as any).generateFileName('test.pdf');
      const parts = filename.split('_');
      const randomPart = parts[1].split('.')[0];

      // Random string should be up to 13 characters (from substring(2, 15))
      expect(randomPart.length).toBeGreaterThan(0);
      expect(randomPart.length).toBeLessThanOrEqual(13);
    });

    it('should generate alphanumeric random string', () => {
      const filename = (service as any).generateFileName('test.pdf');
      const parts = filename.split('_');
      const randomPart = parts[1].split('.')[0];

      expect(randomPart).toMatch(/^[a-z0-9]+$/);
    });

    it('should handle single character filename', () => {
      const originalName = 'a';
      const filename = (service as any).generateFileName(originalName);

      expect(filename).toContain('.a');
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle upload and delete flow', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const uploadResult = await service.uploadFile(mockFile);
      expect(uploadResult).toBeDefined();

      const deleteResult = await service.deleteFile(uploadResult.path);
      expect(deleteResult).toBe(true);

      expect(loggerLogMock).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple concurrent uploads', async () => {
      const mockFiles: Express.Multer.File[] = Array(5)
        .fill(null)
        .map((_, index) => ({
          fieldname: 'file',
          originalname: `test${index}.pdf`,
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: 1024 * (index + 1),
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        }));

      const uploadPromises = mockFiles.map((file) => service.uploadFile(file));
      const results = await Promise.all(uploadPromises);

      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.size).toBe(1024 * (index + 1));
        expect(result.filename).toBeDefined();
      });
    });

    it('should maintain correct file size through upload process', async () => {
      const sizes = [0, 1, 1024, 1048576, 10485760]; // 0B, 1B, 1KB, 1MB, 10MB

      for (const size of sizes) {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: 'test.bin',
          encoding: '7bit',
          mimetype: 'application/octet-stream',
          size: size,
          buffer: Buffer.alloc(size),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        const result = await service.uploadFile(mockFile);
        expect(result.size).toBe(size);
      }
    });

    it('should handle different file types correctly', async () => {
      const fileTypes = [
        { name: 'image.jpg', mime: 'image/jpeg' },
        { name: 'video.mp4', mime: 'video/mp4' },
        { name: 'audio.mp3', mime: 'audio/mpeg' },
        { name: 'document.pdf', mime: 'application/pdf' },
        { name: 'archive.zip', mime: 'application/zip' },
      ];

      for (const fileType of fileTypes) {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: fileType.name,
          encoding: '7bit',
          mimetype: fileType.mime,
          size: 1024,
          buffer: Buffer.from('test'),
          stream: null as any,
          destination: '',
          filename: '',
          path: '',
        };

        const result = await service.uploadFile(mockFile);
        const extension = fileType.name.split('.').pop();
        expect(result.filename).toContain(`.${extension}`);
      }
    });

    it('should verify all success paths log appropriately', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      await service.uploadFile(mockFile);
      await service.deleteFile('test/path.pdf');

      expect(loggerLogMock).toHaveBeenCalledTimes(2);
      expect(loggerLogMock).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('File uploaded:'),
      );
      expect(loggerLogMock).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('File deleted:'),
      );
    });

    it('should verify all error paths log appropriately', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test'),
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      // Force upload error
      jest
        .spyOn(service as any, 'generateFileName')
        .mockImplementationOnce(() => {
          throw new Error('Upload error');
        });

      try {
        await service.uploadFile(mockFile);
      } catch (error) {
        // Expected error
      }

      // Force delete error
      loggerLogMock.mockImplementationOnce(() => {
        throw new Error('Delete error');
      });

      await service.deleteFile('test.pdf');

      expect(loggerErrorMock).toHaveBeenCalledTimes(2);
    });
  });
});
