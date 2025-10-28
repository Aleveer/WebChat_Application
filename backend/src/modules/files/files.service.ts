import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { File, FileDocument, FileType } from './schemas/file.schema';
import { CreateFileDto, GetFilesDto } from './dto/file.dto';
import { UsersService } from '../users/users.service';
import { Metadata } from '../../common/types';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  constructor(
    @InjectModel(File.name) private fileModel: Model<FileDocument>,
    private usersService: UsersService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    metadata?: Metadata,
  ): Promise<File> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const uploadPath = path.join(process.cwd(), 'uploads', fileName);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Save file to disk
    fs.writeFileSync(uploadPath, file.buffer);

    // Determine file type
    const fileType = this.getFileType(file.mimetype);

    // Create file record
    const fileData: CreateFileDto = {
      original_name: file.originalname,
      file_name: fileName,
      file_path: uploadPath,
      file_url: `/files/${fileName}`,
      file_size: file.size,
      mime_type: file.mimetype,
      file_type: fileType,
      uploaded_by: userId,
      metadata: metadata || {},
    };

    const fileRecord = new this.fileModel(fileData);
    return fileRecord.save();
  }

  async findOne(id: string): Promise<File> {
    const file = await this.fileModel
      .findById(id)
      .populate('uploaded_by', 'full_name username');
    if (!file) {
      throw new NotFoundException('File not found');
    }
    return file;
  }

  async getUserFiles(
    userId: string,
    getFilesDto: GetFilesDto,
  ): Promise<{ files: File[]; total: number }> {
    const { page = 1, limit = 20, file_type, search } = getFilesDto;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      uploaded_by: new Types.ObjectId(userId),
    };

    if (file_type) {
      filter.file_type = file_type;
    }

    if (search) {
      filter.original_name = { $regex: search, $options: 'i' };
    }

    const [files, total] = await Promise.all([
      this.fileModel
        .find(filter)
        .populate('uploaded_by', 'full_name username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.fileModel.countDocuments(filter),
    ]);

    return { files, total };
  }

  async deleteFile(id: string, userId: string): Promise<void> {
    const file = await this.fileModel.findOne({ _id: id, uploaded_by: userId });
    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Delete physical file with error handling
    if (fs.existsSync(file.file_path)) {
      try {
        fs.unlinkSync(file.file_path);
      } catch (error) {
        // Log error but continue with database deletion
        console.error(
          `Failed to delete physical file: ${file.file_path}`,
          error,
        );
        // Note: You may want to use a proper logger here
        // this.logger.error(`Failed to delete physical file: ${file.file_path}`, error);
      }
    }

    // Delete database record
    await this.fileModel.deleteOne({ _id: id });
  }

  async getFileStream(
    id: string,
  ): Promise<{ stream: fs.ReadStream; file: File }> {
    const file = await this.findOne(id);

    if (!fs.existsSync(file.file_path)) {
      throw new NotFoundException('File not found on disk');
    }

    const stream = fs.createReadStream(file.file_path);
    return { stream, file };
  }

  async updateFileMetadata(
    id: string,
    userId: string,
    metadata: Metadata,
  ): Promise<File> {
    const file = await this.fileModel.findOneAndUpdate(
      { _id: id, uploaded_by: userId },
      { metadata },
      { new: true },
    );

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  private getFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) {
      return FileType.IMAGE;
    } else if (mimeType.startsWith('video/')) {
      return FileType.VIDEO;
    } else if (mimeType.startsWith('audio/')) {
      return FileType.AUDIO;
    } else if (mimeType === 'application/pdf') {
      return FileType.DOCUMENT;
    } else {
      return FileType.OTHER;
    }
  }

  async getFileStats(userId: string): Promise<{
    total_files: number;
    total_size: number;
    by_type: Array<{ _id: string; count: number; totalSize: number }>;
  }> {
    const stats = await this.fileModel.aggregate([
      { $match: { uploaded_by: new Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$file_type',
          count: { $sum: 1 },
          totalSize: { $sum: '$file_size' },
        },
      },
    ]);

    const totalFiles = await this.fileModel.countDocuments({
      uploaded_by: userId,
    });
    const totalSize = await this.fileModel.aggregate([
      { $match: { uploaded_by: new Types.ObjectId(userId) } },
      { $group: { _id: null, totalSize: { $sum: '$file_size' } } },
    ]);

    return {
      total_files: totalFiles,
      total_size: totalSize[0]?.totalSize || 0,
      by_type: stats,
    };
  }
}
