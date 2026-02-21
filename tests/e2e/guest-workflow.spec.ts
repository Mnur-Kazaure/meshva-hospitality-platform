import { expect, test } from '@playwright/test';
import { formatDateFromToday } from './helpers/date';

const guestIdentifier = process.env.E2E_GUEST_IDENTIFIER ?? 'amina.guest@meshva.demo';
const guestPassword = process.env.E2E_GUEST_PASSWORD ?? 'Meshva123!';
const guestPhone = process.env.E2E_GUEST_PHONE ?? '+2348011111111';

test.describe('Guest Portal E2E', () => {
  test('guest can search, authenticate, book, modify, and cancel', async ({ page }) => {
    const checkIn = formatDateFromToday(30);
    const checkOut = formatDateFromToday(32);
    const modifiedCheckOut = formatDateFromToday(33);

    await page.goto('/home');
    await expect(page.getByRole('heading', { name: 'Search Hotels' })).toBeVisible();

    await page.getByLabel('Check-in').fill(checkIn);
    await page.getByLabel('Check-out').fill(checkOut);
    await page.getByRole('button', { name: 'Search Availability' }).click();

    await expect(page).toHaveURL(/\/property-listing\?/);
    await expect(page.getByText('Available properties')).toBeVisible();
    await page.locator('article.card').first().getByRole('link', { name: 'Select Room' }).click();

    await expect(page).toHaveURL(/\/availability-room-selection\?/);
    await page.getByRole('link', { name: 'Select' }).first().click();

    await expect(page).toHaveURL(/\/login\?next=/);
    await page.getByLabel('Email or phone').fill(guestIdentifier);
    await page.getByLabel('Password').fill(guestPassword);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/booking-confirmation\?/);
    await page.getByLabel('Full Name *').fill('Amina Yusuf E2E');
    await page.getByLabel('Phone (WhatsApp) *').fill(guestPhone);
    await page.getByRole('button', { name: 'Confirm Booking' }).click();

    await expect(page).toHaveURL(/\/booking-success\?/);
    await expect(page.getByRole('heading', { name: 'Reservation Confirmed' })).toBeVisible();

    const successUrl = new URL(page.url());
    const reservationId = successUrl.searchParams.get('reservationId');
    expect(reservationId).toBeTruthy();

    await page.goto(`/modify-booking?reservationId=${reservationId}`);
    await expect(page.getByRole('heading', { name: 'Modify Booking' })).toBeVisible();
    await page.getByLabel('New Check-out').fill(modifiedCheckOut);
    await page.getByRole('button', { name: 'Submit Modification' }).click();
    await expect(page.getByText('Booking updated. New stay dates:')).toBeVisible();

    await page.goto(`/cancel-booking?reservationId=${reservationId}`);
    await expect(page.getByRole('heading', { name: 'Cancel Booking' })).toBeVisible();
    await page.getByLabel('Reason').fill('Playwright e2e cancellation test');
    await page.getByRole('button', { name: 'Cancel Reservation' }).click();
    await expect(page.getByText(/cancelled successfully/i)).toBeVisible();
  });
});
