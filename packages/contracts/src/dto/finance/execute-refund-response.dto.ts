import type { PaymentRecordDto } from './payment-record.dto';
import type { RefundExecutionDto } from './refund-list-item.dto';

export interface ExecuteRefundResponseDto {
  execution: RefundExecutionDto;
  payment: PaymentRecordDto | undefined;
  alreadyExecuted: boolean;
}
