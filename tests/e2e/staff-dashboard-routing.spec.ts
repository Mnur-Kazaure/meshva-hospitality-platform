import { expect, test, type Page } from '@playwright/test';

const staffPassword = process.env.E2E_STAFF_PASSWORD ?? 'Meshva123!';
const frontDeskBaseUrl = process.env.E2E_FRONT_DESK_BASE_URL ?? 'http://127.0.0.1:3010';
const managerBaseUrl = process.env.E2E_MANAGER_BASE_URL ?? 'http://127.0.0.1:3020';
const financeBaseUrl = process.env.E2E_FINANCE_BASE_URL ?? 'http://127.0.0.1:3030';
const housekeepingBaseUrl = process.env.E2E_HOUSEKEEPING_BASE_URL ?? 'http://127.0.0.1:3040';
const ownerBaseUrl = process.env.E2E_OWNER_BASE_URL ?? 'http://127.0.0.1:3050';
const platformAdminBaseUrl = process.env.E2E_PLATFORM_ADMIN_BASE_URL ?? 'http://127.0.0.1:3060';
const kitchenBaseUrl = process.env.E2E_KITCHEN_BASE_URL ?? 'http://127.0.0.1:3080';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function loginStaff(page: Page, appBaseUrl: string, identifier: string): Promise<void> {
  await page.goto(`${appBaseUrl}/login`);
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  await page.getByLabel('Email or phone').fill(identifier);
  await page.getByLabel('Password').fill(staffPassword);
  await page.locator('button[type="submit"]').click();
}

test.describe('Staff Dashboard Routing', () => {
  test('front-desk app redirects manager user to manager dashboard URL', async ({ page }) => {
    await loginStaff(page, frontDeskBaseUrl, 'manager@meshva.com');
    await expect(page).toHaveURL(new RegExp(`^${escapeRegExp(managerBaseUrl)}/ops-overview/?$`));
  });

  const dashboardCases = [
    {
      name: 'platform admin lands on tenants dashboard',
      baseUrl: platformAdminBaseUrl,
      identifier: 'platform.admin@meshva.com',
      expectedPath: '/tenants',
    },
    {
      name: 'owner lands on executive overview',
      baseUrl: ownerBaseUrl,
      identifier: 'owner@meshva.com',
      expectedPath: '/executive-overview',
    },
    {
      name: 'manager lands on ops overview',
      baseUrl: managerBaseUrl,
      identifier: 'manager@meshva.com',
      expectedPath: '/ops-overview',
    },
    {
      name: 'front desk lands on today board',
      baseUrl: frontDeskBaseUrl,
      identifier: 'frontdesk@meshva.com',
      expectedPath: '/today-board',
    },
    {
      name: 'finance lands on finance overview',
      baseUrl: financeBaseUrl,
      identifier: 'finance@meshva.com',
      expectedPath: '/finance-overview',
    },
    {
      name: 'housekeeping lands on task board',
      baseUrl: housekeepingBaseUrl,
      identifier: 'housekeeping@meshva.com',
      expectedPath: '/task-board',
    },
    {
      name: 'kitchen lands on live orders',
      baseUrl: kitchenBaseUrl,
      identifier: 'kitchen@meshva.com',
      expectedPath: '/orders',
    },
  ] as const;

  for (const dashboardCase of dashboardCases) {
    test(dashboardCase.name, async ({ page }) => {
      await loginStaff(page, dashboardCase.baseUrl, dashboardCase.identifier);
      await expect(page).toHaveURL(
        new RegExp(`^${escapeRegExp(dashboardCase.baseUrl)}${escapeRegExp(dashboardCase.expectedPath)}/?$`),
      );
    });
  }
});
