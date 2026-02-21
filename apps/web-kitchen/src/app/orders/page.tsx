import { KitchenShell } from '../../widgets/dashboard-shell/ui/kitchen-shell';
import { LiveOrdersBoardWidget } from '../../widgets/live-orders-board/ui/live-orders-board-widget';

export default function OrdersPage() {
  return (
    <KitchenShell title="Orders (Live Queue)">
      <LiveOrdersBoardWidget />
    </KitchenShell>
  );
}
