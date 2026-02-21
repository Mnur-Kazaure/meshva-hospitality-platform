'use client';

import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import type { StaffSessionDto } from '../../../shared/types/contracts';

const PROPERTY_COOKIE_NAME = 'meshva_property_context';
const MUTATING_PERMISSION_PATTERN =
  /(CREATE|EDIT|MANAGE|UPDATE|RECORD|EXECUTE|APPROVE|ASSIGN|POST|DEACTIVATE|ACTIVATE|DELETE|UNLOCK|CANCEL|CHECKIN|CHECKOUT|MODIFY)/;

interface StaffSessionContextValue {
  session: StaffSessionDto;
  selectedPropertyId?: string;
  setSelectedPropertyId: (propertyId: string) => void;
  hasPermission: (permission: string) => boolean;
  isReadOnly: boolean;
}

const StaffSessionContext = createContext<StaffSessionContextValue | null>(null);

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const cookie = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) {
    return undefined;
  }

  const value = cookie.slice(name.length + 1);
  return value ? decodeURIComponent(value) : undefined;
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=2592000; samesite=lax`;
}

function resolveInitialProperty(session: StaffSessionDto): string | undefined {
  const stored = readCookie(PROPERTY_COOKIE_NAME);
  if (stored && session.accessibleProperties.some((property) => property.id === stored)) {
    return stored;
  }

  return session.accessibleProperties[0]?.id;
}

interface StaffSessionProviderProps {
  session: StaffSessionDto;
  children: ReactNode;
}

export function StaffSessionProvider({ session, children }: StaffSessionProviderProps) {
  const [selectedPropertyId, setSelectedPropertyState] = useState<string | undefined>(() =>
    resolveInitialProperty(session),
  );

  const value = useMemo<StaffSessionContextValue>(
    () => ({
      session,
      selectedPropertyId,
      setSelectedPropertyId: (propertyId: string) => {
        setSelectedPropertyState(propertyId);
        writeCookie(PROPERTY_COOKIE_NAME, propertyId);
      },
      hasPermission: (permission: string) => session.permissions.includes(permission),
      isReadOnly: !session.permissions.some((permission) => MUTATING_PERMISSION_PATTERN.test(permission)),
    }),
    [selectedPropertyId, session],
  );

  return <StaffSessionContext.Provider value={value}>{children}</StaffSessionContext.Provider>;
}

export function useStaffSession() {
  const context = useContext(StaffSessionContext);
  if (!context) {
    throw new Error('useStaffSession must be used within StaffSessionProvider');
  }

  return context;
}
