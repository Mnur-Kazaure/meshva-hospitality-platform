import type {
  CreateOwnerNoteDto,
  OwnerExceptionDto,
  OwnerExceptionsQueryDto,
  OwnerExceptionsResponseDto,
} from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';

function toExceptionQuery(query?: OwnerExceptionsQueryDto): string {
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
  if (query?.type) {
    params.set('type', query.type);
  }
  if (query?.severity) {
    params.set('severity', query.severity);
  }
  if (query?.acknowledged) {
    params.set('acknowledged', query.acknowledged);
  }

  const payload = params.toString();
  return payload ? `?${payload}` : '';
}

export function listOwnerExceptions(
  query?: OwnerExceptionsQueryDto,
): Promise<OwnerExceptionsResponseDto> {
  return apiClient.get<OwnerExceptionsResponseDto>(
    `/owner/exceptions${toExceptionQuery(query)}`,
  );
}

export function acknowledgeOwnerException(exceptionId: string): Promise<OwnerExceptionDto> {
  return apiClient.post<OwnerExceptionDto>(
    `/owner/exceptions/${exceptionId}/ack`,
    {},
    'owner-exception-ack',
  );
}

export function createOwnerExceptionNote(
  exceptionId: string,
  dto: CreateOwnerNoteDto,
): Promise<{ id: string; text: string; createdAt: string }> {
  return apiClient.post<{ id: string; text: string; createdAt: string }>(
    `/owner/exceptions/${exceptionId}/note`,
    dto,
    'owner-exception-note',
  );
}
