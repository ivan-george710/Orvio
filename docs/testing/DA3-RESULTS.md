# DA 3 testing progress

## Final expanded run on 14 October 2026

The final combined Playwright run passed **7 integration and 7 regression tests**
with zero failures, retries, or skips. It ran in approximately 1.2 minutes against
the local application and configured Supabase project. Source baseline is
`0d1d015` with uncommitted test/configuration changes.

| Cases | Verified behavior |
| --- | --- |
| IT-01–IT-03 | Guest protection, authenticated history, registration persistence and cancellation history |
| IT-04 | Database-backed search and navigation to the approved fixture |
| IT-05 | Missing-event not-found handling |
| IT-06–IT-07 | Non-owner attendee and event-editor access denied |
| RG-01–RG-04 | Discovery navigation, labeled forms, password mismatch rejection and mobile layout |
| RG-05 | Authenticated profile and correct email |
| RG-06 | Dismissing cancellation retains registration after navigation |
| RG-07 | External login return destination falls back to dashboard |

The selected fixture is the approved future event **HackNight**. Its exact title
is configured locally. Only registrations created by the test account are
cancelled for cleanup; events/users are not deleted and cancelled history remains.

StrykerJS 9.3.0 executed mutation testing across four application modules using
eighteen passing Node tests. Its command-runner "All tests" aggregate represents
one command invoking those eighteen tests.

| Module | Generated | Killed | Survived | Mutation score |
| --- | ---: | ---: | ---: | ---: |
| lib/registrations.ts | 70 | 68 | 2 | 97.14% |
| lib/utils.ts | 17 | 17 | 0 | 100.00% |
| lib/validations/event.ts | 23 | 23 | 0 | 100.00% |
| lib/supabase/errors.ts | 7 | 7 | 0 | 100.00% |
| **All four modules** | **117** | **115** | **2** | **98.29%** |

No mutation timeouts or runtime/compile errors occurred. Two overlapping
return-path guard mutants survived and remain included in the score. This does
not establish whole-application or SQL mutation coverage, nor exhaustive admin,
event-creation, capacity-concurrency or security verification.

Native Playwright report: **http://127.0.0.1:9323/**. Search `IT-` or `RG-` to
view each seven-case suite, or clear the search for all fourteen. Open a case
for steps and screenshot attachments. Source: `frontend/reports/playwright/all`.

Native Stryker report: **http://127.0.0.1:9324/**. Its summary lists all four
modules; click a file to inspect mutants. Source: `frontend/reports/mutation`.

Screenshots are saved under `output/assignment3/testing`: `playwright-all-summary.png`,
`integration-summary.png`, `regression-summary.png`, and `mutation-summary.png`.
No custom results page was created.

The sections below retain earlier progress and failures as historical records;
they do not describe the final expanded run.

## Executed mutation testing

StrykerJS 9.3.0 was run against `frontend/lib/registrations.ts` using the Node
helper tests. The command runner executes the helper test process for each
mutant; it does not measure browser or SQL behavior.

| Run | Generated | Killed | Survived | Timed out | Mutation score |
| --- | ---: | ---: | ---: | ---: | ---: |
| Initial helper suite | 70 | 57 | 13 | 0 | 81.43% |
| Additional error and input-type assertions | 70 | 68 | 2 | 0 | 97.14% |

The two remaining survivors change overlapping return-path guards. The decoded
path validation and initial path validation provide redundant checks. They have
not been excluded from the score, and the report does not claim 100% detection.

All five helper tests passed. TypeScript compilation completed successfully.
Playwright discovery found three integration and six regression browser cases.
Discovery is configuration validation, not browser test execution.

## Executed browser checks

With the frontend Supabase values configured, the guest/public checks ran:

| Suite | Passed | Failed in latest run | Skipped |
| --- | ---: | ---: | ---: |
| Integration after credential configuration | 1 | 2 | 0 |
| Regression | 4 | 0 | 2 |

IT-01 passed the protected-route redirect check. RG-01 through RG-04 passed
landing navigation, labeled account forms, local mismatched-password rejection,
and the mobile login layout check. The initial RG-03 run had an ambiguous test
locator matching the form error and Next.js route announcer. Scoping that locator
to the form corrected the test; the rerun passed. The initial report was retained
under `frontend/reports/playwright/regression-initial`.

## Previously pending authenticated checks

IT-02 and IT-03 were retried after credentials were configured, but both failed
at login with `Invalid login credentials`. A direct sign-in using the saved
values received `invalid_credentials` as well. The local environment file has
no duplicate test definitions, unquoted password hash, or surrounding whitespace.
Registration was not reached or created in those cases.

This was resolved by comparing the successful browser Profile email with the
local test configuration. The saved email differed; the password was correct.
The exact configured fixture title was also aligned before registration testing.
The final expanded run above successfully executed all authenticated cases.

## Local reports

- Latest mutation report: `frontend/reports/mutation/index.html`
- Initial mutation report: `frontend/reports/mutation/baseline/index.html`
- Machine-readable counts: corresponding `results.json` files
- Playwright results after execution: `frontend/reports/playwright/integration`
  and `frontend/reports/playwright/regression`

Generated reports are ignored by Git. Keep them as assignment evidence and
update the project report only after the actual browser runs are complete.
