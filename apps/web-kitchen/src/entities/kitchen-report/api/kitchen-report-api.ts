import { apiClient } from '../../../shared/lib/api/client';
import { kitchenStore } from '../../../shared/lib/utils/kitchen-store';
import type { KitchenReport } from '../model/types';

export async function getKitchenReport(propertyId?: string): Promise<KitchenReport> {
  if (!propertyId) {
    return kitchenStore.getReport();
  }

  try {
    return await apiClient.get<KitchenReport>(`/properties/${propertyId}/kitchen/reports/lite`);
  } catch {
    return kitchenStore.getReport();
  }
}
