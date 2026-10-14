import { test as base, expect, type Page } from '@playwright/test';

export const test = base;
export { expect };

test.afterEach(async ({ page }, info) => {
  if (info.status === 'skipped' || page.isClosed()) return;
  await info.attach('Application state after test', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});

export function hasParticipant() {
  return Boolean(process.env.ORVIO_TEST_EMAIL && process.env.ORVIO_TEST_PASSWORD);
}

export async function login(page: Page, returnPath = '/dashboard') {
  await page.goto(`/login?redirectTo=${encodeURIComponent(returnPath)}`);
  await page.getByLabel('Email', { exact: true }).fill(process.env.ORVIO_TEST_EMAIL!);
  await page.getByLabel('Password', { exact: true }).fill(process.env.ORVIO_TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${returnPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\?.*)?$`));
}

export function fixtureEventId() {
  const id = process.env.ORVIO_TEST_EVENT_ID || '';
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : undefined;
}

export async function openFixtureEvent(page: Page) {
  await page.goto(`/events/${fixtureEventId()}`);
  // The explicit ID and optional exact title identify the selected test fixture.
  const title = process.env.ORVIO_TEST_EVENT_TITLE;
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(title || /^DA3 Test/);
}

export async function cancelRegistration(page: Page) {
  await page.getByRole('button', { name: 'Cancel Registration', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Confirm cancellation', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Register for Event', exact: true })).toBeVisible();
}
