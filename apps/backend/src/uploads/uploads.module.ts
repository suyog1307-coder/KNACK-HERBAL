import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

/**
 * UploadsModule — handles file uploads for product images, avatars, etc.
 *
 * Storage backend: local disk in development, configurable for S3/Cloudinary in production.
 * Install multer: pnpm add multer @types/multer (already bundled with @nestjs/platform-express)
 *
 * For cloud storage, install: pnpm add @aws-sdk/client-s3 multer-s3
 * Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET in .env
 *
 * For Cloudinary: pnpm add cloudinary
 * Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env
 */
@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
