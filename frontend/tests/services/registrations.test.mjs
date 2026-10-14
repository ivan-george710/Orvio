import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSubject } from '../support/load-subject.mjs';
import { supabaseStub, assertCall } from '../support/supabase-stub.mjs';

const eventId = '12345678-1234-4234-8234-123456789abc';
const helpers = loadSubject('../../lib/registrations.ts');

function setup(options) {
  const db = supabaseStub(options);
  const service = loadSubject('../../lib/services/server/registrations.ts', {
    'server-only': {},
    '@/lib/supabase/server': { createClient: db.createClient },
    '@/lib/registrations': helpers,
  });
  return { service, db };
}

test('register calls the authenticated RPC with only the event identifier', async () => {
  const { service, db } = setup({ plans: [{
    kind: 'rpc', target: 'register_for_event', args: { p_event_id: eventId },
    result: { data: null, error: null },
  }] });
  await service.registerForEvent(eventId);
  assert.deepEqual(db.authentication, ['getUser']);
  assert.equal(db.clientCreations, 1);
  assert.equal(db.requests.length, 1);
  assert.deepEqual(Object.keys(db.requests[0].args), ['p_event_id']);
  db.assertDone();
});

test('cancellation uses its own RPC without accepting a participant identity', async () => {
  const { service, db } = setup({ plans: [{
    kind: 'rpc', target: 'cancel_registration', args: { p_event_id: eventId },
    result: { data: null, error: null },
  }] });
  await service.cancelRegistration(eventId);
  assert.deepEqual(db.authentication, ['getUser']);
  assert.deepEqual(db.requests[0].args, { p_event_id: eventId });
  db.assertDone();
});

test('invalid registration IDs are rejected before a client or request is created', async () => {
  for (const id of ['', 'event-123', null, undefined, 42, '//external', eventId + '-extra']) {
    const { service, db } = setup();
    await assert.rejects(service.registerForEvent(id), {
      name: 'Error', message: helpers.registrationError('INVALID_EVENT'),
    });
    assert.equal(db.clientCreations, 0);
    assert.deepEqual(db.requests, []);
  }
});

test('invalid cancellation IDs cannot reach the database', async () => {
  const { service, db } = setup();
  await assert.rejects(service.cancelRegistration('not-a-uuid'), /valid event/);
  assert.equal(db.clientCreations, 0);
  assert.equal(db.requests.length, 0);
});

test('uppercase UUID characters are accepted without changing the event identity', async () => {
  const id = eventId.toUpperCase();
  const { service, db } = setup({ plans: [{
    kind: 'rpc', target: 'register_for_event', args: { p_event_id: id },
  }] });
  await service.registerForEvent(id);
  db.assertDone();
});

test('an unauthenticated registration stops before the RPC', async () => {
  const { service, db } = setup({ user: null });
  await assert.rejects(service.registerForEvent(eventId), /log in/);
  assert.equal(db.authentication.length, 1);
  assert.equal(db.requests.length, 0);
});

test('an unauthenticated cancellation stops before the RPC', async () => {
  const { service, db } = setup({ user: null });
  await assert.rejects(service.cancelRegistration(eventId), /log in/);
  assert.equal(db.requests.length, 0);
});

test('known RPC registration errors are converted into RegistrationError', async () => {
  for (const code of ['EVENT_FULL', 'ALREADY_REGISTERED', 'EVENT_STARTED', 'EVENT_NOT_APPROVED']) {
    const { service, db } = setup({ plans: [{
      kind: 'rpc', target: 'register_for_event', result: { data: null, error: { message: code } },
    }] });
    await assert.rejects(service.registerForEvent(eventId), (error) => {
      assert.ok(error instanceof service.RegistrationError);
      assert.equal(error.message, helpers.registrationError(code));
      return true;
    });
    db.assertDone();
  }
});

test('internal RPC errors do not reveal database details to participants', async () => {
  const { service } = setup({ plans: [{
    kind: 'rpc', target: 'register_for_event',
    result: { data: null, error: { message: 'private database relation or query details' } },
  }] });
  await assert.rejects(service.registerForEvent(eventId), {
    message: 'We could not complete your request. Please try again.',
  });
});

test('cancellation reports absence of an active registration', async () => {
  const { service } = setup({ plans: [{
    kind: 'rpc', target: 'cancel_registration',
    result: { data: null, error: { message: 'NO_ACTIVE_REGISTRATION' } },
  }] });
  await assert.rejects(service.cancelRegistration(eventId), /already be cancelled/);
});

test('empty summary requests do not create a database client', async () => {
  const { service, db } = setup();
  assert.deepEqual(await service.getRegistrationSummaries([]), {});
  assert.equal(db.clientCreations, 0);
});

test('summary requests deduplicate identifiers before querying', async () => {
  const { service, db } = setup({ plans: [{
    kind: 'rpc', target: 'registration_summaries', args: { p_event_ids: [eventId, 'second'] },
    result: { data: [{ event_id: eventId, remaining_spots: 5 }], error: null },
  }] });
  const result = await service.getRegistrationSummaries([eventId, eventId, 'second']);
  assert.equal(result[eventId].remaining_spots, 5);
  assert.deepEqual(Object.keys(result), [eventId]);
  db.assertDone();
});

test('summary batching preserves the 200-ID boundary and final partial batch', async () => {
  const ids = Array.from({ length: 401 }, (_, index) => `event-${index}`);
  const chunks = [ids.slice(0, 200), ids.slice(200, 400), ids.slice(400)];
  const { service, db } = setup({ plans: chunks.map((chunk) => ({
    kind: 'rpc', target: 'registration_summaries', args: { p_event_ids: chunk },
    result: { data: chunk.map((id) => ({ event_id: id, active_count: 1 })), error: null },
  })) });
  const result = await service.getRegistrationSummaries(ids);
  assert.equal(Object.keys(result).length, 401);
  assert.deepEqual(db.requests.map((request) => request.args.p_event_ids.length), [200, 200, 1]);
  assert.equal(result['event-400'].active_count, 1);
  db.assertDone();
});

test('summary timestamps reflect the authoritative fetch instead of an old supplied timestamp', async (context) => {
  context.mock.method(Date, 'now', () => 123456789);
  const row = Object.freeze({ event_id: eventId, checked_at: 1, active_count: 3 });
  const { service } = setup({ plans: [{
    kind: 'rpc', target: 'registration_summaries', result: { data: [row], error: null },
  }] });
  const result = await service.getRegistrationSummaries([eventId]);
  assert.equal(result[eventId].checked_at, 123456789);
  assert.equal(row.checked_at, 1);
});

test('failed summary batches throw a generic availability explanation', async () => {
  const { service } = setup({ plans: [{
    kind: 'rpc', target: 'registration_summaries',
    result: { data: null, error: { message: 'private query detail' } },
  }] });
  await assert.rejects(service.getRegistrationSummaries([eventId]), {
    message: 'Registration availability could not be loaded. Please try again.',
  });
});

test('empty personal history has no unnecessary summary RPC', async () => {
  const { service, db } = setup({ plans: [{
    kind: 'rpc', target: 'get_my_registrations', result: { data: [], error: null },
  }] });
  assert.deepEqual(await service.getMyRegistrations(), []);
  assertCall(db.requests[0], 'range', 0, 499);
  assert.equal(db.requests.length, 1);
  db.assertDone();
});

test('history enrichment retains registered and cancelled records without mutating source rows', async () => {
  const rows = ['registered', 'cancelled'].map((status, index) => Object.freeze({
    id: `registration-${index}`, event_id: eventId, status,
    event: Object.freeze({ id: eventId, title: 'History fixture' }),
  }));
  const { service, db } = setup({ plans: [
    { kind: 'rpc', target: 'get_my_registrations', result: { data: rows, error: null } },
    { kind: 'rpc', target: 'registration_summaries', args: { p_event_ids: [eventId] },
      result: { data: [{ event_id: eventId, remaining_spots: 3 }], error: null } },
  ] });
  const history = await service.getMyRegistrations();
  assert.deepEqual(history.map((row) => row.status), ['registered', 'cancelled']);
  assert.equal(history[0].event.registration.remaining_spots, 3);
  assert.equal(rows[0].event.registration, undefined);
  assert.notEqual(history[0].event, rows[0].event);
  db.assertDone();
});

test('personal history pagination retrieves records after the first 500', async () => {
  const first = Array.from({ length: 500 }, (_, index) => ({
    id: `registration-${index}`, event_id: eventId, event: { id: eventId },
  }));
  const last = { id: 'registration-500', event_id: eventId, event: { id: eventId } };
  const { service, db } = setup({ plans: [
    { kind: 'rpc', target: 'get_my_registrations', result: { data: first, error: null } },
    { kind: 'rpc', target: 'get_my_registrations', result: { data: [last], error: null } },
    { kind: 'rpc', target: 'registration_summaries', result: { data: [], error: null } },
  ] });
  const history = await service.getMyRegistrations();
  assert.equal(history.length, 501);
  assert.equal(history[500].id, last.id);
  assertCall(db.requests[0], 'range', 0, 499);
  assertCall(db.requests[1], 'range', 500, 999);
  db.assertDone();
});

test('personal history errors are mapped without requesting summaries', async () => {
  const { service, db } = setup({ plans: [{
    kind: 'rpc', target: 'get_my_registrations',
    result: { data: null, error: { message: 'AUTH_REQUIRED' } },
  }] });
  await assert.rejects(service.getMyRegistrations(), /log in/);
  assert.equal(db.requests.length, 1);
});

test('attendee requests reserve one extra row to detect a following page', async () => {
  const rows = [{ id: 'attendee-1', status: 'registered' }];
  const { service, db } = setup({ plans: [{
    kind: 'rpc', target: 'get_event_attendees', args: { p_event_id: eventId },
    result: { data: rows, error: null },
  }] });
  assert.deepEqual(await service.getEventAttendees(eventId, 2), rows);
  assertCall(db.requests[0], 'range', 50, 100);
  db.assertDone();
});

test('attendee pagination normalizes zero, negative and fractional page values', async () => {
  for (const [page, start, end] of [[0, 0, 50], [-4, 0, 50], [1.9, 0, 50], [3.7, 100, 150]]) {
    const { service, db } = setup({ plans: [{ kind: 'rpc', target: 'get_event_attendees' }] });
    await service.getEventAttendees(eventId, page);
    assertCall(db.requests[0], 'range', start, end);
    db.assertDone();
  }
});

test('attendee requests validate the event ID before connecting', async () => {
  const { service, db } = setup();
  await assert.rejects(service.getEventAttendees('not-valid'), /valid event/);
  assert.equal(db.clientCreations, 0);
});

test('denied attendee RPC access produces a RegistrationError with a user explanation', async () => {
  const { service, db } = setup({ plans: [{
    kind: 'rpc', target: 'get_event_attendees',
    result: { data: null, error: { message: 'ATTENDEES_FORBIDDEN' } },
  }] });
  await assert.rejects(service.getEventAttendees(eventId), (error) => {
    assert.ok(error instanceof service.RegistrationError);
    assert.match(error.message, /do not have permission/);
    return true;
  });
  db.assertDone();
});
