import { Suspense } from 'react';
import { GuestLoginScreen } from '../../processes/auth/ui/guest-login-screen';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <GuestLoginScreen initialMode="login" />
    </Suspense>
  );
}
