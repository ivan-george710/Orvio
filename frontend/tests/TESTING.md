# Orvio testing tools

This project uses Playwright Test for browser integration and regression suites,
and StrykerJS for mutation testing of four helper and validation modules. These are actual test
runners; their browser reports provide named outcomes and screenshot evidence.

## Local setup

Use Node.js 22 or later. In PowerShell, from `frontend`:

```powershell
npm.cmd install
npm.cmd run test:browsers
```

Copy `.env.example` to `.env.local` and enter the existing Supabase URL and anon
key. Never put a service-role key in the browser configuration.

Copy `.env.test.example` to `.env.test.local` locally and fill:

```dotenv
ORVIO_TEST_EMAIL=your-dedicated-test-account-email
ORVIO_TEST_PASSWORD=your-dedicated-test-account-password
ORVIO_TEST_EVENT_ID=the-test-event-uuid
```

Use a dedicated participant account and an administrator-approved event whose
title begins `DA3 Test`, or set `ORVIO_TEST_EVENT_TITLE` to the exact title of the
event explicitly selected for testing. Give it a future start time and spare capacity. Create
and approve the event through the ordinary application. The browser suite does
not reset the database or delete users/events. Integration IT-03 creates and
cancels only its own registration, leaving cancelled history as evidence.

Without participant credentials or an event ID, dependent cases are skipped.
Skipped cases are not successful tests and must not be counted as completed.

The runner starts the frontend on port 3010 by default. To use a server you have
already started, set `ORVIO_TEST_BASE_URL=http://localhost:3000` in
`.env.test.local`. No Supabase credentials are needed for mutation tests.

## Graphical testing interface

```powershell
npm.cmd run test:ui
```

Select the integration or regression project in the Playwright interface and run
individual cases. Run the command suites below when generating the final reports.

For all seven integration and seven regression outcomes together in Playwright's
native HTML interface, run:

```powershell
npm.cmd run test:browser
npm.cmd run test:report
```

The combined report is served at `http://127.0.0.1:9323`. Filter by project to
capture seven integration or seven regression results, or clear the project
filter to show all fourteen. Open a case to view its steps and screenshot attachments.

## Integration

```powershell
npm.cmd run test:integration
npm.cmd run test:report:integration
```

IT-01 checks the protected-route/authentication boundary. IT-02 follows real login
to personal history. IT-03 checks registration persistence across pages and
cancellation history. This initial suite is not an exhaustive database security
or concurrency assessment. IT-04 checks database-backed discovery search;
IT-05 checks a missing event; IT-06 and IT-07 check denied attendee/editor access
for a non-owner participant. Capture the summary and IT-03 steps/screenshots.

## Regression

```powershell
npm.cmd run test:regression
npm.cmd run test:report:regression
```

Run this suite as a baseline, save its report, then rerun it after changes. Record
the revision and date for both runs. RG-06 creates a fixture registration if
needed, dismisses cancellation, verifies persistence after navigation, and
cancels only the registration it created. Existing active registrations are retained.
RG-07 checks that an external login return destination falls back to the dashboard.

## Mutation

```powershell
npm.cmd run test:mutation
Start-Process reports/mutation/index.html
```

Stryker mutates `lib/registrations.ts`, `lib/utils.ts`,
`lib/validations/event.ts`, and `lib/supabase/errors.ts` in a sandbox and runs
the eighteen Node helper tests. This evaluates eligibility, error mapping,
safe return paths, UI formatting/class composition, event validation, and error fallbacks;
it does not mutate SQL or prove database capacity enforcement. Capture the actual
score summary and a changed condition with its detected/surviving outcome.

## Evidence and commits

Commit configuration, test source, and this guide. Generated reports, downloaded
browsers, mutation sandboxes, credentials, and node_modules are ignored. Reports
have screenshots attached after non-skipped browser cases; traces are disabled
to avoid retaining login request credentials. Save reports before rerunning a
suite, as a new run replaces that suite's output. Do not publish test passwords.

The assignment report must describe only the suites and cases actually executed,
including failures, skips, and the precise scope of the mutation score.
