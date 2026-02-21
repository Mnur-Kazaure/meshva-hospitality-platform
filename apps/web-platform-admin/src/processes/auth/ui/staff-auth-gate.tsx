'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { asApiClientError, isSessionExpiredError } from '../../../shared/lib/auth/error-messages';
import { resolveStaffDashboardHref } from '../../../shared/lib/auth/role-routing';
import { getStaffSession } from '../../../shared/lib/auth/session';
import { StaffSessionProvider } from '../model/staff-session-context';
import { staffAuthConfig } from '../config';

interface StaffAuthGateProps {
  children: ReactNode;
}

export function StaffAuthGate({ children }: StaffAuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Awaited<ReturnType<typeof getStaffSession>> | null>(null);

  useEffect(() => {
    let isActive = true;
    setSession(null);

    const run = async () => {
      const isPublicPath = (staffAuthConfig.publicPaths as readonly string[]).includes(pathname);

      try {
        const nextSession = await getStaffSession();
        if (!isActive) {
          return;
        }

        if (nextSession.requiresPasswordChange && pathname !== '/change-password') {
          router.replace('/change-password');
          return;
        }

        if (!nextSession.requiresPasswordChange && pathname === '/change-password') {
          router.replace(resolveStaffDashboardHref(nextSession.roles, staffAuthConfig.defaultHomePath));
          return;
        }

        const requiredPermission = staffAuthConfig.routePermissions[pathname as keyof typeof staffAuthConfig.routePermissions];
        if (requiredPermission && !nextSession.permissions.includes(requiredPermission)) {
          router.replace('/access-denied');
          return;
        }

        if (isPublicPath && pathname !== '/access-denied') {
          router.replace(resolveStaffDashboardHref(nextSession.roles, staffAuthConfig.defaultHomePath));
          return;
        }

        setSession(nextSession);
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

  const isPublicPath = (staffAuthConfig.publicPaths as readonly string[]).includes(pathname);

  if (!session && !isPublicPath) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Verifying session</h1>
          <p className="note">Checking access permissions and secure session.</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <>{children}</>;
  }

  return <StaffSessionProvider session={session}>{children}</StaffSessionProvider>;
}
