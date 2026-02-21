export const SubscriptionPlanCode = {
  STARTER: 'STARTER',
  STANDARD: 'STANDARD',
  PRO: 'PRO',
  CUSTOM: 'CUSTOM',
} as const;

export type SubscriptionPlanCode =
  (typeof SubscriptionPlanCode)[keyof typeof SubscriptionPlanCode];
