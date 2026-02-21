export const OwnerEvents = {
  OWNER_EXCEPTION_ACKED: 'OWNER_EXCEPTION_ACKED',
  OWNER_NOTE_CREATED: 'OWNER_NOTE_CREATED',
  EXPORT_REQUESTED: 'EXPORT_REQUESTED',
} as const;

export type OwnerEventName = (typeof OwnerEvents)[keyof typeof OwnerEvents];
