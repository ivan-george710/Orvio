import { z } from 'zod';
import { loadSubject } from './load-subject.mjs';
import { supabaseStub } from './supabase-stub.mjs';

export const validation = loadSubject('../../lib/validations/event.ts', { zod: { z } });
export const metadata = loadSubject('../../lib/event-metadata.ts', {
  zod: { z }, '@/lib/validations/event': validation,
});
export const registration = loadSubject('../../lib/registrations.ts');
export const dates = loadSubject('../../lib/event-datetime.ts');
export const discovery = loadSubject('../../lib/event-discovery.ts', {
  '@/lib/event-metadata': metadata, '@/lib/registrations': registration,
});
export const errors = loadSubject('../../lib/supabase/errors.ts');
export const ownerId = '12345678-1234-4234-8234-123456789abc';
export const eventId = '22345678-1234-4234-8234-123456789abc';
export const otherId = '32345678-1234-4234-8234-123456789abc';
export const projectUrl = 'https://example.supabase.co';

export function eventFixture(overrides = {}) {
  return {
    id: eventId, title: 'DA3 Event Fixture', description: 'A synthetic event for testing.',
    venue: 'Main Hall', event_datetime: '2035-05-15T12:00:00Z', max_participants: 20,
    created_by: ownerId, created_at: '2026-01-01T00:00:00Z', status: 'pending',
    category: 'technology', banner_url: null,
    ...overrides,
  };
}

export function eventInput(overrides = {}) {
  const fixture = eventFixture();
  return {
    title: fixture.title, description: fixture.description, venue: fixture.venue,
    event_datetime: fixture.event_datetime, max_participants: fixture.max_participants,
    category: fixture.category, banner_url: fixture.banner_url,
    ...overrides,
  };
}

export function eventService(options = {}) {
  const db = supabaseStub({ user: { id: ownerId }, ...options });
  const summaryRequests = [];
  const service = loadSubject('../../lib/services/server/events.ts', {
    '@/lib/event-metadata': metadata,
    '@/lib/supabase/server': { createClient: db.createClient },
    '@/lib/supabase/errors': errors,
    '@/lib/services/server/registrations': {
      getRegistrationSummaries: async (ids) => {
        summaryRequests.push(ids);
        return options.summaries || {};
      },
    },
  });
  return { db, service, summaryRequests };
}
