import { FolioLineType } from '@meshva/contracts';
import { IsEnum, IsNumber, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class AddAdjustmentDto {
  @IsUUID()
  invoiceId!: string;

  @IsEnum(FolioLineType)
  type!: FolioLineType;

  @IsNumber()
  @Min(-100000000)
  @Max(100000000)
  amount!: number;

  @IsString()
  @Length(5, 200)
  description!: string;

  @IsString()
  @Length(5, 200)
  reason!: string;
}
