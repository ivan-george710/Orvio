# ORVIO — Implementation Status and Audit Evidence

Audit date: **20 October 2026**. Baseline commit: **955f1af**. Scope: documentation only; authored changes stay under `docs/project-handbook/`. Paths are relative to the project root (`C:\Users\ivang\Orvio\Orvio` here).

## Status definitions and evidence boundaries

| Status | Meaning |
| --- | --- |
| Implemented and verified | Inspected implementation and a relevant safe check passed in this audit; scope is stated, usually Node/stub-level |
| Implemented but not verified | Source/SQL exists, but complete runtime behavior was not exercised today |
| Partially implemented | Some advertised pieces exist, with concrete missing parts |
| Not implemented | No implementation found in audited app/SQL; planning text is not sufficient |

**No row labeled verified should be read as fresh hosted-database verification.** The connector inventory did not include the project configured in the frontend environment. It was therefore unsuitable for inspecting this app's tables and policies; no unrelated project was queried. Schema findings use the disposable test baseline plus upgrades. Historical live results are listed separately below.

## Feature audit

| Feature | Status | Evidence | Remaining Work |
| --- | --- | --- | --- |
| Landing and shared navigation | Implemented but not verified | `frontend/app/(public)/page.tsx`; `frontend/components/landing/`; `frontend/components/layout/AppHeader.tsx` | Fresh browser/responsive verification |
| Public event route classification | Implemented and verified | `frontend/lib/auth-routing.ts`; `frontend/tests/features/auth-routing.test.mjs`; Node suite passed | Confirm hosted row visibility separately |
| Approved event query/search | Implemented and verified | `frontend/lib/services/server/events.ts`; stubbed merge/service tests | Exercise real query/RLS and large datasets |
| Category/venue/time/availability filters and sort | Implemented and verified | `frontend/lib/event-discovery.ts`; `frontend/tests/features/event-discovery.test.mjs` | Browser confirmation; push pagination/filtering to database as needed |
| Event details and visibility | Implemented but not verified | `frontend/app/(protected)/events/[id]/page.tsx`; getEventById; SQL policies | Fresh public/owner/admin/history tests against target schema |
| Signup Auth call and full-name metadata | Implemented but not verified | `frontend/components/auth/SignupForm.tsx` | Fresh signup and confirmation-setting checks |
| Signup participant profile creation | Implemented but not verified | handle_new_user in registration migration; Auth trigger attachment in `supabase/tests/baseline.sql` | Verify deployed Auth trigger and function, not just SQL text |
| Login and logout | Implemented but not verified | `frontend/components/auth/LoginForm.tsx`; `frontend/components/auth/LogoutButton.tsx` | Real session flow; logout failure handling |
| Safe internal login redirects | Implemented and verified | safeReturnPath; registration/module helper tests; login page | Browser redirect confirmation |
| Session refresh/cookie/cache propagation | Implemented and verified | `frontend/lib/supabase/middleware.ts`; `frontend/tests/services/session.test.mjs` | Real refresh/expiry tests; stub coverage does not establish hosted settings |
| Protected URL recognition | Implemented and verified | `frontend/proxy.ts`; auth-routing tests | Verify proxy deployment/runtime |
| Email-confirmation UX | Partially implemented | Auth signup available; form always pushes dashboard | Confirmation result handling, callback/resend UX, hosted settings |
| Password reset / MFA UI | Not implemented | No corresponding app routes/forms found | Design and implement if required |
| Current profile read/edit | Implemented and verified | `frontend/lib/services/server/profile.ts`; profile action/schema; service tests | Hosted RLS/browser check; decide Auth metadata synchronization |
| Admin authorization helpers | Implemented and verified | getCurrentUserRole/ensureAdmin; admin service tests | Verify deployed policies/role state |
| Organizer-only creation restriction | Not implemented | createOwnedEvent and INSERT policy check auth/ownership/pending, not organizer role | Product decision; document current all-member behavior |
| Event create and server ownership | Implemented and verified | `frontend/lib/actions/events.ts`; server events service; event-submission tests | Fresh persistence/form verification |
| Event form/runtime validation | Implemented and verified | `frontend/lib/validations/event.ts`; strict extended metadata schema; helper/service tests | Database-level parity for direct API writes |
| Local-time/ISO edit preservation | Implemented and verified | `frontend/lib/event-datetime.ts`; timezone feature tests | Browser/timezone UX checks |
| Own pending event editing | Implemented and verified | getEditableEventById/updateEvent; event services/tests | Live RLS persistence; verify nullability contract |
| Own pending withdrawal | Implemented and verified | deleteEvent; event service/action tests | Fresh UI/SQL check; clarify hard-delete retention |
| Pending approval and rejection | Implemented and verified | AdminEventActions, approve/reject services and tests | Fresh admin browser/database flow |
| Admin status and deletion | Implemented and verified | `frontend/lib/actions/admin.ts`; adminSetEventStatus/adminDeleteEvent; service tests | Fresh RLS/cascade verification |
| Completed/cancelled statuses | Implemented but not verified | EventStatus; SQL CHECK; AdminEventManageActions | No scheduled completion; actual target state checks |
| Strict admin status-transition graph | Not implemented | Admin service updates target status without source-state rule | Implement graph only if product requires it |
| Event categories | Implemented and verified | event-metadata, discovery tests; metadata migration | Verify hosted CHECK/column/index application |
| Banner file and URL checks | Implemented and verified | inspectBannerFile/ownedBannerUrl; metadata and banner service tests | Browser/Storage integration; server-side content checks if required |
| Real banner upload/public delivery | Implemented but not verified | `frontend/lib/services/banners.ts`; BannerUpload/EventBanner; metadata migration | Confirm target bucket/policies, object delivery, cleanup policy |
| Banner removal/cleanup | Partially implemented | UI clears event URL; no automatic object deletion in save/delete path | Orphan cleanup and retention policy |
| Registration action/service error mapping | Implemented and verified | Registration actions/service; helper/service tests; Node suite passed | Live RPC/write/readback verification |
| Database registration eligibility | Implemented but not verified | private.register_for_event in registration migration | Run isolated SQL suite and inspect deployed functions |
| Duplicate active registration constraint | Implemented but not verified | registrations_one_active partial unique index | Verify actual deployed index and races |
| Capacity concurrency safety | Implemented but not verified | FOR UPDATE/count/insert SQL; Python concurrency tests exist | Execute isolated concurrent tests; check live grants/functions before claiming deployed guarantee |
| Capacity-reduction protection | Implemented but not verified | protect_event_capacity trigger/guard SQL | Verify trigger and actual update race behavior |
| Cancellation before start | Implemented but not verified | private.cancel_registration; UI/action/service inspected | Actual SQL/browser execution; Node stubs alone cannot prove mutation |
| Re-registration with retained history | Implemented but not verified | New INSERT after cancelled row; partial unique index | Real database history verification |
| Registration summary batching/snapshot | Implemented and verified | getRegistrationSummaries/changeRegistration; registration service tests | Verify SQL summary permissions and post-commit failure UX |
| Personal history service/paging | Implemented and verified | getMyRegistrations; service tests; MyRegistrations UI | Fresh SQL/browser history verification |
| Attendee page/service pagination | Implemented and verified | attendee page; getEventAttendees; tests for 51-row request/normalization | Fresh owner/admin/non-owner SQL/UI checks |
| Attendee SQL privacy/authorization | Implemented but not verified | private.can_manage_attendees/get_event_attendees SQL | Inspect target definitions/grants; run denial tests |
| Admin user search/role service | Implemented and verified | `frontend/lib/services/server/admin.ts`; admin service tests | Hosted profile RLS and large-list behavior |
| Role-escalation/profile-ID SQL guard | Implemented but not verified | protect_profile_role/private.guard_profile | Real policy/trigger/privilege tests |
| Last-admin invariant | Partially implemented | updateUserRole self-demotion count; tests cover service guard | Atomic DB-wide protection if required; concurrent/direct paths remain |
| Admin simple event/user totals | Implemented and verified | getAdminEventStats; tests | Query efficiency and fresh database result validation |
| Full organizer analytics/report export | Not implemented | Counts exist, no analytics/report pipeline found | Design metrics, storage, queries, export UI |
| Error boundary/loading/inline feedback | Implemented but not verified | app/loading; protected error; form/dialog state | Fresh accessibility/browser/error-path review |
| Responsive black/orange design | Implemented but not verified | globals.css; Tailwind breakpoints; components/ui | Fresh cross-device/keyboard audit; historical screenshots are not current tests |
| Direct registration write denial | Implemented but not verified | REVOKE ALL then authenticated SELECT grant; no write policies | Verify target grants and direct write denial |
| Row Level Security overall | Implemented but not verified | Baseline plus registration/metadata upgrades | Target RLS flags/policies/grants/functions inspection |
| Custom ORVIO HTTP REST API | Not implemented | No route.ts handlers; Python main empty | Old API design is a proposal; add only if needed |
| Integrated FastAPI backend | Not implemented | Empty `backend/app/main.py`; privileged client scaffold only | Remove ambiguity or implement an actual integration separately |
| Realtime count subscriptions | Not implemented | Snapshot action/navigation reads; no application subscription | Optional realtime refresh with authoritative server checks retained |
| Waitlist, QR/tickets, attendance | Not implemented | No audited application/SQL workflow | Future schema, policies, UI and tests |
| Feedback/ratings | Not implemented | Only planning schema mentions it | Implement full feature if required |
| Payments/notifications/certificates | Not implemented | No service integration/workflow found | Optional future scope |
| User deletion/suspension tools | Not implemented | Admin users tab changes roles only | Product/security design if needed |
| Production hosting/deployment | Implemented but not verified | build/start scripts; development Dockerfile; starter Vercel text | Repair build, verify host/env/Auth URLs and deployed revision |
| Fresh hosted schema bootstrap | Not implemented | Only incremental production upgrades; baseline is disposable test SQL | Approved reproducible production baseline and configuration |

## Safe verification executed today

Working directory: `frontend`. Node **22.16.0**. No database write checks were executed.

| Command/action | Status | Exact material result |
| --- | --- | --- |
| npm.cmd run test:all | Passed | 190 tests, 190 passed, 0 failed, 0 skipped, 0 cancelled, 0 todo; ~2.94 s runner duration |
| npm.cmd run lint | Passed | Exit 0, no diagnostics |
| npm.cmd exec tsc -- --noEmit --incremental false | Failed | Missing @playwright/test declarations in Playwright config/e2e support, plus related implicit-any errors |
| npm.cmd run build | Failed | Compilation succeeded in 7.2 s; Next typecheck then failed at missing @playwright/test |
| Supabase project inventory / configuration host match | Completed; target unavailable | Connected inventory did not contain configured target; no unrelated schema query made |
| Playwright | Not run | Missing installed package; some tests mutate registrations |
| Stryker | Not run | No new mutation score generated |
| PostgreSQL tests | Not run | Runner creates/truncates disposable fixtures; outside read-only audit checks |
| Live custom QA scripts | Not run | Some create/delete accounts/events, upload/delete files or edit fixtures |
| npm dependency install in application | Not run | Existing lockfile/source preserved; missing package reported without repair |

PowerShell initially rejected `npm.ps1` under its execution policy. Using `npm.cmd` allowed the checks without changing that policy. Next build created normal generated artifacts; authored project changes are documentation only.

## Historical results — not rerun

| Source | Reported prior evidence | Limit |
| --- | --- | --- |
| `docs/REGISTRATIONS.md` | 20 disposable PostgreSQL tests; capacity/duplicate races; live registration browser scenarios; earlier migrations applied | Earlier report, not current target introspection; predates later metadata upgrade |
| `docs/registration-review/` | JSON and screenshots for registration/admin/attendee views | Stored evidence, not a new browser run |
| `docs/testing/DA3-RESULTS.md` | 14 October: 7 integration + 7 regression passed; Stryker 115/117 killed, 98.29%, two survivors | Four helper modules only; does not supersede today's dependency/build failure |
| `docs/ui-review/` | Layout screenshots and review notes | Prior visual state; not fresh device/accessibility verification |

## Architectural findings and risk priorities

1. **Current architecture:** Next.js server pages/actions with Supabase, not the custom FastAPI REST architecture advertised in older planning material.
2. **Dependency/setup gap:** declared Playwright dependency is missing locally and blocks type checking/build. A reviewed clean dependency install is the first environment repair, outside this documentation task.
3. **Schema reproducibility gap:** upgrades assume pre-existing schema/policies; test baseline is not a production migration. Live target configuration remains unverified.
4. **Strong registration design with verification boundary:** event-row locks, active partial uniqueness, restricted table writes, and capacity trigger exist in SQL. Today's safe checks do not execute those protections.
5. **Permissions differ from product labels:** participant and organizer can both create pending events; ownership is the creator permission boundary.
6. **Data quality/retention gaps:** direct API writes can bypass some app validation; null capacity UI conflicts with SQL; hard deletes cascade history; banner uploads can become orphaned.
7. **Admin invariant gap:** last-admin prevention only covers application self-demotion and is not an atomic SQL invariant.
8. **Scaling limits:** full event/history loads remain despite batching, and pending/users admin reads can hit result caps. Counts are not realtime.

## Documentation validation record

All five requested Markdown artifacts were generated and validated. Validation tooling was installed in an isolated temporary tools directory, without changing the application package files or dependency tree.

| Documentation check | Result | Scope |
| --- | --- | --- |
| Markdownlint 0.41.1 | Passed | Five files, zero errors; MD013 line-length rule disabled for long prose/table rows; all other defaults retained |
| Mermaid 11.17.2 parser | Passed | 14 blocks, zero syntax failures: seven handbook diagrams and seven identical copies in the collection |
| Required content structure | Passed | 22 ordered chapters, 50 viva questions, five requested artifacts, seven required diagram types |
| Diagram consistency | Passed | All seven handbook/collection block pairs are text-identical |
| Source references | Passed | 75 distinct existing backticked source paths; the explicitly documented absence of supabase/config.toml is intentional |
| Local Markdown links | Passed | 15 relative links resolved; no broken local link found |
| Code fences and text encoding | Passed | Balanced fenced blocks and valid UTF-8 without replacement characters |
| Secret checks | Passed | No credential-like patterns or actual configured key/token/password/email values found; values compared without printing them |
| Cross-document audit claims | Reviewed | All documents distinguish today's 190 Node passes/lint pass, failed build/typecheck, historical results, and uninspected target database |
| Authored change scope | Passed | Git status shows only the new docs/project-handbook directory; no tracked application/configuration changes |

Mermaid validation establishes parser syntax, not a visual browser-rendering review. Markdown revision pages are logical sections, not a paginated PDF export. Secret scanning combines pattern checks, local-value comparison, and review; it is not a universal secret-detection guarantee. These document checks do not verify hosted application/database behavior.

## Artifact index

- [Complete handbook](ORVIO_COMPLETE_HANDBOOK.md)
- [Four-part quick revision guide](ORVIO_QUICK_REVISION.md)
- [Presentation/demo guide](ORVIO_PRESENTATION_GUIDE.md)
- [Architecture and workflow diagrams](ORVIO_ARCHITECTURE_DIAGRAMS.md)

No application source, business logic, environment file, schema, policy, grant, or hosted record was changed for this task.
