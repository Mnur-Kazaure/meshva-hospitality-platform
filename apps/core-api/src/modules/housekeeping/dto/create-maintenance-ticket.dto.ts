import { MaintenanceSeverity } from '@meshva/contracts';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateMaintenanceTicketDto {
  @IsUUID()
  roomId!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(100)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description!: string;

  @IsEnum(MaintenanceSeverity)
  severity!: MaintenanceSeverity;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoUrl?: string;
}
