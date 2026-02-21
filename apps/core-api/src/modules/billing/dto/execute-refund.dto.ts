import { PaymentMethod } from '@meshva/contracts';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class ExecuteRefundDto {
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  reference?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  note?: string;
}
