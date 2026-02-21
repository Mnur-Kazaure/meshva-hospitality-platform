import { KitchenShell } from '../../widgets/dashboard-shell/ui/kitchen-shell';
import { KitchenReportsWidget } from '../../widgets/kitchen-reports/ui/kitchen-reports-widget';

export default function ReportsPage() {
  return (
    <KitchenShell title="Kitchen Reports (Lite)">
      <KitchenReportsWidget />
    </KitchenShell>
  );
}
