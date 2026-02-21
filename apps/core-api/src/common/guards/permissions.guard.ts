import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_KEY } from '../constants';
import { AppRequest } from '../types/request-context';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AppRequest>();
    const missingPermissions = requiredPermissions.filter(
      (permission) => !request.context.permissions.includes(permission),
    );

    if (missingPermissions.length > 0) {
      throw new ForbiddenException(`Missing permissions: ${missingPermissions.join(', ')}`);
    }

    return true;
  }
}
