import { test, expect, login, hasParticipant, fixtureEventId, openFixtureEvent, cancelRegistration } from './support';

test.describe('Regression baseline for established Orvio workflows', () => {
  test('RG-01 landing page retains its event discovery entry point', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Discover');
    await expect(page.getByRole('link', { name: 'Explore Events', exact: true }).first()).toHaveAttribute('href', '/events');
  });

  test('RG-02 login and signup keep their labeled inputs', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
    await page.goto('/signup');
    await expect(page.getByLabel('Full Name', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Confirm Password', { exact: true })).toBeVisible();
  });

  test('RG-03 mismatched signup passwords remain rejected locally', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Full Name', { exact: true }).fill('DA3 Test Participant');
    await page.getByLabel('Email', { exact: true }).fill('da3-test@example.invalid');
    await page.getByLabel('Password', { exact: true }).fill('Mismatch-Test-A1!');
    await page.getByLabel('Confirm Password', { exact: true }).fill('Mismatch-Test-B2!');
    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('form').getByRole('alert')).toHaveText('Passwords do not match.');
    await expect(page).toHaveURL(/\/signup$/);
  });

  test('RG-04 mobile account form remains visible and fits the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('RG-05 an authenticated participant can still view their profile', async ({ page }) => {
    test.skip(!hasParticipant(), 'Add dedicated participant credentials.');
    await login(page);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Email', exact: true })).toBeVisible();
    await expect(page.getByText(process.env.ORVIO_TEST_EMAIL!, { exact: true })).toBeVisible();
  });

  test('RG-06 cancellation dialog can be dismissed without releasing a place', async ({ page }) => {
    test.skip(!hasParticipant() || !fixtureEventId(), 'Configure the participant and DA3 Test event.');
    await login(page);
    await openFixtureEvent(page);
    let createdRegistration = false;
    try {
      if (await page.getByRole('button', { name: 'Register for Event', exact: true }).count()) {
        createdRegistration = true;
        await page.getByRole('button', { name: 'Register for Event', exact: true }).click();
        await expect(page.getByText("You're Registered", { exact: true })).toBeVisible();
      }
      await page.getByRole('button', { name: 'Cancel Registration', exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Keep my spot', exact: true }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
      await expect(page.getByText("You're Registered", { exact: true })).toBeVisible();
      await test.info().attach('Registration retained after dismissing cancellation', {
        body: await page.screenshot({ fullPage: true }), contentType: 'image/png',
      });
      await openFixtureEvent(page);
      await expect(page.getByRole('button', { name: 'Cancel Registration', exact: true })).toBeVisible();
    } finally {
      if (createdRegistration) {
        await openFixtureEvent(page);
        if (await page.getByRole('button', { name: 'Cancel Registration', exact: true }).count()) {
          await cancelRegistration(page);
        }
      }
    }
  });

  test('RG-07 login rejects an external return destination', async ({ page }) => {
    test.skip(!hasParticipant(), 'Configure the dedicated participant.');
    await page.goto('/login?redirectTo=https%3A%2F%2Fexample.invalid%2Foutside');
    await page.getByLabel('Email', { exact: true }).fill(process.env.ORVIO_TEST_EMAIL!);
    await page.getByLabel('Password', { exact: true }).fill(process.env.ORVIO_TEST_PASSWORD!);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page).toHaveURL(/http:\/\/localhost:3010\/dashboard$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome');
  });
});
