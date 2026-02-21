import { ApprovalEntityType, OverrideType } from '@meshva/contracts';
import { Type } from 'class-transformer';
import { IsEnum, IsObject, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateOverrideRequestDto {
  @IsEnum(OverrideType)
  overrideType!: OverrideType;

  @IsEnum(ApprovalEntityType)
  entityType!: ApprovalEntityType;

  @IsUUID()
  entityId!: string;

  @IsString()
  @Length(5, 200)
  reason!: string;

  @IsOptional()
  @Type(() => Object)
  @IsObject()
  requestedValue?: Record<string, unknown>;
}
