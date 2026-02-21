import { IsDateString, IsInt, IsString, IsUUID, Length, Min } from 'class-validator';

export class CreateInventoryOverrideDto {
  @IsUUID()
  roomTypeId!: string;

  @IsDateString()
  date!: string;

  @IsInt()
  @Min(0)
  newAvailableUnits!: number;

  @IsString()
  @Length(5, 200)
  reason!: string;
}
