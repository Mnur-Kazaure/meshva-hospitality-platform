import type {
  ExecuteRefundDto,
  ExecuteRefundResponseDto,
  RefundListItemDto,
} from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';

export async function listApprovedRefunds(propertyId: string): Promise<RefundListItemDto[]> {
  return apiClient.get<RefundListItemDto[]>(`/properties/${propertyId}/refunds?status=APPROVED`);
}

export async function executeRefund(
  propertyId: string,
  refundId: string,
  dto: ExecuteRefundDto,
): Promise<ExecuteRefundResponseDto> {
  return apiClient.post<ExecuteRefundResponseDto>(
    `/properties/${propertyId}/refunds/${refundId}/execute`,
    dto,
    'finance-execute-refund',
  );
}
