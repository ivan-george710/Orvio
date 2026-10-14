import { test } from 'node:test';
import assert from 'node:assert/strict';
import { metadata, dates, eventInput, ownerId, otherId, eventId, projectUrl } from '../support/event-subjects.mjs';

const bannerUrl = `${projectUrl}/storage/v1/object/public/event-banners/${ownerId}/${eventId}.png`;

test('every supported event category has a readable label', () => {
  for (const category of metadata.EVENT_CATEGORIES) {
    assert.equal(metadata.eventCategory(category.value), category.value);
    assert.equal(metadata.eventCategoryLabel(category.value), category.label);
    assert.equal(metadata.eventDetailsSchema.safeParse(eventInput({ category: category.value })).success, true);
  }
});

test('legacy events without a category display Other', () => {
  for (const value of [null, undefined, '', 'unknown', '__proto__', 42]) {
    assert.equal(metadata.eventCategory(value), 'other');
    assert.equal(metadata.eventCategoryLabel(value), 'Other');
  }
});

test('legacy event submissions receive explicit metadata defaults', () => {
  const { category: ignoredCategory, banner_url: ignoredBanner, ...legacy } = eventInput();
  assert.equal(ignoredCategory, 'technology');
  assert.equal(ignoredBanner, null);
  const parsed = metadata.eventDetailsSchema.parse(legacy);
  assert.equal(parsed.category, 'other');
  assert.equal(parsed.banner_url, null);
});

test('unknown categories cannot be persisted through the event schema', () => {
  for (const category of ['Technology', 'all', 'invalid', null, 123]) {
    assert.equal(metadata.eventDetailsSchema.safeParse(eventInput({ category })).success, false);
  }
});

test('event submissions cannot over-post status or ownership', () => {
  for (const extra of [{ status: 'approved' }, { created_by: otherId }, { role: 'admin' }]) {
    assert.equal(metadata.eventDetailsSchema.safeParse({ ...eventInput(), ...extra }).success, false);
  }
});

test('the extended event schema retains core validation', () => {
  for (const invalid of [
    { title: 'x' }, { description: 'short' }, { venue: '' },
    { event_datetime: 'invalid' }, { max_participants: 0 },
  ]) {
    assert.equal(metadata.eventDetailsSchema.safeParse(eventInput(invalid)).success, false);
  }
});

test('banner fields accept a valid URL or explicit absence', () => {
  assert.equal(metadata.eventDetailsSchema.safeParse(eventInput({ banner_url: bannerUrl })).success, true);
  assert.equal(metadata.eventDetailsSchema.safeParse(eventInput({ banner_url: null })).success, true);
  assert.equal(metadata.eventDetailsSchema.safeParse(eventInput({ banner_url: 'not-a-url' })).success, false);
});

test('public banner URLs resolve only to the expected bucket and object format', () => {
  assert.equal(metadata.bannerPathFromUrl(bannerUrl, projectUrl), `${ownerId}/${eventId}.png`);
  for (const extension of ['jpg', 'webp']) {
    assert.equal(metadata.bannerPathFromUrl(bannerUrl.replace('.png', `.${extension}`), projectUrl), `${ownerId}/${eventId}.${extension}`);
  }
});

test('external hosts and transport changes cannot become event banners', () => {
  for (const url of [
    bannerUrl.replace('example.supabase.co', 'external.example'),
    bannerUrl.replace('https:', 'http:'),
    bannerUrl.replace('example.supabase.co', 'example.supabase.co.external.example'),
  ]) assert.equal(metadata.bannerPathFromUrl(url, projectUrl), null);
});

test('banner URLs reject credentials, query strings and fragment suffixes', () => {
  for (const url of [bannerUrl + '?download=1', bannerUrl + '#fragment', bannerUrl.replace('https://', 'https://user:password@')]) {
    assert.equal(metadata.bannerPathFromUrl(url, projectUrl), null);
  }
});

test('banner URLs reject another bucket, arbitrary file paths and encoded traversal', () => {
  for (const url of [
    bannerUrl.replace('/event-banners/', '/avatars/'),
    bannerUrl.replace(`${eventId}.png`, 'arbitrary.svg'),
    bannerUrl.replace(`${ownerId}/`, '../'),
    bannerUrl.replace(`${ownerId}/`, `${ownerId}%2f`),
  ]) assert.equal(metadata.bannerPathFromUrl(url, projectUrl), null);
});

test('banner URL parsing fails safely for absent or malformed configuration', () => {
  for (const value of [undefined, null, 42, '/relative/path', 'invalid']) {
    assert.equal(metadata.bannerPathFromUrl(value, projectUrl), null);
  }
  assert.equal(metadata.bannerPathFromUrl(bannerUrl, undefined), null);
  assert.equal(metadata.bannerPathFromUrl(bannerUrl, 'invalid'), null);
});

test('an event creator can use their own uploaded banner', () => {
  assert.equal(metadata.ownedBannerUrl(bannerUrl, ownerId, projectUrl), bannerUrl);
  assert.equal(metadata.ownedBannerUrl(null, ownerId, projectUrl), null);
});

test('another account’s banner cannot be attached by an event creator', () => {
  assert.throws(() => metadata.ownedBannerUrl(bannerUrl, otherId, projectUrl), /uploaded by your account/);
});

test('PNG header validation identifies the correct storage extension', async () => {
  const file = new File([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])], 'banner.png', { type: 'image/png' });
  assert.deepEqual(await metadata.inspectBannerFile(file), { extension: 'png' });
});

test('JPEG header validation ignores the user-provided filename extension', async () => {
  const file = new File([new Uint8Array([255,216,255,224])], 'image.txt', { type: 'image/jpeg' });
  assert.deepEqual(await metadata.inspectBannerFile(file), { extension: 'jpg' });
});

test('WebP header validation requires both RIFF and WEBP markers', async () => {
  const file = new File(['RIFF0000WEBP'], 'image.webp', { type: 'image/webp' });
  assert.deepEqual(await metadata.inspectBannerFile(file), { extension: 'webp' });
  await assert.rejects(metadata.inspectBannerFile(new File(['RIFF0000XXXX'], 'bad.webp', { type: 'image/webp' })), /contents/);
});

test('unsupported banner MIME types are rejected before reading file contents', async () => {
  for (const type of ['image/svg+xml', 'text/html', 'application/pdf', '']) {
    const file = new File(['content'], 'upload', { type });
    await assert.rejects(metadata.inspectBannerFile(file), /JPEG, PNG or WebP/);
  }
});

test('empty banner files cannot be uploaded', async () => {
  await assert.rejects(metadata.inspectBannerFile(new File([], 'empty.png', { type: 'image/png' })), /empty/);
});

test('banner size limits are enforced before reading file contents', async () => {
  const file = {
    type: 'image/png', size: metadata.MAX_BANNER_BYTES + 1,
    slice() { assert.fail('Oversized files must not be read'); },
  };
  await assert.rejects(metadata.inspectBannerFile(file), /5 MB or smaller/);
});

test('the exact banner size limit remains accepted when the image header matches', async () => {
  const header = new Uint8Array([137,80,78,71,13,10,26,10]);
  const file = {
    type: 'image/png', size: metadata.MAX_BANNER_BYTES,
    slice: () => new Blob([header]),
  };
  assert.deepEqual(await metadata.inspectBannerFile(file), { extension: 'png' });
});

test('a disguised non-image cannot pass by changing its MIME type', async () => {
  const file = new File(['<html>not an image</html>'], 'fake.png', { type: 'image/png' });
  await assert.rejects(metadata.inspectBannerFile(file), /contents do not match/);
});

test('absent and invalid stored event dates leave the date input blank', () => {
  for (const value of [null, undefined, '', 'invalid']) assert.equal(dates.localEventDateTime(value), '');
});

test('stored date values become local minute-precision form values', () => {
  const input = '2035-05-15T12:34:00Z';
  const local = dates.localEventDateTime(input);
  assert.match(local, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  assert.equal(new Date(local).getTime(), new Date(input).getTime());
});

test('date edits normalize the chosen local instant to an explicit UTC timestamp', () => {
  const local = '2035-05-15T18:45';
  assert.equal(dates.eventDateTimeForStorage(local), new Date(local).toISOString());
  assert.match(dates.eventDateTimeForStorage(local), /Z$/);
});

test('editing another event field preserves stored seconds and milliseconds', () => {
  const previous = '2035-05-15T12:34:56.789Z';
  const local = dates.localEventDateTime(previous);
  assert.equal(dates.eventDateTimeForStorage(local, previous), previous);
});

test('changing a date does not retain the previous timestamp', () => {
  const previous = '2035-05-15T12:00:00Z';
  const next = '2035-06-20T09:15';
  assert.equal(dates.eventDateTimeForStorage(next, previous), new Date(next).toISOString());
});

test('invalid date submissions cannot reach database storage', () => {
  assert.throws(() => dates.eventDateTimeForStorage('invalid'), /valid event date/);
});
