import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { loadSubject } from '../support/load-subject.mjs';
import { supabaseStub } from '../support/supabase-stub.mjs';

const helpers = loadSubject('../../lib/profile.ts', { zod: { z } });

function profileAction(options = {}) {
  const db = supabaseStub(options);
  const refreshed = [];
  const service = loadSubject('../../lib/services/server/profile.ts', {
    'server-only': {},
    '@/lib/supabase/server': { createClient: db.createClient },
    '@/lib/profile': helpers,
  });
  const action = loadSubject('../../lib/actions/profile.ts', {
    'next/cache': { revalidatePath: (path) => refreshed.push(path) },
    '@/lib/services/server/profile': service,
  });
  return { db, refreshed, action };
}

test('expired profile actions request login without changing cached pages', async () => {
  const { action, db, refreshed } = profileAction({ user: null });
  const result = await action.updateProfileAction({ full_name: 'Test Member' });
  assert.deepEqual(result, {
    ok: false,
    message: 'Please log in to manage your profile.',
    needsLogin: true,
  });
  assert.equal(db.requests.length, 0);
  assert.deepEqual(refreshed, []);
  db.assertDone();
});

test('Auth verification errors also produce the profile login instruction', async () => {
  const { action, db, refreshed } = profileAction({
    authError: { message: 'private token diagnostic' },
  });
  const result = await action.updateProfileAction({ full_name: 'Test Member' });
  assert.equal(result.ok, false);
  assert.equal(result.needsLogin, true);
  assert.doesNotMatch(result.message, /private token/);
  assert.equal(db.requests.length, 0);
  assert.deepEqual(refreshed, []);
});

test('invalid profile action input remains a form error rather than a login error', async () => {
  const { action, db, refreshed } = profileAction();
  const result = await action.updateProfileAction({ full_name: 'x' });
  assert.equal(result.ok, false);
  assert.equal(result.needsLogin, false);
  assert.match(result.message, /at least 2/);
  assert.equal(db.clientCreations, 0);
  assert.deepEqual(refreshed, []);
});

test('missing profile rows cannot produce a saved-name success response', async () => {
  const { action, db, refreshed } = profileAction({
    plans: [{ target: 'profiles', result: { data: null, error: null } }],
  });
  const result = await action.updateProfileAction({ full_name: 'Test Member' });
  assert.equal(result.ok, false);
  assert.equal(result.needsLogin, false);
  assert.match(result.message, /not updated/);
  assert.equal(Object.hasOwn(result, 'fullName'), false);
  assert.deepEqual(refreshed, []);
  db.assertDone();
});

test('database profile failures keep diagnostic details out of action responses', async () => {
  const { action, db, refreshed } = profileAction({
    plans: [{
      target: 'profiles',
      result: { data: null, error: { message: 'private policy diagnostic' } },
    }],
  });
  assert.deepEqual(await action.updateProfileAction({ full_name: 'Test Member' }), {
    ok: false,
    message: 'Your changes could not be saved. Please try again.',
    needsLogin: false,
  });
  assert.deepEqual(refreshed, []);
  db.assertDone();
});
