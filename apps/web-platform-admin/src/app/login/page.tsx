import { Suspense } from 'react';
import { StaffLoginScreen } from '../../processes/auth/ui/staff-login-screen';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <StaffLoginScreen />
    </Suspense>
  );
}
