import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { FilesService } from './files.service';
import { GetFilesDto } from './dto/file.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ThrottleGuard } from '../../common/guards/throttle.guards';

@Controller('files')
@UseGuards(JwtAuthGuard, ThrottleGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req) {
    return this.filesService.uploadFile(file, req.user.sub);
  }

  @Get()
  async getUserFiles(@Request() req, @Query() getFilesDto: GetFilesDto) {
    return this.filesService.getUserFiles(req.user.sub, getFilesDto);
  }

  @Get('stats')
  async getFileStats(@Request() req) {
    return this.filesService.getFileStats(req.user.sub);
  }

  @Get(':id')
  async getFileInfo(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Get(':id/download')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const { stream, file } = await this.filesService.getFileStream(id);

    res.set({
      'Content-Type': file.mime_type,
      'Content-Disposition': `attachment; filename="${file.original_name}"`,
      'Content-Length': file.file_size.toString(),
    });

    stream.pipe(res);
  }

  @Get(':id/view')
  async viewFile(@Param('id') id: string, @Res() res: Response) {
    const { stream, file } = await this.filesService.getFileStream(id);

    res.set({
      'Content-Type': file.mime_type,
      'Content-Length': file.file_size.toString(),
    });

    stream.pipe(res);
  }

  @Put(':id/metadata')
  async updateFileMetadata(
    @Param('id') id: string,
    @Request() req,
    @Query() metadata: any,
  ) {
    return this.filesService.updateFileMetadata(id, req.user.sub, metadata);
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string, @Request() req) {
    await this.filesService.deleteFile(id, req.user.sub);
    return { message: 'File deleted successfully' };
  }
}
