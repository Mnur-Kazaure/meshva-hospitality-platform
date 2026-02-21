import type { PaymentMethod } from '../../enums/payment-method';
import type { PaymentStatus } from '../../enums/payment-status';

export interface PaymentRecordDto {
  id: string;
  tenantId: string;
  propertyId: string;
  invoiceId: string;
  method: PaymentMethod;
  amount: number;
  paymentType: 'PAYMENT' | 'REFUND';
  status: PaymentStatus;
  reference?: string;
  note?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}
