import { ApprovalStatus } from '@meshva/contracts';
import { IsEnum, IsOptional } from 'class-validator';

export class ListRefundsDto {
  @IsOptional()
  @IsEnum(ApprovalStatus)
  status?: ApprovalStatus;
}
