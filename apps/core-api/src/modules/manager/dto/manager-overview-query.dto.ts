import { IsDateString, IsOptional } from 'class-validator';

export class ManagerOverviewQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}
