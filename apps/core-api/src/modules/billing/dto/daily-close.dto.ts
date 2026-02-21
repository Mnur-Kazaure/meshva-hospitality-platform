import { IsDateString, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class DailyCloseDto {
  @IsDateString()
  date!: string;

  @IsNumber()
  @Min(-100000000)
  @Max(100000000)
  cashCounted!: number;

  @IsNumber()
  @Min(-100000000)
  @Max(100000000)
  transferCounted!: number;

  @IsNumber()
  @Min(-100000000)
  @Max(100000000)
  posCounted!: number;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;
}
