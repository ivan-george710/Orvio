import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import Module from "node:module";
import ts from "typescript";

function loadEvents({ role = "admin", pages = [[]] } = {}) {
  const calls = [];
  const summaries = [];
  let offset = 0;
  const query = {};
  for (const method of ["select", "eq", "or", "order", "delete"]) {
    query[method] = (...args) => {
      calls.push([method, ...args]);
      return query;
    };
  }
  query.range = (start, end) => {
    offset = start;
    calls.push(["range", start, end]);
    return query;
  };
  query.returns = async () => ({ data: pages[offset / 500] ?? [], error: null });
  query.maybeSingle = async () => ({ data: { role }, error: null });
  query.then = (resolve, reject) =>
    Promise.resolve({ error: null }).then(resolve, reject);
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: "admin-id" } } }) },
    from: (table) => {
      calls.push(["from", table]);
      return query;
    },
  };
  const filename = new URL("../lib/services/server/events.ts", import.meta.url);
  const mod = new Module(filename.pathname);
  mod.require = (id) => {
    if (id === "@/lib/supabase/server") return { createClient: async () => client };
    if (id === "@/lib/supabase/errors")
      return { throwSupabaseError: (error) => { throw error; } };
    if (id === "@/lib/services/server/registrations") {
      return {
        getRegistrationSummaries: async (ids) => {
          summaries.push(ids);
          return Object.fromEntries(ids.map((id) => [id, {
            event_id: id, active_count: 2, remaining_spots: 3,
            can_manage: true, organizer_name: "Organizer",
          }]));
        },
      };
    }
    throw new Error(`Unexpected dependency: ${id}`);
  };
  mod._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, filename.pathname);
  return { service: mod.exports, calls, summaries };
}

test("event search preserves paginated development registration summaries", async () => {
  const first = Array.from({ length: 500 }, (_, i) => ({ id: `event-${i}` }));
  const { service, calls, summaries } = loadEvents({ pages: [first, [{ id: "last" }]] });
  const events = await service.getApprovedEvents({ search: "music" });
  assert.equal(events.length, 501);
  assert.deepEqual(calls.filter(([op]) => op === "range"), [
    ["range", 0, 499], ["range", 500, 999],
  ]);
  assert.ok(calls.some(([op, filter]) => op === "or" && filter ===
    "title.ilike.%music%,description.ilike.%music%,venue.ilike.%music%"));
  assert.equal(summaries[0].length, 501);
  assert.equal(events[500].registration.remaining_spots, 3);
  assert.equal(events[500].organizer_name, "Organizer");
});

test("admin filters retain counts and attendee permissions across event states", async () => {
  const { service, calls } = loadEvents({ pages: [[{ id: "cancelled", status: "cancelled" }]] });
  const events = await service.getAllEvents({ status: "cancelled", search: "conference" });
  assert.ok(calls.some(([op, field, value]) => op === "eq" && field === "status" && value === "cancelled"));
  assert.equal(events[0].registration.active_count, 2);
  assert.equal(events[0].registration.can_manage, true);
});

test("admin deletion uses the event cascade without forbidden registration writes", async () => {
  const { service, calls } = loadEvents();
  await service.adminDeleteEvent("event-id");
  assert.ok(calls.some(([op]) => op === "delete"));
  assert.ok(calls.some(([op, table]) => op === "from" && table === "events"));
  assert.ok(!calls.some(([op, table]) => op === "from" && table === "registrations"));
  const denied = loadEvents({ role: "participant" });
  await assert.rejects(denied.service.adminDeleteEvent("event-id"), /Not authorized/);
  assert.ok(!denied.calls.some(([op]) => op === "delete"));
});
