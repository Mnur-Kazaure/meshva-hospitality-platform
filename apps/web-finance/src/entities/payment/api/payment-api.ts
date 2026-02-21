import type { PaymentRecordDto, RecordPaymentDto, RecordPaymentResponseDto } from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';

export async function listPayments(propertyId: string): Promise<PaymentRecordDto[]> {
  return apiClient.get<PaymentRecordDto[]>(`/properties/${propertyId}/payments`);
}

export async function recordPayment(
  propertyId: string,
  dto: RecordPaymentDto,
): Promise<RecordPaymentResponseDto> {
  return apiClient.post<RecordPaymentResponseDto>(
    `/properties/${propertyId}/payments`,
    dto,
    'finance-record-payment',
  );
}
