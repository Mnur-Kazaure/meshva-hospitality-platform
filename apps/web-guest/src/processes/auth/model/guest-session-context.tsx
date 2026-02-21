'use client';

import { createContext, ReactNode, useContext, useMemo } from 'react';
import type { GuestSessionDto } from '../../../shared/types/contracts';

interface GuestSessionContextValue {
  session: GuestSessionDto | null;
  hasPermission: (permission: string) => boolean;
}

const GuestSessionContext = createContext<GuestSessionContextValue | null>(null);

interface GuestSessionProviderProps {
  session: GuestSessionDto | null;
  children: ReactNode;
}

export function GuestSessionProvider({ session, children }: GuestSessionProviderProps) {
  const value = useMemo<GuestSessionContextValue>(
    () => ({
      session,
      hasPermission: (permission: string) => Boolean(session?.permissions.includes(permission)),
    }),
    [session],
  );

  return <GuestSessionContext.Provider value={value}>{children}</GuestSessionContext.Provider>;
}

export function useGuestSession() {
  const context = useContext(GuestSessionContext);
  if (!context) {
    throw new Error('useGuestSession must be used within GuestSessionProvider');
  }

  return context;
}
