import Link from 'next/link';
import { AuthLayout } from './auth-layout';

export function AccessDeniedView() {
  return (
    <AuthLayout
      title="Access denied"
      subtitle="You do not have permission to view this page."
    >
      <div className="toolbar">
        <Link className="btn secondary" href="/home">
          Return to home
        </Link>
        <Link className="btn secondary" href="/login">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
