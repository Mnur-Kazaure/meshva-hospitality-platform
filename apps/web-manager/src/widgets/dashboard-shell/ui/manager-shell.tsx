'use client';

import Link from 'next/link';
import { ReactNode, useMemo } from 'react';
import { meshvaBrandAssets } from '@meshva/ui';
import { ManagerPermissions } from '../../../shared/types/contracts';
import { PropertySwitcher } from '../../../shared/ui/property-switcher';
import { useStaffSession } from '../../../processes/auth/model/staff-session-context';

const navItems = [
  { href: '/ops-overview', label: 'Ops Overview', permission: ManagerPermissions.OPS_VIEW },
  { href: '/approvals', label: 'Approvals', permission: ManagerPermissions.APPROVAL_VIEW },
  { href: '/inventory-rates', label: 'Inventory & Rates', permission: ManagerPermissions.INVENTORY_MANAGE },
  { href: '/reservations-stays', label: 'Reservations & Stays', permission: ManagerPermissions.RESERVATION_OVERRIDE },
  { href: '/room-oversight', label: 'Room Oversight', permission: ManagerPermissions.OPS_VIEW },
  { href: '/staff-activity', label: 'Staff Activity', permission: ManagerPermissions.STAFF_ACTIVITY_VIEW },
  { href: '/staff-management', label: 'Staff Management', permission: ManagerPermissions.STAFF_VIEW },
  { href: '/reports', label: 'Reports (Lite)', permission: ManagerPermissions.OPS_VIEW },
  { href: '/settings', label: 'Settings (Property)', permission: ManagerPermissions.PROPERTY_SETTINGS_EDIT },
] as const;

interface ManagerShellProps {
  title: string;
  children: ReactNode;
}

export function ManagerShell({ title, children }: ManagerShellProps) {
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
            <div className="brand-name">Manager Console</div>
            <div className="brand-tag">Meshva Governance</div>
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
            <span className="badge">Exceptions Feed Active</span>
          </div>
        </div>
        {isReadOnly ? <div className="alert">View-only access</div> : null}
        {children}
      </main>
    </div>
  );
}
