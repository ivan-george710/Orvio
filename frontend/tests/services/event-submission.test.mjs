import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventService, eventFixture, eventInput, ownerId, eventId, otherId, projectUrl } from '../support/event-subjects.mjs';
import { assertCall, callsFor } from '../support/supabase-stub.mjs';
import { loadSubject } from '../support/load-subject.mjs';

test('event creation derives ownership and pending status from the verified session', async () => {
  const fixture = eventFixture();
  const { service, db } = eventService({ plans: [{ target: 'events', result: { data: fixture, error: null } }] });
  assert.deepEqual(await service.createOwnedEvent(eventInput()), fixture);
  const payload = callsFor(db.requests[0], 'insert')[0][1];
  assert.equal(payload.created_by, ownerId);
  assert.equal(payload.status, 'pending');
  assert.equal(payload.category, 'technology');
  assert.equal(payload.banner_url, null);
  assertCall(db.requests[0], 'single');
  assert.equal(db.authentication.length, 1);
  db.assertDone();
});

test('unauthenticated event creation stops before any table write', async () => {
  const { service, db } = eventService({ user: null });
  await assert.rejects(service.createOwnedEvent(eventInput()), /Not authenticated/);
  assert.equal(db.requests.length, 0);
});

test('event creation rejects failed Auth verification even when a user object is returned', async () => {
  const { service, db } = eventService({ authError: { message: 'invalid token' } });
  await assert.rejects(service.createOwnedEvent(eventInput()), /Not authenticated/);
  assert.equal(db.requests.length, 0);
});

test('invalid event input cannot bypass client validation through a direct server call', async () => {
  for (const values of [{ max_participants: 0 }, { title: '' }, { event_datetime: 'invalid' }, { category: 'not-supported' }]) {
    const { service, db } = eventService();
    await assert.rejects(service.createOwnedEvent(eventInput(values)));
    assert.equal(db.requests.length, 0);
  }
});

test('an event submission cannot choose its own approved status or another owner', async () => {
  for (const extra of [{ status: 'approved' }, { created_by: otherId }]) {
    const { service, db } = eventService();
    await assert.rejects(service.createOwnedEvent({ ...eventInput(), ...extra }));
    assert.equal(db.requests.length, 0);
  }
});

test('event creation rejects another account’s banner before inserting an event', async () => {
  const { service, db } = eventService();
  const url = `${projectUrl}/storage/v1/object/public/event-banners/${otherId}/${eventId}.png`;
  await assert.rejects(service.createOwnedEvent(eventInput({ banner_url: url })), /uploaded by your account/);
  assert.equal(db.requests.length, 0);
});

test('database event-creation failures do not disclose internal query details', async () => {
  const { service } = eventService({ plans: [{ target: 'events', result: { data: null, error: { message: 'private database details' } } }] });
  await assert.rejects(service.createOwnedEvent(eventInput()), {
    message: 'Your event could not be created. Please try again.',
  });
});

test('an insert with no returned event is not reported as successful', async () => {
  const { service } = eventService({ plans: [{ target: 'events', result: { data: null, error: null } }] });
  await assert.rejects(service.createOwnedEvent(eventInput()), /could not be created/);
});

test('owners can update metadata on a pending event', async () => {
  const fixture = eventFixture();
  const updated = { ...fixture, category: 'sports' };
  const { service, db } = eventService({ plans: [
    { target: 'events', result: { data: fixture, error: null } },
    { target: 'events', result: { data: updated, error: null } },
  ] });
  assert.deepEqual(await service.updateEvent(eventId, eventInput({ category: 'sports' })), updated);
  assertCall(db.requests[1], 'eq', 'id', eventId);
  assert.equal(callsFor(db.requests[1], 'update')[0][1].category, 'sports');
  db.assertDone();
});

test('non-owners cannot update another creator’s pending event', async () => {
  const { service, db } = eventService({ plans: [{ target: 'events', result: { data: eventFixture({ created_by: otherId }), error: null } }] });
  await assert.rejects(service.updateEvent(eventId, eventInput()), /Only the creator/);
  assert.equal(db.requests.length, 1);
  assert.equal(callsFor(db.requests[0], 'update').length, 0);
});

test('owners cannot edit a reviewed event through the pending editor service', async () => {
  for (const status of ['approved', 'rejected', 'cancelled', 'completed']) {
    const { service, db } = eventService({ plans: [{ target: 'events', result: { data: eventFixture({ status }), error: null } }] });
    await assert.rejects(service.updateEvent(eventId, eventInput()), /Only pending events/);
    assert.equal(db.requests.length, 1);
  }
});

test('pending event updates revalidate input on the server before a write', async () => {
  const { service, db } = eventService({ plans: [{ target: 'events', result: { data: eventFixture(), error: null } }] });
  await assert.rejects(service.updateEvent(eventId, eventInput({ max_participants: -1 })));
  assert.equal(db.requests.length, 1);
});

test('missing events cannot reach the update query', async () => {
  const { service, db } = eventService({ plans: [
    { target: 'events', result: { data: null, error: null } },
  ] });
  await assert.rejects(service.updateEvent(eventId, eventInput()), /Event not found/);
  assert.equal(db.requests.length, 1);
  assert.equal(callsFor(db.requests[0], 'update').length, 0);
  db.assertDone();
});

test('expired sessions cannot read or update pending events through the editor', async () => {
  const { service, db } = eventService({ user: null });
  await assert.rejects(service.updateEvent(eventId, eventInput()), /Not authenticated/);
  assert.equal(db.requests.length, 0);
  db.assertDone();
});

test('pending edits cannot attach banners belonging to another participant', async () => {
  const { service, db } = eventService({ plans: [
    { target: 'events', result: { data: eventFixture(), error: null } },
  ] });
  const bannerUrl = `${projectUrl}/storage/v1/object/public/event-banners/${otherId}/${eventId}.png`;
  await assert.rejects(
    service.updateEvent(eventId, eventInput({ banner_url: bannerUrl })),
    /uploaded by your account/,
  );
  assert.equal(db.requests.length, 1);
  assert.equal(callsFor(db.requests[0], 'update').length, 0);
  db.assertDone();
});

test('failed pending updates hide database diagnostics', async () => {
  const { service, db } = eventService({ plans: [
    { target: 'events', result: { data: eventFixture(), error: null } },
    { target: 'events', result: {
      data: null, error: { message: 'private constraint or policy detail' },
    } },
  ] });
  await assert.rejects(service.updateEvent(eventId, eventInput()), {
    name: 'Error',
    message: 'Your event could not be updated. Please try again.',
  });
  assertCall(db.requests[1], 'eq', 'id', eventId);
  db.assertDone();
});

test('owned banner references survive a valid pending metadata edit', async (t) => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = projectUrl;
  t.after(() => {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
  });
  const bannerUrl = `${projectUrl}/storage/v1/object/public/event-banners/${ownerId}/${eventId}.png`;
  const updated = eventFixture({ banner_url: bannerUrl, category: 'community' });
  const { service, db } = eventService({ plans: [
    { target: 'events', result: { data: eventFixture(), error: null } },
    { target: 'events', result: { data: updated, error: null } },
  ] });
  const result = await service.updateEvent(eventId, eventInput({
    banner_url: bannerUrl, category: 'community',
  }));
  assert.equal(result.banner_url, bannerUrl);
  const payload = callsFor(db.requests[1], 'update')[0][1];
  assert.equal(payload.banner_url, bannerUrl);
  assert.equal(payload.category, 'community');
  assert.equal(Object.hasOwn(payload, 'status'), false);
  assert.equal(Object.hasOwn(payload, 'created_by'), false);
  db.assertDone();
});

test('event actions return safe create failures rather than exposing unexpected exceptions', async () => {
  const refreshes = [];
  const actions = loadSubject('../../lib/actions/events.ts', {
    'next/cache': { revalidatePath: (path) => refreshes.push(path) },
    '@/lib/services/server/events': {
      EventMutationError: class extends Error {},
      createOwnedEvent: async () => { throw new Error('internal exception'); },
    },
    '@/lib/services/server/registrations': {},
  });
  assert.deepEqual(await actions.createEventAction(eventInput()), {
    ok: false, message: 'Your event could not be created. Please try again.',
  });
  assert.deepEqual(refreshes, []);
});

test('successful event creation returns its identifier and refreshes creator/admin views', async () => {
  const refreshes = [];
  const actions = loadSubject('../../lib/actions/events.ts', {
    'next/cache': { revalidatePath: (path) => refreshes.push(path) },
    '@/lib/services/server/events': {
      EventMutationError: class extends Error {}, createOwnedEvent: async () => eventFixture(),
    },
    '@/lib/services/server/registrations': {},
  });
  assert.deepEqual(await actions.createEventAction(eventInput()), { ok: true, id: eventId });
  assert.deepEqual(refreshes, ['/dashboard', '/admin']);
});
