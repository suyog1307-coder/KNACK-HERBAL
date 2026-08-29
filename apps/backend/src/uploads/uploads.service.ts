import {
  Injectable, BadRequestException, Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';

export interface UploadResult {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir: string;

  constructor(private readonly config: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, folder = 'general'): Promise<UploadResult> {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed: ${ALLOWED_MIME.join(', ')}`,
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `${folder}/${randomUUID()}${ext}`;
    const fullPath = path.join(this.uploadDir, filename);

    // Ensure subdirectory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(fullPath, file.buffer);

    const baseUrl = this.config.get('APP_URL') ?? 'http://localhost:3000';
    const url = `${baseUrl}/uploads/${filename}`;

    this.logger.log(`[Upload] Saved: ${filename} (${file.size} bytes)`);

    return { url, filename, mimetype: file.mimetype, size: file.size };
  }

  deleteFile(filename: string): void {
    const fullPath = path.join(this.uploadDir, filename);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      this.logger.log(`[Upload] Deleted: ${filename}`);
    }
  }
}
