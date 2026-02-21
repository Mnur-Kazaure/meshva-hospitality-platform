import { KitchenShell } from '../../widgets/dashboard-shell/ui/kitchen-shell';
import { SettingsPanelWidget } from '../../widgets/settings-panel/ui/settings-panel-widget';

export default function SettingsPage() {
  return (
    <KitchenShell title="Settings">
      <SettingsPanelWidget />
    </KitchenShell>
  );
}
