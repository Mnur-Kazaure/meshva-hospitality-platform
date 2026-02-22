import { expect, test } from '@playwright/test';
import { formatDateFromToday } from './helpers/date';

const guestIdentifier = process.env.E2E_GUEST_IDENTIFIER ?? 'amina.guest@meshva.demo';
const guestPassword = process.env.E2E_GUEST_PASSWORD ?? 'Meshva123!';
const guestPhone = process.env.E2E_GUEST_PHONE ?? '+2348011111111';

test.describe('Guest Portal E2E', () => {
  test('guest can search, authenticate, complete booking, and view bookings', async ({ page }) => {
    const searchOffsets = [30, 14, 7, 3, 45, 60, 90];
    let selectedRoom = false;

    for (const offset of searchOffsets) {
      const checkIn = formatDateFromToday(offset);
      const checkOut = formatDateFromToday(offset + 2);

      await page.goto('/home');
      await expect(page.getByRole('heading', { name: 'Search Hotels' })).toBeVisible();

      await page.getByLabel('Location').fill('');
      await page.getByLabel('Check-in').fill(checkIn);
      await page.getByLabel('Check-out').fill(checkOut);
      await page.getByLabel('Adults').selectOption('1');
      await page.locator('form').getByRole('button', { name: 'Search Availability' }).click();

      await expect(page).toHaveURL(/\/property-listing\?/, { timeout: 45_000 });
      await expect(page.getByText('Available properties')).toBeVisible();

      const selectRoomLink = page.locator('article.card').first().getByRole('link', { name: 'Select Room' });
      if ((await selectRoomLink.count()) === 0) {
        continue;
      }

      await selectRoomLink.click();
      selectedRoom = true;
      break;
    }

    if (!selectedRoom) {
      throw new Error('No available rooms found across tested booking windows.');
    }

    await expect(page).toHaveURL(/\/availability-room-selection\?/, { timeout: 45_000 });
    await page.getByRole('link', { name: 'Select' }).first().click();

    await expect(page).toHaveURL(/\/login\?next=/, { timeout: 45_000 });
    await page.getByLabel('Email or phone').fill(guestIdentifier);
    await page.getByLabel('Password').fill(guestPassword);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/booking-confirmation\?/, { timeout: 45_000 });
    await page.getByLabel('Full Name *').fill('Amina Yusuf E2E');
    await page.getByLabel('Phone (WhatsApp) *').fill(guestPhone);
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    await expect(page).toHaveURL(/\/booking-success\?/, { timeout: 45_000 });
    await expect(page.getByRole('heading', { name: 'Reservation Confirmed' })).toBeVisible();

    await page.getByRole('link', { name: 'View My Bookings' }).click();
    await expect(page).toHaveURL('/my-bookings');
    await expect(page.getByRole('heading', { name: 'My Bookings' })).toBeVisible();
    await expect(page.getByText('Upcoming')).toBeVisible();
    await expect(page.getByRole('link', { name: 'View' }).first()).toBeVisible();
  });
});
