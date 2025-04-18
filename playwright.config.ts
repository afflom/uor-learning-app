import { defineConfig, devices } from '@playwright/test';

// Playwright Test configuration for end-to-end browser validation
export default defineConfig({
  testDir: 'tests',
  timeout: 60000,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 0,
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    // Build and start Next.js on port 4173 for end-to-end tests
    command: 'npm run build && npm run preview -- --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});