'use client';

import type {
  EndImpersonationDto,
  PlatformImpersonationSessionDto,
  PlatformResetUserPasswordResponseDto,
  ResetUserPasswordDto,
} from '../../../shared/types/contracts';
import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import {
  endPlatformImpersonation,
  resetPlatformUserPassword,
} from '../../../entities/platform-support/api/platform-support-api';

interface EndImpersonationInput {
  sessionId: string;
  dto: EndImpersonationDto;
}

export function useEndPlatformImpersonationMutation() {
  return useAsyncMutation<EndImpersonationInput, PlatformImpersonationSessionDto>(
    ({ sessionId, dto }) => endPlatformImpersonation(sessionId, dto),
    {
      invalidatePrefixes: ['platform-tenants:', 'platform-tenant-details:'],
    },
  );
}

interface ResetPasswordInput {
  userId: string;
  dto: ResetUserPasswordDto;
}

export function useResetPlatformUserPasswordMutation() {
  return useAsyncMutation<ResetPasswordInput, PlatformResetUserPasswordResponseDto>(
    ({ userId, dto }) => resetPlatformUserPassword(userId, dto),
    {
      invalidatePrefixes: ['platform-tenant-details:', 'platform-audit:'],
    },
  );
}
