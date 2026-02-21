import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class ChangeRoomDto {
  @IsUUID()
  toRoomId!: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  reason?: string;
}
