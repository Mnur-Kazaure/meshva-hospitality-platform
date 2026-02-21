import { ApprovalEntityType } from '../../enums/approval-entity-type';
import { OverrideType } from '../../enums/override-type';

export interface CreateOverrideRequestDto {
  overrideType: OverrideType;
  entityType: ApprovalEntityType;
  entityId: string;
  reason: string;
  requestedValue?: Record<string, unknown>;
}
