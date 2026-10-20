# ORVIO — Presentation and Demonstration Guide

Prepared from repository **955f1af** on **20 October 2026**. Use with the [handbook](ORVIO_COMPLETE_HANDBOOK.md), [diagrams](ORVIO_ARCHITECTURE_DIAGRAMS.md), and [implementation audit](ORVIO_IMPLEMENTATION_STATUS.md). All source paths are relative to the project root.

## Elevator pitch — about 30 seconds

“ORVIO helps people discover events and manage participation in one place. Members submit events, administrators review them, and participants register for available places. The database checks capacity and duplicates inside a transaction, while cancellations retain history. We use Next.js for the application and Supabase for authentication, PostgreSQL, and event banner storage. Attendance verification and payments are future scope.”

## Two-minute explanation

“Event management often involves separate messages, signup forms, and spreadsheets. That makes it difficult to keep event details and participant records consistent. ORVIO brings the core workflow into a single web application.

“A visitor can browse approved events without logging in and narrow the list using search, categories, venue, time, and availability. A signed-in member can submit an event with a future date, capacity, and optional banner. The server records it as pending. An administrator reviews the submission and approves or rejects it. Only approved events enter the discovery collection.

“For participation, the user logs in and chooses Register. The database checks approval, start time, duplicate active membership, and remaining places. The capacity check and insertion happen while holding a lock on the event row, which is designed to stop supported requests from overbooking the last seat. A member can cancel before the start, releasing the place while keeping the cancelled record. Registering again creates a new record. Creators and administrators can view attendee history.

“Next.js supplies server-rendered pages, interactive React components, and server actions. Supabase supplies Auth, PostgreSQL, and Storage. Security combines verified identity, server ownership and role checks, database policies, and restricted registration functions. The current application has limitations: no attendance verification, payments, notifications, or waitlist. Our audit passed 190 Node tests and lint; it also found a missing local Playwright dependency that blocks type checking and the production build. Hosted database behavior was not freshly verified.”

Delivery tip: speak the product story first, then the transaction/security detail. If time is short, keep the final test statement to one sentence while preserving the distinction between safe tests and live verification.

## Five-minute explanation and slide plan

### 0:00–0:45 — Problem and solution

Show an approved event collection.

“Our problem is fragmented event coordination. ORVIO keeps discovery, submissions, approval, and participant records together. Visitors find events, members participate and submit, and admins moderate the platform.”

State the implemented roles accurately: participant, organizer, admin. Add: “Creation currently depends on authentication, not an organizer-only role gate.”

### 0:45–1:30 — Event lifecycle

Show the submission form and approval diagram.

“The form validates details and converts local time into a stored instant. The server validates again and chooses the creator and pending status itself. The database also requires an own pending insert. An admin reviews the submission and updates the status. Owners can edit or delete pending submissions; they cannot publish themselves.”

If asked about lifecycle completeness: “Completed and cancelled are supported admin-set statuses. There is no automatic completion scheduler or strict irreversible state machine.”

### 1:30–2:20 — Architecture

Show the high-level diagram from the diagrams file.

“The frontend directory includes server functionality. Server pages read data; server actions handle changes; React client components provide interactions. These communicate with Supabase using the current user's session. The browser talks directly to Supabase Auth and banner Storage, and the header reads its own role. The Python folder is scaffolding, not an integrated FastAPI API.”

Point to each arrow instead of listing technology names without a purpose. Explain that a server action is an entry point, a service is application logic/data access, and an RPC executes SQL in the database.

### 2:20–3:10 — Database and identity

Show the ER diagram.

“Supabase Auth stores identities and credentials. Profiles share the Auth UUID and hold display names and app roles. An event belongs to its creator profile. Registrations link profiles to events. Foreign keys protect those relationships. Cancelled history is kept as separate registration records.”

Clarify provenance if presenting the audit: “This diagram reflects the repository's test baseline plus upgrades; the configured hosted database was not available through the current connector.”

### 3:10–4:10 — Registration and security

Show the registration sequence diagram.

“The browser never chooses another participant's identity. The database uses auth.uid(). It locks the event, checks the current active count, and inserts only if a place remains. The partial unique index prevents duplicate active membership. Cancellation uses the same event lock and marks the old row cancelled. Direct registration writes are denied even for normal authenticated admins.”

Then explain RLS: “A hidden button is only presentation. Database policies decide which rows a caller can access even through direct API requests. Narrow definer functions have extra privilege, so they perform explicit checks themselves.”

### 4:10–5:00 — Evidence, limitations, and next work

“The audit ran the safe Node suite: 190 passed, with zero failures or skips. Lint passed. Type checking and build failed because the local install lacks the declared Playwright package. Browser and PostgreSQL suites exist but were not rerun, and historical results are labeled separately. Next priorities are reproducible setup, complete live verification, consistent validation and retention, and then optional features such as attendance or notifications.”

Do not state a production deployment is complete; the repository supplies build/start scripts and a development Dockerfile, while Vercel appears only as a suggested host.

## Suggested live demo walkthrough

This is a rehearsal plan, not a completed audit run. Use a dedicated compatible project and fixtures. Do not edit production policies or run fixture-deleting scripts during the presentation.

### Prepare the concrete demo

- Restore the declared dependency set and obtain a successful build before using `npm.cmd run start`.
- Confirm which Supabase project is configured and verify required migrations, Auth trigger, Storage bucket, and policies through authorized inspection.
- Use a member and an admin in separate browser profiles. The member can also be the creator; an organizer role is not necessary for submission.
- Prepare a future approved event with a small positive capacity and a separate pending submission. A completed/past event cannot demonstrate successful registration.
- Keep event titles, accounts, and screenshots free of actual passwords/tokens. Test credentials belong in ignored local configuration.
- Have the diagrams and prior screenshots ready as clearly labeled fallback evidence if hosted services are unavailable.

### Show the workflow

| Step | Visible demonstration | What to say | Internal change |
| --- | --- | --- | --- |
| 1 | Guest opens `/events` and filters | “Browsing approved events is public.” | SELECT approved events; summaries; in-memory filters |
| 2 | Guest opens future event | “Registration needs a verified session.” | UI shows login return link |
| 3 | Member logs in | “Auth identifies the member; it does not grant admin.” | Session cookies; getUser checks |
| 4 | Member submits event | “Server supplies creator and pending status.” | INSERT event |
| 5 | Member opens dashboard | “The submission awaits review.” | Own events/profile/history reads |
| 6 | Admin reviews and approves | “Role check and RLS authorize moderation.” | Status UPDATE |
| 7 | Member registers | “The seat decision happens inside PostgreSQL.” | Lock/check/INSERT registration |
| 8 | Show personal history | “Registration records belong to this member.” | Own-history RPC |
| 9 | Open cancellation, then dismiss | “Dismissal does not change the database.” | No mutation |
| 10 | Confirm cancellation | “Cancelled history remains, and the seat is released.” | UPDATE status/cancelled_at |
| 11 | Register again | “A new active row is created.” | New INSERT; old cancelled row retained |
| 12 | Creator/admin opens attendees | “Owner/admin authorization is checked again in SQL.” | Read names/status/timestamps, 50-row pages |

Avoid deleting an event to “clean up” during the demo without explaining that baseline cascades erase its registrations. Do not attempt a capacity race manually as proof unless you have an intentional isolated test and actual recorded results.

### If the demo encounters an error

| Symptom | Accurate response |
| --- | --- |
| Login rejected | “We need to check the account/project credentials; registration has not been reached.” |
| Signup redirects to login | “This may be a confirmation-required project; the current form does not fully guide that flow.” |
| Registration says full or started | “The server/database rechecks current eligibility even if the page snapshot is older.” |
| Connection interrupted after registration | “The write may already have committed; refresh to see authoritative state.” |
| Cannot open attendees | “The route intentionally hides inaccessible records, and SQL also rejects non-managers.” |
| Build fails at Playwright types | “This audit found an incomplete local dependency install; that is separate from the passing Node logic suite.” |
| Supabase is unavailable | “I can explain the repository implementation and show labeled historical evidence, but cannot claim a fresh successful live run.” |

## Common evaluator questions and suggested answers

| Question | Suggested concise answer |
| --- | --- |
| Why did you choose Next.js? | Its pages, server actions, and React support fit this application without a separate custom CRUD server. That rationale follows the implementation; there is no formal decision record. |
| Is there a separate backend? | The current server logic is inside Next.js and Supabase. FastAPI dependencies are present, but the main Python file is empty and no integrated endpoints were found. |
| Where are passwords stored? | Supabase Auth manages credentials; ORVIO's public profiles table does not store passwords. |
| Where are roles stored? | profiles.role, with participant, organizer, and admin values in the repository model. |
| Can anyone become an admin at signup? | No. The expected trigger always inserts participant, ignoring metadata role claims. |
| Why have organizer if participants can create? | The role label exists, but current creation rules do not distinguish it from participants. That is an implementation/product-policy gap. |
| How do you prevent self-publication? | The server chooses pending, and the database INSERT/owner UPDATE policies require own pending records. |
| How do you prevent duplicates? | An explicit RPC check plus a partial unique active event/user index. |
| How do you prevent overbooking? | Supported writes lock the event and check active capacity in the transaction; direct authenticated table writes are revoked. |
| What happens in the last-seat race? | One request holds the event lock. After it commits, the next sees the occupied seat under the intended default isolation and fails if full. This was not freshly tested today. |
| Why RLS if server checks exist? | Direct database API requests can bypass the UI/action path; policies preserve row restrictions. |
| What is a definer function? | SQL running with its owner's privileges; our private registration functions must check caller identity and eligibility internally. |
| Can an admin edit/delete registrations? | Not directly through the ordinary authenticated role. Admin deletion of an event can still cascade its registrations. |
| Does cancellation delete the row? | No; it records cancelled status/time. Re-registration creates another row. |
| Does history survive all deletion? | No. Event/profile deletion cascades in the baseline; retention is not permanent auditing. |
| Do event counts update live? | They refresh after actions/navigation; there is no realtime subscription to other users' changes. |
| What tests passed? | Today's 190 Node tests and lint. Typecheck/build failed on missing local Playwright dependency; browser/SQL/mutation suites were not rerun. |
| What does the historical 98.29% score mean? | A prior Stryker run detected 115 of 117 mutations in four selected helper modules, not 98.29% whole-app correctness or coverage. |
| Was the hosted database inspected? | The connector was available but did not expose the configured project, so no target schema/policies were freshly inspected. |
| What would you improve first? | Reproducible production schema/setup, current live verification, consistent validation/retention and admin invariants; then optional product features. |

## Short scripts for difficult concepts

**Primary/foreign keys:** “A primary key uniquely identifies an event. A foreign key on registrations says the referenced event must exist. This prevents disconnected participant records, though our cascade rules also mean parent deletion removes history.”

**RLS versus grants:** “A grant allows a kind of operation; a policy limits which rows. Registration writes have no direct authenticated grant, so users must go through a narrow checked function.”

**Authentication versus authorization:** “A valid session proves which account is calling. The role or ownership check decides what that account may do.”

**Static versus runtime checks:** “TypeScript helps us write compatible code. Zod checks incoming values. SQL constraints and policies still protect the database when callers bypass the form.”

**Evidence versus intention:** “We describe implemented source, supplied SQL, checks run today, and prior reports separately. An old requirements document or a successful stubbed test cannot prove a deployed feature.”

## Claims to avoid

- Do not call the proposed 20 REST endpoints implemented.
- Do not claim payments, notifications, QR attendance, feedback, or full analytics exist.
- Do not call the lifecycle a strictly enforced state machine.
- Do not claim the local production build passed or the configured hosted database was inspected today.
- Do not claim all schema nullability, grants, Auth settings, or production deployment details are known.
- Do not call installed Framer Motion/Sonner packages active app integrations.

The strongest presentation is precise about both the working design and its verification limits.
