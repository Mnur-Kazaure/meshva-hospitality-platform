import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FolioLineType,
  OwnerEvents,
  OwnerExportStatus,
  ReservationStatus,
  RoomStatus,
} from '@meshva/contracts';
import { randomUUID } from 'crypto';
import { AppRequest } from '../../common/types/request-context';
import { AuditService } from '../audit/audit.service';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../persistence/repositories/front-desk.repository';
import { CreateOwnerExportJobDto } from './dto/create-owner-export-job.dto';
import { CreateOwnerNoteDto } from './dto/create-owner-note.dto';
import { OwnerAuditQueryDto } from './dto/owner-audit-query.dto';
import { OwnerDateRangeQueryDto } from './dto/owner-date-range-query.dto';
import { OwnerExceptionsQueryDto } from './dto/owner-exceptions-query.dto';

export interface OwnerDateRange {
  from: string;
  to: string;
  days: number;
}

interface ResolvedOwnerScope {
  propertyIds: string[];
  properties: Array<{
    id: string;
    name: string;
    state: string;
    city: string;
  }>;
}

@Injectable()
export class OwnerService {
  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
    private readonly auditService: AuditService,
  ) {}

  async getOverview(request: AppRequest, query: OwnerDateRangeQueryDto) {
    const range = this.resolveDateRange(query.from, query.to);
    const scope = await this.resolveScope(request, query.propertyIds);
    const metrics = await this.computePropertyMetrics(request.context.tenantId, scope, range);

    const totals = metrics.reduce(
      (acc, row) => {
        acc.revenue += row.revenue;
        acc.outstanding += row.outstandingBalance;
        acc.exceptions += row.exceptionsCount;
        acc.closedDays += row.closedDays;
        acc.totalDays += row.totalDays;
        acc.occupiedRoomNights += row.occupiedRoomNights;
        acc.totalRoomNights += row.totalRoomNights;
        return acc;
      },
      {
        revenue: 0,
        outstanding: 0,
        exceptions: 0,
        closedDays: 0,
        totalDays: 0,
        occupiedRoomNights: 0,
        totalRoomNights: 0,
      },
    );

    const closeCompliance =
      totals.totalDays > 0 ? this.toCurrency((totals.closedDays / totals.totalDays) * 100) : 0;
    const occupancy =
      totals.totalRoomNights > 0
        ? this.toCurrency((totals.occupiedRoomNights / totals.totalRoomNights) * 100)
        : 0;

    return {
      range,
      totals: {
        revenue: this.toCurrency(totals.revenue),
        occupancy,
        outstandingBalance: this.toCurrency(totals.outstanding),
        closeCompliance,
        exceptionsCount: totals.exceptions,
      },
      breakdownByProperty: metrics.map((row) => ({
        propertyId: row.propertyId,
        propertyName: row.propertyName,
        revenue: row.revenue,
        occupancy: row.occupancy,
        outstandingBalance: row.outstandingBalance,
        closeCompliance: row.closeCompliance,
        exceptionsCount: row.exceptionsCount,
      })),
    };
  }

  async getPropertiesComparison(request: AppRequest, query: OwnerDateRangeQueryDto) {
    const range = this.resolveDateRange(query.from, query.to);
    const scope = await this.resolveScope(request, query.propertyIds);
    const metrics = await this.computePropertyMetrics(request.context.tenantId, scope, range);

    return {
      range,
      rows: metrics.map((row) => ({
        propertyId: row.propertyId,
        propertyName: row.propertyName,
        revenue: row.revenue,
        occupancy: row.occupancy,
        outstandingBalance: row.outstandingBalance,
        closeCompliance: row.closeCompliance,
        exceptionsCount: row.exceptionsCount,
        lastDailyCloseAt: row.lastDailyCloseAt,
        topIssue: row.topIssue,
      })),
    };
  }

  async getFinancialSummary(request: AppRequest, query: OwnerDateRangeQueryDto) {
    const range = this.resolveDateRange(query.from, query.to);
    const scope = await this.resolveScope(request, query.propertyIds);
    const tenantId = request.context.tenantId;

    const propertySummaries = await Promise.all(
      scope.properties.map(async (property) => {
        const [payments, invoices, folioLineItems] = await Promise.all([
          this.repository.listPayments({
            tenantId,
            propertyId: property.id,
          }),
          this.repository.listInvoices({
            tenantId,
            propertyId: property.id,
          }),
          this.repository.listFolioLineItems({
            tenantId,
            propertyId: property.id,
          }),
        ]);

        const paymentsInRange = payments.filter((payment) =>
          this.isIsoTimestampInRange(payment.createdAt, range),
        );
        const refunds = paymentsInRange.filter((payment) => payment.paymentType === 'REFUND');
        const discounts = folioLineItems.filter(
          (lineItem) =>
            lineItem.lineType === FolioLineType.DISCOUNT &&
            this.isIsoTimestampInRange(lineItem.createdAt, range),
        );

        const revenueByMethod = {
          cash: this.toCurrency(
            paymentsInRange
              .filter((payment) => payment.method === 'CASH')
              .reduce((sum, payment) => sum + payment.amount, 0),
          ),
          transfer: this.toCurrency(
            paymentsInRange
              .filter((payment) => payment.method === 'BANK_TRANSFER')
              .reduce((sum, payment) => sum + payment.amount, 0),
          ),
          pos: this.toCurrency(
            paymentsInRange
              .filter((payment) => payment.method === 'POS')
              .reduce((sum, payment) => sum + payment.amount, 0),
          ),
        };

        const outstandingBalance = await this.computeOutstandingBalance(
          tenantId,
          property.id,
          invoices,
        );

        const netRevenue = this.toCurrency(
          revenueByMethod.cash + revenueByMethod.transfer + revenueByMethod.pos,
        );

        return {
          propertyId: property.id,
          propertyName: property.name,
          revenueByMethod,
          netRevenue,
          refunds: {
            count: refunds.length,
            value: this.toCurrency(Math.abs(refunds.reduce((sum, payment) => sum + payment.amount, 0))),
          },
          discounts: {
            count: discounts.length,
            value: this.toCurrency(Math.abs(discounts.reduce((sum, lineItem) => sum + lineItem.amount, 0))),
          },
          outstandingBalance,
        };
      }),
    );

    const totals = propertySummaries.reduce(
      (acc, row) => {
        acc.cash += row.revenueByMethod.cash;
        acc.transfer += row.revenueByMethod.transfer;
        acc.pos += row.revenueByMethod.pos;
        acc.netRevenue += row.netRevenue;
        acc.refundsCount += row.refunds.count;
        acc.refundsValue += row.refunds.value;
        acc.discountsCount += row.discounts.count;
        acc.discountsValue += row.discounts.value;
        acc.outstandingBalance += row.outstandingBalance;
        return acc;
      },
      {
        cash: 0,
        transfer: 0,
        pos: 0,
        netRevenue: 0,
        refundsCount: 0,
        refundsValue: 0,
        discountsCount: 0,
        discountsValue: 0,
        outstandingBalance: 0,
      },
    );

    return {
      range,
      totals: {
        revenueByMethod: {
          cash: this.toCurrency(totals.cash),
          transfer: this.toCurrency(totals.transfer),
          pos: this.toCurrency(totals.pos),
        },
        netRevenue: this.toCurrency(totals.netRevenue),
        refunds: {
          count: totals.refundsCount,
          value: this.toCurrency(totals.refundsValue),
        },
        discounts: {
          count: totals.discountsCount,
          value: this.toCurrency(totals.discountsValue),
        },
        outstandingBalance: this.toCurrency(totals.outstandingBalance),
      },
      breakdownByProperty: propertySummaries,
    };
  }

  async getOperationsSummary(request: AppRequest, query: OwnerDateRangeQueryDto) {
    const range = this.resolveDateRange(query.from, query.to);
    const scope = await this.resolveScope(request, query.propertyIds);
    const tenantId = request.context.tenantId;

    const breakdownByProperty = await Promise.all(
      scope.properties.map(async (property) => {
        const [reservations, rooms, tasks] = await Promise.all([
          this.repository.listReservations({
            tenantId,
            propertyId: property.id,
          }),
          this.repository.listRooms({
            tenantId,
            propertyId: property.id,
          }),
          this.repository.listHousekeepingTasks({
            tenantId,
            propertyId: property.id,
          }),
        ]);

        const arrivals = reservations.filter((reservation) =>
          this.isDateInRange(reservation.checkIn, range),
        ).length;
        const departures = reservations.filter((reservation) =>
          this.isDateInRange(reservation.checkOut, range),
        ).length;
        const noShows = reservations.filter(
          (reservation) =>
            reservation.status === ReservationStatus.NO_SHOW &&
            this.isIsoTimestampInRange(reservation.updatedAt, range),
        ).length;

        const dirtyRooms = rooms.filter(
          (room) => room.status === RoomStatus.DIRTY || room.status === RoomStatus.CLEANING,
        ).length;
        const dirtyBacklogAgingHours = this.toCurrency(
          tasks
            .filter((task) => task.status === 'DIRTY' || task.status === 'CLEANING')
            .reduce((sum, task) => sum + this.ageInHours(task.createdAt), 0),
        );

        const sourceCounts = reservations
          .filter((reservation) => this.isDateInRange(reservation.checkIn, range))
          .reduce<Record<string, number>>((acc, reservation) => {
            acc[reservation.source] = (acc[reservation.source] ?? 0) + 1;
            return acc;
          }, {});

        return {
          propertyId: property.id,
          propertyName: property.name,
          arrivals,
          departures,
          noShows,
          dirtyBacklog: {
            rooms: dirtyRooms,
            agingHours: dirtyBacklogAgingHours,
          },
          reservationSources: sourceCounts,
        };
      }),
    );

    return {
      range,
      breakdownByProperty,
      totals: breakdownByProperty.reduce(
        (acc, row) => {
          acc.arrivals += row.arrivals;
          acc.departures += row.departures;
          acc.noShows += row.noShows;
          acc.dirtyRooms += row.dirtyBacklog.rooms;
          return acc;
        },
        {
          arrivals: 0,
          departures: 0,
          noShows: 0,
          dirtyRooms: 0,
        },
      ),
    };
  }

  async listExceptions(request: AppRequest, query: OwnerExceptionsQueryDto) {
    const range = this.resolveDateRange(query.from, query.to);
    const scope = await this.resolveScope(request, query.propertyIds);

    const exceptions = await this.repository.listOwnerExceptions({
      tenantId: request.context.tenantId,
      propertyIds: scope.propertyIds,
      type: query.type,
      severity: query.severity,
      from: this.startOfDayIso(range.from),
      to: this.endOfDayIso(range.to),
      acknowledged:
        query.acknowledged == null ? undefined : query.acknowledged.toLowerCase() === 'true',
      limit: 500,
    });

    return {
      range,
      exceptions,
    };
  }

  async acknowledgeException(request: AppRequest, exceptionId: string) {
    const tenantId = request.context.tenantId;
    const exception = await this.repository.getOwnerException({
      tenantId,
      exceptionId,
    });
    if (!exception) {
      throw new NotFoundException('Exception not found');
    }

    await this.assertExceptionInScope(request, exception.propertyId);

    if (exception.acknowledgedAt) {
      return exception;
    }

    const before = { ...exception };
    exception.acknowledgedAt = new Date().toISOString();
    exception.acknowledgedByUserId = request.context.userId;
    exception.updatedAt = exception.acknowledgedAt;
    const updated = await this.repository.updateOwnerException({ exception });

    await this.auditService.recordMutation(request.context, {
      action: OwnerEvents.OWNER_EXCEPTION_ACKED,
      entityType: 'OwnerException',
      entityId: updated.id,
      propertyId: updated.propertyId,
      beforeJson: before,
      afterJson: updated,
    });

    return updated;
  }

  async createExceptionNote(request: AppRequest, exceptionId: string, dto: CreateOwnerNoteDto) {
    const tenantId = request.context.tenantId;
    const exception = await this.repository.getOwnerException({
      tenantId,
      exceptionId,
    });
    if (!exception) {
      throw new NotFoundException('Exception not found');
    }

    await this.assertExceptionInScope(request, exception.propertyId);

    const note = await this.repository.createOwnerNote({
      note: {
        id: randomUUID(),
        tenantId,
        propertyId: exception.propertyId,
        exceptionId: exception.id,
        text: dto.text,
        createdByUserId: request.context.userId,
        createdAt: new Date().toISOString(),
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: OwnerEvents.OWNER_NOTE_CREATED,
      entityType: 'OwnerNote',
      entityId: note.id,
      propertyId: note.propertyId,
      afterJson: note,
    });

    return note;
  }

  async listAudit(request: AppRequest, query: OwnerAuditQueryDto) {
    const range = this.resolveDateRange(query.from, query.to);
    const scope = await this.resolveScope(request, query.propertyIds);

    return this.repository.listAuditLogsByTenant({
      tenantId: request.context.tenantId,
      propertyIds: scope.propertyIds,
      from: this.startOfDayIso(range.from),
      to: this.endOfDayIso(range.to),
      actorUserId: query.actorUserId,
      action: query.action,
      entityType: query.entityType,
      limit: query.limit ?? 100,
    });
  }

  async createExportJob(request: AppRequest, dto: CreateOwnerExportJobDto) {
    const range = this.resolveDateRange(dto.from, dto.to);
    const scope = await this.resolveScope(request, dto.propertyIds);
    const tenantId = request.context.tenantId;

    const recentQueued = await this.repository.listOwnerExportJobs({
      tenantId,
      requestedByUserId: request.context.userId,
      status: OwnerExportStatus.QUEUED,
      limit: 20,
    });

    const queuedInLastMinute = recentQueued.filter(
      (job) => Date.now() - new Date(job.createdAt).getTime() <= 60_000,
    ).length;
    if (queuedInLastMinute >= 3) {
      throw new HttpException(
        'Too many export requests. Retry in one minute.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const now = new Date().toISOString();
    const exportJob = await this.repository.createOwnerExportJob({
      exportJob: {
        id: randomUUID(),
        tenantId,
        requestedByUserId: request.context.userId,
        exportType: dto.exportType,
        format: dto.format,
        fromDate: range.from,
        toDate: range.to,
        propertyIds: scope.propertyIds,
        filtersJson: {
          propertyIds: scope.propertyIds,
          from: range.from,
          to: range.to,
        },
        status: OwnerExportStatus.QUEUED,
        createdAt: now,
        updatedAt: now,
      },
    });

    await this.repository.enqueue('reporting', 'reporting.export.generate', {
      tenantId,
      exportJobId: exportJob.id,
      exportType: exportJob.exportType,
      format: exportJob.format,
      from: exportJob.fromDate,
      to: exportJob.toDate,
      propertyIds: exportJob.propertyIds,
    });

    await this.auditService.recordMutation(request.context, {
      action: OwnerEvents.EXPORT_REQUESTED,
      entityType: 'OwnerExportJob',
      entityId: exportJob.id,
      afterJson: exportJob,
    });

    return exportJob;
  }

  async getExportJob(request: AppRequest, exportId: string) {
    const exportJob = await this.repository.getOwnerExportJob({
      tenantId: request.context.tenantId,
      exportJobId: exportId,
    });
    if (!exportJob) {
      throw new NotFoundException('Export job not found');
    }

    await this.assertScopeContainsProperties(request, exportJob.propertyIds);
    return exportJob;
  }

  private async computePropertyMetrics(
    tenantId: string,
    scope: ResolvedOwnerScope,
    range: OwnerDateRange,
  ) {
    const [exceptions, reports] = await Promise.all([
      this.repository.listOwnerExceptions({
        tenantId,
        propertyIds: scope.propertyIds,
        from: this.startOfDayIso(range.from),
        to: this.endOfDayIso(range.to),
        limit: 1000,
      }),
      Promise.all(
        scope.properties.map(async (property) => ({
          propertyId: property.id,
          reports: await this.repository.listDailyCloseReports({
            tenantId,
            propertyId: property.id,
            limit: 400,
          }),
        })),
      ),
    ]);

    const exceptionsByProperty = exceptions.reduce<Record<string, typeof exceptions>>((acc, item) => {
      if (!item.propertyId) {
        return acc;
      }

      acc[item.propertyId] = acc[item.propertyId] ?? [];
      acc[item.propertyId].push(item);
      return acc;
    }, {});
    const reportsByProperty = new Map(reports.map((item) => [item.propertyId, item.reports]));

    return Promise.all(
      scope.properties.map(async (property) => {
        const [rooms, stays, invoices, payments, lineItems] = await Promise.all([
          this.repository.listRooms({ tenantId, propertyId: property.id }),
          this.repository.listStays({ tenantId, propertyId: property.id }),
          this.repository.listInvoices({ tenantId, propertyId: property.id }),
          this.repository.listPayments({ tenantId, propertyId: property.id }),
          this.repository.listFolioLineItems({ tenantId, propertyId: property.id }),
        ]);

        const paymentsInRange = payments.filter((payment) =>
          this.isIsoTimestampInRange(payment.createdAt, range),
        );
        const occupancy = this.calculateOccupancy(stays, rooms.length, range);
        const outstandingBalance = await this.computeOutstandingBalance(
          tenantId,
          property.id,
          invoices,
          lineItems,
          payments,
        );

        const propertyReports = (reportsByProperty.get(property.id) ?? []).filter((report) =>
          this.isDateInRange(report.date, range),
        );
        const closedDays = new Set(
          propertyReports
            .filter((report) => report.status === 'LOCKED')
            .map((report) => report.date),
        ).size;
        const closeCompliance = range.days > 0 ? this.toCurrency((closedDays / range.days) * 100) : 0;
        const propertyExceptions = exceptionsByProperty[property.id] ?? [];
        const topIssue = this.getTopIssue(propertyExceptions.map((item) => item.type));

        const lastDailyCloseAt = propertyReports
          .slice()
          .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0]?.updatedAt;

        return {
          propertyId: property.id,
          propertyName: property.name,
          revenue: this.toCurrency(
            paymentsInRange.reduce((sum, payment) => sum + payment.amount, 0),
          ),
          occupancy: occupancy.rate,
          occupiedRoomNights: occupancy.occupiedRoomNights,
          totalRoomNights: occupancy.totalRoomNights,
          outstandingBalance: this.toCurrency(outstandingBalance),
          closeCompliance,
          closedDays,
          totalDays: range.days,
          exceptionsCount: propertyExceptions.length,
          topIssue,
          lastDailyCloseAt,
        };
      }),
    );
  }

  private calculateOccupancy(
    stays: Array<{
      checkInAt: string;
      plannedCheckOut: string;
      checkOutAt?: string;
    }>,
    totalRooms: number,
    range: OwnerDateRange,
  ) {
    const rangeStartDay = this.toEpochDay(range.from);
    const rangeEndExclusiveDay = this.toEpochDay(range.to) + 1;
    let occupiedRoomNights = 0;

    for (const stay of stays) {
      const stayStartDay = this.toEpochDay(stay.checkInAt.slice(0, 10));
      const stayEndExclusiveDay = this.toEpochDay(
        stay.checkOutAt?.slice(0, 10) ?? stay.plannedCheckOut,
      );
      const overlap = Math.max(
        0,
        Math.min(stayEndExclusiveDay, rangeEndExclusiveDay) -
          Math.max(stayStartDay, rangeStartDay),
      );
      occupiedRoomNights += overlap;
    }

    const totalRoomNights = totalRooms * range.days;
    const rate =
      totalRoomNights > 0
        ? this.toCurrency((occupiedRoomNights / totalRoomNights) * 100)
        : 0;

    return {
      occupiedRoomNights,
      totalRoomNights,
      rate,
    };
  }

  private async computeOutstandingBalance(
    tenantId: string,
    propertyId: string,
    invoices: Array<{ id: string; status: 'OPEN' | 'CLOSED' }>,
    preloadedLineItems?: Array<{ invoiceId?: string; amount: number }>,
    preloadedPayments?: Array<{ invoiceId: string; amount: number }>,
  ) {
    let outstanding = 0;

    for (const invoice of invoices) {
      if (invoice.status !== 'OPEN') {
        continue;
      }

      const lineItems =
        preloadedLineItems?.filter((item) => item.invoiceId === invoice.id) ??
        (await this.repository.listFolioLineItems({
          tenantId,
          propertyId,
          invoiceId: invoice.id,
        }));
      const payments =
        preloadedPayments?.filter((payment) => payment.invoiceId === invoice.id) ??
        (await this.repository.listPayments({
          tenantId,
          propertyId,
          invoiceId: invoice.id,
        }));

      const lineItemsTotal = lineItems.reduce((sum, lineItem) => sum + lineItem.amount, 0);
      const paymentsTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
      outstanding += Math.max(0, this.toCurrency(lineItemsTotal - paymentsTotal));
    }

    return this.toCurrency(outstanding);
  }

  private getTopIssue(issueTypes: string[]): string | null {
    if (issueTypes.length === 0) {
      return null;
    }

    const counts = issueTypes.reduce<Record<string, number>>((acc, issueType) => {
      acc[issueType] = (acc[issueType] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }

  private resolveDateRange(from?: string, to?: string): OwnerDateRange {
    const today = new Date().toISOString().slice(0, 10);
    const resolvedTo = (to ?? today).slice(0, 10);
    const resolvedFrom =
      from?.slice(0, 10) ??
      this.shiftDateByDays(resolvedTo, -6);

    if (resolvedFrom > resolvedTo) {
      throw new BadRequestException('from must be earlier than or equal to to');
    }

    return {
      from: resolvedFrom,
      to: resolvedTo,
      days: this.toEpochDay(resolvedTo) - this.toEpochDay(resolvedFrom) + 1,
    };
  }

  private async resolveScope(
    request: AppRequest,
    propertyIdsCsv?: string,
  ): Promise<ResolvedOwnerScope> {
    const tenantId = request.context.tenantId;
    const allProperties = await this.repository.listPropertiesByTenant(tenantId);
    const access = await this.repository.listUserPropertyAccess({
      tenantId,
      userId: request.context.userId,
    });

    const allowedPropertyIds = access.length
      ? new Set(access.map((item) => item.propertyId))
      : new Set(allProperties.map((property) => property.id));

    const accessibleProperties = allProperties.filter((property) =>
      allowedPropertyIds.has(property.id),
    );
    const requestedPropertyIds = this.parsePropertyIdsCsv(propertyIdsCsv);

    if (requestedPropertyIds.length > 0) {
      for (const propertyId of requestedPropertyIds) {
        if (!allowedPropertyIds.has(propertyId)) {
          throw new ForbiddenException(
            `Property ${propertyId} is outside owner scope for this user`,
          );
        }
      }
    }

    const properties =
      requestedPropertyIds.length > 0
        ? accessibleProperties.filter((property) =>
            requestedPropertyIds.includes(property.id),
          )
        : accessibleProperties;

    if (properties.length === 0) {
      throw new NotFoundException('No properties available in owner scope');
    }

    return {
      propertyIds: properties.map((property) => property.id),
      properties: properties.map((property) => ({
        id: property.id,
        name: property.name,
        state: property.state,
        city: property.city,
      })),
    };
  }

  private async assertExceptionInScope(request: AppRequest, propertyId?: string) {
    if (!propertyId) {
      return;
    }

    await this.assertScopeContainsProperties(request, [propertyId]);
  }

  private async assertScopeContainsProperties(request: AppRequest, propertyIds: string[]) {
    if (propertyIds.length === 0) {
      return;
    }

    const scope = await this.resolveScope(request);
    const scopeSet = new Set(scope.propertyIds);
    for (const propertyId of propertyIds) {
      if (!scopeSet.has(propertyId)) {
        throw new ForbiddenException(
          `Property ${propertyId} is outside owner scope for this user`,
        );
      }
    }
  }

  private parsePropertyIdsCsv(propertyIdsCsv?: string): string[] {
    if (!propertyIdsCsv) {
      return [];
    }

    return [...new Set(propertyIdsCsv.split(',').map((value) => value.trim()).filter(Boolean))];
  }

  private isDateInRange(date: string, range: OwnerDateRange): boolean {
    return date >= range.from && date <= range.to;
  }

  private isIsoTimestampInRange(isoTimestamp: string, range: OwnerDateRange): boolean {
    const date = isoTimestamp.slice(0, 10);
    return this.isDateInRange(date, range);
  }

  private shiftDateByDays(date: string, days: number): string {
    const value = new Date(`${date}T00:00:00.000Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  }

  private toEpochDay(date: string): number {
    return Math.floor(Date.parse(`${date}T00:00:00.000Z`) / 86_400_000);
  }

  private startOfDayIso(date: string): string {
    return `${date}T00:00:00.000Z`;
  }

  private endOfDayIso(date: string): string {
    return `${date}T23:59:59.999Z`;
  }

  private ageInHours(isoTimestamp: string): number {
    const ageMs = Date.now() - new Date(isoTimestamp).getTime();
    return ageMs > 0 ? ageMs / 3_600_000 : 0;
  }

  private toCurrency(value: number): number {
    return Number(value.toFixed(2));
  }
}
