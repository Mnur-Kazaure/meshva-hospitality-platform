import { ApprovalEntityType } from '../../enums/approval-entity-type';
import { DiscountType } from '../../enums/discount-type';

export interface CreateDiscountRequestDto {
  entityType: ApprovalEntityType.RESERVATION | ApprovalEntityType.STAY;
  entityId: string;
  discountType: DiscountType;
  value: number;
  reason: string;
}
