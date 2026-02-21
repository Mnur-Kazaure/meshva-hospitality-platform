'use client';

import type { CreateOwnerNoteDto, OwnerExceptionDto } from '../../../shared/types/contracts';
import { useAsyncMutation } from '../../../shared/lib/hooks/use-async-mutation';
import {
  acknowledgeOwnerException,
  createOwnerExceptionNote,
} from '../../../entities/owner-exceptions/api/owner-exceptions-api';

export function useAcknowledgeOwnerExceptionMutation() {
  return useAsyncMutation<string, OwnerExceptionDto>(acknowledgeOwnerException, {
    invalidatePrefixes: ['owner-exceptions:', 'owner-overview:', 'owner-properties:'],
  });
}

interface OwnerNoteInput {
  exceptionId: string;
  dto: CreateOwnerNoteDto;
}

export function useOwnerExceptionNoteMutation() {
  return useAsyncMutation<OwnerNoteInput, { id: string; text: string; createdAt: string }>(
    ({ exceptionId, dto }) => createOwnerExceptionNote(exceptionId, dto),
    {
      invalidatePrefixes: ['owner-exceptions:'],
    },
  );
}
