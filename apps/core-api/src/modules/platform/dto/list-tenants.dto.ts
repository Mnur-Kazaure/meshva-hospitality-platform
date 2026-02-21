import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListTenantsDto {
  @IsOptional()
  @IsString()
  @IsIn(['active', 'suspended', 'pending'])
  status?: 'active' | 'suspended' | 'pending';
}
