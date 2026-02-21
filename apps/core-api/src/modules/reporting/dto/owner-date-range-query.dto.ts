import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class OwnerDateRangeQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  propertyIds?: string;
}
