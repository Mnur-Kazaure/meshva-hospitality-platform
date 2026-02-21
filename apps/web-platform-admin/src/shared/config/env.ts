export const appEnv = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/v1',
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID,
  propertyId: process.env.NEXT_PUBLIC_PROPERTY_ID,
  userId: process.env.NEXT_PUBLIC_USER_ID,
  dashboardUrls: {
    platformAdmin: process.env.NEXT_PUBLIC_DASHBOARD_URL_PLATFORM_ADMIN,
    owner: process.env.NEXT_PUBLIC_DASHBOARD_URL_OWNER,
    manager: process.env.NEXT_PUBLIC_DASHBOARD_URL_MANAGER,
    frontDesk: process.env.NEXT_PUBLIC_DASHBOARD_URL_FRONT_DESK,
    finance: process.env.NEXT_PUBLIC_DASHBOARD_URL_FINANCE,
    housekeeping: process.env.NEXT_PUBLIC_DASHBOARD_URL_HOUSEKEEPING,
    kitchen: process.env.NEXT_PUBLIC_DASHBOARD_URL_KITCHEN,
  },
} as const;
