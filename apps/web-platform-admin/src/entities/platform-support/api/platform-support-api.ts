import type {
  EndImpersonationDto,
  PlatformImpersonationSessionDto,
  PlatformResetUserPasswordResponseDto,
  ResetUserPasswordDto,
} from '../../../shared/types/contracts';
import { apiClient } from '../../../shared/lib/api/client';

export function endPlatformImpersonation(
  sessionId: string,
  dto: EndImpersonationDto,
): Promise<PlatformImpersonationSessionDto> {
  return apiClient.post<PlatformImpersonationSessionDto>(
    `/platform/impersonations/${sessionId}/end`,
    dto,
    'platform-impersonation-end',
  );
}

export function resetPlatformUserPassword(
  userId: string,
  dto: ResetUserPasswordDto,
): Promise<PlatformResetUserPasswordResponseDto> {
  return apiClient.post<PlatformResetUserPasswordResponseDto>(
    `/platform/users/${userId}/reset-password`,
    dto,
    'platform-user-reset-password',
  );
}
