export const appEnv = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/v1',
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID,
  propertyId: process.env.NEXT_PUBLIC_PROPERTY_ID,
  userId: process.env.NEXT_PUBLIC_USER_ID,
} as const;
