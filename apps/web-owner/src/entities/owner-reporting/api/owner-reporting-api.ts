import type {
  OwnerDateRangeQueryDto,
  OwnerFinancialSummaryResponseDto,
  OwnerOperationsSummaryResponseDto,
  OwnerOverviewResponseDto,
  OwnerPropertiesResponseDto,
} from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';

function toOwnerRangeQuery(query?: OwnerDateRangeQueryDto): string {
  const params = new URLSearchParams();
  if (query?.from) {
    params.set('from', query.from);
  }
  if (query?.to) {
    params.set('to', query.to);
  }
  if (query?.propertyIds) {
    params.set('propertyIds', query.propertyIds);
  }

  const payload = params.toString();
  return payload ? `?${payload}` : '';
}

export function getOwnerOverview(
  query?: OwnerDateRangeQueryDto,
): Promise<OwnerOverviewResponseDto> {
  return apiClient.get<OwnerOverviewResponseDto>(`/owner/overview${toOwnerRangeQuery(query)}`);
}

export function getOwnerProperties(
  query?: OwnerDateRangeQueryDto,
): Promise<OwnerPropertiesResponseDto> {
  return apiClient.get<OwnerPropertiesResponseDto>(`/owner/properties${toOwnerRangeQuery(query)}`);
}

export function getOwnerFinancialSummary(
  query?: OwnerDateRangeQueryDto,
): Promise<OwnerFinancialSummaryResponseDto> {
  return apiClient.get<OwnerFinancialSummaryResponseDto>(
    `/owner/financial-summary${toOwnerRangeQuery(query)}`,
  );
}

export function getOwnerOperationsSummary(
  query?: OwnerDateRangeQueryDto,
): Promise<OwnerOperationsSummaryResponseDto> {
  return apiClient.get<OwnerOperationsSummaryResponseDto>(
    `/owner/operations-summary${toOwnerRangeQuery(query)}`,
  );
}
