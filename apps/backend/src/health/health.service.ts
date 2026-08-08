import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private configService: ConfigService) {}

  checkHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Number(process.uptime().toFixed(2)),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
    };
  }
}