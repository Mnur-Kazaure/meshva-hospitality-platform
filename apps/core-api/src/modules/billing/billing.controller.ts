import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { FinancePermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { BillingService } from './billing.service';
import { DailyCloseDto } from './dto/daily-close.dto';
import { DailyCloseQueryDto } from './dto/daily-close-query.dto';
import { FinanceHandoverDto } from './dto/finance-handover.dto';
import { AddAdjustmentDto } from './dto/add-adjustment.dto';
import { ExecuteRefundDto } from './dto/execute-refund.dto';
import { ListInvoicesDto } from './dto/list-invoices.dto';
import { ListPaymentsDto } from './dto/list-payments.dto';
import { ListRefundsDto } from './dto/list-refunds.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@Controller('properties/:propertyId')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('finance/overview')
  @RequirePermissions(FinancePermissions.REPORT_VIEW)
  overview(@Param('propertyId') propertyId: string, @Req() request: AppRequest) {
    return this.billingService.getOverview(propertyId, request);
  }

  @Get('invoices')
  @RequirePermissions(FinancePermissions.PAYMENT_VIEW)
  listInvoices(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Query() query: ListInvoicesDto,
  ) {
    return this.billingService.listInvoices(propertyId, request, query);
  }

  @Get('invoices/:invoiceId')
  @RequirePermissions(FinancePermissions.PAYMENT_VIEW)
  getInvoice(
    @Param('propertyId') propertyId: string,
    @Param('invoiceId') invoiceId: string,
    @Req() request: AppRequest,
  ) {
    return this.billingService.getInvoice(propertyId, request, invoiceId);
  }

  @Post('invoices/:invoiceId/adjustments')
  @RequirePermissions(FinancePermissions.PAYMENT_RECORD)
  @IdempotentOperation()
  addAdjustment(
    @Param('propertyId') propertyId: string,
    @Param('invoiceId') invoiceId: string,
    @Req() request: AppRequest,
    @Body() dto: AddAdjustmentDto,
  ) {
    return this.billingService.addAdjustment(propertyId, request, invoiceId, dto);
  }

  @Get('payments')
  @RequirePermissions(FinancePermissions.PAYMENT_VIEW)
  listPayments(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Query() query: ListPaymentsDto,
  ) {
    return this.billingService.listPayments(propertyId, request, query);
  }

  @Post('payments')
  @RequirePermissions(FinancePermissions.PAYMENT_RECORD)
  @IdempotentOperation()
  recordPayment(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.billingService.recordPayment(propertyId, request, dto);
  }

  @Get('refunds')
  @RequirePermissions(FinancePermissions.PAYMENT_VIEW)
  listRefunds(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Query() query: ListRefundsDto,
  ) {
    return this.billingService.listRefunds(propertyId, request, query);
  }

  @Post('refunds/:refundId/execute')
  @RequirePermissions(FinancePermissions.REFUND_EXECUTE)
  @IdempotentOperation()
  executeRefund(
    @Param('propertyId') propertyId: string,
    @Param('refundId') refundId: string,
    @Req() request: AppRequest,
    @Body() dto: ExecuteRefundDto,
  ) {
    return this.billingService.executeRefund(propertyId, request, refundId, dto);
  }

  @Get('daily-close')
  @RequirePermissions(FinancePermissions.PAYMENT_VIEW)
  dailyCloseStatus(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Query() query: DailyCloseQueryDto,
  ) {
    return this.billingService.getDailyClose(propertyId, request, query);
  }

  @Post('daily-close')
  @RequirePermissions(FinancePermissions.DAILY_CLOSE)
  @IdempotentOperation()
  closeDay(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: DailyCloseDto,
  ) {
    return this.billingService.closeDay(propertyId, request, dto);
  }

  @Post('finance-handover')
  @RequirePermissions(FinancePermissions.SHIFT_HANDOVER_CREATE)
  @IdempotentOperation()
  createFinanceHandover(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: FinanceHandoverDto,
  ) {
    return this.billingService.createFinanceHandover(propertyId, request, dto);
  }
}
