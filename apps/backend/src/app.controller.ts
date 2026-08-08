import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'A standard public endpoint' })
  getHello(): string {
    return this.appService.getHello();
  }

  // --- Add this block to test Swagger Auth ---
  @Get('protected-test')
  @ApiBearerAuth('JWT-auth') // This triggers the Swagger lock icon
  @ApiOperation({ summary: 'A protected endpoint that needs a token' })
  getProtectedTest(): string {
    return 'If you see a padlock next to this route in Swagger, it worked!';
  }
}