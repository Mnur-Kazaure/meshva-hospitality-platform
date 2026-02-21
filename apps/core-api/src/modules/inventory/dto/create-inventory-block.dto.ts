import { IsDateString, IsInt, IsString, IsUUID, Length, Min } from 'class-validator';

export class CreateInventoryBlockDto {
  @IsUUID()
  roomTypeId!: string;

  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsInt()
  @Min(1)
  unitsBlocked!: number;

  @IsString()
  @Length(5, 200)
  reason!: string;
}
