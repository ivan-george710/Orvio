import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSubject } from '../support/load-subject.mjs';
import { eventInput, eventId } from '../support/event-subjects.mjs';

class EventMutationError extends Error {}

function setup({ createFailure, updateFailure } = {}) {
  const refreshes = [];
  const writes = [];
  const actions = loadSubject('../../lib/actions/events.ts', {
    'next/cache': { revalidatePath: (path) => refreshes.push(path) },
    '@/lib/services/server/events': {
      EventMutationError,
      createOwnedEvent: async (input) => {
        writes.push(['create', input]);
        if (createFailure !== undefined) throw createFailure;
        return { id: eventId };
      },
      updateEvent: async (id, input) => {
        writes.push(['update', id, input]);
        if (updateFailure !== undefined) throw updateFailure;
      },
    },
    '@/lib/services/server/registrations': {},
  });
  return { actions, writes, refreshes };
}

test('create actions preserve safe validation messages for the form', async () => {
  const context = setup({ createFailure: new EventMutationError('Title must be at least 3 characters.') });
  assert.deepEqual(await context.actions.createEventAction(eventInput()), {
    ok: false, message: 'Title must be at least 3 characters.',
  });
  assert.deepEqual(context.refreshes, []);
});

test('create actions treat non-Error failures as an unsuccessful submission', async () => {
  const context = setup({ createFailure: 'unexpected internal value' });
  const result = await context.actions.createEventAction(eventInput());
  assert.equal(result.ok, false);
  assert.equal(result.message, 'Your event could not be created. Please try again.');
  assert.deepEqual(context.refreshes, []);
});

test('create actions forward event input without deriving an account identity from it', async () => {
  const context = setup();
  const input = eventInput();
  const result = await context.actions.createEventAction(input);
  assert.deepEqual(result, { ok: true, id: eventId });
  assert.deepEqual(context.writes, [['create', input]]);
});

test('successful event edits refresh the dashboard, detail and editor', async () => {
  const context = setup();
  const input = eventInput({ category: 'sports' });
  assert.deepEqual(await context.actions.updateEventAction(eventId, input), { ok: true });
  assert.deepEqual(context.writes, [['update', eventId, input]]);
  assert.deepEqual(context.refreshes, ['/dashboard', `/events/${eventId}`, `/events/${eventId}/edit`]);
});

test('reviewed-event errors are returned as readable edit failures', async () => {
  const context = setup({ updateFailure: new EventMutationError('Only pending events can be edited.') });
  assert.deepEqual(await context.actions.updateEventAction(eventId, eventInput()), {
    ok: false, message: 'Only pending events can be edited.',
  });
  assert.deepEqual(context.refreshes, []);
});

test('unexpected edit exceptions cannot reveal query details to the browser', async () => {
  const context = setup({ updateFailure: new Error('private database query') });
  assert.deepEqual(await context.actions.updateEventAction(eventId, eventInput()), {
    ok: false, message: 'Your event could not be updated. Please try again.',
  });
  assert.deepEqual(context.refreshes, []);
});

test('the client creation wrapper returns the newly stored event identity', async () => {
  let received;
  const service = loadSubject('../../lib/services/events.ts', {
    '@/lib/actions/events': { createEventAction: async (input) => {
      received = input;
      return { ok: true, id: eventId };
    } },
  });
  const input = eventInput();
  assert.deepEqual(await service.createEvent(input), { id: eventId });
  assert.deepEqual(received, input);
});

test('the client creation wrapper throws the safe action message on failure', async () => {
  const service = loadSubject('../../lib/services/events.ts', {
    '@/lib/actions/events': { createEventAction: async () => ({ ok: false, message: 'Choose a future event date.' }) },
  });
  await assert.rejects(service.createEvent(eventInput()), { message: 'Choose a future event date.' });
});
