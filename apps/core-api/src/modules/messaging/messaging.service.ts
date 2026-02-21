import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ConfirmationChannel,
  ConfirmationEntityType,
  ConfirmationTemplate,
  FrontDeskEvents,
} from '@meshva/contracts';
import { randomUUID } from 'crypto';
import { RequestContext } from '../../common/types/request-context';
import { AuditService } from '../audit/audit.service';
import { SendConfirmationDto } from './dto/send-confirmation.dto';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../persistence/repositories/front-desk.repository';

export interface QueueConfirmationInput {
  tenantId: string;
  propertyId: string;
  entityType: ConfirmationEntityType;
  entityId: string;
  template: ConfirmationTemplate;
  channel: ConfirmationChannel;
  toPhone?: string;
  language?: string;
}

@Injectable()
export class MessagingService {
  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
    private readonly auditService: AuditService,
  ) {}

  async send(propertyId: string, context: RequestContext, dto: SendConfirmationDto) {
    await this.assertEntityExists(context.tenantId, propertyId, dto.entityType, dto.entityId);

    if (dto.channel !== ConfirmationChannel.PRINT && !dto.toPhone) {
      throw new BadRequestException('toPhone is required for WhatsApp/SMS channels');
    }

    const record = await this.queueConfirmation({
      tenantId: context.tenantId,
      propertyId,
      entityType: dto.entityType,
      entityId: dto.entityId,
      template: dto.template,
      channel: dto.channel,
      toPhone: dto.toPhone,
      language: dto.language,
    });

    await this.auditService.recordMutation(context, {
      action: FrontDeskEvents.CONFIRMATION_REQUESTED,
      entityType: dto.entityType,
      entityId: dto.entityId,
      propertyId,
      afterJson: record,
    });

    return record;
  }

  async queueConfirmation(input: QueueConfirmationInput) {
    const record = {
      id: randomUUID(),
      tenantId: input.tenantId,
      propertyId: input.propertyId,
      entityType: input.entityType,
      entityId: input.entityId,
      template: input.template,
      channel: input.channel,
      toPhone: input.toPhone,
      language: input.language,
      status: 'QUEUED' as const,
      createdAt: new Date().toISOString(),
    };

    await this.repository.createConfirmation({ confirmation: record });
    await this.repository.enqueue('messaging', 'messaging.send', {
      confirmationId: record.id,
      entityType: record.entityType,
      entityId: record.entityId,
      template: record.template,
      channel: record.channel,
      toPhone: record.toPhone,
      language: record.language,
    });

    return record;
  }

  private async assertEntityExists(
    tenantId: string,
    propertyId: string,
    entityType: ConfirmationEntityType,
    entityId: string,
  ): Promise<void> {
    if (entityType === ConfirmationEntityType.RESERVATION) {
      const reservation = await this.repository.getReservation({
        tenantId,
        propertyId,
        reservationId: entityId,
      });

      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }

      return;
    }

    const stay = await this.repository.getStay({
      tenantId,
      propertyId,
      stayId: entityId,
    });

    if (!stay) {
      throw new NotFoundException('Stay not found');
    }
  }
}
