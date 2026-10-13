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
  const owner = await account('Organizer', 'organizer');
  const participant = await account('Attendee');
  checked(await service.from('profiles').update({full_name:'Alex Morgan'}).eq('id',owner.id));
  checked(await service.from('profiles').update({full_name:'Sam Taylor'}).eq('id',participant.id));
  const id = await fixture(owner, {title:'An Evening of New Ideas',venue:'The Foundry, Studio 04',description:'A welcoming evening of conversation, creative experiments and new perspectives. Meet people who share your curiosity, exchange ideas and leave inspired.',max_participants:24});
  browser = await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const participantContext = await browser.newContext({viewport:{width:1440,height:1050}});
  const attendee = await participantContext.newPage(); pages.push(attendee);
  await login(attendee,participant,`/events/${id}`);
  await attendee.getByRole('button',{name:'Register for Event',exact:true}).click();
  await ready(attendee,"You're Registered"); await ready(attendee,'1 / 24 registered');
  await screenshot(attendee,'registered-desktop');
  await attendee.setViewportSize({width:390,height:844}); await screenshot(attendee,'registered-mobile');
  await attendee.getByRole('button',{name:'Cancel Registration',exact:true}).click(); await screenshot(attendee,'cancel-dialog-mobile');
  await attendee.getByRole('button',{name:'Confirm cancellation',exact:true}).click(); await ready(attendee,'0 / 24 registered');
  await attendee.getByRole('button',{name:'Register for Event',exact:true}).click(); await ready(attendee,'1 / 24 registered');
  const ownerContext = await browser.newContext({viewport:{width:1440,height:1050}});
  const organizer=await ownerContext.newPage(); pages.push(organizer);
  await login(organizer,owner,`/events/${id}/attendees`);
  await organizer.getByRole('heading',{name:'Attendees & registration history',exact:true}).waitFor();
  await screenshot(organizer,'organizer-attendees');
  await organizer.setViewportSize({width:390,height:844}); await screenshot(organizer,'attendees-mobile');
  assert.equal(await organizer.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  results.push('Final visual verification: desktop, mobile, cancellation dialog, capacity refresh and attendee layout passed.');
  console.log(results[0]);
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
    path.join(output, "visual-results.json"),
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
