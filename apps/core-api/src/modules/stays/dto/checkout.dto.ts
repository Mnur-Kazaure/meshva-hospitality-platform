import { IsOptional, IsString, Length } from 'class-validator';

export class CheckoutDto {
  @IsOptional()
  @IsString()
  @Length(0, 300)
  notes?: string;
}
