# Application completion after the DA3 test baseline

The initial testing setup was committed as `21f6edd`. These application changes
follow that baseline and complete the profile-editing, banner-upload and
category-filtering user stories.

## Profile editing

The profile page accepts a display name of 2–100 characters. Client and server
validation trim the value and reject embedded control characters. The server
derives the target profile ID from verified authentication; the form cannot
submit another ID, email or role.

Public profiles are the authoritative name source for Profile and Dashboard.
Saved names therefore appear after refresh and navigation without depending on
stale signup metadata. Discard changes resets the form without a write.

## Event categories and banners

Categories are Technology, Workshop, Cultural, Sports, Community and Other.
Existing events default to Other. The user applied the migration
`20261014122006_add_event_categories_and_banners.sql` to the Orvio database.

The dedicated event-banners bucket serves public event images. Upload and file
management policies restrict authenticated users to their own account folders.
The application accepts JPEG, PNG and WebP files up to 5 MB, checks the header
against the declared image type, and uses generated filenames without overwriting
existing objects. Server event submissions accept only this project's banner
URLs belonging to the verified creator.

Event cards, detail pages and the editor display saved banners and category
labels. Removing a banner changes the event reference; existing stored images
are not automatically deleted because another event may still reference them.

## Event submission and time handling

Event creation now uses a server action rather than a direct browser insert.
Both creation and editing validate event fields on the server. Ownership comes
from authentication and a new event starts pending. Error responses preserve
safe validation explanations while hiding unexpected exceptions.

Local date inputs convert to explicit UTC instants before storage. The editor
converts stored instants back to local clock values. Unchanged dates retain the
original instant, including seconds and repeated daylight-saving times.

## Discovery controls

Discovery combines text search with category, date, availability and venue
filters. Results may be sorted by date, title or available places. Invalid query
options default safely, unknown dates sort last, and filters retain an internal
URL so results can be revisited. Clearing filters preserves text search.

These controls filter the complete approved result collection fetched by the
existing paginated service. They do not relax event visibility or authorization.

## Session and route handling

The Next.js 16 entry point is now proxy.ts. Refreshed Supabase cookies are sent
to both downstream server rendering and the browser, together with the SDK's
anti-cache headers. Authentication redirects retain refreshed cookies and cache
headers rather than returning a new response that loses them.

Account pages, administrative pages, event editing and attendee management
require authentication. Public event discovery/details stay public. Private
redirects preserve the internal destination and query string; role/ownership
checks still execute in the relevant server services and database policies.

## Verification commands

From frontend:

```powershell
npm.cmd run test:all
npm.cmd run test:browser
npm.cmd run build
node scripts/check-profile-feature.mjs
node scripts/check-event-features.mjs
```

The isolated tests use explicit dependency stubs and cannot instantiate the
real Supabase client. Browser feature checks use only the dedicated account.
The profile check restores the original name; the event check removes only its
uniquely named disposable pending event and uploaded image.

Existing DA3 mutation results target registrations.ts, utils.ts,
validations/event.ts and supabase/errors.ts. Those four targets and their
eighteen-test command remain unchanged. The added application modules receive
separate helper/service/browser checks and are not included in that mutation score.

Generated screenshots remain under output/assignment3/application-checks.
Credentials, generated reports and local assignment exports remain ignored.

## Recorded verification for these changes

On 14 October 2026, all 190 isolated tests passed without skips. The browser
rerun passed all seven integration and seven regression cases. The production
build and TypeScript checks passed. The dedicated profile and event feature
checks also passed, restoring the profile and removing their disposable data.

These results cover the application changes described above. They do not claim
that every possible workflow or database policy has been exhaustively tested.
