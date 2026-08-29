import {
  Controller, Post, UseGuards, UseInterceptors,
  UploadedFile, UploadedFiles, Query, ParseFilePipe,
  MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';

import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @ApiOperation({ summary: '[Admin] Upload a single image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @Post('image')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadImage(
    @UploadedFile(new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        new FileTypeValidator({ fileType: /image\/(jpeg|png|webp|gif)/ }),
      ],
    })) file: Express.Multer.File,
    @Query('folder') folder = 'products',
  ) {
    return this.uploadsService.uploadFile(file, folder);
  }

  @ApiOperation({ summary: '[Admin] Upload multiple images (max 10)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } } } })
  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 10, { storage: memoryStorage() }))
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder = 'products',
  ) {
    const results = await Promise.all(
      files.map((file) => this.uploadsService.uploadFile(file, folder)),
    );
    return { uploaded: results };
  }
}
