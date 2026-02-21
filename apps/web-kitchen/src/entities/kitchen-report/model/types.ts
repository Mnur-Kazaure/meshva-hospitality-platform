export interface KitchenReport {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averagePrepMinutes: number;
  topItems: Array<{ name: string; count: number }>;
}
