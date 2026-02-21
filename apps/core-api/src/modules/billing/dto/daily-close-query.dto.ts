import { IsDateString, IsOptional } from 'class-validator';

export class DailyCloseQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}
