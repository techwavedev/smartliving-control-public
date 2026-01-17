/**
 * Playwright configuration for SmartLiving Control E2E tests
 */
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.js',
  timeout: 30000,
  retries: 1,
  workers: 1, // Run tests serially for Electron
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }]
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  }
});
