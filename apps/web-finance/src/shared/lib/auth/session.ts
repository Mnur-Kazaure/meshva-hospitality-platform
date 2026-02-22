import type {
  AcceptStaffInviteDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  StaffLoginDto,
  StaffSessionDto,
} from '../../types/contracts';
import { apiGet, apiPost } from './client';

export function getStaffSession(): Promise<StaffSessionDto> {
  return apiGet<StaffSessionDto>('/auth/me', { retryOnUnauthorized: false });
}

export function loginStaff(dto: StaffLoginDto): Promise<StaffSessionDto> {
  return apiPost<StaffSessionDto>('/auth/login', dto, {
    requireCsrf: false,
    retryOnUnauthorized: false,
  });
}

export function logoutStaff(): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>('/auth/logout');
}

export function logoutAllStaff(): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>('/auth/logout-all');
}

export function changeStaffPassword(dto: ChangePasswordDto): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>('/auth/change-password', dto);
}

export function forgotStaffPassword(dto: ForgotPasswordDto): Promise<{ accepted: boolean }> {
  return apiPost<{ accepted: boolean }>('/auth/forgot-password', dto, {
    requireCsrf: false,
    retryOnUnauthorized: false,
  });
}

export function resetStaffPassword(dto: ResetPasswordDto): Promise<StaffSessionDto> {
  return apiPost<StaffSessionDto>('/auth/reset-password', dto, {
    requireCsrf: false,
    retryOnUnauthorized: false,
  });
}

export function acceptStaffInvite(dto: AcceptStaffInviteDto): Promise<StaffSessionDto> {
  return apiPost<StaffSessionDto>('/auth/invites/accept', dto, {
    requireCsrf: false,
    retryOnUnauthorized: false,
  });
}
