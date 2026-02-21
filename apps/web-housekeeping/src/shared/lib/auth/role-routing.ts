import { appEnv } from '../../config/env';

const ROLE_PRIORITY = [
  'PlatformAdmin',
  'Owner',
  'Manager',
  'FrontDesk',
  'Finance',
  'Housekeeping',
  'Kitchen',
] as const;

const ROLE_FALLBACK_PATH: Record<(typeof ROLE_PRIORITY)[number], string> = {
  PlatformAdmin: '/platform-admin',
  Owner: '/owner',
  Manager: '/manager',
  FrontDesk: '/front-desk',
  Finance: '/finance',
  Housekeeping: '/housekeeping',
  Kitchen: '/kitchen',
};

function normalizeRole(value: string): string {
  return value.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function hasRole(roles: string[], expectedRole: string): boolean {
  const expected = normalizeRole(expectedRole);
  return roles.some((role) => normalizeRole(role) === expected);
}

function roleEnvUrl(role: (typeof ROLE_PRIORITY)[number]): string | undefined {
  switch (role) {
    case 'PlatformAdmin':
      return appEnv.dashboardUrls.platformAdmin;
    case 'Owner':
      return appEnv.dashboardUrls.owner;
    case 'Manager':
      return appEnv.dashboardUrls.manager;
    case 'FrontDesk':
      return appEnv.dashboardUrls.frontDesk;
    case 'Finance':
      return appEnv.dashboardUrls.finance;
    case 'Housekeeping':
      return appEnv.dashboardUrls.housekeeping;
    case 'Kitchen':
      return appEnv.dashboardUrls.kitchen;
    default:
      return undefined;
  }
}

export function resolveStaffDashboardHref(roles: string[], fallbackPath: string): string {
  for (const role of ROLE_PRIORITY) {
    if (!hasRole(roles, role)) {
      continue;
    }

    const configuredUrl = roleEnvUrl(role);
    if (configuredUrl) {
      return configuredUrl;
    }

    return ROLE_FALLBACK_PATH[role] ?? fallbackPath;
  }

  return fallbackPath;
}
