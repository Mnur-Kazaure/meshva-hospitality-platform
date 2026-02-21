import { AuthLayout } from '../../../shared/ui/auth-layout';

export function GuestForgotPasswordScreen() {
  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Guest self-service reset is not enabled yet. Contact front desk support for assistance."
    >
      <p className="alert">If your account exists, support will guide you through password reset.</p>
    </AuthLayout>
  );
}
