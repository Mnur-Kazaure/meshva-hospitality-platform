'use client';

import Link from 'next/link';
import { ReactNode, useMemo } from 'react';
import { meshvaBrandAssets } from '@meshva/ui';
import { FinancePermissions } from '../../../shared/types/contracts';
import { PropertySwitcher } from '../../../shared/ui/property-switcher';
import { useStaffSession } from '../../../processes/auth/model/staff-session-context';

const navItems = [
  { href: '/finance-overview', label: 'Today Dashboard', permission: FinancePermissions.PAYMENT_VIEW },
  { href: '/invoices-folios', label: 'Invoices & Folios', permission: FinancePermissions.PAYMENT_VIEW },
  { href: '/payments', label: 'Payments', permission: FinancePermissions.PAYMENT_RECORD },
  { href: '/refunds', label: 'Refunds', permission: FinancePermissions.REFUND_EXECUTE },
  { href: '/daily-close', label: 'Daily Close', permission: FinancePermissions.DAILY_CLOSE },
  { href: '/reports', label: 'Reports', permission: FinancePermissions.REPORT_VIEW },
  { href: '/shift-handover', label: 'Shift Handover', permission: FinancePermissions.SHIFT_HANDOVER_CREATE },
] as const;

interface FinanceShellProps {
  title: string;
  children: ReactNode;
}

export function FinanceShell({ title, children }: FinanceShellProps) {
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
            <div className="brand-name">Cashier &amp; Finance</div>
            <div className="brand-tag">Meshva Controls</div>
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
            <span className="badge">Daily Close Discipline Active</span>
          </div>
        </div>
        {isReadOnly ? <div className="alert">View-only access</div> : null}
        {children}
      </main>
    </div>
  );
}
