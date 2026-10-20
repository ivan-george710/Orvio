# ORVIO — Quick Revision

Audit: **20 October 2026**, repository **955f1af**. Read this as four compact revision pages; Markdown has no fixed physical pagination. Use the [complete handbook](ORVIO_COMPLETE_HANDBOOK.md) for explanations and the [implementation audit](ORVIO_IMPLEMENTATION_STATUS.md) for evidence limits. Source paths are relative to the project root, `Orvio/` inside the workspace.

## Revision page 1 — Product, stack, and architecture

### The project in one breath

ORVIO brings event discovery, moderated submissions, and participant registration into one web application. Visitors browse approved events. Signed-in members submit pending events, register for eligible events, cancel before the start, and retain registration history. Creators see their attendee records; admins moderate events and change roles.

The problem is fragmented coordination through independent forms, messages, and spreadsheets. ORVIO adds a shared event lifecycle and database-backed participation records. It goes beyond a listing website through approval, personal history, capacity rules, and attendee permissions.

### Stack to remember

| Technology | Actual role |
| --- | --- |
| Next.js 16.2.11 | App Router pages, server rendering, server actions, proxy |
| React 19.2.4 + TypeScript | Reusable components, interactions, static domain contracts |
| Tailwind 4 + local shadcn/Base UI primitives | Black/orange styles, responsive layouts, dialogs/forms |
| Supabase Auth | Identity, credentials, sessions |
| Supabase PostgreSQL/PostgREST/RPC | Tables, queries, RLS, transactional business rules |
| Supabase Storage | Public event banners |
| Supabase SSR SDK | Cookie-aware browser/server clients |
| Zod + React Hook Form | Runtime input checks and event form handling |
| Lucide + class helpers + CSS animation | Icons, component variants, consistent UI |
| Node test runner / Playwright / Stryker | Stubbed logic tests / browser tests / selected mutation tests |
| Python unittest + psycopg2 | Disposable PostgreSQL policy/concurrency tests |

Framer Motion and Sonner are installed but not imported in application source. FastAPI/Python dependencies exist, but `backend/app/main.py` is empty and no integrated Python API was found. Vercel is suggested in starter documentation; actual production hosting is unverified.

### Architecture explanation

```text
Browser navigation → Next.js proxy/server pages → server services
Browser interaction → Next.js server actions → server services
Server services → Supabase Auth and data/RPC API → PostgreSQL
Browser Auth forms → Supabase Auth
Browser banner upload → Supabase Storage
```

The browser header also reads the user's own profile role directly. Its hidden/shown admin link is navigation, not security. Next.js server code and Supabase implement the current backend behavior; there is no implemented custom ORVIO REST API.

Server components load data before rendering. Client components, marked `use client`, manage forms, timers, dialogs, and button state. A server action is a Next.js server mutation entry point, not automatically a REST endpoint with a hand-written URL.

### Three lines evaluators may challenge

- “Only organizers create events” is inaccurate: all authenticated members can create own pending events.
- “The protected folder secures its pages” is inaccurate: route groups only organize files; the proxy, services, and database enforce access.
- “The tests prove the live database” is inaccurate: today's safe tests use stubs; target hosted schema was unavailable through the connector.

<!-- pagebreak -->

## Revision page 2 — Auth, roles, and database

### Authentication and profile flow

Signup calls `auth.signUp()` with email/password and `full_name` metadata. The repository expects an Auth INSERT trigger calling `handle_new_user()`. That function creates `public.profiles` with the Auth UUID and literal `participant` role. The upgrade replaces the function but assumes the existing trigger attachment.

Login uses `signInWithPassword()`. The SSR browser client stores session state in cookies; `proxy.ts` calls `updateSession()` to verify `getUser()`, refresh cookies, and preserve Auth cache headers. Server services verify identity again for sensitive work. Logout calls `signOut()` and navigates home.

`safeReturnPath()` validates raw and decoded internal destinations. Invalid/external paths fall back to `/dashboard`. Protected paths are dashboard, registrations, admin, profile, event creation, event editing, and attendee routes. Approved event browsing/details remain public where RLS permits.

Signup always navigates toward the dashboard after a successful response; confirmation-required projects may not have a session yet. No complete password-reset, confirmation callback, or resend UI was found.

### Roles and capabilities

| Identity | Capabilities |
| --- | --- |
| Guest | Browse approved events/details |
| Participant or organizer | Create pending events; edit/delete own pending; register/cancel own; view personal history; attendees of owned events |
| Admin | Above plus all-event moderation/deletion/attendee views and role management |

Admin rights come from `profiles.role`, not signup metadata. Admins do not get direct registration table write privileges as normal authenticated users. The regular event editor still requires own pending ownership, including for an admin using it.

### Business tables

| Table | Main fields | Relationships/rules |
| --- | --- | --- |
| `profiles` | id, full_name, role, created_at, updated_at | ID is PK/FK to auth.users; profile role/ID trigger |
| `events` | id, created_by, title, description, venue, event_datetime, max_participants, status, category, banner_url, timestamps | Creator FK to profiles; five status values, six category values; capacity-change trigger |
| `registrations` | id, event_id, user_id, status, registered_at, cancelled_at | FKs to events/profiles; one active event/user; cancelled history retained |

The registration table is **not** called `event_registrations`. There is no implemented `public.users` password table or feedback table. Auth owns credentials/email; profiles own app display name/role. The profile page reads email from Auth, not profiles.

The schema description comes from a disposable baseline plus three upgrades. A full production bootstrap is absent, and today's connector could not inspect the configured project. Do not say “the deployed schema was verified today.”

Key indexes: profile/event/registration PKs; events creator index; approved category/schedule partial index; registration user/event history indexes; and unique partial `(event_id,user_id)` where `status='registered'`.

### Security in four layers

1. Auth determines identity.
2. Server services validate inputs and check owner/admin authority.
3. RLS filters permitted rows; table grants restrict operation types.
4. SQL functions/triggers/constraints enforce registration and role invariants.

`auth.uid()` is the current authenticated subject UUID. `SECURITY DEFINER` functions run with owner privileges, so they must validate access internally. Public registration RPC wrappers are invokers; privileged implementations live in `private` with fixed search paths and restricted grants.

<!-- pagebreak -->

## Revision page 3 — Event and registration internals

### Event creation and lifecycle

`CreateEventForm` → `createEvent()` → `createEventAction()` → `createOwnedEvent()` → Supabase INSERT.

The form/server schema requires title 3–100, description 10–1000, venue 2–100, future time, and positive integer capacity. The extended schema accepts six categories and an optional owned banner URL, rejecting extra fields. The server supplies owner and pending status. The database INSERT policy also requires own pending creation.

Categories: technology, workshop, cultural, sports, community, other. Browser-local date input becomes an ISO instant; unchanged edit times preserve the original instant.

```text
Member creates pending → admin approves or rejects
Owner may edit/delete pending
Admin may cancel; approved may be marked completed
Admin may reapprove/reject other statuses; database has no strict transition graph
```

States are pending, approved, rejected, completed, cancelled. No draft/withdrawn/published state is implemented. Withdrawal hard-deletes an own pending event. Completed is an admin-set status, not an automatic timer. Discovery selects approved events, including past ones unless filtered.

### Registration flow

`RegisterEventButton` → actions in `lib/actions/registrations.ts` → service → `public.register_for_event()` → private SQL implementation.

The server validates the event UUID and calls `getUser()`. The database obtains identity from `auth.uid()` and locks the event `FOR UPDATE`. It rejects missing identity/event, non-approved status, null/past start, duplicate active registration, or null/full capacity. It inserts only after those checks.

**Last-seat answer:** both requests lock the same event. Under default READ COMMITTED behavior, one waits; after the first commits, the next active-count query sees the occupied seat. The supported RPC path is designed to prevent overbooking. Today's Node tests do not execute that SQL, so qualify live verification.

Cancellation locks the same event and changes only the caller's active row to cancelled with a timestamp before start. It does not require the event to remain approved. Re-registration inserts a new row, keeping cancelled history. A partial unique index allows historical duplicates while forbidding two active rows for the same event/person.

Capacity reductions cannot drop below the active count or change to null. Direct registration INSERT/UPDATE/DELETE is revoked for authenticated callers, including profile admins; narrow functions supply the permitted writes.

### Counts and attendee history

`registration_summaries()` returns counts, remaining seats, caller registration state, manage permission, and organizer display name. Calls batch 200 event IDs. Personal history uses an own-user RPC with 500-row retrieval batches. Attendees require event owner/admin, show names/status/times, and display 50 rows with a 51st row to detect the next page. Cancelled history preserves event visibility even after a status change.

After registration/cancellation, the action invalidates related pages and fetches a committed summary. If that fetch fails after the SQL succeeds, the UI can report a failure despite a committed change; refresh before assuming rollback.

### Important files/functions to memorize

| Question | File/function under frontend/ |
| --- | --- |
| Session refresh? | `lib/supabase/middleware.ts`: updateSession |
| Admin guard? | `lib/services/server/events.ts`: getCurrentUserRole, ensureAdmin |
| Create/edit ownership? | Same file: createOwnedEvent, updateEvent |
| Discovery? | Same file: getApprovedEvents; `lib/event-discovery.ts` filters |
| Register/cancel? | `lib/services/server/registrations.ts` plus SQL upgrade |
| Authoritative UI refresh? | `lib/actions/registrations.ts`: changeRegistration |
| Name edit? | `lib/services/server/profile.ts`: updateCurrentProfile |
| Banner upload? | `lib/services/banners.ts`: uploadEventBanner |

<!-- pagebreak -->

## Revision page 4 — Verification, demo, and terminology

### Commands and current results

From `frontend`, use Node 22+ for the documented testing setup. Public configuration names are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Never use a service-role key in browser configuration.

```powershell
npm.cmd ci
npm.cmd run dev
npm.cmd run test:all
npm.cmd run lint
npm.cmd exec tsc -- --noEmit --incremental false
npm.cmd run build
npm.cmd run start
```

`ci` is a setup instruction, not something run in this audit. Dev defaults to `http://localhost:3000`. Start requires a successful build. On this Windows system use `.cmd` because PowerShell blocked npm.ps1.

| Audit check | Result |
| --- | --- |
| Node test:all | **190 passed, zero failures/skips** |
| ESLint | **Passed** |
| Standalone TypeScript | **Failed**, missing @playwright/test and related callback types |
| Production build | **Failed** at type checking after successful compilation |
| Browser, mutation, PostgreSQL tests | **Not run** |
| Target hosted schema | **Not inspected**; connector project mismatch |

The 14-browser-test success and 98.29% four-helper mutation score in `docs/testing/DA3-RESULTS.md` are historical reports from 14 October. The SQL races in `docs/REGISTRATIONS.md` are historical too. Do not present them as fresh results.

### A compact demo plan

Guest discovery → member submission → pending dashboard → admin review/approval → member registration → personal history → dismiss/confirm cancellation → re-register → creator/admin attendee list. Use dedicated accounts/events and confirm project/migrations beforehand. Repair the missing build dependency before presenting a production build.

### Honest limitations to mention

- No attendance/QR tickets, feedback, payments, waitlist, notifications, or full organizer analytics.
- Counts are snapshots, with no realtime subscription to other users' changes.
- Large lists are fetched in batches but rendered as full lists; some admin reads can hit API result limits.
- Null capacity is displayed as Unlimited but rejected by registration SQL.
- Last-admin protection is an application self-demotion check, not an atomic database invariant.
- Public banners can outlive removed drafts; uploads and event save are separate.
- SQL permits some data that the application validates more strictly; handwritten types may disagree with baseline nullability.
- Production hosting and deployed policies/settings were not established by this audit.

### Key terminology

| Term | Remember it as… |
| --- | --- |
| Authentication / authorization | Who are you / what may you do |
| RLS / grant | Which rows / which operation types |
| PK / FK | Row identity / valid relationship to another row |
| RPC | Calling a named database function |
| Transaction / row lock | Commit a unit of work / serialize access to an event |
| Partial unique index | One active registration while permitting cancelled history |
| Server component / client component | Server-rendered data UI / browser interactions |
| Server action | Framework-managed Next.js mutation function |
| SSR / CSR | Rendering on server / rendering in browser |
| UUID | Identifier used for users, events, registrations and upload paths |
| Zod / TypeScript | Runtime value validation / compile-time contracts |
| Security definer | Runs as function owner; caller checks are essential |
| PostgREST | Supabase's PostgreSQL-facing data API |
| ORM | Not used by this application's running data layer |

Final recall: **pending event → admin approval → authenticated transactional registration → cancellation history; server checks and database rules both matter.**
