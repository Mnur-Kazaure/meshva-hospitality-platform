import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../../modules/persistence/repositories/front-desk.repository';
import { AppRequest } from '../types/request-context';

@Injectable()
export class TenantStatusGuard implements CanActivate {
  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AppRequest>();
    const tenantId = request.context.tenantId;
    if (!this.isUuidLike(tenantId)) {
      return true;
    }
    const tenant = await this.repository.getTenant(tenantId);

    if (!tenant) {
      return true;
    }

    if (tenant.status !== 'suspended') {
      return true;
    }

    if (request.path.startsWith('/v1/platform')) {
      return true;
    }

    const method = request.method.toUpperCase();
    const isReadRequest = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
    const isStaffScope =
      request.context.identityType === 'staff' || request.path.startsWith('/v1/auth');
    if (isReadRequest && !isStaffScope) {
      return true;
    }

    throw new ForbiddenException('AUTH_TENANT_SUSPENDED');
  }

  private isUuidLike(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}
