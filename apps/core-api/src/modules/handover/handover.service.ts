import { Inject, Injectable } from '@nestjs/common';
import { FrontDeskEvents, ShiftType } from '@meshva/contracts';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { AppRequest } from '../../common/types/request-context';
import { CreateHandoverDto } from './dto/create-handover.dto';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../persistence/repositories/front-desk.repository';

@Injectable()
export class HandoverService {
  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(propertyId: string, request: AppRequest, dto: CreateHandoverDto) {
    const handover = {
      id: randomUUID(),
      tenantId: request.context.tenantId,
      propertyId,
      userId: request.context.userId,
      shiftType: dto.shiftType,
      notes: dto.notes,
      exceptions: dto.exceptions ?? [],
      createdAt: new Date().toISOString(),
    };

    const created = await this.repository.createShiftHandover({ handover });

    await this.auditService.recordMutation(request.context, {
      action: FrontDeskEvents.SHIFT_HANDOVER_CREATED,
      entityType: 'ShiftHandoverNote',
      entityId: created.id,
      propertyId,
      afterJson: created,
    });

    return created;
  }

  async latest(propertyId: string, tenantId: string, userId: string, shiftType?: ShiftType) {
    const candidates = (await this.repository.listShiftHandovers({
      tenantId,
      propertyId,
      userId,
      shiftType,
    }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return candidates[0] ?? null;
  }
}
