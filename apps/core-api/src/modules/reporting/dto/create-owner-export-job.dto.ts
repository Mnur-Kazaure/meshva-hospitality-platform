import {
  OwnerExportFormat,
  OwnerExportType,
} from '@meshva/contracts';
import { IsDateString, IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class CreateOwnerExportJobDto {
  @IsEnum(OwnerExportType)
  exportType!: OwnerExportType;

  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  propertyIds?: string;

  @IsEnum(OwnerExportFormat)
  format!: OwnerExportFormat;
}
