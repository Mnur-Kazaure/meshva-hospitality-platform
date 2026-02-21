'use client';

import Link from 'next/link';
import { ReactNode, useMemo } from 'react';
import { meshvaBrandAssets } from '@meshva/ui';
import { GuestPermissions } from '../../../shared/types/contracts';
import { useGuestSession } from '../../../processes/auth/model/guest-session-context';

interface GuestShellProps {
  title: string;
  children: ReactNode;
}

const publicNav = [
  { href: '/home', label: 'Search' },
  { href: '/property-listing', label: 'Property Listing' },
  { href: '/property-details', label: 'Property Details' },
  { href: '/availability-room-selection', label: 'Availability' },
  { href: '/booking-success', label: 'Booking Success' },
] as const;

const accountNav = [
  { href: '/my-bookings', label: 'My Bookings', permission: GuestPermissions.BOOKING_VIEW },
  { href: '/profile', label: 'Profile', permission: GuestPermissions.PROFILE_EDIT },
] as const;

export function GuestShell({ title, children }: GuestShellProps) {
  const { session, hasPermission } = useGuestSession();

  const visibleAccountNav = useMemo(
    () => accountNav.filter((item) => hasPermission(item.permission)),
    [hasPermission],
  );

  return (
    <div className="portal">
      <header className="topbar">
        <div className="brand-lockup">
          <img className="brand-logo" src={meshvaBrandAssets.logoSvgPath} alt={meshvaBrandAssets.logoAlt} />
          <div>
            <div className="brand-name">Meshva</div>
            <div className="brand-tag">Guest Portal</div>
          </div>
        </div>
        <nav className="quick-links">
          <Link href="/home">Book</Link>
          {session ? <Link href="/my-bookings">My Bookings</Link> : null}
          {session ? <Link href="/profile">Profile</Link> : <Link href="/login">Sign in</Link>}
        </nav>
      </header>

      <div className="content-shell">
        <aside className="side-nav">
          <h3>Public Flow</h3>
          <nav>
            {publicNav.map((item) => (
              <Link key={item.href} className="nav-link" href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <h3 style={{ marginTop: 14 }}>Guest Account</h3>
          {session ? (
            <nav>
              {visibleAccountNav.map((item) => (
                <Link key={item.href} className="nav-link" href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : (
            <nav>
              <Link className="nav-link" href="/login">
                Sign in
              </Link>
              <Link className="nav-link" href="/guest/register">
                Create account
              </Link>
            </nav>
          )}
        </aside>
        <main className="content">
          <div className="header">
            <h2>{title}</h2>
            <span className="badge">Reserve Now, Pay at Hotel</span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
