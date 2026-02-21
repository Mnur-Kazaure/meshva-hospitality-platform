import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApprovalEntityType,
  ApprovalStatus,
  ApprovalType,
  DiscountType,
  FolioLineType,
  FrontDeskEvents,
  ManagerEvents,
  ReservationStatus,
  StayStatus,
} from '@meshva/contracts';
import { randomUUID } from 'crypto';
import { AppRequest } from '../../common/types/request-context';
import { AuditService } from '../audit/audit.service';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../persistence/repositories/front-desk.repository';
import { ApproveDiscountRequestDto } from './dto/approve-discount-request.dto';
import { ApproveOverrideRequestDto } from './dto/approve-override-request.dto';
import { ApproveRefundRequestDto } from './dto/approve-refund-request.dto';
import { CreateDiscountRequestDto } from './dto/create-discount-request.dto';
import { CreateOverrideRequestDto } from './dto/create-override-request.dto';
import { CreateRefundRequestDto } from './dto/create-refund-request.dto';
import { ListApprovalsDto } from './dto/list-approvals.dto';
import { RejectRequestDto } from './dto/reject-request.dto';

@Injectable()
export class ApprovalsService {
  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
    private readonly auditService: AuditService,
  ) {}

  async list(propertyId: string, request: AppRequest, query: ListApprovalsDto) {
    const tenantId = request.context.tenantId;

    if (query.type === ApprovalType.DISCOUNT) {
      return this.repository.listDiscountRequests({
        tenantId,
        propertyId,
        status: query.status,
      });
    }

    if (query.type === ApprovalType.REFUND) {
      return this.repository.listRefundRequests({
        tenantId,
        propertyId,
        status: query.status,
      });
    }

    if (query.type === ApprovalType.OVERRIDE) {
      return this.repository.listOverrideRequests({
        tenantId,
        propertyId,
        status: query.status,
      });
    }

    const [discounts, refunds, overrides] = await Promise.all([
      this.repository.listDiscountRequests({ tenantId, propertyId, status: query.status }),
      this.repository.listRefundRequests({ tenantId, propertyId, status: query.status }),
      this.repository.listOverrideRequests({ tenantId, propertyId, status: query.status }),
    ]);

    return {
      discounts,
      refunds,
      overrides,
    };
  }

  async createDiscountRequest(
    propertyId: string,
    request: AppRequest,
    dto: CreateDiscountRequestDto,
  ) {
    await this.assertApprovalEntityExists(
      request.context.tenantId,
      propertyId,
      dto.entityType,
      dto.entityId,
    );

    if (dto.discountType === DiscountType.PERCENT && (dto.value < 1 || dto.value > 100)) {
      throw new BadRequestException('Percentage discount value must be between 1 and 100');
    }

    const now = new Date().toISOString();
    const approval = await this.repository.createDiscountRequest({
      request: {
        id: randomUUID(),
        tenantId: request.context.tenantId,
        propertyId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        discountType: dto.discountType,
        value: dto.value,
        reason: dto.reason,
        status: ApprovalStatus.REQUESTED,
        requestedByUserId: request.context.userId,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.DISCOUNT_REQUESTED,
      entityType: 'DiscountRequest',
      entityId: approval.id,
      propertyId,
      afterJson: approval,
    });

    await this.repository.enqueue('messaging', 'messaging.send', {
      propertyId,
      requestId: approval.id,
      type: ApprovalType.DISCOUNT,
      status: approval.status,
    });

    return approval;
  }

  async approveDiscountRequest(
    propertyId: string,
    request: AppRequest,
    requestId: string,
    dto: ApproveDiscountRequestDto,
  ) {
    const discountRequest = await this.getDiscountRequestOrThrow(
      request.context.tenantId,
      propertyId,
      requestId,
    );
    if (discountRequest.status !== ApprovalStatus.REQUESTED) {
      throw new BadRequestException('Only REQUESTED discount requests can be approved');
    }

    await this.assertDiscountEntityEditable(
      request.context.tenantId,
      propertyId,
      discountRequest.entityType,
      discountRequest.entityId,
    );

    const now = new Date().toISOString();
    const invoiceId = await this.findInvoiceIdForEntity(
      request.context.tenantId,
      propertyId,
      discountRequest.entityType,
      discountRequest.entityId,
    );
    const lineItem = await this.repository.createFolioLineItem({
      lineItem: {
        id: randomUUID(),
        tenantId: request.context.tenantId,
        propertyId,
        invoiceId,
        entityType: discountRequest.entityType,
        entityId: discountRequest.entityId,
        lineType: FolioLineType.DISCOUNT,
        amount: -Math.abs(discountRequest.value),
        currency: 'NGN',
        description:
          discountRequest.discountType === DiscountType.PERCENT
            ? `Manager-approved percentage discount (${discountRequest.value}%)`
            : `Manager-approved discount (${discountRequest.value} NGN)`,
        createdByUserId: request.context.userId,
        createdAt: now,
      },
    });

    discountRequest.status = ApprovalStatus.APPROVED;
    discountRequest.note = dto.note;
    discountRequest.approvedByUserId = request.context.userId;
    discountRequest.appliedLineItemId = lineItem.id;
    discountRequest.updatedAt = now;
    const updated = await this.repository.updateDiscountRequest({ request: discountRequest });

    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.DISCOUNT_APPROVED,
      entityType: 'DiscountRequest',
      entityId: updated.id,
      propertyId,
      beforeJson: discountRequest,
      afterJson: updated,
    });

    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.DISCOUNT_APPLIED,
      entityType: 'FolioLineItem',
      entityId: lineItem.id,
      propertyId,
      afterJson: lineItem,
    });

    await this.repository.enqueue('messaging', 'messaging.send', {
      propertyId,
      requestId: updated.id,
      type: ApprovalType.DISCOUNT,
      status: updated.status,
    });

    return {
      request: updated,
      lineItem,
    };
  }

  async rejectDiscountRequest(
    propertyId: string,
    request: AppRequest,
    requestId: string,
    dto: RejectRequestDto,
  ) {
    const discountRequest = await this.getDiscountRequestOrThrow(
      request.context.tenantId,
      propertyId,
      requestId,
    );
    if (discountRequest.status !== ApprovalStatus.REQUESTED) {
      throw new BadRequestException('Only REQUESTED discount requests can be rejected');
    }

    const before = { ...discountRequest };
    discountRequest.status = ApprovalStatus.REJECTED;
    discountRequest.rejectedByUserId = request.context.userId;
    discountRequest.rejectionReason = dto.reason;
    discountRequest.updatedAt = new Date().toISOString();
    const updated = await this.repository.updateDiscountRequest({ request: discountRequest });

    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.DISCOUNT_REJECTED,
      entityType: 'DiscountRequest',
      entityId: updated.id,
      propertyId,
      beforeJson: before,
      afterJson: updated,
    });

    await this.repository.enqueue('messaging', 'messaging.send', {
      propertyId,
      requestId: updated.id,
      type: ApprovalType.DISCOUNT,
      status: updated.status,
    });

    return updated;
  }

  async createRefundRequest(
    propertyId: string,
    request: AppRequest,
    dto: CreateRefundRequestDto,
  ) {
    const now = new Date().toISOString();
    const approval = await this.repository.createRefundRequest({
      request: {
        id: randomUUID(),
        tenantId: request.context.tenantId,
        propertyId,
        invoiceId: dto.invoiceId,
        amount: dto.amount,
        reason: dto.reason,
        status: ApprovalStatus.REQUESTED,
        requestedByUserId: request.context.userId,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.REFUND_REQUESTED,
      entityType: 'RefundRequest',
      entityId: approval.id,
      propertyId,
      afterJson: approval,
    });

    return approval;
  }

  async approveRefundRequest(
    propertyId: string,
    request: AppRequest,
    requestId: string,
    dto: ApproveRefundRequestDto,
  ) {
    const refundRequest = await this.getRefundRequestOrThrow(
      request.context.tenantId,
      propertyId,
      requestId,
    );
    if (refundRequest.status !== ApprovalStatus.REQUESTED) {
      throw new BadRequestException('Only REQUESTED refund requests can be approved');
    }

    const before = { ...refundRequest };
    refundRequest.status = ApprovalStatus.APPROVED;
    refundRequest.approvedByUserId = request.context.userId;
    refundRequest.note = dto.note;
    refundRequest.updatedAt = new Date().toISOString();
    const updated = await this.repository.updateRefundRequest({ request: refundRequest });

    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.REFUND_APPROVED,
      entityType: 'RefundRequest',
      entityId: updated.id,
      propertyId,
      beforeJson: before,
      afterJson: updated,
    });

    await this.repository.enqueue('messaging', 'messaging.send', {
      propertyId,
      requestId: updated.id,
      type: ApprovalType.REFUND,
      status: updated.status,
    });

    return updated;
  }

  async rejectRefundRequest(
    propertyId: string,
    request: AppRequest,
    requestId: string,
    dto: RejectRequestDto,
  ) {
    const refundRequest = await this.getRefundRequestOrThrow(
      request.context.tenantId,
      propertyId,
      requestId,
    );
    if (refundRequest.status !== ApprovalStatus.REQUESTED) {
      throw new BadRequestException('Only REQUESTED refund requests can be rejected');
    }

    const before = { ...refundRequest };
    refundRequest.status = ApprovalStatus.REJECTED;
    refundRequest.rejectedByUserId = request.context.userId;
    refundRequest.rejectionReason = dto.reason;
    refundRequest.updatedAt = new Date().toISOString();
    const updated = await this.repository.updateRefundRequest({ request: refundRequest });

    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.REFUND_REJECTED,
      entityType: 'RefundRequest',
      entityId: updated.id,
      propertyId,
      beforeJson: before,
      afterJson: updated,
    });

    await this.repository.enqueue('messaging', 'messaging.send', {
      propertyId,
      requestId: updated.id,
      type: ApprovalType.REFUND,
      status: updated.status,
    });

    return updated;
  }

  async createOverrideRequest(
    propertyId: string,
    request: AppRequest,
    dto: CreateOverrideRequestDto,
  ) {
    if (dto.entityType !== ApprovalEntityType.INVENTORY) {
      await this.assertApprovalEntityExists(
        request.context.tenantId,
        propertyId,
        dto.entityType,
        dto.entityId,
      );
    }

    const now = new Date().toISOString();
    const approval = await this.repository.createOverrideRequest({
      request: {
        id: randomUUID(),
        tenantId: request.context.tenantId,
        propertyId,
        overrideType: dto.overrideType,
        entityType: dto.entityType,
        entityId: dto.entityId,
        reason: dto.reason,
        requestedValue: dto.requestedValue,
        status: ApprovalStatus.REQUESTED,
        requestedByUserId: request.context.userId,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.OVERRIDE_REQUESTED,
      entityType: 'OverrideRequest',
      entityId: approval.id,
      propertyId,
      afterJson: approval,
    });

    return approval;
  }

  async approveOverrideRequest(
    propertyId: string,
    request: AppRequest,
    requestId: string,
    dto: ApproveOverrideRequestDto,
  ) {
    const overrideRequest = await this.getOverrideRequestOrThrow(
      request.context.tenantId,
      propertyId,
      requestId,
    );
    if (overrideRequest.status !== ApprovalStatus.REQUESTED) {
      throw new BadRequestException('Only REQUESTED override requests can be approved');
    }

    const expiresAt = new Date(dto.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException('Invalid expiresAt value');
    }

    const now = new Date();
    const maxExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (expiresAt <= now || expiresAt > maxExpiry) {
      throw new BadRequestException('Override approval expiresAt must be within 24 hours');
    }

    const before = { ...overrideRequest };
    overrideRequest.status = ApprovalStatus.APPROVED;
    overrideRequest.approvedByUserId = request.context.userId;
    overrideRequest.overrideToken = randomUUID();
    overrideRequest.overrideTokenExpiresAt = expiresAt.toISOString();
    overrideRequest.note = dto.note;
    overrideRequest.updatedAt = new Date().toISOString();
    const updated = await this.repository.updateOverrideRequest({ request: overrideRequest });

    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.OVERRIDE_APPROVED,
      entityType: 'OverrideRequest',
      entityId: updated.id,
      propertyId,
      beforeJson: before,
      afterJson: updated,
    });

    await this.repository.enqueue('messaging', 'messaging.send', {
      propertyId,
      requestId: updated.id,
      type: ApprovalType.OVERRIDE,
      status: updated.status,
    });

    return updated;
  }

  async rejectOverrideRequest(
    propertyId: string,
    request: AppRequest,
    requestId: string,
    dto: RejectRequestDto,
  ) {
    const overrideRequest = await this.getOverrideRequestOrThrow(
      request.context.tenantId,
      propertyId,
      requestId,
    );
    if (overrideRequest.status !== ApprovalStatus.REQUESTED) {
      throw new BadRequestException('Only REQUESTED override requests can be rejected');
    }

    const before = { ...overrideRequest };
    overrideRequest.status = ApprovalStatus.REJECTED;
    overrideRequest.rejectedByUserId = request.context.userId;
    overrideRequest.rejectionReason = dto.reason;
    overrideRequest.updatedAt = new Date().toISOString();
    const updated = await this.repository.updateOverrideRequest({ request: overrideRequest });

    await this.auditService.recordMutation(request.context, {
      action: ManagerEvents.OVERRIDE_REJECTED,
      entityType: 'OverrideRequest',
      entityId: updated.id,
      propertyId,
      beforeJson: before,
      afterJson: updated,
    });

    await this.repository.enqueue('messaging', 'messaging.send', {
      propertyId,
      requestId: updated.id,
      type: ApprovalType.OVERRIDE,
      status: updated.status,
    });

    return updated;
  }

  private async getDiscountRequestOrThrow(
    tenantId: string,
    propertyId: string,
    requestId: string,
  ) {
    const request = await this.repository.getDiscountRequest({
      tenantId,
      propertyId,
      requestId,
    });
    if (!request) {
      throw new NotFoundException('Discount request not found');
    }
    return request;
  }

  private async getRefundRequestOrThrow(
    tenantId: string,
    propertyId: string,
    requestId: string,
  ) {
    const request = await this.repository.getRefundRequest({
      tenantId,
      propertyId,
      requestId,
    });
    if (!request) {
      throw new NotFoundException('Refund request not found');
    }
    return request;
  }

  private async getOverrideRequestOrThrow(
    tenantId: string,
    propertyId: string,
    requestId: string,
  ) {
    const request = await this.repository.getOverrideRequest({
      tenantId,
      propertyId,
      requestId,
    });
    if (!request) {
      throw new NotFoundException('Override request not found');
    }
    return request;
  }

  private async assertApprovalEntityExists(
    tenantId: string,
    propertyId: string,
    entityType: ApprovalEntityType.RESERVATION | ApprovalEntityType.STAY,
    entityId: string,
  ): Promise<void> {
    if (entityType === ApprovalEntityType.RESERVATION) {
      const reservation = await this.repository.getReservation({
        tenantId,
        propertyId,
        reservationId: entityId,
      });
      if (!reservation) {
        throw new NotFoundException('Reservation not found for approval request');
      }
      return;
    }

    const stay = await this.repository.getStay({
      tenantId,
      propertyId,
      stayId: entityId,
    });
    if (!stay) {
      throw new NotFoundException('Stay not found for approval request');
    }
  }

  private async assertDiscountEntityEditable(
    tenantId: string,
    propertyId: string,
    entityType: ApprovalEntityType.RESERVATION | ApprovalEntityType.STAY,
    entityId: string,
  ): Promise<void> {
    if (entityType === ApprovalEntityType.RESERVATION) {
      const reservation = await this.repository.getReservation({
        tenantId,
        propertyId,
        reservationId: entityId,
      });
      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }

      if (
        reservation.status === ReservationStatus.CANCELLED ||
        reservation.status === ReservationStatus.EXPIRED ||
        reservation.status === ReservationStatus.NO_SHOW
      ) {
        throw new BadRequestException('Reservation is not in editable billing state');
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

    if (stay.status !== StayStatus.OPEN) {
      throw new BadRequestException('Stay is not in editable billing state');
    }
  }

  private async findInvoiceIdForEntity(
    tenantId: string,
    propertyId: string,
    entityType: ApprovalEntityType.RESERVATION | ApprovalEntityType.STAY,
    entityId: string,
  ) {
    const invoices = await this.repository.listInvoices({ tenantId, propertyId });
    if (entityType === ApprovalEntityType.RESERVATION) {
      return invoices.find((invoice) => invoice.reservationId === entityId)?.id;
    }

    return invoices.find((invoice) => invoice.stayId === entityId)?.id;
  }
}
