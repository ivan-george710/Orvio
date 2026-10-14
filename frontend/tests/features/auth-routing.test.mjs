import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSubject } from '../support/load-subject.mjs';

const routes = loadSubject('../../lib/auth-routing.ts');

test('all account and administrative roots require authentication', () => {
  for (const path of ['/dashboard','/registrations','/admin','/profile','/events/create']) {
    assert.equal(routes.protectedPath(path), true, path);
    assert.equal(routes.protectedPath(path + '/nested'), true, path);
  }
});

test('public event discovery and details remain accessible without authentication', () => {
  for (const path of ['/','/events','/events/event-id','/login','/signup']) {
    assert.equal(routes.protectedPath(path), false, path);
  }
});

test('similarly named public routes are not mistaken for private descendants', () => {
  for (const path of ['/administrator','/profile-public','/dashboard-preview','/events/createable']) {
    assert.equal(routes.protectedPath(path), false, path);
  }
});

test('event editing and attendee management are protected dynamic routes', () => {
  for (const path of ['/events/event-id/edit','/events/event-id/attendees','/events/event-id/attendees/export']) {
    assert.equal(routes.protectedPath(path), true, path);
  }
});

test('protected subroute words elsewhere in a URL do not imply an event-management route', () => {
  for (const path of ['/events/edit','/events/attendees','/other/events/id/edit','/events/id/editing']) {
    assert.equal(routes.protectedPath(path), false, path);
  }
});

test('the login redirect retains internal query parameters inside redirectTo', () => {
  const url = new URL(routes.loginRedirectPath('/events/id/attendees','?page=2'), 'https://example.invalid');
  assert.equal(url.pathname, '/login');
  assert.equal(url.searchParams.get('redirectTo'), '/events/id/attendees?page=2');
  assert.deepEqual([...url.searchParams.keys()], ['redirectTo']);
});

test('empty query strings do not add an unnecessary question mark to the return path', () => {
  const url = new URL(routes.loginRedirectPath('/profile',''), 'https://example.invalid');
  assert.equal(url.searchParams.get('redirectTo'), '/profile');
});

test('nested URL-like query values remain part of an internal destination', () => {
  const url = new URL(routes.loginRedirectPath('/admin','?search=https%3A%2F%2Fexample.invalid'), 'https://example.invalid');
  assert.equal(url.searchParams.get('redirectTo'), '/admin?search=https%3A%2F%2Fexample.invalid');
  assert.equal(url.origin, 'https://example.invalid');
});
