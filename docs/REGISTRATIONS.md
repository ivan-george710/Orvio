# ORVIO registration system - handoff

Implemented on branch `feature/event-registrations`. Nothing was committed or pushed. The previous Obsidian & Ember redesign and existing organizer-name changes are preserved.

1. **Functionality.** Authenticated registration, cancellation before the event starts, re-registration with retained history, real capacity counts, login return links, personal registration history, owner attendee management, and admin visibility are implemented. Full, closed, registered, loading, success, and error states use the existing ORVIO design.

2. **Tables.** Extended the existing `public.registrations`; no duplicate registration table was created. Added `status` (`registered` / `cancelled`) and `cancelled_at`, normalized missing registration timestamps, and added status/timestamp constraints. Existing registration IDs and timestamps were preserved. Existing `events` and `profiles` gained permission/trigger protections. Existing foreign keys and cascade behavior remain.

3. **Migrations.** Both files in `supabase/migrations` are confirmed applied to the connected ORVIO project `tpvnwjqvautcysfsjstu`:
   - `20261011054251_complete_event_registrations.sql`
   - `20261011054420_harden_existing_role_helper.sql`
   Their local versions match Supabase's recorded migration history. Before and after migration: 6 auth users, 6 profiles, 3 events, 1 registration. The fingerprint of the original registration's ID, event, owner, and timestamp remained `d7d68c52916bff89d5d4398b36b1d205`.

4. **RLS and permissions.** Registration SELECT allows the participant's own rows, event creators' rows, and trusted profile admins. `anon` has no registration table privileges; `authenticated` has SELECT only. Neither participants nor admins can directly insert, update, delete, or truncate registrations. Participants with registration history retain event visibility if its status changes. Creators can only submit pending events. Profile triggers prevent non-admin role changes and ownership changes while preserving admin role management. Signup always creates a participant, ignoring role claims in user metadata.

5. **Functions and concurrency.** Public invoker RPC wrappers call narrowly scoped security-definer implementations in the non-exposed `private` schema. All use explicit schema qualification, fixed search paths, and restricted EXECUTE privileges. `register_for_event` and `cancel_registration` derive identity from `auth.uid()` and lock the same event row before validating/mutating. Counts are checked inside the transaction under PostgreSQL's default READ COMMITTED isolation. A partial unique index prevents duplicate active registrations. A capacity-update trigger prevents reducing capacity below active registrations. `registration_summaries`, `get_my_registrations`, and `get_event_attendees` provide authorized reads. The existing `is_admin` API now delegates to a private helper without exposing privileged public functions.

6. **Application changes.** Updated event cards/details, login, dashboard, registrations page, and admin dashboard. Added `/events/[id]/attendees`, `CapacityIndicator`, `MyRegistrations`, registration server actions, safe error/eligibility/redirect helpers, and an error boundary. The existing registration service was replaced with secure RPC calls. Lists retrieve counts in batches of up to 200 events; directory reads use batches of 500, not per-card queries. Attendee history is paginated at 50 rows. No browser service-role key or separate backend server is needed.

7. **Participant flow.** Login returns to the selected event using a validated internal path. The action authenticates again and calls the database using that user's session. The database checks approval, time, duplicate status, and capacity. On success, the action returns the committed registration/count snapshot and revalidates related pages. Cancellation marks the current active row cancelled and releases its spot; re-registration creates a new row. The confirmation dialog supports keyboard focus, Escape, and pending/error states. Personal history distinguishes cancelled rows from active registrations and created events.

8. **Organizer/admin visibility.** Creators get View Attendees on their event/details/dashboard. Admins get registration management across all event statuses, alongside the existing approval/rejection workflow. The shared attendee route checks authorization on the server and again in PostgreSQL. Attendee UI shows names, dates, and status, with `Unknown Attendee` for blank names; no emails or raw UUIDs are rendered. Admins do not gain forced-registration or arbitrary attendee-edit controls.

9. **Validation.** TypeScript, repository-wide ESLint, production build, and 3 frontend tests passed. The isolated PostgreSQL suite passed 20 tests covering every eligibility state, duplicate/concurrent requests, cancellation/history, direct-write denial, impersonation, role escalation, RLS, owner/admin access, fallback names, and event moderation/editing. A 20-user race for 3 spots produced exactly 3 successes; an 8-request same-user race produced exactly 1 success. The final live regression passed 12 scenario groups, including real public signup/login, 53-row attendee pagination, and three repeated cancellation/re-registration cycles without a reload. Live browser/API results and screenshots are in `docs/registration-review`. The live race used 3 users for 1 spot and produced exactly 1 success. Temporary test fixtures are deleted by exact IDs in `finally`, without deleting existing users/events.

10. **Deployment.** No additional SQL execution is required for the connected project. Deploy the updated frontend with its existing Supabase URL and anon key; restart a running production server after building. A local production preview runs at `http://localhost:3010`. For another existing ORVIO database, review its schema first, then apply these migrations in order using Supabase migrations/SQL Editor. These are upgrades for the audited existing schema, not a bootstrap for an empty database. Never reset the project or run the test baseline against a hosted project.

11. **Limits.** Capacity refreshes after actions/navigation; there is no realtime subscription to other users' activity. Server-side eligibility always remains authoritative. There is no waitlist, email notification, or forced admin registration. Historical cancellations are preserved, but existing hard deletion of an event/account cascades to its registrations. Very large event directories and personal histories are fetched in batches but rendered as full lists; attendee lists have explicit pagination. Existing project settings still have leaked-password protection disabled, and Next.js reports the pre-existing middleware-to-proxy deprecation warning. Neither prevents the registration feature from working.

## Reproduce checks

From the repository root:

```powershell
# Disposable local database only. If it exists, use docker start instead.
docker run --name orvio-registration-tests -e POSTGRES_PASSWORD=orvio-local-test -p 127.0.0.1:55432:5432 -d postgres:17
backend/venv/Scripts/python.exe supabase/tests/test_registrations.py

Set-Location frontend
npm.cmd test
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
npm.cmd run start -- --port 3010
```

`supabase/tests/baseline.sql` models the audited original schema and a minimal local Auth interface. The Python runner connects only to the fixed disposable localhost database and resets only its fixture tables. It requires `psycopg2-binary`, already available in the backend virtual environment.

The live browser regression is explicitly opt-in. It creates temporary confirmed accounts and events in the configured ORVIO project, validates real server actions/RPCs, and removes only its own IDs. The public signup test checks auto-confirm is enabled first, so it does not send confirmation emails. It uses the backend service key only in the Node test process for fixture setup/cleanup. Passwords/tokens are never printed or stored in artifacts.

Install Playwright in a separate QA directory, set `ORVIO_QA_MODULES` to that directory (containing `package.json` and `node_modules`), and run from the repo root while the production app runs:

```powershell
$env:ORVIO_RUN_LIVE_TESTS='1'
$env:ORVIO_QA_MODULES="$env:TEMP/orvio-ui-browser-qa"
$env:ORVIO_TEST_BASE_URL='http://localhost:3010'
node frontend/tests/registration-browser.mjs
```

The browser test uses the installed Windows Chrome executable. Its screenshots and machine-readable outcome are saved in `docs/registration-review`. Check `completed: true` in `browser-results.json` for the latest result.
