import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class ListPaymentsDto {
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
