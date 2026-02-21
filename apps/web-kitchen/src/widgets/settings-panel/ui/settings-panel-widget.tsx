'use client';

import { Card } from '../../../shared/ui/card';
import { Button } from '../../../shared/ui/button';

export function SettingsPanelWidget() {
  return (
    <div className="grid cols-2">
      <Card title="Operational Flags">
        <div className="list-tight">
          <label><input type="checkbox" defaultChecked /> Show printer queue status</label>
          <label><input type="checkbox" defaultChecked /> Require manager override for IN_PREP cancellation</label>
          <label><input type="checkbox" defaultChecked /> Notify front desk when order is delivered</label>
          <label><input type="checkbox" /> Notify guest via WhatsApp (placeholder)</label>
        </div>
      </Card>
      <Card title="Discipline Notes">
        <ul className="list-tight">
          <li>Post charge only after DELIVERED.</li>
          <li>No financial deletes. Reversals handled in Finance.</li>
          <li>All mutations must use idempotency keys.</li>
        </ul>
        <div className="toolbar">
          <Button>Save Settings</Button>
        </div>
      </Card>
    </div>
  );
}
