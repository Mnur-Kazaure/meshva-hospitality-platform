import { Suspense } from 'react';
import { StaffInviteAcceptScreen } from '../../processes/auth/ui/staff-invite-accept-screen';

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <StaffInviteAcceptScreen />
    </Suspense>
  );
}
