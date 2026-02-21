import { IsBoolean, IsObject, IsOptional, IsString, Length } from 'class-validator';

export class UpsertFeatureFlagDto {
  @IsString()
  @Length(3, 120)
  key!: string;

  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
