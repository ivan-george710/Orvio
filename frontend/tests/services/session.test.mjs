import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSubject } from '../support/load-subject.mjs';

const routing = loadSubject('../../lib/auth-routing.ts');

function cookieJar(initial = []) {
  const values = new Map(initial.map((cookie) => [cookie.name, { ...cookie }]));
  return {
    getAll: () => [...values.values()].map((cookie) => ({ ...cookie })),
    set(name, value, options) {
      const cookie = typeof name === 'object' ? name : { name, value, ...options };
      values.set(cookie.name, { ...cookie });
    },
  };
}

function setup({ path = '/dashboard', user = { id: 'test-account' }, error = null, refresh = [] } = {}) {
  const url = new URL(path, 'https://example.invalid');
  url.clone = () => new URL(url);
  const request = { nextUrl: url, cookies: cookieJar([{ name: 'session', value: 'old-synthetic-token' }]) };
  const responses = [];
  let cookieAdapter;
  let authReads = 0;
  function response(kind, requestOrUrl) {
    const value = {
      kind, destination: kind === 'redirect' ? new URL(requestOrUrl) : undefined,
      forwardedCookies: kind === 'next' ? requestOrUrl.cookies.getAll() : [],
      cookies: cookieJar(), headers: new Headers(),
    };
    responses.push(value);
    return value;
  }
  const subject = loadSubject('../../lib/supabase/middleware.ts', {
    'next/server': {
      NextResponse: {
        next: ({ request: incoming }) => response('next', incoming),
        redirect: (destination) => response('redirect', destination),
      },
    },
    '@supabase/ssr': {
      createServerClient: (_url, _key, options) => {
        cookieAdapter = options.cookies;
        return {
          auth: { getUser: async () => {
            authReads += 1;
            for (const update of refresh) cookieAdapter.setAll(update.cookies, update.headers);
            return { data: { user }, error };
          } },
        };
      },
    },
    '@/lib/auth-routing': routing,
  });
  return { request, responses, updateSession: subject.updateSession,
    get cookieAdapter() { return cookieAdapter; }, get authReads() { return authReads; } };
}

test('valid account sessions continue without an authentication redirect', async () => {
  const context = setup();
  const result = await context.updateSession(context.request);
  assert.equal(result.kind, 'next');
  assert.equal(context.authReads, 1);
  assert.deepEqual(context.cookieAdapter.getAll(), [{ name: 'session', value: 'old-synthetic-token' }]);
});

test('anonymous private-route access redirects to login with its query intact', async () => {
  const context = setup({ user: null, path: '/events/id/attendees?page=2' });
  const result = await context.updateSession(context.request);
  assert.equal(result.kind, 'redirect');
  assert.equal(result.destination.pathname, '/login');
  assert.equal(result.destination.searchParams.get('redirectTo'), '/events/id/attendees?page=2');
});

test('anonymous public discovery continues instead of redirecting to login', async () => {
  const context = setup({ user: null, path: '/events?search=music' });
  assert.equal((await context.updateSession(context.request)).kind, 'next');
});

test('Auth errors cannot authorize a private request merely because a user value is present', async () => {
  const context = setup({ error: { message: 'verification failed' } });
  assert.equal((await context.updateSession(context.request)).kind, 'redirect');
});

test('refreshed cookies reach both the forwarded server request and browser response', async () => {
  const context = setup({ refresh: [{ cookies: [{ name: 'session', value: 'new-synthetic-token', options: { path: '/', httpOnly: true } }] }] });
  const result = await context.updateSession(context.request);
  assert.equal(context.request.cookies.getAll()[0].value, 'new-synthetic-token');
  assert.equal(result.forwardedCookies[0].value, 'new-synthetic-token');
  assert.deepEqual(result.cookies.getAll()[0], { name: 'session', value: 'new-synthetic-token', path: '/', httpOnly: true });
});

test('Auth anti-cache headers accompany refreshed session cookies', async () => {
  const context = setup({ refresh: [{
    cookies: [{ name: 'session', value: 'new-synthetic-token', options: {} }],
    headers: { 'Cache-Control': 'private, no-store', Expires: '0', Pragma: 'no-cache' },
  }] });
  const result = await context.updateSession(context.request);
  assert.equal(result.headers.get('cache-control'), 'private, no-store');
  assert.equal(result.headers.get('expires'), '0');
  assert.equal(result.headers.get('pragma'), 'no-cache');
});

test('login redirects retain refresh cookies and anti-cache headers', async () => {
  const context = setup({ user: null, refresh: [{
    cookies: [{ name: 'session', value: '', options: { path: '/', maxAge: 0 } }],
    headers: { 'Cache-Control': 'private, no-store', Expires: '0', Pragma: 'no-cache' },
  }] });
  const result = await context.updateSession(context.request);
  assert.equal(result.kind, 'redirect');
  assert.equal(result.cookies.getAll()[0].maxAge, 0);
  assert.equal(result.headers.get('cache-control'), 'private, no-store');
  assert.equal(result.headers.get('expires'), '0');
  assert.equal(result.headers.get('pragma'), 'no-cache');
});

test('multiple refresh callbacks retain previously set cookie chunks', async () => {
  const context = setup({ refresh: [
    { cookies: [{ name: 'session.0', value: 'first', options: { path: '/' } }], headers: { 'Cache-Control': 'private, no-store' } },
    { cookies: [{ name: 'session.1', value: 'second', options: { path: '/' } }], headers: {} },
  ] });
  const result = await context.updateSession(context.request);
  assert.deepEqual(result.cookies.getAll().map((cookie) => cookie.name).sort(), ['session.0','session.1']);
  assert.equal(result.headers.get('cache-control'), 'private, no-store');
});

test('a refreshed cookie overwrites its previous response value', async () => {
  const context = setup({ refresh: [
    { cookies: [{ name: 'session', value: 'first', options: {} }] },
    { cookies: [{ name: 'session', value: 'second', options: {} }] },
  ] });
  const result = await context.updateSession(context.request);
  assert.deepEqual(result.cookies.getAll(), [{ name: 'session', value: 'second' }]);
});
