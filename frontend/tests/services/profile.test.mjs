import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { loadSubject } from '../support/load-subject.mjs';
import { supabaseStub, assertCall, callsFor } from '../support/supabase-stub.mjs';

const profileHelpers = loadSubject('../../lib/profile.ts', { zod: { z } });
const { updateProfileSchema, profileDisplayName } = profileHelpers;
const profile = {
  id: 'participant-id', full_name: 'Test Participant', role: 'participant',
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
};

function setup(options) {
  const db = supabaseStub(options);
  const service = loadSubject('../../lib/services/server/profile.ts', {
    'server-only': {},
    '@/lib/supabase/server': { createClient: db.createClient },
    '@/lib/profile': profileHelpers,
  });
  return { db, service };
}

test('profile names accept Unicode, apostrophes and ordinary internal spaces', () => {
  for (const name of ['Jean-Luc', "O'Connor", 'José Alvarez', '李 明', 'Test  Participant']) {
    assert.equal(updateProfileSchema.safeParse({ full_name: name }).success, true);
  }
});

test('profile name boundaries allow 2 and 100 characters', () => {
  for (const length of [2, 100]) {
    const input = { full_name: 'a'.repeat(length) };
    assert.equal(updateProfileSchema.safeParse(input).success, true);
  }
});

test('profile names outside the length boundaries are rejected', () => {
  for (const name of ['', ' ', 'a', 'a'.repeat(101)]) {
    assert.equal(updateProfileSchema.safeParse({ full_name: name }).success, false);
  }
});

test('profile names are trimmed before storage', () => {
  assert.deepEqual(updateProfileSchema.parse({ full_name: '  Test Participant  ' }), {
    full_name: 'Test Participant',
  });
});

test('profile validation cannot accept a role or another user identifier', () => {
  for (const extra of [{ role: 'admin' }, { id: 'other-user' }, { email: 'other@example.invalid' }]) {
    assert.equal(updateProfileSchema.safeParse({ full_name: 'Test Participant', ...extra }).success, false);
  }
});

test('profile validation rejects missing, non-string and non-object input', () => {
  for (const input of [null, undefined, [], 'Name', {}, { full_name: 42 }, { full_name: false }]) {
    assert.equal(updateProfileSchema.safeParse(input).success, false);
  }
});

test('embedded control characters cannot enter displayed profile names', () => {
  for (const name of ['Jane\nDoe', 'Jane\tDoe', 'Jane\x00Doe', 'Jane\x7fDoe']) {
    const parsed = updateProfileSchema.safeParse({ full_name: name });
    assert.equal(parsed.success, false);
    assert.ok(parsed.error.issues.some((issue) => issue.message.includes('control characters')));
  }
});

test('display names have a consistent fallback for blank or missing values', () => {
  for (const value of [null, undefined, '', '  ', 42, false]) {
    assert.equal(profileDisplayName(value), 'Orvio Member');
  }
  assert.equal(profileDisplayName('  Test Participant  '), 'Test Participant');
});

test('profile reads use the verified account ID and take email from Auth', async () => {
  const { service, db } = setup({
    user: { id: profile.id, email: 'participant@example.invalid' },
    plans: [{ target: 'profiles', result: { data: profile, error: null } }],
  });
  const result = await service.getCurrentProfile();
  assert.equal(result.email, 'participant@example.invalid');
  assert.equal(result.full_name, profile.full_name);
  assertCall(db.requests[0], 'eq', 'id', profile.id);
  assertCall(db.requests[0], 'select', 'id,full_name,role,created_at,updated_at');
  assert.equal(db.authentication.length, 1);
  db.assertDone();
});

test('missing Auth email does not invent a database email field', async () => {
  const { service } = setup({ plans: [{ target: 'profiles', result: { data: profile, error: null } }] });
  assert.equal((await service.getCurrentProfile()).email, '');
});

test('unauthenticated profile reads never query the profiles table', async () => {
  const { service, db } = setup({ user: null });
  await assert.rejects(service.getCurrentProfile(), (error) => {
    assert.equal(error.code, 'auth');
    assert.ok(error instanceof service.ProfileError);
    return true;
  });
  assert.equal(db.requests.length, 0);
});

test('a failed Auth verification stops profile reads even if a user object is present', async () => {
  const { service, db } = setup({ authError: { message: 'expired session' } });
  await assert.rejects(service.getCurrentProfile(), /log in/);
  assert.equal(db.requests.length, 0);
});

test('profile read errors do not disclose database internals', async () => {
  const { service } = setup({ plans: [{
    target: 'profiles', result: { data: null, error: { message: 'private table or policy detail' } },
  }] });
  await assert.rejects(service.getCurrentProfile(), {
    name: 'ProfileError', message: 'Your profile could not be loaded. Please try again.',
  });
});

test('a missing public profile is distinguished from an unauthenticated session', async () => {
  const { service } = setup({ plans: [{ target: 'profiles', result: { data: null, error: null } }] });
  await assert.rejects(service.getCurrentProfile(), (error) => {
    assert.equal(error.code, 'missing');
    assert.match(error.message, /event administrator/);
    return true;
  });
});

test('profile writes use a server-owned identity and a narrow field allowlist', async () => {
  const updated = { ...profile, full_name: 'Updated Participant' };
  const { service, db } = setup({ plans: [{ target: 'profiles', result: { data: updated, error: null } }] });
  assert.deepEqual(await service.updateCurrentProfile({ full_name: '  Updated Participant  ' }), updated);
  assertCall(db.requests[0], 'eq', 'id', profile.id);
  const payload = callsFor(db.requests[0], 'update')[0][1];
  assert.deepEqual(Object.keys(payload).sort(), ['full_name', 'updated_at']);
  assert.equal(payload.full_name, 'Updated Participant');
  assert.ok(Number.isFinite(Date.parse(payload.updated_at)));
  assert.equal(updated.role, 'participant');
  db.assertDone();
});

test('invalid profile writes stop before opening a database client', async () => {
  const { service, db } = setup();
  await assert.rejects(service.updateCurrentProfile({ full_name: 'x' }), /at least 2/);
  assert.equal(db.clientCreations, 0);
  assert.equal(db.requests.length, 0);
});

test('over-posted role changes cannot reach a profile update query', async () => {
  const { service, db } = setup();
  await assert.rejects(service.updateCurrentProfile({ full_name: 'Test Participant', role: 'admin' }));
  assert.equal(db.clientCreations, 0);
});

test('unauthenticated valid profile writes do not issue database updates', async () => {
  const { service, db } = setup({ user: null });
  await assert.rejects(service.updateCurrentProfile({ full_name: 'Test Participant' }), /log in/);
  assert.equal(db.requests.length, 0);
});

test('profile update database errors receive a safe explanation', async () => {
  const { service } = setup({ plans: [{
    target: 'profiles', result: { data: null, error: { message: 'private RLS detail' } },
  }] });
  await assert.rejects(service.updateCurrentProfile({ full_name: 'Test Participant' }), {
    message: 'Your changes could not be saved. Please try again.',
  });
});

test('a profile update affecting zero rows is not reported as success', async () => {
  const { service } = setup({ plans: [{ target: 'profiles', result: { data: null, error: null } }] });
  await assert.rejects(service.updateCurrentProfile({ full_name: 'Test Participant' }), (error) => {
    assert.equal(error.code, 'missing');
    assert.match(error.message, /not updated/);
    return true;
  });
});

test('profile actions return the canonical saved name and refresh related views', async () => {
  const refreshed = [];
  let received;
  const action = loadSubject('../../lib/actions/profile.ts', {
    'next/cache': { revalidatePath: (path) => refreshed.push(path) },
    '@/lib/services/server/profile': {
      ProfileError: class extends Error {},
      updateCurrentProfile: async (input) => {
        received = input;
        return { ...profile, full_name: 'Canonical Name' };
      },
    },
  });
  assert.deepEqual(await action.updateProfileAction({ full_name: 'Canonical Name' }), {
    ok: true, fullName: 'Canonical Name',
  });
  assert.deepEqual(received, { full_name: 'Canonical Name' });
  assert.deepEqual(refreshed, ['/profile', '/dashboard', '/events', '/admin', '/registrations']);
});

test('unexpected profile action errors are hidden and do not refresh pages', async () => {
  const refreshed = [];
  const action = loadSubject('../../lib/actions/profile.ts', {
    'next/cache': { revalidatePath: (path) => refreshed.push(path) },
    '@/lib/services/server/profile': {
      ProfileError: class extends Error {},
      updateCurrentProfile: async () => { throw new Error('private internal failure'); },
    },
  });
  assert.deepEqual(await action.updateProfileAction({ full_name: 'Test Participant' }), {
    ok: false, message: 'Your changes could not be saved. Please try again.', needsLogin: false,
  });
  assert.deepEqual(refreshed, []);
});
