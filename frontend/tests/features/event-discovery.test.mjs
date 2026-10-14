import { test } from 'node:test';
import assert from 'node:assert/strict';
import { discovery, eventFixture } from '../support/event-subjects.mjs';

const now = Date.parse('2030-01-01T00:00:00Z');
const defaults = discovery.readEventFilters({});
const events = [
  eventFixture({ id: 'a', title: 'Workshop 2', category: 'workshop', venue: 'North Hall', event_datetime: '2030-01-02T12:00:00Z', status: 'approved', registration: { remaining_spots: 4, is_registered: false } }),
  eventFixture({ id: 'b', title: 'Workshop 10', category: 'technology', venue: 'South Hall', event_datetime: '2030-02-02T12:00:00Z', status: 'approved', registration: { remaining_spots: 0, is_registered: false } }),
  eventFixture({ id: 'c', title: 'Community Day', category: 'community', venue: 'North Room', event_datetime: '2029-12-02T12:00:00Z', status: 'approved', registration: { remaining_spots: 8, is_registered: true } }),
  eventFixture({ id: 'd', title: 'Unscheduled', category: undefined, venue: 'Main Hall', event_datetime: null, status: 'approved' }),
];
const filter = (overrides) => discovery.filterDiscoveryEvents(events, { ...defaults, ...overrides }, now);

test('discovery defaults keep the unfiltered event collection', () => {
  assert.deepEqual(defaults, { category: 'all', when: 'all', availability: 'all', sort: 'soonest', venue: '' });
  assert.equal(discovery.hasEventFilters(defaults), false);
  assert.equal(filter({}).length, events.length);
});

test('unsupported filter values and duplicate query parameters fall back safely', () => {
  const result = discovery.readEventFilters({
    category: ['sports','technology'], when: 'invalid', availability: 'unknown', sort: '__proto__', venue: ['North'],
  });
  assert.deepEqual(result, defaults);
});

test('venue filters are trimmed and limited to a reasonable query length', () => {
  assert.equal(discovery.readEventFilters({ venue: '  Main Hall  ' }).venue, 'Main Hall');
  assert.equal(discovery.readEventFilters({ venue: 'a'.repeat(200) }).venue.length, 120);
});

test('category filtering selects only the chosen category', () => {
  assert.deepEqual(filter({ category: 'technology' }).map((event) => event.id), ['b']);
});

test('legacy events are discoverable under the Other category', () => {
  assert.deepEqual(filter({ category: 'other' }).map((event) => event.id), ['d']);
});

test('upcoming filtering excludes past and unscheduled events', () => {
  assert.deepEqual(filter({ when: 'upcoming' }).map((event) => event.id), ['a', 'b']);
});

test('past filtering excludes upcoming and unscheduled events', () => {
  assert.deepEqual(filter({ when: 'past' }).map((event) => event.id), ['c']);
});

test('unscheduled filtering recognizes missing and invalid timestamps', () => {
  const input = [...events, eventFixture({ id: 'invalid', event_datetime: 'invalid' })];
  const result = discovery.filterDiscoveryEvents(input, { ...defaults, when: 'unscheduled' }, now);
  assert.deepEqual(result.map((event) => event.id), ['d', 'invalid']);
});

test('the current start boundary is treated as past rather than upcoming', () => {
  const input = [eventFixture({ event_datetime: new Date(now).toISOString() })];
  assert.equal(discovery.filterDiscoveryEvents(input, { ...defaults, when: 'past' }, now).length, 1);
  assert.equal(discovery.filterDiscoveryEvents(input, { ...defaults, when: 'upcoming' }, now).length, 0);
});

test('available-place filtering excludes full, closed and unknown availability', () => {
  assert.deepEqual(filter({ availability: 'available' }).map((event) => event.id), ['a']);
});

test('already registered participants do not see their event as an available registration', () => {
  const input = [eventFixture({ status: 'approved', registration: { remaining_spots: 5, is_registered: true } })];
  assert.equal(discovery.filterDiscoveryEvents(input, { ...defaults, availability: 'available' }, now).length, 0);
});

test('full-event filtering excludes started events even when their remaining count is zero', () => {
  const input = [...events, eventFixture({ id: 'past-full', event_datetime: '2029-01-01T00:00:00Z', registration: { remaining_spots: 0 }, status: 'approved' })];
  const result = discovery.filterDiscoveryEvents(input, { ...defaults, availability: 'full' }, now);
  assert.deepEqual(result.map((event) => event.id), ['b']);
});

test('my-registration filtering follows the authenticated summary', () => {
  assert.deepEqual(filter({ availability: 'registered' }).map((event) => event.id), ['c']);
});

test('venue matching is case-insensitive and combines with category', () => {
  assert.deepEqual(filter({ venue: 'NORTH', category: 'workshop' }).map((event) => event.id), ['a']);
  assert.equal(filter({ venue: 'North', category: 'technology' }).length, 0);
});

test('date ordering places unknown dates last in both directions', () => {
  assert.deepEqual(filter({ sort: 'soonest' }).map((event) => event.id), ['c', 'a', 'b', 'd']);
  assert.deepEqual(filter({ sort: 'latest' }).map((event) => event.id), ['b', 'a', 'c', 'd']);
});

test('title ordering uses natural numeric ordering', () => {
  const result = filter({ sort: 'title' }).map((event) => event.title);
  assert.ok(result.indexOf('Workshop 2') < result.indexOf('Workshop 10'));
});

test('place ordering sorts known counts before missing summaries', () => {
  assert.deepEqual(filter({ sort: 'spots' }).map((event) => event.id), ['c', 'a', 'b', 'd']);
});

test('filtering and sorting leave the original collection unchanged', () => {
  const frozen = Object.freeze([...events]);
  const result = discovery.filterDiscoveryEvents(frozen, { ...defaults, sort: 'latest' }, now);
  assert.notEqual(result, frozen);
  assert.deepEqual(frozen.map((event) => event.id), ['a', 'b', 'c', 'd']);
});

test('tied sort values have a deterministic event-ID order', () => {
  const input = [eventFixture({ id: 'z' }), eventFixture({ id: 'a' })];
  const result = discovery.filterDiscoveryEvents(input, defaults, now);
  assert.deepEqual(result.map((event) => event.id), ['a','z']);
});

test('filter URLs preserve text search without persisting default options', () => {
  assert.equal(discovery.eventFilterUrl('  music  ', defaults), '/events?search=music');
  assert.equal(discovery.eventFilterUrl('', defaults), '/events');
});

test('filter URLs correctly encode venue and combine selected values', () => {
  const url = new URL(discovery.eventFilterUrl('music', { ...defaults, category: 'cultural', venue: 'Hall A & B', sort: 'title' }), 'https://example.invalid');
  assert.equal(url.searchParams.get('venue'), 'Hall A & B');
  assert.equal(url.searchParams.get('category'), 'cultural');
  assert.equal(url.searchParams.get('sort'), 'title');
  assert.equal(url.searchParams.get('search'), 'music');
});

test('the active-filter indicator includes sort changes and venue input', () => {
  for (const changed of [{ sort: 'latest' }, { venue: 'Main' }, { when: 'past' }, { availability: 'full' }, { category: 'sports' }]) {
    assert.equal(discovery.hasEventFilters({ ...defaults, ...changed }), true);
  }
});
