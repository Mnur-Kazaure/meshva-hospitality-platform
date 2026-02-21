'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { meshvaBrandAssets, meshvaColors } from '@meshva/ui';
import { KitchenPermissions } from '../../../shared/types/contracts';
import { useStaffSession } from '../../../processes/auth/model/staff-session-context';
import { PropertySwitcher } from '../../../shared/ui/property-switcher';

interface KitchenShellProps {
  title: string;
  children: ReactNode;
}

const navItems = [
  { href: '/orders', label: 'Orders (Live Queue)', permission: KitchenPermissions.ORDER_VIEW },
  { href: '/new-order', label: 'New Order', permission: KitchenPermissions.ORDER_CREATE },
  { href: '/menu-management', label: 'Menu Management', permission: KitchenPermissions.MENU_VIEW },
  { href: '/order-history', label: 'Order History', permission: KitchenPermissions.ORDER_VIEW },
  { href: '/reports', label: 'Kitchen Reports', permission: KitchenPermissions.REPORTS_VIEW },
  { href: '/settings', label: 'Settings', permission: KitchenPermissions.ORDER_VIEW },
] as const;

export function KitchenShell({ title, children }: KitchenShellProps) {
  const { hasPermission, isReadOnly } = useStaffSession();
  const visibleNavItems = useMemo(
    () => navItems.filter((item) => hasPermission(item.permission)),
    [hasPermission],
  );

  return (
    <div
      className="app-shell"
      style={{
        ['--meshva-primary' as string]: meshvaColors.primaryDeepBlue,
        ['--meshva-secondary' as string]: meshvaColors.secondaryRoyalBlue,
        ['--meshva-accent' as string]: meshvaColors.accentCyan,
        ['--meshva-support' as string]: meshvaColors.supportBlue,
        ['--meshva-neutral' as string]: meshvaColors.neutralSlate,
        ['--meshva-alert' as string]: meshvaColors.exceptionAmber,
      }}
    >
      <aside className="sidebar">
        <div className="brand-lockup">
          <img className="brand-logo" src={meshvaBrandAssets.logoSvgPath} alt={meshvaBrandAssets.logoAlt} />
          <div>
            <div className="brand-name">Meshva</div>
            <div className="brand-tag">Kitchen &amp; Restaurant</div>
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
            <span className="badge">Charge posting is idempotent and audited</span>
          </div>
        </div>
        {isReadOnly ? <div className="alert">View-only access</div> : null}
        {children}
      </main>
    </div>
  );
}
