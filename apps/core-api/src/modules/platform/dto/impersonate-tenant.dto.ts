import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class ImpersonateTenantDto {
  @IsUUID()
  targetUserId!: string;

  @IsOptional()
  @IsString()
  @Length(5, 200)
  reason?: string;
}
