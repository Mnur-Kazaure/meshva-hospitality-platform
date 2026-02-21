import Link from 'next/link';
import type { ReactNode } from 'react';
import { meshvaBrandAssets } from '@meshva/ui';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand-lockup">
          <img className="brand-logo" src={meshvaBrandAssets.logoSvgPath} alt={meshvaBrandAssets.logoAlt} />
          <div>
            <div className="brand-name">Meshva</div>
            <div className="brand-tag">Secure Access</div>
          </div>
        </div>
        <h1>{title}</h1>
        <p className="note">{subtitle}</p>
        {children}
        <div className="note">
          Need help? <Link href="/login">Return to login</Link>
        </div>
        {footer}
      </div>
    </div>
  );
}
