'use client';

import { useState } from 'react';
import { ManagerShell } from '../dashboard-shell/ui/manager-shell';
import { CriticalActionDialog } from '../../shared/ui/critical-action-dialog';

export default function ApprovalsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <ManagerShell title="Approvals">
      <div className="card">
        <h3>Approval Queue</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Entity</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Discount</td>
              <td>Reservation RSV-2222-2002</td>
              <td>Loyal guest discount</td>
              <td>REQUESTED</td>
            </tr>
            <tr>
              <td>Override</td>
              <td>Reservation RSV-2222-2002</td>
              <td>VIP extension request</td>
              <td>REQUESTED</td>
            </tr>
          </tbody>
        </table>
        <div className="toolbar" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={() => setDialogOpen(true)}>
            Approve Selected
          </button>
        </div>
      </div>
      <p className="note">Approve/reject actions are idempotent and produce immutable audit entries.</p>
      <CriticalActionDialog
        open={dialogOpen}
        title="Confirm approval"
        description="This action will be recorded in audit logs and cannot be silently reversed."
        onCancel={() => setDialogOpen(false)}
        onConfirm={async () => {
          setDialogOpen(false);
        }}
      />
    </ManagerShell>
  );
}
