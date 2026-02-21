import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FrontDeskEvents } from '@meshva/contracts';
import { AuditService } from '../audit/audit.service';
import { AppRequest } from '../../common/types/request-context';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../persistence/repositories/front-desk.repository';

@Injectable()
export class GuestsService {
  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
    private readonly auditService: AuditService,
  ) {}

  async list(propertyId: string, request: AppRequest, query?: string) {
    return this.repository.searchGuests({
      tenantId: request.context.tenantId,
      propertyId,
      search: query,
    });
  }

  async create(propertyId: string, request: AppRequest, dto: CreateGuestDto) {
    const guest = await this.repository.createGuest({
      tenantId: request.context.tenantId,
      propertyId,
      fullName: dto.fullName,
      phone: dto.phone,
      email: dto.email,
      notes: dto.notes,
    });

    await this.auditService.recordMutation(request.context, {
      action: FrontDeskEvents.GUEST_CREATED,
      entityType: 'Guest',
      entityId: guest.id,
      propertyId,
      afterJson: guest,
    });

    return guest;
  }

  async update(propertyId: string, guestId: string, request: AppRequest, dto: UpdateGuestDto) {
    const guest = await this.repository.getGuestById({
      tenantId: request.context.tenantId,
      propertyId,
      guestId,
    });

    if (!guest) {
      throw new NotFoundException('Guest not found for property');
    }

    const before = { ...guest };
    const updatedGuest = await this.repository.updateGuest({
      tenantId: request.context.tenantId,
      propertyId,
      guestId,
      patch: {
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        notes: dto.notes,
      },
    });

    if (!updatedGuest) {
      throw new NotFoundException('Guest not found for property');
    }

    await this.auditService.recordMutation(request.context, {
      action: FrontDeskEvents.GUEST_UPDATED,
      entityType: 'Guest',
      entityId: updatedGuest.id,
      propertyId,
      beforeJson: before,
      afterJson: updatedGuest,
    });

    return updatedGuest;
  }
}
