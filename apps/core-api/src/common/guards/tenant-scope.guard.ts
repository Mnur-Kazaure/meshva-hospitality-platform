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
export class TenantScopeGuard implements CanActivate {
  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AppRequest>();
    const propertyIdParam = request.params?.propertyId;
    const propertyId = Array.isArray(propertyIdParam) ? propertyIdParam[0] : propertyIdParam;

    if (!propertyId) {
      return true;
    }

    const isAllowed = await this.repository.isPropertyInTenant(
      request.context.tenantId,
      propertyId,
    );
    if (!isAllowed) {
      throw new ForbiddenException('Property does not belong to tenant context');
    }

    return true;
  }
}
