import { IsNumber, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class CreateRefundRequestDto {
  @IsUUID()
  invoiceId!: string;

  @IsNumber()
  @Min(0.01)
  @Max(100000000)
  amount!: number;

  @IsString()
  @Length(5, 200)
  reason!: string;
}
