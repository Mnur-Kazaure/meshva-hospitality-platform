import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListStaffDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'deactivated', 'soft_deleted', 'disabled'])
  status?: string;
}
