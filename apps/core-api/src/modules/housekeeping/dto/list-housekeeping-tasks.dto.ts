import { HousekeepingTaskStatus } from '@meshva/contracts';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class ListHousekeepingTasksDto {
  @IsOptional()
  @IsEnum(HousekeepingTaskStatus)
  status?: HousekeepingTaskStatus;

  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsOptional()
  @IsBoolean()
  mine?: boolean;
}
