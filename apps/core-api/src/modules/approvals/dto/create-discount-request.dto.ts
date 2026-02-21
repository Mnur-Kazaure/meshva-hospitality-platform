import { ApprovalEntityType, DiscountType } from '@meshva/contracts';
import { IsEnum, IsNumber, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class CreateDiscountRequestDto {
  @IsEnum({
    [ApprovalEntityType.RESERVATION]: ApprovalEntityType.RESERVATION,
    [ApprovalEntityType.STAY]: ApprovalEntityType.STAY,
  })
  entityType!: ApprovalEntityType.RESERVATION | ApprovalEntityType.STAY;

  @IsUUID()
  entityId!: string;

  @IsEnum(DiscountType)
  discountType!: DiscountType;

  @IsNumber()
  @Min(0.01)
  @Max(100000000)
  value!: number;

  @IsString()
  @Length(5, 200)
  reason!: string;
}
