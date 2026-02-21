import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class ListInvoicesDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['OPEN', 'CLOSED'])
  status?: 'OPEN' | 'CLOSED';
}
