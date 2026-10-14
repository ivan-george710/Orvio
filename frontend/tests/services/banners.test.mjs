import { test } from 'node:test';
import assert from 'node:assert/strict';
import { metadata, ownerId, projectUrl } from '../support/event-subjects.mjs';
import { loadSubject } from '../support/load-subject.mjs';

function png(name = 'image.png') {
  return new File([new Uint8Array([137,80,78,71,13,10,26,10])], name, { type: 'image/png' });
}

function setup(context, { user = { id: ownerId }, authError = null, uploadError = null } = {}) {
  const previous = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = projectUrl;
  context.after(() => {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previous;
  });
  const uploads = [];
  const buckets = [];
  let clients = 0;
  let authReads = 0;
  let publicUrlReads = 0;
  const service = loadSubject('../../lib/services/banners.ts', {
    '@/lib/event-metadata': metadata,
    '@/lib/supabase/client': {
      createClient: () => {
        clients += 1;
        return {
          auth: { getUser: async () => {
            authReads += 1;
            return { data: { user }, error: authError };
          } },
          storage: { from: (bucket) => {
            buckets.push(bucket);
            return {
              upload: async (path, file, options) => {
                uploads.push({ path, file, options });
                return { error: uploadError };
              },
              getPublicUrl: (path) => {
                publicUrlReads += 1;
                return { data: { publicUrl: `${projectUrl}/storage/v1/object/public/${bucket}/${path}` } };
              },
            };
          } },
        };
      },
    },
  });
  return { service, uploads, buckets,
    get clients() { return clients; }, get authReads() { return authReads; },
    get publicUrlReads() { return publicUrlReads; } };
}

test('banner uploads use a verified account folder and a generated filename', async (context) => {
  const fixture = setup(context);
  const file = png('../untrusted-name.png');
  const url = await fixture.service.uploadEventBanner(file);
  assert.equal(fixture.uploads.length, 1);
  assert.match(fixture.uploads[0].path, new RegExp(`^${ownerId}/[0-9a-f-]{36}\\.png$`));
  assert.ok(!fixture.uploads[0].path.includes('untrusted-name'));
  assert.equal(fixture.uploads[0].file, file);
  assert.deepEqual(fixture.buckets, ['event-banners']);
  assert.equal(metadata.bannerPathFromUrl(url, projectUrl), fixture.uploads[0].path);
  assert.equal(fixture.authReads, 1);
});

test('banner uploads never overwrite an existing storage object', async (context) => {
  const fixture = setup(context);
  await fixture.service.uploadEventBanner(png());
  assert.deepEqual(fixture.uploads[0].options, {
    cacheControl: '3600', upsert: false, contentType: 'image/png',
  });
});

test('invalid file types are rejected before opening a client', async (context) => {
  const fixture = setup(context);
  await assert.rejects(fixture.service.uploadEventBanner(new File(['text'], 'file.svg', { type: 'image/svg+xml' })), /JPEG, PNG or WebP/);
  assert.equal(fixture.clients, 0);
  assert.equal(fixture.uploads.length, 0);
});

test('spoofed image contents do not reach storage', async (context) => {
  const fixture = setup(context);
  await assert.rejects(fixture.service.uploadEventBanner(new File(['not png'], 'file.png', { type: 'image/png' })), /contents/);
  assert.equal(fixture.clients, 0);
});

test('anonymous users cannot upload even a valid image', async (context) => {
  const fixture = setup(context, { user: null });
  await assert.rejects(fixture.service.uploadEventBanner(png()), /log in/);
  assert.equal(fixture.uploads.length, 0);
  assert.equal(fixture.buckets.length, 0);
});

test('an Auth verification error prevents storage writes', async (context) => {
  const fixture = setup(context, { authError: { message: 'expired authentication' } });
  await assert.rejects(fixture.service.uploadEventBanner(png()), /log in/);
  assert.equal(fixture.uploads.length, 0);
});

test('storage errors have a safe explanation and do not produce a public URL', async (context) => {
  const fixture = setup(context, { uploadError: { message: 'private storage policy information' } });
  await assert.rejects(fixture.service.uploadEventBanner(png()), {
    message: 'Your banner could not be uploaded. Please try again.',
  });
  assert.equal(fixture.publicUrlReads, 0);
});

test('separate banner uploads receive separate object identities', async (context) => {
  const fixture = setup(context);
  const first = await fixture.service.uploadEventBanner(png());
  const second = await fixture.service.uploadEventBanner(png());
  assert.notEqual(first, second);
  assert.notEqual(fixture.uploads[0].path, fixture.uploads[1].path);
});
