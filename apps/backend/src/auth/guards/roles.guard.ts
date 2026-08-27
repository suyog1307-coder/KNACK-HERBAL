import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Look for the @Roles() metadata on the route
    const requiredRoles = this.reflector.getAllAndOverride(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // 2. If no roles are required, let anyone (who is logged in) pass
    if (!requiredRoles) {
      return true; 
    }
    
    // 3. Get the user attached by the JwtAuthGuard
    const { user } = context.switchToHttp().getRequest();
    
    // 4. Check if the user's role is in the list of allowed roles
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }
    
    return true;
  }
}