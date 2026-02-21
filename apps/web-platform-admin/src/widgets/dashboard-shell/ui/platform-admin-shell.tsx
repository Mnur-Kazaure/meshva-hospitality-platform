'use client';

import Link from 'next/link';
import { ReactNode, useMemo } from 'react';
import { meshvaBrandAssets } from '@meshva/ui';
import { PlatformAdminPermissions } from '../../../shared/types/contracts';
import { useStaffSession } from '../../../processes/auth/model/staff-session-context';

const navItems = [
  { href: '/tenants', label: 'Tenants', permission: PlatformAdminPermissions.TENANT_CREATE },
  { href: '/tenant-details', label: 'Tenant Details', permission: PlatformAdminPermissions.TENANT_CREATE },
  { href: '/subscriptions-plans', label: 'Subscriptions & Plans', permission: PlatformAdminPermissions.SUBSCRIPTION_MANAGE },
  { href: '/feature-flags', label: 'Feature Flags', permission: PlatformAdminPermissions.FEATURE_FLAG_MANAGE },
  { href: '/system-health', label: 'System Health', permission: PlatformAdminPermissions.SYSTEM_VIEW },
  { href: '/global-audit', label: 'Global Audit Viewer', permission: PlatformAdminPermissions.AUDIT_VIEW },
  { href: '/support-tools', label: 'Support Tools', permission: PlatformAdminPermissions.IMPERSONATE },
  { href: '/platform-metrics', label: 'Platform Metrics', permission: PlatformAdminPermissions.SYSTEM_VIEW },
] as const;

interface PlatformAdminShellProps {
  title: string;
  children: ReactNode;
}

export function PlatformAdminShell({ title, children }: PlatformAdminShellProps) {
  const { hasPermission, isReadOnly } = useStaffSession();
  const visibleNavItems = useMemo(
    () => navItems.filter((item) => hasPermission(item.permission)),
    [hasPermission],
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <img className="brand-logo" src={meshvaBrandAssets.logoSvgPath} alt={meshvaBrandAssets.logoAlt} />
          <div>
            <div className="brand-name">Meshva</div>
            <div className="brand-tag">Platform Admin</div>
          </div>
        </div>
        <nav>
          {visibleNavItems.map((item) => (
            <Link key={item.href} className="nav-link" href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="content">
        <div className="header">
          <h2>{title}</h2>
          <span className="badge">Governance Mode Enabled</span>
        </div>
        {isReadOnly ? <div className="alert">View-only access</div> : null}
        {children}
      </main>
    </div>
  );
}
