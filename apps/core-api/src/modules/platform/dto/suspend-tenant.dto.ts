import { IsString, Length } from 'class-validator';

export class SuspendTenantDto {
  @IsString()
  @Length(5, 200)
  reason!: string;
}
