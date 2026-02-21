import type {
  CreateStaffDto,
  DeactivateStaffDto,
  ListStaffDto,
  SoftDeleteStaffDto,
  StaffCreateResponseDto,
  StaffListResponseDto,
  StaffResetInviteResponseDto,
  StaffResetPasswordDto,
  StaffStatusResponseDto,
  StaffUpdateResponseDto,
  UpdateStaffDto,
} from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';

function toListQuery(query?: ListStaffDto): string {
  const params = new URLSearchParams();
  if (query?.status?.trim()) {
    params.set('status', query.status.trim());
  }
  if (query?.q?.trim()) {
    params.set('q', query.q.trim());
  }

  const payload = params.toString();
  return payload ? `?${payload}` : '';
}

export function listStaff(propertyId: string, query?: ListStaffDto): Promise<StaffListResponseDto> {
  return apiClient.get<StaffListResponseDto>(`/properties/${propertyId}/staff${toListQuery(query)}`);
}

export function createStaff(propertyId: string, dto: CreateStaffDto): Promise<StaffCreateResponseDto> {
  return apiClient.post<StaffCreateResponseDto>(`/properties/${propertyId}/staff`, dto, 'staff-create');
}

export function updateStaff(
  propertyId: string,
  userId: string,
  dto: UpdateStaffDto,
): Promise<StaffUpdateResponseDto> {
  return apiClient.patch<StaffUpdateResponseDto>(
    `/properties/${propertyId}/staff/${userId}`,
    dto,
    'staff-update',
  );
}

export function deactivateStaff(
  propertyId: string,
  userId: string,
  dto: DeactivateStaffDto,
): Promise<StaffStatusResponseDto> {
  return apiClient.post<StaffStatusResponseDto>(
    `/properties/${propertyId}/staff/${userId}/deactivate`,
    dto,
    'staff-deactivate',
  );
}

export function activateStaff(propertyId: string, userId: string): Promise<StaffStatusResponseDto> {
  return apiClient.post<StaffStatusResponseDto>(
    `/properties/${propertyId}/staff/${userId}/activate`,
    {},
    'staff-activate',
  );
}

export function resetStaffInvite(
  propertyId: string,
  userId: string,
  dto?: StaffResetPasswordDto,
): Promise<StaffResetInviteResponseDto> {
  return apiClient.post<StaffResetInviteResponseDto>(
    `/properties/${propertyId}/staff/${userId}/reset-invite`,
    dto ?? {},
    'staff-reset-invite',
  );
}

export function softDeleteStaff(
  propertyId: string,
  userId: string,
  dto: SoftDeleteStaffDto,
): Promise<StaffStatusResponseDto> {
  return apiClient.post<StaffStatusResponseDto>(
    `/properties/${propertyId}/staff/${userId}/soft-delete`,
    dto,
    'staff-soft-delete',
  );
}
