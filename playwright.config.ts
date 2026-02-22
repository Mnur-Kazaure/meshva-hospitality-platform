import { defineConfig, devices } from '@playwright/test';

const isCi = Boolean(process.env.CI);
const guestBaseUrl = (process.env.E2E_GUEST_BASE_URL ?? 'http://127.0.0.1:3070').replace(/\/$/, '');
const guestReadyUrl = process.env.E2E_GUEST_READY_URL ?? `${guestBaseUrl}/home`;
const frontDeskBaseUrl = (process.env.E2E_FRONT_DESK_BASE_URL ?? 'http://127.0.0.1:3010').replace(
  /\/$/,
  '',
);
const frontDeskReadyUrl = process.env.E2E_FRONT_DESK_READY_URL ?? `${frontDeskBaseUrl}/login`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: isCi ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 30_000,
  },
  reporter: isCi
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: guestBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'bash scripts/e2e/start-api.sh',
      url: 'http://127.0.0.1:8081/v1/health',
      timeout: 120_000,
      reuseExistingServer: !isCi,
    },
    {
      command: 'bash scripts/e2e/start-web-guest.sh',
      url: guestReadyUrl,
      timeout: 240_000,
      reuseExistingServer: !isCi,
    },
    {
      command: 'bash scripts/e2e/start-web-front-desk.sh',
      url: frontDeskReadyUrl,
      timeout: 240_000,
      reuseExistingServer: !isCi,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
