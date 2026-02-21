'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { meshvaBrandAssets } from '@meshva/ui';
import { FrontDeskPermissions } from '../../../shared/types/contracts';
import { PropertySwitcher } from '../../../shared/ui/property-switcher';
import { useStaffSession } from '../../../processes/auth/model/staff-session-context';

const navItems = [
  { href: '/today-board', label: 'Today Board', permission: FrontDeskPermissions.RESERVATION_VIEW },
  { href: '/room-board', label: 'Room Board', permission: FrontDeskPermissions.RESERVATION_VIEW },
  { href: '/reservations', label: 'Reservations', permission: FrontDeskPermissions.RESERVATION_VIEW },
  { href: '/new-booking', label: 'New Booking', permission: FrontDeskPermissions.RESERVATION_CREATE },
  { href: '/checkin-checkout', label: 'Check-in / Check-out', permission: FrontDeskPermissions.STAY_CHECKIN },
  { href: '/guests', label: 'Guests', permission: FrontDeskPermissions.GUEST_VIEW },
  { href: '/confirmations', label: 'Confirmations', permission: FrontDeskPermissions.CONFIRMATION_SEND },
  { href: '/shift-handover', label: 'Shift Handover', permission: FrontDeskPermissions.SHIFT_HANDOVER_CREATE },
] as const;

interface FrontDeskShellProps {
  title: string;
  children: ReactNode;
}

export function FrontDeskShell({ title, children }: FrontDeskShellProps) {
  const [draftQueueCount, setDraftQueueCount] = useState(0);
  const { hasPermission, isReadOnly } = useStaffSession();

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => hasPermission(item.permission)),
    [hasPermission],
  );

  useEffect(() => {
    const readCount = () => {
      const raw = window.localStorage.getItem('meshva_front_desk_booking_drafts');
      if (!raw) {
        setDraftQueueCount(0);
        return;
      }

      try {
        const drafts = JSON.parse(raw) as unknown[];
        setDraftQueueCount(Array.isArray(drafts) ? drafts.length : 0);
      } catch {
        setDraftQueueCount(0);
      }
    };

    readCount();
    window.addEventListener('storage', readCount);
    window.addEventListener('meshva-draft-updated', readCount as EventListener);

    return () => {
      window.removeEventListener('storage', readCount);
      window.removeEventListener('meshva-draft-updated', readCount as EventListener);
    };
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <img className="brand-logo" src={meshvaBrandAssets.logoSvgPath} alt={meshvaBrandAssets.logoAlt} />
          <div>
            <div className="brand-name">Front Desk</div>
            <div className="brand-tag">Meshva Operations</div>
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
            <span className="badge">PWA Draft Queue: {draftQueueCount}</span>
          </div>
        </div>
        {isReadOnly ? <div className="alert">View-only access</div> : null}
        {children}
      </main>
    </div>
  );
}
