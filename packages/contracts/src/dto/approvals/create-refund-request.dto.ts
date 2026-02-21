export interface CreateRefundRequestDto {
  invoiceId: string;
  amount: number;
  reason: string;
}
