import { defineConfig, devices } from '@playwright/test';

const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: isCi ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  reporter: isCi
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_GUEST_BASE_URL ?? 'http://127.0.0.1:3070',
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
      command: 'bash scripts/e2e/start-web-apps.sh',
      url: process.env.E2E_GUEST_BASE_URL ?? 'http://127.0.0.1:3070/home',
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
