import { IsDateString, IsString, Length } from 'class-validator';

export class UnlockDayDto {
  @IsDateString()
  date!: string;

  @IsString()
  @Length(10, 300)
  reason!: string;
}
