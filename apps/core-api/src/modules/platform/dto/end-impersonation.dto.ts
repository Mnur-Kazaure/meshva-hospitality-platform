import { IsOptional, IsString, Length } from 'class-validator';

export class EndImpersonationDto {
  @IsOptional()
  @IsString()
  @Length(3, 200)
  reason?: string;
}
