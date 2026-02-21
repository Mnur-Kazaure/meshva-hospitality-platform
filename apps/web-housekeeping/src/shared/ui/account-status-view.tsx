import Link from 'next/link';
import { AuthLayout } from './auth-layout';

interface AccountStatusViewProps {
  title: string;
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function AccountStatusView({ title, message, ctaLabel = 'Return to login', ctaHref = '/login' }: AccountStatusViewProps) {
  return (
    <AuthLayout title={title} subtitle={message}>
      <div className="toolbar">
        <Link className="btn secondary" href={ctaHref}>
          {ctaLabel}
        </Link>
      </div>
    </AuthLayout>
  );
}
