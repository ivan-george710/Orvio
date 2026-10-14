import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const frontend = fileURLToPath(new URL('../../', import.meta.url));

function inTimezone(timezone, timestamp) {
  const code = `
    import { loadSubject } from './tests/support/load-subject.mjs';
    const dates = loadSubject('../../lib/event-datetime.ts');
    const stored = ${JSON.stringify(timestamp)};
    const local = dates.localEventDateTime(stored);
    console.log(JSON.stringify({
      local,
      preserved: dates.eventDateTimeForStorage(local, stored),
      submitted: dates.eventDateTimeForStorage(local)
    }));
  `;
  return JSON.parse(execFileSync(process.execPath, ['--input-type=module','-e',code], {
    cwd: frontend, env: { ...process.env, TZ: timezone }, encoding: 'utf8',
  }));
}

test('Dubai date inputs display four hours after the stored UTC instant', () => {
  const result = inTimezone('Asia/Dubai', '2035-05-15T14:45:00.000Z');
  assert.equal(result.local, '2035-05-15T18:45');
  assert.equal(result.submitted, '2035-05-15T14:45:00.000Z');
  assert.equal(result.preserved, result.submitted);
});

test('UTC date inputs retain the same local clock value', () => {
  const result = inTimezone('UTC', '2035-05-15T14:45:00.000Z');
  assert.equal(result.local, '2035-05-15T14:45');
  assert.equal(result.submitted, '2035-05-15T14:45:00.000Z');
});

test('local date conversion handles crossing into the next calendar day', () => {
  const result = inTimezone('Asia/Dubai', '2035-05-15T22:30:00.000Z');
  assert.equal(result.local, '2035-05-16T02:30');
  assert.equal(result.submitted, '2035-05-15T22:30:00.000Z');
});

test('unchanged edits preserve the second occurrence of a repeated daylight-saving hour', () => {
  const result = inTimezone('America/New_York', '2026-11-01T06:30:00.000Z');
  assert.equal(result.local, '2026-11-01T01:30');
  assert.equal(result.preserved, '2026-11-01T06:30:00.000Z');
  assert.notEqual(result.submitted, result.preserved);
});
