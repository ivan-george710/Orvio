import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadModule } from './module-loader.mjs';

const { cn, formatEventDate, formatParticipantCap } = loadModule('../lib/utils.ts');
const { throwSupabaseError } = loadModule('../lib/supabase/errors.ts');
const { createEventSchema } = loadModule('../lib/validations/event.ts');
const validEvent = {
  title: 'DA3 Test Event', description: 'An event for assignment testing.',
  venue: 'Main Hall', event_datetime: '2035-05-15T12:00:00Z', max_participants: 25,
};

test('event dates show a fallback for absent or invalid values', () => {
  for (const value of [null, undefined, '', 'not-a-date']) assert.equal(formatEventDate(value), 'Date TBA');
});

test('valid event dates retain the local date and time', () => {
  const input = '2035-05-15T12:34:00Z';
  assert.equal(formatEventDate(input), new Date(input).toLocaleString());
  assert.notEqual(formatEventDate(input), 'Date TBA');
});

test('capacity formatting distinguishes unlimited from zero and finite values', () => {
  for (const value of [null, undefined]) assert.equal(formatParticipantCap(value), 'Unlimited');
  assert.equal(formatParticipantCap(0), '0');
  assert.equal(formatParticipantCap(25), '25');
});

test('UI class composition retains conditional classes and resolves conflicts', () => {
  assert.equal(cn('px-2', ['font-bold', null], { hidden: false, 'text-sm': true }, 'px-4'), 'font-bold text-sm px-4');
  assert.equal(cn(), '');
});

test('database error messages are trimmed before being thrown', () => {
  assert.throws(() => throwSupabaseError({ message: '  Request failed  ' }, 'Fallback'), { message: 'Request failed' });
});

test('missing and blank database errors use the supplied fallback', () => {
  for (const error of [null, undefined, {}, { message: '' }, { message: '   ' }]) {
    assert.throws(() => throwSupabaseError(error, 'Could not load events.'), { message: 'Could not load events.' });
  }
});

test('a valid event accepts and converts numeric capacity input', () => {
  const parsed = createEventSchema.parse({ ...validEvent, max_participants: '25' });
  assert.deepEqual(parsed, validEvent);
});

for (const [field, minimum, maximum, minMessage, maxMessage] of [
  ['title', 3, 100, 'Title must be at least 3 characters.', 'Title cannot exceed 100 characters.'],
  ['description', 10, 1000, 'Description must be at least 10 characters.', 'Description cannot exceed 1000 characters.'],
  ['venue', 2, 100, 'Venue is required.', 'Venue cannot exceed 100 characters.'],
]) {
  test(`event ${field} accepts its length boundaries and rejects adjacent values`, () => {
    for (const size of [minimum, maximum]) assert.equal(createEventSchema.safeParse({ ...validEvent, [field]: 'A'.repeat(size) }).success, true);
    for (const [size, message] of [[minimum - 1, minMessage], [maximum + 1, maxMessage]]) {
      const result = createEventSchema.safeParse({ ...validEvent, [field]: 'A'.repeat(size) });
      assert.equal(result.success, false);
      assert.ok(result.error.issues.some((issue) => issue.path[0] === field && issue.message === message));
    }
  });
}

test('events require a valid schedule strictly after the current instant', (context) => {
  const now = Date.parse('2030-01-01T12:00:00Z');
  context.mock.method(Date, 'now', () => now);
  for (const value of ['invalid', '2030-01-01T11:59:59Z', '2030-01-01T12:00:00Z']) {
    const result = createEventSchema.safeParse({ ...validEvent, event_datetime: value });
    assert.equal(result.success, false);
    assert.ok(result.error.issues.some((issue) => issue.message === 'Event date and time must be in the future.'));
  }
  assert.equal(createEventSchema.safeParse({ ...validEvent, event_datetime: '2030-01-01T12:00:01Z' }).success, true);
  const empty = createEventSchema.safeParse({ ...validEvent, event_datetime: '' });
  assert.equal(empty.success, false);
  assert.ok(empty.error.issues.some((issue) => issue.message === 'Please select a date and time.'));
});

test('event capacity must be a positive integer', () => {
  for (const value of [0, -1, 1.5, 'abc', '', null, undefined]) {
    assert.equal(createEventSchema.safeParse({ ...validEvent, max_participants: value }).success, false);
  }
  for (const value of [1, 345, '345']) assert.equal(createEventSchema.safeParse({ ...validEvent, max_participants: value }).success, true);
  const zero = createEventSchema.safeParse({ ...validEvent, max_participants: 0 });
  assert.ok(zero.error.issues.some((issue) => issue.message === 'Maximum participants must be greater than 0.'));
});

test('event text and date fields reject missing or non-string values', () => {
  for (const field of ['title', 'description', 'venue', 'event_datetime']) {
    for (const value of [undefined, null, 42, false]) {
      assert.equal(createEventSchema.safeParse({ ...validEvent, [field]: value }).success, false);
    }
  }
});
