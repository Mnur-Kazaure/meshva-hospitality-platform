import { IsDateString, IsUUID } from 'class-validator';

export class ListInventoryCalendarDto {
  @IsUUID()
  roomTypeId!: string;

  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}
