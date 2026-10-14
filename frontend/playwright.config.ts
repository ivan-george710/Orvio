import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

for (const file of ['.env.local', '.env.test.local']) {
  if (existsSync(file)) loadEnvFile(file);
}

const baseURL = process.env.ORVIO_TEST_BASE_URL || 'http://localhost:3010';
const suite = ['integration', 'regression'].includes(process.env.ORVIO_TEST_SUITE || '')
  ? process.env.ORVIO_TEST_SUITE!
  : 'all';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  outputDir: `test-results/${suite}`,
  reporter: [
    ['list'],
    ['html', { outputFolder: `reports/playwright/${suite}`, open: 'never' }],
    ['json', { outputFile: `reports/playwright/${suite}/results.json` }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    screenshot: 'only-on-failure',
    // Authentication traces can contain credentials. Evidence uses screenshots.
    trace: 'off',
    video: 'off',
  },
  projects: [
    { name: 'integration', testMatch: 'integration.spec.ts' },
    { name: 'regression', testMatch: 'regression.spec.ts' },
  ],
  webServer: process.env.ORVIO_TEST_BASE_URL ? undefined : {
    command: 'npm run dev -- --port 3010',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
