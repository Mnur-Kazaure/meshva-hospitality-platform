import { IsString, Length } from 'class-validator';

export class SoftDeleteStaffDto {
  @IsString()
  @Length(5, 200)
  reason!: string;
}
