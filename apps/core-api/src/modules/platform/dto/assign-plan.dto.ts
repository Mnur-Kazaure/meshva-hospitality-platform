import { IsDateString, IsUUID } from 'class-validator';

export class AssignPlanDto {
  @IsUUID()
  subscriptionPlanId!: string;

  @IsDateString()
  effectiveFrom!: string;
}
