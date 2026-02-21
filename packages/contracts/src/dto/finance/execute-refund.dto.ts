import { PaymentMethod } from '../../enums/payment-method';

export interface ExecuteRefundDto {
  method: PaymentMethod;
  reference?: string;
  note?: string;
}
