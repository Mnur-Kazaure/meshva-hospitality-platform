import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ExceptionSeverity,
  FinanceEvents,
  FrontDeskEvents,
  ManagerEvents,
  OwnerExceptionType,
} from '@meshva/contracts';
import { RequestContext } from '../../common/types/request-context';
import { AuditLogRecord } from '../tenancy/tenancy-store.service';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../persistence/repositories/front-desk.repository';

export interface AuditMutationInput {
  action: string;
  entityType: string;
  entityId: string;
  propertyId?: string;
  beforeJson?: unknown;
  afterJson?: unknown;
}

@Injectable()
export class AuditService {
  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
  ) {}

  async recordMutation(context: RequestContext, input: AuditMutationInput): Promise<AuditLogRecord> {
    const actorUser = await this.repository.getUserById({
      tenantId: context.tenantId,
      userId: context.userId,
    });

    const log: AuditLogRecord = {
      id: randomUUID(),
      tenantId: context.tenantId,
      propertyId: input.propertyId,
      actorUserId: actorUser ? context.userId : undefined,
      actorRole: context.role,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      beforeJson: input.beforeJson,
      afterJson: input.afterJson,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      createdAt: new Date().toISOString(),
    };

    const storedLog = await this.repository.createAuditLog({ auditLog: log });
    await this.raiseOwnerExceptionIfNeeded(storedLog);
    return storedLog;
  }

  async listByProperty(tenantId: string, propertyId: string, limit = 100): Promise<AuditLogRecord[]> {
    return this.repository.listAuditLogs({
      tenantId,
      propertyId,
      limit,
    });
  }

  async listByPropertyWithFilters(input: {
    tenantId: string;
    propertyId: string;
    from?: string;
    to?: string;
    actorUserId?: string;
    entityType?: string;
    limit?: number;
  }): Promise<AuditLogRecord[]> {
    return this.repository.listAuditLogs({
      tenantId: input.tenantId,
      propertyId: input.propertyId,
      from: input.from,
      to: input.to,
      actorUserId: input.actorUserId,
      entityType: input.entityType,
      limit: input.limit ?? 100,
    });
  }

  private async raiseOwnerExceptionIfNeeded(log: AuditLogRecord): Promise<void> {
    if (!log.propertyId) {
      return;
    }

    if (log.action === FinanceEvents.DAILY_CLOSE_COMPLETED) {
      const variance = this.extractDailyCloseVariance(log.afterJson);
      if (variance.total === 0) {
        return;
      }

      await this.repository.createOwnerException({
        exception: {
          id: randomUUID(),
          tenantId: log.tenantId,
          propertyId: log.propertyId,
          type: OwnerExceptionType.DAILY_CLOSE_VARIANCE,
          severity: variance.total >= 10000 ? ExceptionSeverity.RED : ExceptionSeverity.AMBER,
          sourceAction: log.action,
          actorUserId: log.actorUserId,
          entityType: log.entityType,
          entityId: log.entityId,
          summary: `Daily close variance detected (${variance.total.toFixed(2)} NGN).`,
          metadataJson: variance.byMethod,
          createdAt: log.createdAt,
          updatedAt: log.createdAt,
          dedupeKey: `${OwnerExceptionType.DAILY_CLOSE_VARIANCE}:${log.propertyId}:${variance.date ?? log.createdAt.slice(0, 10)}`,
        },
      });
      return;
    }

    if (log.action === ManagerEvents.DAY_UNLOCKED_BY_MANAGER) {
      await this.repository.createOwnerException({
        exception: {
          id: randomUUID(),
          tenantId: log.tenantId,
          propertyId: log.propertyId,
          type: OwnerExceptionType.DAY_UNLOCKED,
          severity: ExceptionSeverity.RED,
          sourceAction: log.action,
          actorUserId: log.actorUserId,
          entityType: log.entityType,
          entityId: log.entityId,
          summary: 'Manager unlocked a previously locked financial day.',
          metadataJson: this.ensureRecord(log.afterJson),
          createdAt: log.createdAt,
          updatedAt: log.createdAt,
          dedupeKey: `${OwnerExceptionType.DAY_UNLOCKED}:${log.propertyId}:${log.entityId}:${log.createdAt.slice(0, 10)}`,
        },
      });
      return;
    }

    if (log.action === ManagerEvents.DISCOUNT_APPLIED) {
      await this.repository.createOwnerException({
        exception: {
          id: randomUUID(),
          tenantId: log.tenantId,
          propertyId: log.propertyId,
          type: OwnerExceptionType.DISCOUNT_APPROVED,
          severity: ExceptionSeverity.AMBER,
          sourceAction: log.action,
          actorUserId: log.actorUserId,
          entityType: log.entityType,
          entityId: log.entityId,
          summary: 'Manager-approved discount applied to folio.',
          metadataJson: this.ensureRecord(log.afterJson),
          createdAt: log.createdAt,
          updatedAt: log.createdAt,
        },
      });
      return;
    }

    if (log.action === ManagerEvents.REFUND_APPROVED) {
      await this.repository.createOwnerException({
        exception: {
          id: randomUUID(),
          tenantId: log.tenantId,
          propertyId: log.propertyId,
          type: OwnerExceptionType.REFUND_APPROVED,
          severity: ExceptionSeverity.AMBER,
          sourceAction: log.action,
          actorUserId: log.actorUserId,
          entityType: log.entityType,
          entityId: log.entityId,
          summary: 'Refund approved and awaiting execution.',
          metadataJson: this.ensureRecord(log.afterJson),
          createdAt: log.createdAt,
          updatedAt: log.createdAt,
        },
      });
      return;
    }

    if (log.action === FinanceEvents.REFUND_EXECUTED) {
      await this.repository.createOwnerException({
        exception: {
          id: randomUUID(),
          tenantId: log.tenantId,
          propertyId: log.propertyId,
          type: OwnerExceptionType.REFUND_EXECUTED,
          severity: ExceptionSeverity.AMBER,
          sourceAction: log.action,
          actorUserId: log.actorUserId,
          entityType: log.entityType,
          entityId: log.entityId,
          summary: 'Refund executed by finance.',
          metadataJson: this.ensureRecord(log.afterJson),
          createdAt: log.createdAt,
          updatedAt: log.createdAt,
        },
      });
      return;
    }

    if (log.action === ManagerEvents.INVENTORY_OVERRIDDEN) {
      await this.repository.createOwnerException({
        exception: {
          id: randomUUID(),
          tenantId: log.tenantId,
          propertyId: log.propertyId,
          type: OwnerExceptionType.INVENTORY_OVERRIDDEN,
          severity: ExceptionSeverity.AMBER,
          sourceAction: log.action,
          actorUserId: log.actorUserId,
          entityType: log.entityType,
          entityId: log.entityId,
          summary: 'Inventory availability was manually overridden.',
          metadataJson: this.ensureRecord(log.afterJson),
          createdAt: log.createdAt,
          updatedAt: log.createdAt,
        },
      });
      return;
    }

    if (this.isCancellationAction(log.action)) {
      const from = new Date(new Date(log.createdAt).getTime() - 60 * 60 * 1000).toISOString();
      const recentLogs = await this.repository.listAuditLogsByTenant({
        tenantId: log.tenantId,
        propertyIds: [log.propertyId],
        from,
        actorUserId: log.actorUserId,
        limit: 200,
      });

      const cancelCount = recentLogs.filter((item) => this.isCancellationAction(item.action)).length;
      if (cancelCount < 3) {
        return;
      }

      const hourBucket = log.createdAt.slice(0, 13);
      await this.repository.createOwnerException({
        exception: {
          id: randomUUID(),
          tenantId: log.tenantId,
          propertyId: log.propertyId,
          type: OwnerExceptionType.MULTIPLE_CANCELS_BY_USER,
          severity: ExceptionSeverity.RED,
          sourceAction: log.action,
          actorUserId: log.actorUserId,
          entityType: log.entityType,
          entityId: log.entityId,
          summary: `High cancellation activity detected for user ${log.actorUserId ?? 'unknown'}.`,
          metadataJson: {
            cancelCount,
            windowMinutes: 60,
          },
          createdAt: log.createdAt,
          updatedAt: log.createdAt,
          dedupeKey: `${OwnerExceptionType.MULTIPLE_CANCELS_BY_USER}:${log.propertyId}:${log.actorUserId ?? 'unknown'}:${hourBucket}`,
        },
      });
      return;
    }

    if (log.action === FinanceEvents.FOLIO_ADJUSTMENT_ADDED) {
      const invoiceId = this.extractInvoiceId(log.afterJson);
      if (!invoiceId) {
        return;
      }

      const from = new Date(new Date(log.createdAt).getTime() - 24 * 60 * 60 * 1000).toISOString();
      const recentLogs = await this.repository.listAuditLogsByTenant({
        tenantId: log.tenantId,
        propertyIds: [log.propertyId],
        from,
        action: FinanceEvents.FOLIO_ADJUSTMENT_ADDED,
        limit: 300,
      });

      const invoiceAdjustments = recentLogs.filter(
        (item) => this.extractInvoiceId(item.afterJson) === invoiceId,
      ).length;

      if (invoiceAdjustments < 3) {
        return;
      }

      await this.repository.createOwnerException({
        exception: {
          id: randomUUID(),
          tenantId: log.tenantId,
          propertyId: log.propertyId,
          type: OwnerExceptionType.HIGH_MANUAL_ADJUSTMENTS,
          severity: ExceptionSeverity.RED,
          sourceAction: log.action,
          actorUserId: log.actorUserId,
          entityType: log.entityType,
          entityId: log.entityId,
          summary: `High manual adjustment volume detected on invoice ${invoiceId}.`,
          metadataJson: {
            invoiceId,
            adjustmentsIn24h: invoiceAdjustments,
          },
          createdAt: log.createdAt,
          updatedAt: log.createdAt,
          dedupeKey: `${OwnerExceptionType.HIGH_MANUAL_ADJUSTMENTS}:${log.propertyId}:${invoiceId}:${log.createdAt.slice(0, 10)}`,
        },
      });
    }
  }

  private isCancellationAction(action: string): boolean {
    const cancellationActions: string[] = [
      FrontDeskEvents.RESERVATION_CANCELLED,
      ManagerEvents.RESERVATION_FORCE_CANCELLED,
      ManagerEvents.RESERVATION_MARKED_NO_SHOW,
    ];
    return cancellationActions.includes(action);
  }

  private extractInvoiceId(payload: unknown): string | undefined {
    const record = this.ensureRecord(payload);
    const invoiceId = record.invoiceId;
    return typeof invoiceId === 'string' ? invoiceId : undefined;
  }

  private extractDailyCloseVariance(payload: unknown): {
    total: number;
    date?: string;
    byMethod: Record<string, unknown>;
  } {
    const record = this.ensureRecord(payload);
    const varianceCash = this.toNumber(record.varianceCash);
    const varianceTransfer = this.toNumber(record.varianceTransfer);
    const variancePos = this.toNumber(record.variancePos);
    const total = Math.abs(varianceCash) + Math.abs(varianceTransfer) + Math.abs(variancePos);

    return {
      total,
      date: typeof record.date === 'string' ? record.date : undefined,
      byMethod: {
        varianceCash,
        varianceTransfer,
        variancePos,
        dayLocked: record.dayLocked === true,
      },
    };
  }

  private ensureRecord(payload: unknown): Record<string, unknown> {
    if (typeof payload === 'object' && payload !== null) {
      return payload as Record<string, unknown>;
    }
    return {};
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }
}
