# ORVIO - Obsidian & Ember redesign

Implemented on branch `ui/obsidian-ember`. No commit, push, or deployment was performed.

## Visual transformation

The frontend now uses deep neutral surfaces, restrained ember highlights, warm ivory typography, quieter borders, and short tactile interactions. The landing page combines an asymmetric editorial headline with a lightweight CSS orbital composition. Fabricated statistics, sample events, unsupported feature claims, and the inert "Learn More" control were replaced with accurate product copy and working route links.

Event cards now prioritize the calendar date, title, venue, time, and status. Event details use a large title, clearly grouped metadata, and a dedicated registration panel. The dashboard separates pending and approved events with labeled status colors and accessible action placement. Authentication uses a branded split layout on desktop and a focused form on mobile. Admin review uses structured information and distinct affirmative/destructive actions.

## Design foundation

Tokens are centralized in `frontend/app/globals.css` and consumed through the existing Tailwind/shadcn infrastructure.

| Token | Value | Purpose |
| --- | --- | --- |
| `--background` | `#090909` | Obsidian canvas |
| `--carbon` | `#111111` | Secondary surfaces |
| `--card`, `--secondary`, `--popover` | `#1A1A1A` | Elevated surfaces |
| `--primary` | `#F97316` | Ember actions and selection |
| `--burnt` | `#C2410C` | Deep accent |
| `--ember-light` | `#FB923C` | Highlights |
| `--foreground` | `#FAF7F2` | Warm ivory text |
| `--muted-foreground` | `#A3A3A3` | Supporting text |
| `--border` | `#303030` | Graphite borders |
| `--success` | `#86EFAC` | Approved/affirmative |
| `--warning` | `#FCD34D` | Pending |
| `--destructive` | `#F87171` | Rejected/destructive |

The primary CTA uses the requested `#EA580C -> #F97316 -> #FB923C` gradient with dark labels for contrast. Surface gradients and ambient glow are reusable tokens. Shared typography, page treatments, borders, radius, shadows, focus states, and mobile spacing live in global component styles. Hover timing is 200 ms; entrance timing is 400 ms. Reduced-motion preferences disable animation and transitions. Existing Geist fonts are retained; their CSS variable mapping was corrected.

## Components redesigned

- `AppHeader`: translucent sticky surface, ORVIO wordmark, active-route indicators, visible mobile Create/Dashboard/Admin links, retained authentication and back-navigation behavior.
- Landing: `Hero`, `Features`, `CTA`, `Footer`; legacy `DashboardPreview` no longer fabricates metrics, and `Navbar` delegates to the shared header.
- Events: `EventCard`, `CreateEventForm` (also used for editing), and presentation/accessibility updates to `RegisterEventButton` and `DeleteEventButton`.
- Authentication: `AuthLayout`, `LoginForm`, `SignupForm`, and shared button styling for logout.
- Dashboard: `QuickActions` and pending/approved card groups.
- Administration: `AdminEventReviewDialog`, `AdminEventActions`, statistics and review-card presentation.
- Shared UI: buttons, inputs, textarea, labels, cards, dialogs, dropdowns, inherited avatar tokens, empty states, and a root loading skeleton.

Signup labels are associated with inputs. Event-form errors expose `aria-invalid`, associated descriptions, and alert announcements without changing validation. Dialogs retain the existing Base UI focus trap and focus restoration. The close control receives initial focus so long reviews open at the top rather than jumping to the moderation actions.

## Pages redesigned

`/`, `/login`, `/signup`, `/events`, `/events/[id]`, `/events/create`, `/events/[id]/edit`, `/dashboard`, `/admin`, `/profile`, and `/registrations`.

Existing routes, query calls, access checks, action wiring, fields, validation, and client/server component boundaries remain in place. The root layout has a keyboard skip link and ORVIO metadata. A presentation-only `loading.tsx` adds loading feedback without adding a route.

## Dependencies

No application dependencies, package manifests, or lockfiles changed. No animation library, font, or image infrastructure was added. Playwright, axe-core, and Prettier were installed in a temporary directory solely for QA and formatting; they are not part of the app bundle.

## Verification

| Check | Result |
| --- | --- |
| `npm.cmd run build` | Passed; final production route list contains only the existing routes |
| `npx.cmd tsc --noEmit` | Passed |
| `npx.cmd eslint app components` | Passed |
| `npm.cmd run lint` | One existing protected-file error: `lib/supabase/middleware.ts:5`, `prefer-const` |
| Existing automated test suite | None found in the frontend |
| Browser QA | 75 checks passed using headless Chrome through Playwright |
| Accessibility scans | No WCAG 2 A/AA axe violations in the tested pages/dialogs after entrance transitions |
| Git whitespace check | Passed |
| Protected-file hash comparison | No changes from the starting workspace |
| Business-logic AST comparison | No differences in inspected authentication, navigation, event-form, registration, withdrawal, moderation, or protected-page logic |

Browser checks covered widths 375, 430, 768, 1024, and 1440 px. Actual public landing, login, signup, and discovery routes returned HTTP 200 without horizontal overflow. Protected layout checks used temporary copies of the final page presentation with clearly identified fixture data, covering dashboard, administration, event details, creation, editing, profile, and registrations. Those fixtures and routes were removed before the final build.

Dialog checks covered viewport fit, horizontal overflow, Escape dismissal, restored trigger focus, and cancelling withdrawal. Invalid empty event forms marked all five fields and sent no action request. Logged-out creation/dashboard/admin routes still redirected to login. Reduced-motion and the keyboard skip link were verified. Captured screenshots were visually inspected.

Responsive checks caught and resolved long-venue overflow in admin review cards and intrinsic grid sizing in registrations. Raw final results are saved as `browser-results.json` and `workspace-results.json` beside this report.

## Preserved business-critical files

The entire `frontend/lib` tree, including Supabase clients/middleware, server services, registration services, server actions, and validation schemas, is unchanged from task start. The backend tree, migrations, RLS, credentials, environment configuration, and root middleware are also unchanged. Authentication/query/action logic inside edited UI files was preserved; formatting and JSX presentation changed.

The pre-existing edits to organizer names in admin presentation and `frontend/lib/services/server/events.ts` were preserved. That service file remains modified in Git solely because it was already modified before this task.

## Remaining limits

Repository-wide lint remains blocked by the existing `prefer-const` issue in protected Supabase middleware. Next.js also emits its existing middleware-to-proxy deprecation warning; the middleware convention was left unchanged to respect scope.

Live authenticated sign-in, signup, successful event submission/editing, registration, withdrawal, approval, and rejection were not exercised. No account was created and no database mutation was performed. Protected pages were visually checked with isolated fixtures, not a live authenticated account. Axe results are automated accessibility checks rather than a complete accessibility certification.

No known visual inconsistencies remain in the checked layouts.

## Screenshots

- [Desktop landing](landing-1440.png)
- [Mobile landing](landing-375.png)
- [Desktop login](login-1440.png)
