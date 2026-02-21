import { IsString, Length } from 'class-validator';

export class ForceCancelDto {
  @IsString()
  @Length(5, 200)
  reason!: string;
}
