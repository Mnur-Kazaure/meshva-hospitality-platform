import type {
  ChangePasswordDto,
  GuestLoginDto,
  GuestRegisterDto,
  GuestSessionDto,
} from '../../types/contracts';
import { apiGet, apiPost } from './client';

export function getGuestSession(): Promise<GuestSessionDto> {
  return apiGet<GuestSessionDto>('/guest/me', { retryOnUnauthorized: false });
}

export function loginGuest(dto: GuestLoginDto): Promise<GuestSessionDto> {
  return apiPost<GuestSessionDto>('/guest/auth/login', dto, {
    requireCsrf: false,
    retryOnUnauthorized: false,
  });
}

export function registerGuest(dto: GuestRegisterDto): Promise<GuestSessionDto> {
  return apiPost<GuestSessionDto>('/guest/auth/register', dto, {
    requireCsrf: false,
    retryOnUnauthorized: false,
  });
}

export function logoutGuest(): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>('/guest/auth/logout');
}

export function changeGuestPassword(dto: ChangePasswordDto): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>('/guest/auth/change-password', dto);
}
