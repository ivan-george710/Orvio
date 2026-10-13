import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import Module from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filename = path.resolve(__dirname, "../lib/registrations.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const mod = new Module(filename);
mod._compile(compiled, filename);
const { registrationEligibility, registrationError, safeReturnPath } =
  mod.exports;

test("eligibility covers every event state, full, missing/invalid date and start boundary", () => {
  const now = Date.parse("2030-01-01T00:00:00Z"),
    future = "2030-01-02T00:00:00Z";
  assert.equal(registrationEligibility("approved", future, 1, now), "open");
  assert.equal(registrationEligibility("approved", future, 0, now), "full");
  for (const status of ["pending", "rejected", "cancelled", "completed"])
    assert.equal(registrationEligibility(status, future, 1, now), "closed");
  for (const start of [
    null,
    "invalid",
    "2030-01-01T00:00:00Z",
    "2029-01-01T00:00:00Z",
  ])
    assert.equal(registrationEligibility("approved", start, 1, now), "closed");
});
test("login return paths stay within this application", () => {
  assert.equal(
    safeReturnPath("/events/123?source=login"),
    "/events/123?source=login",
  );
  for (const path of [
    undefined,
    ["//evil.example"],
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/%2fevil.example",
    "/%5cevil.example",
    "/%0aevil",
    "javascript:alert(1)",
    "/%XX",
  ])
    assert.equal(safeReturnPath(path), "/dashboard");
});
test("database internals never appear in user-facing errors", () => {
  for (const error of [
    "relation public.registrations does not exist",
    "duplicate key value violates unique constraint",
    undefined,
    "stack trace: internal",
    "toString",
    "__proto__",
  ]) {
    const message = registrationError(error);
    assert.equal(typeof message, "string");
    assert.match(message, /Please try again/);
  }
  assert.match(registrationError("ALREADY_REGISTERED"), /already registered/);
  assert.match(registrationError("EVENT_FULL"), /full/);
  assert.match(registrationError("NO_ACTIVE_REGISTRATION"), /cancelled/);
});
