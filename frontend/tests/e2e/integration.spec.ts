import { test, expect, login, hasParticipant, fixtureEventId, openFixtureEvent, cancelRegistration } from './support';

test.describe('Integration of browser pages and authenticated application', () => {
  test('IT-01 guest access redirects through authentication', async ({ page }) => {
    await page.goto('/registrations');
    await expect(page).toHaveURL(/\/login\?redirectTo=/);
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
  });

  test('IT-02 login connects to the authenticated registration history', async ({ page }) => {
    test.skip(!hasParticipant(), 'Add the dedicated participant credentials to .env.test.local.');
    await login(page, '/registrations');
    await expect(page.getByRole('heading', { name: 'My Registrations', exact: true })).toBeVisible();
  });

  test('IT-03 registration persists across pages and cancellation retains history', async ({ page }) => {
    test.skip(!hasParticipant() || !fixtureEventId(), 'Configure the dedicated participant and approved DA3 Test event.');
    await login(page);
    await openFixtureEvent(page);
    await expect(page.getByRole('button', { name: 'Register for Event', exact: true })).toBeVisible();
    let createdActiveRegistration = false;
    try {
      await test.step('Register for the approved future test event', async () => {
        createdActiveRegistration = true;
        await page.getByRole('button', { name: 'Register for Event', exact: true }).click();
        await expect(page.getByText("You're Registered", { exact: true })).toBeVisible();
        await test.info().attach('Registered event', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
      });
      await test.step('Verify the committed registration after navigation', async () => {
        await page.goto('/registrations');
        const activeCard = page.locator('article').filter({ has: page.locator(`a[href="/events/${fixtureEventId()}"]`) }).filter({ hasText: "You're Registered" });
        await expect(activeCard).toHaveCount(1);
        await openFixtureEvent(page);
        await expect(page.getByRole('button', { name: 'Cancel Registration', exact: true })).toBeVisible();
      });
      await test.step('Cancel and confirm retained history', async () => {
        await cancelRegistration(page);
        createdActiveRegistration = false;
        await page.goto('/registrations');
        const cancelledCards = page.locator('article').filter({ has: page.locator(`a[href="/events/${fixtureEventId()}"]`) }).filter({ hasText: 'Cancelled' });
        await expect(cancelledCards.first()).toBeVisible();
      });
    } finally {
      // Cancel only the registration made by this case; never delete account/event records.
      if (createdActiveRegistration) {
        await openFixtureEvent(page);
        if (await page.getByRole('button', { name: 'Cancel Registration', exact: true }).count()) {
          await cancelRegistration(page);
        }
      }
    }
  });

  test('IT-04 directory search retrieves the selected approved event', async ({ page }) => {
    test.skip(!fixtureEventId() || !process.env.ORVIO_TEST_EVENT_TITLE, 'Configure the fixture ID and exact title.');
    await page.goto('/events');
    await page.getByRole('textbox', { name: 'Search events by title' }).fill(process.env.ORVIO_TEST_EVENT_TITLE!);
    await expect(page).toHaveURL(/\/events\?search=/);
    const card = page.locator(`a[href="/events/${fixtureEventId()}"]`);
    await expect(card).toContainText(process.env.ORVIO_TEST_EVENT_TITLE!);
    await card.click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(process.env.ORVIO_TEST_EVENT_TITLE!);
    await expect(page.getByText('approved', { exact: true })).toBeVisible();
  });

  test('IT-05 a missing database event returns the not-found view', async ({ page }) => {
    await page.goto('/events/00000000-0000-4000-8000-000000000000');
    await expect(page.getByRole('heading', { name: '404', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Register for Event', exact: true })).toHaveCount(0);
  });

  test('IT-06 a participant cannot retrieve another creator’s attendees', async ({ page }) => {
    test.skip(!hasParticipant() || !fixtureEventId(), 'Configure the dedicated participant and fixture.');
    await login(page);
    await openFixtureEvent(page);
    await expect(page.getByRole('link', { name: /View Attendees/ })).toHaveCount(0);
    await page.goto(`/events/${fixtureEventId()}/attendees`);
    await expect(page.getByRole('heading', { name: '404', exact: true })).toBeVisible();
    await expect(page.getByRole('table')).toHaveCount(0);
  });

  test('IT-07 a participant cannot load another creator’s event editor', async ({ page }) => {
    test.skip(!hasParticipant() || !fixtureEventId(), 'Configure the dedicated participant and fixture.');
    await login(page);
    await page.goto(`/events/${fixtureEventId()}/edit`);
    await expect(page.getByRole('heading', { name: '404', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Edit Event', exact: true })).toHaveCount(0);
  });
});
