import { IsString, Length } from 'class-validator';

export class RejectRequestDto {
  @IsString()
  @Length(5, 200)
  reason!: string;
}
