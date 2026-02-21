'use client';

import Link from 'next/link';
import { ReactNode, useMemo } from 'react';
import { meshvaBrandAssets } from '@meshva/ui';
import { OwnerPermissions } from '../../../shared/types/contracts';
import { PropertySwitcher } from '../../../shared/ui/property-switcher';
import { useStaffSession } from '../../../processes/auth/model/staff-session-context';

const navItems = [
  { href: '/executive-overview', label: 'Executive Overview', permission: OwnerPermissions.PORTFOLIO_VIEW },
  { href: '/properties', label: 'Properties', permission: OwnerPermissions.PROPERTY_VIEW },
  { href: '/exceptions-integrity', label: 'Exceptions & Integrity', permission: OwnerPermissions.EXCEPTIONS_VIEW },
  { href: '/financial-summary', label: 'Financial Summary', permission: OwnerPermissions.FINANCE_VIEW },
  { href: '/operations-snapshot', label: 'Operations Snapshot', permission: OwnerPermissions.OPERATIONS_VIEW },
  { href: '/exports', label: 'Exports', permission: OwnerPermissions.EXPORT },
  { href: '/audit-viewer', label: 'Audit Viewer', permission: OwnerPermissions.AUDIT_VIEW },
  { href: '/alerts-settings', label: 'Alerts Settings', permission: OwnerPermissions.ALERTS_CONFIG },
] as const;

interface OwnerShellProps {
  title: string;
  children: ReactNode;
}

export function OwnerShell({ title, children }: OwnerShellProps) {
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
            <div className="brand-tag">Owner Console</div>
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
          <div className="toolbar">
            <PropertySwitcher />
            <span className="badge amber">Risk Badge: 6</span>
          </div>
        </div>
        {isReadOnly ? <div className="alert">View-only access</div> : null}
        {children}
      </main>
    </div>
  );
}
