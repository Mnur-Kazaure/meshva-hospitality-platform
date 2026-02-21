import type { PaymentRecordDto } from './payment-record.dto';

export interface RecordPaymentResponseDto {
  payment: PaymentRecordDto;
  outstandingBefore: number;
  outstandingAfter: number;
  invoiceStatus: 'OPEN' | 'CLOSED';
}
