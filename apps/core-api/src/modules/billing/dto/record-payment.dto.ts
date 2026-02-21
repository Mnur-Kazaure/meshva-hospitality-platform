import { PaymentMethod } from '@meshva/contracts';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class RecordPaymentDto {
  @IsUUID()
  invoiceId!: string;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsNumber()
  @Min(0.01)
  @Max(100000000)
  amount!: number;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  reference?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  note?: string;
}
