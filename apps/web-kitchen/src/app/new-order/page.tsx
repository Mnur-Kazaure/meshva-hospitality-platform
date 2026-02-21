import { KitchenShell } from '../../widgets/dashboard-shell/ui/kitchen-shell';
import { NewOrderFormWidget } from '../../widgets/new-order-form/ui/new-order-form-widget';

export default function NewOrderPage() {
  return (
    <KitchenShell title="New Order (Room Service)">
      <NewOrderFormWidget />
    </KitchenShell>
  );
}
