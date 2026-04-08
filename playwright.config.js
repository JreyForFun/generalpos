// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * FlexPOS E2E Test Configuration
 * Uses Playwright with Electron support for desktop app testing.
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 0,
  workers: 1,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
