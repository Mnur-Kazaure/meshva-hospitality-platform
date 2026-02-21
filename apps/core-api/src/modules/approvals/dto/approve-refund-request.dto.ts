import { IsOptional, IsString, Length } from 'class-validator';

export class ApproveRefundRequestDto {
  @IsOptional()
  @IsString()
  @Length(0, 200)
  note?: string;
}
