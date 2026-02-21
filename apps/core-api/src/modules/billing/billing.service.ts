import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApprovalStatus,
  DailyCloseStatus,
  FinanceEvents,
  FolioLineType,
  PaymentMethod,
  PaymentStatus,
} from '@meshva/contracts';
import { randomUUID } from 'crypto';
import { AppRequest } from '../../common/types/request-context';
import { AuditService } from '../audit/audit.service';
import {
  FRONT_DESK_REPOSITORY,
  FrontDeskRepository,
} from '../persistence/repositories/front-desk.repository';
import { DailyCloseDto } from './dto/daily-close.dto';
import { DailyCloseQueryDto } from './dto/daily-close-query.dto';
import { FinanceHandoverDto } from './dto/finance-handover.dto';
import { AddAdjustmentDto } from './dto/add-adjustment.dto';
import { ExecuteRefundDto } from './dto/execute-refund.dto';
import { ListInvoicesDto } from './dto/list-invoices.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';
import { ListRefundsDto } from './dto/list-refunds.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

export interface InvoiceLedgerSummary {
  lineItemsTotal: number;
  paymentsNetTotal: number;
  balanceDue: number;
}

@Injectable()
export class BillingService {
  constructor(
    @Inject(FRONT_DESK_REPOSITORY)
    private readonly repository: FrontDeskRepository,
    private readonly auditService: AuditService,
  ) {}

  async getOverview(propertyId: string, request: AppRequest) {
    const tenantId = request.context.tenantId;
    const today = this.toDateKey(new Date().toISOString());

    const [paymentsToday, invoices, approvedRefunds, dayControl] = await Promise.all([
      this.repository.listPayments({ tenantId, propertyId, date: today }),
      this.repository.listInvoices({ tenantId, propertyId }),
      this.repository.listRefundRequests({
        tenantId,
        propertyId,
        status: ApprovalStatus.APPROVED,
      }),
      this.repository.getDayControl({ tenantId, propertyId, date: today }),
    ]);

    const [outstandingBalance, pendingRefundsCount] = await Promise.all([
      this.sumOutstandingBalances(tenantId, propertyId, invoices),
      this.countPendingRefundExecutions(tenantId, propertyId, approvedRefunds),
    ]);

    const methodTotals = {
      cash: this.roundCurrency(
        paymentsToday
          .filter((payment) => payment.method === PaymentMethod.CASH)
          .reduce((sum, payment) => sum + payment.amount, 0),
      ),
      transfer: this.roundCurrency(
        paymentsToday
          .filter((payment) => payment.method === PaymentMethod.BANK_TRANSFER)
          .reduce((sum, payment) => sum + payment.amount, 0),
      ),
      pos: this.roundCurrency(
        paymentsToday
          .filter((payment) => payment.method === PaymentMethod.POS)
          .reduce((sum, payment) => sum + payment.amount, 0),
      ),
    };

    return {
      date: today,
      revenue: {
        ...methodTotals,
        total: this.roundCurrency(methodTotals.cash + methodTotals.transfer + methodTotals.pos),
      },
      outstandingBalances: outstandingBalance,
      pendingRefundExecutionCount: pendingRefundsCount,
      dailyCloseStatus: dayControl?.isLocked ? DailyCloseStatus.LOCKED : DailyCloseStatus.OPEN,
    };
  }

  async listInvoices(propertyId: string, request: AppRequest, query: ListInvoicesDto) {
    const tenantId = request.context.tenantId;
    const invoices = await this.repository.listInvoices({
      tenantId,
      propertyId,
      search: query.search,
      status: query.status,
    });

    return Promise.all(
      invoices.map(async (invoice) => ({
        ...invoice,
        ledger: await this.getInvoiceLedgerSummary(tenantId, propertyId, invoice.id, invoice),
      })),
    );
  }

  async getInvoice(propertyId: string, request: AppRequest, invoiceId: string) {
    const tenantId = request.context.tenantId;
    const invoice = await this.getInvoiceOrThrow(tenantId, propertyId, invoiceId);
    const [lineItems, payments, ledger] = await Promise.all([
      this.getInvoiceLineItems(tenantId, propertyId, invoice),
      this.repository.listPayments({ tenantId, propertyId, invoiceId }),
      this.getInvoiceLedgerSummary(tenantId, propertyId, invoice.id, invoice),
    ]);

    return {
      ...invoice,
      lineItems,
      payments,
      ledger,
    };
  }

  async addAdjustment(
    propertyId: string,
    request: AppRequest,
    invoiceId: string,
    dto: AddAdjustmentDto,
  ) {
    if (dto.invoiceId !== invoiceId) {
      throw new BadRequestException('invoiceId body value must match route parameter');
    }

    const tenantId = request.context.tenantId;
    await this.assertDayOpen(tenantId, propertyId, this.toDateKey(new Date().toISOString()));

    const invoice = await this.getInvoiceOrThrow(tenantId, propertyId, invoiceId);
    if (invoice.status !== 'OPEN') {
      throw new BadRequestException('Invoice is closed and cannot be adjusted');
    }

    if (![FolioLineType.CHARGE, FolioLineType.ADJUSTMENT].includes(dto.type)) {
      throw new BadRequestException('Finance adjustments only support CHARGE or ADJUSTMENT line types');
    }

    if (dto.amount === 0) {
      throw new BadRequestException('Adjustment amount cannot be zero');
    }

    if (dto.type === FolioLineType.CHARGE && dto.amount < 0) {
      throw new BadRequestException('CHARGE line items must be positive');
    }

    const { entityType, entityId } = this.resolveInvoiceEntity(invoice);
    const now = new Date().toISOString();
    const lineItem = await this.repository.createFolioLineItem({
      lineItem: {
        id: randomUUID(),
        tenantId,
        propertyId,
        invoiceId: invoice.id,
        entityType,
        entityId,
        lineType: dto.type,
        amount: this.roundCurrency(dto.amount),
        currency: invoice.currency,
        description: dto.description,
        createdByUserId: request.context.userId,
        createdAt: now,
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: FinanceEvents.FOLIO_ADJUSTMENT_ADDED,
      entityType: 'FolioLineItem',
      entityId: lineItem.id,
      propertyId,
      afterJson: {
        ...lineItem,
        reason: dto.reason,
      },
    });

    return {
      lineItem,
      ledger: await this.getInvoiceLedgerSummary(tenantId, propertyId, invoice.id, invoice),
    };
  }

  async listPayments(propertyId: string, request: AppRequest, query: ListPaymentsDto) {
    return this.repository.listPayments({
      tenantId: request.context.tenantId,
      propertyId,
      invoiceId: query.invoiceId,
      date: query.date ? this.toDateKey(query.date) : undefined,
    });
  }

  async recordPayment(propertyId: string, request: AppRequest, dto: RecordPaymentDto) {
    const tenantId = request.context.tenantId;
    await this.assertDayOpen(tenantId, propertyId, this.toDateKey(new Date().toISOString()));

    const invoice = await this.getInvoiceOrThrow(tenantId, propertyId, dto.invoiceId);
    const beforeLedger = await this.getInvoiceLedgerSummary(tenantId, propertyId, invoice.id, invoice);
    if (beforeLedger.balanceDue <= 0) {
      throw new BadRequestException('Invoice has no outstanding balance');
    }

    if (dto.amount > beforeLedger.balanceDue) {
      throw new BadRequestException('Payment amount cannot exceed outstanding balance');
    }

    const now = new Date().toISOString();
    const payment = await this.repository.createPayment({
      payment: {
        id: randomUUID(),
        tenantId,
        propertyId,
        invoiceId: invoice.id,
        method: dto.method,
        amount: this.roundCurrency(dto.amount),
        paymentType: 'PAYMENT',
        status: PaymentStatus.RECORDED,
        reference: dto.reference,
        note: dto.note,
        createdByUserId: request.context.userId,
        createdAt: now,
        updatedAt: now,
      },
    });

    const afterLedger = await this.getInvoiceLedgerSummary(tenantId, propertyId, invoice.id, invoice);
    const nextStatus = afterLedger.balanceDue <= 0 ? 'CLOSED' : 'OPEN';
    if (invoice.status !== nextStatus) {
      const beforeInvoice = { ...invoice };
      invoice.status = nextStatus;
      invoice.updatedAt = now;
      const updatedInvoice = await this.repository.updateInvoice({ invoice });
      await this.auditService.recordMutation(request.context, {
        action: FinanceEvents.PAYMENT_RECORDED,
        entityType: 'Invoice',
        entityId: updatedInvoice.id,
        propertyId,
        beforeJson: beforeInvoice,
        afterJson: updatedInvoice,
      });
    }

    await this.auditService.recordMutation(request.context, {
      action: FinanceEvents.PAYMENT_RECORDED,
      entityType: 'Payment',
      entityId: payment.id,
      propertyId,
      afterJson: payment,
    });

    await this.repository.enqueue('messaging', 'messaging.send', {
      tenantId,
      propertyId,
      type: 'PAYMENT_RECEIPT',
      invoiceId: invoice.id,
      paymentId: payment.id,
    });

    return {
      payment,
      outstandingBefore: beforeLedger.balanceDue,
      outstandingAfter: afterLedger.balanceDue,
      invoiceStatus: nextStatus,
    };
  }

  async listRefunds(propertyId: string, request: AppRequest, query: ListRefundsDto) {
    const tenantId = request.context.tenantId;
    const refunds = await this.repository.listRefundRequests({
      tenantId,
      propertyId,
      status: query.status ?? ApprovalStatus.APPROVED,
    });

    return Promise.all(
      refunds.map(async (refund) => {
        const execution = await this.repository.getRefundExecutionByRequest({
          tenantId,
          propertyId,
          refundRequestId: refund.id,
        });
        return {
          ...refund,
          execution,
        };
      }),
    );
  }

  async executeRefund(
    propertyId: string,
    request: AppRequest,
    refundId: string,
    dto: ExecuteRefundDto,
  ) {
    const tenantId = request.context.tenantId;
    await this.assertDayOpen(tenantId, propertyId, this.toDateKey(new Date().toISOString()));

    const refundRequest = await this.repository.getRefundRequest({
      tenantId,
      propertyId,
      requestId: refundId,
    });
    if (!refundRequest) {
      throw new NotFoundException('Refund request not found');
    }

    if (refundRequest.status !== ApprovalStatus.APPROVED) {
      throw new BadRequestException('Refund must be APPROVED before execution');
    }

    const existingExecution = await this.repository.getRefundExecutionByRequest({
      tenantId,
      propertyId,
      refundRequestId: refundRequest.id,
    });
    if (existingExecution) {
      const existingPayment = await this.repository.getPayment({
        tenantId,
        propertyId,
        paymentId: existingExecution.paymentId,
      });
      return {
        execution: existingExecution,
        payment: existingPayment,
        alreadyExecuted: true,
      };
    }

    const invoice = await this.getInvoiceOrThrow(tenantId, propertyId, refundRequest.invoiceId);
    const ledger = await this.getInvoiceLedgerSummary(tenantId, propertyId, invoice.id, invoice);
    const netPaid = this.roundCurrency(ledger.paymentsNetTotal);
    if (refundRequest.amount > netPaid) {
      throw new BadRequestException('Refund amount exceeds net recorded payments');
    }

    const now = new Date().toISOString();
    const payment = await this.repository.createPayment({
      payment: {
        id: randomUUID(),
        tenantId,
        propertyId,
        invoiceId: invoice.id,
        method: dto.method,
        amount: -Math.abs(this.roundCurrency(refundRequest.amount)),
        paymentType: 'REFUND',
        status: PaymentStatus.RECORDED,
        reference: dto.reference,
        note: dto.note,
        createdByUserId: request.context.userId,
        createdAt: now,
        updatedAt: now,
      },
    });

    const execution = await this.repository.createRefundExecution({
      execution: {
        id: randomUUID(),
        tenantId,
        propertyId,
        refundRequestId: refundRequest.id,
        paymentId: payment.id,
        method: dto.method,
        amount: this.roundCurrency(refundRequest.amount),
        reference: dto.reference,
        note: dto.note,
        executedByUserId: request.context.userId,
        createdAt: now,
      },
    });

    const afterLedger = await this.getInvoiceLedgerSummary(tenantId, propertyId, invoice.id, invoice);
    const nextStatus = afterLedger.balanceDue <= 0 ? 'CLOSED' : 'OPEN';
    if (invoice.status !== nextStatus) {
      invoice.status = nextStatus;
      invoice.updatedAt = now;
      await this.repository.updateInvoice({ invoice });
    }

    await this.auditService.recordMutation(request.context, {
      action: FinanceEvents.REFUND_EXECUTED,
      entityType: 'RefundExecution',
      entityId: execution.id,
      propertyId,
      afterJson: {
        execution,
        payment,
      },
    });

    await this.repository.enqueue('messaging', 'messaging.send', {
      tenantId,
      propertyId,
      type: 'REFUND_CONFIRMATION',
      refundRequestId: refundRequest.id,
      executionId: execution.id,
    });

    return {
      execution,
      payment,
      alreadyExecuted: false,
    };
  }

  async getDailyClose(propertyId: string, request: AppRequest, query: DailyCloseQueryDto) {
    const tenantId = request.context.tenantId;
    const targetDate = this.toDateKey(query.date ?? new Date().toISOString());

    const [report, dayControl, expected] = await Promise.all([
      this.repository.getDailyCloseReport({
        tenantId,
        propertyId,
        date: targetDate,
      }),
      this.repository.getDayControl({
        tenantId,
        propertyId,
        date: targetDate,
      }),
      this.computeExpectedTotals(tenantId, propertyId, targetDate),
    ]);

    return {
      date: targetDate,
      status:
        report?.status ??
        (dayControl?.isLocked ? DailyCloseStatus.LOCKED : DailyCloseStatus.OPEN),
      expected,
      report,
      locked: Boolean(dayControl?.isLocked),
    };
  }

  async closeDay(propertyId: string, request: AppRequest, dto: DailyCloseDto) {
    const tenantId = request.context.tenantId;
    const targetDate = this.toDateKey(dto.date);

    const existingControl = await this.repository.getDayControl({
      tenantId,
      propertyId,
      date: targetDate,
    });
    if (existingControl?.isLocked) {
      throw new BadRequestException(`Day ${targetDate} is already locked`);
    }

    const expected = await this.computeExpectedTotals(tenantId, propertyId, targetDate);
    const now = new Date().toISOString();
    const existingReport = await this.repository.getDailyCloseReport({
      tenantId,
      propertyId,
      date: targetDate,
    });

    const reportPayload = {
      id: existingReport?.id ?? randomUUID(),
      tenantId,
      propertyId,
      date: targetDate,
      status: DailyCloseStatus.LOCKED,
      expectedCash: expected.cash,
      expectedTransfer: expected.transfer,
      expectedPos: expected.pos,
      countedCash: this.roundCurrency(dto.cashCounted),
      countedTransfer: this.roundCurrency(dto.transferCounted),
      countedPos: this.roundCurrency(dto.posCounted),
      varianceCash: this.roundCurrency(dto.cashCounted - expected.cash),
      varianceTransfer: this.roundCurrency(dto.transferCounted - expected.transfer),
      variancePos: this.roundCurrency(dto.posCounted - expected.pos),
      note: dto.note,
      closedByUserId: request.context.userId,
      createdAt: existingReport?.createdAt ?? now,
      updatedAt: now,
    };

    const report = existingReport
      ? await this.repository.updateDailyCloseReport({ report: reportPayload })
      : await this.repository.createDailyCloseReport({ report: reportPayload });

    const dayControl = await this.repository.upsertDayControl({
      control: {
        id: existingControl?.id ?? randomUUID(),
        tenantId,
        propertyId,
        date: targetDate,
        isLocked: true,
        createdAt: existingControl?.createdAt ?? now,
        updatedAt: now,
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: FinanceEvents.DAILY_CLOSE_COMPLETED,
      entityType: 'DailyCloseReport',
      entityId: report.id,
      propertyId,
      beforeJson: existingReport,
      afterJson: {
        ...report,
        dayLocked: dayControl.isLocked,
      },
    });

    await this.repository.enqueue('reporting', 'reporting.managerDailySummary.enqueue', {
      tenantId,
      propertyId,
      date: targetDate,
      reportId: report.id,
    });
    await this.repository.enqueue('reporting', 'reporting.ownerDigest.enqueue', {
      tenantId,
      propertyId,
      date: targetDate,
      reportId: report.id,
    });

    return {
      report,
      dayControl,
    };
  }

  async createFinanceHandover(propertyId: string, request: AppRequest, dto: FinanceHandoverDto) {
    const tenantId = request.context.tenantId;
    const today = this.toDateKey(new Date().toISOString());
    const dayControl = await this.repository.getDayControl({
      tenantId,
      propertyId,
      date: today,
    });

    if (!dayControl?.isLocked) {
      throw new BadRequestException('Daily Close must be completed before finance handover');
    }

    const now = new Date().toISOString();
    const handover = await this.repository.createFinanceShiftHandover({
      handover: {
        id: randomUUID(),
        tenantId,
        propertyId,
        userId: request.context.userId,
        shiftType: dto.shiftType,
        cashOnHand: this.roundCurrency(dto.cashOnHand),
        pendingRefunds: dto.pendingRefunds ?? 0,
        notes: dto.notes,
        createdAt: now,
      },
    });

    await this.auditService.recordMutation(request.context, {
      action: FinanceEvents.FINANCE_SHIFT_HANDOVER_CREATED,
      entityType: 'FinanceShiftHandover',
      entityId: handover.id,
      propertyId,
      afterJson: handover,
    });

    return handover;
  }

  private async getInvoiceOrThrow(tenantId: string, propertyId: string, invoiceId: string) {
    const invoice = await this.repository.getInvoice({
      tenantId,
      propertyId,
      invoiceId,
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  private async getInvoiceLineItems(
    tenantId: string,
    propertyId: string,
    invoice: { id: string; stayId?: string; reservationId?: string },
  ) {
    const [byInvoice, byStay, byReservation] = await Promise.all([
      this.repository.listFolioLineItems({
        tenantId,
        propertyId,
        invoiceId: invoice.id,
      }),
      invoice.stayId
        ? this.repository.listFolioLineItems({
            tenantId,
            propertyId,
            entityType: 'STAY',
            entityId: invoice.stayId,
          })
        : Promise.resolve([]),
      invoice.reservationId
        ? this.repository.listFolioLineItems({
            tenantId,
            propertyId,
            entityType: 'RESERVATION',
            entityId: invoice.reservationId,
          })
        : Promise.resolve([]),
    ]);

    const merged = new Map<string, (typeof byInvoice)[number]>();
    for (const lineItem of [...byInvoice, ...byStay, ...byReservation]) {
      merged.set(lineItem.id, lineItem);
    }

    return Array.from(merged.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  private async getInvoiceLedgerSummary(
    tenantId: string,
    propertyId: string,
    invoiceId: string,
    invoice?: { id: string; stayId?: string; reservationId?: string },
  ): Promise<InvoiceLedgerSummary> {
    const resolvedInvoice = invoice ?? (await this.getInvoiceOrThrow(tenantId, propertyId, invoiceId));

    const [lineItems, payments] = await Promise.all([
      this.getInvoiceLineItems(tenantId, propertyId, resolvedInvoice),
      this.repository.listPayments({ tenantId, propertyId, invoiceId: resolvedInvoice.id }),
    ]);

    const lineItemsTotal = this.roundCurrency(
      lineItems.reduce((sum, item) => sum + item.amount, 0),
    );
    const paymentsNetTotal = this.roundCurrency(
      payments.reduce((sum, payment) => sum + payment.amount, 0),
    );

    return {
      lineItemsTotal,
      paymentsNetTotal,
      balanceDue: this.roundCurrency(lineItemsTotal - paymentsNetTotal),
    };
  }

  private async computeExpectedTotals(tenantId: string, propertyId: string, date: string) {
    const payments = await this.repository.listPayments({
      tenantId,
      propertyId,
      date,
    });

    return {
      cash: this.roundCurrency(
        payments
          .filter((payment) => payment.method === PaymentMethod.CASH)
          .reduce((sum, payment) => sum + payment.amount, 0),
      ),
      transfer: this.roundCurrency(
        payments
          .filter((payment) => payment.method === PaymentMethod.BANK_TRANSFER)
          .reduce((sum, payment) => sum + payment.amount, 0),
      ),
      pos: this.roundCurrency(
        payments
          .filter((payment) => payment.method === PaymentMethod.POS)
          .reduce((sum, payment) => sum + payment.amount, 0),
      ),
    };
  }

  private async sumOutstandingBalances(
    tenantId: string,
    propertyId: string,
    invoices: Array<{ id: string; stayId?: string; reservationId?: string; status: 'OPEN' | 'CLOSED' }>,
  ) {
    const ledgers = await Promise.all(
      invoices.map((invoice) =>
        this.getInvoiceLedgerSummary(tenantId, propertyId, invoice.id, invoice),
      ),
    );

    return this.roundCurrency(
      ledgers.reduce((sum, ledger, index) => {
        if (invoices[index].status !== 'OPEN') {
          return sum;
        }
        return sum + Math.max(ledger.balanceDue, 0);
      }, 0),
    );
  }

  private async countPendingRefundExecutions(
    tenantId: string,
    propertyId: string,
    refunds: Array<{ id: string }>,
  ) {
    const executions = await Promise.all(
      refunds.map((refund) =>
        this.repository.getRefundExecutionByRequest({
          tenantId,
          propertyId,
          refundRequestId: refund.id,
        }),
      ),
    );

    return executions.filter((execution) => !execution).length;
  }

  private async assertDayOpen(tenantId: string, propertyId: string, date: string) {
    const control = await this.repository.getDayControl({
      tenantId,
      propertyId,
      date,
    });

    if (control?.isLocked) {
      throw new BadRequestException(`Financial records for ${date} are locked`);
    }
  }

  private resolveInvoiceEntity(invoice: { reservationId?: string; stayId?: string }) {
    if (invoice.stayId) {
      return { entityType: 'STAY' as const, entityId: invoice.stayId };
    }

    if (invoice.reservationId) {
      return { entityType: 'RESERVATION' as const, entityId: invoice.reservationId };
    }

    throw new BadRequestException('Invoice must be linked to reservation or stay');
  }

  private toDateKey(value: string) {
    return value.slice(0, 10);
  }

  private roundCurrency(value: number) {
    return Number(value.toFixed(2));
  }
}
