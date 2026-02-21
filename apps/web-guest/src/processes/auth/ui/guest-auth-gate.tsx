'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { GuestPermissions } from '../../../shared/types/contracts';
import { asApiClientError, isSessionExpiredError } from '../../../shared/lib/auth/error-messages';
import { getGuestSession } from '../../../shared/lib/auth/session';
import { GuestSessionProvider } from '../model/guest-session-context';

const PUBLIC_PATHS = new Set([
  '/home',
  '/property-listing',
  '/property-details',
  '/availability-room-selection',
  '/booking-success',
  '/login',
  '/guest/login',
  '/guest/register',
  '/forgot-password',
  '/reset-password',
  '/account-disabled',
  '/session-expired',
  '/access-denied',
]);

const PROTECTED_PATHS = new Set([
  '/booking-confirmation',
  '/my-bookings',
  '/booking-details',
  '/modify-booking',
  '/cancel-booking',
  '/profile',
  '/change-password',
]);

const ROUTE_PERMISSIONS: Record<string, string> = {
  '/booking-confirmation': GuestPermissions.BOOKING_CREATE,
  '/my-bookings': GuestPermissions.BOOKING_VIEW,
  '/booking-details': GuestPermissions.BOOKING_VIEW,
  '/modify-booking': GuestPermissions.BOOKING_MODIFY,
  '/cancel-booking': GuestPermissions.BOOKING_CANCEL,
  '/profile': GuestPermissions.PROFILE_EDIT,
};

interface GuestAuthGateProps {
  children: ReactNode;
}

function requiresAuth(pathname: string): boolean {
  if (PROTECTED_PATHS.has(pathname)) {
    return true;
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return false;
  }

  return pathname.startsWith('/guest');
}

export function GuestAuthGate({ children }: GuestAuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Awaited<ReturnType<typeof getGuestSession>> | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let isActive = true;
    setResolved(false);

    const run = async () => {
      const isPublicPath = !requiresAuth(pathname);

      try {
        const nextSession = await getGuestSession();
        if (!isActive) {
          return;
        }

        const requiredPermission = ROUTE_PERMISSIONS[pathname];
        if (requiredPermission && !nextSession.permissions.includes(requiredPermission)) {
          router.replace('/access-denied');
          return;
        }

        if (pathname === '/login' || pathname === '/guest/login' || pathname === '/guest/register') {
          router.replace('/my-bookings');
          return;
        }

        setSession(nextSession);
        setResolved(true);
      } catch (error) {
        if (!isActive) {
          return;
        }

        const apiError = asApiClientError(error);
        if (apiError?.code === 'AUTH_ACCOUNT_DISABLED' || apiError?.code === 'AUTH_TENANT_SUSPENDED') {
          router.replace('/account-disabled');
          return;
        }

        if (isPublicPath) {
          setSession(null);
          setResolved(true);
          return;
        }

        if (apiError?.code === 'AUTH_INVALID_CREDENTIALS') {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        if (isSessionExpiredError(error)) {
          router.replace('/session-expired');
          return;
        }

        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    };

    void run();

    return () => {
      isActive = false;
    };
  }, [pathname, router]);

  if (!resolved) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Verifying session</h1>
          <p className="note">Checking secure guest portal access.</p>
        </div>
      </div>
    );
  }

  return <GuestSessionProvider session={session}>{children}</GuestSessionProvider>;
}
