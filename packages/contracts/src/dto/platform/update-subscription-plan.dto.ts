import type { SubscriptionPlanCode } from '../../enums/subscription-plan-code';

export interface UpdateSubscriptionPlanDto {
  code?: SubscriptionPlanCode;
  name?: string;
  description?: string;
  propertyLimit?: number;
  userLimit?: number;
  features?: Record<string, unknown>;
  isActive?: boolean;
}
