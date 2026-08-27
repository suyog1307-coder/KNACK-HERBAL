import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation,ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AppService } from './app.service';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  // Existing protected route (Any logged-in user)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('protected-test')
  @ApiOperation({ summary: 'A protected endpoint that needs a token' })
  getProtected(@Request() req) {
    return {
      message: 'You have successfully accessed a locked route!',
      user: req.user,
    };
  }

  // NEW: Admin only route!
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard) // JwtGuard goes first to get the user, RolesGuard goes second to check the role
  @Roles(Role.ADMIN)                   // Only Admins allowed!
  @Get('admin-dashboard')
  @ApiOperation({ summary: 'Admin only endpoint' })
  getAdminOnly(@Request() req) {
    return {
      message: 'Welcome to the Admin Dashboard!',
      adminDetails: req.user,
    };
  }
}