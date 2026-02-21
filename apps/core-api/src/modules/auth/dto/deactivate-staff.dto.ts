import { IsString, Length } from 'class-validator';

export class DeactivateStaffDto {
  @IsString()
  @Length(5, 200)
  reason!: string;
}
