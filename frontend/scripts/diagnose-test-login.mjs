import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';

loadEnvFile('.env.local');
loadEnvFile('.env.test.local');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= resolve('.playwright-browsers');
const { chromium } = await import('playwright');
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto('http://localhost:3010/login?redirectTo=%2Fregistrations');
  await page.getByLabel('Email', { exact: true }).fill(process.env.ORVIO_TEST_EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(process.env.ORVIO_TEST_PASSWORD);
  const responsePromise = page.waitForResponse((r) => r.url().includes('/auth/v1/token'), { timeout: 30000 });
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  const response = await responsePromise;
  const request = response.request();
  const payload = request.postDataJSON();
  console.log(JSON.stringify({
    emailMatchesSavedValue: payload.email === process.env.ORVIO_TEST_EMAIL,
    passwordMatchesSavedValue: payload.password === process.env.ORVIO_TEST_PASSWORD,
    projectMatchesLocalConfiguration: new URL(request.url()).origin === new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin,
    httpStatus: response.status(),
    errorCode: response.ok() ? null : (await response.json()).error_code,
  }));
} finally {
  await browser.close();
}
