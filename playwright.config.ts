import { defineConfig, devices } from '@playwright/test';

// Playwright Test configuration for end-to-end browser validation
export default defineConfig({
  testDir: 'tests',
  timeout: 60000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'html' : 'list',
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 30000,
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    // Build and start Next.js for end-to-end tests
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});