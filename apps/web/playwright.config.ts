import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

const port = process.env.PLAYWRIGHT_PORT ?? '4173';
const edgeDirectory = resolve(__dirname, '../edge');
const wrangler = resolve(edgeDirectory, 'node_modules/wrangler/bin/wrangler.js');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
  ],
  webServer: {
    command: `"${process.execPath}" "${wrangler}" pages dev ../web/out --port ${port}`,
    cwd: edgeDirectory,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
