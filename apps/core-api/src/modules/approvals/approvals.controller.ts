import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { FrontDeskPermissions, ManagerPermissions } from '@meshva/contracts';
import { IdempotentOperation } from '../../common/decorators/idempotent.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AppRequest } from '../../common/types/request-context';
import { ApprovalsService } from './approvals.service';
import { ApproveDiscountRequestDto } from './dto/approve-discount-request.dto';
import { ApproveOverrideRequestDto } from './dto/approve-override-request.dto';
import { ApproveRefundRequestDto } from './dto/approve-refund-request.dto';
import { CreateDiscountRequestDto } from './dto/create-discount-request.dto';
import { CreateOverrideRequestDto } from './dto/create-override-request.dto';
import { CreateRefundRequestDto } from './dto/create-refund-request.dto';
import { ListApprovalsDto } from './dto/list-approvals.dto';
import { RejectRequestDto } from './dto/reject-request.dto';

@Controller('properties/:propertyId/approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get()
  @RequirePermissions(ManagerPermissions.APPROVAL_VIEW)
  list(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Query() query: ListApprovalsDto,
  ) {
    return this.approvalsService.list(propertyId, request, query);
  }

  @Post('discount-requests')
  @RequirePermissions(FrontDeskPermissions.DISCOUNT_REQUEST)
  @IdempotentOperation()
  createDiscountRequest(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: CreateDiscountRequestDto,
  ) {
    return this.approvalsService.createDiscountRequest(propertyId, request, dto);
  }

  @Post('discount-requests/:requestId/approve')
  @RequirePermissions(ManagerPermissions.DISCOUNT_APPROVE)
  @IdempotentOperation()
  approveDiscountRequest(
    @Param('propertyId') propertyId: string,
    @Param('requestId') requestId: string,
    @Req() request: AppRequest,
    @Body() dto: ApproveDiscountRequestDto,
  ) {
    return this.approvalsService.approveDiscountRequest(propertyId, request, requestId, dto);
  }

  @Post('discount-requests/:requestId/reject')
  @RequirePermissions(ManagerPermissions.DISCOUNT_APPROVE)
  @IdempotentOperation()
  rejectDiscountRequest(
    @Param('propertyId') propertyId: string,
    @Param('requestId') requestId: string,
    @Req() request: AppRequest,
    @Body() dto: RejectRequestDto,
  ) {
    return this.approvalsService.rejectDiscountRequest(propertyId, request, requestId, dto);
  }

  @Post('refund-requests')
  @RequirePermissions(FrontDeskPermissions.REFUND_REQUEST)
  @IdempotentOperation()
  createRefundRequest(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: CreateRefundRequestDto,
  ) {
    return this.approvalsService.createRefundRequest(propertyId, request, dto);
  }

  @Post('refund-requests/:requestId/approve')
  @RequirePermissions(ManagerPermissions.REFUND_APPROVE)
  @IdempotentOperation()
  approveRefundRequest(
    @Param('propertyId') propertyId: string,
    @Param('requestId') requestId: string,
    @Req() request: AppRequest,
    @Body() dto: ApproveRefundRequestDto,
  ) {
    return this.approvalsService.approveRefundRequest(propertyId, request, requestId, dto);
  }

  @Post('refund-requests/:requestId/reject')
  @RequirePermissions(ManagerPermissions.REFUND_APPROVE)
  @IdempotentOperation()
  rejectRefundRequest(
    @Param('propertyId') propertyId: string,
    @Param('requestId') requestId: string,
    @Req() request: AppRequest,
    @Body() dto: RejectRequestDto,
  ) {
    return this.approvalsService.rejectRefundRequest(propertyId, request, requestId, dto);
  }

  @Post('override-requests')
  @RequirePermissions(FrontDeskPermissions.OVERRIDE_REQUEST)
  @IdempotentOperation()
  createOverrideRequest(
    @Param('propertyId') propertyId: string,
    @Req() request: AppRequest,
    @Body() dto: CreateOverrideRequestDto,
  ) {
    return this.approvalsService.createOverrideRequest(propertyId, request, dto);
  }

  @Post('override-requests/:requestId/approve')
  @RequirePermissions(ManagerPermissions.OVERRIDE_APPROVE)
  @IdempotentOperation()
  approveOverrideRequest(
    @Param('propertyId') propertyId: string,
    @Param('requestId') requestId: string,
    @Req() request: AppRequest,
    @Body() dto: ApproveOverrideRequestDto,
  ) {
    return this.approvalsService.approveOverrideRequest(propertyId, request, requestId, dto);
  }

  @Post('override-requests/:requestId/reject')
  @RequirePermissions(ManagerPermissions.OVERRIDE_APPROVE)
  @IdempotentOperation()
  rejectOverrideRequest(
    @Param('propertyId') propertyId: string,
    @Param('requestId') requestId: string,
    @Req() request: AppRequest,
    @Body() dto: RejectRequestDto,
  ) {
    return this.approvalsService.rejectOverrideRequest(propertyId, request, requestId, dto);
  }
}
