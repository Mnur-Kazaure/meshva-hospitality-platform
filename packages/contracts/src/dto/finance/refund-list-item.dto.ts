import type { ApprovalStatus } from '../../enums/approval-status';
import type { PaymentMethod } from '../../enums/payment-method';

export interface RefundExecutionDto {
  id: string;
  tenantId: string;
  propertyId: string;
  refundRequestId: string;
  paymentId: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  note?: string;
  executedByUserId: string;
  createdAt: string;
}

export interface RefundListItemDto {
  id: string;
  tenantId: string;
  propertyId: string;
  invoiceId: string;
  amount: number;
  reason: string;
  status: ApprovalStatus;
  requestedByUserId: string;
  approvedByUserId?: string;
  rejectedByUserId?: string;
  note?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  execution?: RefundExecutionDto;
}
