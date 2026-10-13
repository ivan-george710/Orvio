import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

// Opt-in integration test: temporary confirmed accounts, no emails; cleans only its own fixtures.
if (process.env.ORVIO_RUN_LIVE_TESTS !== "1")
  throw new Error(
    "Set ORVIO_RUN_LIVE_TESTS=1 to authorize temporary live test fixtures.",
  );
const qaRequire = createRequire(
  path.join(process.env.ORVIO_QA_MODULES, "package.json"),
);
const { chromium } = qaRequire("playwright");
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
function envFile(file) {
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((line) => /^[A-Z_]+=/.test(line))
      .map((line) => {
        const i = line.indexOf("=");
        return [
          line.slice(0, i),
          line
            .slice(i + 1)
            .trim()
            .replace(/^['"]|['"]$/g, ""),
        ];
      }),
  );
}
const backend = envFile(path.join(root, "backend/.env"));
const frontend = envFile(path.join(root, "frontend/.env.local"));
const url = frontend.NEXT_PUBLIC_SUPABASE_URL;
if (!url.includes("tpvnwjqvautcysfsjstu"))
  throw new Error("Unexpected project: review fixture target.");
const service = createClient(url, backend.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const base = process.env.ORVIO_TEST_BASE_URL || "http://localhost:3010";
const output = path.join(root, "docs/registration-review");
fs.mkdirSync(output, { recursive: true });
const tag = `Orvio QA ${Date.now()}`;
const password = crypto.randomBytes(24).toString("base64url") + "aA1!";
const users = [],
  events = [],
  results = [],
  errors = [];
let browser;
const pages = [];
function checked(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
async function account(label, role = "participant") {
  const email = `orvio-qa-${crypto.randomUUID()}@example.invalid`;
  const { user } = checked(
    await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `${tag} ${label}`, role: "admin" },
    }),
  );
  users.push(user.id);
  const profile = checked(
    await service.from("profiles").select("role").eq("id", user.id).single(),
  );
  assert.equal(
    profile.role,
    "participant",
    "signup trigger must ignore untrusted role metadata",
  );
  if (role !== "participant")
    checked(await service.from("profiles").update({ role }).eq("id", user.id));
  const client = createClient(url, frontend.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  checked(await client.auth.signInWithPassword({ email, password }));
  return { id: user.id, email, client, label: `${tag} ${label}` };
}
async function login(page, account, returnTo = "/dashboard") {
  await page.goto(`${base}/login?redirectTo=${encodeURIComponent(returnTo)}`);
  await page.getByLabel("Email", { exact: true }).fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await page.waitForURL(`${base}${returnTo}`, { timeout: 30000 });
}
async function fixture(owner, changes = {}) {
  const event = checked(
    await service
      .from("events")
      .insert({
        created_by: owner.id,
        title: `${tag} fixture`,
        description: "A temporary isolated registration test.",
        venue: "QA Venue",
        event_datetime: new Date(Date.now() + 86400000 * 7).toISOString(),
        max_participants: 1,
        status: "approved",
        ...changes,
      })
      .select("id")
      .single(),
  );
  events.push(event.id);
  return event.id;
}
async function ready(page, text) {
  await page
    .getByText(text, { exact: true })
    .first()
    .waitFor({ state: "visible", timeout: 30000 });
}
async function screenshot(page, name) {
  await page.locator('[aria-busy="true"]').first().waitFor({ state: "hidden" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: path.join(output, name + ".png"),
    fullPage: true,
  });
}
try {
  const owner = await account("Organizer", "organizer"),
    participant = await account("Attendee"),
    outsider = await account("Other"),
    admin = await account("Admin", "admin");
  browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const newPage = async () => {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1050 },
    });
    const page = await context.newPage();
    page.on("pageerror", (err) => errors.push(err.message));
    pages.push(page);
    return page;
  };
  const organizer = await newPage(),
    attendee = await newPage(),
    administrator = await newPage(),
    guest = await newPage();
  await login(organizer, owner);
  await organizer.goto(`${base}/events/create`);
  await organizer
    .getByLabel("Title", { exact: true })
    .fill(`${tag} Experience`);
  await organizer
    .getByLabel("Description", { exact: true })
    .fill(
      "An event created through the real ORVIO application during automated testing.",
    );
  await organizer.getByLabel("Venue", { exact: true }).fill("QA Studio");
  await organizer
    .getByLabel("Date and Time", { exact: true })
    .fill("2030-10-12T18:00");
  await organizer.getByLabel("Maximum Participants", { exact: true }).fill("1");
  await organizer
    .getByRole("button", { name: "Submit Event", exact: true })
    .click();
  await organizer.waitForURL(`${base}/dashboard`);
  const event = checked(
    await service
      .from("events")
      .select("id,status")
      .eq("created_by", owner.id)
      .eq("title", `${tag} Experience`)
      .single(),
  );
  events.push(event.id);
  assert.equal(event.status, "pending");
  await organizer.goto(`${base}/events/${event.id}/edit`);
  await organizer
    .getByLabel("Venue", { exact: true })
    .fill("QA Studio Updated");
  await organizer
    .getByRole("button", { name: "Update Event", exact: true })
    .click();
  await organizer.waitForURL(`${base}/dashboard`);
  assert.equal(
    checked(
      await service.from("events").select("venue").eq("id", event.id).single(),
    ).venue,
    "QA Studio Updated",
  );
  results.push(
    "Event creation and pending-event editing through browser: passed",
  );
  await login(administrator, admin, "/admin");
  await administrator
    .locator("article")
    .filter({
      has: administrator.getByRole("heading", {
        name: `${tag} Experience`,
        exact: true,
      }),
    })
    .filter({
      has: administrator.getByRole("button", { name: "Review", exact: true }),
    })
    .getByRole("button", { name: "Review", exact: true })
    .click();
  await administrator
    .getByRole("button", { name: "Approve", exact: true })
    .click();
  await administrator.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(
    checked(
      await service.from("events").select("status").eq("id", event.id).single(),
    ).status,
    "approved",
  );
  results.push("Admin approval through browser: passed");
  await guest.goto(`${base}/events/${event.id}`);
  await guest
    .getByRole("link", { name: "Login to Register", exact: true })
    .click();
  assert.ok(guest.url().includes("redirectTo="));
  await login(attendee, participant, `/events/${event.id}`);
  await attendee
    .getByRole("button", { name: "Register for Event", exact: true })
    .click();
  await ready(attendee, "You're Registered");
  await ready(attendee, "1 / 1 registered");
  await screenshot(attendee, "registered-desktop");
  await attendee.reload();
  await ready(attendee, "You're Registered");
  results.push(
    "Login return, register, confirmation, capacity and persisted registered state: passed",
  );
  const duplicate = await participant.client.rpc("register_for_event", {
    p_event_id: event.id,
  });
  assert.equal(duplicate.error?.message, "ALREADY_REGISTERED");
  const direct = await participant.client
    .from("registrations")
    .insert({ event_id: event.id, user_id: outsider.id });
  assert.ok(direct.error);
  const escalation = await participant.client
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", participant.id);
  assert.ok(escalation.error);
  assert.deepEqual(
    checked(
      await outsider.client
        .from("registrations")
        .select("id")
        .eq("event_id", event.id),
    ),
    [],
  );
  const forbidden = await outsider.client.rpc("get_event_attendees", {
    p_event_id: event.id,
  });
  assert.equal(forbidden.error?.message, "ATTENDEES_FORBIDDEN");
  results.push(
    "Live RPC duplicate, direct-insert, role-escalation and private-attendee protections: passed",
  );
  await guest.goto(`${base}/events/${event.id}`);
  await guest
    .getByRole("button", { name: "Event Full", exact: true })
    .waitFor();
  await attendee.goto(`${base}/registrations`);
  await ready(attendee, "You're Registered");
  await attendee.goto(`${base}/dashboard`);
  await attendee
    .getByRole("heading", { name: "My Registrations", exact: true })
    .waitFor();
  await ready(attendee, "You're Registered");
  await organizer.goto(`${base}/events/${event.id}/attendees`);
  await organizer
    .getByRole("cell", { name: participant.label, exact: true })
    .waitFor();
  await screenshot(organizer, "organizer-attendees");
  await administrator.goto(`${base}/admin`);
  await administrator
    .getByRole("heading", { name: "Registration management", exact: true })
    .waitFor();
  await screenshot(administrator, "admin-registration-management");
  await administrator.goto(`${base}/events/${event.id}/attendees`);
  await administrator
    .getByRole("cell", { name: participant.label, exact: true })
    .waitFor();
  const unauthorized = await newPage();
  await login(unauthorized, outsider, `/events/${event.id}/attendees`);
  await unauthorized
    .getByRole("heading", { name: "404", exact: true })
    .waitFor({ timeout: 30000 });
  results.push(
    "Dashboard history, owner/admin attendees, unrelated user denied: passed",
  );
  await attendee.goto(`${base}/events/${event.id}`);
  await attendee.setViewportSize({ width: 390, height: 844 });
  await attendee
    .getByRole("button", { name: "Cancel Registration", exact: true })
    .click();
  await attendee.getByRole("dialog").waitFor();
  assert.equal(
    await attendee.evaluate(
      () => !!document.activeElement?.closest('[role="dialog"]'),
    ),
    true,
  );
  await screenshot(attendee, "cancel-dialog-mobile");
  await attendee.keyboard.press("Escape");
  await attendee.getByRole("dialog").waitFor({ state: "hidden" });
  await attendee
    .getByRole("button", { name: "Cancel Registration", exact: true })
    .click();
  await attendee
    .getByRole("button", { name: "Confirm cancellation", exact: true })
    .click();
  await ready(attendee, "Registration cancelled. Your spot has been released.");
  await ready(attendee, "0 / 1 registered");
  await attendee
    .getByRole("button", { name: "Register for Event", exact: true })
    .click();
  await ready(attendee, "You're Registered");
  const history = checked(
    await service
      .from("registrations")
      .select("status,cancelled_at")
      .eq("event_id", event.id)
      .eq("user_id", participant.id),
  );
  assert.equal(history.length, 2);
  assert.equal(history.filter((r) => r.status === "registered").length, 1);
  assert.ok(history.find((r) => r.status === "cancelled").cancelled_at);
  await screenshot(attendee, "registered-mobile");
  assert.equal(
    await attendee.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  results.push(
    "Accessible cancellation dialog, capacity release, re-registration and preserved history: passed",
  );
  const race = await fixture(owner);
  const raceResults = await Promise.all(
    [participant, outsider, owner].map((user) =>
      user.client.rpc("register_for_event", { p_event_id: race }),
    ),
  );
  assert.equal(raceResults.filter((r) => !r.error).length, 1);
  assert.equal(
    raceResults.filter((r) => r.error?.message === "EVENT_FULL").length,
    2,
  );
  results.push(
    "Connected database: three concurrent users, one slot, exactly one success: passed",
  );
  const rejected = await fixture(owner, {
    title: `${tag} Rejection`,
    status: "pending",
  });
  await administrator.goto(`${base}/admin`);
  await administrator
    .locator("article")
    .filter({
      has: administrator.getByRole("heading", {
        name: `${tag} Rejection`,
        exact: true,
      }),
    })
    .filter({
      has: administrator.getByRole("button", { name: "Review", exact: true }),
    })
    .getByRole("button", { name: "Review", exact: true })
    .click();
  await administrator
    .getByRole("button", { name: "Reject", exact: true })
    .click();
  await administrator.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(
    checked(
      await service.from("events").select("status").eq("id", rejected).single(),
    ).status,
    "rejected",
  );
  results.push("Admin rejection through browser: passed");
  const past = await fixture(owner, { event_datetime: "2020-01-01T00:00:00Z" });
  await guest.goto(`${base}/events/${past}`);
  await guest
    .getByRole("button", { name: "Registration Closed", exact: true })
    .waitFor();
  await organizer.setViewportSize({ width: 390, height: 844 });
  await organizer.goto(`${base}/events/${event.id}/attendees`);
  await screenshot(organizer, "attendees-mobile");
  assert.equal(
    await organizer.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  // Exercise public signup only when the project confirms accounts automatically.
  const authSettings = await (
    await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: frontend.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    })
  ).json();
  if (!authSettings.mailer_autoconfirm)
    throw new Error(
      "Signup smoke test requires email auto-confirm to avoid sending test emails.",
    );
  const signup = await newPage();
  await signup.goto(`${base}/signup`);
  const signupEmail = `orvio-qa-${crypto.randomUUID()}@example.invalid`;
  await signup.getByLabel("Full Name", { exact: true }).fill(`${tag} Signup`);
  await signup.getByLabel("Email", { exact: true }).fill(signupEmail);
  await signup.getByLabel("Password", { exact: true }).fill(password);
  await signup.getByLabel("Confirm Password", { exact: true }).fill(password);
  const signupResponse = signup.waitForResponse(
    (response) =>
      response.url().startsWith(`${url}/auth/v1/signup`) &&
      response.request().method() === "POST",
  );
  await signup
    .getByRole("button", { name: "Create Account", exact: true })
    .click();
  const signupData = await (await signupResponse).json();
  const signupId = signupData.user?.id || signupData.id;
  if (signupId) users.push(signupId);
  assert.ok(signupId, "Public signup must create an auth account");
  await signup.waitForURL(`${base}/dashboard`);
  assert.equal(
    checked(
      await service.from("profiles").select("role").eq("id", signupId).single(),
    ).role,
    "participant",
  );
  results.push(
    "Public signup through browser, automatic profile creation and login: passed",
  );
  // More than one page of history must remain accessible without leaking emails/IDs.
  checked(
    await service.from("registrations").insert(
      Array.from({ length: 51 }, () => ({
        event_id: event.id,
        user_id: participant.id,
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })),
    ),
  );
  await organizer.goto(`${base}/events/${event.id}/attendees`);
  await organizer.getByRole("link", { name: "Next", exact: true }).click();
  await organizer.getByText("Page 2", { exact: true }).waitFor();
  assert.equal(await organizer.getByRole("row").count(), 4);
  results.push("Attendee pagination across 53 history records: passed");
  // Repeat mutations to check that committed counts and CTAs never need a reload.
  await attendee.goto(`${base}/events/${event.id}`);
  for (let cycle = 0; cycle < 3; cycle++) {
    await attendee
      .getByRole("button", { name: "Cancel Registration", exact: true })
      .click();
    await attendee
      .getByRole("button", { name: "Confirm cancellation", exact: true })
      .click();
    await ready(attendee, "0 / 1 registered");
    await attendee
      .getByRole("button", { name: "Register for Event", exact: true })
      .click();
    await ready(attendee, "1 / 1 registered");
    await ready(attendee, "You're Registered");
  }
  results.push(
    "Three repeated cancellation/re-registration cycles without page reload: passed",
  );
  assert.deepEqual(errors, []);
  results.push("Desktop/mobile overflow and browser runtime errors: passed");
  console.log(JSON.stringify({ passed: results }, null, 2));
} catch (err) {
  console.error(err.message);
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    fs.writeFileSync(
      path.join(output, `failure-${i}.txt`),
      await page.locator("body").innerText(),
    );
  }
  const registrationState = checked(
    await service
      .from("registrations")
      .select("status,cancelled_at,event_id")
      .in("event_id", events),
  );
  console.log(JSON.stringify({ fixtureRegistrationState: registrationState }));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  // Delete only exact IDs created by this run, never existing accounts/events.
  for (const id of events)
    checked(await service.from("events").delete().eq("id", id));
  for (const id of users) checked(await service.auth.admin.deleteUser(id));
  fs.writeFileSync(
    path.join(output, "browser-results.json"),
    JSON.stringify(
      {
        runAt: new Date().toISOString(),
        results,
        browserErrors: errors,
        fixturesCleaned: true,
        completed: !process.exitCode,
      },
      null,
      2,
    ),
  );
  console.log("Temporary test fixtures removed.");
}
