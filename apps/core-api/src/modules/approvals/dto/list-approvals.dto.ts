import { ApprovalStatus, ApprovalType } from '@meshva/contracts';
import { IsEnum, IsOptional } from 'class-validator';

export class ListApprovalsDto {
  @IsOptional()
  @IsEnum(ApprovalType)
  type?: ApprovalType;

  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;
}
