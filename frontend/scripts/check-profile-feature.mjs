import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

loadEnvFile('.env.local');
loadEnvFile('.env.test.local');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= resolve('.playwright-browsers');
const { chromium } = await import('playwright');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
async function checkProfileFeature() {
const signIn = await client.auth.signInWithPassword({
  email: process.env.ORVIO_TEST_EMAIL, password: process.env.ORVIO_TEST_PASSWORD,
});
assert.equal(signIn.error, null, 'Dedicated test account must authenticate');
const userId = signIn.data.user.id;
const original = await client.from('profiles').select('full_name,updated_at').eq('id', userId).single();
assert.equal(original.error, null, 'Read the original profile before modifying it');
const browser = await chromium.launch();
const { expect: baseExpect } = await import('@playwright/test');
const expect = baseExpect.configure({ timeout: 20_000 });
let wroteProfile = false;
try {
  const page = await browser.newPage();
  const base = process.env.ORVIO_TEST_BASE_URL || 'http://localhost:3010';
  await page.goto(`${base}/login?redirectTo=%2Fprofile`);
  await page.getByLabel('Email', { exact: true }).fill(process.env.ORVIO_TEST_EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(process.env.ORVIO_TEST_PASSWORD);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  const name = page.getByLabel('Display name', { exact: true });
  await name.fill('x');
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.locator('form').getByRole('alert')).toContainText('at least 2');
  await name.fill('DA3 Profile Verification');
  wroteProfile = true;
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Your profile has been updated.');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('DA3 Profile Verification');
  await page.reload();
  await expect(name).toHaveValue('DA3 Profile Verification');
  await name.fill('Unsaved Name');
  await page.getByRole('button', { name: 'Discard changes', exact: true }).click();
  await expect(name).toHaveValue('DA3 Profile Verification');
  await page.goto(`${base}/dashboard`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('DA3 Profile Verification');
  const output = resolve('../output/assignment3/application-checks');
  await mkdir(output, { recursive: true });
  await page.goto(`${base}/profile`);
  await page.screenshot({ path: resolve(output, 'profile-editing.png'), fullPage: true });
  console.log('Profile browser checks passed: validation, save, persistence, discard and dashboard name.');
} finally {
  if (wroteProfile) {
    const restored = await client.from('profiles').update(original.data).eq('id', userId).select('full_name').single();
    assert.equal(restored.error, null, 'Restore the original dedicated test profile');
    assert.equal(restored.data.full_name, original.data.full_name);
    console.log('Original test-account profile restored.');
  }
  await client.auth.signOut({ scope: 'local' });
  await browser.close();
}
}

await checkProfileFeature().catch((error) => {
  // Playwright's raw error snapshot can contain login input values.
  console.error('Profile verification failed:', String(error.message).split('\n')[0]);
  process.exitCode = 1;
});
