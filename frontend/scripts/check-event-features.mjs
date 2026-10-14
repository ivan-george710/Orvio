import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

loadEnvFile('.env.local');
loadEnvFile('.env.test.local');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= resolve('.playwright-browsers');
const { chromium } = await import('playwright');
const { expect: baseExpect } = await import('@playwright/test');
const expect = baseExpect.configure({ timeout: 20_000 });
const base = process.env.ORVIO_TEST_BASE_URL || 'http://localhost:3010';
const title = `DA3 Feature Verification ${Date.now()}`;
const editedTitle = `${title} Edited`;
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function checkEventFeatures() {
  const login = await client.auth.signInWithPassword({
    email: process.env.ORVIO_TEST_EMAIL, password: process.env.ORVIO_TEST_PASSWORD,
  });
  assert.equal(login.error, null, 'Dedicated test account must authenticate');
  const userId = login.data.user.id;
  const fixture = await client.from('events').select('title,category,venue').eq('id', process.env.ORVIO_TEST_EVENT_ID).single();
  assert.equal(fixture.error, null, 'The approved assignment fixture must exist');
  const browser = await chromium.launch();
  let bannerPath;
  try {
    const page = await browser.newPage({ timezoneId: 'Asia/Dubai', viewport: { width: 1440, height: 1000 } });
    await page.goto(`${base}/login?redirectTo=%2Fevents%2Fcreate`);
    await page.getByLabel('Email', { exact: true }).fill(process.env.ORVIO_TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(process.env.ORVIO_TEST_PASSWORD);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page).toHaveURL(/\/events\/create$/);
    await page.getByLabel('Title', { exact: true }).fill(title);
    await page.getByLabel('Description', { exact: true }).fill('Synthetic disposable fixture for category, banner and date verification.');
    await page.getByLabel('Venue', { exact: true }).fill('DA3 Verification Hall');
    await page.getByLabel('Category', { exact: true }).selectOption('technology');
    await page.getByLabel('Date and Time', { exact: true }).fill('2035-05-15T18:45');
    await page.getByLabel('Maximum Participants', { exact: true }).fill('3');
    await page.getByLabel('Event banner', { exact: true }).setInputFiles({
      name: 'rejected.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg></svg>'),
    });
    await expect(page.locator('#banner-error')).toContainText('JPEG, PNG or WebP');
    // A genuine one-pixel PNG is sufficient to verify transport and display.
    await page.getByLabel('Event banner', { exact: true }).setInputFiles({
      name: 'da3-verification.png', mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jT4kAAAAASUVORK5CYII=', 'base64'),
    });
    await expect(page.getByText('Banner uploaded. Save the event to use it.', { exact: true })).toBeVisible();
    const preview = page.getByRole('img', { name: 'Preview event banner', exact: true });
    const previewUrl = await preview.getAttribute('src');
    bannerPath = new URL(previewUrl).pathname.split('/event-banners/')[1];
    assert.ok(bannerPath.startsWith(`${userId}/`), 'The uploaded object belongs to the test account');
    console.log('Banner checks passed: unsupported type rejected; PNG uploaded into account folder.');
    const output = resolve('../output/assignment3/application-checks');
    await mkdir(output, { recursive: true });
    await page.screenshot({ path: resolve(output, 'event-form-category-banner.png'), fullPage: true });
    await page.getByRole('button', { name: 'Submit Event', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    const created = await client.from('events').select('id,created_by,status,category,banner_url,event_datetime')
      .eq('created_by', userId).eq('title', title).single();
    assert.equal(created.error, null, 'A pending event must be stored');
    assert.equal(created.data.status, 'pending');
    assert.equal(created.data.category, 'technology');
    assert.equal(created.data.banner_url, previewUrl);
    assert.equal(Date.parse(created.data.event_datetime), Date.parse('2035-05-15T14:45:00Z'));
    const id = created.data.id;
    await page.goto(`${base}/events/${id}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.getByRole('img', { name: `${title} event banner`, exact: true })).toBeVisible();
    console.log('Event creation checks passed: pending ownership, category, banner and UTC instant persisted.');
    await page.goto(`${base}/events/${id}/edit`);
    await expect(page.getByLabel('Date and Time', { exact: true })).toHaveValue('2035-05-15T18:45');
    await expect(page.getByLabel('Category', { exact: true })).toHaveValue('technology');
    await page.getByLabel('Title', { exact: true }).fill(editedTitle);
    await page.getByLabel('Category', { exact: true }).selectOption('workshop');
    await page.getByRole('button', { name: 'Remove banner', exact: true }).click();
    await page.getByRole('button', { name: 'Update Event', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    const edited = await client.from('events').select('title,category,banner_url,event_datetime').eq('id', id).single();
    assert.equal(edited.error, null);
    assert.equal(edited.data.title, editedTitle);
    assert.equal(edited.data.category, 'workshop');
    assert.equal(edited.data.banner_url, null);
    assert.equal(Date.parse(edited.data.event_datetime), Date.parse(created.data.event_datetime));
    console.log('Event editing checks passed: metadata changed without shifting the event time.');
    await page.goto(`${base}/events`);
    await page.getByRole('textbox', { name: 'Search events by title', exact: true }).fill(fixture.data.title);
    await expect(page).toHaveURL(/search=/);
    await page.getByLabel('Category', { exact: true }).selectOption(fixture.data.category || 'other');
    await page.getByLabel('Date', { exact: true }).selectOption('upcoming');
    await page.getByLabel('Sort by', { exact: true }).selectOption('title');
    await page.getByLabel('Venue', { exact: true }).fill(fixture.data.venue);
    await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
    await expect(page).toHaveURL(/category=/);
    await expect(page.locator(`a[href="/events/${process.env.ORVIO_TEST_EVENT_ID}"]`)).toBeVisible();
    await page.screenshot({ path: resolve(output, 'event-discovery-filters.png'), fullPage: true });
    await page.getByRole('link', { name: 'Clear filters', exact: true }).click();
    await expect(page).not.toHaveURL(/category=/);
    await expect(page).toHaveURL(/search=/);
    console.log('Discovery checks passed: category/date/venue filters combine and clearing preserves search.');
  } finally {
    // Clean up only this run's unique disposable pending event, never an existing event.
    const pending = await client.from('events').select('id,status').eq('created_by', userId).in('title', [title, editedTitle]);
    assert.equal(pending.error, null, 'Read disposable fixture IDs for cleanup');
    for (const event of pending.data) {
      if (event.status !== 'pending') continue;
      const removed = await client.from('events').delete().eq('id', event.id).eq('created_by', userId).eq('status', 'pending');
      assert.equal(removed.error, null, 'Remove only the disposable pending fixture');
    }
    if (bannerPath) {
      const removed = await client.storage.from('event-banners').remove([bannerPath]);
      assert.equal(removed.error, null, 'Remove only this run’s uploaded test image');
    }
    await client.auth.signOut({ scope: 'local' });
    await browser.close();
    console.log('Disposable event and image cleanup completed.');
  }
}

await checkEventFeatures().catch((error) => {
  console.error('Event feature verification failed:', String(error.message).split('\n')[0]);
  process.exitCode = 1;
});
