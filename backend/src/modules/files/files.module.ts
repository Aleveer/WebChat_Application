import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { File, FileSchema } from './schemas/file.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        limits: {
          fileSize: configService.get<number>('file.maxSize', 50 * 1024 * 1024), // 50MB default
        },
        fileFilter: (req, file, callback) => {
          const allowedMimes =
            configService.get<string[]>('file.allowedMimes') || [];
          const allowAll =
            allowedMimes.length === 0 || allowedMimes.includes('*/*');

          if (allowAll) {
            return callback(null, true);
          }

          const isAllowed = allowedMimes.some((mime) => {
            if (mime.endsWith('/*')) {
              const prefix = mime.slice(0, -1);
              return file.mimetype.startsWith(prefix);
            }
            return mime === file.mimetype;
          });

          if (isAllowed) {
            return callback(null, true);
          }

          return callback(new Error('File type not allowed'), false);
        },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
