import { FolioLineType } from '../../enums/folio-line-type';

export interface AddAdjustmentDto {
  invoiceId: string;
  type: FolioLineType.CHARGE | FolioLineType.ADJUSTMENT;
  amount: number;
  description: string;
  reason: string;
}
