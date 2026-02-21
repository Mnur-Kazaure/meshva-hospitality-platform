import { KitchenShell } from '../../widgets/dashboard-shell/ui/kitchen-shell';
import { MenuManagementPanelWidget } from '../../widgets/menu-management-panel/ui/menu-management-panel-widget';

export default function MenuManagementPage() {
  return (
    <KitchenShell title="Menu Management">
      <MenuManagementPanelWidget />
    </KitchenShell>
  );
}
