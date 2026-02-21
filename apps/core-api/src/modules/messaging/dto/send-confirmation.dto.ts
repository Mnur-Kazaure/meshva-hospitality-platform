import {
  ConfirmationChannel,
  ConfirmationEntityType,
  ConfirmationTemplate,
  SupportedLanguage,
} from '@meshva/contracts';
import { IsEnum, IsOptional, IsString, IsUUID, Length, ValidateIf } from 'class-validator';

export class SendConfirmationDto {
  @IsEnum(ConfirmationEntityType)
  entityType!: ConfirmationEntityType;

  @IsUUID()
  entityId!: string;

  @IsEnum(ConfirmationTemplate)
  template!: ConfirmationTemplate;

  @IsEnum(ConfirmationChannel)
  channel!: ConfirmationChannel;

  @ValidateIf((dto) => dto.channel !== ConfirmationChannel.PRINT)
  @IsString()
  @Length(7, 20)
  toPhone?: string;

  @IsOptional()
  @IsEnum(SupportedLanguage)
  language?: SupportedLanguage;
}
