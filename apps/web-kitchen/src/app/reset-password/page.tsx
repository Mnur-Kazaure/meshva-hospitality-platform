import { Suspense } from 'react';
import { StaffResetPasswordScreen } from '../../processes/auth/ui/staff-reset-password-screen';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <StaffResetPasswordScreen />
    </Suspense>
  );
}
