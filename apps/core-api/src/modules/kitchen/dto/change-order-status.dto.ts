import { KitchenOrderStatuses } from '@meshva/contracts';
import { IsIn } from 'class-validator';

const allowedStatusTransitions = [
  KitchenOrderStatuses.ACCEPTED,
  KitchenOrderStatuses.IN_PREP,
  KitchenOrderStatuses.READY,
  KitchenOrderStatuses.DELIVERED,
] as const;

export class ChangeOrderStatusDto {
  @IsIn(allowedStatusTransitions)
  toStatus!: (typeof allowedStatusTransitions)[number];
}
