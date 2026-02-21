import { IsString, Length } from 'class-validator';

export class FinalizeNoShowDto {
  @IsString()
  @Length(5, 200)
  reason!: string;
}
