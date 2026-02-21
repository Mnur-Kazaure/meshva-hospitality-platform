import { KitchenShell } from '../../widgets/dashboard-shell/ui/kitchen-shell';
import { OrderHistoryTableWidget } from '../../widgets/order-history-table/ui/order-history-table-widget';

export default function OrderHistoryPage() {
  return (
    <KitchenShell title="Order History">
      <OrderHistoryTableWidget />
    </KitchenShell>
  );
}
