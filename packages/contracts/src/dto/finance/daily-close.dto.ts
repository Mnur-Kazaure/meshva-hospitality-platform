export interface DailyCloseDto {
  date: string;
  cashCounted: number;
  transferCounted: number;
  posCounted: number;
  note?: string;
}
