import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventService, ownerId, otherId, errors } from '../support/event-subjects.mjs';
import { loadSubject } from '../support/load-subject.mjs';
import { assertCall, callsFor } from '../support/supabase-stub.mjs';

const adminRole = { target: 'profiles', result: { data: { role: 'admin' }, error: null } };
function setup(options = {}) {
  const { db, service: events } = eventService(options);
  const service = loadSubject('../../lib/services/server/admin.ts', {
    '@/lib/supabase/server': { createClient: db.createClient },
    '@/lib/supabase/errors': errors,
    '@/lib/services/server/events': { ensureAdmin: events.ensureAdmin },
  });
  return { db, service };
}

test('user listings require real administrator authorization before querying the list', async () => {
  const { service, db } = setup({ plans: [{ target: 'profiles', result: { data: { role: 'participant' }, error: null } }] });
  await assert.rejects(service.getAllUsers(), /Not authorized/);
  assert.equal(db.requests.length, 1);
  assertCall(db.requests[0], 'select', 'role');
});

test('administrators receive a narrow user listing without credentials', async () => {
  const rows = [{ id: ownerId, full_name: 'Test Administrator', role: 'admin', created_at: '2026-01-01' }];
  const { service, db } = setup({ plans: [adminRole, { target: 'profiles', result: { data: rows, error: null } }] });
  assert.deepEqual(await service.getAllUsers(), rows);
  assertCall(db.requests[1], 'select', 'id,full_name,role,created_at');
  assertCall(db.requests[1], 'order', 'created_at', { ascending: false });
  assert.equal(callsFor(db.requests[1], 'ilike').length, 0);
  db.assertDone();
});

test('administrator name search removes wildcard characters before filtering', async () => {
  const { service, db } = setup({ plans: [adminRole, { target: 'profiles' }] });
  await service.getAllUsers('  Ann_%  ');
  assertCall(db.requests[1], 'ilike', 'full_name', '%Ann%');
  db.assertDone();
});

test('blank user search does not add an accidental match-all filter', async () => {
  const { service, db } = setup({ plans: [adminRole, { target: 'profiles' }] });
  await service.getAllUsers('  ');
  assert.equal(callsFor(db.requests[1], 'ilike').length, 0);
});

test('user-list errors without a usable message use a meaningful fallback', async () => {
  const { service } = setup({ plans: [adminRole, { target: 'profiles', result: { data: null, error: {} } }] });
  await assert.rejects(service.getAllUsers(), /Failed to load users/);
});

test('unauthenticated role changes cannot reach a profile update', async () => {
  const { service, db } = setup({ user: null });
  await assert.rejects(service.updateUserRole(otherId, 'organizer'), /Not authenticated/);
  assert.equal(db.requests.length, 0);
});

test('non-administrators cannot change another user’s role', async () => {
  const { service, db } = setup({ plans: [{ target: 'profiles', result: { data: { role: 'organizer' }, error: null } }] });
  await assert.rejects(service.updateUserRole(otherId, 'admin'), /Not authorized/);
  assert.equal(db.requests.length, 1);
});

test('the last administrator cannot demote themselves', async () => {
  for (const count of [0,1,null,undefined]) {
    const { service, db } = setup({ plans: [adminRole, { target: 'profiles', result: { count, error: null } }] });
    await assert.rejects(service.updateUserRole(ownerId, 'participant'), /last admin/);
    assertCall(db.requests[1], 'eq', 'role', 'admin');
    assert.equal(db.requests.length, 2);
    assert.equal(callsFor(db.requests[1], 'update').length, 0);
  }
});

test('administrator self-demotion is allowed when another administrator remains', async () => {
  const { service, db } = setup({ plans: [
    adminRole, { target: 'profiles', result: { count: 2, error: null } },
    { target: 'profiles', result: { data: null, error: null } },
  ] });
  await service.updateUserRole(ownerId, 'participant');
  const payload = callsFor(db.requests[2], 'update')[0][1];
  assert.equal(payload.role, 'participant');
  assert.ok(Number.isFinite(Date.parse(payload.updated_at)));
  assertCall(db.requests[2], 'eq', 'id', ownerId);
  db.assertDone();
});

test('retaining the administrator role does not require a demotion count', async () => {
  const { service, db } = setup({ plans: [adminRole, { target: 'profiles', result: { error: null } }] });
  await service.updateUserRole(ownerId, 'admin');
  assert.equal(db.requests.length, 2);
  assert.equal(callsFor(db.requests[1], 'update')[0][1].role, 'admin');
});

test('updating another user’s role scopes the write to that user', async () => {
  const { service, db } = setup({ plans: [adminRole, { target: 'profiles', result: { error: null } }] });
  await service.updateUserRole(otherId, 'organizer');
  assertCall(db.requests[1], 'eq', 'id', otherId);
  assert.equal(callsFor(db.requests[1], 'update')[0][1].role, 'organizer');
});

test('a failed administrator-count query stops self-demotion', async () => {
  const { service, db } = setup({ plans: [adminRole, { target: 'profiles', result: { count: null, error: {} } }] });
  await assert.rejects(service.updateUserRole(ownerId, 'participant'), /Failed to check admin accounts/);
  assert.equal(db.requests.length, 2);
});

test('profile update failures are reported instead of silently succeeding', async () => {
  const { service } = setup({ plans: [adminRole, { target: 'profiles', result: { error: {} } }] });
  await assert.rejects(service.updateUserRole(otherId, 'organizer'), /Failed to update user role/);
});
