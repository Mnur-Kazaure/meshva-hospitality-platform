import { Suspense } from 'react';
import { GuestLoginScreen } from '../../../processes/auth/ui/guest-login-screen';

export default function GuestRegisterPage() {
  return (
    <Suspense fallback={null}>
      <GuestLoginScreen initialMode="register" />
    </Suspense>
  );
}
