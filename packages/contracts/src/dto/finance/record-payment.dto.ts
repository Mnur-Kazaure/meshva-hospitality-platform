import { PaymentMethod } from '../../enums/payment-method';

export interface RecordPaymentDto {
  invoiceId: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  note?: string;
}
