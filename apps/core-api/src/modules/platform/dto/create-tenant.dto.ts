import { Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';

export class CreateInitialOwnerDto {
  @IsString()
  @Length(2, 120)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Length(5, 40)
  phone!: string;
}

export class CreateTenantDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsEmail()
  contactEmail!: string;

  @IsString()
  @Length(5, 40)
  contactPhone!: string;

  @IsString()
  @Length(2, 2)
  country!: string;

  @IsString()
  @Length(2, 80)
  state!: string;

  @IsString()
  @Length(2, 80)
  timezone!: string;

  @IsUUID()
  subscriptionPlanId!: string;

  @IsString()
  @Length(2, 120)
  initialPropertyName!: string;

  @ValidateNested()
  @Type(() => CreateInitialOwnerDto)
  initialOwner!: CreateInitialOwnerDto;

  @IsOptional()
  @IsString()
  @Length(2, 80)
  city?: string;
}
