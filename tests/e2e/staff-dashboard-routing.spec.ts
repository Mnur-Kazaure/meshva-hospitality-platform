import { expect, test, type Page } from '@playwright/test';

const staffPassword = process.env.E2E_STAFF_PASSWORD ?? 'Meshva123!';
const frontDeskBaseUrl = process.env.E2E_FRONT_DESK_BASE_URL ?? 'http://127.0.0.1:3010';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeExpectedUrl(url: string): RegExp {
  return new RegExp(`^${escapeRegExp(url.replace(/\/$/, ''))}/?$`);
}

async function loginFromFrontDesk(page: Page, identifier: string): Promise<void> {
  await page.goto(`${frontDeskBaseUrl}/login`);
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  await page.getByLabel('Email or phone').fill(identifier);
  await page.getByLabel('Password').fill(staffPassword);
  await page.locator('button[type="submit"]').click();
}

const roleRedirectCases = [
  {
    name: 'platform admin is redirected to platform admin dashboard',
    identifier: 'platform.admin@meshva.com',
    expectedUrl: process.env.E2E_PLATFORM_ADMIN_URL ?? 'http://127.0.0.1:3010/__role/platform-admin',
  },
  {
    name: 'owner is redirected to owner dashboard',
    identifier: 'owner@meshva.com',
    expectedUrl: process.env.E2E_OWNER_URL ?? 'http://127.0.0.1:3010/__role/owner',
  },
  {
    name: 'manager is redirected to manager dashboard',
    identifier: 'manager@meshva.com',
    expectedUrl: process.env.E2E_MANAGER_URL ?? 'http://127.0.0.1:3010/__role/manager',
  },
  {
    name: 'front desk is redirected to front desk dashboard',
    identifier: 'frontdesk@meshva.com',
    expectedUrl: process.env.E2E_FRONT_DESK_URL ?? 'http://127.0.0.1:3010/today-board',
  },
  {
    name: 'finance is redirected to finance dashboard',
    identifier: 'finance@meshva.com',
    expectedUrl: process.env.E2E_FINANCE_URL ?? 'http://127.0.0.1:3010/__role/finance',
  },
  {
    name: 'housekeeping is redirected to housekeeping dashboard',
    identifier: 'housekeeping@meshva.com',
    expectedUrl: process.env.E2E_HOUSEKEEPING_URL ?? 'http://127.0.0.1:3010/__role/housekeeping',
  },
  {
    name: 'kitchen is redirected to kitchen dashboard',
    identifier: 'kitchen@meshva.com',
    expectedUrl: process.env.E2E_KITCHEN_URL ?? 'http://127.0.0.1:3010/__role/kitchen',
  },
] as const;

test.describe('Staff Dashboard Routing', () => {
  for (const roleRedirectCase of roleRedirectCases) {
    test(roleRedirectCase.name, async ({ page }) => {
      await loginFromFrontDesk(page, roleRedirectCase.identifier);
      await expect(page).toHaveURL(normalizeExpectedUrl(roleRedirectCase.expectedUrl));
    });
  }
});
