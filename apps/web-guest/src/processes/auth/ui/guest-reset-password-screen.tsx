import { AuthLayout } from '../../../shared/ui/auth-layout';

export function GuestResetPasswordScreen() {
  return (
    <AuthLayout
      title="Reset password"
      subtitle="This reset link is invalid or expired. Please request support from front desk."
    >
      <p className="alert">Reset link is invalid or expired.</p>
    </AuthLayout>
  );
}
