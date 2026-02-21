import Link from 'next/link';
import { AuthLayout } from './auth-layout';

export function AccessDeniedView() {
  return (
    <AuthLayout
      title="Access denied"
      subtitle="You do not have permission to view this page. Contact your administrator if this is unexpected."
    >
      <div className="toolbar">
        <Link className="btn secondary" href="/">
          Return to dashboard
        </Link>
        <Link className="btn secondary" href="/login">
          Back to login
        </Link>
      </div>
    </AuthLayout>
  );
}
