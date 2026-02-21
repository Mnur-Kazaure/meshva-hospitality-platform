'use client';

import Link from 'next/link';
import { ReactNode, useMemo } from 'react';
import { meshvaBrandAssets } from '@meshva/ui';
import { HousekeepingPermissions } from '../../../shared/types/contracts';
import { PropertySwitcher } from '../../../shared/ui/property-switcher';
import { useStaffSession } from '../../../processes/auth/model/staff-session-context';

const navItems = [
  { href: '/task-board', label: 'Task Board', permission: HousekeepingPermissions.TASK_VIEW },
  { href: '/room-status-board', label: 'Room Status Board', permission: HousekeepingPermissions.TASK_VIEW },
  { href: '/my-tasks', label: 'My Tasks', permission: HousekeepingPermissions.TASK_VIEW },
  { href: '/maintenance-reports', label: 'Maintenance Reports', permission: HousekeepingPermissions.MAINTENANCE_VIEW },
  { href: '/task-history', label: 'Task History', permission: HousekeepingPermissions.TASK_VIEW },
] as const;

interface HousekeepingShellProps {
  title: string;
  children: ReactNode;
}

export function HousekeepingShell({ title, children }: HousekeepingShellProps) {
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
            <div className="brand-tag">Housekeeping</div>
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
            <span className="badge">Offline Retry Queue Enabled</span>
          </div>
        </div>
        {isReadOnly ? <div className="alert">View-only access</div> : null}
        {children}
      </main>
    </div>
  );
}
