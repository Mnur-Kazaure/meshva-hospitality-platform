export const ExceptionSeverity = {
  AMBER: 'AMBER',
  RED: 'RED',
} as const;

export type ExceptionSeverity = (typeof ExceptionSeverity)[keyof typeof ExceptionSeverity];
