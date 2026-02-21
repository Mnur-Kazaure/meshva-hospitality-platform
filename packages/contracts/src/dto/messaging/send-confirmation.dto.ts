import { ConfirmationChannel } from '../../enums/confirmation-channel';
import { ConfirmationTemplate } from '../../enums/confirmation-template';
import { SupportedLanguage } from '../../enums/language';

export enum ConfirmationEntityType {
  RESERVATION = 'RESERVATION',
  STAY = 'STAY',
}

export interface SendConfirmationDto {
  entityType: ConfirmationEntityType;
  entityId: string;
  template: ConfirmationTemplate;
  channel: ConfirmationChannel;
  toPhone?: string;
  language?: SupportedLanguage;
}
