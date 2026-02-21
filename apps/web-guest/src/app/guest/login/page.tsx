import { Suspense } from 'react';
import { GuestLoginScreen } from '../../../processes/auth/ui/guest-login-screen';

export default function GuestLoginPage() {
  return (
    <Suspense fallback={null}>
      <GuestLoginScreen initialMode="login" />
    </Suspense>
  );
}
