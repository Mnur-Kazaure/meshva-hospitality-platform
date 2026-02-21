export interface CreateRatePlanDto {
  name: string;
  roomTypeId: string;
  baseRate: number;
  currency?: 'NGN';
  effectiveFrom: string;
  effectiveTo?: string;
}
