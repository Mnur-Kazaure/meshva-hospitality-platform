import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateStaffDto {
  @IsString()
  @Length(2, 120)
  fullName!: string;

  @IsString()
  @Length(7, 24)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  roleIds!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  propertyAccessIds!: string[];
}
