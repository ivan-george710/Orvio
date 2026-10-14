import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= resolve(root, '.playwright-browsers');
const { chromium } = await import('playwright');
const output = resolve(root, '../output/assignment3/testing');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto('http://127.0.0.1:9324', { waitUntil: 'networkidle' });
  await page.getByText('registrations.ts', { exact: false }).filter({ visible: true }).first().waitFor();
  await page.screenshot({ path: resolve(output, 'mutation-summary.png'), fullPage: true });
  console.log('Saved mutation-summary.png from the actual Stryker report.');
  await page.goto('http://127.0.0.1:9323', { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: /Passed/ }).waitFor();
  await page.screenshot({ path: resolve(output, 'playwright-all-summary.png'), fullPage: true });
  console.log('Saved playwright-all-summary.png from the actual combined Playwright report.');
  for (const [suite, search] of [['integration', 'IT-'], ['regression', 'RG-']]) {
    await page.getByRole('textbox', { name: 'Search tests' }).fill(search);
    await page.getByRole('link', { name: new RegExp(`${search}07`) }).waitFor();
    await page.screenshot({ path: resolve(output, `${suite}-summary.png`), fullPage: true });
    console.log(`Saved ${suite}-summary.png by filtering the actual combined report.`);
  }
} finally {
  await browser.close();
}
